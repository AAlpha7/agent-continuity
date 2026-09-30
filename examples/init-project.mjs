// Operator-run example. Creates a NEW local workspace, never enrolls a member.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { decodeUtf8 } from '../lib/safe-files.mjs';
import { digest } from '../lib/ledger-write.mjs';

try {
  const [rootArg, project, handoffArg, sourceRevision, extra] = process.argv.slice(2);
  if (!rootArg || !handoffArg || extra || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(project || '') ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(sourceRevision || '')) {
    throw new Error('Usage: node examples/init-project.mjs NEW_ROOT PROJECT HANDOFF.md SOURCE_REVISION');
  }
  const bytes = await readFile(resolve(handoffArg)); decodeUtf8(bytes);
  const root = resolve(rootArg);
  // No recursive mkdir here: existing roots are rejected without replacement.
  await mkdir(root, { mode: 0o700 });
  const dir = join(root, 'projects', project);
  await mkdir(join(dir, 'history'), { recursive: true, mode: 0o700 });
  const write = (path, value) => writeFile(path, value, { flag: 'wx', mode: 0o600 });
  await write(join(root, '.gitattributes'), await readFile(new URL('../.gitattributes', import.meta.url)));
  await write(join(dir, 'CURRENT_STATE.md'), bytes);
  await write(join(dir, 'history', 'original.md'), bytes);
  await write(join(dir, 'snapshot-input.json'), JSON.stringify({ schema: 1, history: 'history/original.md', history_sha256: digest(bytes), source_revision: sourceRevision, facts: [] }, null, 2) + '\n');
  await write(join(root, 'receipt-input.json'), JSON.stringify({ schema: 1, kind: 'agent-receipt', id: randomUUID(), project,
    actor_declared: 'local-operator', task_id: 'initial-handoff', status: 'received', at: new Date().toISOString(),
    source_revision: sourceRevision, summary: 'Initial handoff recorded; no authorization granted.', evidence: [] }, null, 2) + '\n');
  console.log(JSON.stringify({ local: 'initialized', root, project, history_sha256: digest(bytes), identity: 'not-verified', authorization: 'none', remote: 'not-attempted' }));
} catch (error) {
  console.error(error.code || error.message); process.exitCode = 1;
}
