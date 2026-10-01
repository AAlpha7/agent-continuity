import test from 'node:test';
import assert from 'node:assert/strict';
import { cp,readFile,writeFile,readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { Controller } from '../controller.mjs';
import { encode,decode } from '../codec.mjs';
import { fixture,admitted,planned,inventory,T,at,makeSetupScope } from './helpers.mjs';

async function worker(t,f,control,requestId,pause='') {
  const file=join(f.base,`${requestId}.json`);await writeFile(file,encode({request_id:requestId,op:'attempt_effect',args:{action_id:'action-work-001',effect_id:'effect-one'}}));
  const child=spawn(process.execPath,[fileURLToPath(new URL('./control-race-child.mjs',import.meta.url)),f.ledger,control,file,pause],{windowsHide:true,stdio:['pipe','pipe','pipe']});
  let output='',errors='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>errors+=chunk);
  const exit=once(child,'exit').then(([code])=>({code,output,errors}));
  const timer=setTimeout(()=>child.kill(),10000);exit.finally(()=>clearTimeout(timer));t.after(()=>{if(child.exitCode===null)child.kill();});
  return {child,exit,held:async()=>{if(output.includes('HELD'))return;await Promise.race([new Promise(resolve=>{child.stdout.on('data',()=>{if(output.includes('HELD'))resolve();});}),exit.then(result=>{throw Error(`Exited before holding lock: ${JSON.stringify(result)}`);})]);}};
}
async function ready(f) {await admitted(f);await f.run('start',{action_id:'action-work-001',content_version:1},'worker');await planned(f);}
const setupId='fixture-setup';
async function setup(f,{cleanup=true,unknown=false}={}) {
  const planned=await f.run('setup_plan',{setup_id:setupId,resource_intent:'Fictional subscription only',resource_scope:makeSetupScope(),cleanup_authorized:cleanup});
  await f.run('setup_result',{setup_id:setupId,state:'attempted',resource_id:null,created_by_setup:false,cost_note:null});
  if(unknown)await f.run('setup_result',{setup_id:setupId,state:'outcome-unknown',resource_id:null,created_by_setup:false,cost_note:'Cost not yet established'});
  return planned.plan_request_id;
}
const resolution=(plan,state='confirmed',changes={})=>({setup_id:setupId,state,resource_id:state==='confirmed'?'fixture-resource-001':null,created_by_setup:state==='confirmed',cost_note:'Prior possible costs still retained in history',
  evidence:{resource_scope:makeSetupScope(),setup_request_id:plan,resource_id:state==='confirmed'?'fixture-resource-001':null,observation:state==='confirmed'?'exists-created-by-setup':'confirmed-absent',source_ref:'synthetic:authoritative-inspection',observed_at:at(0)},...changes});
const cleanup=changes=>({setup_id:setupId,resource_scope:makeSetupScope(),resource_id:'fixture-resource-001',outcome:'confirmed-removed',evidence_ref:'synthetic:cleanup-observation',observed_at:at(0),...changes});

test('F01 two processes: copied control cannot admit a second first-effect attempt or fork journal',async t=>{
  const f=await fixture(t);await ready(f);const copy=join(f.base,'control-copy');await cp(f.control,copy,{recursive:true});
  const original=await worker(t,f,f.control,'original-attempt','before-commit');await original.held();
  const duplicate=await worker(t,f,copy,'copied-attempt');const denied=await duplicate.exit;
  assert.equal(denied.code,1);assert.equal(JSON.parse(denied.errors).code,'CONTROLLER_PATH');assert.ok(!denied.output.includes('attempt_id'));
  original.child.stdin.write('continue');assert.equal((await original.exit).code,0);
  const s=await f.state();assert.equal(s.actions['action-work-001'].effects['effect-one'].attempts.length,1);
  const names=await readdir(join(f.project,'coordination-v2','journal'));assert.equal(new Set(names.map(n=>n.slice(0,8))).size,names.length);
  await assert.rejects(f.run('attempt_effect',{action_id:'action-work-001',effect_id:'effect-one'},'worker'),{code:'EXECUTION_UNKNOWN'});
});
test('F02 journal binding and shared ledger lock resist repinning a copied anchor',async t=>{
  const f=await fixture(t);await ready(f);const copy=join(f.base,'control-copy');await cp(f.control,copy,{recursive:true});
  const file=join(copy,'anchor.json'),anchor=decode(await readFile(file));anchor.control_realpath=copy;await writeFile(file,encode(anchor));
  const c=new Controller(f.ledger,copy,{binding:'worker',endpoint:'endpoint-worker',clock:()=>T,lockTimeoutMs:30});
  const original=await worker(t,f,f.control,'original-attempt','before-commit');await original.held();
  const cmd={request_id:'repinned-request',op:'attempt_effect',args:{action_id:'action-work-001',effect_id:'effect-one'}};
  await assert.rejects(c.command(cmd),{code:'BUSY'}); // Same authoritative lock, despite different control roots.
  original.child.stdin.write('continue');assert.equal((await original.exit).code,0);
  await assert.rejects(c.command(cmd),{code:'CONTROLLER_PATH'}); // Journal pin rejects the altered anchor too.
  assert.equal((await f.state()).actions['action-work-001'].effects['effect-one'].attempts.length,1);
});
test('F03 unknown setup reconciles to inspected concrete resource and preserves unknown evidence',async t=>{
  const f=await fixture(t),plan=await setup(f,{unknown:true}),before=(await f.state()).setups[setupId].history;
  const result=await f.run('setup_reconcile',resolution(plan));assert.equal(result.journal,'confirmed');assert.equal(result.external_operation,'not-performed');
  const state=(await f.state()).setups[setupId];assert.deepEqual(state.history.slice(0,before.length),before);assert.equal(state.resource_id,'fixture-resource-001');
  assert.equal(state.history.at(-1).assertion.evidence.setup_request_id,plan);
  assert.equal((await f.run('cleanup_result',cleanup())).resource_id,'fixture-resource-001');
});
test('F04 affirmative absence resolves unknown to failed without permitting blind recreation',async t=>{
  const f=await fixture(t),plan=await setup(f,{unknown:true});await f.run('setup_reconcile',resolution(plan,'failed'));
  const state=(await f.state()).setups[setupId];assert.equal(state.state,'failed');assert.equal(state.history[2].assertion.state,'outcome-unknown');assert.equal(state.created_by_setup,false);
  await assert.rejects(f.run('setup_plan',{setup_id:setupId,resource_intent:'Fictional subscription only',resource_scope:makeSetupScope(),cleanup_authorized:true}),{code:'CONFLICT'});
  await assert.rejects(f.run('cleanup_result',cleanup()),{code:'FORBIDDEN'});
});
test('F05 reconciliation rejects wrong scope, plan, missing evidence and weak not-found',async t=>{
  const f=await fixture(t),plan=await setup(f,{unknown:true}),before=await inventory(f.ledger),good=resolution(plan);
  for(const evidence of [ {...good.evidence,resource_scope:makeSetupScope({owner:'different-owner'})}, {...good.evidence,setup_request_id:'different-plan'}, {...good.evidence,resource_id:'different-resource'} ])
    await assert.rejects(f.run('setup_reconcile',{...good,evidence}),{code:'SCOPE'});
  await assert.rejects(f.run('setup_reconcile',{...good,evidence:{...good.evidence,source_ref:' '}}),{code:'SCHEMA'});
  const failed=resolution(plan,'failed');await assert.rejects(f.run('setup_reconcile',{...failed,evidence:{...failed.evidence,observation:'not-found'}}),{code:'SCHEMA'});
  await assert.rejects(f.run('setup_reconcile',good,'worker'),{code:'FORBIDDEN'});
  assert.deepEqual(await inventory(f.ledger),before);
});
test('F06 null/blank resource identities never establish confirmed creation or cleanup',async t=>{
  const f=await fixture(t);await setup(f);const before=await inventory(f.ledger);
  for(const resource_id of [null,'','   ']) {
    await assert.rejects(f.run('setup_result',{setup_id:setupId,state:'confirmed',resource_id,created_by_setup:true,cost_note:null}),{code:'SCHEMA'});
    await assert.rejects(f.run('cleanup_result',cleanup({resource_id})),{code:'SCHEMA'});
  }
  assert.deepEqual(await inventory(f.ledger),before);
});
test('F07 cleanup requires matching concrete scope and preserves preexisting resources',async t=>{
  const f=await fixture(t);await setup(f);await f.run('setup_result',{setup_id:setupId,state:'confirmed',resource_id:'fixture-resource-001',created_by_setup:true,cost_note:null});
  await assert.rejects(f.run('cleanup_result',cleanup({resource_id:'different-resource'})),{code:'SCOPE'});
  await assert.rejects(f.run('cleanup_result',cleanup({resource_scope:makeSetupScope({destination:'different-project'})})),{code:'SCOPE'});
  await f.run('cleanup_result',cleanup({outcome:'failed'}));await f.run('cleanup_result',cleanup());
  assert.equal((await f.state()).setups[setupId].history.at(-2).assertion.outcome,'failed');
  const other=await fixture(t),plan=await setup(other,{unknown:true});const r=resolution(plan);r.created_by_setup=false;r.evidence.observation='exists-preexisting';
  await other.run('setup_reconcile',r);await assert.rejects(other.run('cleanup_result',cleanup()),{code:'FORBIDDEN'});
});
test('F08 known resource identity cannot be erased or replaced during reconciliation',async t=>{
  const f=await fixture(t),plan=await setup(f);await f.run('setup_result',{setup_id:setupId,state:'outcome-unknown',resource_id:'known-resource',created_by_setup:false,cost_note:null});
  await assert.rejects(f.run('setup_reconcile',resolution(plan)),{code:'CONFLICT'});
  await assert.rejects(f.run('setup_reconcile',resolution(plan,'failed')),{code:'CONFLICT'});
  const result=resolution(plan);result.resource_id='known-resource';result.evidence.resource_id='known-resource';
  await f.run('setup_reconcile',result);assert.equal((await f.state()).setups[setupId].resource_id,'known-resource');
});
