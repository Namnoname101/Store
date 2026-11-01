@echo off
setlocal
echo ==============================================
echo   Building Khodee Gateway OneClick EXE
echo ==============================================

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "if (-not (Get-Module -ListAvailable -Name ps2exe)) { Write-Host 'Installing ps2exe...'; Install-Module -Name ps2exe -Scope CurrentUser -Force }; ^
   Import-Module ps2exe; ^
   Invoke-PS2EXE -InputFile '%~dp0src\interface.ps1' -OutputFile '%~dp0KhodeeGateway.exe' -iconFile '%~dp0app.ico' -NoConsole -Title 'Khodee Gateway' -Description 'Khodee Gateway OneClick Tool' -Company 'Khodee' -Version '0.3.3.0' -STA -requireAdmin"

if errorlevel 1 (
    echo [ERROR] Build that bai!
    pause
    exit /b 1
)

echo.
echo [OK] Da tao thanh cong: KhodeeGateway.exe
echo.
pause
