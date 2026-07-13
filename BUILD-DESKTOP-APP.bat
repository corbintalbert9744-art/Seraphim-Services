@echo off
title Build Seraphim Keyboard Macro Desktop App
cd /d "%~dp0"

echo ================================================
echo   Building Seraphim Keyboard Macro (.exe)
echo ================================================
echo.

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 goto :error

cd tools\key-generator
call npm install
if errorlevel 1 goto :error

echo.
echo [2/3] Building Electron portable app (may take 2-5 min)...
call npm run build:portable
if errorlevel 1 goto :error

echo.
echo [3/3] Copying to your Desktop...
if exist "dist\Seraphim-Keyboard-Macro.exe" (
  copy /Y "dist\Seraphim-Keyboard-Macro.exe" "%USERPROFILE%\Desktop\Seraphim Keyboard Macro.exe"
  echo.
  echo ================================================
  echo   SUCCESS!
  echo   Double-click "Seraphim Keyboard Macro" on your Desktop
  echo ================================================
) else (
  echo Could not find dist\Seraphim-Keyboard-Macro.exe
  goto :error
)

pause
exit /b 0

:error
echo.
echo Build failed. Make sure Node.js is installed: https://nodejs.org
pause
exit /b 1
