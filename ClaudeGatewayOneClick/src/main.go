package main

import (
	"embed"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"syscall"
)

//go:embed interface.ps1
var assets embed.FS

func main() {
	if runtime.GOOS != "windows" { return }
	script, err := assets.ReadFile("interface.ps1")
	if err != nil { message("Cannot load application interface."); return }

	work, err := os.MkdirTemp("", "KhodeeGateway-*")
	if err != nil { message("Cannot create temporary workspace."); return }
	defer os.RemoveAll(work)
	file := filepath.Join(work, "interface.ps1")
	if err := os.WriteFile(file, script, 0600); err != nil { message("Cannot start application interface."); return }

	ps := filepath.Join(os.Getenv("SystemRoot"), "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
	if os.Getenv("SystemRoot") == "" { ps = "powershell.exe" }
	cmd := exec.Command(ps, "-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-STA", "-File", file)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	if err := cmd.Run(); err != nil { message("Application could not start. PowerShell is required.\n" + err.Error()) }
}

func message(s string) {
	ps := filepath.Join(os.Getenv("SystemRoot"), "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
	// Do not interpolate the error message into executable commands.
	_ = fmt.Sprint(s)
	_ = exec.Command(ps, "-NoProfile", "-Command", "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('Please check the app documentation.','Khodee Gateway')").Run()
}
