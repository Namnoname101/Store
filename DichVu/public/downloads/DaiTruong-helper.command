#!/usr/bin/env bash
# ============================================================================
# DaiTruong-helper v3.0 (macOS Native Launcher & Local GUI)
# Unified 1-Click Configurator for Claude Desktop & OpenAI Codex on macOS
# ============================================================================
set -e

export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.npm-global/bin:$PATH"
if [ -d "$HOME/.nvm/versions/node" ]; then
  LATEST_NVM_BIN="$(ls -d "$HOME/.nvm/versions/node"/*/bin 2>/dev/null | tail -n 1)"
  if [ -n "$LATEST_NVM_BIN" ]; then
    export PATH="$LATEST_NVM_BIN:$PATH"
  fi
fi

if ! command -v python3 >/dev/null 2>&1; then
  osascript -e 'display alert "Cần Python 3" message "macOS cần Python 3 để mở giao diện DaiTruong-helper. Vui lòng chạy: xcode-select --install trong Terminal." as warning' >/dev/null 2>&1 || true
  exit 1
fi

python3 - <<'PYEOF'
import http.server
import json
import os
import plistlib
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime

CLAUDE_GATEWAY_URL = "https://1gw.gwai.cloud"
CLAUDE_AUTH_SCHEME = "x-api-key"
CLAUDE_BUNDLE_ID = "com.anthropic.claudefordesktop"

EXACT_CONFIG_TOML = """model_provider = "OpenAI"
model = "gpt-6.1-sol"
review_model = "gpt-6.1-sol"
model_reasoning_effort = "xhigh"
disable_response_storage = true
network_access = "enabled"
windows_wsl_setup_acknowledged = true
model_context_window = 1000000
model_auto_compact_token_limit = 900000

[model_providers.OpenAI]
name = "OpenAI"
base_url = "https://modelapi.vn/v1"
wire_api = "responses"
requires_openai_auth = true
"""

