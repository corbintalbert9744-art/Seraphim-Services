@echo off
title Build Seraphim Admin Panel Desktop App
cd /d "%~dp0"

echo ================================================
echo   Building Seraphim Admin Panel (.exe)
echo   This creates a desktop app you can double-click
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
if exist "dist\Seraphim-Admin-Panel.exe" (
  copy /Y "dist\Seraphim-Admin-Panel.exe" "%USERPROFILE%\Desktop\Seraphim Admin Panel.exe"
  echo.
  echo ================================================
  echo   SUCCESS!
  echo   Double-click "Seraphim Admin Panel" on your Desktop
  echo ================================================
) else (
  echo Could not find dist\Seraphim-Admin-Panel.exe
  echo Check tools\key-generator\dist\ for the built file.
  goto :error
)

pause
exit /b 0

:error
echo.
echo Build failed. Make sure Node.js is installed: https://nodejs.org
pause
exit /b 1
