import {BrowserWindow} from 'electron';
/** Native Electron focus/process queries, scoped to GHOST's owned Chromium window. */
export class GhostWindowGuard {
 static inspect(window:BrowserWindow,expectedOrigin:string){
  const contents=window.webContents;
  let correctOrigin=false;try{correctOrigin=new URL(contents.getURL()).origin===expectedOrigin;}catch{}
  return {process:contents.getOSProcessId(),windowId:window.id,webContentsId:contents.id,focused:window.isFocused()&&contents.isFocused(),valid:contents.getOSProcessId()>0&&!contents.isCrashed()&&correctOrigin};
 }
 static async focus(window:BrowserWindow,expectedOrigin:string){
  await new Promise<void>((resolve,reject)=>{
   const cleanup=()=>{clearTimeout(deadline);window.removeListener('focus',verify);window.webContents.removeListener('focus',verify);};
   const verify=()=>{const s=this.inspect(window,expectedOrigin);if(s.focused&&s.valid){cleanup();resolve();}};
   const deadline=setTimeout(()=>{cleanup();reject(new Error('FOCUS_LOST: Windows/macOS did not grant the expected input focus.'));},1500);
   window.on('focus',verify);window.webContents.on('focus',verify);if(window.isMinimized())window.restore();window.show();window.focus();window.webContents.focus();verify();
  });
  return this.inspect(window,expectedOrigin);
 }
}
