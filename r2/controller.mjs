import { Store } from './store.mjs';
import { need, keys, id, iso, text, hash, encode, readRecord, validateRecord, checkTime } from './codec.mjs';

const copy = value => structuredClone(value);
const recordOf = (s, rid) => { need(Object.hasOwn(s.records,rid),'MISSING','Record unavailable');return readRecord(Buffer.from(s.records[rid])); };
const conversation = (s,cid) => { need(Object.hasOwn(s.conversations,cid),'MISSING','Exchange unavailable');return s.conversations[cid]; };
const actionOf = (s,aid) => { need(Object.hasOwn(s.actions,aid),'MISSING','Action unavailable');return s.actions[aid]; };
const boxKey = (rid,recipient) => `${rid}:${recipient}`;
const stamp = now => new Date(now).toISOString();
function arrayIds(v,max=32) { return Array.isArray(v) && v.length>0 && v.length<=max && v.every(id) && new Set(v).size===v.length; }
function allowed(b,right,recipient) {
  need(b.rights.includes(right) && (!recipient || b.recipients.includes(recipient)), 'FORBIDDEN','Binding lacks scoped permission');
}
function scope(r,p,b) {
  validateRecord(r);
  need(r.ledger_scope===p.ledger_scope && r.project===p.project && r.policy_ref===p.policy_id,'SCOPE','Record scope/policy mismatch');
  need(p.source_revisions.includes(r.source_revision),'FORBIDDEN','Source revision not approved by current local policy');
  need(r.sender_declared===b.actor,'ISSUER','Declared sender is not this locally selected binding');
}
function put(s,r) {
  const value=encode(r).toString('utf8');
  if(Object.hasOwn(s.records,r.record_id)) {
    need(s.records[r.record_id]===value,'CONFLICT','Record ID content conflict');return false;
  }
  s.records[r.record_id]=value;return true;
}
function queue(s,r,recipient,c) {
  need(c.participants.includes(recipient),'RECIPIENT','Destination outside exchange');
  const key=boxKey(r.record_id,recipient);
  if(!s.outbox[key])s.outbox[key]={record_id:r.record_id,recipient,kind:r.kind,attempts:[],publication:null,acceptance:null,
    expires_at:c.delivery_expires_at,max_attempts:c.max_delivery_attempts};
  return key;
}
function live(c,now) { need(!c.closed,'CLOSED','Exchange closed to new work');need(now<=Date.parse(c.expires_at),'EXPIRED','Exchange expired'); }
function authority(c,p,now) {
  const owner=p.bindings.find(b=>b.binding_id===c.authority);
  need(owner&&!owner.revoked&&owner.endpoint===c.authority_endpoint&&owner.rights.includes('exchange')&&now+p.clock_uncertainty_ms<=Date.parse(owner.expires_at),'AUTHORITY_UNAVAILABLE','Budget authority unavailable or rebound; no automatic takeover');
}
function boundRecipient(c,b,recipient) {
  const frozen=c.recipient_bindings[recipient];
  need(frozen&&frozen.binding_id===b.binding_id&&frozen.endpoint===b.endpoint&&b.actor===recipient,'RECONCILE','Recipient endpoint changed; no implicit transfer/fencing');
}
function matchingAction(s,r) {
  const a=actionOf(s,r.action_id), rid=a.versions[String(r.content_version)];
  need(rid,'MISSING_VERSION','Referenced version unavailable');const original=recordOf(s,rid);
  need(a.recipient===r.recipient && a.conversation_id===r.conversation_id && original.content_sha256===r.action_sha256,'CONFLICT','Observation target mismatch');
  return a;
}
function projection(s,cid,recipient) {
  const c=conversation(s,cid), acceptance=s.local_closed[`${cid}:${recipient}`]||null;
  const actions=Object.entries(s.actions).filter(([,a])=>a.conversation_id===cid).map(([aid,a])=>{
    const observations=a.observations.map(rid=>recordOf(s,rid));
    return {action_id:aid,recipient:a.recipient,content_version:a.latest_version,execution:a.execution,
      reported_states:[...new Set(observations.filter(o=>o.content_version===a.latest_version).map(o=>o.state))],
      observations:observations.map(o=>({record_id:o.record_id,content_version:o.content_version,action_sha256:o.action_sha256,state:o.state})),
      verification:observations.filter(o=>o.state==='independently_verified').map(o=>({record_id:o.record_id,content_version:o.content_version,result:o.verification.result,observer:o.sender_declared,assurance:'trusted-local-operator-assertion'})),
      effects:copy(a.effects)};
  });
  return {conversation_id:cid,authority_closed:!!c.closed,closure_id:c.closed,recipient,
    recipient_accepted_terminal:!!acceptance,waiting_for_terminal:!acceptance,
    work:actions,work_complete_not_implied:!!c.closed,
    terminal_delivery:c.closed?c.participants.map(who=>{
      const box=s.outbox[boxKey(c.closed,who)];return {recipient:who,publication:box.publication?.state||'not-confirmed',
        acceptance:box.acceptance?'durably-accepted':'delivery-unknown',delivered_at:box.acceptance?.delivered_at??null,
        participant_report:s.acceptance[`reported:${boxKey(c.closed,who)}`]||null};
    }):[]};
}

