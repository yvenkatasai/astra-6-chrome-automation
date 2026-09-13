import {_electron as electron} from 'playwright';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
// Independent fixture rendered only in the owned local rehearsal browser.
const fixtureHtml=`<!doctype html><html><body><select id="scenario" hidden><option>normal</option></select><section class="cnt_new edonat"><form id="othersForm2" class="ng-valid"><input required value="Local fixture"></form><input id="captchaInput" required value="MANUALLY_COMPLETED_TEST"><button id="smp" disabled>Continue</button></section><script>window.fixtureCount=0;window.rehearsal={begin(){setTimeout(()=>document.querySelector('#smp').disabled=false,100)}};document.querySelector('#smp').onclick=async()=>{window.fixtureCount++;const response=await fetch('/dms/continue',{method:'POST'});const data=await response.json();if(data.message==='SUCCESS')location.hash='/edonationCurrentSrivanipay';};</script></body></html>`;
await mkdir('test-results',{recursive:true});
const data=await mkdtemp(resolve('test-results/layers-data-'));
const app=await electron.launch({args:[process.env.GHOST_APP_PATH||'.'],env:{...process.env,GHOST_TEST_DATA:data},timeout:30000});
const results=[];
try{
 const ui=await app.firstWindow();await ui.waitForSelector('h1');
 async function finish(expectResponse=false){let result;for(let i=0;i<260;i++){result=await ui.evaluate(()=>window.ghost.status());if(['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF'].includes(result.execution?.state)&&(!expectResponse||result.execution.network?.responseObserved))return result.execution;await new Promise(r=>setTimeout(r,25));}throw Error('No final evidence: '+JSON.stringify(result));}
 const profiles=await ui.evaluate(()=>window.ghost.profiles());const adapter={...profiles.find(p=>p.mode==='live'),id:'adapter-fixture',name:'Public structure fixture',mode:'rehearsal',reviewed:true,url:profiles.find(p=>p.id==='rehearsal').url+'#/edonationConfirmCurrentSrivani'};
 await ui.evaluate(p=>window.ghost.saveProfile(p),adapter);await ui.evaluate(()=>window.ghost.openBrowser('adapter-fixture'));
 const adapterPage=app.windows().find(w=>w!==ui);await adapterPage.setContent(fixtureHtml);await adapterPage.evaluate(()=>history.replaceState(null,'','/#/edonationConfirmCurrentSrivani'));
 const readiness=await ui.evaluate(()=>window.ghost.preflight('adapter-fixture'));assert.equal(readiness.canArm,true,JSON.stringify(readiness));assert.ok(!readiness.checks.some(c=>c.name==='Fresh website time sample'));
 await ui.evaluate(()=>window.ghost.arm('adapter-fixture'));const adapterTrace=await finish(true);
 assert.equal(adapterTrace.state,'SUCCESS',JSON.stringify(adapterTrace));assert.equal(adapterTrace.actions,1);assert.equal(adapterTrace.network.requestCount,1);assert.equal(adapterTrace.network.status,200);
 assert.equal(await app.windows().find(w=>w!==ui).evaluate(()=>window.fixtureCount),1);
 results.push({scenario:'public site adapter on local HTTP fixture',state:adapterTrace.state,actions:adapterTrace.actions,network:adapterTrace.network});
 for(const secondRequired of [false,true]){
  await ui.evaluate(()=>window.ghost.openBrowser('adapter-fixture'));const page=app.windows().find(w=>w!==ui);await page.setContent(fixtureHtml);await page.evaluate(()=>history.replaceState(null,'','/#/edonationConfirmCurrentSrivani'));
  if(secondRequired)await page.evaluate(()=>{document.querySelector('#smp').onclick=async()=>{window.fixtureCount++;if(window.fixtureCount===1)return;const r=await fetch('/dms/continue',{method:'POST'});if((await r.json()).message==='SUCCESS')location.hash='/edonationCurrentSrivanipay';};});
  await ui.evaluate(()=>window.ghost.arm('adapter-fixture',Date.now()+200,'timed-pair'));const t=await finish(true);
  assert.equal(t.state,'SUCCESS',JSON.stringify(t));assert.equal(t.actions,secondRequired?2:1);assert.equal(t.network.requestCount,1);assert.equal(t.timedAttempts.length,2);assert.equal(t.timedAttempts[1].outcome,secondRequired?'clicked':'cancelled');
  assert.equal(await page.evaluate(()=>window.fixtureCount),secondRequired?2:1);
  results.push({scenario:secondRequired?'timed second slot starts submission':'timed first request cancels second slot',state:t.state,actions:t.actions,network:t.network,slots:t.timedAttempts});
 }
 await ui.bringToFront();await ui.getByRole('button',{name:'Execution',exact:true}).click();await ui.getByLabel('Timing mode').selectOption('timed-pair');await ui.getByText('I authorize up to two timed Continue clicks at +400 ms and +500 ms.',{exact:true}).waitFor();await ui.getByText('Two timed slots · cancel on progress',{exact:true}).waitFor();await ui.screenshot({path:'test-results/timed-execution.png',fullPage:true});

 for(const [scenario,state,failure,count,status]of [
  ['hydration','SUCCESS',undefined,1,200],['nohandler','FAILED','INTERACTION_NOT_READY',0,undefined],
  ['expired','HUMAN_HANDOFF','CAPTCHA_EXPIRED',0,undefined],['norequest','AMBIGUOUS','NETWORK_NOT_OBSERVED',1,undefined],
  ['http403','FAILED','SERVER_REJECTED',1,403],['http401','HUMAN_HANDOFF','AUTHENTICATION_REQUIRED',1,401],
  ['ambiguous','AMBIGUOUS','NO_TRANSITION',1,200],['transport','AMBIGUOUS','NETWORK_FAILED',1,undefined],
  ['wrongmethod','AMBIGUOUS','NETWORK_NOT_OBSERVED',1,undefined],['duplicate','AMBIGUOUS','AMBIGUOUS_RESULT',1,200],['noise','SUCCESS',undefined,1,200],['ratelimit','HUMAN_HANDOFF','RATE_LIMITED',1,429]
 ]){
  await ui.evaluate(()=>window.ghost.openBrowser('rehearsal'));const page=app.windows().find(w=>w!==ui);
  await page.evaluate(scenario=>{document.querySelector('#scenario').value=scenario;window.rehearsal.prepare({scenario,delay:25,validation:10,network:20,handlerDelay:150});},scenario);
  await ui.evaluate(()=>window.ghost.arm('rehearsal'));const t=await finish(status!==undefined);
  assert.equal(t.state,state,JSON.stringify(t));assert.equal(t.failure,failure,JSON.stringify(t));assert.equal(await page.evaluate(()=>window.rehearsal.count),count);
  if(status!==undefined)assert.equal(t.network.status,status);
  if(scenario==='duplicate')assert.equal(t.network.requestCount,2);
  if(scenario==='wrongmethod')assert.equal(t.network.requestCount,0);
  if(scenario==='hydration'){assert.ok(t.readyAt>=150);assert.ok(t.events.some(e=>e.failure==='INTERACTION_NOT_READY'));}
  if(scenario==='ratelimit'){
   assert.equal(t.network.retryAfterSeconds,2);const check=await ui.evaluate(()=>window.ghost.preflight('rehearsal'));assert.equal(check.canArm,false);
   await ui.evaluate(()=>window.ghost.openBrowser('rehearsal'));await assert.rejects(()=>ui.evaluate(()=>window.ghost.arm('rehearsal')),/cooldown/);
  }
  results.push({scenario,state:t.state,failure:t.failure,actions:t.actions,network:t.network,readyAt:t.readyAt});
 }
 await ui.bringToFront();await ui.getByRole('button',{name:'Diagnostics',exact:true}).click();await ui.getByText('Submission request evidence',{exact:true}).waitFor();await ui.screenshot({path:'test-results/layers-dashboard.png',fullPage:true});
 await writeFile('test-results/layers.json',JSON.stringify({platform:process.platform,results},null,2));
 console.log(`PASS: ${results.length} desktop layer scenarios, including the site adapter with a real local POST and hash transition.`);
}finally{await app.close();}
