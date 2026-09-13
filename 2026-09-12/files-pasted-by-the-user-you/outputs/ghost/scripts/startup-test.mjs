import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawn} from 'node:child_process';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);const electron=require('electron');const dir=await mkdtemp(join(tmpdir(),'ghost-startup-test-'));
try{
 const data=join(dir,'ghost.sqlite'),notice=join(dir,'notice.json'),entry=join(dir,'entry.cjs');await writeFile(data,'CORRUPT_DATABASE_FIXTURE');
 const main=process.env.GHOST_APP_PATH?resolve(process.env.GHOST_APP_PATH,'dist/main.cjs'):resolve('dist/main.cjs');
 await writeFile(entry,`const {dialog}=require('electron');const fs=require('node:fs');dialog.showErrorBox=(title,message)=>fs.writeFileSync(${JSON.stringify(notice)},JSON.stringify({title,message}));require(${JSON.stringify(main)});`);
 const child=spawn(electron,[entry],{env:{...process.env,GHOST_TEST_DATA:dir},stdio:'pipe'});let stderr='';child.stderr.on('data',d=>stderr+=d);
 const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{child.kill();reject(Error('Startup error did not exit'));},20000);child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('exit',code=>{clearTimeout(timer);resolve(code);});});
 assert.equal(result,1,stderr);const error=JSON.parse(await readFile(notice,'utf8'));assert.equal(error.title,'GHOST could not start');assert.match(error.message,/initializing database/);assert.match(error.message,/Startup report:/);assert.equal(await readFile(data,'utf8'),'CORRUPT_DATABASE_FIXTURE');
 console.log('PASS: startup failure is reported, exits cleanly and preserves the original database.');
}finally{await rm(dir,{recursive:true,force:true});}