// This profile trusts the local OS operator to choose the binding/endpoint.
// It is NOT a webhook authentication interface. Never fill these constructor
// arguments from a message, PR body, actor_declared or other untrusted text.
export class Controller {
  constructor(ledger,control,{binding,endpoint,...options}) {
    need(id(binding)&&id(endpoint),'FORBIDDEN','Explicit local operator binding/endpoint required');
    this.store=new Store(ledger,control,options);this.binding=binding;this.endpoint=endpoint;
  }
  async command(command) {
    keys(command,['request_id','op','args']);need(id(command.op),'SCHEMA','Unknown command shape');
    const bound={...command,operator_binding:this.binding,operator_endpoint:this.endpoint};
    return this.store.transaction(bound,async context=>{
      const {state:s,policy:p,now,seq,prior}=context;
      need(now+p.clock_uncertainty_ms<=Date.parse(p.valid_until),'FORBIDDEN','Policy expired/clock uncertain');
      const b=p.bindings.find(v=>v.binding_id===this.binding);
      need(b && !b.revoked && b.endpoint===this.endpoint && now+p.clock_uncertainty_ms<=Date.parse(b.expires_at),'FORBIDDEN','Unknown, wrong-endpoint, revoked or expired binding');
      need(Object.hasOwn(operations,command.op),'UNSUPPORTED','Operation not implemented');const operation=operations[command.op];
      operation.authorize(command.args,s,p,b,now);
      // Replays cannot revive authority after endpoint replacement, closure,
      // supersession or policy withdrawal. These gates precede saved results.
      currentAuthority(command.op,command.args,s,p,b,now);
      if(prior)return prior.result;
      const result=operation.run(command.args,s,p,b,now,seq,command.request_id);
      if(command.op!=='refresh')for(const view of Object.values(s.projections))view.dirty=true;
      s.events.push({seq,request_id:command.request_id,operation:command.op,binding:b.binding_id,at:stamp(now)});
      return {profile:'trusted-local-operator',...result};
    });
  }
  async status(cid,recipient) {
    const {last}=await this.store.load(),s=last.state;
    return {...projection(s,cid,recipient),projection:s.projections[`${cid}:${recipient}`]?.dirty===false?'current':'refresh-pending',
      authority:'single-local-controller',remote_identity:'not-implemented',journal_seq:last.seq};
  }
}

function currentAuthority(op,x,s,p,b,now) {
  if(['start','plan_effect','attempt_effect','effect_result'].includes(op)) {
    const a=actionOf(s,x.action_id),c=conversation(s,a.conversation_id);
    boundRecipient(c,b,a.recipient);
    if(op!=='effect_result') {
      authority(c,p,now);
      const r=recordOf(s,a.versions[String(a.latest_version)]);
      need(p.source_revisions.includes(r.source_revision)&&r.policy_ref===p.policy_id,'FORBIDDEN','Action source/policy is no longer approved');
    }
    if(['start','plan_effect'].includes(op))live(c,now);
  }
  if(op==='observe'&&['received','started','completed'].includes(x.record.state))
    boundRecipient(conversation(s,x.record.conversation_id),b,x.record.recipient);
  if(op==='accept')boundRecipient(conversation(s,recordOf(s,x.record_id).conversation_id),b,x.recipient);
  if(['admit','close'].includes(op)) {
    const c=conversation(s,x.record.conversation_id);authority(c,p,now);
    if(op==='close')need(c.closers.includes(b.binding_id),'FORBIDDEN','No closure grant for exchange');
  }
  if(op==='attempt_delivery') {
    const box=s.outbox[x.outbox_key],r=recordOf(s,box.record_id);
    if(r.kind==='action') {
      const c=conversation(s,r.conversation_id);authority(c,p,now);live(c,now);
      need(p.source_revisions.includes(r.source_revision)&&r.policy_ref===p.policy_id,'FORBIDDEN','Action source/policy is no longer approved');
      need(actionOf(s,r.action_id).versions[String(actionOf(s,r.action_id).latest_version)]===r.record_id,'SUPERSEDED','Old version cannot be dispatched');
      checkTime(r.timing,'send-attempt',now,p.clock_uncertainty_ms);
    }
  }
}

