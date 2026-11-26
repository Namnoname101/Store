@echo off
setlocal
echo ======================================================
echo   Building DaiTruong-helper v3.0 (Windows + macOS)
echo ======================================================

set "CSC=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
set "WPF=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\WPF"
set "FW=C:\Windows\Microsoft.NET\Framework64\v4.0.30319"

"%CSC%" /nologo /target:winexe /optimize+ /out:"%~dp0DaiTruong-helper.exe" /win32icon:"%~dp0app.ico" /win32manifest:"%~dp0src\app.manifest" ^
  /r:"%WPF%\PresentationFramework.dll" ^
  /r:"%WPF%\PresentationCore.dll" ^
  /r:"%WPF%\WindowsBase.dll" ^
  /r:"%FW%\System.Xaml.dll" ^
  /r:"%FW%\System.Drawing.dll" ^
  /r:"%FW%\System.Security.dll" ^
  "%~dp0src\DaiTruongHelper.cs"

if errorlevel 1 (
    echo [ERROR] Build that bai!
    pause
    exit /b 1
)

copy /Y "%~dp0DaiTruong-helper.exe" "%~dp0DaiTruongGateway.exe" >nul
copy /Y "%~dp0DaiTruong-helper.exe" "%~dp0KhodeeGateway.exe" >nul

echo.
echo [OK] Da tao thanh cong: DaiTruong-helper.exe (v3.0.0)
echo.
