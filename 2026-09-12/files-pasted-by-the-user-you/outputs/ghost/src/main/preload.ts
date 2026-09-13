import {contextBridge,ipcRenderer} from 'electron';
const methods=['status','profiles','saveProfile','openBrowser','preflight','prepare','arm','stop','record','recorded','stopRecording','highlight','history','export','settings','saveSettings','chaos'] as const;
contextBridge.exposeInMainWorld('ghost',Object.fromEntries(methods.map(method=>[method,(...args:unknown[])=>ipcRenderer.invoke('ghost:'+method,...args)])));
