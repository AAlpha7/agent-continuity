import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir,readFile,writeFile,cp } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Controller } from '../controller.mjs';
import { encode,hash } from '../codec.mjs';
import { syntheticEffect,inspectLedger } from '../local-files.mjs';
import { fixture,admitted,makeAction,makeObservation,makeClosure,changeAction,planned,inventory,T } from './helpers.mjs';
import { runDemo } from '../demo.mjs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { relative,isAbsolute } from 'node:path';
const exec=promisify(execFile);
const command=(op,args,request_id='replayed-request-001')=>({op,args,request_id});

test('R01 exact replay cannot bypass frozen recipient after policy endpoint rebind',async t=>{
  const f=await fixture(t),a=await admitted(f),cmd=command('observe',{record:makeObservation(a)});
  await f.controller('worker').command(cmd);await f.changePolicy(p=>p.bindings[1].endpoint='replacement-endpoint');
  const replacement=new Controller(f.ledger,f.control,{binding:'worker',endpoint:'replacement-endpoint',clock:()=>T});
  await assert.rejects(replacement.command({...cmd,request_id:'replacement-request'}),{code:'RECONCILE'});
  await assert.rejects(f.controller('worker').command(cmd),{code:'FORBIDDEN'});
});
test('R02 old-version completion is retained without suppressing current work',async t=>{
  const f=await fixture(t),a=await admitted(f),v2=changeAction(a,{record_id:'action-record-002',content_version:2,previous_digest:a.content_sha256});
  await f.run('admit',{record:v2});await f.run('observe',{record:makeObservation(a)},'worker');
  assert.equal((await f.state()).actions[a.action_id].execution,'not-started');
  await f.run('start',{action_id:a.action_id,content_version:2},'worker');
  assert.equal((await f.state()).actions[a.action_id].observations.length,1);
});
test('R03 late result invalidates current projection without rewriting prior records',async t=>{
  const f=await fixture(t),a=await admitted(f),closure=makeClosure();await f.run('close',{record:closure});
  await f.run('accept',{record_id:closure.record_id,recipient:'worker-one',record_sha256:hash(encode(closure)),delivered_at:null},'worker');
  await f.run('refresh',{conversation_id:'exchange-one',recipient:'worker-one'},'worker');
  assert.equal((await f.controller().status('exchange-one','worker-one')).projection,'current');
  await f.run('observe',{record:makeObservation(a)},'worker');
  const view=await f.controller().status('exchange-one','worker-one');assert.equal(view.projection,'refresh-pending');assert.equal(view.work[0].execution,'reported-completed');assert.equal(view.waiting_for_terminal,false);
});
test('R04 confirmed effect result cannot be overwritten or submitted by rebound endpoint',async t=>{
  const f=await fixture(t);await admitted(f);await f.run('start',{action_id:'action-work-001',content_version:1},'worker');
  const plan=await planned(f),attempt=await f.run('attempt_effect',plan,'worker');
  const args={...plan,key:attempt.key,payload_sha256:attempt.payload_sha256,found:true,result_ref:'retained-result'};
  await f.run('effect_result',args,'worker');await assert.rejects(f.run('effect_result',{...args,result_ref:'changed'},'worker'),{code:'CONFLICT'});
  await f.changePolicy(p=>p.bindings[1].endpoint='replacement-endpoint');
  const c=new Controller(f.ledger,f.control,{binding:'worker',endpoint:'replacement-endpoint',clock:()=>T});
  await assert.rejects(c.command(command('effect_result',args)),{code:'RECONCILE'});
});
test('R05 synthetic effect refuses path-like keys without touching destination',async t=>{
  const f=await fixture(t),dir=join(f.base,'effects');await mkdir(dir);const before=await inventory(f.base);
  await assert.rejects(syntheticEffect(dir,{profile:'synthetic-file-v1',key:'../outside',payload:{},payload_sha256:hash(encode({}))}),{code:'SCHEMA'});
  assert.deepEqual(await inventory(f.base),before);
});
test('R06 exact dispatch replay rechecks source supersession and authority',async t=>{
  const f=await fixture(t),a=await admitted(f),cmd=command('attempt_delivery',{outbox_key:`${a.record_id}:${a.recipient}`});
  await f.controller('transport').command(cmd);await f.run('admit',{record:changeAction(a,{record_id:'action-record-002',content_version:2,previous_digest:a.content_sha256})});
  await assert.rejects(f.controller('transport').command(cmd),{code:'SUPERSEDED'});
  await f.changePolicy(p=>p.bindings[0].revoked=true);
  await assert.rejects(f.run('attempt_delivery',{outbox_key:`action-record-002:${a.recipient}`},'transport'),{code:'AUTHORITY_UNAVAILABLE'});
});
test('R07 unsupported scheduled remote boundary fails before admission',async t=>{
  const f=await fixture(t);await f.exchange();const a=makeAction();
  await assert.rejects(f.run('admit',{record:changeAction(a,{timing:{...a.timing,desired_at:new Date(T).toISOString(),timing_boundary:'received'}})}),{code:'CAPABILITY'});
  assert.equal((await f.state()).conversations['exchange-one'].used,0);
});
test('R08 real Git init/autocrlf clone preserves R2 journal bytes and remains read-only',async t=>{
  const f=await fixture(t);await admitted(f);await f.run('close',{record:makeClosure()});
  const source=join(f.base,'synthetic-git-source'),clone=join(f.base,'synthetic-clone');
  await cp(f.ledger,source,{recursive:true});
  // Private controller configuration is deliberately NOT copied into Git.
  const config=join(f.base,'empty-git-config');await writeFile(config,'');
  const env={...process.env,GIT_CONFIG_GLOBAL:config,GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0'};
  const git=(...args)=>exec('git',args,{env,windowsHide:true});
  await git('init',source);await git('-C',source,'-c','core.autocrlf=true','add','projects/sample-project/coordination-v2');
  await git('-C',source,'-c','user.name=Synthetic Test','-c','user.email=fixture@example.invalid','commit','-m','Synthetic journal only');
  await git('-c','core.autocrlf=true','clone','--no-local',source,clone);
  const relative='projects/sample-project/coordination-v2';assert.deepEqual(await inventory(join(source,relative)),await inventory(join(clone,relative)));
  assert.equal((await inspectLedger(clone,'sample-project')).execution_authority,'not-established-by-this-copy');
  // Copy v1 current file only so rejection exercises the controller binding.
  await cp(join(f.project,'CURRENT_STATE.md'),join(clone,'projects/sample-project/CURRENT_STATE.md'));
  const controller=new Controller(clone,f.control,{binding:'worker',endpoint:'endpoint-worker',clock:()=>T});
  await assert.rejects(controller.command(command('start',{action_id:'action-work-001',content_version:1})),{code:'CONTROLLER_PATH'});
});
test('R09 source approval withdrawal blocks execution and saved dispatch replay',async t=>{
  const f=await fixture(t),a=await admitted(f),cmd=command('attempt_delivery',{outbox_key:`${a.record_id}:${a.recipient}`});
  await f.controller('transport').command(cmd);await f.changePolicy(p=>p.source_revisions=[]);
  await assert.rejects(f.controller('transport').command(cmd),{code:'FORBIDDEN'});
  await assert.rejects(f.run('start',{action_id:a.action_id,content_version:1},'worker'),{code:'FORBIDDEN'});
});
test('R10 documented demo uses fresh CLI processes and leaves a truthful replacement view',async t=>{
  const result=await runDemo();
  const rel=relative(tmpdir(),result.base);assert.ok(!rel.startsWith('..')&&!isAbsolute(rel)&&rel.startsWith('continuity-r2-demo-'));
  t.after(()=>rm(result.base,{recursive:true,force:true}));
  assert.equal(result.real_independent_agents,0);assert.equal(result.network_used,false);assert.equal(result.exact_replay_duplicate,true);
  assert.equal(result.projection_before_refresh,'refresh-pending');assert.equal(result.final_status.projection,'current');
  assert.equal(result.final_status.waiting_for_terminal,false);assert.equal(result.final_status.work[0].execution,'started');
  assert.equal(result.final_status.terminal_delivery[1].acceptance,'delivery-unknown');
  assert.equal(result.replacement_execution_authority,'not-established-by-this-copy');
});