const nonblank = (value,max=512) => text(value,max)&&value.trim().length>0;
function resourceScope(value) {
  keys(value,['service','owner','destination','operation']);
  need(Object.values(value).every(v=>nonblank(v)),'SCHEMA','Concrete setup resource scope required');
}
function setupBound(s,x,b) {
  const v=s.setups[x.setup_id];need(v,'MISSING','Setup journal absent');
  need(v.planned_by===b.binding_id&&v.planner_endpoint===b.endpoint,'FORBIDDEN','Setup is bound to its approved local operator endpoint');
  return v;
}
function setupOutcome(x) {
  need(id(x.setup_id)&&['attempted','confirmed','failed','outcome-unknown'].includes(x.state)&&
    (x.resource_id===null||nonblank(x.resource_id))&&typeof x.created_by_setup==='boolean'&&
    (x.cost_note===null||text(x.cost_note)),'SCHEMA','Invalid setup outcome');
  need(!x.created_by_setup||x.state==='confirmed'&&nonblank(x.resource_id),'SCHEMA','Confirmed creation requires concrete resource identity');
  need(x.state!=='confirmed'||nonblank(x.resource_id),'SCHEMA','Confirmed resource cannot be unidentified');
  need(x.state!=='attempted'||x.resource_id===null&&!x.created_by_setup,'SCHEMA','Attempt is not resource proof');
}
function setupHistory(v,op,x,b,now) {
  v.history.push({operation:op,assertion:copy(x),binding:b.binding_id,endpoint:b.endpoint,observed_locally_at:stamp(now),assurance:'local-operator-assertion'});
}

