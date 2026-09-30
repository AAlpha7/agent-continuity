import assert from 'node:assert/strict';
import test from 'node:test';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { digest } from '../lib/ledger-write.mjs';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
async function temp(t) {
  const root = await mkdtemp(join(tmpdir(), 'continuity-git-portability-'));
  t.after(() => rm(root, { recursive: true, force: true })); return root;
}
const run = (program, args, cwd, env = process.env) => execFileSync(program, args, { cwd, env, windowsHide: true, encoding: 'utf8' });
async function payload(root, relative = '') {
  const rows = [];
  for (const name of (await readdir(join(root, relative))).sort()) {
    if (name === '.git') continue;
    const path = join(relative, name);
    const { lstat } = await import('node:fs/promises');
    const stat = await lstat(join(root, path));
    if (stat.isDirectory()) rows.push(...await payload(root, path));
    else rows.push([path, digest(await readFile(join(root, path)))]);
  }
  return rows;
}

test('real Git init and fresh autocrlf=true clone preserve every payload byte and documented replay/check', async t => {
  const root = await temp(t); const seed = join(root, 'seed'); const clone = join(root, 'clone');
  const globalConfig = join(root, 'empty-config'); await writeFile(globalConfig, '');
  const emptyHooks = join(root, 'empty-hooks'); await mkdir(emptyHooks);
  const env = { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: globalConfig };
  const git = (...args) => run('git', ['-c', `core.hooksPath=${emptyHooks}`, '-c', `core.excludesFile=${globalConfig}`, '-c', 'init.defaultBranch=main', '-c', 'core.autocrlf=true', ...args], root, env);
  await cp(packageRoot, seed, { recursive: true, filter: path => basename(path) !== '.git' });
  const before = await payload(seed);
  git('init', '--template=', seed);
  git('-C', seed, 'add', '.');
  git('-C', seed, '-c', 'user.name=Synthetic Fixture', '-c', 'user.email=fixture@invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Synthetic candidate fixture');
  git('clone', '--no-local', '--config', 'core.autocrlf=true', seed, clone);
  assert.equal(git('-C', clone, 'config', 'core.autocrlf').trim(), 'true');
  assert.deepEqual(await payload(clone), before, 'Fresh clone must preserve every file hash');
  const replay = JSON.parse(run(process.execPath, ['scripts/agent-receipt.mjs', 'fixtures/workspace', 'fixtures/receipt.json'], clone));
  assert.equal(replay.duplicate, true);
  run(process.execPath, ['scripts/build-continuity-snapshot.mjs', 'fixtures/workspace', 'demo-project', '--check'], clone);
  run(process.execPath, ['scripts/build-continuity-snapshot.mjs', 'fixtures/workspace', 'demo-project'], clone);
  // A fresh independent test runner must not inherit the parent runner marker:
  // Node otherwise skips nested suites while exiting successfully.
  const childEnv = { ...process.env }; delete childEnv.NODE_TEST_CONTEXT;
  const suite = run(process.execPath, ['--test', '--test-reporter=tap', 'test/extraction-boundaries.test.mjs', 'test/receipts-snapshot.test.mjs'], clone, childEnv);
  assert.match(suite, /# tests 12\b/); assert.match(suite, /# pass 12\b/);
  assert.match(suite, /# fail 0\b/); assert.match(suite, /# skipped 0\b/);
  assert.deepEqual(await payload(clone), before, 'Replay, generation and --check must not rewrite evidence');
  assert.equal(git('-C', clone, 'status', '--porcelain').trim(), '');
});

test('documented initializer preserves BOM/CRLF bytes, supports receipts/snapshots, and rejects existing roots', async t => {
  const root = await temp(t); const workspace = join(root, 'workspace'); const input = join(root, 'handoff.md');
  const bytes = Buffer.from('\uFEFF# New synthetic project\r\nLiteral: \uFFFD; 😀\r\n');
  await writeFile(input, bytes);
  const args = ['examples/init-project.mjs', workspace, 'new-project', input, '2'.repeat(40)];
  const initialized = JSON.parse(run(process.execPath, args, packageRoot));
  assert.equal(initialized.history_sha256, digest(bytes));
  const project = join(workspace, 'projects', 'new-project');
  assert.deepEqual(await readFile(join(project, 'CURRENT_STATE.md')), bytes);
  assert.deepEqual(await readFile(join(project, 'history/original.md')), bytes);
  assert.deepEqual(await readFile(join(workspace, '.gitattributes')), await readFile(join(packageRoot, '.gitattributes')));
  const inputRecord = JSON.parse(await readFile(join(project, 'snapshot-input.json')));
  assert.equal(inputRecord.history_sha256, digest(bytes)); assert.deepEqual(inputRecord.facts, []);
  run(process.execPath, ['scripts/agent-receipt.mjs', workspace, join(workspace, 'receipt-input.json')], packageRoot);
  const stale = spawnSync(process.execPath, ['scripts/build-continuity-snapshot.mjs', workspace, 'new-project', '--check'], { cwd: packageRoot, windowsHide: true, encoding: 'utf8' });
  assert.notEqual(stale.status, 0); assert.match(stale.stderr, /STALE/);
  run(process.execPath, ['scripts/build-continuity-snapshot.mjs', workspace, 'new-project'], packageRoot);
  run(process.execPath, ['scripts/build-continuity-snapshot.mjs', workspace, 'new-project', '--check'], packageRoot);
  const beforeRetry = await payload(workspace);
  const retry = spawnSync(process.execPath, args, { cwd: packageRoot, windowsHide: true, encoding: 'utf8' });
  assert.notEqual(retry.status, 0); assert.match(retry.stderr, /EEXIST/);
  assert.deepEqual(await payload(workspace), beforeRetry);
});

test('initializer rejects invalid UTF-8 before creating any workspace', async t => {
  const root = await temp(t); const input = join(root, 'invalid.md'); const workspace = join(root, 'workspace');
  await writeFile(input, Buffer.from([0xff]));
  const result = spawnSync(process.execPath, ['examples/init-project.mjs', workspace, 'demo', input, '3'.repeat(40)], { cwd: packageRoot, windowsHide: true, encoding: 'utf8' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /CORRUPT/);
  assert.ok(!(await readdir(root)).includes('workspace'));
});