HTML_UI = r"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DaiTruong-helper v3.0 (macOS)</title>
<style>
  :root {
    --bg: #18181B;
    --surface: #202024;
    --track: #121215;
    --border: #2E2E34;
    --border-strong: #3F3F46;
    --text: #F4F4F5;
    --text-sec: #A1A1AA;
    --text-muted: #71717A;
    --accent: #0F6CBD;
    --accent-hover: #1177D1;
    --claude: #D97757;
    --codex: #10B981;
    --success: #34D399;
    --warn: #FBBF24;
    --error: #F87171;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
    font-size: 13px;
    -webkit-font-smoothing: antialiased;
    user-select: none;
  }
  .shell {
    max-width: 460px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--border);
    border-right: 1px solid var(--border);
    background: var(--bg);
  }
  .titlebar {
    height: 40px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #27272A;
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .brand-title {
    font-size: 12.5px;
    font-weight: 600;
    color: #E4E4E7;
    letter-spacing: -0.01em;
  }
  .version-tag {
    font-size: 10px;
    font-weight: 600;
    color: var(--text-sec);
    background: #27272A;
    border: 1px solid var(--border-strong);
    padding: 1px 6px;
    border-radius: 4px;
  }
  .header-status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-sec);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--codex);
  }
  .workspace {
    padding: 16px 18px 18px;
    flex: 1;
  }
  .tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    background: var(--track);
    border: 1px solid #27272A;
    border-radius: 6px;
    padding: 3px;
    margin-bottom: 12px;
  }
  .tab-btn {
    height: 32px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--text-sec);
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
  }
  .tab-btn svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }
  .tab-btn.active {
    background: #27272A;
    border-color: var(--border-strong);
    color: var(--text);
  }
  .status-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 7px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
  }
  .status-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .status-text {
    font-size: 11.5px;
    color: #D4D4D8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mini-btn {
    background: #27272A;
    border: 1px solid var(--border-strong);
    color: var(--text);
    font-size: 11px;
    font-weight: 500;
    padding: 3px 9px;
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .mini-btn:hover { background: var(--border-strong); }
  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 1px 6px;
  }
  .label-title {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--text-sec);
  }
  .label-note {
    font-size: 10.5px;
    color: var(--text-muted);
  }
  .input-box {
    background: var(--surface);
    border: 1px solid var(--border-strong);
    border-radius: 5px;
    height: 38px;
    padding: 0 6px 0 10px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .input-box:focus-within {
    border-color: #60A5FA;
  }
  .key-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--text);
    font-family: "SF Mono", "JetBrains Mono", Menlo, monospace;
    font-size: 12.5px;
  }
  .key-input::placeholder {
    color: var(--text-muted);
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .ghost-btn {
    background: transparent;
    border: none;
    color: var(--text-sec);
    font-size: 11px;
    padding: 4px 7px;
    cursor: pointer;
    border-radius: 4px;
  }
  .ghost-btn:hover { color: var(--text); background: #27272A; }
  .quota-line {
    min-height: 18px;
    margin: 6px 2px 0;
    font-size: 11.5px;
    font-weight: 500;
  }
  .primary-btn {
    width: 100%;
    height: 38px;
    margin-top: 8px;
    background: var(--accent);
    color: #FFFFFF;
    border: none;
    border-radius: 5px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background 140ms ease;
  }
  .primary-btn:hover { background: var(--accent-hover); }
  .primary-btn:disabled {
    background: #27272A;
    color: var(--text-muted);
    cursor: default;
  }
  .log-card {
    margin-top: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 8px 10px;
  }
  .log-list {
    list-style: none;
    font-size: 11.5px;
    color: #D4D4D8;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .log-item {
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .action-row {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
</style>
</head>
<body>
<div class="shell">
  <div class="titlebar">
    <div class="brand-row">
      <span class="brand-title">DaiTruong-helper</span>
      <span class="version-tag">v3.0 macOS</span>
    </div>
    <div class="header-status">
      <span class="dot" id="headerDot"></span>
      <span id="headerStatusText">Đang kiểm tra...</span>
    </div>
  </div>

  <div class="workspace">
    <div class="tabs">
      <button type="button" class="tab-btn active" id="tabClaude" onclick="switchMode('claude')">
        <svg viewBox="0 0 24 24" fill="#D97757" aria-hidden="true">
          <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z"/>
        </svg>
        <span>Claude Desktop</span>
      </button>

      <button type="button" class="tab-btn" id="tabCodex" onclick="switchMode('codex')">
        <svg viewBox="0 0 24 24" fill="#10B981" aria-hidden="true">
          <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"/>
        </svg>
        <span>OpenAI Codex</span>
      </button>
    </div>

    <div class="status-card" id="envCard">
      <div class="status-left">
        <span class="dot" id="envDot"></span>
        <span class="status-text" id="envText">Đang kiểm tra môi trường macOS...</span>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button type="button" class="mini-btn" id="envBtn" style="display:none" onclick="handleEnvAction()">Tải App</button>
        <button type="button" class="mini-btn" id="envBtnCli" style="display:none" onclick="installCodexCli()">Cài CLI</button>
      </div>
    </div>

    <div class="label-row">
      <span class="label-title" id="keyLabel">Mã API Key (Claude Gateway)</span>
      <span class="label-note">Bảo mật cục bộ • Không lưu log</span>
    </div>

    <div class="input-box">
      <input id="apiKeyInput" type="password" class="key-input" placeholder="Dán mã API Key Claude vào đây..." autocomplete="off" spellcheck="false" oninput="onKeyInput()">
      <button type="button" class="ghost-btn" id="toggleBtn" onclick="toggleShow()">Hiện</button>
      <button type="button" class="mini-btn" onclick="pasteClip()">Dán</button>
    </div>

    <div class="quota-line" id="quotaLine"></div>

    <button type="button" class="primary-btn" id="activateBtn" onclick="activateConfig()">Kích hoạt Claude Desktop</button>

    <div class="log-card" id="logCard" style="display:none">
      <ul class="log-list" id="logList"></ul>
      <div class="action-row" id="doneActions" style="display:none">
        <button type="button" class="mini-btn" id="openAppBtn" onclick="launchApp()" style="background:#0F6CBD;border-color:#0F6CBD;flex:1;padding:6px 10px;font-weight:600">Mở ứng dụng</button>
      </div>
    </div>
  </div>
</div>

<script>
let currentMode = 'claude';
let keyCache = { claude: '', codex: '' };
let debounceTimer = null;
let envState = { claudeInstalled: false, codexInstalled: false, codexAppInstalled: false };

async function fetchStatus() {
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    envState = d;
    renderEnvStatus();
  } catch (e) {}
}

function renderEnvStatus() {
  const dot = document.getElementById('envDot');
  const hDot = document.getElementById('headerDot');
  const text = document.getElementById('envText');
  const hText = document.getElementById('headerStatusText');
  const btn = document.getElementById('envBtn');
  const btnCli = document.getElementById('envBtnCli');

  btnCli.style.display = 'none';

  if (currentMode === 'claude') {
    if (envState.claudeInstalled) {
      dot.style.background = '#10B981';
      hDot.style.background = '#10B981';
      text.textContent = envState.claudeRunning
        ? 'Đã phát hiện Claude.app (đang chạy trên macOS)'
        : 'Đã phát hiện /Applications/Claude.app';
      hText.textContent = 'Claude sẵn sàng';
      btn.style.display = 'none';
    } else {
      dot.style.background = '#F59E0B';
      hDot.style.background = '#F59E0B';
      text.textContent = 'Chưa tìm thấy /Applications/Claude.app';
      hText.textContent = 'Chưa cài Claude';
      btn.textContent = 'Tải Claude';
      btn.style.display = 'inline-block';
    }
  } else {
    if (envState.codexAppInstalled || envState.codexInstalled) {
      dot.style.background = '#10B981';
      hDot.style.background = '#10B981';
      hText.textContent = envState.codexAppRunning ? 'Codex đang chạy' : 'Codex sẵn sàng';
      btn.style.display = 'none';
      if (envState.codexAppInstalled && envState.codexInstalled) {
        text.textContent = 'Đã phát hiện App ChatGPT/Codex & CLI';
      } else if (envState.codexAppInstalled) {
        text.textContent = envState.codexAppRunning
          ? 'Đã phát hiện App ChatGPT / Codex (đang chạy)'
          : 'Đã phát hiện App ChatGPT / Codex trên macOS';
      } else {
        text.textContent = 'Đã tìm thấy Codex CLI (' + envState.codexPath + ')';
      }
    } else {
      dot.style.background = '#F59E0B';
      hDot.style.background = '#F59E0B';
      text.textContent = 'Chưa tìm thấy App ChatGPT/Codex hoặc CLI';
      hText.textContent = 'Chưa có Codex';
      btn.textContent = 'Tải App';
      btn.style.display = 'inline-block';
      btnCli.textContent = 'Cài CLI';
      btnCli.style.display = 'inline-block';
    }
  }
}

function switchMode(mode) {
  const inp = document.getElementById('apiKeyInput');
  keyCache[currentMode] = inp.value;
  currentMode = mode;

  document.getElementById('tabClaude').className = mode === 'claude' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('tabCodex').className = mode === 'codex' ? 'tab-btn active' : 'tab-btn';
  document.getElementById('keyLabel').textContent = mode === 'claude'
    ? 'Mã API Key (Claude Gateway)'
    : 'Mã API Key (OpenAI Codex)';
  inp.placeholder = mode === 'claude'
    ? 'Dán mã API Key Claude vào đây...'
    : 'Dán mã API Key Codex (sk-...) vào đây...';
  document.getElementById('activateBtn').textContent = mode === 'claude'
    ? 'Kích hoạt Claude Desktop'
    : 'Kích hoạt OpenAI Codex';

  inp.value = keyCache[mode] || '';
  document.getElementById('quotaLine').textContent = '';
  document.getElementById('logCard').style.display = 'none';
  renderEnvStatus();
  if (inp.value.trim().length >= 8) onKeyInput();
}

function toggleShow() {
  const inp = document.getElementById('apiKeyInput');
  const btn = document.getElementById('toggleBtn');
  if (inp.type === 'password') {
    inp.type = 'text';
    btn.textContent = 'Ẩn';
  } else {
    inp.type = 'password';
    btn.textContent = 'Hiện';
  }
}

async function pasteClip() {
  try {
    const r = await fetch('/api/clipboard');
    const d = await r.json();
    if (d.text) {
      const inp = document.getElementById('apiKeyInput');
      inp.value = d.text.trim();
      onKeyInput();
    }
  } catch (e) {}
}

function onKeyInput() {
  if (debounceTimer) clearTimeout(debounceTimer);
  const val = document.getElementById('apiKeyInput').value.trim();
  const q = document.getElementById('quotaLine');
  if (val.length < 8) {
    q.textContent = '';
    return;
  }
  debounceTimer = setTimeout(() => verifyKeyLive(val), 450);
}

async function verifyKeyLive(key) {
  const q = document.getElementById('quotaLine');
  const snapshotMode = currentMode;
  q.style.color = '#A1A1AA';
  q.textContent = 'Đang kiểm tra hạn mức Key...';

  try {
    const r = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: snapshotMode, apiKey: key })
    });
    const d = await r.json();
    if (currentMode !== snapshotMode) return;
    if (d.isProfileToken) {
      q.style.color = '#FBBF24';
      q.textContent = 'Mã Profile (' + d.tokenName + ') — Vui lòng dùng mã API Key sk-... ở tab Tokens';
    } else if (d.success) {
      q.style.color = '#34D399';
      q.textContent = d.tokenName + (d.quotaInfo ? ' • ' + d.quotaInfo : '');
    } else {
      q.style.color = '#F87171';
      q.textContent = d.errorMessage || 'API Key không hợp lệ';
    }
  } catch (e) {
    q.style.color = '#F87171';
    q.textContent = 'Không thể kết nối máy chủ kiểm tra.';
  }
}

