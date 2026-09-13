import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const {startRehearsal}=require('../dist/rehearsal.cjs');
const local=await startRehearsal(fileURLToPath(new URL('../dist/',import.meta.url)));
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();
const script=await readFile(new URL('../dist/browser.js',import.meta.url),'utf8');
const p={id:'timed',name:'Local timed fixture',mode:'rehearsal',url:local.origin+'/',pagePath:'/',target:{selector:'[data-testid="continue"]',name:'Continue',role:'button',form:'#booking',minConfidence:.9},validationSelector:'[data-validation="complete"]',interactionReadySelector:'#intentionally-missing',requireEnableTransition:true,expiredCaptchaSelector:'[data-captcha-expired]',challengeSelector:'[data-security-challenge]',successSelector:'[data-result="success"]',successPath:'',failureSelector:'[data-result="rejected"]',inventorySelector:'[data-result="inventory"]',submissionRequestPath:'/result',submissionRequestMethod:'GET',timeoutMs:500,verificationTimeoutMs:250,steps:[],reviewed:true};
const results=[];
try{
 for(const scenario of ['two slots','enable between slots','still disabled','request observed','page progress','invalid form','abort','stalled renderer']){
  await page.goto(local.origin);await page.evaluate(script);
  const targetTime=await page.evaluate(({p,scenario})=>{
   const delay=scenario==='still disabled'?5000:scenario==='enable between slots'?550:0;
   window.rehearsal.prepare({scenario:'norequest',delay,validation:0,network:10});
   if(scenario==='invalid form')document.querySelector('#pilgrim').value='';
   const targetTime=Date.now()+100;
   window.ghost.start(p,'timed-test',[],true,0,{mode:'timed-pair',targetTime});window.rehearsal.begin();
   if(scenario==='request observed')document.querySelector('[data-testid="continue"]').addEventListener('click',()=>window.ghost.network('timed-test',{kind:'start',requestId:1}));
   if(scenario==='page progress')document.querySelector('[data-testid="continue"]').addEventListener('click',()=>{document.querySelector('#result').innerHTML='<b data-result="success">Next step</b>';});
   if(scenario==='abort')setTimeout(()=>window.ghost.stop(),200);
   if(scenario==='stalled renderer')setTimeout(()=>{const end=performance.now()+500;while(performance.now()<end){}},450);
   return targetTime;
  },{p,scenario});
  await page.waitForFunction(()=>['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF','ABORTED'].includes(window.ghost.snapshot().state));
  const {t,count}=await page.evaluate(()=>({t:window.ghost.snapshot(),count:window.rehearsal.count}));
  const expected={'two slots':2,'enable between slots':1,'still disabled':0,'request observed':1,'page progress':1,'invalid form':0,'abort':0,'stalled renderer':0}[scenario];
  assert.equal(count,expected,JSON.stringify({scenario,t}));assert.equal(t.actions,expected);
  assert.equal(t.timedAttempts.length,2,JSON.stringify(t));
  if(scenario==='two slots'){
   assert.deepEqual(t.timedAttempts.map(a=>a.offsetMs),[400,500]);
   assert.ok(t.timedAttempts.every(a=>a.outcome==='clicked'));
   for(const slot of t.timedAttempts)assert.ok(slot.at+t.clockOrigin>=targetTime+slot.offsetMs-2,'No early click');
  }
  if(['request observed','page progress'].includes(scenario))assert.equal(t.timedAttempts[1].outcome,'cancelled');
  if(scenario==='enable between slots')assert.deepEqual(t.timedAttempts.map(a=>a.outcome),['blocked','clicked']);
  results.push({scenario,actions:t.actions,state:t.state,failure:t.failure,slots:t.timedAttempts});
 }
 await mkdir('test-results',{recursive:true});await writeFile('test-results/timed.json',JSON.stringify(results,null,2));console.log(`PASS: ${results.length} real Chromium timed-mode scenarios.`);
}finally{await browser.close();local.close();}
