@echo off
title Seraphim Admin Panel
cd /d "%~dp0..\.."

echo Starting Seraphim Admin Panel...
echo.

if not exist "node_modules\electron" (
  echo Installing dependencies first...
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Make sure Node.js is installed.
    pause
    exit /b 1
  )
)

call npm run keygen
if errorlevel 1 (
  echo.
  echo The app failed to start. See errors above.
  pause
)
