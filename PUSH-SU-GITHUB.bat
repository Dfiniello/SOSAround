@echo off
REM Doppio click su questo file per pushare il progetto su GitHub
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0push-to-github.ps1"
echo.
echo Premi un tasto per chiudere...
pause >nul
