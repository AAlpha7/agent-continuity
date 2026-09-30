import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWrite, fault, readJson, receiptDirectory, withFileLock, utf8Bytes, parseJsonBytes } from '../lib/safe-files.mjs';
import { validReceiptId } from '../lib/ledger-write.mjs';

// Actor is a declared label, never a verified identity or an authorization.
export function agentReceiptText(record) {
  const { schema, kind, id, project, actor_declared, task_id, status, at, source_revision, summary, evidence } = record;
  if (schema !== 1 || kind !== 'agent-receipt' || !validReceiptId(id) ||
      !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(project) ||
      !['received', 'started', 'completed', 'blocked'].includes(status) ||
      typeof at !== 'string' || !Number.isFinite(Date.parse(at)) || new Date(at).toISOString() !== at ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(source_revision) ||
      !Array.isArray(evidence) || evidence.length > 10 ||
      evidence.some(x => typeof x !== 'string' || x.length > 512)) throw fault('INVALID', 'invalid agent receipt');
  for (const value of [actor_declared, task_id, summary]) {
    if (typeof value !== 'string' || !value.trim() || value.length > 512 || /[\r\n\0]/.test(value)) {
      throw fault('INVALID', 'invalid receipt text');
    }
  }
  return JSON.stringify({ schema, kind, id, project, actor_declared, task_id, status, at,
    source_revision, summary, evidence, authorization: 'ordinary-record-not-approval' }, null, 2) + '\n';
}

export async function writeAgentReceipt(root, record) {
  const text = agentReceiptText(record);
  const dir = await receiptDirectory(root, record.project);
  const path = join(dir, `${record.id}.json`);
  return withFileLock(path, async () => {
    const existing = await readJson(path, null);
    if (existing !== null) {
      if (!(await readFile(path)).equals(utf8Bytes(text))) throw fault('CONFLICT', 'receipt ID content conflict');
    } else await atomicWrite(path, text, true);
    return { path, duplicate: existing !== null, local: 'recorded', remote: 'not-attempted', snapshot: 'not-refreshed' };
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [root, input] = process.argv.slice(2);
    if (!root || !input) throw new Error('Usage: node scripts/agent-receipt.mjs ROOT RECEIPT.json');
    console.log(JSON.stringify(await writeAgentReceipt(root, parseJsonBytes(await readFile(input)))));
  } catch (error) { console.error(error.code || error.message); process.exitCode = 1; }
}
