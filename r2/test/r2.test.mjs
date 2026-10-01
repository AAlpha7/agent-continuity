import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile,writeFile,mkdir,cp,readdir,rename,link } from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Controller,capabilityCoverage } from '../controller.mjs';
import { initialize } from '../store.mjs';
import { encode,decode,hash,readRecord,checkTime } from '../codec.mjs';
import { publishFixture,reconcileFixture,syntheticEffect,checkDestinationEvidence,inspectLedger } from '../local-files.mjs';
import { buildSnapshot } from '../../scripts/build-continuity-snapshot.mjs';
import { writeAgentReceipt } from '../../scripts/agent-receipt.mjs';
import { fixture,admitted,makeAction,makeObservation,makeClosure,changeAction,planned,inventory,T,at,makeSetupScope } from './helpers.mjs';

const reject=(promise,code)=>assert.rejects(promise,{code});
const req=(op,args,request_id='fixed-request-001')=>({request_id,op,args});
async function start(f) {await admitted(f);await f.run('start',{action_id:'action-work-001',content_version:1},'worker');}
async function close(f) {await f.run('close',{record:makeClosure()});return 'closure-record-001:worker-one';}
const acceptArgs=(r,recipient='worker-one',delivered_at=null)=>({record_id:r.record_id,recipient,record_sha256:hash(encode(r)),delivered_at});
async function child(f,command,{binding='operator',stopAt=''}={}) {
  const path=join(f.base,`${command.request_id}.json`);await writeFile(path,encode(command));
  const p=spawn(process.execPath,[fileURLToPath(new URL('./child.mjs',import.meta.url)),f.ledger,f.control,path,binding,stopAt],{windowsHide:true,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';p.stdout.on('data',v=>stdout+=v);p.stderr.on('data',v=>stderr+=v);
  const exit=new Promise((resolve,reject)=>{p.once('error',reject);p.once('exit',(code,signal)=>resolve({code,signal,get stdout(){return stdout},get stderr(){return stderr}}));});
  return {p,exit,stopped:()=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(`Checkpoint timeout: ${stderr}`)),5000);const poll=setInterval(()=>{if(stdout.includes(`STOP:${stopAt}`)){clearInterval(poll);clearTimeout(timer);resolve();}else if(p.exitCode!==null){clearInterval(poll);clearTimeout(timer);reject(Error(stderr));}},10);})};
}
async function retireProvenDeadLock(f,job) {
  const result=await job.exit;assert.ok(result.signal||result.code!==null);
  // Test-only explicit recovery: preserve the lock as evidence after this exact
  // fixture-owned child is confirmed dead. Runtime never steals locks by age/PID.
  await rename(join(f.project,'coordination-v2','writer.lock'),join(f.base,`retired-lock-${Date.now()}`));
}

