# Srivani site adaptation — GHOST 0.3.0

Prepared 2026-09-13 from the user's screenshots and publicly served portal code. Personal information, CAPTCHA text, cookies and authentication values are excluded from project files and packages. No authenticated request or live submission was made.

## Confirmed in public source

The [page template](https://tirupatibalaji.ap.gov.in/app/srivani/edonationConfirmCurrentSrivani.html) confirms `button#smp`, accessible name Continue, and an Angular click handler. The button and CAPTCHA input are outside `#othersForm2`; their common containing section is `.cnt_new.edonat`. The styling supplies a red background and separate disabled-state cursor behavior. Color is not the readiness contract.

The [application bundle](https://tirupatibalaji.ap.gov.in/dist/scripts/ttd.app.min.ef0bd0d7.js), in `edonationConfirmCurrentSrivaniController`, updates the button's real `disabled` property on a one-second clock interval, using a quota-release time obtained from summary data and the browser's local clock. The summary request runs initially and every 20 seconds. Continue validates the CAPTCHA and pilgrim information before requesting `POST /dms/continue`. A successful business response moves to `#/edonationCurrentSrivanipay`. The visible clock label therefore should not be treated as independent proof of synchronized server time.

These are observations of the served version, not a guarantee about another deployment or authenticated runtime. The source was inspected without invoking application functions, reading CAPTCHA answers, or supplying the pasted authentication token.

## Configured profile

| Setting | Value |
|---|---|
| Page URL | `https://tirupatibalaji.ap.gov.in/#/edonationConfirmCurrentSrivani` |
| Exact pathname | `/` |
| Exact fragment | `#/edonationConfirmCurrentSrivani` |
| Continue target | `button#smp`, name `Continue` |
| Containing section | `.cnt_new.edonat` |
| Validation | Angular pilgrim form marked `ng-valid`, CAPTCHA input browser-valid, plus existing native validity checks |
| Readiness | Observed disabled-to-enabled transition on the same button, compiled valid form and existing focus, visibility and hit-test gates |
| Submission observation | `POST /dms/continue` |
| Continue accepted | One matching successful response and transition to `/#/edonationCurrentSrivanipay` |
| Error markers | `#ErrorMsgPopUp`, `#quotaPopUp`, `#quotamisPopUp` |

Reaching the payment page verifies the Continue step, not payment or a completed booking. A nonempty CAPTCHA input does not establish a correct CAPTCHA; the website still checks it. The application does not read or solve the challenge. Duplicate identity checks and other business rules can also prevent submission.

## Implementation and limits

GHOST now validates exact SPA fragments before dispatch and supports fragment routes for positive verification. It keeps the request matcher on `/dms/continue`; the periodically polled summary endpoint cannot satisfy submission verification. Existing unconfigured built-in profiles migrate to this adapter. Reviewed/customized profiles are preserved.

Immediate arming no longer requires an HTTP Date sample: it responds to observed enablement. Optional clock-scheduled execution still requires a fresh time sample.

The final gate and single DOM click execute in one JavaScript task, with no screenshot or network round trip between them. Actual enablement is observed through DOM mutations with animation-frame fallback. Arm before release: the adapter must first observe the current button disabled, because the public template initially omits the disabled attribute before its first timer update. Arming after it is already enabled waits rather than assuming a release transition. The website's own one-second update interval and a busy browser main thread still limit when enablement can be observed. GHOST does not force the button enabled, change the release clock, or directly call the submission API.

The template remains marked **requires live review**, because public-source inspection and local fixtures do not establish authenticated live compatibility. Native Windows execution is also unverified; the package is unsigned.

## Interpreting the screenshots and headers

DevTools displays computed background `#A30004`; its highlighting changes visible screenshot pixels. Neither that image nor the provided response headers establish that security prevented pixel-color detection. CSP `script-src` controls allowed script sources ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src)); the supplied policy was on a JSON response and cannot be assumed to be the top-level document's policy.

The observed HTTP 200 on the summary request is consistent with a successful summary read. It is not evidence of booking completion. Multiple autofill extensions and a VPN extension appear in DevTools, which establishes their presence but not interference. Screenshots include different captured dates; no release hour or quota count is hardcoded.


The disabled-to-enabled history requirement described above applies to readiness mode. Version 0.3.0 adds an explicit fixed-time mode that replaces that history gate with +400/+500 ms slots while preserving actual disablement, validity, focus and page checks. See TIMED-MODE.md.
