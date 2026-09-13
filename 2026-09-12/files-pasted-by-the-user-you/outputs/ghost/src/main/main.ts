import {app,BrowserWindow,ipcMain,dialog,session} from 'electron';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {GhostDatabase} from './database';
import {matchesSubmission,retryAfterSeconds,RetryAfterGuard} from '../core/network';
import {GhostWindowGuard} from './window-guard';
import {startRehearsal} from '../rehearsal/server';
import {GhostAI,GhostTimeSync,quantile} from '../core/intelligence';
import {rehearsalProfile,liveProfile,validateProfile,upgradeProfile} from '../core/profiles';
import {terminal,failures,type Execution,type Profile,type Failure,type ChaosReport,type NetworkObservation,type TimingMode} from '../core/types';

const WORLD=1001;const directory=__dirname;
let ui:BrowserWindow;let browser:BrowserWindow|undefined;let db:GhostDatabase;let origin='';let boundProfile:Profile|undefined;
let armedProfile:Profile|undefined;const cooldowns=new Map<string,RetryAfterGuard>();
let latest:Execution|undefined;let activeId:string|undefined;let locked=false;let preparing=false;let prepareCancelled=false;let browserGeneration=0;
let savedId='';let chaosRunning=false;let chaosCancelled=false;let chaosProgress={completed:0,total:0};let chaosReport:ChaosReport|undefined;
const time=new GhostTimeSync();const requests=new Map<string,{wall:number;mono:number}>();
const browserScript=()=>readFileSync(join(directory,'browser.js'),'utf8');
const safeUrl=(raw:string)=>{try{const u=new URL(raw);return u.origin+u.pathname;}catch{return '';}};
function getProfile(id:string){const p=db.profiles().find(p=>p.id===id);if(!p)throw new Error('Profile not found.');return upgradeProfile(p);}
function assertIdle(){if(chaosRunning||locked||preparing||(latest&&!terminal(latest.state)))throw new Error('Stop the current execution first.');}
function requireBrowser(){if(!browser||browser.isDestroyed()||!boundProfile)throw new Error('Open a browser session first.');return browser;}
function guard(){return GhostWindowGuard.inspect(requireBrowser(),new URL(boundProfile!.url).origin);}
async function evaluate(code:string){const w=requireBrowser();return w.webContents.executeJavaScriptInIsolatedWorld(WORLD,[{code}]);}
async function invoke(method:string,...args:unknown[]){return evaluate(`globalThis.ghost.${method}(${args.map(a=>JSON.stringify(a)).join(',')})`);}
async function ensureRuntime(){await evaluate(browserScript());}
function finishHost(failure:Failure,ambiguous=true){if(!latest||terminal(latest.state))return;latest.state=ambiguous?'AMBIGUOUS':'HUMAN_HANDOFF';latest.failure=failure;latest.events.push({sequence:(latest.events.at(-1)?.sequence??0)+1,at:latest.elapsedMs,state:latest.state,phase:latest.phase,kind:'Browser lifecycle interrupted execution',failure});activeId=undefined;saveLatest();}
function saveLatest(){if(latest&&terminal(latest.state)&&savedId!==latest.id){db.saveExecution(latest);savedId=latest.id;}}
async function snapshot(){
 if(browser&&!browser.isDestroyed()&&activeId){try{const t=await invoke('snapshot');if(t&&t.id===activeId&&(!latest||!terminal(latest.state))){latest=t;saveLatest();if(terminal(t.state))activeId=undefined;}}catch{/* Navigation/crash handlers own classification. */}}
 return latest;
}
function retryGuard(p:Profile){const origin=new URL(p.url).origin;let guard=cooldowns.get(origin);if(!guard){guard=new RetryAfterGuard();guard.restore(db.setting<number>('retryAfter:'+origin,0));cooldowns.set(origin,guard);}return guard;}
async function relayNetwork(w:BrowserWindow,id:string,event:NetworkObservation):Promise<boolean>{
 if(browser!==w||w.isDestroyed())return false;
 try{const t=await invoke('network',id,event);if(!t)return false;
  if(latest?.id===id){if(terminal(latest.state)&&!terminal(t.state))return true;latest=t;if(terminal(t.state)){db.saveExecution(t);savedId=id;if(activeId===id)activeId=undefined;}}
  return true;
 }catch{return false;}
}
async function openBrowser(id:string){
 assertIdle();const p=getProfile(id);browserGeneration++;if(browser&&!browser.isDestroyed())browser.close();time.clear();requests.clear();boundProfile=p;
 const partition=`ghost-${randomUUID()}`;const ses=session.fromPartition(partition); // Ephemeral cookies and authentication: never written to disk.
 ses.setPermissionRequestHandler((_w,_permission,callback)=>callback(false));ses.setPermissionCheckHandler(()=>false);
 const w=new BrowserWindow({width:1050,height:840,title:'GHOST · '+p.name,backgroundColor:'#101614',webPreferences:{partition,nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,backgroundThrottling:false}});browser=w;
 const allowed=(url:string)=>{try{return new URL(url).origin===new URL(p.url).origin;}catch{return false;}};
 w.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 w.webContents.on('will-navigate',(event,url)=>{if(!allowed(url)){event.preventDefault();finishHost('WRONG_TAB');}});
 w.webContents.on('will-redirect',(event,url)=>{if(!allowed(url)){event.preventDefault();finishHost('WRONG_TAB');}});
 w.webContents.on('did-start-navigation',(_event,_url,isInPlace,isMainFrame)=>{if(isMainFrame&&!isInPlace&&activeId)finishHost('AMBIGUOUS_RESULT');});
 w.webContents.on('render-process-gone',()=>finishHost('WRONG_WINDOW'));
 w.on('blur',()=>{if(browser===w&&activeId)void invoke('loseFocus').catch(()=>finishHost('FOCUS_LOST'));});
 w.on('minimize',()=>{if(browser===w&&activeId)void invoke('loseFocus').catch(()=>finishHost('FOCUS_LOST'));});
 w.on('closed',()=>{if(browser===w){finishHost('WRONG_WINDOW');browser=undefined;}});
 const traffic=new Map<number,{runId:string;profile:Profile;startedMono:number;accepted:Promise<boolean>}>();
 const header=(headers:Record<string,string[]>|undefined,key:string)=>Object.entries(headers??{}).find(([name])=>name.toLowerCase()===key)?.[1]?.[0];
 ses.webRequest.onBeforeRequest((details,callback)=>{
  // Release the request immediately. Observation never delays or modifies network delivery.
  callback({});if(browser!==w||details.webContentsId!==w.webContents.id||!allowed(details.url))return;
  if(details.resourceType==='mainFrame')requests.set(String(details.id),{wall:Date.now(),mono:performance.now()});
  if(activeId&&armedProfile&&matchesSubmission(armedProfile,details.url,details.method,details.resourceType)){
   const runId=activeId,profile=armedProfile,startedMono=performance.now();
   const accepted=relayNetwork(w,runId,{kind:'start',requestId:details.id});
   traffic.set(details.id,{runId,profile,startedMono,accepted});
  }
 });
 ses.webRequest.onCompleted(details=>{
  if(browser!==w||details.webContentsId!==w.webContents.id||!allowed(details.url))return;
  const start=requests.get(String(details.id));requests.delete(String(details.id));const date=header(details.responseHeaders,'date');
  if(start&&date){const estimate=time.observe(date,start.wall,Date.now(),performance.now());if(estimate)db.saveTime(estimate);}
  const match=traffic.get(details.id);traffic.delete(details.id);const completedMono=performance.now();
  if(match)void match.accepted.then(async accepted=>{
   if(!accepted)return;const seconds=retryAfterSeconds(header(details.responseHeaders,'retry-after'),date);
   if(details.statusCode===429&&seconds!==undefined){const until=retryGuard(match.profile).observe(seconds);db.setSetting('retryAfter:'+new URL(match.profile.url).origin,until);}
   await relayNetwork(w,match.runId,{kind:'response',requestId:details.id,status:details.statusCode,durationMs:completedMono-match.startedMono,retryAfterSeconds:seconds});
  }).catch(()=>{});
 });
 ses.webRequest.onErrorOccurred(details=>{
  requests.delete(String(details.id));const match=traffic.get(details.id);traffic.delete(details.id);
  if(match)void match.accepted.then(accepted=>accepted?relayNetwork(w,match.runId,{kind:'error',requestId:details.id}):false).catch(()=>{});
 });

 await w.loadURL(p.url);await ensureRuntime();w.show();w.focus();return {url:safeUrl(w.webContents.getURL())};
}
async function preflight(id:string){
 const p=validateProfile(getProfile(id));const w=requireBrowser();await ensureRuntime();const g=guard();const observed=await invoke('inspect',p,g.valid);const estimate=time.get();
 const checks=[{name:'Owned browser process',ok:g.valid},{name:'Expected profile session',ok:boundProfile?.id===id},{name:'Exact submission page',ok:observed.snapshot.correctPage},{name:'Profile reviewed',ok:p.reviewed},{name:'Unique target and form',ok:observed.snapshot.exists&&observed.snapshot.correctForm&&observed.snapshot.correctTarget},{name:'Security challenge absent',ok:observed.snapshot.challengeAbsent},{name:'No observed CAPTCHA expiry',ok:observed.snapshot.captchaFresh},{name:'Interaction-ready marker configured',ok:!!p.interactionReadySelector},{name:'Server retry-after cooldown complete',ok:retryGuard(p).remainingMs()===0},{name:'Required information present',ok:await evaluate(`(()=>{const form=document.querySelector(${JSON.stringify(p.target.form)});return !!form&&!form.querySelector(':invalid,[aria-invalid="true"]')})()`)}];
 return {checks,canArm:checks.every(c=>c.ok),focus:g.focused,url:safeUrl(w.webContents.getURL()),observed,time:estimate};
}
async function prepare(id:string,values:Record<string,string>={}){
 assertIdle();const p=getProfile(id);if(boundProfile?.id!==id)throw new Error('Open the selected profile browser.');preparing=true;prepareCancelled=false;const generation=browserGeneration;
 const trace:Execution={id:randomUUID(),profileId:id,mode:p.mode,startedAt:new Date().toISOString(),clockOrigin:Date.now(),state:'OBSERVING',phase:'PREPARE',actions:0,events:[],elapsedMs:0};latest=trace;let currentStep:Profile['steps'][number]|undefined;const start=performance.now();
 try{requireBrowser().focus();await ensureRuntime();for(const [index,step] of p.steps.entries()){
   if(prepareCancelled||generation!==browserGeneration)throw new Error('ABORTED');trace.phase=step.phase;currentStep=step;
   if(step.action==='Type'&&typeof values[step.id]!=='string')throw new Error('Runtime field value required for step '+(index+1));
   await invoke('step',step,values[step.id]??'',p);if(prepareCancelled)throw new Error('ABORTED');db.saveStep(trace.id,index,{phase:step.phase,action:step.action,result:'verified'});trace.events.push({sequence:index+1,at:performance.now()-start,state:'OBSERVING',phase:step.phase,kind:`Step ${index+1}: ${step.action} verified`});
  }
  trace.state='SUCCESS';trace.elapsedMs=performance.now()-start;trace.events.push({sequence:trace.events.length+1,at:trace.elapsedMs,state:'SUCCESS',phase:trace.phase,kind:'Preparation finished; submission requires Arm'});
 }catch(error){trace.state=prepareCancelled||currentStep?.failureBehavior==='abort'?'ABORTED':'HUMAN_HANDOFF';const message=String(error);trace.failure=failures.find(code=>message.includes(code))??'TARGET_NOT_ACTIONABLE';throw error;}
 finally{latest=trace;db.saveExecution(trace);preparing=false;}
 return true;
}
async function simulateFocusLoss(w:BrowserWindow){
 await new Promise<void>((resolve,reject)=>{const deadline=setTimeout(()=>reject(new Error('Focus-loss simulation did not minimize the browser.')),2000);w.once('minimize',()=>{clearTimeout(deadline);resolve();});w.minimize();});
 ui.show();ui.focus();ui.webContents.focus();await invoke('loseFocus');
}
async function arm(id:string,targetTime?:number,timingMode:TimingMode='readiness'){
 if(!['readiness','timed-pair'].includes(timingMode))throw new Error('Unknown timing mode.');
 assertIdle();locked=true;
 try{
  const p=getProfile(id);if(!p.reviewed)throw new Error('Review and save the trained profile first.');
  if(timingMode==='timed-pair'&&(targetTime===undefined||!Number.isFinite(targetTime)||targetTime<=Date.now()||targetTime-Date.now()>86400000||!p.submissionRequestPath))throw new Error('Timed attempts require a future local-clock target within 24 hours and a configured submission endpoint.');
  if(timingMode==='readiness'&&targetTime!==undefined){const estimate=time.get();if(!Number.isFinite(targetTime)||!estimate||Date.now()-estimate.sampledAt>=300000)throw new Error('Scheduled execution requires a fresh website time sample. Use Now to observe actual enablement without clock scheduling.');}
  const check=await preflight(id);if(!check.canArm)throw new Error(check.checks.filter(c=>!c.ok).map(c=>c.name).join('; '));
  const w=requireBrowser();const g=await GhostWindowGuard.focus(w,new URL(p.url).origin);if(!g.focused||!g.valid)throw new Error('FOCUS_LOST: activate the booking window and try a new execution.');
  const delay=timingMode==='timed-pair'?0:targetTime?targetTime-(time.current(performance.now())??Date.now()):0;
  if(!Number.isFinite(delay)||delay>120000||delay< -60000)throw new Error('Target time must be within the next two minutes (or choose Now).');
  const executionId=randomUUID();armedProfile=p;
  // Durable authorization journal BEFORE installing an armed observer. Crash recovery never resumes it.
  latest={id:executionId,profileId:id,mode:p.mode,startedAt:new Date().toISOString(),clockOrigin:Date.now(),state:'ARMING',phase:'SUBMIT',events:[],actions:0,elapsedMs:0};db.saveExecution(latest);activeId=executionId;savedId='';
  const t=await invoke('start',p,executionId,GhostAI.samples(db.history(),id),g.valid,Math.max(0,delay),timingMode==='timed-pair'?{mode:timingMode,targetTime}:undefined);if(activeId===executionId)latest=t;
  if(p.mode==='rehearsal'){
   // Simulator controls live only in its main world; the controller uses an isolated world.
   const scenario=await w.webContents.executeJavaScript('document.querySelector("#scenario").value');
   if(scenario==='focus')await simulateFocusLoss(w);
   await w.webContents.executeJavaScript('window.rehearsal.begin()');
  }
  return latest;
 }catch(error){if(activeId){finishHost('AMBIGUOUS_RESULT');}throw error;}finally{locked=false;}
}
async function stop(handoff=false){prepareCancelled=true;chaosCancelled=true;if(preparing&&browser&&!browser.isDestroyed())await invoke('cancelPreparation').catch(()=>{});if(browser&&!browser.isDestroyed()&&activeId){try{latest=await invoke('stop',handoff);}catch{finishHost('AMBIGUOUS_RESULT');}}activeId=undefined;saveLatest();return latest;}
async function chaos(count:number,seed:number){
 if(![100,500,1000].includes(count)||!Number.isInteger(seed))throw new Error('Choose 100, 500 or 1000 trials and an integer seed.');assertIdle();if(chaosRunning)throw new Error('Chaos already running');
 if(boundProfile?.mode!=='rehearsal')throw new Error('Chaos is available only in the local rehearsal browser.');chaosRunning=true;chaosCancelled=false;chaosProgress={completed:0,total:count};let rng=seed>>>0;const rand=()=>{rng=(1664525*rng+1013904223)>>>0;return rng/4294967296;};
 const results:Execution[]=[];let duplicate=0;let falseAction=0;let stale=0;let unexpected=0;
 try{for(let i=0;i<count;i++){if(chaosCancelled)throw new Error('Chaos suite stopped by user.');
  const scenario=['normal','replace','move','overlay','rejected','inventory','ambiguous','challenge','wrongtab','focus','rate'][Math.floor(rand()*11)];
  const p={...getProfile('rehearsal'),timeoutMs:4000,verificationTimeoutMs:scenario==='ambiguous'?180:1500};
  const w=requireBrowser();await GhostWindowGuard.focus(w,new URL(p.url).origin);await w.webContents.executeJavaScript(`window.rehearsal.prepare(${JSON.stringify({scenario,delay:Math.floor(rand()*100),validation:Math.floor(rand()*100),network:Math.floor(rand()*60)})})`);
  await ensureRuntime();const g=guard();if(!g.focused)throw new Error('FOCUS_LOST: chaos interrupted');const id=randomUUID();activeId=id;armedProfile=p;
  latest=await invoke('start',p,id,GhostAI.samples(results,p.id),g.valid);if(scenario==='focus')await simulateFocusLoss(w);await w.webContents.executeJavaScript('window.rehearsal.begin()');
  // Wait on the actual renderer state; interval is diagnostics transport, not action timing.
  await new Promise<void>((resolve,reject)=>{const timer=setInterval(async()=>{try{await snapshot();if(latest&&terminal(latest.state)){clearInterval(timer);resolve();}}catch(error){clearInterval(timer);reject(error);}},25);});
  const actual=await w.webContents.executeJavaScript('({count:window.rehearsal.count,audit:window.rehearsal.audit})');duplicate+=actual.count>1?1:0;falseAction+=actual.audit.falseActions>0?1:0;stale+=actual.audit.staleActions>0?1:0;results.push(latest!);const expected:Record<string,string>={rejected:'FAILED',inventory:'FAILED',rate:'HUMAN_HANDOFF',ambiguous:'AMBIGUOUS',challenge:'HUMAN_HANDOFF',wrongtab:'HUMAN_HANDOFF',focus:'HUMAN_HANDOFF'};if(latest?.state!==(expected[scenario]??'SUCCESS'))unexpected++;chaosProgress.completed=i+1;
  if(latest?.failure==='FOCUS_LOST'&&scenario!=='focus')throw new Error('Focus lost: chaos stopped.');
 }
 const lat=results.flatMap(t=>t.readyAt!==undefined&&t.actionAt!==undefined?[t.actionAt-t.readyAt]:[]);const verification=results.flatMap(t=>t.verificationAt!==undefined&&t.actionAt!==undefined?[t.verificationAt-t.actionAt]:[]);const mean=(a:number[])=>a.length?a.reduce((a,b)=>a+b,0)/a.length:null;
 const outcomes:Record<string,number>={};for(const t of results){const key=t.failure??t.state;outcomes[key]=(outcomes[key]??0)+1;}
 chaosReport={seed,trials:count,unexpectedOutcomes:unexpected,successRate:results.filter(t=>t.state==='SUCCESS').length/count,falseActionRate:falseAction/count,duplicateActionRate:duplicate/count,staleTargetRate:stale/count,ambiguousRate:results.filter(t=>t.state==='AMBIGUOUS').length/count,meanMs:mean(lat),p50Ms:quantile(lat,.5),p95Ms:quantile(lat,.95),p99Ms:quantile(lat,.99),verificationMeanMs:mean(verification),outcomes};db.setSetting('lastChaos',chaosReport);return chaosReport;
 }finally{chaosRunning=false;activeId=undefined;}
}
if(process.env.GHOST_TEST_DATA)app.setPath('userData',process.env.GHOST_TEST_DATA);
if(app.commandLine.hasSwitch('ghost-software-rendering'))app.disableHardwareAcceleration();
if(!app.requestSingleInstanceLock())app.exit(0);
app.on('second-instance',()=>{const w=activeId&&browser?browser:ui;if(w?.isMinimized())w.restore();w?.show();w?.focus();});
let startupStage='initializing database';
app.whenReady().then(async()=>{
 db=await GhostDatabase.open(join(app.getPath('userData'),'ghost.sqlite'));db.recover();
 startupStage='starting local rehearsal server';
 const simulator=await startRehearsal(directory);origin=simulator.origin;const saved=db.profiles().map(upgradeProfile);for(const p of saved)db.saveProfile(p);const local=saved.find(p=>p.id==='rehearsal');db.saveProfile(local?{...local,url:origin+'/'}:rehearsalProfile(origin));for(const p of saved.filter(p=>p.mode==='rehearsal'&&p.id!=='rehearsal'))db.saveProfile({...p,url:origin+new URL(p.url).pathname});if(!saved.some(p=>p.id==='ttd-srivani'))db.saveProfile(liveProfile());
 startupStage='creating application window';
 ui=new BrowserWindow({width:1440,height:960,minWidth:1120,minHeight:760,title:'GHOST · Srivani Booking Assistant',backgroundColor:'#0d1114',webPreferences:{preload:join(directory,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true}});
 ui.webContents.setWindowOpenHandler(()=>({action:'deny'}));ui.webContents.on('will-navigate',e=>e.preventDefault());
 const handlers:Record<string,(...args:any[])=>unknown>={
  status:async()=>{await snapshot();return {browser:browser&&!browser.isDestroyed()?{connected:true,url:safeUrl(browser.webContents.getURL()),...guard()}:null,execution:latest,time:time.get(),websiteNow:time.current(performance.now()),chaosRunning,chaosProgress,chaosReport:chaosReport??db.setting('lastChaos',null),platform:process.platform,preparing,version:app.getVersion(),rateLimitRemainingMs:boundProfile?retryGuard(boundProfile).remainingMs():0};},
  profiles:()=>db.profiles(),saveProfile:(input:unknown)=>{assertIdle();const p=validateProfile(input);if(p.mode==='rehearsal'&&new URL(p.url).origin!==origin)throw new Error('Use this session’s rehearsal URL.');db.saveProfile(p);return p;},openBrowser,preflight,prepare,arm,stop,
  record:async()=>{assertIdle();requireBrowser().focus();await ensureRuntime();return invoke('record');},recorded:()=>invoke('recorded'),stopRecording:()=>invoke('stopRecording'),highlight:async(input:unknown)=>{const p=validateProfile(input);requireBrowser().focus();return invoke('highlight',p.target);},history:()=>db.history(),
  export:async()=>{const result=await dialog.showSaveDialog(ui,{title:'Export sanitized diagnostic history',defaultPath:'ghost-diagnostics.json',filters:[{name:'JSON',extensions:['json']}]});if(result.canceled||!result.filePath)return false;const histories=db.history().map(t=>({...t,target:t.target?{...t.target,pageIdentity:new URL(t.target.pageIdentity).origin}:undefined}));writeFileSync(result.filePath,JSON.stringify({version:1,exportedAt:new Date().toISOString(),executions:histories,chaos:chaosReport??db.setting('lastChaos',null)},null,2));return true;},
  settings:()=>db.setting('preferences',{compact:false}),saveSettings:(value:unknown)=>{if(!value||typeof value!=='object'||typeof (value as any).compact!=='boolean')throw new Error('Invalid settings');db.setSetting('preferences',{compact:(value as any).compact});return true;},chaos
 };
 for(const [name,handler]of Object.entries(handlers))ipcMain.handle('ghost:'+name,(event,...args)=>{if(event.sender!==ui.webContents||event.senderFrame!==ui.webContents.mainFrame)throw new Error('Untrusted IPC sender');return handler(...args);});
 startupStage='loading application interface';await ui.loadFile(join(directory,'ui/index.html'));
 app.on('before-quit',()=>simulator.close());
}).catch(error=>{
 const detail=error instanceof Error?error.stack??error.message:String(error);
 const report=join(tmpdir(),`GHOST-startup-${process.pid}.log`);
 let saved=false;try{writeFileSync(report,`GHOST ${app.getVersion()}\nPlatform: ${process.platform} ${process.arch}\nStage: ${startupStage}\n${detail}\n`,{mode:0o600});saved=true;}catch{}
 dialog.showErrorBox('GHOST could not start',`Failed while ${startupStage}.\n\n${error instanceof Error?error.message:String(error)}\n\n${saved?'Startup report: '+report:'The startup report could not be written.'}`);
 app.exit(1);
});
app.on('window-all-closed',()=>app.quit());
