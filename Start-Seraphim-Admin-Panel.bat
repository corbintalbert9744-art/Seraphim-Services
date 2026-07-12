@echo off
title Seraphim Admin Panel

if exist "%USERPROFILE%\Desktop\Seraphim Admin Panel.exe" (
  start "" "%USERPROFILE%\Desktop\Seraphim Admin Panel.exe"
  exit /b 0
)

if exist "%~dp0tools\key-generator\dist\Seraphim-Admin-Panel.exe" (
  start "" "%~dp0tools\key-generator\dist\Seraphim-Admin-Panel.exe"
  exit /b 0
)

echo No desktop app found yet.
echo.
echo Double-click BUILD-DESKTOP-APP.bat once to create
echo "Seraphim Admin Panel.exe" on your Desktop.
echo.
pause
