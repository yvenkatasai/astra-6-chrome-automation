import {describe,it,expect} from 'vitest';
import {matchesPageRoute,matchesSuccessRoute} from '../src/core/routes';
import {liveProfile,validateProfile} from '../src/core/profiles';
describe('SPA route identity',()=>{
 it('distinguishes same-path hash routes, missing fragments and foreign origins',()=>{
  const p=liveProfile();expect(matchesPageRoute(p.url,p.pagePath,p.url)).toBe(true);
  for(const current of ['https://tirupatibalaji.ap.gov.in/','https://tirupatibalaji.ap.gov.in/#/other','https://example.com/#/edonationConfirmCurrentSrivani'])expect(matchesPageRoute(p.url,p.pagePath,current)).toBe(false);
 });
 it('accepts only the configured payment route as success while preserving pathname rules',()=>{
  const p=liveProfile();expect(matchesSuccessRoute(p.successPath,p.url)).toBe(false);
  expect(matchesSuccessRoute(p.successPath,'https://tirupatibalaji.ap.gov.in/#/edonationCurrentSrivanipay')).toBe(true);
  expect(matchesSuccessRoute(p.successPath,'https://tirupatibalaji.ap.gov.in/#/edonationCurrentSrivanipayOther')).toBe(false);
  expect(matchesSuccessRoute('/confirmed','http://127.0.0.1/confirmed')).toBe(true);
 });
 it('rejects same-page success routes and query-bearing or arbitrary fragments',()=>{
  for(const successPath of ['/#/edonationConfirmCurrentSrivani','/#/next?token=x','/#token=x','/'])expect(()=>validateProfile({...liveProfile(),successPath})).toThrow();
 });
});
