import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';import {createRequire}from'node:module';import{readFile,writeFile,mkdir}from'node:fs/promises';import assert from'node:assert/strict';
const require=createRequire(import.meta.url);const{startRehearsal}=require('../dist/rehearsal.cjs');const local=await startRehearsal(fileURLToPath(new URL('../dist/',import.meta.url)));
const count=Number(process.argv[2]||1000),seed=Number(process.argv[3]||314159);assert.ok([100,500,1000].includes(count));let state=seed>>>0;const random=()=>{state=(1664525*state+1013904223)>>>0;return state/4294967296;};
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();const script=await readFile('dist/browser.js','utf8');
const p={id:'rehearsal',name:'Local',mode:'rehearsal',url:local.origin+'/',pagePath:'/',target:{selector:'[data-testid="continue"]',name:'Continue',role:'button',form:'#booking',minConfidence:.9},validationSelector:'[data-validation="complete"]',challengeSelector:'[data-security-challenge]',successSelector:'[data-result="success"]',successPath:'',failureSelector:'[data-result="rejected"]',inventorySelector:'[data-result="inventory"]',timeoutMs:500,verificationTimeoutMs:150,steps:[],reviewed:true};
const rows=[];let duplicates=0,falseActions=0,unexpected=0;
const q=(a,v)=>a.length?[...a].sort((a,b)=>a-b)[Math.floor((a.length-1)*v)]:null;
try{await page.goto(local.origin);await page.evaluate(script);
for(let i=0;i<count;i++){
 const config={scenario:['normal','replace','move','overlay','rejected','inventory','rate','ambiguous','challenge','wrongtab'][Math.floor(random()*10)],delay:Math.floor(random()*101),validation:Math.floor(random()*101),network:Math.floor(random()*51)};
 const trialProfile={...p,verificationTimeoutMs:config.scenario==='ambiguous'?150:1500};
 const samples=rows.filter(r=>r.trace.state==='SUCCESS').slice(-200).map(r=>r.trace.validationMs);
 await page.evaluate(({config,p,i,samples})=>{window.rehearsal.prepare(config);window.ghost.start(p,String(i),samples,true);window.rehearsal.begin();},{config,p:trialProfile,i,samples});
 await page.waitForFunction(()=>['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF','ABORTED'].includes(window.ghost.snapshot().state),{},{polling:10});
 const row=await page.evaluate(()=>({trace:window.ghost.snapshot(),count:window.rehearsal.count,audit:window.rehearsal.audit}));
 const expected=({rejected:'FAILED',inventory:'FAILED',rate:'HUMAN_HANDOFF',ambiguous:'AMBIGUOUS',challenge:'HUMAN_HANDOFF',wrongtab:'HUMAN_HANDOFF'})[config.scenario]??'SUCCESS';
 if(row.count>1)duplicates++;if(row.audit.falseActions>0)falseActions++;if(row.trace.state!==expected)unexpected++;
 rows.push({trial:i,config,...row});if((i+1)%100===0)console.log(`${i+1}/${count} trials; duplicates ${duplicates}; false actions ${falseActions}; unexpected ${unexpected}`);
}
const lat=rows.flatMap(r=>r.trace.actionAt===undefined?[]:[r.trace.actionAt-r.trace.readyAt]);const verify=rows.flatMap(r=>r.trace.verificationAt===undefined?[]:[r.trace.verificationAt-r.trace.actionAt]);const outcomes={};for(const r of rows){const key=r.trace.failure??r.trace.state;outcomes[key]=(outcomes[key]??0)+1;}
const report={environment:'Headless Google Chrome, macOS ARM64; real DOM and loopback HTTP; not Windows native latency',seed,trials:count,successRate:rows.filter(r=>r.trace.state==='SUCCESS').length/count,falseActionRate:falseActions/count,duplicateActionRate:duplicates/count,unexpectedOutcomes:unexpected,staleTargetRate:rows.filter(r=>r.audit.staleActions>0).length/count,ambiguousRate:rows.filter(r=>r.trace.state==='AMBIGUOUS').length/count,meanMs:lat.reduce((a,b)=>a+b,0)/lat.length,p50Ms:q(lat,.5),p95Ms:q(lat,.95),p99Ms:q(lat,.99),verificationMeanMs:verify.reduce((a,b)=>a+b,0)/verify.length,outcomes};
await mkdir('test-results',{recursive:true});await writeFile(`test-results/chaos-${count}.json`,JSON.stringify({report,trials:rows},null,2));console.log(JSON.stringify(report,null,2));assert.equal(duplicates,0);assert.equal(falseActions,0);assert.equal(unexpected,0);
}finally{await browser.close();local.close();}
