import { mkdir, lstat, realpath, readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { atomicWrite, regularFile, projectDirectory, withFileLock } from '../lib/safe-files.mjs';
import { encode, decode, hash, need, keys, id, iso, readRecord } from './codec.mjs';

const toolkit = resolve(fileURLToPath(new URL('../', import.meta.url)));
const within = (parent, child) => { const r = relative(parent, child); return r === '' || !r.startsWith('..') && !isAbsolute(r); };
const rights = ['exchange','admit','observe','close','publish','accept','start','effect','setup','refresh'];
export function validatePolicy(p) {
  keys(p,['schema','ledger_scope','project','policy_id','controller_id','clock_uncertainty_ms','valid_until','source_revisions','bindings']);
  need(p.schema === 2 && ['ledger_scope','project','policy_id','controller_id'].every(k=>id(p[k])) && iso(p.valid_until), 'POLICY', 'Invalid policy identity');
  need(Number.isSafeInteger(p.clock_uncertainty_ms) && p.clock_uncertainty_ms >= 0 && p.clock_uncertainty_ms <= 86400000, 'POLICY', 'Unknown clock bound');
  need(Array.isArray(p.bindings) && p.bindings.length <= 100, 'POLICY', 'Invalid bindings');
  need(Array.isArray(p.source_revisions)&&p.source_revisions.length<=100&&p.source_revisions.every(v=>/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(v)),'POLICY','Invalid approved source revisions');
  const names = new Set();
  for (const b of p.bindings) {
    keys(b,['binding_id','actor','endpoint','rights','states','recipients','expires_at','revoked','independent','capabilities']);
    need(['binding_id','actor','endpoint'].every(k=>id(b[k])) && !names.has(b.binding_id), 'POLICY', 'Invalid or duplicate binding'); names.add(b.binding_id);
    need(Array.isArray(b.rights) && b.rights.every(v=>rights.includes(v)) && Array.isArray(b.states) && b.states.every(v=>['published','received','started','completed','independently_verified','blocked','expired','cancelled'].includes(v)), 'POLICY', 'Invalid grants');
    need(Array.isArray(b.recipients) && b.recipients.every(id) && iso(b.expires_at) && typeof b.revoked === 'boolean' && typeof b.independent === 'boolean', 'POLICY', 'Invalid binding scope');
    keys(b.capabilities,['record_kinds','event_types','reconciliation','acceptance_query']);
    need(Array.isArray(b.capabilities.record_kinds) && b.capabilities.record_kinds.every(v=>['action','observation','closure'].includes(v)), 'POLICY', 'Invalid record coverage');
    need(Array.isArray(b.capabilities.event_types) && b.capabilities.event_types.every(id) && typeof b.capabilities.reconciliation === 'boolean' && typeof b.capabilities.acceptance_query === 'boolean', 'POLICY', 'Invalid capability coverage');
  }
  return p;
}
async function directory(path) {
  const s = await lstat(path); need(s.isDirectory() && !s.isSymbolicLink(), 'UNSAFE_PATH', 'Expected unlinked directory');
}
async function json(path) { await regularFile(path); return decode(await readFile(path)); }
function stateShape(s, p) {
  keys(s,['schema','ledger_scope','project','controller_id','control_root_sha256','conversations','records','actions','outbox','acceptance','local_closed','projections','setups','commands','events']);
  need(s.schema === 2 && s.ledger_scope === p.ledger_scope && s.project === p.project && s.controller_id === p.controller_id, 'CORRUPT', 'State identity mismatch');
  for (const [rid, bytes] of Object.entries(s.records)) {
    const r = readRecord(Buffer.from(bytes)); need(rid === r.record_id && r.ledger_scope === p.ledger_scope && r.project === p.project, 'CORRUPT', 'Stored record scope mismatch');
  }
  need(s.events.length <= 10000 && Object.keys(s.commands).length <= 10000 && Object.keys(s.records).length <= 1000, 'LIMIT', 'Local prototype capacity reached');
}
function wrapper(seq, previous, state, at) {
  const content = { schema:2, seq, previous, state, committed_at:at };
  return {...content, digest:hash(encode(content))};
}
export async function initialize(ledgerRoot, controlRoot, policy, now = Date.now()) {
  validatePolicy(policy);
  const ledger = await realpath(resolve(ledgerRoot));
  need(!within(toolkit,ledger), 'UNSAFE_PATH', 'Ledger must be outside toolkit');
  const project = await projectDirectory(ledger,policy.project);
  const control = resolve(await realpath(dirname(resolve(controlRoot))), resolve(controlRoot).split(/[\\/]/).at(-1));
  need(!within(ledger,control) && !within(toolkit,control), 'UNSAFE_PATH', 'Private control root must be outside ledger/toolkit');
  const data = join(project,'coordination-v2');
  // Reject both existing roots before mutation. Never adopt an existing controller
  // or silently give a restored ledger a fresh execution identity.
  for (const path of [control,data]) {
    try { await lstat(path); need(false,'EXISTS','R2 root already exists'); } catch(e) { if(e.code!=='ENOENT')throw e; }
  }
  await mkdir(control,{mode:0o700});
  await atomicWrite(join(control,'policy.json'),encode(policy),true);
  await mkdir(data,{mode:0o700}); await mkdir(join(data,'journal'),{mode:0o700});
  await atomicWrite(join(data,'.gitattributes'),'.gitattributes text eol=lf\n.gitignore text eol=lf\njournal/** -text\n',true);
  await atomicWrite(join(data,'.gitignore'),'writer.lock\n.pending-*\n',true);
  const state = {schema:2, ledger_scope:policy.ledger_scope, project:policy.project, controller_id:policy.controller_id,control_root_sha256:hash(Buffer.from(control)),
    conversations:{},records:{},actions:{},outbox:{},acceptance:{},local_closed:{},projections:{},setups:{},commands:{},events:[]};
  const first=wrapper(1,null,state,new Date(now).toISOString());
  await atomicWrite(join(data,'journal',`00000001-${first.digest}.json`),encode(first),true);
  await atomicWrite(join(control,'anchor.json'),encode({schema:2,controller_id:policy.controller_id,ledger_scope:policy.ledger_scope,project:policy.project,ledger_realpath:ledger,control_realpath:control,seq:1,digest:first.digest}),true);
  return {local:'initialized',profile:'trusted-local-operator',transport:'not-configured',remote_identity:'not-implemented',ledger_scope:policy.ledger_scope};
}
export class Store {
  constructor(ledger,control,{clock=Date.now,checkpoint=async()=>{},lockTimeoutMs=5000}={}) {
    this.ledger=resolve(ledger); this.control=resolve(control); this.clock=clock; this.checkpoint=checkpoint; this.lockTimeoutMs=lockTimeoutMs;
  }
  async binding() {
    await directory(this.control);
    need(await realpath(this.control) === this.control, 'UNSAFE_PATH','Control alias is unsupported');
    const policy=validatePolicy(await json(join(this.control,'policy.json')));
    const anchor=await json(join(this.control,'anchor.json'));
    keys(anchor,['schema','controller_id','ledger_scope','project','ledger_realpath','control_realpath','seq','digest']);
    need(anchor.schema===2 && anchor.controller_id===policy.controller_id && anchor.ledger_scope===policy.ledger_scope && anchor.project===policy.project,'POLICY','Control identity mismatch');
    need(anchor.control_realpath===this.control,'CONTROLLER_PATH','Copied or relocated control directory cannot acquire authority');
    const actual=await realpath(this.ledger);
    need(actual===anchor.ledger_realpath && !within(toolkit,actual) && !within(actual,this.control), 'CONTROLLER_PATH','Clone/alias is read-only until explicitly reconciled; no automatic takeover');
    const project=await projectDirectory(actual,policy.project), data=join(project,'coordination-v2'), journal=join(data,'journal');
    await directory(data); await directory(journal);
    return {policy,anchor,journal,data};
  }
  async load() {
    const {policy,anchor,journal}=await this.binding();
    const names=(await readdir(journal)).filter(n=>!/^\.pending-[a-f0-9-]+$/.test(n)).sort();
    need(names.length>0,'CORRUPT','Journal missing');
    let last=null, matched=false;
    for (const name of names) {
      need(/^\d{8}-[a-f0-9]{64}\.json$/.test(name),'CORRUPT','Unexpected journal entry');
      const entry=await json(join(journal,name));
      keys(entry,['schema','seq','previous','state','committed_at','digest']);
      const {digest,...content}=entry;
      need(entry.schema===2 && entry.seq===(last?.seq||0)+1 && entry.previous===(last?.digest||null) && iso(entry.committed_at) && digest===hash(encode(content)) && name===`${String(entry.seq).padStart(8,'0')}-${digest}.json`,'CORRUPT','Broken journal chain');
      stateShape(entry.state,policy);
      need(entry.state.control_root_sha256===hash(Buffer.from(this.control)),'CONTROLLER_PATH','Journal is pinned to another controller location');
      if(entry.seq===anchor.seq) { need(entry.digest===anchor.digest,'STALE_RESTORE','Journal differs from controller high-water mark');matched=true; }
      last=entry;
    }
    need(matched && last.seq>=anchor.seq,'STALE_RESTORE','Restored ledger lacks committed controller history');
    return {policy,anchor,last,journal};
  }
  async transaction(command, execute) {
    need(id(command.request_id),'SCHEMA','Stable request_id required');
    const requestHash=hash(encode(command));
    const {data}=await this.binding();
    // One serialization point belongs to the actual ledger, not to a caller's
    // copy of controller state. Binding is checked before and inside the lock.
    return withFileLock(join(data,'writer'),async()=>{
      await this.checkpoint('locked');
      const loaded=await this.load();
      const {policy,last,anchor,journal}=loaded;
      const state=structuredClone(last.state), now=this.clock();
      const prior=state.commands[command.request_id];
      if(prior) need(prior.hash===requestHash,'CONFLICT','Request ID reused with changed content');
      // Authorization still runs for an exact retry; callers must not bypass it
      // by prechecking command IDs. Reducers return before side effects on replay.
      const result=await execute({state,policy,now,seq:last.seq+1,prior});
      if(prior) {
        // Recover the anchor after a commit-before-anchor crash before returning
        // any success that a caller could use to authorize an external effect.
        if(anchor.seq<last.seq) await atomicWrite(join(this.control,'anchor.json'),encode({...anchor,seq:last.seq,digest:last.digest}));
        return {...prior.result,duplicate:true};
      }
      state.commands[command.request_id]={hash:requestHash,result};
      stateShape(state,policy);
      const next=wrapper(last.seq+1,last.digest,state,new Date(now).toISOString());
      const nextBytes=encode(next);
      need(nextBytes.length<=16*1024*1024,'LIMIT','Local journal entry capacity reached; retain evidence and stop');
      await this.checkpoint('before-commit');
      await atomicWrite(join(journal,`${String(next.seq).padStart(8,'0')}-${next.digest}.json`),nextBytes,true);
      await this.checkpoint('after-commit');
      // No external adapter/effect is invoked here. Consumers get a successful
      // result only after the external high-water mark is advanced and synced.
      await atomicWrite(join(this.control,'anchor.json'),encode({...anchor,seq:next.seq,digest:next.digest}));
      await this.checkpoint('after-anchor');
      return result;
    },this.lockTimeoutMs);
  }
}
