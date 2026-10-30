"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  Laptop,
  Palette,
  Bot,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  Download,
  FolderCode,
  ShieldCheck,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  Monitor,
  CheckCircle2,
  FileCode,
  Wrench,
} from "lucide-react";

export interface ClaudeApiGuideHubProps {
  apiKey?: string;
  compactMode?: boolean;
  initialTab?: "vscode" | "desktop" | "openclaw" | "design" | "cursor";
  showKeyInput?: boolean;
}

export default function ClaudeApiGuideHub({
  apiKey = "",
  compactMode = false,
  initialTab = "vscode",
  showKeyInput = true,
}: ClaudeApiGuideHubProps) {
  const [customKey, setCustomKey] = useState<string>(apiKey || "");
  const [activeTab, setActiveTab] = useState<
    "vscode" | "desktop" | "openclaw" | "design" | "cursor"
  >(initialTab);
  const [osTab, setOsTab] = useState<"windows" | "mac">("windows");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fallback demo key if no key provided
  const currentKey = customKey.trim() || apiKey || "sk-ant-api03-daitruong-demo-key-8888";
  const isRealKey = Boolean(customKey.trim() || apiKey);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Pre-calculated config snippets based on active key
  const vscodeSettingsJson = `{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "${currentKey}",
    "ANTHROPIC_BASE_URL": "https://1gw.gwai.cloud",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-5",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-5",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5",
    "CLAUDE_CODE_SUBAGENT_MODEL": "claude-sonnet-4-5",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "0",
    "CLAUDE_CODE_DISABLE_1M_CONTEXT": "1",
    "CLAUDE_CODE_NO_FLICKER": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  },
  "skipDangerousModePermissionPrompt": false,
  "model": "opus",
  "autoUpdatesChannel": "latest"
}`;

  const openclawJson = `{
  "models": {
    "mode": "replace",
    "providers": {
      "gwai": {
        "baseUrl": "https://1gw.gwai.cloud",
        "apiKey": "${currentKey}",
        "api": "anthropic-messages",
        "headers": {
          "User-Agent": "curl/8.7.1"
        },
        "authHeader": true,
        "models": [
          {
            "id": "claude-opus-4-7",
            "name": "Clawbot Opus 4.7"
          },
          {
            "id": "claude-sonnet-4-6",
            "name": "Clawbot Sonnet 4.6"
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "gwai/claude-opus-4-7"
      }
    }
  }
}`;

  const tabs = [
    {
      id: "vscode" as const,
      name: "VS Code & Claude Code",
      shortName: "VS Code",
      icon: Code2,
      badge: "Lập trình viên",
      badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      desc: "CLI lập trình tự động trong Terminal VS Code",
    },
    {
      id: "desktop" as const,
      name: "Claude AI Desktop",
      shortName: "Desktop App",
      icon: Monitor,
      badge: "Dễ dùng nhất",
      badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      desc: "Phần mềm Cowork chính thức của Anthropic trên PC/Mac",
    },
    {
      id: "openclaw" as const,
      name: "OpenClaw AI Agent",
      shortName: "OpenClaw",
      icon: Bot,
      badge: "Framework Agent",
      badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      desc: "Trợ lý AI đa năng chạy nền Opus 4.7 / Sonnet 4.6",
    },
    {
      id: "design" as const,
      name: "Open Design Web",
      shortName: "Design Claude",
      icon: Palette,
      badge: "Giao diện Web",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      desc: "Thiết kế UI & sinh mã trực tiếp trên trình duyệt",
    },
    {
      id: "cursor" as const,
      name: "Cursor / Windsurf",
      shortName: "Cursor IDE",
      icon: Laptop,
      badge: "Cực nhanh",
      badgeColor: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
      desc: "Cấu hình Override Base URL trong AI IDE",
    },
  ];

  return (
    <div className="w-full space-y-5 text-slate-800 dark:text-slate-200">
      {/* Key Synchronization Bar */}
      {showKeyInput && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    API Key Đang Áp Dụng
                  </span>
                  {isRealKey ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Key thật đã đồng bộ vào toàn bộ hướng dẫn
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-full">
                      Đang dùng Key mẫu (bạn có thể dán Key riêng vào đây)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Mọi file mẫu (<code className="text-blue-600 dark:text-indigo-300 font-semibold">settings.json</code>, <code className="text-blue-600 dark:text-indigo-300 font-semibold">openclaw.json</code>, lệnh Terminal) bên dưới sẽ tự động thay thế bằng Key này!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:max-w-md w-full sm:w-auto">
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="sk-ant-api03-... hoặc dán key của bạn"
                className="w-full sm:w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 text-xs font-mono text-slate-900 dark:text-emerald-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 dark:focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-blue-600 dark:focus:ring-indigo-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleCopy("main-key", currentKey)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition-all shrink-0 active:scale-95 shadow-sm"
                title="Sao chép Key này"
              >
                {copiedKey === "main-key" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-300" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Chép Key</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Hub Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 p-2 sm:p-3">
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600 dark:text-indigo-400" />
              <span>Chọn nền tảng bạn muốn sử dụng:</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              1 Key dùng chung được cho tất cả các công cụ bên dưới
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-start gap-1 p-2.5 sm:p-3 rounded-xl border text-left transition-all relative ${
                    isActive
                      ? "bg-blue-50/90 dark:bg-slate-800/90 border-blue-500 dark:border-indigo-500/50 shadow-xs ring-1 ring-blue-500/30 dark:ring-indigo-500/30"
                      : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-blue-600 dark:bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  </div>

                  <div className="mt-1">
                    <div
                      className={`text-xs font-bold truncate ${
                        isActive ? "text-blue-950 dark:text-white" : "text-slate-800 dark:text-slate-300"
                      }`}
                    >
                      {tab.shortName}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                      {tab.desc}
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-4 h-1 bg-blue-600 dark:bg-indigo-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panes */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: VS CODE & CLAUDE CODE CLI */}
          {/* ======================================================== */}
          {activeTab === "vscode" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Code2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span>Cấu hình Claude Code CLI trong VS Code</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Trợ lý AI lập trình dòng lệnh (CLI) chạy mượt mà ngay trong Terminal của Visual Studio Code.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/huong-dan/api-claude"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 bg-blue-50 dark:bg-indigo-500/10 border border-blue-200 dark:border-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <span>Xem hướng dẫn chi tiết</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Step 1: Install CLI */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                    1
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Cài đặt Claude Code CLI toàn cục qua Terminal
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-8.5">
                  Mở Terminal (hoặc Command Prompt / PowerShell) và chạy lệnh sau (yêu cầu máy đã cài sẵn Node.js):
                </p>

                <div className="mt-2 pl-8.5">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-blue-300 shadow-sm">
                    <span>npm install -g @anthropic-ai/claude-code</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy("cmd-install", "npm install -g @anthropic-ai/claude-code")
                      }
                      className="ml-2 inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors"
                    >
                      {copiedKey === "cmd-install" ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: First run & Onboarding */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                    2
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Khởi động lần đầu & Hoàn tất cài đặt Onboarding
                  </span>
                </div>

                <div className="pl-8.5 space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Trong Terminal, gõ lệnh: <code className="text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-blue-200 dark:border-slate-800">claude</code>
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-center shadow-xs">
                      <div className="text-[10px] text-slate-500 font-mono">Bước 2.1</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">Chọn phím 1</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Đồng ý điều khoản</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-center shadow-xs">
                      <div className="text-[10px] text-slate-500 font-mono">Bước 2.2</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">Nhấn Enter</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Xác nhận chuyển tiếp</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-center shadow-xs">
                      <div className="text-[10px] text-slate-500 font-mono">Bước 2.3</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">Chọn phím 2</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Chọn Custom Gateway</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 text-center shadow-xs">
                      <div className="text-[10px] text-slate-500 font-mono">Bước 2.4</div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">Nhấn Enter & Tắt đi</div>
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-1">Đóng Terminal lại</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: settings.json config */}
              <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/30 dark:bg-slate-900/60 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
                      3
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Cấu hình file <code className="text-indigo-600 dark:text-indigo-300 font-mono">settings.json</code>
                    </span>
                  </div>

                  {/* OS Switcher */}
                  <div className="flex items-center gap-1 rounded-lg bg-slate-200 dark:bg-slate-950 p-1 border border-slate-300 dark:border-slate-800 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setOsTab("windows")}
                      className={`px-2.5 py-1 rounded transition-all ${
                        osTab === "windows"
                          ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Windows
                    </button>
                    <button
                      type="button"
                      onClick={() => setOsTab("mac")}
                      className={`px-2.5 py-1 rounded transition-all ${
                        osTab === "mac"
                          ? "bg-white dark:bg-indigo-600 text-slate-900 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      macOS / Linux
                    </button>
                  </div>
                </div>

                <div className="pl-8.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 flex-wrap">
                    <FolderCode className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Đường dẫn mở file: </span>
                    <code className="text-emerald-700 dark:text-emerald-400 font-mono bg-white dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-800 select-all font-semibold">
                      {osTab === "windows"
                        ? "C:\\Users\\<Tên_Máy_Bạn>\\.claude\\settings.json"
                        : "~/.claude/settings.json"}
                    </code>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    (Mẹo: Nhấn phím <kbd className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px] text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-mono">Win + R</kbd>, gõ <code className="text-slate-800 dark:text-slate-200 font-mono">%USERPROFILE%\.claude</code> rồi nhấn Enter để mở nhanh thư mục).
                  </p>

                  {/* JSON Code Box */}
                  <div className="relative rounded-lg border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs shadow-md">
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300">
                      <div className="flex items-center gap-2">
                        <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                        <span>settings.json (Đã tự điền API Key của bạn)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy("vscode-json", vscodeSettingsJson)}
                        className="inline-flex items-center gap-1 rounded bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-all active:scale-95 shadow-xs"
                      >
                        {copiedKey === "vscode-json" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-300" />
                            <span>Đã sao chép cấu hình</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>1-Click Sao Chép</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-3.5 text-slate-200 text-[11px] leading-relaxed overflow-x-auto max-h-72 select-all">
                      {vscodeSettingsJson}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 4: Ready to Code */}
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    4
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-white">
                    Hoàn tất! Bắt đầu lập trình cùng Claude Code
                  </span>
                </div>
                <div className="pl-8.5 space-y-2">
                  <p className="text-xs text-emerald-900 dark:text-slate-300">
                    Bây giờ, bạn chỉ cần mở bất kỳ project nào trong VS Code, mở Terminal và gõ:
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-950 border border-emerald-300 dark:border-slate-800 px-3 py-1.5 font-mono text-xs text-emerald-800 dark:text-emerald-400 font-bold shadow-xs">
                    <span>claude</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 dark:text-slate-400">
                    Claude Code sẽ tự động phân tích repo, đọc code, tạo file và sửa lỗi theo yêu cầu của bạn hoàn toàn tự động!
                  </p>
                </div>
              </div>

              {/* Alternative: Cline / Roo Code Extension in VSCode */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Info className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  <span>Dành cho ai thích dùng Extension GUI (Cline / Roo Code / Codex):</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Cài Extension <strong>Cline</strong> hoặc <strong>Roo Code</strong> từ VS Code Marketplace, tại phần cài đặt API chọn <strong>Anthropic Compatible</strong> hoặc <strong>OpenAI Compatible</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono mt-2">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-slate-500">Base URL: </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold select-all">https://1gw.gwai.cloud</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <span className="text-slate-500">API Key: </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold select-all truncate inline-block max-w-[180px] align-bottom">
                      {currentKey}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CLAUDE AI DESKTOP APP (COWORK) */}
          {/* ======================================================== */}
          {activeTab === "desktop" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Monitor className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span>Cấu hình Claude Desktop App (Cowork) với Gateway</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Dùng ứng dụng Claude chính thức trên máy tính (Windows & macOS) kết nối API Key không giới hạn.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://docs.google.com/document/d/1yth2iw27vpuMnIq-kbHUnF4B5woVNLEa7yrpwhM4u24/edit?tab=t.0#heading=h.uiut173x9y0e"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <span>Xem tài liệu gốc Google Docs</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Step 1: Download App */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs">
                      1
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Tải & Cài đặt Claude Desktop App chính thức
                    </span>
                  </div>

                  <a
                    href="https://claude.com/download"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-sm active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Tải Claude Desktop (claude.com/download)</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 pl-8.5">
                  Tải file cài đặt phù hợp với Windows hoặc macOS và cài đặt như ứng dụng thông thường.
                </p>
              </div>

              {/* Step 2: Enable Developer Mode */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs">
                    2
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Bật Chế Độ Nhà Phát Triển (Developer Mode)
                  </span>
                </div>
                <div className="pl-8.5 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <p className="text-slate-600 dark:text-slate-400">Mở ứng dụng Claude Desktop, trên thanh menu trên cùng chọn lần lượt:</p>
                  <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
                    <span className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 shadow-xs">
                      Help
                    </span>
                    <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    <span className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded text-slate-700 dark:text-slate-300 shadow-xs">
                      Troubleshooting
                    </span>
                    <ChevronRight className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                    <span className="bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 px-2 py-1 rounded text-amber-800 dark:text-amber-300 font-bold shadow-xs">
                      Enable Developer Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ứng dụng Claude sẽ tự động reload lại trong 2 giây.
                  </p>
                </div>
              </div>

              {/* Step 3 & 4: Configure Third-Party Inference */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/30 dark:bg-slate-900/60 p-4 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-600 text-white font-bold text-xs">
                    3
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Mở Cấu Hình & Nhập Thông Tin UniversalAI Gateway
                  </span>
                </div>

                <div className="pl-8.5 space-y-3">
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Trên thanh menu, chọn: <strong>Developer</strong> → <strong>Configure Third-Party Inference...</strong>
                    <br />
                    Tại mục <strong>Connection</strong>, chọn <strong>Gateway</strong> và điền chính xác 3 thông số sau:
                  </p>

                  {/* Form fields mockup with 1-click copy */}
                  <div className="space-y-2.5 bg-white dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
                    {/* Gateway base URL */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium sm:w-44">Gateway base URL:</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <code className="text-emerald-700 dark:text-emerald-400 font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 select-all">
                          https://1gw.gwai.cloud
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy("url-gw", "https://1gw.gwai.cloud")}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          {copiedKey === "url-gw" ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Gateway API Key */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium sm:w-44">Gateway API key:</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <code className="text-emerald-700 dark:text-emerald-400 font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 select-all truncate max-w-[200px] sm:max-w-xs">
                          {currentKey}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy("key-gw", currentKey)}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          {copiedKey === "key-gw" ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Gateway auth schema */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium sm:w-44">Gateway auth schema:</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <code className="text-amber-700 dark:text-amber-400 font-bold bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 select-all">
                          x-api-key
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopy("schema-gw", "x-api-key")}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          {copiedKey === "schema-gw" ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Nhấn nút <strong>Apply locally</strong>. Claude Desktop sẽ tự động reload lại.
                  </p>
                </div>
              </div>

              {/* Step 5: Continue with Gateway */}
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    4
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-white">
                    Bấm &quot;Continue with Gateway&quot; & Hoàn thành!
                  </span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-slate-300 pl-8.5">
                  Sau khi reload, bạn chọn nút <strong>Continue with Gateway</strong>. Bây giờ toàn bộ cuộc trò chuyện sẽ chạy trực tiếp qua API tốc độ cao, không bao giờ bị giới hạn tin nhắn như tài khoản web miễn phí!
                </p>
              </div>

              {/* Windows Troubleshooting Box */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <Wrench className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Xử lý lỗi duy nhất (nếu gặp lỗi VirtualMachine trên Windows):</span>
                </div>
                <p className="text-xs text-rose-950 dark:text-slate-300">
                  Nếu ứng dụng báo lỗi thiếu nền tảng ảo hóa, hãy mở <strong>CMD (Command Prompt)</strong> bằng quyền <strong>Run as Administrator</strong> và chạy lệnh:
                </p>
                <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-950 border border-rose-200 dark:border-slate-800 px-3 py-2 text-xs font-mono text-rose-700 dark:text-rose-300 shadow-xs">
                  <span className="select-all">
                    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "cmd-dism",
                        "dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart"
                      )
                    }
                    className="ml-2 bg-rose-100 hover:bg-rose-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-900 dark:text-slate-200 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors border border-rose-200 dark:border-slate-700"
                  >
                    {copiedKey === "cmd-dism" ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <p className="text-[11px] text-rose-800/80 dark:text-slate-400">
                  Sau khi lệnh chạy xong, khởi động lại máy tính (Restart) là Claude Desktop hoạt động bình thường 100%.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: OPENCLAW AI AGENT */}
          {/* ======================================================== */}
          {activeTab === "openclaw" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span>Cấu hình OpenClaw với UniversalAI Gateway</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Framework AI agent mã nguồn mở — Chạy Claude Opus 4.7, Claude Sonnet 4.6 tự động hóa tác vụ.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://docs.google.com/document/d/1MePShh4mUmnGkM2NuT9CiN2Lg7QXcP4gruybGKh1kM4/edit?tab=t.0"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <span>Xem tài liệu gốc Google Docs</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Step 1: Install OpenClaw */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
                    1
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Cài đặt OpenClaw trên máy tính
                  </span>
                </div>

                <div className="pl-8.5 space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Cách 1: Cài qua npm (Khuyên dùng):</p>
                  <div className="flex items-center justify-between rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-purple-300 shadow-sm">
                    <span>npm install -g openclaw@latest</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("openclaw-npm", "npm install -g openclaw@latest")}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === "openclaw-npm" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">Cách 2: Script cài nhanh cho Windows PowerShell:</p>
                  <div className="flex items-center justify-between rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs font-mono text-purple-300 shadow-sm">
                    <span>iwr -useb https://openclaw.ai/install.ps1 | iex</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("openclaw-ps", "iwr -useb https://openclaw.ai/install.ps1 | iex")}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === "openclaw-ps" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Onboard & Daemon */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
                    2
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Khởi tạo OpenClaw & Cài đặt Daemon chạy nền
                  </span>
                </div>
                <div className="pl-8.5 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p>Chạy lệnh sau trong Terminal để tạo thư mục cấu hình và kích hoạt daemon:</p>
                  <div className="flex items-center justify-between rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 font-mono text-purple-300 shadow-sm">
                    <span>openclaw onboard --install-daemon</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("openclaw-onboard", "openclaw onboard --install-daemon")}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors"
                    >
                      {copiedKey === "openclaw-onboard" ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 3: openclaw.json */}
              <div className="rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50/30 dark:bg-slate-900/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white font-bold text-xs">
                      3
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Cấu hình file <code className="text-purple-600 dark:text-purple-300 font-mono">~/.openclaw/openclaw.json</code>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy("openclaw-json", openclawJson)}
                    className="inline-flex items-center gap-1 rounded bg-purple-600 hover:bg-purple-500 px-3 py-1 text-xs font-semibold text-white transition-all active:scale-95 shadow-xs"
                  >
                    {copiedKey === "openclaw-json" ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-300" />
                        <span>Đã chép file</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Sao chép JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pl-8.5 space-y-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Mở file <code className="text-purple-700 dark:text-purple-300 font-mono">openclaw.json</code> trong thư mục cá nhân và dán cấu hình sau:
                  </p>
                  <pre className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 select-all shadow-md">
                    {openclawJson}
                  </pre>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Model mặc định được gán cho agent là: <strong className="text-purple-700 dark:text-purple-400">Clawbot Opus 4.7</strong> (mạnh mẽ nhất hiện nay).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: OPEN DESIGN WEB (DESIGN CLAUDE) */}
          {/* ======================================================== */}
          {activeTab === "design" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Thiết Kế Web với Claude trên Open Design Gateway</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Giao diện trực quan trên trình duyệt — Dán API Key là bắt đầu tạo mockup UI, website, component tự động.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://design.gwai.cloud/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3.5 py-1.5 rounded-lg transition-colors font-semibold"
                  >
                    <span>Mở Open Design Gateway</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Step by step cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    1
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Truy cập trang đăng nhập
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Mở đường link <code className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">https://design.gwai.cloud/</code> trên Chrome hoặc bất kỳ trình duyệt nào.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    2
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Tạo tài khoản & Dán Key
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Nhập <strong>Username</strong> và <strong>Password</strong> bạn muốn. Ở ô <strong>API Key</strong>, dán mã API Key được cấp ở trên.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                    3
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Bấm Login / Register
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Hệ thống sẽ tự tạo workspace và mã hóa bảo mật API Key của bạn. Bạn có thể sử dụng ngay lập tức!
                  </p>
                </div>
              </div>

              {/* Quick Launch Action Banner */}
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-500/30 bg-gradient-to-r from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:to-slate-900/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-emerald-950 dark:text-white">
                      Khởi chạy trực tiếp với API Key của bạn
                    </span>
                  </div>
                  <p className="text-xs text-emerald-900 dark:text-slate-300">
                    API Key: <code className="text-emerald-800 dark:text-emerald-300 font-mono font-bold">{currentKey}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy("design-key", currentKey)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-white transition-colors border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    {copiedKey === "design-key" ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Chép Key</span>
                      </>
                    )}
                  </button>
                  <a
                    href="https://design.gwai.cloud/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md active:scale-95"
                  >
                    <span>Mở Web Design</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: CURSOR & WINDSURF */}
          {/* ======================================================== */}
          {activeTab === "cursor" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <span>Cấu hình Cursor AI / Windsurf</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Trình soạn thảo AI phổ biến nhất hiện nay — Tận dụng Tab Autocomplete và Composer không giới hạn.
                  </p>
                </div>
              </div>

              {/* 3 Step setup */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-600 text-white font-bold font-mono text-[11px] mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="text-slate-900 dark:text-white font-bold">Mở cài đặt Model: </span>
                    <span className="text-slate-600 dark:text-slate-400">
                      Bấm vào biểu tượng bánh răng <strong className="text-slate-800 dark:text-slate-200">Settings</strong> (góc trên bên phải) → chọn mục <strong className="text-cyan-700 dark:text-cyan-400">Models</strong>.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-600 text-white font-bold font-mono text-[11px] mt-0.5">
                    2
                  </span>
                  <div className="w-full space-y-2">
                    <div className="text-slate-900 dark:text-white font-bold">Cài đặt Base URL:</div>
                    <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono shadow-xs">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold select-all">https://1gw.gwai.cloud</span>
                      <button
                        type="button"
                        onClick={() => handleCopy("cursor-url", "https://1gw.gwai.cloud")}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        {copiedKey === "cursor-url" ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      (Hoặc nếu dùng gói Codex AI: điền <code className="text-slate-700 dark:text-slate-300 font-mono">https://modelapi.vn/v1</code> vào ô Override OpenAI Base URL).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-cyan-600 text-white font-bold font-mono text-[11px] mt-0.5">
                    3
                  </span>
                  <div className="w-full space-y-2">
                    <div className="text-slate-900 dark:text-white font-bold">Dán API Key:</div>
                    <div className="flex items-center justify-between rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 font-mono shadow-xs">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold select-all truncate max-w-sm">
                        {currentKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy("cursor-key", currentKey)}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[11px] flex items-center gap-1 transition-colors border border-slate-200 dark:border-slate-700"
                      >
                        {copiedKey === "cursor-key" ? <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Quick Links & Support Callout */}
        <div className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/70 px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Cần hỗ trợ cấu hình từ xa? Liên hệ Telegram kỹ thuật: <strong className="text-slate-900 dark:text-white">@daitruong_admin</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/developer/usage"
              className="text-blue-600 dark:text-indigo-400 hover:text-blue-700 dark:hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1"
            >
              <span>Kiểm tra Quota & Logs</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
