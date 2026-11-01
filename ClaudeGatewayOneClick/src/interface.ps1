# Khodee Gateway OneClick v0.2 - HTML UI via WebBrowser control
# Single-file PowerShell → EXE. No third-party runtime needed.
trap {
  [System.IO.File]::WriteAllText("$env:TEMP\khodee_err.log",
    ($_.Exception.ToString() + "`n" + $_.ScriptStackTrace))
}
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

# ── Force IE11 Edge rendering mode ──
$featureKey = 'HKCU:\SOFTWARE\Microsoft\Internet Explorer\Main\FeatureControl\FEATURE_BROWSER_EMULATION'
if (-not (Test-Path $featureKey)) { [void](New-Item -Path $featureKey -Force) }
$exeName = [System.IO.Path]::GetFileName(
  [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName)
[void](New-ItemProperty -Path $featureKey -Name $exeName `
  -Value 11001 -PropertyType DWORD -Force)

# ═══════════════════════════════════════
# DEFAULTS (only Base URL & Auth Scheme)
# ═══════════════════════════════════════
$script:defaults = @{
  gatewayUrl = 'https://1gw.gwai.cloud'
  authScheme = 'x-api-key'
}

# ═══════════════════════════════════════
# REGISTRY & BACKUP HELPERS
# ═══════════════════════════════════════
$script:policyPath  = 'HKCU:\SOFTWARE\Policies\Claude'
$script:machinePath = 'HKLM:\SOFTWARE\Policies\Claude'
$script:managedKeys = @(
  'inferenceProvider','inferenceCredentialKind','inferenceGatewayBaseUrl',
  'inferenceGatewayApiKey','inferenceGatewayAuthScheme','chatTabEnabled','developerModeEnabled','claudeAiImport'
)
$script:backupDir = Join-Path $env:LOCALAPPDATA 'KhodeeGateway\backups'

function Backup-CurrentPolicy {
  if (-not (Test-Path -LiteralPath $script:backupDir)) {
    [void](New-Item -ItemType Directory -Path $script:backupDir -Force)
  }
  $snapshot = [ordered]@{ version=1; capturedAt=(Get-Date).ToString('o'); entries=@() }
  $rk = Get-Item -LiteralPath $script:policyPath -ErrorAction SilentlyContinue
  $available = @(); if ($null -ne $rk) { $available = @($rk.GetValueNames()) }
  foreach ($key in $script:managedKeys) {
    $exists = ($available -contains $key)
    $value  = ''
    if ($exists) {
      $value = [string]($rk.GetValue($key,$null,
        [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames))
    }
    $snapshot.entries += [ordered]@{ name=$key; exists=$exists; value=$value }
  }
  $plain     = $snapshot | ConvertTo-Json -Depth 5 -Compress
  $encrypted = ConvertTo-SecureString -String $plain -AsPlainText -Force |
               ConvertFrom-SecureString
  $fname = (Get-Date -Format 'yyyyMMdd_HHmmss_fff') + '.dpapi'
  $path  = Join-Path $script:backupDir $fname
  [System.IO.File]::WriteAllText($path, $encrypted, [System.Text.Encoding]::UTF8)
  return $path
}

function Restore-Policy([string]$path) {
  $protected = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $secure = ConvertTo-SecureString -String $protected
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try   { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  $backup = $plain | ConvertFrom-Json
  if ($backup.version -ne 1 -or $null -eq $backup.entries) {
    throw 'Invalid backup format.'
  }
  if (-not (Test-Path -LiteralPath $script:policyPath)) {
    [void](New-Item -Path $script:policyPath -Force)
  }
  foreach ($entry in @($backup.entries)) {
    if ($script:managedKeys -notcontains [string]$entry.name) { continue }
    if ($entry.exists) {
      [void](New-ItemProperty -Path $script:policyPath `
        -Name ([string]$entry.name) -Value ([string]$entry.value) `
        -PropertyType String -Force)
    } else {
      Remove-ItemProperty -Path $script:policyPath `
        -Name ([string]$entry.name) -ErrorAction SilentlyContinue
    }
  }
}

function Assert-NoMachinePolicy {
  $rk = Get-Item -LiteralPath $script:machinePath -ErrorAction SilentlyContinue
  if ($null -ne $rk -and @($rk.GetValueNames()).Count -gt 0) {
    throw 'Policy HKLM ton tai. Lien he admin.'
  }
}

