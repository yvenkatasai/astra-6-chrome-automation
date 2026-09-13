# GHOST — Srivani Booking Assistant

A functioning Electron desktop application with a local rehearsal workflow, explicit readiness and timed-attempt modes, React interface, trained DOM targets, SQLite history, diagnostics, empirical readiness analysis, and Windows packaging.

**Release status: engineering preview.** The local workflow has automated Chromium and macOS Electron coverage. The Windows distribution is cross-built, unsigned, and has not been executed on Windows here. Live authenticated TTD booking has not been tested. This is not a claim of production readiness or guaranteed booking success.

## Run on Windows

Extract the entire `GHOST-0.3.1-Windows-x64.zip` into a folder and run **GHOST.exe**. Keep the DLLs and `resources` folder beside it. Windows 10/11 x64 is the intended target. The package is unsigned; no publisher identity or reputation is claimed.

If an installer is included, `GHOST-Setup-0.3.1.exe` installs the same application. For a release to other users, perform the Windows acceptance checklist below and sign the binaries using an appropriate publisher certificate.

## First successful rehearsal

1. Choose **Srivani · local rehearsal**, then **Open booking browser**.
2. In that browser, choose a scenario and delay. Press **Prepare scenario** after changing settings. The default scenario is already prepared.
3. In GHOST, open **Execution**. Use **Run PREPARE → SELECT** if the profile contains preparation steps; otherwise the local form is already filled with nonpersonal sample data.
4. Run **Preflight**. Check the one-action authorization box, then **Arm & start**. The browser is focused and focus is verified before observation begins.
5. Keep the booking window foreground. Continue becomes enabled asynchronously. The gate checks the current DOM target and dispatches exactly once.
6. The simulator sends a real loopback HTTP request and adds a positive next-form marker. GHOST requires both the positive marker and one matching successful HTTP response for the built-in rehearsal profile.
7. Return to **Diagnostics** and **History**. Use **Export JSON** for a sanitized trace.

After a rehearsal finishes, press **Prepare scenario** in the browser before the next explicitly authorized run. Never treat an ambiguous live submission as permission to retry; inspect the actual booking state first.

## Development

Node.js 22.19+ and npm are required. Electron downloads its platform runtime on first launch.

```sh
npm ci
npm run build
npm test
npm start
```

The build uses Electron 44, React 19, TypeScript, Vite, and SQLite through `sql.js`. Electron was selected over Tauri because the engine needs an owned Chromium window, isolated-world DOM access, and native window/process identity. There is no Rust dependency or external browser driver needed in the installed application.

```sh
npm run test:browser       # Real Chromium scenarios; installed Google Chrome required
npm run test:timed         # Fixed +400/+500 ms slots and cancellation
npm run test:desktop       # Actual Electron windows; requires an interactive desktop
node scripts/layer-test.mjs # Readiness, CAPTCHA expiry, HTTP and request-evidence cases
node scripts/chaos-desktop.mjs # 100 in-app trials, including native focus changes
npm run chaos -- 100 314159
npm run chaos -- 500 314159
npm run chaos -- 1000 314159
npm run package:win        # Portable Windows x64 ZIP
npm run package:installer  # NSIS installer
```

Tests write artifacts to `test-results/`. Packaging writes to `release/`. The lockfile is included. Windows CI builds and runs browser tests; native foreground focus still requires an interactive Windows acceptance session.

## Operational contract

- A run has explicit controller transitions: IDLE → ARMING → OBSERVING → PREDICTING → VALIDATING → READY → ACTIONING → VERIFYING → a terminal outcome. Failed transient gates return to observation; security, identity, and focus failures hand off.
- PREPARE and SELECT are separately reviewable profile steps. SUBMIT and CONFIRM are handled by the Continue controller. Preparation completion is recorded with its own phase and **zero submission actions**; it is not proof of a booking.
- The browser resolves a fresh target from semantic name, selector, and unique containing form. Old DOM nodes are not reused. A replacement node gets a new identity.
- The final DOM inspection, deterministic gate, and `.click()` dispatch share a JavaScript task. No IPC round trip, database write, OCR, screenshot processing, or remote model call intervenes.
- In readiness mode the one-action latch is consumed **before** dispatch. Throwing dispatch, uncertain response, focus loss, abort, navigation, and process loss cannot trigger a retry. A live document that has submitted cannot be rearmed. The explicitly selected timed mode permits up to two preauthorized slots; see TIMED-MODE.md for cancellation and timing rules.
- A durable SQLite authorization record is committed before arming. Incomplete records become `AMBIGUOUS_RESULT` on restart; the app never resumes them.
- A preexisting visible success marker cannot verify a new run. Success requires a newly observed configured positive marker or same-document expected pathname. When a submission endpoint is configured, a single matching 2xx response is also required. Full document navigation conservatively becomes ambiguous.
- Pause/handoff ends authorization. It does not hide a paused action that may later resume. Stop during preparation cancels pending verification waits; it cannot undo an already performed preparation action.

