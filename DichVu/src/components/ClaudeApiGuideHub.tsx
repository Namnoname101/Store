"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  ArrowRight,
  Download,
  Terminal,
  X,
  Sparkles,
} from "lucide-react";

export interface ClaudeApiGuideHubProps {
  apiKey?: string;
  compactMode?: boolean;
  initialTab?: "desktop" | "cursor" | "vscode" | "design" | "openclaw";
  showKeyInput?: boolean;
}

// Authentic SVG Brand Logos
function ClaudeIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#D97757" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
    </svg>
  );
}

function CursorIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#090D16" />
      <path
        d="M18.8 6.5L12.4 2.3a.8.8 0 00-.8 0L5.2 6.5a.7.7 0 00-.3.6v8.4c0 .3.1.5.3.6l6.4 4.2c.2.2.6.2.8 0l6.4-4.2c.2-.1.3-.3.3-.6V7.1a.7.7 0 00-.3-.6zm-.5 1.1L12.2 18c-.1.1-.3.1-.3 0V11a.5.5 0 00-.2-.4l-5.6-3c-.1-.1-.1-.3 0-.3h12.1c.2 0 .3.2.1.3z"
        fill="#00F2FE"
      />
    </svg>
  );
}

function VscodeIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#007ACC" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z" />
    </svg>
  );
}

function WebDesignIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#115E59" />
      <rect x="4" y="5" width="16" height="14" rx="2" stroke="#2DD4BF" strokeWidth="1.5" />
      <path d="M4 9h16M8 5v4" stroke="#2DD4BF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="15.5" cy="13.5" r="1.5" fill="#5EEAD4" />
      <path d="M7 15l2.5-2.5 2 2 3-3 2.5 2.5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OpenClawIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" rx="4" fill="#1C1917" />
      <g fill="#3a0a0d">
        <rect x="1" y="5" width="1" height="3" />
        <rect x="2" y="4" width="1" height="1" />
        <rect x="2" y="8" width="1" height="1" />
        <rect x="3" y="3" width="1" height="1" />
        <rect x="3" y="9" width="1" height="1" />
        <rect x="4" y="2" width="1" height="1" />
        <rect x="4" y="10" width="1" height="1" />
        <rect x="5" y="2" width="6" height="1" />
        <rect x="11" y="2" width="1" height="1" />
        <rect x="12" y="3" width="1" height="1" />
        <rect x="12" y="9" width="1" height="1" />
        <rect x="13" y="4" width="1" height="1" />
        <rect x="13" y="8" width="1" height="1" />
        <rect x="14" y="5" width="1" height="3" />
        <rect x="5" y="11" width="6" height="1" />
        <rect x="4" y="12" width="1" height="1" />
        <rect x="11" y="12" width="1" height="1" />
        <rect x="3" y="13" width="1" height="1" />
        <rect x="12" y="13" width="1" height="1" />
        <rect x="5" y="14" width="6" height="1" />
      </g>
      <g fill="#ff4f40">
        <rect x="5" y="3" width="6" height="1" />
        <rect x="4" y="4" width="8" height="1" />
        <rect x="3" y="5" width="10" height="1" />
        <rect x="3" y="6" width="10" height="1" />
        <rect x="3" y="7" width="10" height="1" />
        <rect x="4" y="8" width="8" height="1" />
        <rect x="5" y="9" width="6" height="1" />
        <rect x="5" y="12" width="6" height="1" />
        <rect x="6" y="13" width="4" height="1" />
      </g>
      <g fill="#ff775f">
        <rect x="1" y="6" width="2" height="1" />
        <rect x="2" y="5" width="1" height="1" />
        <rect x="2" y="7" width="1" height="1" />
        <rect x="13" y="6" width="2" height="1" />
        <rect x="13" y="5" width="1" height="1" />
        <rect x="13" y="7" width="1" height="1" />
      </g>
      <g fill="#081016">
        <rect x="6" y="5" width="1" height="1" />
        <rect x="9" y="5" width="1" height="1" />
      </g>
      <g fill="#f5fbff">
        <rect x="6" y="4" width="1" height="1" />
        <rect x="9" y="4" width="1" height="1" />
      </g>
    </svg>
  );
}

