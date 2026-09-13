# GHOST 0.2.1 — validation and use

This release implements the supplied Srivani URL and findings from the portal's public template/controller. It is an engineering preview, cross-built on macOS for Windows x64.

## What changed

- Exact origin, pathname and hash-route matching for the supplied confirmation page.
- `button#smp` resolution inside the common `.cnt_new.edonat` section; Continue is outside the pilgrim form.
- Observed disabled-to-enabled transition on the current button, Angular form validity, CAPTCHA input validity and existing actionability checks. The initial enabled markup cannot authorize a click.
- Passive verification of `POST /dms/continue` and the payment-page route. The summary poll cannot count as submission proof.
- Immediate arming no longer depends on a fresh HTTP Date sample. Clock-scheduled arming still does.
- Migration of the untouched legacy profile; reviewed and customized configurations remain intact.

See GHOST-0.2.1-SITE-EVIDENCE.md for source links, observations and limits.

## Validation

- TypeScript and production build passed.
- 44 core, SQLite, network, profile and route tests passed.
- 35 real Chromium scenarios passed. New cases cover hash-route mismatch, route changes while armed, constant button color, sibling form/button structure, wrong payment route, invalid Angular form and initial enabled state before release.
- Desktop acceptance passed under macOS Electron, including SQLite persistence, isolated renderer, profile preparation, seven screens and restart. One earlier run correctly refused dispatch when macOS did not grant focus; the rerun passed.
- 13 desktop layer scenarios passed, including a real loopback POST and payment hash transition using the source-derived adapter.
- Packaged main, browser and rehearsal bytes match the tested production build. See the package-validation JSON for packaged acceptance status.

The earlier 1,100-trial fault report belongs to 0.2.0 and is not presented as a new 0.2.1 run. Current JSON reports are included in the source ZIP; test browser data and public-site downloads are excluded.

## Using the adapter

1. Install GHOST or extract the complete portable ZIP and launch GHOST.exe.
2. Select the TTD Srivani profile and open its booking browser. Complete login and reach the confirmation page through the normal website workflow.
3. Complete and check the pilgrim information and CAPTCHA manually. Review the configured selectors against the live page and save the profile with its review checkbox selected.
4. Arm **before release**, while Continue is disabled. Keep the owned browser focused. Immediate arming observes enablement rather than guessing a release timestamp.
5. The confirmed outcome is progression to the payment page. Payment and final booking completion remain separate manual steps.

The live template remains unreviewed by default because public-source inspection is not authenticated live validation. Arming after Continue is already enabled waits for an observed disabled-to-enabled transition rather than assuming one occurred. An ambiguous submission is not automatically retried.

## Remaining validation boundary

Native Windows execution and authenticated live TTD behavior have not been verified. The package is unsigned. Website acceptance, CAPTCHA correctness, inventory and completed booking are not guaranteed. GHOST does not modify the release clock, force enablement, replay the submission API, or bypass security challenges.