function appendLog(msg, status) {
  const card = document.getElementById('logCard');
  const list = document.getElementById('logList');
  card.style.display = 'block';
  const li = document.createElement('li');
  li.className = 'log-item';
  const color = status === 'ok' ? '#34D399' : (status === 'error' ? '#F87171' : '#38BDF8');
  const sym = status === 'ok' ? '✓' : (status === 'error' ? '✕' : '•');
  li.innerHTML = '<span style="color:' + color + ';font-weight:700">' + sym + '</span><span>' + msg + '</span>';
  list.appendChild(li);
}

async function activateConfig() {
  const key = document.getElementById('apiKeyInput').value.trim();
  if (!key) {
    const q = document.getElementById('quotaLine');
    q.style.color = '#FBBF24';
    q.textContent = 'Vui lòng dán mã API Key trước khi kích hoạt.';
    return;
  }

  const btn = document.getElementById('activateBtn');
  btn.disabled = true;
  document.getElementById('logList').innerHTML = '';
  document.getElementById('doneActions').style.display = 'none';
  appendLog('Đang xác thực API Key & ghi cấu hình macOS...', 'run');

  try {
    const r = await fetch('/api/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: currentMode, apiKey: key })
    });
    const d = await r.json();
    document.getElementById('logList').innerHTML = '';
    (d.steps || []).forEach(s => appendLog(s, d.success ? 'ok' : 'error'));
    if (d.success) {
      document.getElementById('doneActions').style.display = 'flex';
      document.getElementById('openAppBtn').textContent = currentMode === 'claude'
        ? 'Mở Claude Desktop'
        : (envState.codexAppInstalled ? 'Mở App ChatGPT / Codex' : 'Mở Codex CLI trong Terminal');
      fetchStatus();
    } else if (d.error) {
      appendLog(d.error, 'error');
    }
  } catch (e) {
    appendLog('Lỗi kết nối cục bộ: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleEnvAction() {
  const targetUrl = currentMode === 'claude'
    ? 'https://claude.com/download'
    : 'https://openai.com/chatgpt/download/';
  await fetch('/api/open-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl })
  });
}

