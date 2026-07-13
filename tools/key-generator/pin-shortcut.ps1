# Creates Desktop + Start Menu shortcuts for Seraphim Admin Panel (Windows)
# After running, right-click the shortcut -> Pin to taskbar

$ErrorActionPreference = "Stop"
$AppName = "Seraphim Admin Panel"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$KeyGenDir = Join-Path $ProjectRoot "tools\key-generator"

# Prefer installed/built exe, then portable, then dev electron
$BuiltExe = Join-Path $KeyGenDir "dist\win-unpacked\$AppName.exe"
$ElectronCmd = Join-Path $ProjectRoot "node_modules\.bin\electron.cmd"
$MainScript = Join-Path $KeyGenDir "electron-main.mjs"

if (Test-Path $BuiltExe) {
    $TargetPath = $BuiltExe
    $Arguments = ""
    $WorkingDirectory = Split-Path $BuiltExe
    Write-Host "Using built app: $TargetPath"
}
elseif (Test-Path $ElectronCmd) {
    $TargetPath = $ElectronCmd
    $Arguments = "`"$MainScript`""
    $WorkingDirectory = $ProjectRoot
    Write-Host "Using dev Electron launcher"
}
else {
    Write-Host "ERROR: Run 'npm install' first, or build with 'npm run keygen:build'" -ForegroundColor Red
    exit 1
}

$WshShell = New-Object -ComObject WScript.Shell

$DesktopShortcut = Join-Path ([Environment]::GetFolderPath("Desktop")) "$AppName.lnk"
$DesktopLink = $WshShell.CreateShortcut($DesktopShortcut)
$DesktopLink.TargetPath = $TargetPath
$DesktopLink.Arguments = $Arguments
$DesktopLink.WorkingDirectory = $WorkingDirectory
$DesktopLink.Description = "Seraphim license key admin panel"
$DesktopLink.Save()
Write-Host "Desktop shortcut: $DesktopShortcut" -ForegroundColor Green

$StartMenuDir = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$StartMenuShortcut = Join-Path $StartMenuDir "$AppName.lnk"
$StartMenuLink = $WshShell.CreateShortcut($StartMenuShortcut)
$StartMenuLink.TargetPath = $TargetPath
$StartMenuLink.Arguments = $Arguments
$StartMenuLink.WorkingDirectory = $WorkingDirectory
$StartMenuLink.Description = "Seraphim license key admin panel"
$StartMenuLink.Save()
Write-Host "Start Menu shortcut: $StartMenuShortcut" -ForegroundColor Green

Write-Host ""
Write-Host "To pin to taskbar:" -ForegroundColor Yellow
Write-Host "  1. Right-click the Desktop shortcut '$AppName'"
Write-Host "  2. Click 'Pin to taskbar'"
Write-Host ""
Write-Host "Or: Launch the app, then right-click its taskbar icon -> Pin to taskbar"

# Launch once so the app appears on the taskbar for easy pinning
Start-Process -FilePath $TargetPath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory
