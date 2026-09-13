import initSqlJs, {type Database} from 'sql.js';
import {existsSync,readFileSync,writeFileSync,renameSync,mkdirSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {dirname} from 'node:path';
import {createRequire} from 'node:module';
import type {Execution,Profile} from '../core/types';
const requireModule=createRequire(typeof __filename !== 'undefined' ? __filename : import.meta.url);
export class GhostDatabase {
 private constructor(private db:Database,private path:string){}
 static async open(path:string){
  const SQL=await initSqlJs({locateFile:()=>requireModule.resolve('sql.js/dist/sql-wasm.wasm')});
  mkdirSync(dirname(path),{recursive:true});
  const db=new SQL.Database(existsSync(path)?readFileSync(path):undefined);
  db.run(`PRAGMA foreign_keys=ON;
   CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY, payload TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS profile_steps(profile_id TEXT NOT NULL, ordinal INTEGER NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(profile_id,ordinal), FOREIGN KEY(profile_id) REFERENCES profiles(id) ON DELETE CASCADE);
   CREATE TABLE IF NOT EXISTS targets(profile_id TEXT PRIMARY KEY,payload TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS verification_rules(profile_id TEXT PRIMARY KEY,payload TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS executions(id TEXT PRIMARY KEY,profile_id TEXT NOT NULL,state TEXT NOT NULL,payload TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS execution_steps(execution_id TEXT NOT NULL,ordinal INTEGER NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(execution_id,ordinal));
   CREATE TABLE IF NOT EXISTS execution_events(execution_id TEXT NOT NULL,sequence INTEGER NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(execution_id,sequence));
   CREATE TABLE IF NOT EXISTS ai_predictions(execution_id TEXT PRIMARY KEY,payload TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS time_sync(id INTEGER PRIMARY KEY AUTOINCREMENT,payload TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,payload TEXT NOT NULL);
   PRAGMA user_version=1;`);
  const store=new GhostDatabase(db,path);store.flush();return store;
 }
 private transaction(fn:()=>void){this.db.run('BEGIN');try{fn();this.db.run('COMMIT');this.flush();}catch(error){try{this.db.run('ROLLBACK');}catch{}throw error;}}
 private flush(){
  const temporary=this.path+'.tmp';
  // Windows FlushFileBuffers requires GENERIC_WRITE; keep the writing handle
  // open through fsync instead of reopening the file read-only.
  const fd=openSync(temporary,'w',0o600);
  try{writeFileSync(fd,this.db.export());fsyncSync(fd);}finally{closeSync(fd);}
  renameSync(temporary,this.path);
 }
 private rows<T>(sql:string,values:(string|number)[]=[]):T[]{const q=this.db.prepare(sql);try{q.bind(values);const out:T[]=[];while(q.step())out.push(JSON.parse(String(q.getAsObject().payload)) as T);return out;}finally{q.free();}}
 profiles(){return this.rows<Profile>('SELECT payload FROM profiles ORDER BY id');}
 saveProfile(p:Profile){this.transaction(()=>{this.db.run('INSERT OR REPLACE INTO profiles VALUES(?,?)',[p.id,JSON.stringify(p)]);this.db.run('DELETE FROM profile_steps WHERE profile_id=?',[p.id]);p.steps.forEach((s,i)=>this.db.run('INSERT INTO profile_steps VALUES(?,?,?)',[p.id,i,JSON.stringify(s)]));this.db.run('INSERT OR REPLACE INTO targets VALUES(?,?)',[p.id,JSON.stringify(p.target)]);this.db.run('INSERT OR REPLACE INTO verification_rules VALUES(?,?)',[p.id,JSON.stringify({successSelector:p.successSelector,successPath:p.successPath})]);});}
 history(){return this.rows<Execution>('SELECT payload FROM executions ORDER BY rowid DESC LIMIT 500');}
 saveExecution(t:Execution){this.transaction(()=>{this.db.run('INSERT OR REPLACE INTO executions VALUES(?,?,?,?)',[t.id,t.profileId,t.state,JSON.stringify(t)]);this.db.run('DELETE FROM execution_events WHERE execution_id=?',[t.id]);t.events.forEach(e=>this.db.run('INSERT INTO execution_events VALUES(?,?,?)',[t.id,e.sequence,JSON.stringify(e)]));if(t.prediction)this.db.run('INSERT OR REPLACE INTO ai_predictions VALUES(?,?)',[t.id,JSON.stringify(t.prediction)]);});}
 saveStep(id:string,index:number,result:unknown){this.transaction(()=>this.db.run('INSERT OR REPLACE INTO execution_steps VALUES(?,?,?)',[id,index,JSON.stringify(result)]));}
 setting<T>(key:string,fallback:T){return this.rows<T>('SELECT payload FROM settings WHERE key=?',[key])[0]??fallback;}
 setSetting(key:string,value:unknown){this.transaction(()=>this.db.run('INSERT OR REPLACE INTO settings VALUES(?,?)',[key,JSON.stringify(value)]));}
 saveTime(value:unknown){this.transaction(()=>{this.db.run('INSERT INTO time_sync(payload) VALUES(?)',[JSON.stringify(value)]);this.db.run('DELETE FROM time_sync WHERE id NOT IN (SELECT id FROM time_sync ORDER BY id DESC LIMIT 100)');});}
 recover(){for(const t of this.history()){if(!['SUCCESS','FAILED','AMBIGUOUS','HUMAN_HANDOFF','ABORTED'].includes(t.state)){t.state='AMBIGUOUS';t.failure='AMBIGUOUS_RESULT';t.events.push({sequence:t.events.length+1,at:t.elapsedMs,state:t.state,phase:t.phase,kind:'Recovered interrupted execution — inspect browser before any new run',failure:t.failure});this.saveExecution(t);}}}
}
