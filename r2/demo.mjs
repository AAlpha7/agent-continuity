// Synthetic local demonstration only. No existing ledger, network or credentials.
import { mkdtemp,mkdir,writeFile,readFile,cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { encode,action,hash } from './codec.mjs';
import { publishFixture,reconcileFixture,syntheticEffect } from './local-files.mjs';
const exec=promisify(execFile), cli=fileURLToPath(new URL('./cli.mjs',import.meta.url));
export async function runDemo() {
  const base=await mkdtemp(join(tmpdir(),'continuity-r2-demo-'));
  const ledger=join(base,'ledger'),control=join(base,'operator-control'),inputs=join(base,'synthetic-inputs');
  const project=join(ledger,'projects','sample-project'),inbox=join(base,'local-inbox'),effects=join(base,'synthetic-effects');
  await mkdir(join(project,'history'),{recursive:true});await mkdir(inputs);await mkdir(inbox);await mkdir(effects);
  const original=Buffer.from('\uFEFF# Fictional project\r\nOpen: inspect the synthetic timeout test.\r\n');
  await writeFile(join(project,'CURRENT_STATE.md'),original);await writeFile(join(project,'history','original.md'),original);
  await writeFile(join(project,'snapshot-input.json'),JSON.stringify({schema:1,history:'history/original.md',history_sha256:hash(original),facts:[]}));
  const started=Date.now(),at=offset=>new Date(started+offset).toISOString(),scope=`demo-${randomUUID()}`;
  const source='1'.repeat(40); // Deliberately fictional revision, not a verified checkout.
  const binding=(name,actor,rights,states=[],independent=false)=>({binding_id:name,actor,endpoint:`endpoint-${name}`,rights,states,
    recipients:['worker-one','reviewer-two'],expires_at:at(3600000),revoked:false,independent,
    capabilities:{record_kinds:['action','observation','closure'],event_types:[],reconciliation:true,acceptance_query:false}});
  const policy={schema:2,ledger_scope:scope,project:'sample-project',policy_id:'synthetic-policy',controller_id:`controller-${randomUUID()}`,
    clock_uncertainty_ms:0,valid_until:at(3600000),source_revisions:[source],bindings:[
      binding('operator','coordinator',['exchange','admit','close']),
      binding('worker','worker-one',['start','effect','observe','accept','refresh'],['received','started','completed']),
      binding('reviewer','reviewer-two',['accept','observe','refresh'],['independently_verified'],true),
      binding('transport','transport-adapter',['publish'])]};
  const policyFile=join(inputs,'synthetic-policy.json');await writeFile(policyFile,encode(policy));
  const invoke=async args=>JSON.parse((await exec(process.execPath,[cli,...args],{windowsHide:true,maxBuffer:2*1024*1024})).stdout);
  await invoke(['init',ledger,control,policyFile]);
  const results=[];
  const run=async(op,args,who='operator',request_id=`request-${randomUUID()}`)=>{
    const path=join(inputs,`${request_id}.json`);await writeFile(path,encode({op,args,request_id}));
    const result=await invoke(['command',ledger,control,who,`endpoint-${who}`,path]);results.push({op,request_id,result});return result;
  };
  await run('exchange',{conversation_id:'demo-exchange',participants:['worker-one','reviewer-two'],max_turns:2,expires_at:at(1800000),delivery_expires_at:at(3600000),max_delivery_attempts:3,closers:['operator']});
  const a=action({protocol_revision:2,kind:'action',record_id:'demo-action-record',ledger_scope:scope,project:'sample-project',conversation_id:'demo-exchange',sender_declared:'coordinator',source_revision:source,policy_ref:policy.policy_id,
    action_id:'demo-work',recipient:'worker-one',content_version:1,previous_digest:null,payload:{summary:'Inspect the fictional timeout result; retain one unresolved check.',evidence_refs:[]},in_reply_to:null,turn_index:1,max_turns:2,budget_authority_ref:'operator',admission_ref:'admit-demo-work',reply_policy:'next-action',terminal:false,
    timing:{desired_at:null,deadline_at:at(1800000),timing_boundary:'send-attempt',early_policy:'not-before',early_tolerance_ms:0,late_tolerance_ms:0,late_policy:'stop-and-report'}});
  await run('admit',{record:a},'operator','demo-admission-request');
  const replay=await run('admit',{record:a},'operator','demo-admission-request');
  await run('start',{action_id:a.action_id,content_version:1},'worker');
  const effect={action_id:a.action_id,effect_id:'demo-file-effect'};
  await run('plan_effect',{...effect,target:'synthetic-local-file',payload:{fictional:'result'},depends_on:[],expires_at:at(1800000),provider_profile:'synthetic-file-v1'},'worker');
  const attempt=await run('attempt_effect',effect,'worker');const output=await syntheticEffect(effects,attempt);
  // Deliberately omit completion first: the durable journal still says unknown.
  await run('effect_result',{...effect,...output},'worker');
  const closure={protocol_revision:2,kind:'closure',record_id:'demo-closure-record',ledger_scope:scope,project:'sample-project',conversation_id:'demo-exchange',sender_declared:'coordinator',source_revision:source,policy_ref:policy.policy_id,recipients:['worker-one','reviewer-two'],result_refs:[],at:new Date().toISOString(),reply_policy:'none',terminal:true};
  await run('close',{record:closure});
  const key=`${closure.record_id}:worker-one`,delivery=await run('attempt_delivery',{outbox_key:key},'transport');
  const local=await publishFixture(inbox,Buffer.from(delivery.record_bytes));
  await run('publication',{outbox_key:key,attempt_id:delivery.attempt_id,record_sha256:local.record_sha256,object_ref:local.object_ref,server_created_at:null},'transport');
  const scan=await reconcileFixture(inbox); // Simulated missed-event recovery, no webhook.
  await run('accept',{record_id:closure.record_id,recipient:'worker-one',record_sha256:hash(encode(closure)),delivered_at:null},'worker');
  const pending=await invoke(['status',ledger,control,'worker','endpoint-worker','demo-exchange','worker-one']);
  await run('refresh',{conversation_id:'demo-exchange',recipient:'worker-one'},'worker');
  const status=await invoke(['status',ledger,control,'worker','endpoint-worker','demo-exchange','worker-one']);
  const copy=join(base,'replacement-read-only-ledger');await cp(ledger,copy,{recursive:true});
  const replacement=await invoke(['inspect',copy,'sample-project']);
  if(!(await readFile(join(project,'CURRENT_STATE.md'))).equals(original))throw Error('Legacy evidence changed');
  const result={profile:'synthetic-local-only',base,ledger,control,inputs,replacement_ledger:copy,
    exact_replay_duplicate:replay.duplicate,terminal_found_by_full_scan:scan.records.some(r=>r.record.kind==='closure'),
    projection_before_refresh:pending.projection,final_status:status,replacement_execution_authority:replacement.execution_authority,
    real_independent_agents:0,network_used:false,remote_configured:false,persistent_credentials_created:false,
    limitations:['One trusted OS operator chooses all fictional roles.','No live transport or independently authenticated recipient.','Read-only replacement cannot take over the controller.','Completed work is not inferred from exchange closure.']};
  await writeFile(join(base,'DEMO-RESULT.json'),JSON.stringify(result,null,2)+'\n');
  await writeFile(join(base,'COMMAND-RESULTS.json'),JSON.stringify(results,null,2)+'\n');
  return result;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {console.log(JSON.stringify(await runDemo(),null,2));}
  catch(error){console.error(JSON.stringify({ok:false,code:error.code||'ERROR',message:error.message}));process.exitCode=1;}
}
