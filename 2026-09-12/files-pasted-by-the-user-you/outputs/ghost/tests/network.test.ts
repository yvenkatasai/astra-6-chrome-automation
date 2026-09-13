import {describe,it,expect} from 'vitest';
import {matchesSubmission,responseFailure,verificationFailure,retryAfterSeconds,RetryAfterGuard} from '../src/core/network';
import {rehearsalProfile,liveProfile,validateProfile,upgradeProfile} from '../src/core/profiles';
describe('observed TTD profile',()=>{
 it('uses the supplied origin and target without treating the summary request as submission proof',()=>{
  const p=validateProfile(liveProfile());expect(p.url).toBe('https://tirupatibalaji.ap.gov.in/#/edonationConfirmCurrentSrivani');expect(p.target.selector).toBe('button#smp');expect(p.reviewed).toBe(false);expect(p.submissionRequestPath).toBe('/dms/continue');expect(p.successPath).toBe('/#/edonationCurrentSrivanipay');expect(p.pagePath).toBe('/');
 });
 it('accepts only the two exact HTTPS origins, rejecting lookalikes, credentials and alternate ports',()=>{
  for(const url of ['https://ttdevasthanams.ap.gov.in/','https://tirupatibalaji.ap.gov.in/'])expect(()=>validateProfile({...liveProfile(),url})).not.toThrow();
  for(const url of ['http://tirupatibalaji.ap.gov.in/','https://tirupatibalaji.ap.gov.in:444/','https://tirupatibalaji.ap.gov.in.example.com/','https://user@tirupatibalaji.ap.gov.in/','https://tirupatibalaji.ap.gov.in/#token=secret','https://tirupatibalaji.ap.gov.in/#/route?token=secret'])expect(()=>validateProfile({...liveProfile(),url})).toThrow();
 });
 it('migrates the unconfigured built-in profile without overwriting reviewed or customized targets',()=>{
  const old={...liveProfile(),pagePath:'/REQUIRES_TRAINING',url:'https://ttdevasthanams.ap.gov.in/',target:{...liveProfile().target,selector:'[data-ghost-unconfigured]',form:'[data-ghost-unconfigured]'},validationSelector:'[data-ghost-unconfigured]',successSelector:'[data-ghost-unconfigured]',submissionRequestPath:''};
  expect(upgradeProfile(old).url).toBe(liveProfile().url);expect(upgradeProfile(old).target.selector).toBe('button#smp');expect(old.url).toBe('https://ttdevasthanams.ap.gov.in/');
  expect(upgradeProfile({...old,reviewed:true}).url).toBe(old.url);
  expect(upgradeProfile({...old,target:{...old.target,selector:'#custom'}}).target.selector).toBe('#custom');
  expect(upgradeProfile({...old,id:'custom'}).url).toBe(old.url);expect(upgradeProfile({...old,submissionRequestPath:'/custom'}).url).toBe(old.url);
 });
});
describe('submission evidence',()=>{
 const p=rehearsalProfile('http://127.0.0.1:8123');
 it('matches exact origin, path, method and resource type without retaining query data',()=>{
  expect(matchesSubmission(p,p.url+'result?private=excluded','GET','xhr')).toBe(true);
  expect(matchesSubmission(p,p.url+'result','POST','xhr')).toBe(false);
  expect(matchesSubmission(p,p.url+'result/other','GET','xhr')).toBe(false);
  expect(matchesSubmission(p,'http://127.0.0.1:8124/result','GET','xhr')).toBe(false);
  expect(matchesSubmission(p,p.url+'result','GET','image')).toBe(false);
 });
 it('does not infer bot mitigation from HTTP 403',()=>{expect(responseFailure(403)).toBe('SERVER_REJECTED');expect(responseFailure(401)).toBe('AUTHENTICATION_REQUIRED');expect(responseFailure(429)).toBe('RATE_LIMITED');expect(responseFailure(200)).toBeUndefined();});
 it('distinguishes no request, transport error, response without transition and multiple matches',()=>{
  expect(verificationFailure({requestCount:0,responseObserved:false})).toBe('NETWORK_NOT_OBSERVED');
  expect(verificationFailure({requestCount:1,responseObserved:false,failed:true})).toBe('NETWORK_FAILED');
  expect(verificationFailure({requestCount:1,responseObserved:true,status:200})).toBe('NO_TRANSITION');
  expect(verificationFailure({requestCount:2,responseObserved:true,status:200})).toBe('AMBIGUOUS_RESULT');
 });
 it('rejects profile endpoint wildcards through exact matching and query-bearing configuration',()=>{expect(()=>validateProfile({...p,submissionRequestPath:'/result?token=x'})).toThrow();expect(matchesSubmission({...p,submissionRequestPath:'/result*'},p.url+'result-anything','GET','xhr')).toBe(false);});
 it('upgrades existing local profiles with explicit readiness and request observation',()=>{const old={...p};delete (old as any).interactionReadySelector;delete (old as any).submissionRequestPath;expect(upgradeProfile(old).interactionReadySelector).toContain('data-interaction-ready');expect(upgradeProfile(old).submissionRequestPath).toBe('/result');});
});
describe('server Retry-After',()=>{
 it('accepts seconds and dates without inventing a delay',()=>{expect(retryAfterSeconds('120',undefined)).toBe(120);expect(retryAfterSeconds(undefined,undefined)).toBeUndefined();expect(retryAfterSeconds('not a date',undefined)).toBeUndefined();expect(retryAfterSeconds('Sat, 12 Sep 2026 09:01:00 GMT','Sat, 12 Sep 2026 09:00:00 GMT')).toBe(60);});
 it('counts down monotonically, never shortens a server delay, and restores after restart',()=>{let mono=100;const c=new RetryAfterGuard(()=>mono);expect(c.observe(10,10000)).toBe(20000);mono+=1000;expect(c.remainingMs()).toBe(9000);c.observe(1,-999999);expect(c.remainingMs()).toBe(9000);const restored=new RetryAfterGuard(()=>500);restored.restore(20000,15000);expect(restored.remainingMs()).toBe(5000);});
});
