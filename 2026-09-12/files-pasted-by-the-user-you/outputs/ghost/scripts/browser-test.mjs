import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {startRehearsal}=require('../dist/rehearsal.cjs');
const local=await startRehearsal(fileURLToPath(new URL('../dist/',import.meta.url)));
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
const script=await readFile(new URL('../dist/browser.js',import.meta.url),'utf8');
const p={id:'rehearsal',name:'Local',mode:'rehearsal',url:local.origin+'/',pagePath:'/',target:{selector:'[data-testid="continue"]',name:'Continue',role:'button',form:'#booking',minConfidence:.9},validationSelector:'[data-validation="complete"]',interactionReadySelector:'#booking[data-interaction-ready="true"]',expiredCaptchaSelector:'[data-captcha-expired]',challengeSelector:'[data-security-challenge]',successSelector:'[data-result="success"]',successPath:'',failureSelector:'[data-result="rejected"]',inventorySelector:'[data-result="inventory"]',timeoutMs:500,verificationTimeoutMs:200,steps:[],reviewed:true};
const cases=[...['normal','replace','move','overlay','rejected','inventory','rate','ambiguous','challenge','wrongtab','hydration','expired','nohandler'].map(scenario=>({scenario})),...[0,10,25,50,100].map(delay=>({scenario:'normal',delay})),{scenario:'normal',validation:120}];
const results=[];
try{
 await page.goto(local.origin);await page.evaluate(script);
 for(const [i,config]of cases.entries()){
  await page.evaluate(c=>window.rehearsal.prepare({delay:25,validation:10,network:20,...c}),config);
  await page.evaluate(({p,i})=>{window.ghost.start(p,String(i),[],true);window.rehearsal.begin();},{p,i});
  await page.waitForFunction(()=>['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF','ABORTED'].includes(window.ghost.snapshot().state));
  const {t,count}=await page.evaluate(()=>({t:window.ghost.snapshot(),count:window.rehearsal.count}));
  const expected=({rejected:'FAILED',inventory:'FAILED',rate:'HUMAN_HANDOFF',ambiguous:'AMBIGUOUS',challenge:'HUMAN_HANDOFF',wrongtab:'HUMAN_HANDOFF',expired:'HUMAN_HANDOFF',nohandler:'FAILED'})[config.scenario]??'SUCCESS';
  assert.equal(t.state,expected,JSON.stringify({config,t}));assert.ok(count<=1);if(['challenge','wrongtab','expired','nohandler'].includes(config.scenario))assert.equal(count,0);if(expected==='SUCCESS'){assert.equal(count,1);assert.ok(t.verificationAt>=t.actionAt);}
  results.push({config,state:t.state,failure:t.failure,count,deltaMs:t.actionAt===undefined?null:t.actionAt-t.readyAt});
 }
 // Disabled fieldset, stale markers, occlusion, invalid form, and duplicate targets are distinct negative paths.
 for(const [label,patch,expected]of [
  ['invalid form',()=>document.querySelector('#pilgrim').value='','VALIDATION_INCOMPLETE'],
  ['duplicate target',()=>{const b=document.querySelector('[data-testid="continue"]');b.after(b.cloneNode(true));},'TARGET_NOT_FOUND'],
  ['ancestor opacity',()=>document.querySelector('#booking').style.opacity='0','TARGET_NOT_ACTIONABLE'],
  ['disabled fieldset',()=>{const b=document.querySelector('[data-testid="continue"]');const f=document.createElement('fieldset');f.disabled=true;b.before(f);f.append(b);},'TARGET_DISABLED'],
  ['aria disabled',()=>document.querySelector('[data-testid="continue"]').setAttribute('aria-disabled','true'),'TARGET_DISABLED'],
  ['pointer events',()=>document.querySelector('[data-testid="continue"]').style.pointerEvents='none','TARGET_NOT_ACTIONABLE'],
  ['stale success marker',()=>document.querySelector('#result').innerHTML='<b data-result="success">Old result</b>','AMBIGUOUS_RESULT']
 ]){
  await page.goto(local.origin);await page.evaluate(script);await page.evaluate(()=>window.rehearsal.prepare({scenario:'normal',delay:0,validation:0,network:1}));await page.evaluate(patch);
  await page.evaluate(p=>{window.ghost.start(p,crypto.randomUUID(),[],true);window.rehearsal.begin();},p);
  await page.waitForFunction(()=>['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF','ABORTED'].includes(window.ghost.snapshot().state));
  const result=await page.evaluate(()=>({t:window.ghost.snapshot(),count:window.rehearsal.count}));assert.equal(result.count,0,label);assert.equal(result.t.failure,expected,label);results.push({label,state:result.t.state,failure:result.t.failure,count:result.count});
 }
 // Same pathname is insufficient for a hash-routed app. Keep the button color
 // constant while real disabled state changes; color must not affect dispatch.
 for(const scenario of ['exact hash','wrong hash','hash changes while armed','hash removed while armed']){
  await page.goto(local.origin);await page.evaluate(script);
  const route='#/edonationConfirmCurrentSrivani';const profile={...p,url:p.url+route,target:{...p.target,selector:'button#smp'}};
  await page.evaluate(({profile,scenario,route})=>{
   window.rehearsal.prepare({scenario:'normal',delay:100,validation:10,network:10});
   const button=document.querySelector('[data-testid="continue"]');button.id='smp';button.style.backgroundColor='#a30004';
   history.replaceState(null,'','/'+(scenario==='wrong hash'?'#/other':route));
   window.ghost.start(profile,crypto.randomUUID(),[],true);window.rehearsal.begin();
   if(scenario.includes('while armed'))setTimeout(()=>{location.hash=scenario.startsWith('hash removed')?'':'#/other';},10);
  },{profile,scenario,route});
  await page.waitForFunction(()=>['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF','ABORTED'].includes(window.ghost.snapshot().state));
  const result=await page.evaluate(()=>({t:window.ghost.snapshot(),count:window.rehearsal.count}));
  assert.equal(result.count,scenario==='exact hash'?1:0,scenario);
  assert.equal(result.t.state,scenario==='exact hash'?'SUCCESS':'HUMAN_HANDOFF',scenario);
  if(scenario!=='exact hash')assert.equal(result.t.failure,'WRONG_TAB');
  else assert.ok(result.t.actionAt>=90,'Wait for actual enablement despite the constant red background');
  results.push({label:scenario,state:result.t.state,failure:result.t.failure,count:result.count});
 }
 // Minimal independently authored fixture: Continue and the manually completed
 // CAPTCHA field are siblings of the pilgrim form, as in the public template.
 for(const scenario of ['payment route','wrong payment route','invalid Angular form','initial enabled then release','already enabled at arm']){
  await page.goto(local.origin);await page.evaluate(script);
  const profile={...p,url:p.url+'#/edonationConfirmCurrentSrivani',target:{...p.target,selector:'button#smp',form:'.cnt_new.edonat'},validationSelector:'.cnt_new.edonat:has(#othersForm2.ng-valid):has(#captchaInput:valid)',interactionReadySelector:'.cnt_new.edonat:has(#othersForm2.ng-valid):has(button#smp:not(:disabled))',successSelector:'',successPath:'/#/edonationCurrentSrivanipay',requireEnableTransition:true};
  await page.evaluate(({profile,scenario})=>{
   document.body.innerHTML='<section class="cnt_new edonat"><form id="othersForm2" class="ng-valid"><input required value="Local fixture"></form><input id="captchaInput" required value="MANUALLY_COMPLETED_TEST"><button id="smp" disabled>Continue</button></section>';
   if(scenario==='invalid Angular form')document.querySelector('#othersForm2').className='ng-invalid';
   history.replaceState(null,'','/#/edonationConfirmCurrentSrivani');window.fixtureCount=0;
   const button=document.querySelector('#smp');if(scenario.includes('enabled'))button.disabled=false;button.onclick=()=>{window.fixtureCount++;setTimeout(()=>history.replaceState(null,'',['payment route','initial enabled then release'].includes(scenario)?'/#/edonationCurrentSrivanipay':'/#/different'),10);};
   window.ghost.start(profile,crypto.randomUUID(),[],true);if(scenario==='initial enabled then release')setTimeout(()=>button.disabled=true,20);if(scenario!=='already enabled at arm')setTimeout(()=>button.disabled=false,80);
  },{profile,scenario});
  await page.waitForFunction(()=>['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF','ABORTED'].includes(window.ghost.snapshot().state));
  const result=await page.evaluate(()=>({t:window.ghost.snapshot(),count:window.fixtureCount}));
  assert.equal(result.count,['invalid Angular form','already enabled at arm'].includes(scenario)?0:1,scenario);
  assert.equal(result.t.state,['payment route','initial enabled then release'].includes(scenario)?'SUCCESS':['invalid Angular form','already enabled at arm'].includes(scenario)?'FAILED':'AMBIGUOUS',scenario);if(scenario==='initial enabled then release')assert.ok(result.t.actionAt>=70,'Initial enabled state must not authorize dispatch');
  results.push({label:scenario,state:result.t.state,failure:result.t.failure,count:result.count});
 }
 await mkdir('test-results',{recursive:true});await writeFile('test-results/browser.json',JSON.stringify(results,null,2));console.log(`PASS: ${results.length} real Chromium scenarios; no duplicate or false actions.`);
}finally{await browser.close();local.close();}
