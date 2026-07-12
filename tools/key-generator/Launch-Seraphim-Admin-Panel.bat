@echo off
title Seraphim Admin Panel (Electron)
cd /d "%~dp0..\.."

echo ========================================
echo   Seraphim Admin Panel - Electron App
echo ========================================
echo.

if not exist "node_modules\electron" (
  if not exist "tools\key-generator\node_modules\electron" (
    echo Installing dependencies...
    call npm install
    cd tools\key-generator
    call npm install
    cd ..\..
  )
)

echo Launching Electron desktop window...
echo.

cd tools\key-generator
call npm run start
if errorlevel 1 (
  echo.
  echo Electron failed to start. See errors above.
  pause
)
