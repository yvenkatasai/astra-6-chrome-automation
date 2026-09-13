# What GHOST 0.3.0 does about the 16 failure conditions

Readiness mode permits one action. The explicit timed mode permits two scheduled slots with cancellation on observed progress; see TIMED-MODE.md. A requirement that *none of these conditions may stop submission* cannot be fulfilled: invalid information, an expired challenge, a server refusal, and exhausted inventory can legitimately prevent a booking.

| # | Condition | Implemented handling | Practical limit |
|---:|---|---|---|
| 1 | Captured point misses the button | Resolve a unique current DOM target by selector, semantic name and containing form. | No stored screen coordinate is used for Continue. Unresolvable targets stop. |
| 2 | Click before enablement | Observe real disabled state, inherited disabled fieldsets and aria-disabled. In readiness mode the TTD adapter requires an observed disabled-to-enabled transition. Timed mode instead checks the current target at its fixed slots. | A disabled button is never forced enabled. |
| 3 | Color changes before readiness | Ignore color; require actual actionability, valid form and configured interaction-ready marker. | Hidden application validation still needs a trustworthy site-specific signal. |
| 4 | Layout, scroll, zoom or window changes | Recompute current viewport geometry and hit-test the interactable point. Scroll steps can bring Continue into view without submitting. | Native Windows DPI/multi-monitor validation remains outstanding. |
| 5 | Missing input focus | Focus the owned booking window before arming, await native events, and verify native plus document focus. | Later focus loss cancels authorization; the app does not steal focus repeatedly. |
| 6 | Foreground request silently fails | Query the resulting state and use a bounded focus deadline. | OS refusal requires the user to activate the window. |
| 7 | Wrong window or tab | Bind to an owned browser process/window and exact origin/path; deny additional tabs/windows. | Unsupported external-login flows need a reviewed adapter or manual handling. |
| 8 | Invalid or missing required fields | Inspect form validity and aria-invalid; fill authorized runtime profile fields during preparation. | Missing information cannot be made valid by clicking. Password, OTP and payment input stay manual. |
| 9 | Expired CAPTCHA | Observe a configured visible expiry marker and classify CAPTCHA_EXPIRED. | The user must complete a fresh challenge. No visible expiry message is not proof of server acceptance. |
| 10 | Application handlers not yet ready | Require a configured interaction-ready marker; the simulator tests late and absent handler attachment. | No generic DOM API can prove arbitrary framework/business-logic readiness. |
| 11 | Request never starts | Monitor the exact configured submission origin/path/method after dispatch; distinguish NETWORK_NOT_OBSERVED from network errors and response-without-transition. | Readiness mode does not retry. Explicit timed mode may use its second preauthorized slot if no progress has been observed. Endpoint association is not cryptographic causality. |
| 12 | Request rejected by protection layer | Record matching HTTP status. Classify actual rejection without guessing which vendor or layer caused a 403. | No bypass of bot mitigation, authentication, access control, or security challenges. |
| 13 | Quota exhausted | Observe the configured inventory-unavailable marker and report INVENTORY_UNAVAILABLE. | Client software cannot create inventory or guarantee winning a capacity race. |
| 14 | Rate-limited IP or session | Classify 429, honor observed Retry-After, persist the cooldown, and refuse to arm during it. | No automatic retries, IP/session rotation, or assurance that a later request will succeed. |
| 15 | Mouse movement detection | No fake human movement is generated. Continue uses a clearly documented DOM dispatch path. | The website may reject synthetic events or the browser environment. Manual handling may be necessary. |
| 16 | Repeated coordinates or timing detected | Avoid stored click coordinates. Readiness mode has one action; timed mode has up to two explicit slots. | Randomizing behavior would not guarantee acceptance and is not implemented as evasion. |

The packaged application uses `HTMLElement.click()`. Its click event is untrusted according to the [browser event model](https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted). Improving local actionability does not change that or force the server to accept a booking.

Network observation uses Electron's [webRequest events](https://www.electronjs.org/docs/latest/api/web-request). It preserves normal network delivery and records sanitized evidence. HTTP success alone never reports booking success.

**Validation boundary:** local Chromium and macOS Electron are tested. The Windows package is cross-built and unsigned; native Windows execution and authenticated live TTD compatibility remain unverified.