## Training and live use

The built-in live profile opens `https://tirupatibalaji.ap.gov.in/#/edonationConfirmCurrentSrivani` and uses the screenshot-observed `button#smp` target. The exact hash route is checked before dispatch. Both this origin and the earlier `https://ttdevasthanams.ap.gov.in` origin are accepted for profiles; each session remains bound to its selected origin. The profile remains **requires live review**. Its containing section, Angular form validity rule, actual enablement rule, POST /dms/continue endpoint, failure markers and payment-page route come from the publicly served template and controller. These have not been verified in an authenticated session. The periodically polled summary endpoint is not submission evidence. See `SITE-EVIDENCE.md`.

Training is a target picker. It intercepts clicks rather than activating controls. Pick the current Continue element, stop capture, and use **Use final target as Continue**. Review the exact submission pathname, containing form, accessible button name, validation-complete marker, application interaction-ready marker, observed CAPTCHA-expiry marker, challenge markers, success marker, rejection marker, and inventory marker. Capture other controls as preparation steps, then edit, duplicate, delete, and reorder them.

Preparation supports semantic Click / Precise Click / permitted popup dismissal, Scroll, Type using runtime-only values, native Select, and observable Wait / Verify. Click steps require explicit verification. Form submit buttons and Continue are rejected in preparation. **Vision Click and synthetic Key steps hand off**: no fake vision confidence, permanent screen coordinates, or claim that synthetic keyboard events prove handling is provided. Cross-origin frames, shadow DOM targets, and accessibility-tree-only targets are not implemented.

Login, OTP, CAPTCHA, challenge resolution, and payment remain manual in an ephemeral browser session. The app does not bypass bot detection, spoof fingerprints or human mouse dynamics, defeat access controls, or retry through rate limiting. External authentication popups/origins are blocked by the restricted browser; a workflow requiring them needs an explicitly designed and reviewed adapter.

**DOM click events are untrusted browser events.** The real website may refuse them, or may use validation that is not externally observable. GHOST will not bypass that behavior. Human handoff is required. This limitation must be evaluated in a legitimate live session before claiming compatibility.

## Analysis, clocks, and metrics

GhostAI is an on-device empirical timing estimator, not an LLM or trained neural network. It uses up to 200 successful prior timing samples for the same profile and shows **Collecting data** until at least five exist. The 50 ms readiness estimate and quantile window are descriptive observations, not calibrated booking probabilities. Prediction never authorizes action.

`T_READY`, `T_ACTION`, resolution, and verification measurements use `performance.now()` in one renderer clock domain. `T_ACTION` is dispatch start, not server arrival. Chromium may quantize the clock: a measured `0.000 ms` means both timestamps fell in the same timer bucket, **not zero physical latency**. No nanosecond accuracy or deadline guarantee is claimed.

Time sync observes HTTP Date on ordinary main-document requests, without extra polling traffic. HTTP Date has approximately one-second granularity; displayed uncertainty includes half a second plus half round-trip time. A sample older than five minutes blocks arming. Refresh the page to acquire another legitimate sample. Countdown advances from a monotonic anchor. Target time is a **not-before** condition, and readiness must still pass afterward.

The dashboard reports current resolution and dispatch latency, verification latency, and historical median. Chaos reports mean, p50, p95, p99, outcomes, and duplicate/false-action counts. Mixed fault-injection success rate is not a production reliability score. There is no invented AI-accuracy statistic or fabricated historical improvement.

## Storage and privacy

SQLite is stored in Electron's per-user application data directory (`%APPDATA%/ghost-srivani-assistant` on Windows). The schema includes profiles, steps, targets, verification rules, executions, execution events, execution steps, time samples, predictions, and settings. Writes use transactions and a flushed atomic file replacement outside the action path. A single-instance lock protects the store from concurrent app processes.

Browser cookies/authentication are kept in an **in-memory session**. No persistent credential vault is needed. Type-step values are entered per run and never saved to profiles. Password/OTP/payment autofill is rejected. Logs contain state codes and timing rather than page text, screenshots, HTTP bodies, headers, query strings, or tokens. Diagnostic export strips target pathnames as an additional precaution. Do not put personal data into profile names, selectors, or option values.

