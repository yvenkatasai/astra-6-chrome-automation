import {_electron as electron} from 'playwright';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
await mkdir('test-results',{recursive:true});
const data=await mkdtemp(resolve('test-results/chaos-desktop-data-'));
const app=await electron.launch({args:[process.env.GHOST_APP_PATH||'.'],env:{...process.env,GHOST_TEST_DATA:data},timeout:30000});
try{
 const ui=await app.firstWindow();await ui.waitForSelector('h1');
 await ui.evaluate(()=>window.ghost.openBrowser('rehearsal'));
 const report=await ui.evaluate(()=>window.ghost.chaos(100,314159));
 assert.equal(report.trials,100);assert.equal(report.unexpectedOutcomes,0,JSON.stringify(report));assert.equal(report.duplicateActionRate,0);assert.equal(report.falseActionRate,0);assert.equal(report.staleTargetRate,0);
 assert.ok(report.outcomes.FOCUS_LOST>0,'Native focus-loss faults must be exercised');
 await writeFile('test-results/chaos-desktop.json',JSON.stringify({environment:process.platform,report},null,2));
 console.log('PASS: 100 in-app Electron chaos trials, including native minimize/focus and restoration.');
 console.log(JSON.stringify(report,null,2));
}finally{await app.close();}