function Find-Claude {
  try {
    if (@(Get-Process | Where-Object { $_.ProcessName -like '*claude*' } -ErrorAction SilentlyContinue).Count -gt 0) {
      return 'running'
    }
    $paths = @(
      (Join-Path $env:LOCALAPPDATA 'Programs\Claude\Claude.exe'),
      (Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps\claude-desktop.exe'),
      (Join-Path $env:LOCALAPPDATA 'Claude'),
      (Join-Path $env:ProgramFiles 'Claude\Claude.exe'),
      (Join-Path ${env:ProgramFiles(x86)} 'Claude\Claude.exe')
    )
    foreach ($p in $paths) {
      if (Test-Path $p) { return 'installed' }
    }
    if (@(Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'Packages') -Filter '*Claude*' -ErrorAction SilentlyContinue).Count -gt 0) {
      return 'installed'
    }
  } catch {}
  return 'none'
}

function Get-ParsedModels([string]$raw) {
  $models = @($raw -split '[,;\r\n]+' |
    ForEach-Object { $_.Trim() } |
    Where-Object { $_ -ne '' } |
    Select-Object -Unique)
  foreach ($m in $models) {
    if ($m.Length -gt 128 -or $m -notmatch '^[a-zA-Z0-9._:/-]+$') {
      throw "Model ID khong hop le: $m"
    }
  }
  return ,$models
}

function Restart-ClaudeApp {
  try {
    # 1. Kill any running Claude processes (including tray)
    $claudeProcs = @(Get-Process | Where-Object { $_.ProcessName -like '*claude*' -and $_.ProcessName -notlike '*gateway*' -and $_.ProcessName -notlike '*code*' } -ErrorAction SilentlyContinue)
    if ($claudeProcs.Count -gt 0) {
      Invoke-JsLog 'Dang tat Claude Desktop dang chay...' 'info'
      foreach ($p in $claudeProcs) {
        Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
      }
      Start-Sleep -Milliseconds 1200
    }

    # 2. Launch Claude Desktop afresh
    Invoke-JsLog 'Tu dong khoi dong lai Claude Desktop...' 'info'
    $restarted = $false
    if (Test-Path "$env:LOCALAPPDATA\Microsoft\WindowsApps\claude-desktop.exe") {
      Start-Process "$env:LOCALAPPDATA\Microsoft\WindowsApps\claude-desktop.exe" -ErrorAction SilentlyContinue
      $restarted = $true
    } elseif (Test-Path "$env:LOCALAPPDATA\Programs\Claude\Claude.exe") {
      Start-Process "$env:LOCALAPPDATA\Programs\Claude\Claude.exe" -ErrorAction SilentlyContinue
      $restarted = $true
    } elseif (Test-Path "$env:ProgramFiles\Claude\Claude.exe") {
      Start-Process "$env:ProgramFiles\Claude\Claude.exe" -ErrorAction SilentlyContinue
      $restarted = $true
    } elseif (Test-Path "${env:ProgramFiles(x86)}\Claude\Claude.exe") {
      Start-Process "${env:ProgramFiles(x86)}\Claude\Claude.exe" -ErrorAction SilentlyContinue
      $restarted = $true
    } elseif (Get-Command 'claude-desktop' -ErrorAction SilentlyContinue) {
      Start-Process 'claude-desktop' -ErrorAction SilentlyContinue
      $restarted = $true
    }

    if ($restarted) {
      Invoke-JsLog 'Claude Desktop da khoi dong lai voi cau hinh moi!' 'success'
    } else {
      Invoke-JsLog 'Da ghi xong. Vui long mo lai Claude Desktop.' 'success'
    }
    return $restarted
  } catch {
    Invoke-JsLog 'Khong the tu khoi dong lai Claude. Hay mo thu cong.' 'warn'
    return $false
  }
}

# ═══════════════════════════════════════
# DETECT CLAUDE
# ═══════════════════════════════════════
$claudeState = Find-Claude
$claudeStatusText = switch ($claudeState) {
  'running'   { 'Claude Desktop detected (running)' }
  'installed' { 'Claude Desktop detected' }
  default     { 'Claude Desktop not found' }
}
$claudeStatusColor = if ($claudeState -eq 'none') { '#f59e0b' } else { '#10b981' }

