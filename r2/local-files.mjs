// Explicit, local-only transport fixture. No listeners, Git remotes or network.
import { lstat, realpath, readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { atomicWrite, regularFile } from '../lib/safe-files.mjs';
import { hash, encode, need, readRecord, decode, keys, id } from './codec.mjs';

async function root(path) {
  const target=resolve(path),stat=await lstat(target);
  need(stat.isDirectory()&&!stat.isSymbolicLink()&&await realpath(target)===target,'UNSAFE_PATH','Expected explicit unlinked local directory');return target;
}
export async function publishFixture(directory,bytes) {
  readRecord(bytes);const dir=await root(directory),name=`${hash(bytes)}.json`,path=join(dir,name);
  try {await regularFile(path);need((await readFile(path)).equals(bytes),'CONFLICT','Existing local transport bytes differ');}
  catch(e){if(e.code!=='ENOENT')throw e;await atomicWrite(path,bytes,true);}
  return {object_ref:name,record_sha256:hash(bytes),server_created_at:null,transport:'local-file-fixture',recipient_acceptance:'unknown'};
}
export async function reconcileFixture(directory) {
  const dir=await root(directory),records=[];
  for(const name of (await readdir(dir)).sort()) {
    need(/^[a-f0-9]{64}\.json$/.test(name),'CORRUPT','Unexpected inbox entry');
    const path=join(dir,name);await regularFile(path);const bytes=await readFile(path),record=readRecord(bytes);
    need(name===`${hash(bytes)}.json`,'CORRUPT','Inbox filename digest mismatch');
    records.push({name,record,bytes:bytes.toString('utf8'),authority:'untrusted-until-local-binding-admission'});
  }
  // Full local scan has no timestamp cursor and includes all three kinds.
  return {records,network:'not-attempted',record_kinds:['action','observation','closure']};
}
export async function syntheticEffect(directory,attempt) {
  // This deliberately supports only a synthetic immutable-file effect, not a
  // user service. A repeated key/payload returns its prior result without rewrite.
  need(attempt.profile==='synthetic-file-v1'&&attempt.duplicate!==true,'UNSUPPORTED','Synthetic profile and fresh validated attempt required');
  need(typeof attempt.key==='string'&&/^[a-f0-9]{64}$/.test(attempt.key),'SCHEMA','Synthetic effect key must be a digest, never a path');
  const dir=await root(directory),path=join(dir,`${attempt.key}.json`);
  const value={key:attempt.key,payload_sha256:attempt.payload_sha256,payload:attempt.payload};
  const bytes=encode(value);need(hash(encode(attempt.payload))===attempt.payload_sha256,'CONFLICT','Effect payload mismatch');
  try {await regularFile(path);need((await readFile(path)).equals(bytes),'CONFLICT','Key bound to other bytes');}
  catch(e){if(e.code!=='ENOENT')throw e;await atomicWrite(path,bytes,true);}
  return {found:true,key:attempt.key,payload_sha256:attempt.payload_sha256,result_ref:`synthetic-file:${attempt.key}`};
}
export function checkDestinationEvidence(x) {
  keys(x,['expected_owner','observed_owner','visibility','fetch','push','approved_target','evidence_source']);
  need(id(x.expected_owner)&&x.observed_owner===x.expected_owner&&x.visibility==='private','DESTINATION_UNVERIFIED','Owner/private visibility not established');
  need(typeof x.approved_target==='string'&&x.approved_target.length>0&&Array.isArray(x.fetch)&&x.fetch.length>0&&Array.isArray(x.push)&&x.push.length>0,'DESTINATION_UNVERIFIED','Destinations incomplete');
  need([...x.fetch,...x.push].every(v=>v===x.approved_target),'DESTINATION_UNVERIFIED','Effective fetch/push targets differ');
  need(x.evidence_source==='synthetic-fixture','UNSUPPORTED','No live hosting evidence adapter is implemented');
  return {synthetic_comparison:'pass',live_destination_verified:false,automatic_push:false};
}

export async function inspectLedger(ledger,project) {
  need(id(project),'SCHEMA','Invalid project');
  const dir=await root(join(await root(ledger),'projects',project,'coordination-v2','journal'));
  let last=null;
  for(const name of (await readdir(dir)).filter(n=>!/^\.pending-[a-f0-9-]+$/.test(n)).sort()) {
    need(/^\d{8}-[a-f0-9]{64}\.json$/.test(name),'CORRUPT','Unexpected journal entry');
    await regularFile(join(dir,name));const entry=decode(await readFile(join(dir,name)));
    const {digest,...content}=entry;
    need(digest===hash(encode(content))&&entry.seq===(last?.seq||0)+1&&entry.previous===(last?.digest||null)&&name===`${String(entry.seq).padStart(8,'0')}-${digest}.json`,'CORRUPT','Journal chain mismatch');
    for(const bytes of Object.values(entry.state.records))readRecord(Buffer.from(bytes));
    last=entry;
  }
  need(last,'MISSING','No R2 journal');
  return {read_only:true,execution_authority:'not-established-by-this-copy',controller_freshness:'not-checked',ledger_scope:last.state.ledger_scope,
    journal_seq:last.seq,conversations:last.state.conversations,actions:last.state.actions,records:last.state.records};
}
