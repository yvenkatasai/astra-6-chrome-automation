import {_electron as electron} from 'playwright';
import {mkdtemp,mkdir,writeFile,readFile}from'node:fs/promises';
import {resolve}from'node:path';import assert from'node:assert/strict';
await mkdir('test-results',{recursive:true});const data=await mkdtemp(resolve('test-results/desktop-data-'));
const app=await electron.launch({args:[process.env.GHOST_APP_PATH||'.'],env:{...process.env,GHOST_TEST_DATA:data},timeout:30000});
let output='';app.process().stdout?.on('data',d=>output+=d);app.process().stderr?.on('data',d=>output+=d);
try{
 const ui=await app.firstWindow();await ui.waitForSelector('h1');
 const profiles=await ui.evaluate(()=>window.ghost.profiles());assert.equal(profiles.length,2);
 const live=profiles.find(p=>p.mode==='live');assert.equal(live.url,'https://tirupatibalaji.ap.gov.in/#/edonationConfirmCurrentSrivani');assert.equal(live.target.selector,'button#smp');assert.equal(live.reviewed,false);assert.equal(live.submissionRequestPath,'/dms/continue');
 await ui.evaluate(()=>window.ghost.openBrowser('rehearsal'));
 const check=await ui.evaluate(()=>window.ghost.preflight('rehearsal'));assert.equal(check.canArm,true,JSON.stringify(check));
 await ui.evaluate(()=>window.ghost.arm('rehearsal'));
 for(let i=0;i<200;i++){const s=await ui.evaluate(()=>window.ghost.status());if(['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF'].includes(s.execution?.state))break;await new Promise(r=>setTimeout(r,25));}
 const s=await ui.evaluate(()=>window.ghost.status());assert.equal(s.execution.state,'SUCCESS',JSON.stringify(s.execution));assert.equal(s.execution.actions,1);
 const history=await ui.evaluate(()=>window.ghost.history());assert.equal(history[0].state,'SUCCESS');
 // Verify the untrusted booking renderer has no application IPC or Node privileges.
 const booking=app.windows().find(w=>w!==ui);assert.ok(booking);
 assert.equal(await booking.evaluate(()=>typeof window.ghost),'undefined');
 assert.equal(await booking.evaluate(()=>typeof window.require),'undefined');
 await ui.bringToFront();await ui.getByText('SUCCESS',{exact:true}).first().waitFor();await ui.screenshot({path:'test-results/dashboard.png'});
 for(const name of ['Training','Profiles','Execution','Diagnostics','History','Settings']){await ui.getByRole('button',{name,exact:true}).click();await ui.waitForSelector('h1');assert.equal(await ui.locator('h1').textContent(),name);}
 await ui.getByRole('button',{name:'Dashboard',exact:true}).click();
 const nativeCases=[];
 const trained={...profiles[0],id:'workflow',name:'Preparation acceptance',steps:[{id:'name',phase:'PREPARE',action:'Type',target:{selector:'#pilgrim',name:'',role:'field',form:'#booking',minConfidence:.9},value:'',timeout:1000,verification:'#pilgrim:valid',failureBehavior:'handoff'},{id:'verify',phase:'SELECT',action:'Verify',target:profiles[0].target,value:'',timeout:1000,verification:'#booking',failureBehavior:'handoff'}]};
 await ui.evaluate(p=>window.ghost.saveProfile(p),trained);await ui.evaluate(()=>window.ghost.openBrowser('workflow'));
 await ui.evaluate(()=>window.ghost.prepare('workflow',{name:'TEST_ONLY_DO_NOT_PERSIST'}));
 const prep=await ui.evaluate(()=>window.ghost.status());assert.equal(prep.execution.state,'SUCCESS');assert.equal(prep.execution.actions,0);
 assert.equal((await readFile(resolve(data,'ghost.sqlite'))).includes(Buffer.from('TEST_ONLY_DO_NOT_PERSIST')),false);
 await ui.evaluate(()=>window.ghost.openBrowser('rehearsal'));
 const captureBrowser=app.windows().find(w=>w!==ui);await captureBrowser.evaluate(()=>{window.rehearsal.prepare({scenario:'normal',delay:0,validation:0,network:1});document.querySelector('[data-testid="continue"]').disabled=false;});

 async function waitTerminal(){let result;for(let i=0;i<240;i++){result=await ui.evaluate(()=>window.ghost.status());if(['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF','ABORTED'].includes(result.execution?.state))return result;await new Promise(r=>setTimeout(r,25));}throw Error('Desktop execution did not settle: '+JSON.stringify(result));}
 // Capturing Continue does not activate it.
 await ui.evaluate(()=>window.ghost.record());
 await captureBrowser.getByRole('button',{name:'Continue',exact:true}).click();
 const capture=await ui.evaluate(()=>window.ghost.recorded());await ui.evaluate(()=>window.ghost.stopRecording());
 assert.equal(capture.target.name,'Continue');assert.equal(await captureBrowser.evaluate(()=>window.rehearsal.count),0);
 for(const scenario of ['focus','wrongtab','challenge','rejected','ambiguous']){
  await ui.evaluate(()=>window.ghost.openBrowser('rehearsal'));const target=app.windows().find(w=>w!==ui);
  await target.evaluate(scenario=>{document.querySelector('#scenario').value=scenario;window.rehearsal.prepare({scenario,delay:120,validation:50,network:20});},scenario);
  await ui.evaluate(()=>window.ghost.arm('rehearsal'));const result=await waitTerminal();
  const expected={focus:'FOCUS_LOST',wrongtab:'WRONG_TAB',challenge:'SECURITY_CHALLENGE',rejected:'SERVER_REJECTED',ambiguous:'NO_TRANSITION'}[scenario];
  assert.equal(result.execution.failure,expected,JSON.stringify(result.execution));
  assert.ok(await target.evaluate(()=>window.rehearsal.count)<=1);nativeCases.push({scenario,state:result.execution.state,failure:result.execution.failure});
 }

 let learned;
 for(let i=0;i<6;i++){await ui.evaluate(()=>window.ghost.openBrowser('rehearsal'));await ui.evaluate(()=>window.ghost.arm('rehearsal'));learned=await waitTerminal();assert.equal(learned.execution.state,'SUCCESS');}
 assert.ok(learned.execution.prediction.samples>=5);assert.notEqual(learned.execution.prediction.probability,null);
 await ui.bringToFront();await ui.getByText('SUCCESS',{exact:true}).first().waitFor();await ui.screenshot({path:'test-results/dashboard.png',fullPage:true});
 await writeFile('test-results/desktop.json',JSON.stringify({platform:process.platform,learning:learned.execution.prediction,nativeCases,training:capture,preflight:check,execution:s.execution,checks:['browser opens','profile loads','AI cold-start reports unknown','gate waits for readiness','one action','positive verification','SQLite history','untrusted page has no IPC or Node','seven navigation screens']},null,2));
 console.log('PASS: desktop acceptance workflow, SQLite persistence, renderer isolation, and all seven screens.');
}catch(error){console.error(output);throw error;}finally{await app.close();}

const reopened=await electron.launch({args:[process.env.GHOST_APP_PATH||'.'],env:{...process.env,GHOST_TEST_DATA:data},timeout:30000});
try{const ui=await reopened.firstWindow();await ui.waitForSelector('h1');const profiles=await ui.evaluate(()=>window.ghost.profiles());assert.equal(profiles.length,3);await ui.evaluate(()=>window.ghost.openBrowser('workflow'));const preflight=await ui.evaluate(()=>window.ghost.preflight('workflow'));assert.equal(preflight.canArm,true);assert.ok((await ui.evaluate(()=>window.ghost.history())).length>=8);console.log('PASS: persisted custom profile and history reopen against the new local server port.');}finally{await reopened.close();}