# ═══════════════════════════════════════
# HTML TEMPLATE (IE11-compatible)
# ═══════════════════════════════════════
$html = @'
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta charset="utf-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; overflow: hidden; margin: 0; }
body {
  font-family: 'Segoe UI', Tahoma, sans-serif;
  background: #0b0f1a;
  color: #f1f5f9;
  font-size: 13px;
}
/* ── Gradient overlay ── */
.bg-wrap {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: #0b0f1a;
  overflow: hidden;
}
.bg-wrap::before {
  content: '';
  position: fixed; top: -120px; left: 50%; width: 700px; height: 400px;
  margin-left: -350px;
  background: radial-gradient(ellipse, rgba(99,102,241,0.18), transparent 70%);
  pointer-events: none;
}
/* ── Container ── */
.container {
  position: relative;
  max-width: 420px; margin: 0 auto; padding: 14px 14px 6px;
}
/* ── Header ── */
.header { text-align: center; margin-bottom: 10px; }
.brand { font-size: 19px; font-weight: 700; letter-spacing: -0.3px; color: #f1f5f9; }
.status-row { display: -ms-flexbox; display: flex;
  -ms-flex-align: center; align-items: center;
  -ms-flex-pack: center; justify-content: center;
  gap: 6px; font-size: 11.5px; margin-top: 4px; }
.dot {
  width: 6px; height: 6px; border-radius: 50%;
  display: inline-block;
}
@-ms-keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
.dot-pulse { -ms-animation: pulse 2s infinite; animation: pulse 2s infinite; }
/* ── Card ── */
.card {
  background: rgba(22,30,48,0.82);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 18px;
  overflow: hidden;
}
/* ── Main section ── */
.main-section { padding: 18px 22px 16px; }
.label-row {
  display: -ms-flexbox; display: flex;
  -ms-flex-align: center; align-items: center;
  gap: 8px; margin-bottom: 8px;
}
.label-text {
  font-size: 11px; font-weight: 700;
  letter-spacing: 0.07em; text-transform: uppercase;
  color: #64748b;
}
.label-note {
  font-size: 10px; font-weight: 400; color: #f43f5e;
  text-transform: none; letter-spacing: 0;
}
.input-wrap { position: relative; margin-bottom: 12px; }
.api-input {
  width: 100%; height: 42px;
  padding: 0 98px 0 14px;
  background: #1a2338;
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  color: #f1f5f9; font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: Consolas, 'Courier New', monospace;
}
.api-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}
.api-input::-ms-input-placeholder { color: #475569; }
.api-input::placeholder { color: #475569; }
.input-actions {
  position: absolute; right: 8px; top: 50%;
  -ms-transform: translateY(-50%); transform: translateY(-50%);
  display: -ms-flexbox; display: flex; gap: 4px;
}
.action-btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  color: #94a3b8; cursor: pointer; padding: 4px 8px;
  border-radius: 6px; font-size: 11.5px;
  font-family: 'Segoe UI', sans-serif;
  transition: background 0.2s, color 0.2s;
}
.action-btn:hover {
  background: rgba(255,255,255,0.14);
  color: #f1f5f9;
}
/* ── Big button ── */
.btn-main {
  width: 100%; height: 42px;
  background: linear-gradient(135deg, #6366f1, #3b82f6);
  color: #fff; font-weight: 600; font-size: 14px;
  border: none; border-radius: 12px; cursor: pointer;
  display: -ms-flexbox; display: flex;
  -ms-flex-align: center; align-items: center;
  -ms-flex-pack: center; justify-content: center;
  gap: 8px;
  transition: box-shadow 0.2s, transform 0.15s;
  font-family: 'Segoe UI', sans-serif;
}
.btn-main:hover {
  box-shadow: 0 6px 24px rgba(99,102,241,0.35);
  -ms-transform: translateY(-1px); transform: translateY(-1px);
}
.btn-main:active { -ms-transform: translateY(0); transform: translateY(0); }
.btn-main.done {
  background: linear-gradient(135deg, #10b981, #059669);
}
.btn-main:disabled { opacity: 0.7; cursor: default;
  -ms-transform: none; transform: none; box-shadow: none; }
/* ── Activity Log Console ── */
.log-card {
  margin-top: 12px;
  background: rgba(13, 19, 33, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 10px 12px 10px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}
.log-header {
  display: -ms-flexbox; display: flex;
  -ms-flex-align: center; align-items: center;
  -ms-flex-pack: justify; justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.log-left {
  display: -ms-flexbox; display: flex;
  -ms-flex-align: center; align-items: center;
  gap: 6px;
}
.mac-dot {
  width: 7px; height: 7px; border-radius: 50%; display: inline-block;
}
.mac-dot.r { background: #f43f5e; }
.mac-dot.y { background: #fbbf24; }
.mac-dot.g { background: #10b981; }
.log-title {
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: #64748b;
  margin-left: 3px;
  font-family: 'Segoe UI', sans-serif;
}
.log-badge {
  font-size: 9.5px; font-weight: 600;
  padding: 2px 7px; border-radius: 5px;
  background: rgba(59, 130, 246, 0.12); color: #38bdf8;
  border: 1px solid rgba(59, 130, 246, 0.25);
  font-family: 'Segoe UI', sans-serif;
}
.log-body-wrap {
  position: relative;
  height: 120px;
}
.log-console {
  height: 120px;
  overflow-y: scroll;
  -ms-overflow-style: none; /* Hide IE scrollbar */
  scrollbar-width: none;    /* Hide Firefox scrollbar */
  padding-right: 12px;
  font-family: 'Consolas', 'Cascadia Code', 'Segoe UI', monospace;
  font-size: 11px;
  line-height: 1.55;
  color: #94a3b8;
}
.log-console::-webkit-scrollbar { display: none; width: 0; }
.custom-scroll {
  position: absolute; top: 2px; right: 0; bottom: 2px; width: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  pointer-events: none;
}
.scroll-thumb {
  width: 4px;
  background: #6366f1;
  border-radius: 4px;
  position: absolute;
  top: 0;
  height: 25px;
  transition: top 0.08s ease;
}
.log-line {
  margin-bottom: 2px;
  word-break: break-all;
  display: block;
}
.log-time {
  color: #475569;
  font-size: 10px;
  margin-right: 5px;
}
.log-dot {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}
.log-text-info { color: #94a3b8; }
.log-text-success { color: #34d399; font-weight: 600; }
.log-text-warn { color: #fbbf24; }
.log-text-error { color: #f87171; font-weight: 600; }
/* ── Footer ── */
.footer {
  text-align: center; font-size: 10.5px; color: #475569;
  margin-top: 10px; padding: 0 10px;
}
/* ── Spinner ── */
@-ms-keyframes spin {
  0% { -ms-transform: rotate(0deg); }
  100% { -ms-transform: rotate(360deg); }
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.spinner {
  display: inline-block; width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff; border-radius: 50%;
  -ms-animation: spin 0.8s linear infinite;
  animation: spin 0.8s linear infinite;
  vertical-align: middle; margin-right: 6px;
}
</style>
</head>
<body>
<div class="bg-wrap">
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="brand">Khodee Gateway</div>
    <div class="status-row">
      <span class="dot dot-pulse" id="statusDot" style="background:%%STATUS_COLOR%%"></span>
      <span id="statusText" style="color:%%STATUS_COLOR%%">%%STATUS_TEXT%%</span>
    </div>
  </div>

  <!-- Card -->
  <div class="card">

    <!-- Main: API Key + Button -->
    <div class="main-section">
      <div class="label-row">
        <span class="label-text">&#128273; API Key</span>
        <span class="label-note">Khong luu log</span>
      </div>
      <div class="input-wrap">
        <input id="apiKey" type="password" class="api-input"
               placeholder="Dan API key vao day..." autocomplete="off" spellcheck="false">
        <div class="input-actions">
          <button type="button" class="action-btn" onclick="doPaste()">Dán</button>
          <button type="button" class="action-btn" id="eyeBtn" onclick="togglePw()">Show</button>
        </div>
      </div>
      <button class="btn-main" id="cfgBtn" onclick="doConfigure()">
        &#9889; START
      </button>

      <!-- Activity Log -->
      <div class="log-card">
        <div class="log-header">
          <div class="log-left">
            <span class="mac-dot r"></span>
            <span class="mac-dot y"></span>
            <span class="mac-dot g"></span>
            <span class="log-title">Log hoat dong</span>
          </div>
          <span class="log-badge" id="logBadge">Ready</span>
        </div>
        <div class="log-body-wrap">
          <div id="logConsole" class="log-console"></div>
          <div id="customScroll" class="custom-scroll">
            <div id="scrollThumb" class="scroll-thumb"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Key rieng moi nguoi &nbsp;|&nbsp; Tu dong reset &nbsp;|&nbsp; Backup DPAPI
  </div>

</div>
</div>

<script>
var apiInput = document.getElementById('apiKey');
var cfgBtn = document.getElementById('cfgBtn');

function updateScrollThumb() {
  var c = document.getElementById('logConsole');
  var thumb = document.getElementById('scrollThumb');
  var track = document.getElementById('customScroll');
  if (!c || !thumb || !track) return;
  if (c.scrollHeight <= c.clientHeight) {
    track.style.display = 'none';
    return;
  }
  track.style.display = 'block';
  var scrollRatio = c.clientHeight / c.scrollHeight;
  var thumbH = Math.max(20, Math.floor(c.clientHeight * scrollRatio));
  thumb.style.height = thumbH + 'px';
  var maxTop = c.clientHeight - thumbH;
  var top = (c.scrollTop / (c.scrollHeight - c.clientHeight)) * maxTop;
  thumb.style.top = Math.max(0, Math.min(maxTop, top)) + 'px';
}

function addLog(text, type) {
  var consoleEl = document.getElementById('logConsole');
  var badge = document.getElementById('logBadge');
  if (!consoleEl) return;

  var colors = { success:'#10b981', warn:'#f59e0b', error:'#f43f5e', info:'#38bdf8' };
  var badgeLabels = { success:'Thanh cong', warn:'Canh bao', error:'Loi', info:'Hoat dong' };
  var color = colors[type] || '#38bdf8';

  if (badge) {
    badge.innerText = badgeLabels[type] || 'Ready';
    badge.style.color = color;
    badge.style.borderColor = color;
  }

  var now = new Date();
  var h = (now.getHours() < 10 ? '0' : '') + now.getHours();
  var m = (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
  var s = (now.getSeconds() < 10 ? '0' : '') + now.getSeconds();
  var timeStr = '[' + h + ':' + m + ':' + s + ']';

  var line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = '<span class="log-time">' + timeStr + '</span>' +
                   '<span class="log-dot" style="background:' + color + '"></span>' +
                   '<span class="log-text-' + (type || 'info') + '">' + text + '</span>';
  consoleEl.appendChild(line);
  consoleEl.scrollTop = consoleEl.scrollHeight;
  updateScrollThumb();
}

var spinTimer = null;
function setBtn(state) {
  if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
  if (state === 'busy') {
    cfgBtn.disabled = true;
    cfgBtn.innerHTML = '<span id="spinIcon" class="spinner"></span> Dang kiem tra & cau hinh...';
    var deg = 0;
    spinTimer = setInterval(function() {
      deg = (deg + 25) % 360;
      var s = document.getElementById('spinIcon');
      if (s) {
        s.style.msTransform = 'rotate(' + deg + 'deg)';
        s.style.transform = 'rotate(' + deg + 'deg)';
      }
    }, 30);
  } else if (state === 'done') {
    cfgBtn.disabled = true;
    cfgBtn.className = 'btn-main done';
    cfgBtn.innerHTML = '&#10003; Hoan tat!';
    setTimeout(function() {
      cfgBtn.disabled = false;
      cfgBtn.className = 'btn-main';
      cfgBtn.innerHTML = '&#9889; START';
    }, 2500);
  } else {
    cfgBtn.disabled = false;
    cfgBtn.className = 'btn-main';
    cfgBtn.innerHTML = '&#9889; START';
  }
}

function sendCmd(cmd, arg) {
  window.location.href = 'app:' + cmd + ':' + encodeURIComponent(arg || '');
}

function doConfigure() {
  var key = apiInput.value;
  if (!key || key.replace(/\s/g,'') === '') {
    addLog('Nhap API key truoc!', 'warn');
    apiInput.focus();
    return;
  }
  setBtn('busy');
  sendCmd('configure', key);
}

function doPaste() {
  sendCmd('paste', '');
}

function togglePw() {
  var inp = apiInput;
  var btn = document.getElementById('eyeBtn');
  if (inp.type === 'password') {
    inp.type = 'text'; btn.innerText = 'Hide';
  } else {
    inp.type = 'password'; btn.innerText = 'Show';
  }
}

document.onkeydown = function(e) {
  e = e || window.event;
  if (e.keyCode === 116 || (e.ctrlKey && (e.keyCode === 82 || e.keyCode === 78))) {
    if (e.preventDefault) e.preventDefault();
    e.returnValue = false;
    return false;
  }
};

var c = document.getElementById('logConsole');
if (c) c.onscroll = updateScrollThumb;

addLog('San sang. Dan API key roi nhan START.', 'info');
setTimeout(function() { apiInput.focus(); }, 200);
</script>
</body>
</html>
'@

# ── Replace placeholders ──
$html = $html.Replace('%%STATUS_TEXT%%',  $claudeStatusText)
$html = $html.Replace('%%STATUS_COLOR%%', $claudeStatusColor)
$html = $html.Replace('%%GATEWAY_URL%%',  $script:defaults.gatewayUrl)
$html = $html.Replace('%%AUTH_SCHEME%%',  $script:defaults.authScheme)

# ═══════════════════════════════════════
# COMMAND HANDLER
# ═══════════════════════════════════════
function Invoke-JsLog([string]$msg, [string]$type) {
  try {
    $escaped = $msg.Replace("'", "\'").Replace("`n", ' ')
    $script:browser.Document.InvokeScript('eval',
      [object[]]@("addLog('$escaped','$type')"))
  } catch {}
}
function Invoke-JsSetBtn([string]$state) {
  try {
    $script:browser.Document.InvokeScript('eval',
      [object[]]@("setBtn('$state')"))
  } catch {}
}

function Test-KeyUsage([string]$key) {
  try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $payload = @{ apiKey = $key.Trim() } | ConvertTo-Json
    
    $wc = New-Object System.Net.WebClient
    $wc.Headers.Add('Content-Type', 'application/json')
    $wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    $wc.Headers.Add('Accept', 'application/json')

    $task = $wc.UploadStringTaskAsync('https://genzshop.vn/api/check-usage.php', 'POST', $payload)

    # Non-blocking wait loop: keeps UI thread pumping events so the spinner rotates continuously!
    $timeoutAt = (Get-Date).AddSeconds(12)
    while (-not $task.IsCompleted -and (Get-Date) -lt $timeoutAt) {
      [System.Windows.Forms.Application]::DoEvents()
      Start-Sleep -Milliseconds 25
    }

    if (-not $task.IsCompleted) {
      try { $wc.CancelAsync() } catch {}
      return @{ ok = $false; error = 'Kiem tra key qua thoi gian cho (12s). Vui long thu lai.' }
    }

    if ($task.IsFaulted) {
      $ex = $task.Exception.InnerException
      if ($null -ne $ex) {
        $msg = $ex.Message
        if ($null -ne $ex.Response) {
          try {
            $stream = $ex.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd() | ConvertFrom-Json
            if ($body.error) { return @{ ok = $false; error = $body.error } }
          } catch {}
        }
        return @{ ok = $false; error = ('Loi kiem tra key: ' + $msg) }
      }
    }

    $rawJson = $task.Result
    $res = $rawJson | ConvertFrom-Json

    if ($null -eq $res) {
      return @{ ok = $false; error = 'May chu kiem tra khong phan hoi.' }
    }

    if ($res.success -eq $false -or $null -ne $res.error) {
      $err = if ($res.error) { $res.error } else { 'API Key khong hop le hoac chua duoc kich hoat.' }
      return @{ ok = $false; error = $err }
    }

    # Kiem tra han muc
    $totalCost  = 0.0
    $costLimit  = 0.0
    $dailyUsed  = 0.0
    $dailyLimit = 0.0

    if ($null -ne $res.usage) {
      if ($null -ne $res.usage.totalCost)      { $totalCost  = [double]$res.usage.totalCost }
      if ($null -ne $res.usage.costLimit)      { $costLimit  = [double]$res.usage.costLimit }
      if ($null -ne $res.usage.dailyCostUsed)  { $dailyUsed  = [double]$res.usage.dailyCostUsed }
      if ($null -ne $res.usage.dailyCostLimit) { $dailyLimit = [double]$res.usage.dailyCostLimit }
    }

    # 1. Kiem tra het han muc tong
    if ($costLimit -gt 0 -and $totalCost -ge $costLimit) {
      $errMsg = ('API Key da HET HAN MUC! (Da dung {0:N2} / {1:N2} USD)' -f $totalCost, $costLimit)
      return @{ ok = $false; error = $errMsg }
    }

    # 2. Kiem tra het han muc ngay
    if ($dailyLimit -gt 0 -and $dailyUsed -ge $dailyLimit) {
      $errMsg = ('API Key da HET HAN MUC TRONG NGAY! (Da dung {0:N2} / {1:N2} USD)' -f $dailyUsed, $dailyLimit)
      return @{ ok = $false; error = $errMsg }
    }

    # 3. Kiem tra fallback remain
    if ($null -ne $res.usage.fallbackRemainPercent) {
      $fb = [double]$res.usage.fallbackRemainPercent
      if ($fb -le 0) {
        return @{ ok = $false; error = 'API Key da HET HAN MUC (Con lai 0%)!' }
      }
    }

    $remUsd = 0.0
    $remPct = 100.0
    if ($costLimit -gt 0) {
      $remUsd = [math]::Max(0.0, [math]::Round($costLimit - $totalCost, 2))
      $remPct = [math]::Max(0.0, [math]::Round((($costLimit - $totalCost) / $costLimit) * 100, 1))
    }

    return @{
      ok        = $true
      costLimit = $costLimit
      totalCost = $totalCost
      remUsd    = $remUsd
      remPct    = $remPct
    }
  } catch {
    return @{ ok = $false; error = ('Loi kiem tra key: ' + $_.Exception.Message) }
  }
}

function Handle-Configure([string]$key) {
  $backupPath = $null
  try {
    if ($key.Contains("`r") -or $key.Contains("`n")) { throw 'API key phai la 1 dong.' }
    $url = $script:defaults.gatewayUrl.TrimEnd('/')
    Assert-NoMachinePolicy

    # 1. Kiem tra API key tren he thong check-usage
    Invoke-JsLog 'Dang kiem tra API Key tren he thong...' 'info'
    [System.Windows.Forms.Application]::DoEvents()

    $check = Test-KeyUsage $key
    if ($check.ok -eq $false) {
      Invoke-JsLog $check.error 'error'
      Invoke-JsSetBtn 'ready'
      return
    }

    if ($check.costLimit -gt 0) {
      Invoke-JsLog ("API Key hop le! (Con lai: {0:N2} USD - {1:N1}%)" -f $check.remUsd, $check.remPct) 'success'
    } else {
      Invoke-JsLog 'API Key hop le & con han muc!' 'success'
    }
    [System.Windows.Forms.Application]::DoEvents()

    Invoke-JsLog 'Tao backup DPAPI...' 'info'
    [System.Windows.Forms.Application]::DoEvents()
    $backupPath = Backup-CurrentPolicy
    Invoke-JsLog 'Backup OK.' 'success'
    [System.Windows.Forms.Application]::DoEvents()

    if (-not (Test-Path -LiteralPath $script:policyPath)) {
      [void](New-Item -Path $script:policyPath -Force)
    }

    $importJson = '{"enabled":true,"exportEnabled":false,"bannerBehavior":"show"}'

    $settings = [ordered]@{
      inferenceProvider          = 'gateway'
      inferenceCredentialKind    = 'static'
      inferenceGatewayBaseUrl    = $url
      inferenceGatewayApiKey     = $key
      inferenceGatewayAuthScheme = 'x-api-key'
      chatTabEnabled             = 'true'
      developerModeEnabled       = 'true'
      claudeAiImport             = $importJson
    }

    Invoke-JsLog 'Ghi registry...' 'info'
    [System.Windows.Forms.Application]::DoEvents()

    foreach ($name in $settings.Keys) {
      [void](New-ItemProperty -Path $script:policyPath `
        -Name ([string]$name) -Value ([string]$settings[$name]) `
        -PropertyType String -Force)
    }

    # Cap quyen FullControl cho User hien tai de tranh loi access denied
    try {
      $acl = Get-Acl -Path $script:policyPath
      $rule = New-Object System.Security.AccessControl.RegistryAccessRule($env:USERNAME, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
      $acl.SetAccessRule($rule)
      Set-Acl -Path $script:policyPath -AclObject $acl
    } catch {}

    # Xoa bo cac key gay loi model_not_allowed
    Remove-ItemProperty -Path $script:policyPath -Name 'inferenceModels' -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $script:policyPath -Name 'modelDiscoveryEnabled' -ErrorAction SilentlyContinue

    Invoke-JsLog 'Da cau hinh thanh cong & khoi dong lai Claude!' 'success'
    Invoke-JsSetBtn 'done'
    # Clear key from input
    try {
      $script:browser.Document.InvokeScript('eval',
        [object[]]@("document.getElementById('apiKey').value=''"))
    } catch {}

    # Auto restart Claude Desktop
    $restarted = Restart-ClaudeApp

    if ($restarted) {
      Invoke-JsLog 'Da khoi dong lai Claude Desktop!' 'success'
    } else {
      Invoke-JsLog 'Vui long mo lai Claude Desktop.' 'info'
    }
    Invoke-JsLog 'Claude da ket noi Gateway & san sang chat!' 'success'
    Invoke-JsLog 'Dong bo chat: vao Settings > Import & export.' 'info'

  } catch {
    $errMsg = $_.Exception.Message
    if ($errMsg -match 'denied' -or $errMsg -match 'permission') {
      $errMsg = 'Thieu quyen ghi Registry! Vui long chuot phai vao file EXE chon Run as administrator.'
    }
    Invoke-JsLog $errMsg 'error'
    Invoke-JsSetBtn 'ready'
    if ($null -ne $backupPath -and (Test-Path -LiteralPath $backupPath)) {
      try {
        Restore-Policy $backupPath
        Invoke-JsLog 'Da khoi phuc tu backup.' 'warn'
      } catch {
        Invoke-JsLog 'Khoi phuc that bai.' 'error'
      }
    }
  }
}

function Handle-Test([string]$key) {
  try {
    $url = $script:defaults.gatewayUrl.TrimEnd('/') + '/v1/models'
    $headers = @{}
    if ($script:defaults.authScheme -eq 'x-api-key') {
      $headers['x-api-key'] = $key
    } else {
      $headers['Authorization'] = 'Bearer ' + $key
    }
    Invoke-JsLog 'Testing GET /v1/models...' 'info'
    [System.Windows.Forms.Application]::DoEvents()
    $script:form.Cursor = 'WaitCursor'

    $req = [System.Net.HttpWebRequest](
      [System.Net.WebRequest]::Create($url))
    $req.Method = 'GET'; $req.Timeout = 12000; $req.ReadWriteTimeout = 12000
    $req.UserAgent = 'KhodeeGateway/0.2'
    foreach ($h in $headers.Keys) {
      if ($h -eq 'Authorization') {
        $req.Headers[[System.Net.HttpRequestHeader]::Authorization] = $headers[$h]
      } else { $req.Headers[$h] = $headers[$h] }
    }
    $resp = $req.GetResponse()
    try { $code = [int]([System.Net.HttpWebResponse]$resp).StatusCode }
    finally { $resp.Close() }
    Invoke-JsLog "Gateway tra ve HTTP $code." 'success'
  } catch [System.Net.WebException] {
    $r = $_.Exception.Response
    if ($null -ne $r) {
      try {
        Invoke-JsLog ('HTTP ' + [int]([System.Net.HttpWebResponse]$r).StatusCode +
          '. Gateway co the khong ho tro model discovery.') 'warn'
      } finally { $r.Close() }
    } else {
      Invoke-JsLog 'Khong the ket noi. Kiem tra URL.' 'error'
    }
  } catch {
    Invoke-JsLog $_.Exception.Message 'error'
  } finally {
    $script:form.Cursor = 'Default'
  }
}

function Handle-Restore {
  try {
    Assert-NoMachinePolicy
    $latest = Get-ChildItem -LiteralPath $script:backupDir -Filter '*.dpapi' `
      -File -ErrorAction Stop |
      Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -eq $latest) { throw 'Khong tim thay backup.' }
    $answer = [System.Windows.Forms.MessageBox]::Show(
      'Khoi phuc cau hinh gan nhat? Claude can khoi dong lai.',
      'Restore backup',
      [System.Windows.Forms.MessageBoxButtons]::YesNo,
      [System.Windows.Forms.MessageBoxIcon]::Warning)
    if ($answer -ne [System.Windows.Forms.DialogResult]::Yes) { return }
    Restore-Policy $latest.FullName
    Invoke-JsLog 'Da khoi phuc policy thanh cong.' 'success'
    [void](Restart-ClaudeApp)
  } catch {
    Invoke-JsLog $_.Exception.Message 'error'
  }
}

# ═══════════════════════════════════════
# BUILD FORM + WEBBROWSER
# ═══════════════════════════════════════
$script:form = New-Object System.Windows.Forms.Form
$form.Text = 'Khodee Gateway'
$form.ClientSize = New-Object System.Drawing.Size(440, 430)
$form.FormBorderStyle = 'FixedSingle'
$form.MaximizeBox = $false
$form.StartPosition = 'CenterScreen'
$form.BackColor = [System.Drawing.ColorTranslator]::FromHtml('#0b0f1a')
$form.TopMost = $true
try {
  $exePath = [System.Diagnostics.Process]::GetCurrentProcess().MainModule.FileName
  $form.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)
} catch {}
$form.Add_Shown({ $this.Activate(); $this.TopMost = $false })

$script:browser = New-Object System.Windows.Forms.WebBrowser
$browser.Dock = 'Fill'
$browser.IsWebBrowserContextMenuEnabled = $true
$browser.ScriptErrorsSuppressed = $true
$browser.AllowNavigation = $true
$browser.WebBrowserShortcutsEnabled = $true
$browser.ScrollBarsEnabled = $false

# ── Intercept JS commands ──
$script:pendingCmd = ''
$script:pendingArg = ''

$script:cmdTimer = New-Object System.Windows.Forms.Timer
$script:cmdTimer.Interval = 50
$script:cmdTimer.Add_Tick({
  $script:cmdTimer.Stop()
  $cmd = $script:pendingCmd
  $arg = $script:pendingArg
  $script:pendingCmd = ''
  $script:pendingArg = ''

  switch ($cmd) {
    'configure' { Handle-Configure $arg }
    'paste'     {
      try {
        $clip = [System.Windows.Forms.Clipboard]::GetText()
        if (-not [string]::IsNullOrWhiteSpace($clip)) {
          $clean = $clip.Trim().Replace('\', '\\').Replace("'", "\'").Replace("`r", "").Replace("`n", "")
          $script:browser.Document.InvokeScript('eval', [object[]]@("document.getElementById('apiKey').value = '$clean'; document.getElementById('apiKey').focus();"))
          Invoke-JsLog 'Da dan API key tu clipboard.' 'info'
        } else {
          Invoke-JsLog 'Clipboard trong (chua copy key)!' 'warn'
        }
      } catch {
        Invoke-JsLog 'Khong the doc clipboard.' 'warn'
      }
    }
  }
})

$browser.Add_Navigating({
  param($sender, $e)
  $url = $e.Url.ToString()
  if ($url -match '^app:([^:]+):?(.*)$') {
    $e.Cancel = $true
    $script:pendingCmd = $Matches[1]
    $script:pendingArg = [System.Uri]::UnescapeDataString($Matches[2])
    $script:cmdTimer.Start()
  }
})

$form.Controls.Add($browser)
$browser.DocumentText = $html

[void]$form.ShowDialog()