export default function ClaudeApiGuideHub({
  apiKey = "",
  compactMode = false,
  initialTab = "desktop",
  showKeyInput = true,
}: ClaudeApiGuideHubProps) {
  const [customKey, setCustomKey] = useState<string>(apiKey || "");
  const [activeTab, setActiveTab] = useState<
    "desktop" | "cursor" | "vscode" | "design" | "openclaw"
  >(initialTab);
  const [osTab, setOsTab] = useState<"windows" | "mac">("windows");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);
  const [showManualSetup, setShowManualSetup] = useState<boolean>(false);

  const currentKey = customKey.trim() || apiKey || "sk-ant-api03-khodee-demo-key-8888";
  const isCustomKeyEntered = Boolean(customKey.trim() || apiKey);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

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
          { "id": "claude-opus-4-7", "name": "Clawbot Opus 4.7" },
          { "id": "claude-sonnet-4-6", "name": "Clawbot Sonnet 4.6" }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "gwai/claude-opus-4-7" }
    }
  }
}`;

  const platforms = [
    {
      id: "desktop" as const,
      name: "Claude Desktop",
      subtitle: "App máy tính (PC & Mac)",
      badge: "Dễ dùng nhất",
      IconComponent: ClaudeIcon,
    },
    {
      id: "cursor" as const,
      name: "Cursor AI",
      subtitle: "AI IDE soạn thảo code",
      badge: "Phổ biến",
      IconComponent: CursorIcon,
    },
    {
      id: "vscode" as const,
      name: "VS Code & CLI",
      subtitle: "Terminal Claude Code",
      badge: "Lập trình viên",
      IconComponent: VscodeIcon,
    },
    {
      id: "design" as const,
      name: "Open Design",
      subtitle: "Thiết kế Web trực tuyến",
      badge: "Trình duyệt",
      IconComponent: WebDesignIcon,
    },
    {
      id: "openclaw" as const,
      name: "OpenClaw Agent",
      subtitle: "Framework AI Agent",
      badge: "Mã nguồn mở",
      IconComponent: OpenClawIcon,
    },
  ];

  return (
    <div className="w-full space-y-6 text-slate-800 dark:text-slate-200">
      {/* Clean API Key Input Bar */}
      {showKeyInput && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Mã API Key của bạn
                </span>
                {isCustomKeyEntered ? (
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                    Đã đồng bộ vào cấu hình
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    (Nhập key để xem cấu hình hoàn chỉnh)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Các đoạn mã bên dưới sẽ tự động gắn mã Key này để bạn sao chép thuận tiện.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:max-w-md w-full sm:w-auto">
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Dán mã API Key (sk-...)"
                className="w-full sm:w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-slate-900 dark:focus:border-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleCopy("main-key", currentKey)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 px-3.5 py-2 text-xs font-semibold text-white transition shrink-0 active:scale-95"
              >
                {copiedKey === "main-key" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs overflow-hidden">
        {/* Platform Selection */}
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Chọn nền tảng bạn muốn kết nối:
            </span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              1 API Key dùng chung được cho cả 5 nền tảng
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {platforms.map((p) => {
              const Icon = p.IconComponent;
              const isActive = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveTab(p.id)}
                  className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-900 border-slate-900 dark:border-white shadow-sm ring-1 ring-slate-900 dark:ring-white"
                      : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="shrink-0">
                      <Icon className="h-7 w-7" />
                    </div>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {p.badge}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {p.subtitle}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-7">
          {/* ======================================================== */}
          {/* TAB 1: CLAUDE AI DESKTOP APP (COWORK) */}
          {/* ======================================================== */}
          {activeTab === "desktop" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      Cấu hình Claude Desktop App (Tự động 1-Click với Khodee Gateway)
                    </h3>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#D97757] bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 px-2 py-0.5 rounded-full">
                      <Sparkles className="h-3 w-3" />
                      v0.3.3 Mới nhất
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Dành cho Windows &amp; macOS. Trò chuyện trực tiếp với Claude Opus 4.7 &amp; Sonnet 3.7 qua Gateway, tự động mở sẵn tính năng Import chat từ Claude.ai.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://drive.google.com/file/d/1lOjC5O7QGW7P5eOmPhAkXU3QyZIxOGAX/view?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#D97757] hover:bg-[#c26547] text-white px-3.5 py-2 text-xs font-bold transition shadow-xs active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Tải KhodeeGateway.exe (94 KB)</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <a
                    href="https://claude.com/download"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 text-xs font-medium transition"
                  >
                    <span>Tải App Claude Desktop</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Step 1: Tool 1-Click */}
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D97757] text-white text-xs font-bold">
                        1
                      </span>
                      <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        Bước 1: Mở Khodee Gateway &amp; Bấm START (1-Click cấu hình)
                      </h5>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Tự động 100% trong 5 giây
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8 space-y-1.5">
                    <p>
                      Mở file <code className="font-mono font-bold text-slate-900 dark:text-white">KhodeeGateway.exe</code> (chọn <em>Yes</em> nếu Windows hỏi quyền Administrator). Dán mã API Key được cấp vào ô duy nhất rồi nhấn nút <strong className="text-blue-600 dark:text-blue-400 font-bold">⚡ START</strong>.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      • <strong>Tự động kiểm tra Key:</strong> Hệ thống kết nối kiểm tra hạn mức API thời gian thực, báo số dư còn lại (ví dụ: <code className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Còn $9.99/$10.00</code>).<br />
                      • <strong>Tự động nạp Gateway &amp; Mở khóa Import chat:</strong> Ghi cấu hình bảo mật vào máy và tự động khởi động lại Claude Desktop trong 1-2 giây.
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      setLightboxImage({
                        src: "/images/guides/claude/step-1-tool.png",
                        title: "Bước 1: Giao diện Khodee Gateway v0.3.3 One-Click",
                      })
                    }
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/claude/step-1-tool.png"
                      alt="Bước 1: Giao diện Khodee Gateway One-Click"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Import Chat Guide Header */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="h-2 w-2 rounded-full bg-[#D97757]" />
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Đồng bộ (Import) toàn bộ lịch sử Chat &amp; Projects từ Claude.ai về máy
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sau khi bấm START, quyền Import đã được mở khóa sẵn. Hãy làm theo 4 bước trực quan bên dưới để kéo toàn bộ lịch sử chat cũ về Claude Desktop (chỉ cần làm 1 lần duy nhất):
                  </p>
                </div>

                {/* Step 2 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">
                      2
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Bước 2: Mở Cài đặt (Settings) trên Claude Desktop
                    </h5>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                    Tại góc dưới cùng bên trái cửa sổ Claude Desktop, <strong>nhấp chuột vào Avatar / Tên tài khoản</strong> của bạn, hoặc bấm tổ hợp phím tắt <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-[11px]">Ctrl + ,</kbd> (phím Ctrl và dấu phẩy).
                  </p>
                  <div
                    onClick={() =>
                      setLightboxImage({
                        src: "/images/guides/claude/step-2-settings.png",
                        title: "Bước 2: Mở Cài đặt trên Claude Desktop từ Avatar hoặc Ctrl + ,",
                      })
                    }
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/claude/step-2-settings.png"
                      alt="Bước 2: Mở Cài đặt từ góc dưới bên trái"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">
                      3
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Bước 3: Chọn mục &quot;Import &amp; export&quot; trong danh mục cài đặt
                    </h5>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                    Trong cột menu bên trái của cửa sổ Cài đặt, tìm và nhấp chọn mục <strong className="text-slate-900 dark:text-white font-semibold">Import &amp; export</strong> (có biểu tượng mũi tên tải xuống).
                  </p>
                  <div
                    onClick={() =>
                      setLightboxImage({
                        src: "/images/guides/claude/step-3-import-tab.png",
                        title: "Bước 3: Chọn mục Import & export ở thanh danh mục bên trái",
                      })
                    }
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/claude/step-3-import-tab.png"
                      alt="Bước 3: Chọn Import & export trong menu Cài đặt"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Step 4 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">
                      4
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Bước 4: Nhấp vào nút màu cam &quot;Import...&quot;
                    </h5>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                    Tại phần <strong>Import</strong> bên phải, nhấp vào nút màu cam đất <strong className="text-[#D97757]">Import...</strong> (nút này đã được Khodee Gateway mở khóa sẵn sàng thay vì bị mờ).
                  </p>
                  <div
                    onClick={() =>
                      setLightboxImage({
                        src: "/images/guides/claude/step-4-import-btn.png",
                        title: "Bước 4: Nhấp vào nút Import... màu cam đất",
                      })
                    }
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/claude/step-4-import-btn.png"
                      alt="Bước 4: Nhấp vào nút Import màu cam"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Step 5 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                      5
                    </span>
                    <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Bước 5: Đăng nhập để đồng bộ chat tự động từ Claude.ai
                    </h5>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8 space-y-1.5">
                    <p>
                      Cửa sổ <em>Import from Claude</em> sẽ xuất hiện với 2 cách thức:
                    </p>
                    <p>
                      👉 <strong>Cách 1 (Khuyên dùng - Nhanh nhất):</strong> Bấm nút màu đen <code className="font-semibold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">Sign In to claude.ai...</code> ➔ Trình duyệt sẽ mở ra trang Claude.ai. Bạn đăng nhập tài khoản bình thường. Ngay sau khi đăng nhập thành công, toàn bộ cuộc trò chuyện &amp; Projects sẽ tự động tải về Claude Desktop!
                    </p>
                    <p>
                      👉 <strong>Cách 2 (Chọn file .zip):</strong> Nếu bạn đã có sẵn file export dữ liệu từ web Claude.ai trước đó (vào <em>Settings &gt; Privacy &gt; Export data</em>), bấm <code className="font-semibold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">Choose file...</code> và chọn file <code>.zip</code> đó.
                    </p>
                  </div>
                  <div
                    onClick={() =>
                      setLightboxImage({
                        src: "/images/guides/claude/step-5-signin-sync.png",
                        title: "Bước 5: Cửa sổ Import Wizard - Bấm Sign In to claude.ai hoặc chọn file zip",
                      })
                    }
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/claude/step-5-signin-sync.png"
                      alt="Bước 5: Cửa sổ Import from Claude"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Important Alert Box for Changing Keys */}
                <div className="rounded-2xl border-2 border-amber-300/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 font-bold text-sm sm:text-base">
                    <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Lưu ý quan trọng: Khi hết hạn mức hoặc muốn đổi Key mới thì làm thế nào?</span>
                  </div>

                  <div className="space-y-2 text-xs sm:text-sm text-amber-900/90 dark:text-amber-200/90 pl-7 leading-relaxed">
                    <p>
                      🛡️ <strong>HOÀN TOÀN KHÔNG BỊ MẤT CHAT:</strong> Tất cả các đoạn chat cũ, lịch sử hội thoại và project đã import hoặc vừa trò chuyện đều được lưu vĩnh viễn trên máy tính của bạn (tại <code>AppData</code>). Việc đổi Key chỉ là thay đổi &quot;chìa khóa kết nối mạng&quot;, tuyệt đối không làm mất bất kỳ tin nhắn nào của bạn.
                    </p>
                    <p>
                      ⚡ <strong>KHÔNG CẦN IMPORT LẠI - ĐỔI KEY CHỈ TRONG 10 GIÂY:</strong> Bạn không cần phải thao tác Import lại từ đầu. Khi mua key mới, bạn chỉ việc mở lại file <code className="font-bold">KhodeeGateway.exe</code>, dán Key mới vào ô và bấm <strong className="text-blue-600 dark:text-blue-400 font-bold">⚡ START</strong>. Tool sẽ tự kiểm tra key, nạp vào hệ thống và khởi động lại Claude Desktop. Bạn tiếp tục chat bình thường ngay lập tức!
                    </p>
                  </div>
                </div>

                {/* Optional Manual Setup Accordion */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowManualSetup(!showManualSetup)}
                    className="w-full flex items-center justify-between p-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-slate-500" />
                      <span>Xem cấu hình thủ công (Dành cho macOS / Linux hoặc Developer nâng cao)</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showManualSetup ? "rotate-180" : ""}`} />
                  </button>

                  {showManualSetup && (
                    <div className="p-4 pt-0 space-y-3 text-xs border-t border-slate-100 dark:border-slate-800/60 mt-1">
                      <p className="text-slate-600 dark:text-slate-400">
                        Nếu sử dụng macOS/Linux hoặc không muốn dùng tool tự động, bạn có thể nạp các thông số Gateway sau vào cấu hình Claude Desktop:
                      </p>

                      <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-slate-500 font-sans text-xs">Gateway Base URL:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-slate-900 dark:text-emerald-400 font-bold select-all">https://1gw.gwai.cloud</code>
                            <button
                              type="button"
                              onClick={() => handleCopy("gw-url", "https://1gw.gwai.cloud")}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300"
                            >
                              {copiedKey === "gw-url" ? "Đã chép" : "Chép"}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 font-sans text-xs">Gateway API Key:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-slate-900 dark:text-emerald-400 font-bold select-all truncate max-w-[200px]">{currentKey}</code>
                            <button
                              type="button"
                              onClick={() => handleCopy("gw-key", currentKey)}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300"
                            >
                              {copiedKey === "gw-key" ? "Đã chép" : "Chép"}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 font-sans text-xs">Gateway Auth Scheme:</span>
                          <div className="flex items-center gap-2">
                            <code className="text-slate-900 dark:text-emerald-400 font-bold select-all">x-api-key</code>
                            <button
                              type="button"
                              onClick={() => handleCopy("gw-schema", "x-api-key")}
                              className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300"
                            >
                              {copiedKey === "gw-schema" ? "Đã chép" : "Chép"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CURSOR AI & WINDSURF */}
          {/* ======================================================== */}
          {activeTab === "cursor" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Cấu hình Cursor AI & Windsurf
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Tận dụng Claude Sonnet 5.5 trong Cursor Composer, Agent Mode và Tab Autocomplete mà không phụ thuộc gói Pro tháng của Cursor.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs">
                      1
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Mở cài đặt Models trong Cursor
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 pl-7.5">
                    Bấm vào biểu tượng bánh răng <strong>Settings</strong> ở góc trên bên phải màn hình (hoặc phím tắt <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-950 border text-[11px] font-mono">Ctrl + ,</kbd>) → chọn tab <strong>Models</strong>.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs">
                      2
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Điền Base URL & API Key
                    </span>
                  </div>

                  <div className="pl-7.5 space-y-2.5 text-xs">
                    <div className="bg-white dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 font-mono space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-500 font-sans text-xs">Override Base URL:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-slate-900 dark:text-emerald-400 font-bold select-all">
                            https://1gw.gwai.cloud
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy("cursor-url", "https://1gw.gwai.cloud")}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 transition"
                          >
                            {copiedKey === "cursor-url" ? "Đã chép" : "Chép"}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 border-t border-slate-100 dark:border-slate-900">
                        <span className="text-slate-500 font-sans text-xs">Anthropic API Key:</span>
                        <div className="flex items-center gap-2">
                          <code className="text-slate-900 dark:text-emerald-400 font-bold select-all truncate max-w-[220px]">
                            {currentKey}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy("cursor-key", currentKey)}
                            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-300 transition"
                          >
                            {copiedKey === "cursor-key" ? "Đã chép" : "Chép"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs">
                      3
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Thêm Model ID
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 pl-7.5 leading-relaxed">
                    Trong danh sách Model, bấm <strong>Add Model</strong> và nhập: <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-950 border font-mono font-bold text-slate-900 dark:text-white">claude-3-5-sonnet-20241022</code> hoặc <code className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-950 border font-mono font-bold text-slate-900 dark:text-white">claude-opus-4-7</code>. Sau đó bật model này lên là hoàn tất.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: VS CODE & CLAUDE CODE CLI */}
          {/* ======================================================== */}
          {activeTab === "vscode" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Cấu hình Claude Code CLI trong VS Code
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Công cụ dòng lệnh chính thức của Anthropic — Đọc hiểu toàn bộ codebase, sửa code và thực thi lệnh tự động trong Terminal.
                </p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs">
                      1
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Cài đặt Claude Code CLI (Toàn cục)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 pl-7.5">
                    Mở Terminal (Command Prompt / PowerShell / Bash) và chạy lệnh sau (yêu cầu đã cài Node.js):
                  </p>
                  <div className="mt-2 pl-7.5">
                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200">
                      <span>npm install -g @anthropic-ai/claude-code</span>
                      <button
                        type="button"
                        onClick={() => handleCopy("cmd-install", "npm install -g @anthropic-ai/claude-code")}
                        className="ml-2 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition"
                      >
                        {copiedKey === "cmd-install" ? "Đã chép" : "Sao chép"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs">
                      2
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Khởi động lần đầu & Chọn Custom Gateway
                    </span>
                  </div>
                  <div className="pl-7.5 mt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <p>Trong Terminal, gõ lệnh: <code className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded border">claude</code> rồi thực hiện 3 thao tác:</p>
                    <div className="space-y-1.5 font-sans pl-2 border-l-2 border-slate-300 dark:border-slate-700 text-xs">
                      <div><strong>• Thao tác 1:</strong> Bấm phím <strong>1</strong> (Đồng ý điều khoản) → Nhấn <strong>Enter</strong>.</div>
                      <div><strong>• Thao tác 2:</strong> Nhấn <strong>Enter</strong> một lần nữa để tiếp tục.</div>
                      <div><strong>• Thao tác 3:</strong> Bấm phím <strong>2</strong> (Chọn Custom Gateway) → Nhấn <strong>Enter</strong> rồi tắt cửa sổ Terminal.</div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs">
                        3
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        Dán cấu hình vào file <code className="font-mono">settings.json</code>
                      </span>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-slate-200 dark:bg-slate-900 p-1 text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => setOsTab("windows")}
                        className={`px-2.5 py-1 rounded transition ${
                          osTab === "windows"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        Windows
                      </button>
                      <button
                        type="button"
                        onClick={() => setOsTab("mac")}
                        className={`px-2.5 py-1 rounded transition ${
                          osTab === "mac"
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        macOS / Linux
                      </button>
                    </div>
                  </div>

                  <div className="pl-7.5 space-y-2 text-xs">
                    <p className="text-slate-600 dark:text-slate-400">
                      Đường dẫn mở file:{" "}
                      <code className="text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-950 px-2 py-0.5 rounded border select-all">
                        {osTab === "windows"
                          ? "%USERPROFILE%\\.claude\\settings.json"
                          : "~/.claude/settings.json"}
                      </code>
                    </p>

                    <div className="relative rounded-lg border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300">
                        <span>settings.json (Đã gắn sẵn API Key)</span>
                        <button
                          type="button"
                          onClick={() => handleCopy("vscode-json", vscodeSettingsJson)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition text-[11px]"
                        >
                          {copiedKey === "vscode-json" ? "Đã sao chép" : "Sao chép cấu hình"}
                        </button>
                      </div>
                      <pre className="p-3 text-slate-200 text-[11px] leading-relaxed overflow-x-auto max-h-64 select-all">
                        {vscodeSettingsJson}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Compatibility: Cline & Roo Code */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Tùy chọn: Kết nối qua Extension Cline hoặc Roo Code trong VS Code
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Nếu bạn thích dùng giao diện bảng điều khiển trong VS Code, hãy cài extension <strong>Cline</strong> hoặc <strong>Roo Code</strong> và điền thông số:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs mt-1">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-sans text-[11px]">API Provider: </span>
                      <span className="text-slate-900 dark:text-white font-bold">Anthropic</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 font-sans text-[11px]">Base URL: </span>
                      <span className="text-slate-900 dark:text-emerald-400 font-bold select-all">https://1gw.gwai.cloud</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: OPEN DESIGN WEB */}
          {/* ======================================================== */}
          {activeTab === "design" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Thiết Kế Giao Diện Trực Tuyến với Open Design Gateway
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Sử dụng trực tiếp trên trình duyệt web, không cần cài đặt phần mềm trên máy tính.
                  </p>
                </div>

                <a
                  href="https://design.gwai.cloud/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 rounded-lg transition font-semibold"
                >
                  <span>Mở Web Open Design</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white">1. Truy cập trang web</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Mở đường link <code className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">https://design.gwai.cloud/</code> trên Chrome hoặc Edge.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white">2. Nhập thông tin & Key</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Điền Username / Password bạn muốn tạo. Tại ô <strong>API Key</strong>, dán mã API Key được cấp.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white">3. Bắt đầu thiết kế</div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Hệ thống sẽ lưu key an toàn trong phiên làm việc. Bạn có thể yêu cầu Claude vẽ mockup và sinh code ngay lập tức.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: OPENCLAW AI AGENT */}
          {/* ======================================================== */}
          {activeTab === "openclaw" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Cấu hình OpenClaw Framework AI Agent
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Framework agent đa năng mã nguồn mở — Chạy nền với Claude Opus 4.7 và Claude Sonnet 4.6.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4">
                  <div className="text-xs font-bold text-slate-900 dark:text-white mb-2">
                    1. Cài đặt OpenClaw qua npm:
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 font-mono text-xs text-slate-200">
                    <span>npm install -g openclaw@latest</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("openclaw-cmd", "npm install -g openclaw@latest")}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition"
                    >
                      {copiedKey === "openclaw-cmd" ? "Đã chép" : "Chép"}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      2. Cấu hình file <code className="font-mono">~/.openclaw/openclaw.json</code>:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy("openclaw-json", openclawJson)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] transition"
                    >
                      {copiedKey === "openclaw-json" ? "Đã sao chép" : "Sao chép JSON"}
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-60 select-all">
                    {openclawJson}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Support Callout */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Hỗ trợ kỹ thuật 24/7 qua Ultraviewer / Telegram nếu cần trợ giúp cấu hình.</span>
          </div>

          <Link
            href="/developer/usage"
            className="text-slate-900 dark:text-white hover:underline font-semibold flex items-center gap-1 transition"
          >
            <span>Trang kiểm tra Quota & Logs</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full pb-2.5 text-white text-xs font-semibold px-1">
              <span className="truncate mr-4">{lightboxImage.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-white font-medium transition cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Đóng (Esc)</span>
              </button>
            </div>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-700 bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  );
}