const operations = {
  exchange: {
    authorize(x,s,p,b) {
      keys(x,['conversation_id','participants','max_turns','expires_at','delivery_expires_at','max_delivery_attempts','closers']);allowed(b,'exchange');
      need(id(x.conversation_id)&&arrayIds(x.participants)&&arrayIds(x.closers)&&Number.isInteger(x.max_turns)&&x.max_turns>0&&x.max_turns<=1000,'SCHEMA','Invalid exchange');
      need(iso(x.expires_at)&&iso(x.delivery_expires_at)&&Date.parse(x.delivery_expires_at)>=Date.parse(x.expires_at)&&Number.isInteger(x.max_delivery_attempts)&&x.max_delivery_attempts>=1&&x.max_delivery_attempts<=20,'SCHEMA','Invalid delivery bounds');
      for(const name of x.closers)need(p.bindings.some(g=>g.binding_id===name&&g.rights.includes('close')),'FORBIDDEN','Closer has no policy grant');
      need(x.participants.every(who=>b.recipients.includes(who)),'FORBIDDEN','Participant not granted');
    },
    run(x,s,p,b,now) {
      need(!Object.hasOwn(s.conversations,x.conversation_id),'CONFLICT','Exchange already exists; do not reset budget');
      need(Date.parse(x.expires_at)>=now,'EXPIRED','Exchange already expired');
      const recipient_bindings={};
      for(const who of x.participants) {const matches=p.bindings.filter(g=>g.actor===who&&g.rights.includes('accept'));need(matches.length===1,'POLICY','Recipient binding is missing or ambiguous');recipient_bindings[who]={binding_id:matches[0].binding_id,endpoint:matches[0].endpoint};}
      s.conversations[x.conversation_id]={...copy(x),authority:b.binding_id,authority_endpoint:b.endpoint,recipient_bindings,used:0,admissions:[],closed:null};
      return {exchange:x.conversation_id,open:true};
    }
  },
  admit: {
    authorize(x,s,p,b) { keys(x,['record']);scope(x.record,p,b);need(x.record.kind==='action','SCHEMA','Expected action');allowed(b,'admit',x.record.recipient);need(x.record.timing.desired_at===null||x.record.timing.timing_boundary==='send-attempt','CAPABILITY','This local profile cannot control a scheduled server/recipient/completion boundary'); },
    run({record:r},s,p,b,now) {
      const c=conversation(s,r.conversation_id);
      authority(c,p,now);
      need(r.budget_authority_ref===c.authority&&r.max_turns===c.max_turns,'FORBIDDEN','Budget reference cannot increase authority');
      need(c.participants.includes(r.recipient),'RECIPIENT','Unknown recipient');
      const a=s.actions[r.action_id];
      if(a) {
        need(a.recipient===r.recipient&&a.conversation_id===r.conversation_id&&a.admission_ref===r.admission_ref&&a.turn_index===r.turn_index,'CONFLICT','Frozen action identity changed');
        const existing=a.versions[String(r.content_version)];
        if(existing) { need(s.records[existing]===encode(r).toString(),'CONFLICT','Version content differs');return {action_id:r.action_id,duplicate:true,admission_ref:a.admission_ref}; }
        need(r.content_version===a.latest_version+1,'MISSING_VERSION','Version gap or unknown old version');
        need(r.previous_digest===recordOf(s,a.versions[String(a.latest_version)]).content_sha256,'CONFLICT','Prior digest mismatch');
        live(c,now);need(a.execution==='not-started'&&Object.keys(a.effects).length===0,'RECONCILE','Cannot amend started/unknown effects');
        a.versions[String(r.content_version)]=r.record_id;a.latest_version=r.content_version;
      } else {
        live(c,now);need(r.content_version===1&&r.previous_digest===null,'MISSING_VERSION','First version required');
        need(c.used<c.max_turns&&r.turn_index===c.used+1,'BUDGET','No matching action turn');
        need(r.admission_ref===`admit-${r.action_id}`,'SCHEMA','Admission reference does not match action');
        if(r.in_reply_to!==null)need(recordOf(s,r.in_reply_to).conversation_id===r.conversation_id,'MISSING_PARENT','Wrong parent exchange');
        else need(c.used===0,'MISSING_PARENT','Follow-up needs a parent');
        c.used++;c.admissions.push(r.admission_ref);
        s.actions[r.action_id]={recipient:r.recipient,conversation_id:r.conversation_id,admission_ref:r.admission_ref,turn_index:r.turn_index,
          versions:{'1':r.record_id},latest_version:1,execution:'not-started',observations:[],effects:{}};
      }
      put(s,r);const outbox_key=queue(s,r,r.recipient,c);
      return {action_id:r.action_id,admission_ref:r.admission_ref,outbox_key,duplicate:false};
    }
  },
  observe: {
    authorize(x,s,p,b) {
      keys(x,['record']);scope(x.record,p,b);const r=x.record;need(r.kind==='observation','SCHEMA','Expected observation');
      allowed(b,'observe',r.recipient);need(b.states.includes(r.state),'FORBIDDEN','State assertion not granted');
      if(['received','started','completed'].includes(r.state))need(b.actor===r.recipient,'FORBIDDEN','Only assigned recipient may assert this state');
      if(r.state==='independently_verified')need(b.independent&&b.actor!==r.recipient&&r.verification.independent,'FORBIDDEN','No independent verification grant');
    },
    run({record:r},s,p,b) {
      const a=matchingAction(s,r);
      if(['received','started','completed'].includes(r.state))boundRecipient(conversation(s,r.conversation_id),b,r.recipient);
      if(!put(s,r))return {record_id:r.record_id,duplicate:true};
      a.observations.push(r.record_id);
      // Old-version evidence remains visible but cannot suppress the current
      // approved version's execution guard.
      if(r.content_version===a.latest_version) {
        if(r.state==='completed')a.execution='reported-completed';
        else if(r.state==='started'&&a.execution==='not-started')a.execution='reported-started';
      }
      // Receiving a status record creates neither an action nor an outbox reply.
      return {record_id:r.record_id,reply:'none',assurance:'trusted-local-operator-assertion'};
    }
  },
  close: {
    authorize(x,s,p,b) { keys(x,['record']);scope(x.record,p,b);need(x.record.kind==='closure','SCHEMA','Expected closure');allowed(b,'close'); },
    run({record:r},s,p,b,now) {
      const c=conversation(s,r.conversation_id);
      authority(c,p,now);
      need(c.closers.includes(b.binding_id),'FORBIDDEN','No closure grant for exchange');
      need(encode([...r.recipients].sort()).equals(encode([...c.participants].sort())),'RECIPIENT','Closure recipients frozen by exchange');
      if(c.closed) { need(s.records[c.closed]===encode(r).toString(),'CONFLICT','Exchange already closed with other bytes');return {closed:true,closure_id:c.closed,duplicate:true}; }
      for(const rid of r.result_refs)need(recordOf(s,rid).conversation_id===r.conversation_id,'CONFLICT','Result from other exchange');
      // All mutations below are published in ONE immutable Store transaction.
      put(s,r);c.closed=r.record_id;c.closed_at=stamp(now);
      const outbox_keys=r.recipients.map(who=>queue(s,r,who,c));
      return {closed:true,closure_id:r.record_id,outbox_keys,publication:'pending',recipient_acceptance:'unknown'};
    }
  },
  queue_observation: {
    authorize(x,s,p,b) { keys(x,['record_id','recipient']);allowed(b,'publish',x.recipient);need(id(x.record_id)&&id(x.recipient),'SCHEMA','Invalid queue'); },
    run(x,s) { const r=recordOf(s,x.record_id);need(r.kind==='observation','SCHEMA','Only explicit observation notification');return {outbox_key:queue(s,r,x.recipient,conversation(s,r.conversation_id)),reply:'none'}; }
  },
  attempt_delivery: {
    authorize(x,s,p,b,now) { keys(x,['outbox_key']);const box=s.outbox[x.outbox_key];need(box,'MISSING','Outbox not found');allowed(b,'publish',box.recipient);need(b.capabilities.record_kinds.includes(box.kind),'CAPABILITY','This binding does not cover record kind');need(now+p.clock_uncertainty_ms<=Date.parse(box.expires_at),'DELIVERY_EXPIRED','Delivery window expired');if(box.kind==='action')live(conversation(s,recordOf(s,box.record_id).conversation_id),now); },
    run(x,s,p,b,now,seq,requestId) {
      const box=s.outbox[x.outbox_key],r=recordOf(s,box.record_id),c=conversation(s,r.conversation_id);
      need(now+p.clock_uncertainty_ms<=Date.parse(box.expires_at)&&box.attempts.length<box.max_attempts,'DELIVERY_EXPIRED','Delivery attempts exhausted/expired; acceptance remains unknown');
      if(r.kind==='action') {
        live(c,now);const a=actionOf(s,r.action_id);need(a.versions[String(a.latest_version)]===r.record_id,'SUPERSEDED','Old version cannot be sent as current');
        checkTime(r.timing,'send-attempt',now,p.clock_uncertainty_ms);
      }
      // Closure and authorized late observations deliberately remain eligible.
      box.attempts.push({attempt_id:requestId,send_attempt_at:stamp(now),outcome:'unknown',binding:b.binding_id,endpoint:b.endpoint});
      return {attempt_id:requestId,record_bytes:s.records[box.record_id],record_sha256:hash(Buffer.from(s.records[box.record_id])),recipient:box.recipient};
    }
  },
  publication: {
    authorize(x,s,p,b) {
      keys(x,['outbox_key','attempt_id','record_sha256','object_ref','server_created_at']);const box=s.outbox[x.outbox_key];need(box,'MISSING','Outbox missing');allowed(b,'publish',box.recipient);
      need(text(x.object_ref,512)&&(x.server_created_at===null||iso(x.server_created_at)),'SCHEMA','Invalid publication evidence');
    },
    run(x,s,p,b,now) {
      const box=s.outbox[x.outbox_key],attempt=box.attempts.find(a=>a.attempt_id===x.attempt_id);
      need(attempt&&attempt.binding===b.binding_id&&attempt.endpoint===b.endpoint,'FORBIDDEN','Unknown/rebound publication attempt');
      need(x.record_sha256===hash(Buffer.from(s.records[box.record_id])),'CONFLICT','Publication bytes differ');
      if(box.publication)need(box.publication.object_ref===x.object_ref&&box.publication.server_created_at===x.server_created_at,'CONFLICT','Cannot rewrite original server creation');
      attempt.outcome='published';
      box.publication??={state:'published',object_ref:x.object_ref,server_created_at:x.server_created_at,observed_at:stamp(now),binding:b.binding_id,assurance:'trusted-local-operator-publication-assertion'};
      return {publication:'published',recipient_acceptance:box.acceptance?'durably-accepted':'delivery-unknown'};
    }
  },
  accept: {
    authorize(x,s,p,b) {
      keys(x,['record_id','recipient','record_sha256','delivered_at']);need(id(x.record_id)&&id(x.recipient)&&(x.delivered_at===null||iso(x.delivered_at)),'SCHEMA','Invalid acceptance');
      allowed(b,'accept',x.recipient);need(b.actor===x.recipient,'FORBIDDEN','Only bound intended recipient can assert durable acceptance');
    },
    run(x,s,p,b,now) {
      const r=recordOf(s,x.record_id),c=conversation(s,r.conversation_id),key=boxKey(x.record_id,x.recipient);
      boundRecipient(c,b,x.recipient);
      need(c.participants.includes(x.recipient)&&s.outbox[key],'RECIPIENT','No addressed record for recipient');
      need(b.capabilities.record_kinds.includes(r.kind),'CAPABILITY','Receiver excludes record kind');
      need(x.record_sha256===hash(Buffer.from(s.records[x.record_id])),'CONFLICT','Acceptance digest mismatch');
      if(s.acceptance[key])return {accepted:true,duplicate:true,reply:'none'};
      const evidence={record_id:x.record_id,recipient:x.recipient,digest:x.record_sha256,delivered_at:x.delivered_at,observed_at:stamp(now),binding:b.binding_id,assurance:'trusted-local-operator'};
      s.acceptance[key]=evidence;s.outbox[key].acceptance=evidence;
      if(r.kind==='closure') {
        // Local closed state and invalidation intent commit with acceptance.
        s.local_closed[`${r.conversation_id}:${x.recipient}`]=evidence;
        s.projections[`${r.conversation_id}:${x.recipient}`]={dirty:true,model:null};
      }
      return {accepted:true,reply:'none',remote_identity:'not-verified',delivered_at:x.delivered_at};
    }
  },
  report_acceptance: {
    authorize(x,s,p,b) { keys(x,['record_id','recipient','summary']);allowed(b,'observe',x.recipient);need(text(x.summary),'SCHEMA','Invalid report'); },
    run(x,s,p,b,now) { recordOf(s,x.record_id);s.acceptance[`reported:${boxKey(x.record_id,x.recipient)}`]={summary:x.summary,observed_at:stamp(now),delivered_at:null,label:'participant-reported',observer:b.actor};return {acceptance:'reported-only',delivery:'unknown'}; }
  },
  refresh: {
    authorize(x,s,p,b) { keys(x,['conversation_id','recipient']);allowed(b,'refresh',x.recipient); },
    run(x,s) { const model=projection(s,x.conversation_id,x.recipient);s.projections[`${x.conversation_id}:${x.recipient}`]={dirty:false,model};return {view:model,reply:'none'}; }
  },
  start: {
    authorize(x,s,p,b) { keys(x,['action_id','content_version']);const a=actionOf(s,x.action_id);allowed(b,'start',a.recipient);need(b.actor===a.recipient,'FORBIDDEN','Wrong executor'); },
    run(x,s,p,b,now) {const a=actionOf(s,x.action_id),c=conversation(s,a.conversation_id);authority(c,p,now);boundRecipient(c,b,a.recipient);live(c,now);need(x.content_version===a.latest_version,'SUPERSEDED','Wrong execution version');need(a.execution==='not-started','RECONCILE','Action already started/reported; reconcile');const r=recordOf(s,a.versions[String(a.latest_version)]);checkTime(r.timing,'work-start',now,p.clock_uncertainty_ms);a.execution='started';a.started_at=stamp(now);a.executor_binding=b.binding_id;return {started:true,action_id:x.action_id,external_effect:'not-executed'};}
  },
  plan_effect: {
    authorize(x,s,p,b) {
      keys(x,['action_id','effect_id','target','payload','depends_on','expires_at','provider_profile']);const a=actionOf(s,x.action_id);allowed(b,'effect',a.recipient);need(b.actor===a.recipient,'FORBIDDEN','Wrong effect executor');
      need(id(x.effect_id)&&id(x.target)&&Array.isArray(x.depends_on)&&x.depends_on.every(id)&&iso(x.expires_at)&&['unverified','synthetic-file-v1'].includes(x.provider_profile),'SCHEMA','Invalid effect plan');need(encode(x.payload).length<=32768,'LIMIT','Effect payload too large');
    },
    run(x,s,p,b,now) {
      const a=actionOf(s,x.action_id),c=conversation(s,a.conversation_id);authority(c,p,now);boundRecipient(c,b,a.recipient);need(a.execution==='started','RECONCILE','Start/checkpoint required');live(c,now);
      for(const dep of x.depends_on)need(a.effects[dep],'MISSING','Dependencies must already be planned');
      const immutable={effect_id:x.effect_id,target:x.target,payload_sha256:hash(encode(x.payload)),payload:copy(x.payload),depends_on:[...x.depends_on],expires_at:x.expires_at,provider_profile:x.provider_profile};
      if(a.effects[x.effect_id]) {const {attempts,outcome,result_ref,...old}=a.effects[x.effect_id];need(encode(old).equals(encode({...immutable,key:hash(encode([p.ledger_scope,p.project,x.action_id,x.effect_id,x.target]))})),'CONFLICT','Effect key/payload/target cannot change');return {effect_id:x.effect_id,duplicate:true};}
      a.effects[x.effect_id]={...immutable,key:hash(encode([p.ledger_scope,p.project,x.action_id,x.effect_id,x.target])),attempts:[],outcome:'planned',result_ref:null};
      return {effect_id:x.effect_id,key:a.effects[x.effect_id].key,external_effect:'not-executed'};
    }
  },
  attempt_effect: {
    authorize(x,s,p,b,now) {keys(x,['action_id','effect_id']);const a=actionOf(s,x.action_id);allowed(b,'effect',a.recipient);need(b.actor===a.recipient,'FORBIDDEN','Wrong executor');const e=a.effects[x.effect_id];need(e,'MISSING','Effect not planned');need(now+p.clock_uncertainty_ms<Date.parse(e.expires_at),'KEY_EXPIRED','Key retention expired or uncertain');need(e.outcome!=='confirmed','ALREADY_DONE','Confirmed effect must not repeat');checkTime(recordOf(s,a.versions[String(a.latest_version)]).timing,'work-effect',now,p.clock_uncertainty_ms);},
    run(x,s,p,b,now,seq,requestId) {
      const a=actionOf(s,x.action_id),e=a.effects[x.effect_id];need(e,'MISSING','Effect not planned');
      authority(conversation(s,a.conversation_id),p,now);boundRecipient(conversation(s,a.conversation_id),b,a.recipient);
      need(e.outcome!=='confirmed','ALREADY_DONE','Confirmed effect must not repeat');
      need(now+p.clock_uncertainty_ms<Date.parse(e.expires_at),'KEY_EXPIRED','Key retention expired or uncertain');
      need(e.depends_on.every(dep=>a.effects[dep].outcome==='confirmed'),'RECONCILE','Predecessor not confirmed');
      if(e.attempts.length===0)live(conversation(s,a.conversation_id),now);
      else need(e.provider_profile==='synthetic-file-v1','EXECUTION_UNKNOWN','Unverified downstream guarantee forbids retry');
      need(e.attempts.length<5,'LIMIT','Effect retry budget exhausted');
      e.attempts.push({attempt_id:requestId,at:stamp(now)});e.outcome='unknown';
      return {key:e.key,payload:copy(e.payload),payload_sha256:e.payload_sha256,attempt_id:requestId,profile:e.provider_profile,external_effect:'not-executed-by-controller'};
    }
  },
  effect_result: {
    authorize(x,s,p,b) {
      keys(x,['action_id','effect_id','key','payload_sha256','found','result_ref']);const a=actionOf(s,x.action_id);allowed(b,'effect',a.recipient);need(b.actor===a.recipient,'FORBIDDEN','Wrong executor');need(typeof x.found==='boolean'&&text(x.result_ref,512),'SCHEMA','Invalid result');
    },
    run(x,s) {const e=actionOf(s,x.action_id).effects[x.effect_id];need(e&&e.attempts.length>0,'MISSING','No attempted effect');need(e.key===x.key&&e.payload_sha256===x.payload_sha256,'CONFLICT','Lookup not bound to effect/payload');if(e.outcome==='confirmed')need(x.found&&e.result_ref===x.result_ref,'CONFLICT','Confirmed result evidence is immutable');if(x.found){e.outcome='confirmed';e.result_ref=x.result_ref;}return {outcome:e.outcome,not_found_is_not_retry_permission:!x.found,assurance:'local-operator-result-assertion'};}
  },
  setup_plan: {
    authorize(x,s,p,b) {keys(x,['setup_id','resource_intent','resource_scope','cleanup_authorized']);allowed(b,'setup');resourceScope(x.resource_scope);need(id(x.setup_id)&&nonblank(x.resource_intent,4096)&&typeof x.cleanup_authorized==='boolean','SCHEMA','Invalid setup plan');},
    run(x,s,p,b,now,seq,requestId) {need(!s.setups[x.setup_id],'CONFLICT','Setup already exists; inspect before retry');const v=s.setups[x.setup_id]={...copy(x),state:'planned',resource_id:null,created_by_setup:false,cost_note:null,cleanup:'not-attempted',planned_by:b.binding_id,planner_endpoint:b.endpoint,plan_request_id:requestId,history:[]};setupHistory(v,'setup_plan',x,b,now);return {journal:'planned',plan_request_id:requestId,external_operation:'not-performed'};}
  },
  setup_result: {
    authorize(x,s,p,b) {keys(x,['setup_id','state','resource_id','created_by_setup','cost_note']);allowed(b,'setup');setupOutcome(x);setupBound(s,x,b);},
    run(x,s,p,b,now) {const v=s.setups[x.setup_id];need(v.state==='planned'&&x.state==='attempted'||v.state==='attempted'&&['confirmed','failed','outcome-unknown'].includes(x.state),'RECONCILE','Unknown setup requires explicit setup_reconcile evidence');setupHistory(v,'setup_result',x,b,now);Object.assign(v,copy(x));return {journal:v.state,residual:copy(v),external_operation:'not-performed'};}
  },
  setup_reconcile: {
    authorize(x,s,p,b,now) {
      keys(x,['setup_id','state','resource_id','created_by_setup','cost_note','evidence']);allowed(b,'setup');setupOutcome(x);
      need(['confirmed','failed'].includes(x.state),'SCHEMA','Reconciliation resolves to confirmed or failed');
      const v=setupBound(s,x,b),e=x.evidence;
      keys(e,['resource_scope','setup_request_id','resource_id','observation','source_ref','observed_at']);resourceScope(e.resource_scope);
      need(e.setup_request_id===v.plan_request_id&&encode(e.resource_scope).equals(encode(v.resource_scope))&&e.resource_id===x.resource_id,'SCOPE','Inspection must match the original setup scope and exact resource');
      need(nonblank(e.source_ref)&&iso(e.observed_at)&&Date.parse(e.observed_at)<=now+p.clock_uncertainty_ms,'SCHEMA','Dated inspection source required');
      if(x.state==='confirmed')need(e.observation===(x.created_by_setup?'exists-created-by-setup':'exists-preexisting'),'SCHEMA','Inspection ownership does not match assertion');
      else need(e.observation==='confirmed-absent'&&!x.created_by_setup,'SCHEMA','Failed resolution requires affirmative absence evidence; not a lookup miss');
      need(v.resource_id===null||v.resource_id===x.resource_id,'CONFLICT','Known resource identity cannot be replaced or erased');
    },
    run(x,s,p,b,now) {
      const v=s.setups[x.setup_id];need(v.state==='outcome-unknown','RECONCILE','Only unknown setup outcomes may be reconciled');
      setupHistory(v,'setup_reconcile',x,b,now);
      for(const k of ['state','resource_id','created_by_setup','cost_note'])v[k]=copy(x[k]);
      return {journal:v.state,residual:copy(v),inspection:'operator-attested-not-remotely-verified',external_operation:'not-performed'};
    }
  },
  cleanup_result: {
    authorize(x,s,p,b,now) {
      keys(x,['setup_id','resource_scope','resource_id','outcome','evidence_ref','observed_at']);allowed(b,'setup');resourceScope(x.resource_scope);
      need(id(x.setup_id)&&nonblank(x.resource_id)&&nonblank(x.evidence_ref)&&iso(x.observed_at)&&Date.parse(x.observed_at)<=now+p.clock_uncertainty_ms&&['confirmed-removed','failed'].includes(x.outcome),'SCHEMA','Concrete target and observed cleanup evidence required');
      const v=setupBound(s,x,b);need(v.state==='confirmed'&&v.created_by_setup&&v.cleanup_authorized&&nonblank(v.resource_id),'FORBIDDEN','No authority/proof for scoped cleanup');
      need(v.resource_id===x.resource_id&&encode(v.resource_scope).equals(encode(x.resource_scope)),'SCOPE','Cleanup target differs from approved setup resource');
    },
    run(x,s,p,b,now) {const v=s.setups[x.setup_id];need(v.cleanup!=='confirmed-removed'||x.outcome==='confirmed-removed','CONFLICT','Confirmed cleanup cannot regress');setupHistory(v,'cleanup_result',x,b,now);v.cleanup=x.outcome;return {cleanup:x.outcome,resource_id:v.resource_id,costs_reversed:'not-claimed',assurance:'local-operator-cleanup-assertion',external_operation:'not-performed'};}
  }
};

export function capabilityCoverage(binding) {
  const missing=['action','observation','closure'].filter(k=>!binding.capabilities.record_kinds.includes(k));
  return {missing_record_kinds:missing,complete:missing.length===0,reconciliation:binding.capabilities.reconciliation,
    mode:binding.capabilities.event_types.length?'configured-event-types-not-live-verified':binding.capabilities.reconciliation?'explicit-local-reconciliation':'manual-only',
    acceptance_evidence:binding.capabilities.acceptance_query?'configured-not-live-verified':'unsupported',universal_compatibility:false};
}
