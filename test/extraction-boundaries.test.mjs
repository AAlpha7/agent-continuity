import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { atomicWrite, decodeUtf8, utf8Bytes, withFileLock } from '../lib/safe-files.mjs';
import { digest, writeChoiceReceipt, verifyChoiceReceipt } from '../lib/ledger-write.mjs';
import { writeAgentReceipt } from '../scripts/agent-receipt.mjs';
import { buildSnapshot } from '../scripts/build-continuity-snapshot.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'generic-continuity-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dir = join(root, 'projects', 'demo'); await mkdir(join(dir, 'history'), { recursive: true });
  const bytes = Buffer.from('\uFEFF# Demo\r\nLiteral replacement: \uFFFD; emoji: 😀\r\n');
  await writeFile(join(dir, 'CURRENT_STATE.md'), bytes);
  await writeFile(join(dir, 'history/original.md'), bytes);
  await writeFile(join(dir, 'snapshot-input.json'), JSON.stringify({ schema: 1, history: 'history/original.md', history_sha256: digest(bytes), facts: ['Synthetic \uFFFD fact'] }));
  return { root, dir, bytes };
}
const record = n => ({ schema: 1, kind: 'agent-receipt', id: `synthetic-receipt-${String(n).padStart(4, '0')}`, project: 'demo', actor_declared: 'agent-a', task_id: 'synthetic-task', status: 'received', at: '2000-01-01T00:00:00.000Z', source_revision: '1'.repeat(40), summary: 'Synthetic \uFFFD report', evidence: [] });
function damaged(bytes) {
  const index = bytes.indexOf(Buffer.from('\uFFFD')); assert.ok(index >= 0);
  return Buffer.concat([bytes.subarray(0, index), Buffer.from([0xff]), bytes.subarray(index + 3)]);
}
function child(code) {
  const processChild = spawn(process.execPath, ['--input-type=module', '-e', code], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = ''; processChild.stderr.on('data', d => stderr += d);
  const exit = new Promise((resolve, reject) => {
    processChild.once('error', reject); processChild.once('exit', (code, signal) => resolve({ code, signal, stderr }));
  });
  return { processChild, exit };
}

test('strict UTF-8 rejects malformed boundaries; legal BOM/CRLF and normalization stay distinct', () => {
  for (const sequence of [[0xff], [0xe2, 0x82], [0xf0, 0x9f, 0x98], [0xc0, 0xaf], [0xed, 0xa0, 0x80], [0x80]]) {
    assert.throws(() => decodeUtf8(Buffer.from(sequence)), { code: 'CORRUPT' });
  }
  const good = Buffer.from('\uFEFF\uFFFD\r\n😀'); assert.deepEqual(utf8Bytes(good), good);
  assert.equal(decodeUtf8(good), '\uFEFF\uFFFD\r\n😀');
  assert.notEqual(digest(Buffer.from('é')), digest(Buffer.from('e\u0301')));
  assert.throws(() => utf8Bytes('\ud800'), { code: 'INVALID' });
});

test('snapshot archives preserve all original bytes and reject replacement-byte alias', async t => {
  const { root, dir, bytes } = await fixture(t); await buildSnapshot(root, 'demo');
  const path = join(dir, 'history', `handoff-${digest(bytes)}.md`);
  assert.deepEqual(await readFile(path), bytes);
  const bad = damaged(bytes); await writeFile(path, bad);
  await assert.rejects(buildSnapshot(root, 'demo', true), { code: 'CORRUPT' });
  await assert.rejects(buildSnapshot(root, 'demo'), { code: 'CORRUPT' });
  assert.deepEqual(await readFile(path), bad); assert.deepEqual(await readFile(join(dir, 'CURRENT_STATE.md')), bytes);
});

test('agent receipt byte corruption cannot replay or enter a snapshot', async t => {
  const { root } = await fixture(t); const r = record(1); const result = await writeAgentReceipt(root, r);
  const bad = damaged(await readFile(result.path)); await writeFile(result.path, bad);
  await assert.rejects(writeAgentReceipt(root, r), { code: 'CORRUPT' });
  await assert.rejects(buildSnapshot(root, 'demo'), { code: 'CORRUPT' });
  assert.deepEqual(await readFile(result.path), bad);
});

test('choice digest claims require the actual canonical bytes, never self-reported success', async t => {
  const { root, bytes } = await fixture(t);
  const payload = { project: 'demo', alert_id: 'synthetic-alert', title: 'Synthetic', choice: '\uFFFD' };
  const entry = { ...payload, schema: 1, id: 'synthetic-choice-0001', at: '2000-01-01T00:00:00.000Z', source_state_sha256: digest(bytes), request_sha256: digest(JSON.stringify(payload)) };
  entry.ledger = await writeChoiceReceipt({ root, entry }); assert.equal(entry.ledger.ok, true);
  assert.equal(await verifyChoiceReceipt(root, entry), true);
  const path = join(root, entry.ledger.path); const bad = damaged(await readFile(path)); await writeFile(path, bad);
  assert.equal(await verifyChoiceReceipt(root, entry), false);
  assert.equal((await writeChoiceReceipt({ root, entry })).ok, false);
  assert.deepEqual(await readFile(path), bad);
});

test('eight independent processes replay a single canonical receipt without duplicates', async t => {
  const { root, dir } = await fixture(t); const moduleUrl = new URL('../scripts/agent-receipt.mjs', import.meta.url).href;
  const jobs = Array.from({ length: 8 }, () => child(`import { writeAgentReceipt } from ${JSON.stringify(moduleUrl)}; await writeAgentReceipt(${JSON.stringify(root)}, ${JSON.stringify(record(1))});`));
  t.after(() => { for (const job of jobs) if (job.processChild.exitCode === null) job.processChild.kill(); });
  for (const result of await Promise.all(jobs.map(job => job.exit))) assert.equal(result.code, 0, result.stderr);
  assert.deepEqual(await readdir(join(dir, 'receipts')), ['synthetic-receipt-0001.json']);
});

test('killed lock holder leaves original bytes and denies automatic takeover', async t => {
  const { dir } = await fixture(t); const path = join(dir, 'state.txt'); await writeFile(path, 'original');
  const moduleUrl = new URL('../lib/safe-files.mjs', import.meta.url).href;
  const job = child(`import { withFileLock } from ${JSON.stringify(moduleUrl)}; await withFileLock(${JSON.stringify(path)}, async () => { console.log('locked'); setInterval(() => {}, 1000); await new Promise(() => {}); });`);
  t.after(() => { if (job.processChild.exitCode === null) job.processChild.kill(); });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('lock startup timeout')), 5000);
    job.processChild.stdout.once('data', () => { clearTimeout(timer); resolve(); });
    job.processChild.once('error', reject);
  });
  job.processChild.kill(); await job.exit;
  await assert.rejects(withFileLock(path, () => atomicWrite(path, 'changed'), 60), { code: 'BUSY' });
  assert.equal(await readFile(path, 'utf8'), 'original');
  assert.ok((await readdir(dir)).includes('state.txt.lock'));
});

test('malformed source is rejected before publication and keeps the input', async t => {
  const { root, dir, bytes } = await fixture(t); const bad = damaged(bytes);
  await writeFile(join(dir, 'CURRENT_STATE.md'), bad);
  await assert.rejects(buildSnapshot(root, 'demo'), { code: 'CORRUPT' });
  assert.deepEqual(await readFile(join(dir, 'CURRENT_STATE.md')), bad);
  assert.ok(!(await readdir(dir)).includes('snapshots'));
});