async function installCodexCli() {
  const btn = document.getElementById('envBtnCli');
  btn.disabled = true;
  btn.textContent = 'Đang cài...';
  try {
    const r = await fetch('/api/install-codex', { method: 'POST' });
    const d = await r.json();
    if (d.error) {
      appendLog(d.error, 'error');
    } else {
      appendLog('Cài đặt Codex CLI thành công!', 'ok');
    }
    fetchStatus();
  } finally {
    btn.disabled = false;
    btn.textContent = 'Cài CLI';
  }
}

async function launchApp() {
  await fetch('/api/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: currentMode })
  });
}

fetchStatus();
</script>
</body>
</html>
"""

def find_codex_app_macos():
    for app_name in ("Codex.app", "ChatGPT.app"):
        for base in ("/Applications", os.path.expanduser("~/Applications")):
            p = os.path.join(base, app_name)
            if os.path.exists(p):
                return app_name.replace(".app", "")
    return ""

def check_env_status():
    claude_installed = os.path.exists("/Applications/Claude.app") or os.path.exists(os.path.expanduser("~/Applications/Claude.app"))
    claude_running = subprocess.call(["pgrep", "-x", "Claude"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
    codex_path = shutil.which("codex") or ""
    codex_app = find_codex_app_macos()
    codex_app_running = (
        subprocess.call(["pgrep", "-x", "Codex"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
        or subprocess.call(["pgrep", "-x", "ChatGPT"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL) == 0
    )
    return {
        "claudeInstalled": claude_installed,
        "claudeRunning": claude_running,
        "codexInstalled": bool(codex_path),
        "codexPath": codex_path,
        "codexAppInstalled": bool(codex_app),
        "codexAppName": codex_app,
        "codexAppRunning": codex_app_running,
    }

def verify_claude_key(api_key):
    clean = (api_key or "").strip()
    payload = json.dumps({"apiKey": clean}).encode("utf-8")
    req = urllib.request.Request(
        "https://genzshop.vn/api/check-usage.php",
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/plain, */*",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Origin": "https://genzshop.vn",
            "Referer": "https://genzshop.vn/check-usage",
            "X-Requested-With": "XMLHttpRequest",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
    except Exception as e:
        return {"success": False, "errorMessage": f"Không thể kết nối máy chủ kiểm tra: {e}"}

    try:
        data = json.loads(raw)
    except Exception:
        return {"success": False, "errorMessage": "Máy chủ kiểm tra không phản hồi hợp lệ."}

    if not data.get("success") or data.get("error"):
        return {"success": False, "errorMessage": data.get("error") or data.get("message") or "API Key không hợp lệ."}

    usage = data.get("usage") or {}
    total_cost = float(usage.get("totalCost") or 0.0)
    cost_limit = float(usage.get("costLimit") or 0.0)
    daily_used = float(usage.get("dailyCostUsed") or 0.0)
    daily_limit = float(usage.get("dailyCostLimit") or 0.0)
    fb_pct = usage.get("fallbackRemainPercent")

    if cost_limit > 0 and total_cost >= cost_limit:
        return {"success": False, "errorMessage": f"API Key đã hết hạn mức (${total_cost:.2f} / ${cost_limit:.2f})."}
    if daily_limit > 0 and daily_used >= daily_limit:
        return {"success": False, "errorMessage": f"API Key đã hết hạn mức ngày (${daily_used:.2f} / ${daily_limit:.2f})."}
    if fb_pct is not None and float(fb_pct) <= 0 and cost_limit <= 0:
        return {"success": False, "errorMessage": "API Key đã hết hạn mức (Còn lại 0%)."}

    if cost_limit > 0:
        rem_usd = max(0.0, cost_limit - total_cost)
        rem_pct = max(0.0, ((cost_limit - total_cost) / cost_limit) * 100.0)
        quota_info = f"Còn ${rem_usd:.2f} / ${cost_limit:.2f} ({rem_pct:.1f}%)"
    else:
        quota_info = "Đang hoạt động"

    return {"success": True, "tokenName": "Claude Gateway Key", "quotaInfo": quota_info}

def verify_codex_key(token):
    clean = (token or "").strip()
    headers = {"Authorization": f"Bearer {clean}", "User-Agent": "Mozilla/5.0"}

    try:
        req = urllib.request.Request("https://modelapi.vn/api/user/self", headers=headers)
        with urllib.request.urlopen(req, timeout=7) as resp:
            d = json.loads(resp.read().decode("utf-8", errors="replace"))
            if d.get("success") and d.get("data", {}).get("username"):
                user = d["data"].get("display_name") or d["data"].get("username")
                if user and user.lower() != "namnoname":
                    return {"success": False, "isProfileToken": True, "tokenName": user}
    except Exception:
        pass

    for url in ("https://modelapi.vn/api/usage/token/", "https://api.modelapi.vn/api/usage/token/"):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                d = json.loads(resp.read().decode("utf-8", errors="replace"))
                if d.get("code") is True or d.get("success") is True:
                    qdata = d.get("data") or {}
                    name = qdata.get("name") or "Codex AI Key"
                    rem = float(qdata.get("total_available") or qdata.get("remain_quota") or 0.0)
                    usd = rem / 500000.0
                    return {
                        "success": True,
                        "tokenName": name,
                        "quotaInfo": f"Số dư: ${usd:.2f}" if rem > 0 else "Đang hoạt động",
                    }
        except Exception:
            pass

    return {"success": False, "errorMessage": "Mã API Key Codex không hợp lệ hoặc đã hết hạn."}

def configure_claude_macos(api_key):
    v = verify_claude_key(api_key)
    if not v.get("success"):
        return {"success": False, "error": v.get("errorMessage")}

    steps = [f"Xác thực Key hợp lệ: {v.get('tokenName')} ({v.get('quotaInfo')})"]
    backup_dir = os.path.expanduser("~/Library/Application Support/DaiTruongHelper/backups")
    os.makedirs(backup_dir, exist_ok=True)
    plist_path = os.path.expanduser(f"~/Library/Preferences/{CLAUDE_BUNDLE_ID}.plist")
    if os.path.exists(plist_path):
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        shutil.copy2(plist_path, os.path.join(backup_dir, f"claude_{stamp}.plist"))

    # 1. Remove locked MDM/plist policy keys so Third-party provider UI is 100% unlocked for user customization
    for locked_key in (
        "inferenceProvider",
        "inferenceCredentialKind",
        "inferenceGatewayBaseUrl",
        "inferenceGatewayApiKey",
        "inferenceGatewayAuthScheme",
        "chatTabEnabled",
        "developerModeEnabled",
        "claudeAiImport",
        "inferenceModels",
        "modelDiscoveryEnabled",
    ):
        subprocess.run(["defaults", "delete", CLAUDE_BUNDLE_ID, locked_key], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    steps.append("Mở khóa Policy (Cho phép tùy chỉnh Third-party tự do)")

    # 2. Write user-editable ConfigLibrary profile in ~/Library/Application Support/Claude-3p/configLibrary
    claude3p_dir = os.path.expanduser("~/Library/Application Support/Claude-3p")
    lib_dir = os.path.join(claude3p_dir, "configLibrary")
    os.makedirs(lib_dir, exist_ok=True)

    cfg_id = "d1000000-0000-4000-8000-000000000001"
    meta_path = os.path.join(lib_dir, "_meta.json")
    profile_path = os.path.join(lib_dir, f"{cfg_id}.json")

    if os.path.exists(profile_path):
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        shutil.copy2(profile_path, os.path.join(backup_dir, f"claude3p_{stamp}.json"))

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({"appliedId": cfg_id, "entries": [{"id": cfg_id, "name": "DaiTruong Gateway"}]}, f)

    profile_data = {
        "inferenceProvider": "gateway",
        "inferenceCredentialKind": "static",
        "inferenceGatewayBaseUrl": CLAUDE_GATEWAY_URL,
        "inferenceGatewayApiKey": api_key.strip(),
        "inferenceGatewayAuthScheme": CLAUDE_AUTH_SCHEME,
        "desktopHome": "standard",
        "developerModeEnabled": True,
        "claudeAiImport": {
            "enabled": True,
            "exportEnabled": True,
            "bannerBehavior": "show",
        },
    }
    with open(profile_path, "w", encoding="utf-8") as f:
        json.dump(profile_data, f, indent=2)

    # 3. Ensure deploymentMode = "3p" in claude_desktop_config.json
    for app_dir_name in ("Claude-3p", "Claude"):
        cfg_file = os.path.expanduser(f"~/Library/Application Support/{app_dir_name}/claude_desktop_config.json")
        os.makedirs(os.path.dirname(cfg_file), exist_ok=True)
        cfg_obj = {}
        if os.path.exists(cfg_file):
            try:
                with open(cfg_file, "r", encoding="utf-8") as f:
                    cfg_obj = json.load(f)
            except Exception:
                cfg_obj = {}
        cfg_obj["deploymentMode"] = "3p"
        with open(cfg_file, "w", encoding="utf-8") as f:
            json.dump(cfg_obj, f, indent=2)

    steps.append("Ghi cấu hình Gateway & mở khóa Import/Export Chat trên macOS")

    # 4. Enable Developer Mode in developer_settings.json (allowDevTools = true)
    for app_dir_name in ("Claude-3p", "Claude"):
        dev_dir = os.path.expanduser(f"~/Library/Application Support/{app_dir_name}")
        if app_dir_name == "Claude-3p" or os.path.exists(dev_dir):
            os.makedirs(dev_dir, exist_ok=True)
            dev_file = os.path.join(dev_dir, "developer_settings.json")
            dev_obj = {}
            if os.path.exists(dev_file):
                try:
                    with open(dev_file, "r", encoding="utf-8") as f:
                        dev_obj = json.load(f)
                except Exception:
                    dev_obj = {}
            dev_obj["allowDevTools"] = True
            with open(dev_file, "w", encoding="utf-8") as f:
                json.dump(dev_obj, f, indent=2)
    steps.append("Bật chế độ Developer Mode trên macOS (allowDevTools)")

    subprocess.run(["killall", "Claude"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.9)
    if os.path.exists("/Applications/Claude.app") or os.path.exists(os.path.expanduser("~/Applications/Claude.app")):
        subprocess.run(["open", "-a", "Claude"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        steps.append("Đã tự động khởi động lại ứng dụng Claude.app")
    else:
        steps.append("Hoàn tất ghi cấu hình. Hãy mở Claude Desktop để sử dụng.")

    return {"success": True, "steps": steps}

def configure_codex_macos(api_key):
    v = verify_codex_key(api_key)
    if v.get("isProfileToken"):
        return {"success": False, "error": f"Mã bạn nhập là Profile Token ({v.get('tokenName')}). Vui lòng lấy mã API Key sk-... ở tab Tokens."}
    if not v.get("success"):
        return {"success": False, "error": v.get("errorMessage")}

    steps = [f"Xác thực Key hợp lệ: {v.get('tokenName')} ({v.get('quotaInfo')})"]
    codex_home = os.environ.get("CODEX_HOME") or os.path.expanduser("~/.codex")
    os.makedirs(codex_home, exist_ok=True)
    config_path = os.path.join(codex_home, "config.toml")
    auth_path = os.path.join(codex_home, "auth.json")
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")

    if os.path.exists(config_path):
        shutil.copy2(config_path, f"{config_path}.daitruong-backup-{stamp}")
    if os.path.exists(auth_path):
        shutil.copy2(auth_path, f"{auth_path}.daitruong-backup-{stamp}")

    with open(config_path, "w", encoding="utf-8") as f:
        f.write(EXACT_CONFIG_TOML)
    steps.append("Ghi cấu hình chuẩn ~/.codex/config.toml (gpt-6.1-sol)")

    with open(auth_path, "w", encoding="utf-8") as f:
        json.dump({"OPENAI_API_KEY": api_key.strip()}, f)
    os.chmod(auth_path, 0o600)
    steps.append("Ghi ~/.codex/auth.json & khóa quyền bảo mật (chmod 600)")

    return {"success": True, "steps": steps}

class HelperHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def _send_json(self, data, status=200):
        raw = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path == "/":
            raw = HTML_UI.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        elif self.path == "/api/status":
            self._send_json(check_env_status())
        elif self.path == "/api/clipboard":
            try:
                out = subprocess.check_output(["pbpaste"], timeout=3).decode("utf-8", errors="replace")
                self._send_json({"text": out})
            except Exception:
                self._send_json({"text": ""})
        else:
            self.send_error(404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(length).decode("utf-8") or "{}") if length > 0 else {}

        if self.path == "/api/verify":
            mode = body.get("mode", "claude")
            key = body.get("apiKey", "")
            res = verify_claude_key(key) if mode == "claude" else verify_codex_key(key)
            self._send_json(res)
        elif self.path == "/api/configure":
            mode = body.get("mode", "claude")
            key = body.get("apiKey", "")
            res = configure_claude_macos(key) if mode == "claude" else configure_codex_macos(key)
            self._send_json(res)
        elif self.path == "/api/install-codex":
            npm_bin = shutil.which("npm")
            if not npm_bin:
                subprocess.run(["open", "https://nodejs.org/en/download"], check=False)
                self._send_json({"error": "Máy chưa cài Node.js/npm. Đã mở trang tải Node.js chính thức."})
                return
            r = subprocess.run([npm_bin, "install", "-g", "@openai/codex"], capture_output=True, text=True)
            if r.returncode == 0:
                self._send_json({"success": True})
            else:
                self._send_json({"error": "Không thể cài tự động. Hãy chạy: sudo npm i -g @openai/codex"})
        elif self.path == "/api/open-url":
            url = body.get("url", "")
            if url.startswith("https://"):
                subprocess.run(["open", url], check=False)
            self._send_json({"ok": True})
        elif self.path == "/api/launch":
            mode = body.get("mode", "claude")
            if mode == "claude":
                subprocess.run(["open", "-a", "Claude"], check=False)
            else:
                codex_app = find_codex_app_macos()
                if codex_app:
                    subprocess.run(["open", "-a", codex_app], check=False)
                elif shutil.which("codex"):
                    subprocess.run(["osascript", "-e", 'tell application "Terminal" to do script "codex"'], check=False)
                    subprocess.run(["osascript", "-e", 'tell application "Terminal" to activate'], check=False)
                else:
                    subprocess.run(["open", "https://openai.com/chatgpt/download/"], check=False)
            self._send_json({"ok": True})
        else:
            self.send_error(404)

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.bind(("127.0.0.1", 0))
port = sock.getsockname()[1]
sock.close()

server = http.server.ThreadingHTTPServer(("127.0.0.1", port), HelperHandler)
url = f"http://127.0.0.1:{port}"
print(f"DaiTruong-helper v3.0 macOS running at {url}")

if os.path.exists("/Applications/Google Chrome.app"):
    subprocess.Popen(["open", "-na", "Google Chrome", "--args", f"--app={url}", "--window-size=460,360"])
else:
    subprocess.Popen(["open", url])

try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
PYEOF
