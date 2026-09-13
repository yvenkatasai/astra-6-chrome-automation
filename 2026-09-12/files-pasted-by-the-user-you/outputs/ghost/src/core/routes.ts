/** Fragment routes are part of page identity in the observed Angular portal. */
export function matchesPageRoute(profileUrl:string,pagePath:string,currentUrl:string):boolean {
 const expected=new URL(profileUrl),current=new URL(currentUrl);
 return current.origin===expected.origin&&current.pathname===pagePath&&current.hash===expected.hash;
}
export function matchesSuccessRoute(rule:string,currentUrl:string):boolean {
 if(!rule)return false;
 const current=new URL(currentUrl);
 return (rule.includes('#')?current.pathname+current.hash:current.pathname)===rule;
}
