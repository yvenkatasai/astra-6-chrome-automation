@echo off
setlocal
cd /d "%~dp0"
echo GHOST startup diagnostics
for %%F in (GHOST.exe resources\app.asar icudtl.dat resources.pak v8_context_snapshot.bin) do if not exist "%%F" goto incomplete
set "GHOST_DIAG_DIR=%TEMP%\GHOST-Diagnostics-%RANDOM%-%RANDOM%"
mkdir "%GHOST_DIAG_DIR%"
if not exist "%GHOST_DIAG_DIR%" goto logfailed
ver > "%GHOST_DIAG_DIR%\startup-report.txt"
echo Processor: "%PROCESSOR_ARCHITECTURE%" >> "%GHOST_DIAG_DIR%\startup-report.txt"
echo Native processor: "%PROCESSOR_ARCHITEW6432%" >> "%GHOST_DIAG_DIR%\startup-report.txt"
echo Starting the fully extracted GHOST package. >> "%GHOST_DIAG_DIR%\startup-report.txt"
set "ELECTRON_RUN_AS_NODE="
set "GHOST_RENDER_FLAG="
if /I "%~1"=="software" set "GHOST_RENDER_FLAG=--ghost-software-rendering"
start "" "%~dp0GHOST.exe" --enable-logging=file "--log-file=%GHOST_DIAG_DIR%\chromium.log" %GHOST_RENDER_FLAG%
echo Waiting for startup...
timeout /t 8 /nobreak >nul
tasklist /FI "IMAGENAME eq GHOST.exe" >> "%GHOST_DIAG_DIR%\startup-report.txt"
echo.
echo Diagnostics folder: "%GHOST_DIAG_DIR%"
echo If an error box appeared, share its exact message and startup-report.txt.
echo Review additional logs for private information before sharing them.
start "" explorer.exe "%GHOST_DIAG_DIR%"
pause
exit /b 0
:incomplete
echo Required package files are missing.
echo Right-click the ZIP, choose Extract All, and run this from the extracted folder.
echo Keep GHOST.exe, resources and the other extracted files together.
pause
exit /b 2
:logfailed
echo Unable to create a diagnostics folder in TEMP.
pause
exit /b 3
