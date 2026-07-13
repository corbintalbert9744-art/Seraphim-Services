@echo off
setlocal

REM Patches Seraphim-Macro-v1.0.3 with offline license validation.
REM Usage:
REM   PATCH-MACRO.bat "C:\path\to\Seraphim-Sharing\Seraphim-Macro-v1.0.3"
REM Or drag the extracted macro folder onto this .bat file.

set "MACRO_DIR=%~1"
if "%MACRO_DIR%"=="" (
  echo.
  echo Usage: PATCH-MACRO.bat "path\to\extracted\Seraphim-Macro-v1.0.3"
  echo.
  echo 1. Unzip Seraphim-Macro-v1.0.3.zip from your Seraphim-Sharing folder
  echo 2. Run this script pointing at the extracted folder
  echo.
  pause
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install from https://nodejs.org
  pause
  exit /b 1
)

node "%~dp0apply-license.mjs" "%MACRO_DIR%"
if errorlevel 1 (
  echo Patch failed.
  pause
  exit /b 1
)

echo.
echo Done. Keys from Seraphim Keyboard Macro v1.2.0 admin panel should now work.
pause
