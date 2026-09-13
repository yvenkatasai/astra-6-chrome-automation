import {ActionabilityGate,GhostContinueController} from '../core/controller';
import {matchesPageRoute,matchesSuccessRoute} from '../core/routes';
import {responseFailure,verificationFailure} from '../core/network';
import {GhostAI} from '../core/intelligence';
import {terminal,type Execution,type GateSnapshot,type Profile,type TargetEvidence,type TargetSpec,type Step,type NetworkObservation,type TimingMode,type TimedAttempt} from '../core/types';

const WORLD=globalThis as typeof globalThis & {ghost?:ReturnType<typeof createRuntime>};
function createRuntime(){
 let controller:GhostContinueController|undefined;
 let dispose=()=>{};
 let recorderCleanup=()=>{};let networkChanged=()=>{};let networkRequests=new Set<number>();
 let recorded:Step[]=[];
 let lastPicked:TargetSpec|undefined;let cancelStepWait=()=>{};
 const ids=new WeakMap<Element,string>();let serial=0;
 const id=(e:Element)=>{if(!ids.has(e))ids.set(e,`node-${++serial}`);return ids.get(e)!;};
 const query=(s:string):Element[]=>{try{return s?Array.from(document.querySelectorAll(s)):[];}catch{return [];}};
 const visible=(e:Element)=>{const r=e.getBoundingClientRect();if(!e.isConnected||r.width<=0||r.height<=0)return false;for(let n:Element|null=e;n;n=n.parentElement){const s=getComputedStyle(n);if(s.visibility!=='visible'||s.display==='none'||Number(s.opacity)===0)return false;}return true;};
 const shown=(s:string)=>query(s).some(visible);
 const name=(e:Element)=>(e.getAttribute('aria-label')||e.getAttribute('value')||e.textContent||'').trim().replace(/\s+/g,' ');
 function resolve(spec:TargetSpec):{element?:HTMLElement;evidence?:TargetEvidence}{
  const forms=query(spec.form);if(forms.length!==1)return {};
  const candidates=query(spec.selector).filter(e=>forms[0].contains(e));
  const semantic=query('button,[role="button"],input[type="submit"],input[type="button"]').filter(e=>name(e)===spec.name&&forms[0].contains(e));
  const matches=spec.role==='button'&&spec.name?candidates.filter(e=>semantic.includes(e)):candidates;
  if(matches.length!==1)return {};
  const e=matches[0] as HTMLElement;const r=e.getBoundingClientRect();
  return {element:e,evidence:{identity:id(e),confidence:spec.name&&name(e)===spec.name?1:.9,evidence:['unique selector','current document','unique containing form',...(semantic.includes(e)?['semantic button name']:[])],timestamp:performance.now(),geometry:{x:r.x,y:r.y,width:r.width,height:r.height},pageIdentity:location.origin+location.pathname,strategy:semantic.includes(e)?'semantic DOM + stable selector':'stable selector + form'}};
 }
 function inspect(profile:Profile,browserVerified:boolean){
  const begin=performance.now();const {element:e,evidence}=resolve(profile.target);const r=e?.getBoundingClientRect();
  const x=r?(Math.max(0,r.left)+Math.min(r.right,innerWidth))/2:0;
  const y=r?(Math.max(0,r.top)+Math.min(r.bottom,innerHeight))/2:0;
  const hit=r?document.elementFromPoint(x,y):null;
  const form=e?.closest(profile.target.form);const style=e?getComputedStyle(e):undefined;
  const s:GateSnapshot={correctPage:matchesPageRoute(profile.url,profile.pagePath,location.href),correctTab:window.top===window,browserValid:browserVerified,focus:document.hasFocus()&&document.visibilityState==='visible',pageReady:document.readyState!=='loading',interactionReady:!profile.interactionReadySelector||shown(profile.interactionReadySelector),captchaFresh:!shown(profile.expiredCaptchaSelector??''),correctForm:!!form&&query(profile.target.form).length===1,correctTarget:!!evidence&&evidence.confidence>=profile.target.minConfidence,exists:!!e,fresh:!!e?.isConnected&&e.ownerDocument===document,visible:!!e&&visible(e),enabled:!!e&&!e.matches(':disabled')&&!e.hasAttribute('disabled'),ariaEnabled:!!e&&!e.closest('[aria-disabled="true"],[inert]'),pointerEvents:style?.pointerEvents!=='none',overlayAbsent:!!e&&!!hit&&(e===hit||e.contains(hit)),validationComplete:!!form&&!form.querySelector(':invalid,[aria-invalid="true"]')&&shown(profile.validationSelector),challengeAbsent:!shown(profile.challengeSelector),geometryValid:!!r&&r.width>0&&r.height>0&&x>=0&&x<innerWidth&&y>=0&&y<innerHeight&&x>=r.left&&x<r.right&&y>=r.top&&y<r.bottom};
  return {snapshot:s,evidence,element:e,failure:ActionabilityGate.check(s),resolutionMs:performance.now()-begin};
 }
 function start(profile:Profile,executionId:string,samples:number[],browserVerified:boolean,notBeforeMs=0,timing?:{mode:TimingMode;targetTime:number}){
  if(controller&&!terminal(controller.trace.state))throw new Error('An execution is already active.');
  if(profile.mode==='live'&&controller?.trace.actions)throw new Error('A submitted live document cannot be reused. Open a fresh session after inspecting the result.');
  dispose();recorderCleanup();networkRequests=new Set();
  const start=performance.now();const now=()=>performance.now()-start;
  const timed=timing?.mode==='timed-pair';const timedBase=timed?timing.targetTime-Date.now():0;
  if(timed&&(!Number.isFinite(timedBase)||timedBase<0||timedBase>86400000))throw new Error('Timed attempts require a future local-clock target within 24 hours.');
  const trace:Execution={id:executionId,profileId:profile.id,mode:profile.mode,startedAt:new Date().toISOString(),clockOrigin:performance.timeOrigin+start,state:'IDLE',phase:'SUBMIT',events:[],actions:0,elapsedMs:0};
  if(profile.submissionRequestPath)trace.network={requestCount:0,responseObserved:false};
  trace.timingMode=timed?'timed-pair':'readiness';if(timed)trace.timedAttempts=[];
  const recordSlot=(slot:TimedAttempt)=>{trace.timedAttempts!.push(slot);trace.timedAttempts!.sort((a,b)=>a.offsetMs-b.offsetMs);};
  controller=new GhostContinueController(trace,now);const c=controller;const ai=new GhostAI(samples);
  let frame=0;let pending=false;let deadline:ReturnType<typeof setTimeout>;let verificationDeadline:ReturnType<typeof setTimeout>|undefined;
  let fingerprint='';let lastIdentity='';let done=false;let disabledIdentity='';const slotTimers:ReturnType<typeof setTimeout>[]=[];const completedSlots=new Set<number>();
  // A success marker already on the page cannot verify a new submission.
  const successAlready=shown(profile.successSelector)||matchesSuccessRoute(profile.successPath,location.href);
  const cleanup=()=>{if(done)return;done=true;slotTimers.forEach(clearTimeout);if(timed)for(const offsetMs of [400,500])if(!completedSlots.has(offsetMs)){completedSlots.add(offsetMs);recordSlot({offsetMs,at:now(),latenessMs:0,outcome:'cancelled'});}observer.disconnect();cancelAnimationFrame(frame);clearTimeout(deadline);clearTimeout(verificationDeadline);document.removeEventListener('input',schedule,true);document.removeEventListener('change',schedule,true);window.removeEventListener('resize',schedule);window.removeEventListener('scroll',schedule,true);window.removeEventListener('blur',blur);window.removeEventListener('hashchange',schedule);window.removeEventListener('popstate',schedule);document.removeEventListener('visibilitychange',blur);};
  function verify(){
   if(shown(profile.expiredCaptchaSelector??''))c.transition('HUMAN_HANDOFF','Observed expired CAPTCHA','CAPTCHA_EXPIRED');
   else if(shown(profile.challengeSelector))c.verify('challenge');
   else if(shown('[data-result="rate"]'))c.verify('rate');
   else if(shown(profile.failureSelector))c.verify('rejected');
   else if(shown(profile.inventorySelector))c.verify('inventory');
   else if((!trace.network||(trace.network.responseObserved&&trace.network.requestCount===1&&!trace.network.failed&&(trace.network.status??0)>=200&&(trace.network.status??0)<300))&&!successAlready&&(shown(profile.successSelector)||matchesSuccessRoute(profile.successPath,location.href)))c.verify('success');
  }
  function tick(slot?:400|500){
   pending=false;if(done)return;
   if(c.trace.state==='VERIFYING'){verify();if(terminal(c.trace.state)){cleanup();return;}if(slot===undefined)return;}
   if(terminal(c.trace.state)){cleanup();return;}
   const result=inspect(profile,browserVerified);
   if(profile.requireEnableTransition&&!timed){
    if(result.snapshot.correctPage&&result.evidence&&result.snapshot.correctTarget&&!result.snapshot.enabled)disabledIdentity=result.evidence.identity;
    if(!result.evidence||disabledIdentity!==result.evidence.identity){result.snapshot.interactionReady=false;result.failure=ActionabilityGate.check(result.snapshot);}
   }
   if(timed){
    // The fixed-time slots replace transition/history and interaction-marker gating.
    // Actual disablement, page identity, focus, form validity and overlays still apply.
    result.snapshot.interactionReady=true;result.failure=ActionabilityGate.check(result.snapshot);
    if(slot===undefined){if(['CAPTCHA_EXPIRED','SECURITY_CHALLENGE','FOCUS_LOST','WRONG_TAB','WRONG_WINDOW'].includes(result.failure??'')){c.transition('HUMAN_HANDOFF','Timed execution interrupted',result.failure);cleanup();}return;}
   }
   const key=JSON.stringify([result.snapshot,result.evidence?.identity,result.evidence?.geometry,now()>=notBeforeMs]);
   if(slot===undefined&&key===fingerprint)return;fingerprint=key;
   if(result.evidence){
    if(lastIdentity&&lastIdentity!==result.evidence.identity)c.event('DOM target replaced','DOM_REPLACED');
    lastIdentity=result.evidence.identity;trace.target=result.evidence;
   }
   trace.prediction=ai.predict(now(),result.evidence?.confidence??0);trace.resolutionMs=result.resolutionMs;
   if(!timed&&now()<notBeforeMs){
    if(['CAPTCHA_EXPIRED','SECURITY_CHALLENGE','FOCUS_LOST','WRONG_TAB','WRONG_WINDOW'].includes(result.failure??'')){c.transition('HUMAN_HANDOFF','Scheduled execution interrupted',result.failure);cleanup();}
    return;
   }
   if(successAlready){c.transition('HUMAN_HANDOFF','Verification marker already present','AMBIGUOUS_RESULT');cleanup();return;}
   // The final fresh resolution, gate, and DOM dispatch share one JS task.
   // No await, IPC, screenshot, AI inference, or database operation intervenes.
   const dispatched=slot===500&&c.trace.actions===1?c.timedSecondAttempt(result.snapshot,()=>result.element!.click()):c.attempt(result.snapshot,()=>result.element!.click());
   if(slot!==undefined)recordSlot({offsetMs:slot,at:now(),latenessMs:Math.max(0,now()-timedBase-slot),outcome:dispatched?'clicked':'blocked',failure:dispatched?undefined:result.failure});
   if(dispatched){trace.validationMs=trace.readyAt;clearTimeout(deadline);clearTimeout(verificationDeadline);verificationDeadline=setTimeout(()=>{if(trace.network&&c.trace.state==='VERIFYING')c.transition('AMBIGUOUS','Verification deadline expired',verificationFailure(trace.network));else c.timeout();cleanup();},profile.verificationTimeoutMs);verify();}
   if(terminal(c.trace.state))cleanup();
  }
  function runSlot(offset:400|500){
   if(done)return;
   if(now()<timedBase+offset){slotTimers.push(setTimeout(()=>runSlot(offset),Math.max(1,timedBase+offset-now())));return;}
   completedSlots.add(offset);
   if(trace.actions&&(shown(profile.successSelector)||matchesSuccessRoute(profile.successPath,location.href)||!matchesPageRoute(profile.url,profile.pagePath,location.href))){recordSlot({offsetMs:offset,at:now(),latenessMs:Math.max(0,now()-timedBase-offset),outcome:'cancelled'});c.event('Remaining slot cancelled: page progress observed');verify();if(terminal(trace.state))cleanup();return;}
   if((trace.network?.requestCount??0)>0){recordSlot({offsetMs:offset,at:now(),latenessMs:Math.max(0,now()-timedBase-offset),outcome:'cancelled'});c.event('Timed slot cancelled: submission request already observed');return;}
   // Do not bunch two overdue clicks after a stalled renderer.
   if(now()-timedBase-offset>=(offset===400?100:250)){recordSlot({offsetMs:offset,at:now(),latenessMs:now()-timedBase-offset,outcome:'missed'});c.event('Timed slot missed its execution window');}
   else {tick(offset);if(!trace.timedAttempts!.some(a=>a.offsetMs===offset))recordSlot({offsetMs:offset,at:now(),latenessMs:Math.max(0,now()-timedBase-offset),outcome:'cancelled'});}
   if(offset===500&&!trace.actions&&!terminal(trace.state)){c.timeout();cleanup();}
  }
  function schedule(){if(!pending&&!done){pending=true;queueMicrotask(tick);}}
  function loop(){if(done)return;tick();frame=requestAnimationFrame(loop);}
  function blur(){if(!document.hasFocus()||document.visibilityState!=='visible'){if(c.trace.actions)c.verify('unknown');else c.transition('HUMAN_HANDOFF','Input focus lost','FOCUS_LOST');cleanup();}}
  const observer=new MutationObserver(schedule);observer.observe(document,{subtree:true,childList:true,attributes:true,characterData:true});
  document.addEventListener('input',schedule,true);document.addEventListener('change',schedule,true);window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);window.addEventListener('blur',blur);window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);document.addEventListener('visibilitychange',blur);
  networkChanged=()=>{if(!terminal(trace.state)){verify();if(timed&&(trace.network?.requestCount??0)>0){slotTimers.forEach(clearTimeout);for(const offsetMs of [400,500])if(!completedSlots.has(offsetMs)){completedSlots.add(offsetMs);recordSlot({offsetMs,at:now(),latenessMs:0,outcome:'cancelled'});c.event('Remaining timed slot cancelled: submission request observed');}}if(terminal(trace.state))cleanup();}};
  c.arm();if(timed)c.event('Local-clock timed slots armed at target +400 ms and +500 ms');if(profile.requireEnableTransition&&!timed)c.event('Waiting for an observed disabled-to-enabled transition on the current target');deadline=setTimeout(()=>{c.timeout();cleanup();},timed?Math.max(0,timedBase)+500+profile.verificationTimeoutMs:profile.timeoutMs+Math.max(0,notBeforeMs));dispose=cleanup;if(timed)for(const offset of [400,500] as const)slotTimers.push(setTimeout(()=>runSlot(offset),Math.max(0,timedBase+offset)));tick();if(!done)frame=requestAnimationFrame(loop);
  return structuredClone(trace);
 }
 function network(executionId:string,event:NetworkObservation){
  const c=controller;if(!c||c.trace.id!==executionId||c.trace.actions<1||!c.trace.network)return null;
  const n=c.trace.network;
  if(event.kind==='start'){
   if(networkRequests.has(event.requestId))return null;
   networkRequests.add(event.requestId);n.requestCount=networkRequests.size;c.event('Matching submission endpoint request observed');
   if(n.requestCount>1&&c.trace.state==='VERIFYING'){c.transition('AMBIGUOUS','Multiple matching requests; attribution is uncertain','AMBIGUOUS_RESULT');dispose();}
  }else{
   if(!networkRequests.has(event.requestId))return null;
   if(event.kind==='error'){n.failed=true;c.event('Matching request transport failed','NETWORK_FAILED');if(!terminal(c.trace.state)){c.transition('AMBIGUOUS','Delivery is uncertain after a network error','NETWORK_FAILED');dispose();}}
   else {n.responseObserved=true;n.status=event.status;n.durationMs=event.durationMs;n.retryAfterSeconds=event.retryAfterSeconds;c.event('Matching endpoint HTTP '+event.status);const failure=responseFailure(event.status??0);
    if(failure&&!terminal(c.trace.state)){c.transition(failure==='RATE_LIMITED'||failure==='AUTHENTICATION_REQUIRED'?'HUMAN_HANDOFF':'FAILED','Submission endpoint rejected the request',failure);dispose();}
   }
  }
  networkChanged();return structuredClone(c.trace);
 }
 const selector=(e:Element):string=>{
  if(e.id&&query('#'+CSS.escape(e.id)).length===1)return '#'+CSS.escape(e.id);
  for(const attr of ['data-testid','data-test','name','aria-label']){const v=e.getAttribute(attr);if(v&&v.length<100){const s=`${e.tagName.toLowerCase()}[${attr}=${JSON.stringify(v)}]`;if(query(s).length===1)return s;}}
  const parts:string[]=[];let n:Element|null=e;
  while(n&&n!==document.documentElement){const parent:Element|null=n.parentElement;const tag=n.tagName.toLowerCase();const siblings=parent?Array.from(parent.children).filter(x=>x.tagName===n!.tagName):[];parts.unshift(`${tag}:nth-of-type(${siblings.indexOf(n)+1})`);n=parent;}
  return parts.join(' > ');
 };
 const specFor=(e:Element):TargetSpec=>({selector:selector(e),name:e.matches('button,[role="button"]')?name(e).slice(0,100):'',role:e.matches('button,[role="button"]')?'button':'field',form:selector(e.closest('form')??document.body),minConfidence:.9});
 function record(){
  if(controller&&!terminal(controller.trace.state))throw new Error('Stop execution before training.');
  recorderCleanup();recorded=[];
  const click=(event:MouseEvent)=>{
   const e=(event.target as Element).closest('button,input,select,textarea,a,[role="button"]');if(!e)return;
   // Picking never follows links or submits a form.
   event.preventDefault();event.stopImmediatePropagation();lastPicked=specFor(e);
   const action=e.matches('input,textarea')?'Type':e.matches('select')?'Select':'Click';
   recorded.push({id:crypto.randomUUID(),phase:'PREPARE',action,target:lastPicked,value:'',timeout:5000,verification:'',failureBehavior:'handoff'});
   const prior=(e as HTMLElement).style.outline;(e as HTMLElement).style.outline='3px solid #68e3bb';setTimeout(()=>{(e as HTMLElement).style.outline=prior;},700);
  };
  document.addEventListener('click',click,true);recorderCleanup=()=>document.removeEventListener('click',click,true);return true;
 }
 function waitFor(selector:string,timeout:number){return new Promise<void>((resolve,reject)=>{let timer:ReturnType<typeof setTimeout>;const observer=new MutationObserver(check);function cleanup(){observer.disconnect();clearTimeout(timer);cancelStepWait=()=>{};}cancelStepWait=()=>{cleanup();reject(new Error('ABORTED'));};function check(){if(shown(selector)){cleanup();resolve();}}observer.observe(document,{subtree:true,childList:true,attributes:true});timer=setTimeout(()=>{cleanup();reject(new Error('NO_TRANSITION'));},timeout);check();});}
 async function step(s:Step,value:string,profile:Profile){
  if(location.origin!==new URL(profile.url).origin)throw new Error('WRONG_TAB');
  if(!document.hasFocus())throw new Error('FOCUS_LOST');
  if(shown(profile.challengeSelector))throw new Error('SECURITY_CHALLENGE');
  if(s.action==='Wait'||s.action==='Verify'){await waitFor(s.verification||s.target.selector,s.timeout);return;}
  const {element:e}=resolve(s.target);if(!e)throw new Error('TARGET_NOT_FOUND');
  if(s.action==='Vision Click')throw new Error('TARGET_NOT_ACTIONABLE: visual evidence alone requires human handoff');
  if(s.action==='Scroll'){e.scrollIntoView({block:'center',behavior:'instant'});return;}
  // Preparation cannot cross any form-submission boundary.
  if(e.matches(profile.target.selector)||e.matches('button:not([type]),button[type="submit"],input[type="submit"]')||(e.getAttribute('role')==='button'&&/continue|submit|pay|book|confirm/i.test(name(e))))throw new Error('Submission is reserved for the Continue controller.');
  if(!visible(e)||e.matches(':disabled')||e.closest('[aria-disabled="true"],[inert]'))throw new Error('TARGET_NOT_ACTIONABLE');
  if(s.action==='Type'){
   if(!(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement)||e.matches('[type="password"],[autocomplete*="cc-"],[autocomplete="one-time-code"]'))throw new Error('Enter authentication and payment fields manually.');
   const prototype=e instanceof HTMLInputElement?HTMLInputElement.prototype:HTMLTextAreaElement.prototype;Object.getOwnPropertyDescriptor(prototype,'value')!.set!.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
  }else if(s.action==='Select'){if(!(e instanceof HTMLSelectElement))throw new Error('TARGET_NOT_ACTIONABLE');e.value=s.value;e.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(s.action==='Key'){throw new Error('Keyboard steps require manual input; synthesized keys cannot prove application handling.');}
  else {const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);if(!hit||!(e===hit||e.contains(hit)))throw new Error('OVERLAY_PRESENT');e.click();}
  if(s.verification)await waitFor(s.verification,s.timeout);
 }
 return {network,loseFocus:()=>{if(controller&&!terminal(controller.trace.state)){if(controller.trace.actions)controller.verify('unknown');else controller.transition('HUMAN_HANDOFF','Native browser focus lost','FOCUS_LOST');dispose();}},cancelPreparation:()=>cancelStepWait(),start,inspect:(p:Profile,v:boolean)=>{const {element,...r}=inspect(p,v);return r;},snapshot:()=>controller?structuredClone(controller.trace):null,stop:(handoff=false)=>{controller?.stop(handoff);dispose();return controller?.trace;},signal:(result:'rejected'|'rate'|'challenge'|'inventory')=>{if(controller?.trace.actions)controller.verify(result);else if(controller&&!terminal(controller.trace.state))controller.transition('HUMAN_HANDOFF','Observed server response',result==='rate'?'RATE_LIMITED':result==='challenge'?'SECURITY_CHALLENGE':'SERVER_REJECTED');},record,recorded:()=>({steps:recorded,target:lastPicked,pagePath:location.pathname,pageHash:/^#\/[A-Za-z0-9_/-]*$/.test(location.hash)?location.hash:''}),stopRecording:()=>recorderCleanup(),highlight:(target:TargetSpec)=>{const {element}=resolve(target);if(!element)return false;element.scrollIntoView({block:'center'});const old=element.style.outline;element.style.outline='3px solid #68e3bb';setTimeout(()=>element.style.outline=old,1200);return true;},step};
}
if(!WORLD.ghost)WORLD.ghost=createRuntime();
