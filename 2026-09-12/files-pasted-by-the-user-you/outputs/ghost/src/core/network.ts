import type {Failure,Profile,SubmissionNetwork} from './types';

/** Passive, exact endpoint matching. Never modifies a request, header, identity, or body. */
export function matchesSubmission(profile:Profile,rawUrl:string,method:string,resourceType:string):boolean {
 if(!profile.submissionRequestPath||!['xhr','fetch'].includes(resourceType))return false;
 try{const url=new URL(rawUrl);return url.origin===new URL(profile.url).origin&&url.pathname===profile.submissionRequestPath&&method===profile.submissionRequestMethod;}catch{return false;}
}
export function responseFailure(status:number):Failure|undefined {
 if(status===429)return 'RATE_LIMITED';
 if(status===401)return 'AUTHENTICATION_REQUIRED';
 // HTTP 403 alone does not identify bot mitigation: preserve the actual status without guessing.
 if(status>=400)return 'SERVER_REJECTED';
}
export function verificationFailure(network:SubmissionNetwork):Failure {
 if(network.requestCount>1)return 'AMBIGUOUS_RESULT';
 if(network.requestCount===0)return 'NETWORK_NOT_OBSERVED';
 if(network.failed)return 'NETWORK_FAILED';
 if(network.status!==undefined)return responseFailure(network.status)??'NO_TRANSITION';
 return 'AMBIGUOUS_RESULT';
}
export function retryAfterSeconds(value:string|undefined,serverDate:string|undefined,localNow=Date.now()):number|undefined {
 if(value===undefined)return undefined;
 if(/^\d+$/.test(value.trim())){const n=Number(value);return Number.isSafeInteger(n)?n:undefined;}
 const date=Date.parse(value);const reference=serverDate?Date.parse(serverDate):localNow;
 if(!Number.isFinite(date)||!Number.isFinite(reference))return undefined;
 return Math.max(0,Math.ceil((date-reference)/1000));
}
/** Monotonic countdown in the current process, persisted wall deadline for restart continuity. */
export class RetryAfterGuard {
 private deadlineMono=0;
 constructor(private now:()=>number=()=>performance.now()){}
 restore(untilWall:number,wallNow=Date.now()){this.deadlineMono=this.now()+Math.max(0,untilWall-wallNow);}
 observe(seconds:number,wallNow=Date.now()){
  this.deadlineMono=Math.max(this.deadlineMono,this.now()+seconds*1000);
  return wallNow+this.remainingMs();
 }
 remainingMs(){return Math.max(0,this.deadlineMono-this.now());}
}
