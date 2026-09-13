import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await Promise.all([
  build({entryPoints:['src/main/main.ts'],outfile:'dist/main.cjs',bundle:true,platform:'node',format:'cjs',external:['electron','sql.js'],define:{'import.meta.url':'__filename'},sourcemap:true}),
  build({entryPoints:['src/main/preload.ts'],outfile:'dist/preload.cjs',bundle:true,platform:'node',format:'cjs',external:['electron']}),
  build({entryPoints:['src/browser/runtime.ts'],outfile:'dist/browser.js',bundle:true,platform:'browser',format:'iife',target:'chrome130'}),
  build({entryPoints:['src/rehearsal/server.ts'],outfile:'dist/rehearsal.cjs',bundle:true,platform:'node',format:'cjs'})
]);
await copyFile('src/rehearsal/index.html','dist/rehearsal.html');
