import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
export async function startRehearsal(directory:string){
 const html=readFileSync(join(directory,'rehearsal.html'));
 const server=createServer((req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  // Local-only equivalent used by the source-derived site adapter acceptance fixture.
  if(req.url==='/dms/continue'&&req.method==='POST'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({message:'SUCCESS'}));return;}
  if(req.url==='/noise'){res.writeHead(403);res.end('Unrelated asset rejected');return;}
  if(req.url?.startsWith('/result')){const q=new URL(req.url,'http://localhost').searchParams;const delay=Math.max(0,Math.min(2000,Number(q.get('delay'))||0));const outcome=q.get('outcome')||'success';setTimeout(()=>{if(outcome==='transport'){res.destroy();return;}if(outcome==='ratelimit')res.setHeader('Retry-After','2');res.writeHead(outcome==='rate'||outcome==='ratelimit'?429:outcome==='rejected'?422:outcome==='http403'?403:outcome==='http401'?401:200,{'Content-Type':'application/json'});res.end(JSON.stringify({outcome}));},delay);return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"});res.end(html);
 });
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve();});});const address=server.address();if(!address||typeof address==='string')throw new Error('Simulator failed to bind');
 return {origin:`http://127.0.0.1:${address.port}`,close:()=>server.close()};
}
