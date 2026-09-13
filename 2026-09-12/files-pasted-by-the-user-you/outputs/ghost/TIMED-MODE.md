# Fixed-time attempts — GHOST 0.3.0

In Execution, select **Fixed time · +400 ms and +500 ms**, set the date and local time, review preflight, authorize up to two clicks, and arm before the selected target time.

For a target of **09:03:00**, the two slots are **09:03:00.400** and **09:03:00.500**. The second offset is measured from the same target, not 500 ms after the first click.

The target uses the computer's local clock. At arming, the browser converts it into a monotonic countdown. A later system-clock correction does not move that countdown. Targets must be in the future and within 24 hours. There is no HTTP Date sample requirement for this mode.

## What changes

The timed mode does not require an earlier disabled-to-enabled observation or the profile's interaction-ready marker. At each slot it resolves the current target and checks its present state. A still-disabled button is skipped, as are invalid forms, hidden or covered targets, and incorrect page/focus conditions. The website's disabled state is never removed and its validation is never patched.

If the first slot is blocked and the target becomes actionable by the second, the second can click. If the first click produces no observable progress, the second slot may issue another click. This is a deliberate change from the default readiness mode's one-action limit.

A matching submission request cancels a pending second slot. Positive page progress also cancels it. Rejection, rate limiting, security challenges, abort and loss of page/window identity stop or block remaining actions. Once both slots are consumed, no further click is scheduled.

Cancellation depends on receiving observations in time. It cannot guarantee that a second request is impossible: the first handler or network notification can be delayed. Multiple matching requests are classified as ambiguous rather than reported as booking success. A successful Continue result requires a matching successful response and the configured positive page transition.

## Timing and diagnostics

Browser timers are not hard real-time. GHOST records the actual attempt time, lateness, outcome and blocking reason in Diagnostics. It never reports a scheduled time as a measured click time.

To prevent two overdue clicks being compressed together after a renderer stall, the +400 ms slot is skipped if it is at least 100 ms late. The +500 ms slot is skipped if it is at least 250 ms late. A slot skipped for timing is marked **missed**. Other outcomes are **clicked**, **blocked** or **cancelled**.

Readiness mode remains the default. Its observed-transition gate and one-action limit remain intact. Timed executions are excluded from the readiness predictor's training samples. Neither mode guarantees website acceptance, inventory or completed booking. Login, CAPTCHA and payment remain manual; native Windows and authenticated live TTD behavior remain unverified.
