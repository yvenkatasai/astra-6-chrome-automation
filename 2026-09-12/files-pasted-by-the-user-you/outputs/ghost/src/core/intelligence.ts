import type {Execution, Prediction, TimeEstimate} from './types';
export function quantile(xs:number[],p:number){if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y);return a[Math.min(a.length-1,Math.floor((a.length-1)*p))];}
export class GhostAI {
 constructor(private samples:number[]){}
 predict(elapsed:number,confidence:number):Prediction {
  const s=this.samples.filter(x=>Number.isFinite(x)&&x>=0).slice(-200);
  if(s.length<5)return {probability:null,windowMs:null,targetConfidence:confidence,anomalyProbability:null,samples:s.length};
  const remaining=s.filter(x=>x>=elapsed);
  const probability=remaining.length?remaining.filter(x=>x<=elapsed+50).length/remaining.length:0;
  return {probability,windowMs:[Math.max(0,quantile(s,.1)!-elapsed),Math.max(0,quantile(s,.9)!-elapsed)],targetConfidence:confidence,anomalyProbability:elapsed>quantile(s,.99)!?1:0,samples:s.length};
 }
 static samples(traces:Execution[],profileId:string){return traces.filter(t=>t.profileId===profileId&&t.timingMode!=='timed-pair'&&t.state==='SUCCESS'&&t.validationMs!==undefined).map(t=>t.validationMs!);}
}
export class GhostTimeSync {
 private estimate?:TimeEstimate;
 private anchor?:{mono:number;wall:number};
 observe(serverDate:string,sentWall:number,receivedWall:number,receivedMono:number):TimeEstimate|undefined {
  const date=Date.parse(serverDate);const rtt=receivedWall-sentWall;
  if(!Number.isFinite(date)||rtt<0||rtt>5000)return undefined;
  // HTTP Date is quantized to a second; never imply millisecond clock certainty.
  this.estimate={offsetMs:date+500-(sentWall+receivedWall)/2,uncertaintyMs:500+rtt/2,sampledAt:receivedWall,source:'HTTP Date (passive observation)'};
  this.anchor={mono:receivedMono,wall:receivedWall};return this.estimate;
 }
 current(mono:number){return this.estimate&&this.anchor?this.anchor.wall+(mono-this.anchor.mono)+this.estimate.offsetMs:undefined;}
 get(){return this.estimate;}
 clear(){this.estimate=undefined;this.anchor=undefined;}
}
