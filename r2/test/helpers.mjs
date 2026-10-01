import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { initialize } from '../store.mjs';
import { Controller } from '../controller.mjs';
import { action, encode, hash } from '../codec.mjs';

export const T=Date.parse('2030-01-01T00:00:00.000Z');
export const at=n=>new Date(T+n).toISOString();
export const makeSetupScope=(changes={})=>({service:'synthetic-host',owner:'synthetic-owner',destination:'synthetic-private-project',operation:'create-test-subscription',...changes});
export function policy() {
  const binding=(name,actor,rights,states=[],independent=false)=>({binding_id:name,actor,endpoint:`endpoint-${name}`,rights,states,
    recipients:['worker-one','reviewer-two'],expires_at:at(86400000),revoked:false,independent,
    capabilities:{record_kinds:['action','observation','closure'],event_types:['synthetic-opened','synthetic-merged'],reconciliation:true,acceptance_query:true}});
  return {schema:2,ledger_scope:'synthetic-ledger-001',project:'sample-project',policy_id:'synthetic-policy-001',controller_id:'synthetic-controller-001',
    clock_uncertainty_ms:0,valid_until:at(86400000),source_revisions:['1'.repeat(40)],bindings:[
      binding('operator','coordinator',['exchange','admit','close','observe','setup','refresh'],['received','published','blocked','expired','cancelled']),
      binding('worker','worker-one',['observe','start','effect','accept','refresh'],['received','started','completed','blocked']),
      binding('reviewer','reviewer-two',['observe','accept','refresh'],['received','independently_verified'],true),
      binding('transport','transport-adapter',['publish'],[])]};
}
export async function fixture(t,options={}) {
  const base=await mkdtemp(join(tmpdir(),'continuity-r2-'));
  if(t)t.after(()=>rm(base,{recursive:true,force:true}));
  const ledger=join(base,'ledger'),control=join(base,'control'),project=join(ledger,'projects','sample-project');
  await mkdir(join(project,'history'),{recursive:true});
  const original=Buffer.from('\uFEFF# Synthetic project\r\nOpen: inspect a timeout test.\r\n');
  await writeFile(join(project,'CURRENT_STATE.md'),original);await writeFile(join(project,'history','original.md'),original);
  await writeFile(join(project,'snapshot-input.json'),JSON.stringify({schema:1,history:'history/original.md',history_sha256:hash(original),facts:['Synthetic fixture only']}));
  let time=T;const p=policy();await initialize(ledger,control,p,T);
  const f={base,ledger,control,project,p,original,setTime:n=>time=n,clock:()=>time};
  f.controller=(binding='operator',more={})=>new Controller(ledger,control,{binding,endpoint:`endpoint-${binding}`,clock:()=>time,...options,...more});
  f.run=(op,args,binding='operator',request_id=`req-${randomUUID()}`)=>f.controller(binding).command({request_id,op,args});
  f.exchange=()=>f.run('exchange',{conversation_id:'exchange-one',participants:['worker-one','reviewer-two'],max_turns:2,expires_at:at(3600000),delivery_expires_at:at(7200000),max_delivery_attempts:3,closers:['operator']});
  f.state=async()=> (await f.controller().store.load()).last.state;
  f.changePolicy=async change=>{change(p);await writeFile(join(control,'policy.json'),encode(p));};
  return f;
}
export function makeAction(overrides={}) {
  return action({protocol_revision:2,kind:'action',record_id:'action-record-001',ledger_scope:'synthetic-ledger-001',project:'sample-project',
    conversation_id:'exchange-one',sender_declared:'coordinator',source_revision:'1'.repeat(40),policy_ref:'synthetic-policy-001',
    action_id:'action-work-001',recipient:'worker-one',content_version:1,previous_digest:null,payload:{summary:'Inspect synthetic timeout behavior.',evidence_refs:[]},
    in_reply_to:null,turn_index:1,max_turns:2,budget_authority_ref:'operator',admission_ref:'admit-action-work-001',reply_policy:'next-action',terminal:false,
    timing:{desired_at:null,deadline_at:at(3600000),timing_boundary:'send-attempt',early_policy:'not-before',early_tolerance_ms:0,late_tolerance_ms:0,late_policy:'stop-and-report'},...overrides});
}
export function makeObservation(a=makeAction(),overrides={}) {
  return {protocol_revision:2,kind:'observation',record_id:'observation-record-001',ledger_scope:a.ledger_scope,project:a.project,conversation_id:a.conversation_id,
    sender_declared:'worker-one',source_revision:a.source_revision,policy_ref:a.policy_ref,action_id:a.action_id,content_version:a.content_version,action_sha256:a.content_sha256,
    recipient:a.recipient,state:'completed',at:at(10),evidence_refs:['synthetic:test-output'],verification:{result:'not-applicable',independent:false},reply_policy:'none',terminal:false,...overrides};
}
export function changeAction(original,changes) { const {content_sha256,...content}=original;return action({...content,...changes}); }
export function makeClosure(overrides={}) {
  return {protocol_revision:2,kind:'closure',record_id:'closure-record-001',ledger_scope:'synthetic-ledger-001',project:'sample-project',conversation_id:'exchange-one',
    sender_declared:'coordinator',source_revision:'1'.repeat(40),policy_ref:'synthetic-policy-001',recipients:['worker-one','reviewer-two'],result_refs:[],at:at(20),reply_policy:'none',terminal:true,...overrides};
}
export async function inventory(root) {
  const rows={};async function visit(dir,rel='') {for(const item of await readdir(dir,{withFileTypes:true})) {const r=rel?`${rel}/${item.name}`:item.name;if(item.isDirectory())await visit(join(dir,item.name),r);else rows[r]=hash(await readFile(join(dir,item.name)));}}
  await visit(root);return rows;
}
export async function admitted(f,a=makeAction()) {await f.exchange();await f.run('admit',{record:a});return a;}
export async function planned(f,{profile='unverified',effect_id='effect-one',depends_on=[],expires_at=at(60000)}={}) {
  const a=makeAction();
  await f.run('plan_effect',{action_id:a.action_id,effect_id,target:'synthetic-destination',payload:{value:'synthetic'},depends_on,expires_at,provider_profile:profile},'worker');
  return {action_id:a.action_id,effect_id};
}
