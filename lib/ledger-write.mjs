import { readFile, lstat } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { atomicWrite, fault, receiptDirectory, withFileLock, readJson, projectDirectory, regularFile, decodeUtf8, utf8Bytes } from './safe-files.mjs';

export const validReceiptId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{16,80}$/.test(value);
export const digest = value => createHash('sha256').update(value).digest('hex');

export function receiptText(record) {
  if (!validReceiptId(record.id) || record.schema !== 1 || record.kind !== 'choice-record' ||
      typeof record.project !== 'string' || typeof record.at !== 'string' ||
      !Number.isFinite(Date.parse(record.at)) || new Date(record.at).toISOString() !== record.at || record.source !== 'boards-api/local-admin' ||
      record.authorization !== 'ordinary-record-not-approval' ||
      !/^[a-f0-9]{64}$/.test(record.request_sha256) ||
      !/^[a-f0-9]{64}$/.test(record.source_state_sha256)) throw fault('CORRUPT', 'invalid receipt schema');
  for (const field of ['alert_id', 'title', 'choice']) {
    if (typeof record[field] !== 'string' || record[field].length > 4096) throw fault('CORRUPT', 'invalid receipt content');
  }
  const { id, project, at, alert_id, title, choice, request_sha256, source_state_sha256 } = record;
  if (request_sha256 !== digest(JSON.stringify({ project, alert_id, title, choice }))) throw fault('CORRUPT', 'receipt request digest mismatch');
  return JSON.stringify({ schema: 1, kind: 'choice-record', id, project, at,
    source: 'boards-api/local-admin', authorization: 'ordinary-record-not-approval',
    request_sha256, source_state_sha256, alert_id, title, choice }, null, 2) + '\n';
}

// Independent immutable receipt; deliberately does not append to CURRENT_STATE.
// Shared Markdown cannot be safely replaced while uncooperative tools edit it.
export async function writeChoiceReceipt({ root, entry }) {
  try {
    if (!validReceiptId(entry.id)) throw fault('INVALID', 'invalid receipt ID');
    const dir = await receiptDirectory(root, entry.project);
    const path = join(dir, `${entry.id}.json`);
    const text = receiptText({ ...entry, schema: 1, kind: 'choice-record',
      source: 'boards-api/local-admin', authorization: 'ordinary-record-not-approval' });
    return await withFileLock(path, async () => {
      const existing = await readJson(path, null);
      if (existing !== null) {
        if (!(await readFile(path)).equals(utf8Bytes(text))) throw fault('CONFLICT', 'receipt ID already has different content');
      } else await atomicWrite(path, text, true);
      return { ok: true, state: 'recorded', path: `projects/${entry.project}/receipts/${entry.id}.json`,
        sha256: digest(utf8Bytes(text)), duplicate: existing !== null };
    });
  } catch (error) {
    return { ok: false, state: 'failed', code: error.code || 'IO_ERROR', error: 'receipt write not confirmed; retry the same request ID after inspection' };
  }
}


const isoTime = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const hashValue = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const fieldsValid = entry => typeof entry.project === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(entry.project) &&
  ['alert_id', 'title', 'choice'].every(key => typeof entry[key] === 'string' && entry[key].length <= 4096) && entry.choice.trim() && isoTime(entry.at);

export function choiceReceiptText(entry) {
  return receiptText({ ...entry, schema: 1, kind: 'choice-record',
    source: 'boards-api/local-admin', authorization: 'ordinary-record-not-approval' });
}

// Old records are retained for reconciliation, never promoted to delivery proof.
// Presence of ANY new-format marker forbids falling back to the legacy schema.
export function validateStoredChoice(entry) {
  const corrupt = () => { throw fault('CORRUPT', 'invalid choice record; original preserved'); };
  if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !fieldsValid(entry)) corrupt();
  const modern = ['schema', 'request_sha256', 'source_state_sha256', 'ledger'].some(key => Object.hasOwn(entry, key));
  const common = ['id', 'at', 'project', 'alert_id', 'title', 'choice'];
  if (!modern) {
    if (typeof entry.id !== 'string' || !/^[a-f0-9]{16}$/.test(entry.id) ||
        Object.keys(entry).some(key => ![...common, 'error', 'attempts'].includes(key))) corrupt();
    if (entry.choice === '_ledger_write_failed') {
      if (typeof entry.error !== 'string' || !Number.isInteger(entry.attempts) || entry.attempts < 1) corrupt();
    } else if (Object.hasOwn(entry, 'error') || Object.hasOwn(entry, 'attempts')) corrupt();
    return 'legacy';
  }
  if (entry.schema !== 1 || !validReceiptId(entry.id) || !hashValue(entry.request_sha256) || !hashValue(entry.source_state_sha256) ||
      Object.keys(entry).some(key => ![...common, 'schema', 'request_sha256', 'source_state_sha256', 'ledger'].includes(key))) corrupt();
  const text = choiceReceiptText(entry); // checks payload digest, not just shape
  const ledger = entry.ledger;
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) corrupt();
  let allowed;
  if (ledger.state === 'pending') {
    allowed = ['state'];
  } else if (ledger.state === 'recorded') {
    allowed = ['state', 'ok', 'path', 'sha256', 'duplicate'];
    if (ledger.ok !== true || ledger.path !== `projects/${entry.project}/receipts/${entry.id}.json` ||
        ledger.sha256 !== digest(utf8Bytes(text)) || typeof ledger.duplicate !== 'boolean') corrupt();
  } else if (ledger.state === 'failed') {
    allowed = ['state', 'ok', 'code', 'error'];
    if (ledger.ok !== false || typeof ledger.code !== 'string' || !ledger.code || typeof ledger.error !== 'string' || !ledger.error) corrupt();
  } else corrupt();
  if (Object.keys(ledger).some(key => !allowed.includes(key))) corrupt();
  return 'v1';
}

export async function verifyChoiceReceipt(root, entry) {
  try {
    if (validateStoredChoice(entry) !== 'v1' || entry.ledger.state !== 'recorded') return false;
    const dir = await projectDirectory(root, entry.project);
    const receipts = join(dir, 'receipts');
    const stat = await lstat(receipts);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
    const path = join(receipts, `${entry.id}.json`);
    await regularFile(path);
    const bytes = await readFile(path);
    decodeUtf8(bytes);
    return digest(bytes) === entry.ledger.sha256 && bytes.equals(utf8Bytes(choiceReceiptText(entry)));
  } catch { return false; }
}
