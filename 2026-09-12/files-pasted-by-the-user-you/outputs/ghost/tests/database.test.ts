import {it,expect} from 'vitest';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {GhostDatabase} from '../src/main/database';
import {rehearsalProfile} from '../src/core/profiles';
it('round trips SQLite and recovers an armed crash without replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ghost-db-'));const path=join(dir,'ghost.sqlite');
 try{const db=await GhostDatabase.open(path);db.saveProfile(rehearsalProfile('http://127.0.0.1:1234'));db.saveExecution({id:'pending',profileId:'rehearsal',mode:'rehearsal',state:'ARMING',phase:'SUBMIT',actions:0,startedAt:new Date().toISOString(),elapsedMs:0,clockOrigin:0,events:[]});
 expect(readFileSync(path).subarray(0,15).toString()).toBe('SQLite format 3');const reopened=await GhostDatabase.open(path);reopened.recover();expect(reopened.profiles()[0].id).toBe('rehearsal');expect(reopened.history()[0].state).toBe('AMBIGUOUS');expect(reopened.history()[0].failure).toBe('AMBIGUOUS_RESULT');
 }finally{rmSync(dir,{recursive:true,force:true});}
});
