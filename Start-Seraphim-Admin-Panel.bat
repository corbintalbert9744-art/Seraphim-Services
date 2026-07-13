@echo off
title Seraphim Keyboard Macro

if exist "%USERPROFILE%\Desktop\Seraphim Keyboard Macro.exe" (
  start "" "%USERPROFILE%\Desktop\Seraphim Keyboard Macro.exe"
  exit /b 0
)

if exist "%~dp0tools\key-generator\dist\Seraphim-Keyboard-Macro.exe" (
  start "" "%~dp0tools\key-generator\dist\Seraphim-Keyboard-Macro.exe"
  exit /b 0
)

if exist "%USERPROFILE%\Desktop\Seraphim Admin Panel.exe" (
  start "" "%USERPROFILE%\Desktop\Seraphim Admin Panel.exe"
  exit /b 0
)

echo Download the latest app from GitHub Releases.
pause
