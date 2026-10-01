// Private R2 local candidate. No network transport or identity provider.
import { createHash } from 'node:crypto';
import { decodeUtf8, fault } from '../lib/safe-files.mjs';

export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const need = (ok, code, message) => { if (!ok) throw fault(code, message); };
export function id(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,95}$/.test(value) && !['constructor','prototype','__proto__'].includes(value);
}
export function iso(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
export function keys(value, expected) {
  need(value && Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).length === expected.length && expected.every(k=>Object.hasOwn(value,k)), 'SCHEMA', 'Unexpected or missing fields');
}
function stable(value, depth = 0) {
  need(depth < 32, 'LIMIT', 'Nesting limit');
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    need(value.isWellFormed() && value.length <= 262144, 'SCHEMA', 'Invalid or oversized text'); return value;
  }
  if (typeof value === 'number') { need(Number.isSafeInteger(value), 'SCHEMA', 'Expected safe integer'); return value; }
  if (Array.isArray(value)) { need(value.length <= 10000, 'LIMIT', 'Array limit'); return value.map(v => stable(v, depth + 1)); }
  need(value && Object.getPrototypeOf(value) === Object.prototype, 'SCHEMA', 'Expected plain object');
  const result = {};
  for (const key of Object.keys(value).sort()) {
    need(!['__proto__','constructor','prototype'].includes(key), 'SCHEMA', 'Reserved key');
    result[key] = stable(value[key], depth + 1);
  }
  return result;
}
export const encode = value => Buffer.from(JSON.stringify(stable(value)) + '\n', 'utf8');
export function decode(bytes, limit = 16 * 1024 * 1024) {
  need(Buffer.isBuffer(bytes) && bytes.length <= limit, 'LIMIT', 'Input byte limit');
  let value;
  try { value = JSON.parse(decodeUtf8(bytes)); } catch (error) { throw fault('CORRUPT', error.message); }
  // Duplicate keys, BOM, alternate whitespace and lossy/ambiguous encodings cannot
  // pass exact canonical comparison. Never normalize an imported record to fit.
  need(encode(value).equals(bytes), 'CORRUPT', 'Noncanonical bytes or duplicate JSON keys');
  return value;
}
export function text(value, limit = 4096) {
  return typeof value === 'string' && value.isWellFormed() && value.length <= limit && !/[\0\r\n]/.test(value);
}
export function timing(value) {
  keys(value, ['desired_at','deadline_at','timing_boundary','early_policy','early_tolerance_ms','late_tolerance_ms','late_policy']);
  need(iso(value.deadline_at) && (value.desired_at === null || iso(value.desired_at)), 'SCHEMA', 'Timing dates required');
  need(['send-attempt','server-creation','received','completed'].includes(value.timing_boundary), 'SCHEMA', 'Unknown timing boundary');
  need(['not-before','approved-window'].includes(value.early_policy) && ['stop-and-report','best-effort'].includes(value.late_policy), 'SCHEMA', 'Unknown timing policy');
  for (const name of ['early_tolerance_ms','late_tolerance_ms']) need(Number.isSafeInteger(value[name]) && value[name] >= 0 && value[name] <= 86400000, 'SCHEMA', 'Invalid tolerance');
  need(value.early_policy !== 'not-before' || value.early_tolerance_ms === 0, 'SCHEMA', 'not-before forbids early tolerance');
  if (value.desired_at !== null) need(Date.parse(value.desired_at) - value.early_tolerance_ms <= Date.parse(value.deadline_at), 'SCHEMA', 'Empty timing window');
}
export function checkTime(window, boundary, now, uncertainty = 0) {
  timing(window); need(Number.isSafeInteger(now) && Number.isSafeInteger(uncertainty) && uncertainty >= 0, 'CLOCK_UNKNOWN', 'Clock must be bounded');
  need(now + uncertainty <= Date.parse(window.deadline_at), 'EXPIRED', 'Hard deadline reached or uncertain');
  if (window.desired_at === null || boundary !== window.timing_boundary) return;
  const desired = Date.parse(window.desired_at);
  need(now - uncertainty >= desired - window.early_tolerance_ms, 'TOO_EARLY', 'Earliest boundary not established');
  if (window.late_policy === 'stop-and-report') need(now + uncertainty <= Math.min(desired + window.late_tolerance_ms, Date.parse(window.deadline_at)), 'EXPIRED', 'Target window missed');
}
const common = ['protocol_revision','kind','record_id','ledger_scope','project','conversation_id','sender_declared','source_revision','policy_ref'];
const actionFields = ['action_id','recipient','content_version','previous_digest','content_sha256','payload','in_reply_to','turn_index','max_turns','budget_authority_ref','admission_ref','reply_policy','terminal','timing'];
const observationFields = ['action_id','content_version','action_sha256','recipient','state','at','evidence_refs','verification','reply_policy','terminal'];
const closureFields = ['recipients','result_refs','at','reply_policy','terminal'];
const digestShape = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const ids = (values, max = 32) => Array.isArray(values) && values.length > 0 && values.length <= max && values.every(id) && new Set(values).size === values.length;
export function validateRecord(record) {
  need(record?.protocol_revision === 2, 'UNSUPPORTED', 'Unsupported protocol revision');
  need(['action','observation','closure'].includes(record.kind), 'UNSUPPORTED', 'Unsupported record kind');
  keys(record, [...common, ...(record.kind === 'action' ? actionFields : record.kind === 'observation' ? observationFields : closureFields)]);
  for (const k of common.filter(k => !['protocol_revision','kind','source_revision'].includes(k))) need(id(record[k]), 'SCHEMA', `Invalid ${k}`);
  need(/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(record.source_revision), 'SCHEMA', 'Source revision required');
  if (record.kind === 'action') {
    for (const k of ['action_id','recipient','budget_authority_ref','admission_ref']) need(id(record[k]), 'SCHEMA', `Invalid ${k}`);
    for (const k of ['content_version','turn_index','max_turns']) need(Number.isSafeInteger(record[k]) && record[k] >= 1 && record[k] <= 1000, 'SCHEMA', `Invalid ${k}`);
    need(record.previous_digest === null || digestShape(record.previous_digest), 'SCHEMA', 'Invalid previous digest');
    need(record.in_reply_to === null || id(record.in_reply_to), 'SCHEMA', 'Invalid parent');
    need(['none','next-action'].includes(record.reply_policy) && record.terminal === false, 'SCHEMA', 'Actions cannot be terminal');
    keys(record.payload, ['summary','evidence_refs']);
    need(text(record.payload.summary) && record.payload.summary.trim(), 'SCHEMA', 'Summary required');
    need(Array.isArray(record.payload.evidence_refs) && record.payload.evidence_refs.length <= 10 && record.payload.evidence_refs.every(v => text(v,512)), 'SCHEMA', 'Evidence references invalid');
    timing(record.timing);
    const { content_sha256, ...content } = record;
    need(content_sha256 === hash(encode(content)), 'CONFLICT', 'Action digest mismatch');
  } else if (record.kind === 'observation') {
    need(id(record.action_id) && id(record.recipient) && Number.isSafeInteger(record.content_version) && record.content_version >= 1 && digestShape(record.action_sha256), 'SCHEMA', 'Invalid action reference');
    need(['published','received','started','completed','independently_verified','blocked','expired','cancelled'].includes(record.state) && iso(record.at), 'SCHEMA', 'Invalid state/time');
    need(record.reply_policy === 'none' && record.terminal === false, 'SCHEMA', 'Observations cannot request replies or close');
    need(Array.isArray(record.evidence_refs) && record.evidence_refs.length <= 10 && record.evidence_refs.every(v=>text(v,512)), 'SCHEMA', 'Evidence invalid');
    keys(record.verification,['result','independent']);
    need(['not-applicable','pass','fail'].includes(record.verification.result) && typeof record.verification.independent === 'boolean', 'SCHEMA', 'Verification fields invalid');
    need(record.state === 'independently_verified' ? record.verification.result !== 'not-applicable' : record.verification.result === 'not-applicable' && !record.verification.independent, 'SCHEMA', 'Verification not applicable');
  } else {
    need(ids(record.recipients) && Array.isArray(record.result_refs) && record.result_refs.length <= 100 && record.result_refs.every(id) && iso(record.at), 'SCHEMA', 'Invalid closure');
    need(record.reply_policy === 'none' && record.terminal === true, 'SCHEMA', 'Closure must be terminal/no-reply');
  }
  need(encode(record).length <= 65536, 'LIMIT', 'Record too large'); return record;
}
export function action(content) {
  const record = { ...content, content_sha256: hash(encode(content)) }; return validateRecord(record);
}
export function readRecord(bytes) { return validateRecord(decode(bytes,65536)); }
