# GHOST 0.3.0 validation

The new fixed-time mode targets +400 ms and +500 ms relative to a selected computer-local time. It removes the earlier transition-history requirement for those slots, retains current target/form/focus checks, and cancels a remaining slot when submission progress is observed. Readiness mode retains its one-action limit.

## Verified

- Production TypeScript/build: passed.
- Core, SQLite, profiles, network and route tests: 50 passed.
- Existing real Chromium scenarios: 35 passed.
- New real Chromium timed scenarios: 8 passed. These cover two clicks without progress, enabling between slots, persistent disablement, request cancellation, page-progress cancellation, invalid form, abort and a stalled renderer.
- Desktop acceptance: passed under macOS Electron, including persistence, isolation, seven screens and restart.
- Desktop layer cases: 15 passed, including real loopback submission cancelling the second slot and a first no-op followed by a successful second-slot submission.
- Packaged main/browser/rehearsal bytes match the final build. Packaged layer acceptance status is recorded in GHOST-0.3.0-package-validation.json.

These scenarios deliberately include blocked and ambiguous outcomes. Passing a test means its expected outcome occurred, not that every simulated booking succeeded. Timed click measurements and lateness appear in test-results/timed.json in the source archive. The tests do not establish hard real-time behavior or production booking success.

## Use

Choose **Execution → Timing mode → Fixed time · +400 ms and +500 ms**. Set the required local date/time, review preflight, authorize up to two clicks and arm before the target. For 09:03:00, the slots target 09:03:00.400 and 09:03:00.500.

Read GHOST-0.3.0-TIMED-MODE.md for exact cancellation, missed-slot and clock behavior. Disabled buttons are skipped; the app does not force enablement. A second click is possible if no progress from the first is observed in time. The website may still reject either click or request.

## Remaining boundary

The Windows package is cross-built and unsigned. Native Windows execution and authenticated live TTD behavior remain unverified. Login, CAPTCHA and payment remain manual. No guarantee of booking, inventory or security acceptance is made.