test('C01 exact replay after independent controller restart',async t=>{
  const f=await fixture(t);await f.exchange();const command=req('admit',{record:makeAction()});await f.controller().command(command);
  const replay=await f.controller().command(command);assert.equal(replay.duplicate,true);assert.equal((await f.state()).conversations['exchange-one'].used,1);
});
test('C02 synthetic opened then merged share one action identity',async t=>{
  const f=await fixture(t);await admitted(f);assert.equal((await f.run('admit',{record:makeAction()})).duplicate,true);
  assert.equal(Object.keys((await f.state()).actions).length,1);assert.equal((await f.state()).conversations['exchange-one'].used,1);
});
test('C03 event redelivery and local scan discovery deduplicate',async t=>{
  const f=await fixture(t),a=await admitted(f),inbox=join(f.base,'inbox');await mkdir(inbox);await publishFixture(inbox,encode(a));
  const scan=await reconcileFixture(inbox);assert.equal(scan.records.length,1);assert.equal((await f.run('admit',{record:scan.records[0].record})).duplicate,true);
});
test('C04 out-of-order completion and receipt preserve independent observations',async t=>{
  const f=await fixture(t),a=await admitted(f);await f.run('observe',{record:makeObservation(a)},'worker');
  await f.run('observe',{record:makeObservation(a,{record_id:'late-receipt-001',state:'received',at:at(5)})},'worker');
  const state=await f.state();assert.equal(state.actions[a.action_id].execution,'reported-completed');assert.equal(state.actions[a.action_id].started_at,undefined);assert.equal(state.actions[a.action_id].observations.length,2);
});
test('C05 same version different bytes conflicts without changing accepted evidence',async t=>{
  const f=await fixture(t),a=await admitted(f),before=await inventory(f.ledger);
  await reject(f.run('admit',{record:changeAction(a,{payload:{summary:'Changed',evidence_refs:[]}})}),'CONFLICT');assert.deepEqual(await inventory(f.ledger),before);
});
test('C06 version gaps and old arrivals do not roll back current source',async t=>{
  const f=await fixture(t);await f.exchange();const a=makeAction(),v2=changeAction(a,{record_id:'action-record-002',content_version:2,previous_digest:a.content_sha256});
  await reject(f.run('admit',{record:v2}),'MISSING_VERSION');await f.run('admit',{record:a});
  await reject(f.run('admit',{record:changeAction(v2,{content_version:3})}),'MISSING_VERSION');await f.run('admit',{record:v2});await f.run('admit',{record:a});
  assert.equal((await f.state()).actions[a.action_id].latest_version,2);
});
test('C07 changed approved content before merge supersedes old dispatch',async t=>{
  const f=await fixture(t),a=await admitted(f),v2=changeAction(a,{record_id:'action-record-002',content_version:2,previous_digest:a.content_sha256,payload:{summary:'New inspected text',evidence_refs:[]}});
  await f.run('admit',{record:v2});await reject(f.run('attempt_delivery',{outbox_key:`${a.record_id}:${a.recipient}`},'transport'),'SUPERSEDED');
  await reject(f.run('start',{action_id:a.action_id,content_version:1},'worker'),'SUPERSEDED');
});
test('C08 recipient is frozen before and after execution',async t=>{
  const f=await fixture(t),a=await admitted(f);const changed=changeAction(a,{record_id:'recipient-change-002',content_version:2,previous_digest:a.content_sha256,recipient:'reviewer-two'});
  await reject(f.run('admit',{record:changed}),'CONFLICT');await f.run('start',{action_id:a.action_id,content_version:1},'worker');await reject(f.run('admit',{record:changed}),'CONFLICT');assert.equal(Object.keys((await f.state()).actions).length,1);
});
test('C09 missing event is discoverable by explicit full local reconciliation',async t=>{
  const f=await fixture(t),inbox=join(f.base,'inbox');await mkdir(inbox);await publishFixture(inbox,encode(makeAction()));
  const result=await reconcileFixture(inbox);assert.equal(result.records[0].record.action_id,'action-work-001');assert.equal(result.records[0].authority,'untrusted-until-local-binding-admission');
});
test('C10 local scan does not skip an old-dated late insertion',async t=>{
  const f=await fixture(t),inbox=join(f.base,'inbox');await mkdir(inbox);await publishFixture(inbox,encode(makeAction()));assert.equal((await reconcileFixture(inbox)).records.length,1);
  await publishFixture(inbox,encode(makeObservation()));assert.equal((await reconcileFixture(inbox)).records.length,2);
});
test('C11 unavailable recipient exhausts bounded attempts without received claim',async t=>{
  const f=await fixture(t);await admitted(f);const key=await close(f);
  for(let i=0;i<3;i++)await f.run('attempt_delivery',{outbox_key:key},'transport');
  await reject(f.run('attempt_delivery',{outbox_key:key},'transport'),'DELIVERY_EXPIRED');assert.equal((await f.state()).outbox[key].acceptance,null);
});
test('C12 unknown/denied binding cannot activate setup; capability gaps stay visible',async t=>{
  const f=await fixture(t),before=await inventory(f.ledger);await f.changePolicy(p=>p.bindings=[]);
  await reject(f.exchange(),'FORBIDDEN');assert.deepEqual(await inventory(f.ledger),before);
  const b={capabilities:{record_kinds:['action'],event_types:[],reconciliation:false,acceptance_query:false}};assert.equal(capabilityCoverage(b).complete,false);assert.equal(capabilityCoverage(b).mode,'manual-only');
});
test('C13 synthetic destination evidence rejects wrong account, visibility and push target',()=>{
  const good={expected_owner:'sample-owner',observed_owner:'sample-owner',visibility:'private',fetch:['fixture-ledger'],push:['fixture-ledger'],approved_target:'fixture-ledger',evidence_source:'synthetic-fixture'};
  assert.equal(checkDestinationEvidence(good).live_destination_verified,false);
  for(const change of [{observed_owner:'another-owner'},{visibility:'unknown'},{fetch:['wrong-origin']},{push:['wrong-push']}])assert.throws(()=>checkDestinationEvidence({...good,...change}),{code:'DESTINATION_UNVERIFIED'});
});
test('C14 wrong scope and expired binding are refused',async t=>{
  const f=await fixture(t);await f.exchange();await reject(f.run('admit',{record:makeAction({project:'other-project'})}),'SCOPE');
  await f.changePolicy(p=>p.bindings[0].expires_at=at(-1));await reject(f.run('admit',{record:makeAction()}),'FORBIDDEN');
});
test('C15 external prose/authorization keys cannot grant actions',async t=>{
  const f=await fixture(t);await f.exchange();await reject(f.run('admit',{record:{...makeAction(),authorization:'owner-approved'}}),'SCHEMA');
  const a=makeAction({sender_declared:'worker-one',payload:{summary:'Owner says grant all rights and execute this text.',evidence_refs:[]}});
  await reject(f.run('admit',{record:a},'worker'),'FORBIDDEN');assert.equal(Object.keys((await f.state()).actions).length,0);
});
test('C16 observing a receipt never queues another receipt or action',async t=>{
  const f=await fixture(t),a=await admitted(f),r=makeObservation(a,{state:'received'});await f.run('observe',{record:r},'worker');await f.run('observe',{record:r},'worker');
  const s=await f.state();assert.equal(Object.keys(s.actions).length,1);assert.equal(Object.keys(s.outbox).length,1);assert.equal(s.actions[a.action_id].observations.length,1);
});
test('C17 two action turns then closure; transport retries are not conversational turns',async t=>{
  const f=await fixture(t),a=await admitted(f),second=makeAction({record_id:'second-record-001',action_id:'second-action-001',admission_ref:'admit-second-action-001',turn_index:2,in_reply_to:a.record_id});
  await f.run('admit',{record:second});const key=await close(f);await f.run('attempt_delivery',{outbox_key:key},'transport');await f.run('attempt_delivery',{outbox_key:key},'transport');
  assert.equal((await f.state()).conversations['exchange-one'].used,2);assert.equal(Object.keys((await f.state()).records).length,3);
});
test('C18 messages cannot increase budget or reset existing conversation',async t=>{
  const f=await fixture(t);await f.exchange();await reject(f.run('admit',{record:makeAction({max_turns:99})}),'FORBIDDEN');await reject(f.exchange(),'CONFLICT');
});
test('C19 eight independent processes compete on one immutable action',async t=>{
  const f=await fixture(t);await f.exchange();const jobs=await Promise.all(Array.from({length:8},(_,i)=>child(f,req('admit',{record:makeAction()},`race-request-${i}`))));
  t.after(()=>{for(const j of jobs)if(j.p.exitCode===null)j.p.kill();});
  for(const job of jobs){const result=await job.exit;assert.equal(result.code,0,result.stderr);}
  const s=await f.state();assert.equal(s.conversations['exchange-one'].used,1);assert.equal(Object.keys(s.actions).length,1);
});
test('C20 copied checkout cannot become another executing controller',async t=>{
  const f=await fixture(t);await admitted(f);const clone=join(f.base,'clone');await cp(f.ledger,clone,{recursive:true});
  const c=new Controller(clone,f.control,{binding:'worker',endpoint:'endpoint-worker',clock:()=>T});await reject(c.command(req('start',{action_id:'action-work-001',content_version:1})),'CONTROLLER_PATH');
  await reject(initialize(clone,join(f.base,'other-control'),f.p,T),'EXISTS');
});
test('C21 killed precommit process requires explicit dead-lock recovery then safe replay',async t=>{
  const f=await fixture(t);await f.exchange();const command=req('admit',{record:makeAction()});const job=await child(f,command,{stopAt:'before-commit'});t.after(()=>{if(job.p.exitCode===null)job.p.kill();});
  await job.stopped();job.p.kill();await job.exit;
  await reject(f.controller('operator',{lockTimeoutMs:30}).command(command),'BUSY');assert.equal(Object.keys((await f.state()).actions).length,0);
  await retireProvenDeadLock(f,job);await f.controller().command(command);assert.equal(Object.keys((await f.state()).actions).length,1);
});
test('C22 ambiguous external effect is reconciled by exact synthetic result',async t=>{
  const f=await fixture(t);await start(f);const x=await planned(f,{profile:'synthetic-file-v1'}),dir=join(f.base,'effects');await mkdir(dir);
  const attempt=await f.run('attempt_effect',x,'worker');await syntheticEffect(dir,attempt);assert.equal((await f.state()).actions[x.action_id].effects[x.effect_id].outcome,'unknown');
  const actual=decode(await readFile(join(dir,`${attempt.key}.json`)));await f.run('effect_result',{...x,key:actual.key,payload_sha256:actual.payload_sha256,found:true,result_ref:'synthetic-authoritative-file'},'worker');
  await reject(f.run('attempt_effect',x,'worker'),'ALREADY_DONE');assert.equal((await readdir(dir)).length,1);
});
test('C23 desired/send/server/receipt/observation times remain distinct',async t=>{
  const f=await fixture(t);await admitted(f);const key=await close(f),attempt=await f.run('attempt_delivery',{outbox_key:key},'transport');f.setTime(T+3000);
  await f.run('publication',{outbox_key:key,attempt_id:attempt.attempt_id,record_sha256:attempt.record_sha256,object_ref:'synthetic-server-object',server_created_at:at(1000)},'transport');
  await f.run('accept',acceptArgs(makeClosure(),'worker-one',at(2000)),'worker');const b=(await f.state()).outbox[key];
  assert.equal(b.attempts[0].send_attempt_at,at(0));assert.equal(b.publication.server_created_at,at(1000));assert.equal(b.acceptance.delivered_at,at(2000));assert.equal(b.acceptance.observed_at,at(3000));
});
test('C24 unknown clocks/tolerance rejected; unknown server/receipt time stays null',async t=>{
  const f=await fixture(t);await admitted(f);const key=await close(f),a=await f.run('attempt_delivery',{outbox_key:key},'transport');
  await f.run('publication',{outbox_key:key,attempt_id:a.attempt_id,record_sha256:a.record_sha256,object_ref:'synthetic-object',server_created_at:null},'transport');await f.run('accept',acceptArgs(makeClosure()),'worker');
  assert.equal((await f.state()).outbox[key].acceptance.delivered_at,null);assert.throws(()=>checkTime(makeAction().timing,'send-attempt',NaN),{code:'CLOCK_UNKNOWN'});
  assert.throws(()=>checkTime({...makeAction().timing,late_tolerance_ms:null},'send-attempt',T),{code:'SCHEMA'});
});
test('C25 failed verification stays failed; executor cannot verify itself',async t=>{
  const f=await fixture(t),a=await admitted(f);const r=makeObservation(a,{sender_declared:'reviewer-two',state:'independently_verified',verification:{result:'fail',independent:true}});
  await f.run('observe',{record:r},'reviewer');const view=await f.controller().status('exchange-one','worker-one');assert.equal(view.work[0].verification[0].result,'fail');
  await reject(f.run('observe',{record:{...r,record_id:'forged-review-002',sender_declared:'worker-one'}},'worker'),'FORBIDDEN');
});
test('C26 v1 bytes and snapshot behavior remain intact beside R2',async t=>{
  const f=await fixture(t);const old=await readFile(join(f.project,'CURRENT_STATE.md'));const snapshot=await buildSnapshot(f.ledger,'sample-project');
  await admitted(f);await close(f);assert.deepEqual(await readFile(join(f.project,'CURRENT_STATE.md')),old);assert.equal((await buildSnapshot(f.ledger,'sample-project',true)).path,snapshot.path);
  const receipt={schema:1,kind:'agent-receipt',id:'synthetic-v1-receipt',project:'sample-project',actor_declared:'legacy-label',task_id:'legacy-task',status:'received',at:at(0),source_revision:'1'.repeat(40),summary:'Legacy still works',evidence:[]};
  const written=await writeAgentReceipt(f.ledger,receipt);assert.equal(written.duplicate,false);assert.deepEqual(await readFile(join(f.project,'history/original.md')),f.original);
});
test('C27 malformed/duplicate JSON, invalid UTF8, large input and linked evidence fail closed',async t=>{
  assert.throws(()=>decode(Buffer.from('{"x":1,"x":2}\n')),{code:'CORRUPT'});assert.throws(()=>readRecord(Buffer.from([0xff])),{code:'CORRUPT'});assert.throws(()=>readRecord(Buffer.alloc(65537)),{code:'LIMIT'});
  const f=await fixture(t);await link(join(f.control,'policy.json'),join(f.base,'policy-alias'));await reject(f.state(),'UNSAFE_PATH');
});
test('C28 pause/re-enable keeps closure and pending delivery unchanged',async t=>{
  const f=await fixture(t);await admitted(f);const key=await close(f);await f.changePolicy(p=>p.bindings[3].revoked=true);await reject(f.run('attempt_delivery',{outbox_key:key},'transport'),'FORBIDDEN');
  await f.changePolicy(p=>p.bindings[3].revoked=false);await f.run('attempt_delivery',{outbox_key:key},'transport');assert.equal((await f.state()).conversations['exchange-one'].closed,'closure-record-001');
});
test('C29 forged observations do not advance state',async t=>{
  const f=await fixture(t),a=await admitted(f),before=await inventory(f.ledger);await reject(f.run('observe',{record:makeObservation(a)}),'ISSUER');assert.deepEqual(await inventory(f.ledger),before);
});
test('C30 wrong endpoint and claimed authentication do not establish a binding',async t=>{
  const f=await fixture(t),a=await admitted(f),c=new Controller(f.ledger,f.control,{binding:'worker',endpoint:'wrong-endpoint',clock:()=>T});
  await reject(c.command(req('observe',{record:makeObservation(a)})),'FORBIDDEN');await reject(f.run('observe',{record:{...makeObservation(a),authenticated:true}},'worker'),'SCHEMA');assert.equal((await f.controller().status('exchange-one','worker-one')).remote_identity,'not-implemented');
});
test('C31 executor cannot claim verification or closure without separate grant',async t=>{
  const f=await fixture(t);await admitted(f);await reject(f.run('close',{record:makeClosure({sender_declared:'worker-one'})},'worker'),'FORBIDDEN');assert.equal((await f.state()).conversations['exchange-one'].closed,null);
});
test('C32 exact retry still checks revocation and expiry',async t=>{
  const f=await fixture(t),a=await admitted(f),command=req('observe',{record:makeObservation(a)});await f.controller('worker').command(command);await f.changePolicy(p=>p.bindings[1].revoked=true);
  await reject(f.controller('worker').command(command),'FORBIDDEN');
});
test('C33 unauthorized terminal flags cannot consume the control slot',async t=>{
  const f=await fixture(t),a=await admitted(f);await reject(f.run('observe',{record:makeObservation(a,{terminal:true})},'worker'),'SCHEMA');await reject(f.run('admit',{record:{...a,terminal:true}}),'SCHEMA');
});
test('C34 scope survives copy; stale restore below external anchor is blocked',async t=>{
  const f=await fixture(t);await admitted(f);const copyRoot=join(f.base,'read-copy');await cp(f.ledger,copyRoot,{recursive:true});assert.equal((await inspectLedger(copyRoot,'sample-project')).ledger_scope,f.p.ledger_scope);
  const journal=join(f.project,'coordination-v2','journal'),last=(await readdir(journal)).sort().at(-1);await rename(join(journal,last),join(f.base,'preserved-latest.json'));await reject(f.state(),'STALE_RESTORE');
});
test('C35 endpoint rebind cannot resume old action without fencing',async t=>{
  const f=await fixture(t);await admitted(f);await f.changePolicy(p=>p.bindings[1].endpoint='replacement-endpoint');
  const c=new Controller(f.ledger,f.control,{binding:'worker',endpoint:'replacement-endpoint',clock:()=>T});await reject(c.command(req('start',{action_id:'action-work-001',content_version:1})),'RECONCILE');
});
test('C36 partial multi-effect crash skips successes and blocks dependencies on unknown',async t=>{
  const f=await fixture(t);await start(f);const one=await planned(f),two=await planned(f,{effect_id:'effect-two',depends_on:['effect-one']}),three=await planned(f,{effect_id:'effect-three',depends_on:['effect-two']});
  const first=await f.run('attempt_effect',one,'worker');await f.run('effect_result',{...one,key:first.key,payload_sha256:first.payload_sha256,found:true,result_ref:'first-result'},'worker');
  await f.run('attempt_effect',two,'worker');await reject(f.run('attempt_effect',one,'worker'),'ALREADY_DONE');await reject(f.run('attempt_effect',three,'worker'),'RECONCILE');
});
test('C37 per-effect key cannot be rebound to changed payload/target',async t=>{
  const f=await fixture(t);await start(f);const x=await planned(f);await reject(f.run('plan_effect',{...x,target:'synthetic-destination',payload:{value:'changed'},depends_on:[],expires_at:at(60000),provider_profile:'unverified'},'worker'),'CONFLICT');
});
test('C38 expired or uncertain key retention denies all automatic retry paths',async t=>{
  const f=await fixture(t);await start(f);const x=await planned(f,{profile:'synthetic-file-v1'}),cmd=req('attempt_effect',x);await f.controller('worker').command(cmd);f.setTime(T+60000);
  await reject(f.controller('worker').command(cmd),'KEY_EXPIRED');await reject(f.run('attempt_effect',x,'worker'),'KEY_EXPIRED');
});
test('C39 eventual-consistency not-found is not permission to resubmit',async t=>{
  const f=await fixture(t);await start(f);const x=await planned(f),a=await f.run('attempt_effect',x,'worker');await f.run('effect_result',{...x,key:a.key,payload_sha256:a.payload_sha256,found:false,result_ref:'temporarily-invisible'},'worker');
  await reject(f.run('attempt_effect',x,'worker'),'EXECUTION_UNKNOWN');assert.equal((await f.state()).actions[x.action_id].effects[x.effect_id].outcome,'unknown');
});
test('C40 separate processes compete for last turn: exactly one admission',async t=>{
  const f=await fixture(t),a=await admitted(f);const jobs=await Promise.all([1,2].map(i=>child(f,req('admit',{record:makeAction({record_id:`last-record-00${i}`,action_id:`last-action-00${i}`,admission_ref:`admit-last-action-00${i}`,turn_index:2,in_reply_to:a.record_id})},`last-race-00${i}`))));
  const results=await Promise.all(jobs.map(j=>j.exit));assert.equal(results.filter(r=>r.code===0).length,1);assert.equal((await f.state()).conversations['exchange-one'].used,2);
});
test('C41 closure/admission process race preserves serialized boundary',async t=>{
  const f=await fixture(t),a=await admitted(f);const jobs=await Promise.all([child(f,req('close',{record:makeClosure()},'close-race-001')),child(f,req('admit',{record:makeAction({record_id:'last-record-003',action_id:'last-action-003',admission_ref:'admit-last-action-003',turn_index:2,in_reply_to:a.record_id})},'admit-race-001'))]);
  const results=await Promise.all(jobs.map(j=>j.exit));assert.equal(results[0].code,0,results[0].stderr);const s=await f.state();assert.equal(s.conversations['exchange-one'].closed,'closure-record-001');assert.ok([1,2].includes(s.conversations['exchange-one'].used));
  await reject(f.run('start',{action_id:a.action_id,content_version:1},'worker'),'CLOSED');
});
test('C42 closure after budget exhaustion has one reserved identity',async t=>{
  const f=await fixture(t),a=await admitted(f);await f.run('admit',{record:makeAction({record_id:'second-record-004',action_id:'second-action-004',admission_ref:'admit-second-action-004',turn_index:2,in_reply_to:a.record_id})});await close(f);
  assert.equal((await f.run('close',{record:makeClosure()})).duplicate,true);assert.equal(Object.keys((await f.state()).records).length,3);
});
test('C43 missing/rebound budget authority blocks further work',async t=>{
  const f=await fixture(t);await admitted(f);await f.changePolicy(p=>p.bindings[0].revoked=true);await reject(f.run('start',{action_id:'action-work-001',content_version:1},'worker'),'AUTHORITY_UNAVAILABLE');
});
test('C44 partial setup remains journaled; unknown result cannot be blindly recreated',async t=>{
  const f=await fixture(t);const x={setup_id:'synthetic-setup',resource_intent:'Synthetic subscription only',resource_scope:makeSetupScope(),cleanup_authorized:true};await f.run('setup_plan',x);await f.run('setup_result',{setup_id:x.setup_id,state:'attempted',resource_id:null,created_by_setup:false,cost_note:null});
  await f.run('setup_result',{setup_id:x.setup_id,state:'outcome-unknown',resource_id:null,created_by_setup:false,cost_note:'Unknown synthetic charge'});await reject(f.run('setup_plan',x),'CONFLICT');assert.equal((await f.state()).setups[x.setup_id].state,'outcome-unknown');
});
test('C45 cleanup needs authorization and proven-new resource; cost reversal never inferred',async t=>{
  const f=await fixture(t);await f.run('setup_plan',{setup_id:'synthetic-setup',resource_intent:'Synthetic resource',resource_scope:makeSetupScope(),cleanup_authorized:false});await f.run('setup_result',{setup_id:'synthetic-setup',state:'attempted',resource_id:null,created_by_setup:false,cost_note:null});
  await f.run('setup_result',{setup_id:'synthetic-setup',state:'confirmed',resource_id:'synthetic-resource',created_by_setup:true,cost_note:'Synthetic already-incurred cost'});await reject(f.run('cleanup_result',{setup_id:'synthetic-setup',resource_scope:makeSetupScope(),resource_id:'synthetic-resource',outcome:'confirmed-removed',evidence_ref:'synthetic:cleanup',observed_at:at(0)}),'FORBIDDEN');assert.equal((await f.state()).setups['synthetic-setup'].cleanup,'not-attempted');
});
test('C46 scheduled early boundary requires explicit approved window',()=>{
  const base={...makeAction().timing,desired_at:at(1000),late_tolerance_ms:1000};assert.throws(()=>checkTime(base,'send-attempt',T+900),{code:'TOO_EARLY'});
  checkTime({...base,early_policy:'approved-window',early_tolerance_ms:100},'send-attempt',T+900);assert.throws(()=>checkTime({...base,early_policy:'approved-window',early_tolerance_ms:100},'send-attempt',T+899),{code:'TOO_EARLY'});
});
test('C47 uncertain earliest time and inconsistent windows fail closed',()=>{
  const x={...makeAction().timing,desired_at:at(1000),late_tolerance_ms:1000};assert.throws(()=>checkTime(x,'send-attempt',T+1000,1),{code:'TOO_EARLY'});assert.throws(()=>checkTime({...x,deadline_at:at(500)},'send-attempt',T+1000),{code:'SCHEMA'});
});
test('C48 fault before closure commit leaves no partial closed/outbox state',async t=>{
  const f=await fixture(t);await admitted(f);const before=await inventory(f.ledger);const c=f.controller('operator',{checkpoint:async label=>{if(label==='before-commit')throw Error('Injected precommit failure');}});
  await assert.rejects(c.command(req('close',{record:makeClosure()})),/Injected/);assert.deepEqual(await inventory(f.ledger),before);assert.equal((await f.state()).conversations['exchange-one'].closed,null);
});
test('C49 killed postcommit closure preserves exact outbox and safely repairs anchor',async t=>{
  const f=await fixture(t);await admitted(f);const command=req('close',{record:makeClosure()}),job=await child(f,command,{stopAt:'after-commit'});t.after(()=>{if(job.p.exitCode===null)job.p.kill();});await job.stopped();job.p.kill();await job.exit;
  const s=await f.state();assert.equal(s.conversations['exchange-one'].closed,'closure-record-001');assert.equal(Object.values(s.outbox).filter(b=>b.kind==='closure').length,2);
  await retireProvenDeadLock(f,job);assert.equal((await f.controller().command(command)).duplicate,true);const loaded=await f.controller().store.load();assert.equal(loaded.anchor.seq,loaded.last.seq);
});
test('C50 lost terminal event: scan can discover closure, publication is not acceptance',async t=>{
  const f=await fixture(t);await admitted(f);const key=await close(f),inbox=join(f.base,'inbox');await mkdir(inbox);const attempt=await f.run('attempt_delivery',{outbox_key:key},'transport');const output=await publishFixture(inbox,Buffer.from(attempt.record_bytes));
  await f.run('publication',{outbox_key:key,attempt_id:attempt.attempt_id,record_sha256:output.record_sha256,object_ref:output.object_ref,server_created_at:output.server_created_at},'transport');
  assert.equal((await reconcileFixture(inbox)).records[0].record.kind,'closure');assert.equal((await f.state()).outbox[key].acceptance,null);
});
test('C51 closed restart keeps exact terminal and authorized late observations deliverable',async t=>{
  const f=await fixture(t),a=await admitted(f),key=await close(f);const first=await f.run('attempt_delivery',{outbox_key:key},'transport'),second=await f.run('attempt_delivery',{outbox_key:key},'transport');assert.equal(first.record_bytes,second.record_bytes);
  const observation=makeObservation(a);await f.run('observe',{record:observation},'worker');const queued=await f.run('queue_observation',{record_id:observation.record_id,recipient:'reviewer-two'},'transport');await f.run('attempt_delivery',{outbox_key:queued.outbox_key},'transport');
  assert.equal((await f.state()).conversations['exchange-one'].closed,'closure-record-001');
});
test('C52 action-only adapter cannot silently dispatch closure; scan covers every kind',async t=>{
  const f=await fixture(t);await admitted(f);const key=await close(f);await f.changePolicy(p=>p.bindings[3].capabilities.record_kinds=['action']);await reject(f.run('attempt_delivery',{outbox_key:key},'transport'),'CAPABILITY');
  assert.deepEqual(capabilityCoverage(f.p.bindings[3]).missing_record_kinds,['observation','closure']);
});
test('C53 offline recipient after terminal expiry remains closed and acceptance-unknown',async t=>{
  const f=await fixture(t);await admitted(f);const key=await close(f);f.setTime(T+7200001);await reject(f.run('attempt_delivery',{outbox_key:key},'transport'),'DELIVERY_EXPIRED');const view=await f.controller().status('exchange-one','worker-one');assert.equal(view.authority_closed,true);assert.equal(view.terminal_delivery[0].acceptance,'delivery-unknown');
});
test('C54 acceptance is evidenced per recipient, never all inferred from one',async t=>{
  const f=await fixture(t);await admitted(f);await close(f);await f.run('accept',acceptArgs(makeClosure()),'worker');const d=(await f.controller().status('exchange-one','worker-one')).terminal_delivery;assert.equal(d.find(v=>v.recipient==='worker-one').acceptance,'durably-accepted');assert.equal(d.find(v=>v.recipient==='reviewer-two').acceptance,'delivery-unknown');
});
test('C55 silent terminal acceptance invalidates stale local waiting view without replying',async t=>{
  const f=await fixture(t);await admitted(f);await f.run('refresh',{conversation_id:'exchange-one',recipient:'worker-one'},'worker');await close(f);const before=Object.keys((await f.state()).outbox).length;
  await f.run('accept',acceptArgs(makeClosure()),'worker');const current=await f.controller().status('exchange-one','worker-one');assert.equal(current.waiting_for_terminal,false);assert.equal(current.projection,'refresh-pending');assert.equal(Object.keys((await f.state()).outbox).length,before);
  await f.run('refresh',{conversation_id:'exchange-one',recipient:'worker-one'},'worker');assert.equal((await f.controller().status('exchange-one','worker-one')).projection,'current');assert.deepEqual(await readFile(join(f.project,'CURRENT_STATE.md')),f.original);
});
test('C56 crash after durable acceptance leaves recoverable projection refresh intent',async t=>{
  const f=await fixture(t);await admitted(f);await close(f);const command=req('accept',acceptArgs(makeClosure()));const c=f.controller('worker',{checkpoint:async label=>{if(label==='after-commit')throw Error('Injected projection interruption');}});
  await assert.rejects(c.command(command),/Injected/);assert.equal((await f.controller().status('exchange-one','worker-one')).waiting_for_terminal,false);assert.equal((await f.state()).projections['exchange-one:worker-one'].dirty,true);await f.controller('worker').command(command);await f.run('refresh',{conversation_id:'exchange-one',recipient:'worker-one'},'worker');
});
test('C57 participant report does not invent independently evidenced ingestion time',async t=>{
  const f=await fixture(t);await admitted(f);await close(f);await f.run('report_acceptance',{record_id:'closure-record-001',recipient:'worker-one',summary:'Participant reports silent acceptance.'});const view=await f.controller().status('exchange-one','worker-one');const d=view.terminal_delivery.find(v=>v.recipient==='worker-one');assert.equal(d.acceptance,'delivery-unknown');assert.equal(d.delivered_at,null);assert.equal(d.participant_report.label,'participant-reported');assert.equal(view.recipient_accepted_terminal,false);
});
