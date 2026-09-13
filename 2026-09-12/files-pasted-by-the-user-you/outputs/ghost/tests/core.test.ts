import {describe,it,expect} from 'vitest';
import {GhostContinueController,ActionabilityGate} from '../src/core/controller';
import {GhostAI,GhostTimeSync} from '../src/core/intelligence';
import {validateProfile,rehearsalProfile} from '../src/core/profiles';
import type {GateSnapshot,Execution} from '../src/core/types';
const valid:GateSnapshot={correctPage:true,correctTab:true,correctForm:true,correctTarget:true,exists:true,fresh:true,visible:true,enabled:true,ariaEnabled:true,pointerEvents:true,overlayAbsent:true,validationComplete:true,browserValid:true,focus:true,challengeAbsent:true,geometryValid:true,pageReady:true,interactionReady:true,captchaFresh:true};
function create(){let clock=0;const trace:Execution={id:'test',profileId:'local',mode:'rehearsal',startedAt:new Date().toISOString(),state:'IDLE',phase:'SUBMIT',actions:0,events:[],elapsedMs:0,clockOrigin:0};const c=new GhostContinueController(trace,()=>clock+=.01);c.arm();return c;}
describe('single-action safety contract',()=>{
 it.each(Object.keys(valid))('blocks when %s is false',key=>{const c=create();let clicks=0;c.attempt({...valid,[key]:false},()=>clicks++);expect(clicks).toBe(0);expect(c.trace.readyAt).toBeUndefined();expect(ActionabilityGate.check({...valid,[key]:false})).toBeTruthy();});
 it('consumes authorization before a throwing dispatcher',()=>{const c=create();let clicks=0;const dispatch=()=>{clicks++;throw new Error('unknown delivery');};for(let i=0;i<100;i++)c.attempt(valid,dispatch);expect(clicks).toBe(1);expect(c.trace.state).toBe('AMBIGUOUS');expect(c.trace.actions).toBe(1);});
 it('allows readiness observations but never a second action',()=>{const c=create();let clicks=0;for(let i=0;i<100;i++)c.attempt({...valid,enabled:false},()=>clicks++);c.attempt(valid,()=>clicks++);c.verify('success');for(let i=0;i<100;i++)c.attempt(valid,()=>clicks++);expect(clicks).toBe(1);expect(c.trace.state).toBe('SUCCESS');expect(c.trace.actionAt).toBeGreaterThanOrEqual(c.trace.readyAt!);});
 it('does not infer success from dispatch',()=>{const c=create();c.attempt(valid,()=>{});expect(c.trace.state).toBe('VERIFYING');c.timeout();expect(c.trace.state).toBe('AMBIGUOUS');expect(c.trace.verificationAt).toBeUndefined();});
 it('cannot be revived after abort',()=>{const c=create();c.stop();expect(()=>c.arm()).toThrow();expect(c.attempt(valid,()=>{throw Error('must not act');})).toBe(false);});
 it('classifies rejection and refuses reentrant actions',()=>{const c=create();let calls=0;c.attempt(valid,()=>{calls++;c.attempt(valid,()=>calls++);});c.verify('rejected');expect(calls).toBe(1);expect(c.trace.failure).toBe('SERVER_REJECTED');});
});
describe('honest analysis and clocks',()=>{
 it('has no invented prediction for cold start',()=>expect(new GhostAI([]).predict(0,1).probability).toBeNull());
 it('uses prior timings without authorizing actions',()=>{const ai=new GhostAI([10,20,30,40,50]);expect(ai.predict(0,1).probability).toBe(1);const c=create();c.attempt({...valid,enabled:false},()=>{});expect(c.trace.actions).toBe(0);});
 it('uses monotonic progression despite wall clock changes',()=>{const sync=new GhostTimeSync();const wall=Date.parse('2026-01-01T00:00:00Z');const t=sync.observe('Thu, 01 Jan 2026 00:00:00 GMT',wall,wall+100,1000)!;expect(t.uncertaintyMs).toBe(550);expect(sync.current(1010)!-sync.current(1000)!).toBe(10);expect(sync.observe('bad',0,1,1)).toBeUndefined();});
});
describe('explicit timed second slot',()=>{
 it('does not mix timer-driven runs into readiness predictions',()=>{const c=create();c.trace.state='SUCCESS';c.trace.validationMs=500;expect(GhostAI.samples([c.trace],'local')).toEqual([500]);c.trace.timingMode='timed-pair';expect(GhostAI.samples([c.trace],'local')).toEqual([]);});
 it('allows exactly one additional dispatch with explicit mode and no observed request',()=>{const c=create();c.trace.timingMode='timed-pair';let calls=0;c.attempt(valid,()=>calls++);expect(c.timedSecondAttempt(valid,()=>calls++)).toBe(true);expect(c.timedSecondAttempt(valid,()=>calls++)).toBe(false);expect(calls).toBe(2);expect(c.trace.state).toBe('VERIFYING');});
 it('preserves the ordinary single-action contract',()=>{const c=create();c.attempt(valid,()=>{});expect(c.timedSecondAttempt(valid,()=>{throw Error('unexpected');})).toBe(false);});
 it('cancels a second dispatch after matching request evidence',()=>{const c=create();c.trace.timingMode='timed-pair';c.attempt(valid,()=>{});c.trace.network={requestCount:1,responseObserved:false};expect(c.timedSecondAttempt(valid,()=>{throw Error('unexpected');})).toBe(false);});
 it('still blocks disabled buttons and invalid forms in timed mode',()=>{const c=create();c.trace.timingMode='timed-pair';c.attempt(valid,()=>{});expect(c.timedSecondAttempt({...valid,enabled:false},()=>{})).toBe(false);expect(c.timedSecondAttempt({...valid,validationComplete:false},()=>{})).toBe(false);expect(c.trace.actions).toBe(1);});
 it('consumes the second slot before dispatch and cannot recover from a throwing dispatcher',()=>{const c=create();c.trace.timingMode='timed-pair';c.attempt(valid,()=>{});let calls=0;c.timedSecondAttempt(valid,()=>{calls++;throw Error('unknown');});expect(c.trace.state).toBe('AMBIGUOUS');expect(c.timedSecondAttempt(valid,()=>calls++)).toBe(false);expect(calls).toBe(1);});
});
describe('profile boundaries',()=>{
 it('rejects lookalike official domains',()=>expect(()=>validateProfile({...rehearsalProfile('http://127.0.0.1'),mode:'live',url:'https://ttdevasthanams.ap.gov.in.example.com/'})).toThrow());
 it('requires positive verification',()=>expect(()=>validateProfile({...rehearsalProfile('http://127.0.0.1'),successSelector:'',successPath:''})).toThrow());
 it('rejects persistent typed values',()=>{const p=rehearsalProfile('http://127.0.0.1');p.steps=[{id:'1',phase:'PREPARE',action:'Type',target:p.target,value:'secret',timeout:1000,verification:'',failureBehavior:'handoff'}];expect(()=>validateProfile(p)).toThrow();});
});
