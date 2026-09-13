import {it,expect,vi} from 'vitest';
const handles=vi.hoisted(()=>new Map<number,string|number>());
vi.mock('node:fs',async importOriginal=>{
 const fs=await importOriginal<typeof import('node:fs')>();
 return {...fs,
  openSync:(path:any,flags:any,mode?:any)=>{const fd=fs.openSync(path,flags,mode);handles.set(fd,flags);return fd;},
  fsyncSync:(fd:number)=>{if(handles.get(fd)==='r')throw Object.assign(new Error('Windows requires write access for FlushFileBuffers'),{code:'EPERM'});return fs.fsyncSync(fd);},
  closeSync:(fd:number)=>{handles.delete(fd);return fs.closeSync(fd);}
 };
});
import {mkdtempSync,rmSync,readFileSync,writeFileSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {GhostDatabase} from '../src/main/database';
it('starts and persists under Windows writable-handle flush semantics',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'ghost-win-storage-'));
 try{
  // Establish that this harness rejects the old read-only flush pattern.
  const probe=join(dir,'probe');writeFileSync(probe,'x');const fd=openSync(probe,'r');try{expect(()=>fsyncSync(fd)).toThrow('write access');}finally{closeSync(fd);}
  const path=join(dir,'ghost.sqlite');const db=await GhostDatabase.open(path);db.setSetting('startup-probe',42);
  expect(readFileSync(path).subarray(0,15).toString()).toBe('SQLite format 3');
  expect((await GhostDatabase.open(path)).setting('startup-probe',0)).toBe(42);expect(handles.size).toBe(0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
