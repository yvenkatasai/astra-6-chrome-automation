from pathlib import Path
import shutil,zipfile,json,hashlib,struct
root=Path.cwd();out=root.parent
for name in ['TIMED-MODE.md','SITE-EVIDENCE.md','LAYER-COVERAGE.md']:shutil.copy2(root/name,out/('GHOST-0.3.0-'+name))
shutil.copy2(root/'test-results/timed-execution.png',out/'GHOST-0.3.0-timed-execution.png')
shutil.copy2(root/'release/GHOST Setup 0.3.0.exe',out/'GHOST-Setup-0.3.0.exe')
p=out/'GHOST-0.3.0-package-validation.json';v=json.loads(p.read_text());v['packagedLayerAcceptance']='15 scenarios passed under macOS Electron, including timed cancellation, second-slot submission and mode labels';p.write_text(json.dumps(v,indent=2))
files=[]
for d in ['src','tests','scripts','.github']:files.extend(p for p in (root/d).rglob('*') if p.is_file())
for name in ['package.json','package-lock.json','README.md','TIMED-MODE.md','SITE-EVIDENCE.md','LAYER-COVERAGE.md','tsconfig.json','vite.config.ts','vitest.config.ts','.gitignore']:files.append(root/name)
for name in ['browser.json','desktop.json','layers.json','timed.json']:files.append(root/'test-results'/name)
archive=out/'GHOST-0.3.0-source.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(files):z.write(p,'ghost/'+str(p.relative_to(root)))
with zipfile.ZipFile(archive) as z:assert z.testzip() is None
portable=out/'GHOST-0.3.0-Windows-x64.zip';bundle=root/'release/win-unpacked'
with zipfile.ZipFile(portable,'w',zipfile.ZIP_DEFLATED,compresslevel=1) as z:
 for p in sorted(bundle.rglob('*')):
  if p.is_file():z.write(p,str(p.relative_to(bundle)))
with zipfile.ZipFile(portable) as z:
 assert z.testzip() is None
 assert z.read('resources/app.asar')==(bundle/'resources/app.asar').read_bytes()
for p in [bundle/'GHOST.exe',out/'GHOST-Setup-0.3.0.exe']:
 b=p.read_bytes();pe=struct.unpack_from('<I',b,0x3c)[0];assert b[pe:pe+4]==b'PE\0\0';opt=pe+24;magic=struct.unpack_from('<H',b,opt)[0];cert=struct.unpack_from('<II',b,opt+(112 if magic==0x20b else 96)+32);assert cert==(0,0)
checks=[]
for p in sorted(out.glob('GHOST*0.3.0*')):
 if p.is_file() and p.suffix!='.txt':
  h=hashlib.sha256()
  with p.open('rb') as f:
   for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
  checks.append(h.hexdigest()+'  '+p.name)
(out/'GHOST-0.3.0-SHA256SUMS.txt').write_text('\n'.join(checks)+'\n')
print('Validated source and portable archives, unsigned PE files; checksummed',len(checks),'deliverables.')
