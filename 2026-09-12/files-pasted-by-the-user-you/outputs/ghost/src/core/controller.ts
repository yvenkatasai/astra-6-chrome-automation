import { terminal, type Execution, type Failure, type GateSnapshot, type State } from './types';
const edges:Record<State,State[]> = {
 IDLE:['ARMING','ABORTED'], ARMING:['OBSERVING','FAILED','HUMAN_HANDOFF','ABORTED'],
 OBSERVING:['PREDICTING','FAILED','HUMAN_HANDOFF','ABORTED'], PREDICTING:['VALIDATING','FAILED','HUMAN_HANDOFF','ABORTED'],
 VALIDATING:['OBSERVING','READY','FAILED','HUMAN_HANDOFF','ABORTED'], READY:['ACTIONING','HUMAN_HANDOFF','ABORTED'],
 ACTIONING:['VERIFYING','AMBIGUOUS'], VERIFYING:['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF'],
 SUCCESS:[],FAILED:[],AMBIGUOUS:[],HUMAN_HANDOFF:[],ABORTED:[]
};
export class ActionabilityGate {
 static check(s:GateSnapshot):Failure|undefined {
  const checks:[boolean,Failure][] = [[s.captchaFresh,'CAPTCHA_EXPIRED'],[s.challengeAbsent,'SECURITY_CHALLENGE'],[s.correctPage,'WRONG_TAB'],[s.correctTab,'WRONG_TAB'],[s.browserValid,'WRONG_WINDOW'],[s.focus,'FOCUS_LOST'],[s.pageReady,'PAGE_NOT_READY'],[s.exists,'TARGET_NOT_FOUND'],[s.fresh,'TARGET_STALE'],[s.correctForm,'TARGET_NOT_ACTIONABLE'],[s.correctTarget,'TARGET_NOT_ACTIONABLE'],[s.visible,'TARGET_NOT_ACTIONABLE'],[s.enabled&&s.ariaEnabled,'TARGET_DISABLED'],[s.pointerEvents,'TARGET_NOT_ACTIONABLE'],[s.geometryValid,'GEOMETRY_CHANGED'],[s.overlayAbsent,'OVERLAY_PRESENT'],[s.validationComplete,'VALIDATION_INCOMPLETE'],[s.interactionReady,'INTERACTION_NOT_READY']];
  return checks.find(([ok])=>!ok)?.[1];
 }
}
export class GhostContinueController {
 private used=false;
 constructor(public trace:Execution, private now:()=>number){}
 transition(next:State,kind:string=next,failure?:Failure) {
  if(!edges[this.trace.state].includes(next)) throw new Error(`Illegal transition ${this.trace.state} → ${next}`);
  this.trace.state=next;
  if(next==='ACTIONING'||next==='READY') this.trace.phase='SUBMIT';
  if(next==='VERIFYING') this.trace.phase='CONFIRM';
  if(failure) this.trace.failure=failure;
  this.event(kind,failure);
 }
 event(kind:string,failure?:Failure){
  const t=this.now();this.trace.elapsedMs=t;
  // Bounded in-memory timeline. No I/O in the final gate/action path.
  if(this.trace.events.length>=1500)this.trace.events.splice(1,1);
  this.trace.events.push({sequence:(this.trace.events.at(-1)?.sequence??0)+1,at:t,state:this.trace.state,phase:this.trace.phase,kind,failure});
 }
 arm(){this.transition('ARMING');this.transition('OBSERVING');}
 attempt(snapshot:GateSnapshot,dispatch:()=>void):boolean {
  if(this.used||terminal(this.trace.state)||this.trace.state!=='OBSERVING')return false;
  this.transition('PREDICTING');this.transition('VALIDATING');
  const failure=ActionabilityGate.check(snapshot);
  if(failure){
   if(['CAPTCHA_EXPIRED','SECURITY_CHALLENGE','FOCUS_LOST','WRONG_WINDOW','WRONG_TAB'].includes(failure))this.transition('HUMAN_HANDOFF','Gate blocked',failure);
   else this.transition('OBSERVING','Waiting for actionability',failure);
   return false;
  }
  delete this.trace.failure;
  this.trace.readyAt=this.now();this.transition('READY');
  // Consume authorization BEFORE dispatch, even when dispatch throws.
  this.used=true;this.trace.actions=1;this.transition('ACTIONING');
  this.trace.actionAt=this.now();
  try{dispatch();this.transition('VERIFYING');}
  catch{this.transition('AMBIGUOUS','Dispatch outcome uncertain','ACTION_DISPATCH_FAILED');}
  return true;
 }
 verify(result:'success'|'rejected'|'inventory'|'rate'|'challenge'|'unknown'){
  if(this.trace.state!=='VERIFYING')return;
  if(result==='success'){this.trace.verificationAt=this.now();this.transition('SUCCESS','Positive verification');}
  if(result==='rejected')this.transition('FAILED','Server rejected','SERVER_REJECTED');
  if(result==='inventory')this.transition('FAILED','Inventory unavailable','INVENTORY_UNAVAILABLE');
  if(result==='rate')this.transition('HUMAN_HANDOFF','Rate limited','RATE_LIMITED');
  if(result==='challenge')this.transition('HUMAN_HANDOFF','Security challenge','SECURITY_CHALLENGE');
  if(result==='unknown')this.transition('AMBIGUOUS','No positive result','AMBIGUOUS_RESULT');
 }
 /** One additional slot is available only in the explicitly selected timed mode. */
 timedSecondAttempt(snapshot:GateSnapshot,dispatch:()=>void):boolean {
  if(this.trace.timingMode!=='timed-pair'||this.trace.state!=='VERIFYING'||this.trace.actions!==1||(this.trace.network?.requestCount??0)>0)return false;
  const failure=ActionabilityGate.check(snapshot);
  if(failure){this.event('Second timed slot blocked',failure);return false;}
  this.trace.actions=2;this.event('Second timed action dispatched');
  try{dispatch();}catch{this.transition('AMBIGUOUS','Dispatch outcome uncertain','ACTION_DISPATCH_FAILED');}
  return true;
 }
 stop(handoff=false){
  if(terminal(this.trace.state))return;
  if(this.used){this.transition('AMBIGUOUS','Stopped after dispatch','AMBIGUOUS_RESULT');return;}
  this.transition(handoff?'HUMAN_HANDOFF':'ABORTED');
 }
 timeout(){if(this.used)this.verify('unknown');else if(!terminal(this.trace.state))this.transition('FAILED','Readiness deadline expired',this.trace.failure??'NO_TRANSITION');}
}
