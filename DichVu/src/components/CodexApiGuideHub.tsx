"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Copy,
  Check,
  Download,
  ShieldCheck,
  ArrowRight,
  ZoomIn,
  X,
} from "lucide-react";

export interface CodexApiGuideHubProps {
  apiKey?: string;
  showKeyInput?: boolean;
}

// Authentic Vector SVG Brand Logos
function ChatGptIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#10A37F" />
      <g transform="translate(3, 3) scale(0.75)" fill="#ffffff">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
      </g>
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

function TerminalIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#0F172A" />
      <path d="M6 8l4 4-4 4M12 16h6" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CodexApiGuideHub({
  apiKey = "",
  showKeyInput = true,
}: CodexApiGuideHubProps) {
  const [customKey, setCustomKey] = useState<string>(apiKey || "");
  const [activeTab, setActiveTab] = useState<"helper" | "cursor" | "vscode" | "cli">("helper");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  const currentKey = customKey.trim() || apiKey || "sk-cdx-demo-key-8888";
  const isCustomKeyEntered = Boolean(customKey.trim() || apiKey);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const platforms = [
    {
      id: "helper" as const,
      name: "ChatGPT App",
      subtitle: "KhoDee 1-Click (Windows)",
      badge: "Dễ dùng nhất",
      IconComponent: ChatGptIcon,
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
      name: "VS Code & Cline",
      subtitle: "Roo Code, Continue...",
      badge: "Lập trình viên",
      IconComponent: VscodeIcon,
    },
    {
      id: "cli" as const,
      name: "Terminal & Script",
      subtitle: "Curl, Python, Node.js",
      badge: "Developer",
      IconComponent: TerminalIcon,
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
                  Mã API Key Codex của bạn
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
              1 API Key dùng chung được cho cả 4 môi trường
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
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
          {/* TAB 1: Ứng Dụng ChatGPT qua KhoDee-helper */}
          {/* ======================================================== */}
          {activeTab === "helper" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Kích hoạt Ứng Dụng ChatGPT Windows với KhoDee-helper
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Công cụ 1-Click tự động cấu hình và mở trực tiếp ứng dụng ChatGPT trên Windows (hỗ trợ mô hình <strong>gpt-6.1-sol</strong>).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="/downloads/KhoDee-helper.zip"
                    download="KhoDee-helper.zip"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-semibold transition shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Tải KhoDee-helper.zip (59 KB)</span>
                  </a>

                  <a
                    href="https://openai.com/chatgpt/download/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-2 text-xs font-medium transition"
                  >
                    <span>Tải App ChatGPT</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* 4 Full-Width Visual Steps with Click-to-Enlarge */}
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">1</span>
                      <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Bước 1: Mở công cụ KhoDee-helper.exe</h5>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Bấm vào ảnh để xem kích thước đầy đủ</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                    Tải về và giải nén file <code className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">KhoDee-helper.zip</code>, sau đó chạy file <code className="font-semibold text-slate-900 dark:text-white font-mono">KhoDee-helper.exe</code> (không cần cài đặt).
                  </p>
                  <div
                    onClick={() => setLightboxImage({ src: "/images/guides/codex/step-1-open.png", title: "Bước 1: Mở công cụ KhoDee-helper.exe" })}
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/codex/step-1-open.png"
                      alt="Bước 1: Mở công cụ KhoDee-helper"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs">
                      <ZoomIn className="h-4 w-4" />
                      <span>Xem ảnh phóng to đầy đủ (1720 x 980)</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">2</span>
                      <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Bước 2: Dán mã API Key &amp; Kiểm tra số dư Quota</h5>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Bấm vào ảnh để xem kích thước đầy đủ</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                    Dán mã API Key của bạn vào ô nhập. Tool sẽ tự động kết nối máy chủ xác thực mã token và hiển thị số dư Quota khả dụng trực tiếp.
                  </p>
                  <div
                    onClick={() => setLightboxImage({ src: "/images/guides/codex/step-2-key.png", title: "Bước 2: Dán mã API Key & Kiểm tra số dư Quota" })}
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/codex/step-2-key.png"
                      alt="Bước 2: Dán mã API Key và kiểm tra tự động"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs">
                      <ZoomIn className="h-4 w-4" />
                      <span>Xem ảnh phóng to đầy đủ (1720 x 980)</span>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">3</span>
                      <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Bước 3: Nhấn nút &quot;Kích hoạt Codex&quot;</h5>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Bấm vào ảnh để xem kích thước đầy đủ</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                    Bấm nút <strong>&quot;Kích hoạt Codex&quot;</strong>. Công cụ sẽ tự động nạp cấu hình hệ thống chuẩn xác 100% cho ứng dụng ChatGPT trên Windows chỉ trong 1 giây.
                  </p>
                  <div
                    onClick={() => setLightboxImage({ src: "/images/guides/codex/step-3-activate.png", title: "Bước 3: Nhấn nút Kích hoạt Codex" })}
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/codex/step-3-activate.png"
                      alt="Bước 3: Bấm nút Kích hoạt Codex"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs">
                      <ZoomIn className="h-4 w-4" />
                      <span>Xem ảnh phóng to đầy đủ (1720 x 980)</span>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 sm:p-6 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold">4</span>
                      <h5 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Bước 4: Bấm &quot;Mở ứng dụng ChatGPT&quot; &amp; Bắt đầu sử dụng</h5>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Bấm vào ảnh để xem kích thước đầy đủ</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                    Nhấn nút <strong>&quot;Mở ứng dụng ChatGPT&quot;</strong> để mở ngay ứng dụng ChatGPT Desktop và bắt đầu lập trình với mô hình AI đỉnh cao <code className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">gpt-6.1-sol</code>.
                  </p>
                  <div
                    onClick={() => setLightboxImage({ src: "/images/guides/codex/step-4-chatgpt.png", title: "Bước 4: Mở ứng dụng ChatGPT & Bắt đầu sử dụng" })}
                    className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md"
                  >
                    <img
                      src="/images/guides/codex/step-4-chatgpt.png"
                      alt="Bước 4: Mở ứng dụng ChatGPT và code ngay"
                      className="w-full h-auto object-contain transition duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs">
                      <ZoomIn className="h-4 w-4" />
                      <span>Xem ảnh phóng to đầy đủ (1720 x 980)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CURSOR AI */}
          {/* ======================================================== */}
          {activeTab === "cursor" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Cấu hình Codex API trong Cursor AI
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Sử dụng trực tiếp trên Cursor Composer & Tab Autocomplete qua giao thức OpenAI Compatible tốc độ cao.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold">1</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Mở Settings &gt; Models</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pl-7">
                    Bấm biểu tượng bánh răng ở góc trên bên phải Cursor &gt; chọn mục <strong>Models</strong> trong danh mục bên trái.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold">2</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Điền Base URL & API Key</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pl-7">
                    Tại mục <strong>OpenAI API Key</strong> hoặc <strong>OpenAI Compatible</strong>, bật công tắc và dán 2 thông số sau:
                  </p>

                  <div className="pl-7 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-slate-500 font-medium">Base URL: </span>
                        <code className="text-emerald-700 dark:text-emerald-400 font-bold select-all font-mono">https://modelapi.vn/v1</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy("cdx-url", "https://modelapi.vn/v1")}
                        className="self-start sm:self-auto px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition"
                      >
                        {copiedKey === "cdx-url" ? "Đã chép" : "Sao chép"}
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="truncate">
                        <span className="text-slate-500 font-medium">API Key: </span>
                        <code className="text-slate-900 dark:text-white font-mono select-all truncate">{currentKey}</code>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy("cdx-key", currentKey)}
                        className="self-start sm:self-auto px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition shrink-0"
                      >
                        {copiedKey === "cdx-key" ? "Đã chép" : "Sao chép"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[11px] font-bold">3</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Chọn Model & Code ngay</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 pl-7 leading-relaxed">
                    Bạn có thể thêm các model AI ưa thích như <code className="font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-1 py-0.5 rounded border">claude-3-5-sonnet-20241022</code>, <code className="font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-950 px-1 py-0.5 rounded border">gpt-4o</code>. Hệ thống trừ quota tự động theo token thực tế.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: VS CODE & CLINE */}
          {/* ======================================================== */}
          {activeTab === "vscode" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Cấu hình cho Cline / Roo Code / Continue trong VS Code
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Kết nối extension lập trình trực tiếp trong VS Code qua chuẩn OpenAI Compatible.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3">
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">1.</span>
                    <span>Mở bảng cài đặt Extension (Cline / Roo Code).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">2.</span>
                    <span>Chọn <strong>API Provider</strong> là <strong>OpenAI Compatible</strong>.</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 font-sans text-[11px] block mb-1">Base URL:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold select-all">https://modelapi.vn/v1</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 font-sans text-[11px] block mb-1">API Key:</span>
                    <span className="text-slate-900 dark:text-white font-bold select-all truncate block">{currentKey}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: TERMINAL & SCRIPT */}
          {/* ======================================================== */}
          {activeTab === "cli" && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Cấu hình Biến Môi Trường (Terminal, Curl, Python)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Thiết lập biến môi trường để chạy script tự động hoặc tích hợp vào backend của bạn.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-300">
                  <span>Lệnh Terminal (Linux / macOS / PowerShell)</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "cli-cmd",
                        `export OPENAI_BASE_URL="https://modelapi.vn/v1"\nexport OPENAI_API_KEY="${currentKey}"`
                      )
                    }
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition text-[11px]"
                  >
                    {copiedKey === "cli-cmd" ? "Đã chép" : "Sao chép lệnh"}
                  </button>
                </div>
                <div className="p-4 space-y-3 text-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500"># Linux / macOS / Git Bash:</span>
                    <p className="mt-1 select-all text-emerald-400">export OPENAI_BASE_URL="https://modelapi.vn/v1"</p>
                    <p className="select-all text-emerald-400">export OPENAI_API_KEY="{currentKey}"</p>
                  </div>
                  <div>
                    <span className="text-slate-500"># Windows PowerShell:</span>
                    <p className="mt-1 select-all text-cyan-400">$env:OPENAI_BASE_URL="https://modelapi.vn/v1"</p>
                    <p className="select-all text-cyan-400">$env:OPENAI_API_KEY="{currentKey}"</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Support Callout */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Nạp thêm hạn mức bất kỳ lúc nào tại trang Nạp Tự Động Codex.</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/codex"
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 transition"
            >
              <span>Nạp thêm Quota</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
            <Link
              href="/developer/usage"
              className="text-slate-900 dark:text-white hover:underline font-semibold flex items-center gap-1 transition"
            >
              <span>Tra cứu Quota & Logs</span>
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
