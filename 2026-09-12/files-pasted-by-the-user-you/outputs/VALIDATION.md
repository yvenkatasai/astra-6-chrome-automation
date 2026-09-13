# GHOST validation report

Release 0.1.0 · Engineering preview · 12 September 2026

**The application and local rehearsal workflow function. This is not a completed production certification. Windows execution and authenticated live TTD booking remain unverified.**

## Passed checks

- TypeScript compilation and production renderer/main/preload/browser bundles.
- 29 core and SQLite tests: every mandatory gate, one-action latch, reentrant/throwing dispatch, terminal states, monotonic clock behavior, profile restrictions, persistence and crash recovery.
- 21 real Google Chrome scenarios: asynchronous enable delays, validation, replacement, movement, overlays, positive results, rejection, rate limits, challenges, ambiguous responses, invalid fields, duplicate targets, pointer interception, and stale success markers.
- Electron desktop acceptance: all seven screens, owned browser, real local submission, positive verification, SQLite history, renderer isolation, target picking without submission, preparation/select steps, runtime-value exclusion from SQLite, and empirical prediction after five historical samples.
- App restart: trained custom profiles and history reopen against the new ephemeral simulator port.
- Native macOS minimize/focus loss, restoration, wrong page, challenge, server rejection and ambiguous-result handling.
- Packaged Windows app.asar passed the desktop/restart acceptance tests under macOS Electron. This verifies packaged JavaScript and assets, not native Windows execution.
- Portable ZIP integrity checked. PE headers confirm Windows x64 application architecture. Installer and executable are unsigned.
- Dependency audit: zero reported vulnerabilities at build time.

## Final chaos runs

All runs use seed `314159`. Chrome trials use real DOM changes and loopback HTTP; Electron trials also exercise native window focus. No live website booking requests were made.

| Engine | Trials | False actions | Duplicate actions | Stale actions | Unexpected outcomes | p99 ready → dispatch |
|---|---:|---:|---:|---:|---:|---:|
| Chrome | 100 | 0% | 0% | 0% | 0 | 0.000 ms |
| Chrome | 500 | 0% | 0% | 0% | 0 | 0.100 ms |
| Chrome | 1000 | 0% | 0% | 0% | 0 | 0.100 ms |
| Electron | 100 | 0% | 0% | 0% | 0 | 0.100 ms |

The final suites comprise 1,700 trials. Seeds intentionally inject failures: the 1,000-trial run produced 373 successful transitions, 101 ambiguous responses, and 526 expected rejection, inventory, challenge, rate-limit, or wrong-page outcomes. Low mixed-suite success percentages are expected; they do not measure booking success probability. The native suite exercised 16 focus-loss handoffs.

Clock interpretation: timestamps use the same renderer monotonic clock. A 0.000 ms measurement means the same Chromium timer bucket, not zero physical latency. T_ACTION is local dispatch start; it is not server receipt or booking completion.

## Findings retained from development

- The first 1,000-trial baseline used a 150 ms verification deadline for every outcome. Under concurrent packaging load, one normal response missed that deadline. GHOST correctly stopped as ambiguous and did not retry. The full baseline trace is retained in the source archive. Final success scenarios use a 1,500 ms verification budget; deliberately ambiguous scenarios keep a short 150 ms deadline.
- Native minimize animation can exceed a short rehearsal readiness budget. The in-app chaos readiness budget is 4,000 ms and native focus-loss simulation awaits the actual window event. Unexpected outcomes are now explicitly counted.
- Restart testing exposed and fixed stale simulator ports in custom profiles.

## Important unfinished or unverified work

- The Windows x64 executable and NSIS installer are cross-built on macOS. They have not been launched or installed on Windows. Native Windows focus, DPI, multi-monitor, installer/uninstaller, upgrade, and signing checks remain.
- Live TTD selectors and custom validation are not fabricated. The built-in live profile is blocked until trained and reviewed; no authenticated live booking was attempted.
- DOM dispatch uses untrusted events. A site may refuse them. Security challenges, authentication, rate limits and unsupported paths hand off; they are not bypassed.
- Full-document navigation is conservatively ambiguous. Correlated navigation/request verification, vision/OCR targeting, native keyboard/coordinate input, shadow DOM/cross-origin frame targeting, calibrated AI-accuracy metrics, and richer training recording remain outside this release.
- PREPARE/SELECT completion is a separate recorded phase result with zero submissions. SUBMIT/CONFIRM verifies the Continue boundary. The software does not claim that preparation completion is a booking.

See [the source README](ghost/README.md) for setup, architecture, privacy behavior, reproducible commands, and release checklist.
