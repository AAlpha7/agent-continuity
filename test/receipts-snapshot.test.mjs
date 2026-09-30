import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { writeAgentReceipt } from '../scripts/agent-receipt.mjs';
import { buildSnapshot, snapshotText } from '../scripts/build-continuity-snapshot.mjs';
import { digest } from '../lib/ledger-write.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'continuity-snapshot-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const dir = join(root, 'projects/demo'); await mkdir(join(dir, 'history'), { recursive: true });
  const history = '# Preserved history\n';
  await writeFile(join(dir, 'history/original.md'), history);
  await writeFile(join(dir, 'CURRENT_STATE.md'), '# Initial state\n');
  await writeFile(join(dir, 'snapshot-input.json'), JSON.stringify({ schema: 1, history: 'history/original.md', history_sha256: digest(history), facts: ['Coordinator organizes records; no automatic authorization.'] }));
  return { root, dir };
}
const record = n => ({ schema: 1, kind: 'agent-receipt', id: `independent-receipt-${String(n).padStart(4, '0')}`,
  project: 'demo', actor_declared: n % 2 ? 'Agent-B' : 'Agent-A', task_id: 'test-task', status: 'received',
  at: '2026-09-30T00:00:00.000Z', source_revision: 'a'.repeat(40), summary: 'Independent receipt', evidence: [] });

test('independent receipts are immutable/idempotent; role claims never grant authority', async t => {
  const { root, dir } = await fixture(t);
  await Promise.all(Array.from({ length: 22 }, (_, n) => writeAgentReceipt(root, record(n))));
  const replay = await writeAgentReceipt(root, record(0)); assert.equal(replay.duplicate, true);
  await assert.rejects(writeAgentReceipt(root, { ...record(0), actor_declared: 'Admin' }), { code: 'CONFLICT' });
  const stored = JSON.parse(await readFile(join(dir, 'receipts', `${record(0).id}.json`)));
  assert.equal(stored.authorization, 'ordinary-record-not-approval');
  assert.equal((await readdir(join(dir, 'receipts'))).length, 22);
});

test('snapshot is deterministic and bounded; late receipts and history tampering are visible', async t => {
  const { root, dir } = await fixture(t);
  await Promise.all(Array.from({ length: 25 }, (_, n) => writeAgentReceipt(root, record(n))));
  const built = await buildSnapshot(root, 'demo');
  const first = await readFile(join(root, built.path), 'utf8');
  assert.equal(first, await snapshotText(root, 'demo'));
  assert.equal(first.split('\n').filter(line => line.startsWith('| [')).length, 20);
  assert.ok(first.split('\n').length < 50);
  assert.match(first, /Total: 25/);
  await buildSnapshot(root, 'demo', true);
  await writeAgentReceipt(root, record(26));
  await assert.rejects(buildSnapshot(root, 'demo', true), { code: 'STALE' });
  assert.equal(await readFile(join(root, built.path), 'utf8'), first);
  assert.equal(await readFile(join(dir, 'CURRENT_STATE.md'), 'utf8'), '# Initial state\n');
  await buildSnapshot(root, 'demo');
  await writeFile(join(dir, 'history/original.md'), 'altered');
  await assert.rejects(snapshotText(root, 'demo'), /history digest mismatch/);
});

test('malformed/misrouted/noncanonical receipts fail snapshot generation', async t => {
  const { root, dir } = await fixture(t);
  const entry = record(0); await writeAgentReceipt(root, entry);
  const path = join(dir, 'receipts', `${entry.id}.json`);
  await writeFile(path, '{broken');
  await assert.rejects(buildSnapshot(root, 'demo'), { code: 'CORRUPT' });
  assert.equal(await readFile(join(dir, 'CURRENT_STATE.md'), 'utf8'), '# Initial state\n');
});

test('P1 legacy append survives check and generation with a byte-exact preserved input', async t => {
  const { root, dir } = await fixture(t);
  const first = await buildSnapshot(root, 'demo');
  const original = await readFile(join(dir, 'CURRENT_STATE.md'));
  const added = Buffer.concat([original, Buffer.from('\n## New handoff\nOwner: remote AI\nDo not lose this.\r\n')]);
  await writeFile(join(dir, 'CURRENT_STATE.md'), added);
  await assert.rejects(buildSnapshot(root, 'demo', true), { code: 'STALE' });
  const second = await buildSnapshot(root, 'demo');
  assert.notEqual(second.path, first.path);
  assert.deepEqual(await readFile(join(dir, 'CURRENT_STATE.md')), added);
  assert.deepEqual(await readFile(join(dir, 'history', `handoff-${digest(added)}.md`)), added);
  assert.deepEqual(await readFile(join(dir, 'history', `handoff-${digest(original)}.md`)), original);
  await buildSnapshot(root, 'demo', true);
  // Never erase edits even when somebody writes into a generated output.
  const edited = (await readFile(join(root, second.path), 'utf8')) + '\nForeign note\n';
  await writeFile(join(root, second.path), edited);
  await assert.rejects(buildSnapshot(root, 'demo'), { code: 'CONFLICT' });
  assert.equal(await readFile(join(root, second.path), 'utf8'), edited);
  assert.deepEqual(await readFile(join(dir, 'CURRENT_STATE.md')), added);
});


test('P1 real legacy writer races snapshot generation without losing any append', async t => {
  const { root, dir } = await fixture(t);
  const path = join(dir, 'CURRENT_STATE.md');
  const original = await readFile(path, 'utf8');
  const updates = Array.from({ length: 30 }, (_, i) => `\n## Remote handoff ${i}\nKeep every byte ${i}.\n`);
  const code = `import { appendFile } from 'node:fs/promises'; import { setTimeout as delay } from 'node:timers/promises'; process.stdin.once('data', async () => { for (const update of ${JSON.stringify(updates)}) { await appendFile(${JSON.stringify(path)}, update); await delay(2); } process.exit(0); }); console.log('ready');`;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const exited = new Promise((resolveExit, reject) => { child.once('error', reject); child.once('exit', code => code === 0 ? resolveExit() : reject(new Error(`writer exit ${code}`))); });
  t.after(() => { if (child.exitCode === null) child.kill(); });
  await new Promise((ready, reject) => {
    const timer = setTimeout(() => reject(new Error('writer startup timeout')), 5000);
    child.stdout.once('data', () => { clearTimeout(timer); ready(); });
  });
  child.stdin.end('start');
  for (let i = 0; i < 8; i++) {
    try { await buildSnapshot(root, 'demo'); }
    catch (error) { assert.equal(error.code, 'STALE'); }
  }
  await exited;
  const expected = original + updates.join('');
  assert.equal(await readFile(path, 'utf8'), expected);
  await buildSnapshot(root, 'demo'); await buildSnapshot(root, 'demo', true);
  assert.equal(await readFile(join(dir, 'history', `handoff-${digest(expected)}.md`), 'utf8'), expected);
});
