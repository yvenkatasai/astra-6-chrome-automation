# GHOST 0.3.1 Windows startup repair

## Identified defect

Version 0.3.0 wrote its SQLite snapshot, reopened the temporary file read-only, and called fsync on that handle. On Windows, libuv implements that operation with FlushFileBuffers, which requires write access. Because the first snapshot is saved during startup, this code path can fail before the UI is created. The startup promise previously lacked an error handler.

Version 0.3.1 writes and flushes through the same writable handle, closes it, and then atomically replaces the database snapshot. It also reports startup initialization errors in a native error box and writes a local startup report. A failed local-server bind now reaches the same error handler. Existing database files are not deleted or silently reset.

Sources: [Microsoft FlushFileBuffers contract](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-flushfilebuffers), [libuv Windows filesystem implementation](https://github.com/libuv/libuv/blob/v1.x/src/win/fs.c).

This is a source-confirmed Windows incompatibility. Without an error report from the recipient laptop, it is not proof that this is the only cause of that laptop's failure.

## Run the corrected package

1. On Windows, press Ctrl+Shift+Esc. If GHOST is still listed, end its task before launching the new version. An old background instance can prevent another copy opening.
2. Extract GHOST-0.3.1-Windows-x64.zip into a new folder, or use GHOST-Setup-0.3.1.exe.
3. Open the new folder and double-click GHOST.exe. Keep all packaged files together.
4. If it still fails, run Start-GHOST-Diagnostics.cmd from that same folder. Share the exact error-box message and startup-report.txt from the diagnostics folder that opens. Review additional logs before sharing them.

The diagnostic launcher checks essential extracted files, removes an inherited Electron Node-only flag for its child process, enables local Chromium logging, and lists GHOST processes. It does not disable antivirus or the browser sandbox. For a specifically diagnosed graphics issue, its optional `software` argument selects software rendering. Ordinary launches keep normal hardware acceleration.

## Validation

- 51 core, database, network, profile, route and controller tests passed.
- The new regression harness rejects read-only fsync under Windows semantics; database startup, persistence and reopening pass with the writable handle.
- Actual macOS Electron desktop acceptance and restart passed.
- A corrupt-database startup test confirms a visible error notification is requested, a report is saved, the app exits with failure, and the original file remains intact.
- See GHOST-0.3.1-package-validation.json for final packaged checks.

The regression harness is not a native Windows run. The rebuilt Windows package still needs confirmation on the recipient laptop. Packages remain unsigned. Timing modes and website submission rules are unchanged from 0.3.0.
