# GHOST 0.2.0 validation

Engineering preview, prepared 2026-09-13. This release improves local click readiness and submission diagnostics. It cannot guarantee website acceptance, inventory, or bypass security protections.

## Changes

- Resolve the current unique DOM target and inspect real enabled state, ancestor visibility, geometry, hit testing, form validity, window identity and focus.
- Require configurable application-readiness and CAPTCHA-expiry signals. Simulate late and absent event handlers.
- Observe the configured submission endpoint by exact origin, path and method. Report missing requests, transport failures, HTTP rejection, authentication requirements, duplicate matching requests and responses without a verified transition.
- Require positive page evidence as well as a successful matching response when network verification is configured. An HTTP 200 alone is insufficient.
- Honor observed Retry-After and persist a cooldown. Never automatically repeat an ambiguous submission.
- Add network evidence to Diagnostics and expand the rehearsal faults and acceptance suites.

See GHOST-0.2.0-LAYER-COVERAGE.md for all 16 requested conditions and their limits.

## Completed validation

| Check | Result |
|---|---|
| TypeScript and production build | Passed |
| Core, SQLite and network tests | 38 passed |
| Real Chromium browser scenarios | 26 passed |
| Targeted desktop layer scenarios | 12 passed |
| Desktop acceptance | Passed, including seven screens, profile preparation, capture interception, isolation, history and restart |
| In-app Electron fault trials | 100; zero unexpected outcomes, false actions, duplicate actions or stale-target actions |
| Headless Chromium fault trials | 1,000; zero unexpected outcomes, false actions, duplicate actions or stale-target actions |
| Final Windows app.asar under macOS Electron | Desktop and targeted layer acceptance passed |
| Packaged main, browser and rehearsal bytes | Match final built files |
| Windows NSIS installer and portable archive | Built; portable ZIP integrity and bundled app.asar checked |
| Dependency audit | Zero reported vulnerabilities at validation time |

The 1,100 fault trials deliberately include failure conditions. Their successful-submission rates are 25% (native Electron) and 37.3% (headless), reflecting the scenario mix, not a booking success estimate. All scenarios reached their expected outcomes. The native suite includes 16 real window-focus-loss trials.

The headless suite exercises the DOM controller; the native suite and targeted desktop checks exercise the Electron network bridge. Timing results are local observer-to-dispatch measurements at browser timer resolution, not Windows input latency or live-server booking speed. A measured zero means the same timer bucket.

## Reproduction

Use the source ZIP, install its lockfile with npm ci, then run:

```sh
npm run build
npm test
npm run test:browser
npm run test:desktop
node scripts/layer-test.mjs
node scripts/chaos-desktop.mjs
npm run chaos -- 1000 314159
npm run package:installer
```

Interactive Electron checks require a graphical desktop. Current JSON reports are included under test-results in the source archive. Historical 0.1 reports and browser user-data folders are excluded.

## Validation boundary

The host was macOS ARM64. Windows packaging is cross-built and unsigned. Native Windows execution, DPI/multi-monitor behavior, and authenticated live TTD compatibility remain unverified. The live profile needs reviewed site-specific selectors and readiness/verification signals before use.

Continue uses HTMLElement.click(), producing a synthetic event. The website may reject that event or the browser environment. CAPTCHA completion, valid inputs, authentication, server acceptance and inventory remain necessary. No CAPTCHA solver, access-control bypass, fingerprint spoofing, cursor disguise or rate-limit evasion is implemented.