## Remaining release work

- Execute the included desktop acceptance test and manual focus checks on Windows 10/11, including 100/125/150/200% DPI, browser zoom, multi-monitor changes, minimize/restore, and foreground lock restrictions.
- Validate the authenticated live TTD page in the user's own permitted session. Implement and review any needed site adapter; do not fabricate selectors or security-challenge handling.
- Add full-navigation verification and richer site-specific response semantics before treating new-document transitions as success. Exact origin/path/method XHR observation is implemented; unrelated asset responses intentionally do not classify submissions.
- Add calibrated prediction evaluation and historical comparison visualization if needed; the current empirical estimator does not claim those capabilities.
- Broaden training beyond its current DOM-picker coverage only with a tested semantic action model. Vision and native input are unsupported, visibly handed off.
- Sign Windows artifacts and perform installer, upgrade, uninstall, disk-full, crash-durability, and long-run production testing.

These are explicit limitations, not hidden placeholder controls. The local rehearsal application is functioning; full production Windows and live-site certification remains outstanding.

## References used

- Electron security: https://www.electronjs.org/docs/latest/tutorial/security
- Isolated-world execution: https://www.electronjs.org/docs/latest/api/web-contents
- Native window focus and process lifecycle: https://www.electronjs.org/docs/latest/api/browser-window
- Credential storage background: https://www.electronjs.org/docs/latest/api/safe-storage


## 0.2.0 — failure-layer hardening

The new interaction-ready selector represents an **application-published readiness signal**. It is not an invented delay or universal proof that a framework has attached all handlers. If the live site exposes no trustworthy signal, train a permitted site adapter or use manual handling. Never use button color as readiness evidence.

An optional expired-CAPTCHA selector detects a visible expiry message; absence of a message does not establish that the server still accepts the CAPTCHA. GHOST does not solve or renew CAPTCHAs automatically.

Profiles can specify an exact submission request pathname and GET/POST method. Passive Electron webRequest observation records only request count, status, main-process monotonic duration, transport-failure flag, and parsed Retry-After seconds. It does not read request/response bodies, cookies, tokens, or personal query strings. Requests are released immediately; observing them introduces no deliberate network wait. The endpoint rule and execution window provide association, not cryptographic proof of causality. A dedicated submission endpoint is required; do not configure a shared polling endpoint.

With endpoint observation enabled, success requires **both** one matching successful HTTP response and positive page evidence. Multiple matching requests are ambiguous. A missing matching request becomes NETWORK_NOT_OBSERVED; a completed response without the expected transition becomes NO_TRANSITION; an observed transport error becomes NETWORK_FAILED. HTTP 401 is AUTHENTICATION_REQUIRED, 429 is RATE_LIMITED, and other HTTP errors are SERVER_REJECTED. A 403 alone does not establish which protection layer rejected the request.

Retry-After blocks arming for that origin until its monotonic cooldown expires. The wall-clock deadline is persisted for restart continuity. There are no scheduled reattempts, hidden reloads, IP rotations, fingerprint changes, synthetic mouse trails, or randomized retries. No Retry-After header means no invented waiting period or claim that a retry is safe.

See [LAYER-COVERAGE.md](LAYER-COVERAGE.md) for the explicit response to all 16 failure conditions.


## 0.2.1 — observed Srivani page adapter

The adapter now uses the supplied hash route and the public portal's button/section structure, Angular form validity marker, `/dms/continue` POST and payment route. It requires the current button to be observed disabled before clicking on enablement. Arm before release. Immediate observation works without an HTTP Date sample; optional clock scheduling still requires a fresh one. Site-specific configuration is source-derived and awaits authenticated live review. See `SITE-EVIDENCE.md` for evidence and limits.


## 0.3.0 — fixed-time attempts

Execution now offers **Fixed time · +400 ms and +500 ms**. It uses the computer local clock, does not require the earlier disabled-to-enabled observation, and records each slot in Diagnostics. Submission evidence cancels a pending second slot; without observed progress, a second click may be sent. See `TIMED-MODE.md`. Readiness mode remains the default with a one-action limit.


## 0.3.1 — Windows startup repair

Database writes now flush through a writable file handle, as required on Windows. Startup initialization failures show an error box and save a local report instead of failing before the first window without an explanation. The portable folder includes `Start-GHOST-Diagnostics.cmd`; run it if startup still fails. The optional `software` argument uses software rendering for diagnosis without changing browser security settings.
