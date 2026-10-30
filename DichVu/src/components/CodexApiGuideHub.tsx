"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Laptop,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Zap,
  CheckCircle2,
  BookOpen,
  Layers,
  Download,
} from "lucide-react";

export interface CodexApiGuideHubProps {
  apiKey?: string;
  showKeyInput?: boolean;
}

export default function CodexApiGuideHub({
  apiKey = "",
  showKeyInput = true,
}: CodexApiGuideHubProps) {
  const [customKey, setCustomKey] = useState<string>(apiKey || "");
  const [activeTab, setActiveTab] = useState<"helper" | "cursor" | "vscode" | "cli">("helper");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentKey = customKey.trim() || apiKey || "sk-cdx-demo-key-8888";
  const isRealKey = Boolean(customKey.trim() || apiKey);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const tabs = [
    {
      id: "helper" as const,
      name: "Ứng Dụng ChatGPT",
      badge: "KhoDee 1-Click (Khuyên dùng)",
      icon: Zap,
      desc: "Kích hoạt tự động & mở app ChatGPT Windows trong 1 Click",
    },
    {
      id: "cursor" as const,
      name: "Cursor IDE",
      badge: "Lập trình",
      icon: Laptop,
      desc: "Dùng trực tiếp trên Cursor Composer & Tab Autocomplete",
    },
    {
      id: "vscode" as const,
      name: "VS Code / Cline",
      badge: "Mở rộng",
      icon: Layers,
      desc: "Tương thích Cline, Roo Code, Continue.dev...",
    },
    {
      id: "cli" as const,
      name: "Claude Code CLI",
      badge: "Terminal",
      icon: Terminal,
      desc: "Lệnh chạy trong dòng lệnh Terminal hoặc script",
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Key Input Bar */}
      {showKeyInput && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    API Key đồng bộ hướng dẫn
                  </span>
                  {isRealKey ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      Key thật đã áp dụng
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      Key mẫu (dán key của bạn vào đây)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Dán key của bạn để toàn bộ cấu hình mẫu bên dưới tự động chèn key thật.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:max-w-md w-full sm:w-auto">
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="sk-..."
                className="w-full sm:w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 shadow-2xs"
              />
              <button
                type="button"
                onClick={() => handleCopy("main-key", currentKey)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-semibold transition shrink-0 active:scale-95 shadow-xs"
              >
                {copiedKey === "main-key" ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
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

      {/* Main Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 sm:p-6 shadow-xs">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Chọn cách cấu hình & kết nối:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/huong-dan/codex"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Cẩm nang Codex AI chi tiết</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 my-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  isActive
                    ? "border-emerald-600 bg-emerald-50/60 dark:border-emerald-500 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate">{tab.name}</span>
                  </div>
                  <div className="mt-0.5">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold inline-block truncate ${
                        isActive
                          ? "bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200"
                          : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                    {tab.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content: Ứng Dụng ChatGPT qua KhoDee-helper */}
        {activeTab === "helper" && (
          <div className="space-y-6 pt-2">
            {/* Download Banner */}
            <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                      <Zap className="h-3 w-3" />
                      Dành Cho Ứng Dụng ChatGPT Windows
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Windows 10 / 11 (64-bit)
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    KhoDee-helper — Kích Hoạt Tự Động Cho App ChatGPT Trong 1 Giây
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                    Công cụ 1-Click độc quyền kết nối trực tiếp API Key Codex vào ứng dụng <strong>ChatGPT Desktop (Windows App)</strong>. Tự động thiết lập cấu hình và mở app ChatGPT với mô hình AI <strong>gpt-6.1-sol</strong> mà không cần gõ lệnh.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <a
                    href="/downloads/KhoDee-helper.zip"
                    download="KhoDee-helper.zip"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all active:scale-95 text-center"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải KhoDee-helper.zip (59 KB)</span>
                  </a>

                  <a
                    href="https://openai.com/chatgpt/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2.5 text-xs font-semibold transition text-center"
                  >
                    <span>Tải App ChatGPT</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* 4 Steps Grid with Images */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bước 1 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">1</span>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Bước 1: Mở công cụ KhoDee-helper.exe</h5>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Tải về và giải nén <code className="font-semibold text-emerald-600 dark:text-emerald-400">KhoDee-helper.zip</code>, chạy file <code className="font-semibold">KhoDee-helper.exe</code> (không cần cài đặt).
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/guides/codex/step-1-open.png"
                    alt="Bước 1: Mở công cụ KhoDee-helper"
                    className="w-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Bước 2 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">2</span>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Bước 2: Dán mã API Key & Kiểm tra</h5>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Dán mã API Key của bạn vào ô. Tool sẽ tự động kết nối máy chủ xác thực token và hiển thị số dư Quota khả dụng.
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/guides/codex/step-2-key.png"
                    alt="Bước 2: Dán mã API Key và kiểm tra tự động"
                    className="w-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Bước 3 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">3</span>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Bước 3: Nhấn nút Kích hoạt Codex</h5>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Bấm nút <strong>&quot;Kích hoạt Codex&quot;</strong>. Công cụ tự động tạo file <code className="font-mono text-[11px]">config.toml</code> và <code className="font-mono text-[11px]">auth.json</code> chuẩn xác 100% cho ứng dụng ChatGPT trong 1 giây.
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/guides/codex/step-3-activate.png"
                    alt="Bước 3: Bấm nút Kích hoạt Codex"
                    className="w-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Bước 4 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[11px] font-bold">4</span>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Bước 4: Bấm &quot;Mở ứng dụng ChatGPT&quot;</h5>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Nhấn nút <strong>&quot;Mở ứng dụng ChatGPT&quot;</strong> để khởi chạy trực tiếp ứng dụng ChatGPT trên Windows và bắt đầu lập trình cùng mô hình AI <code className="font-mono text-[11px]">gpt-6.1-sol</code> đỉnh cao.
                  </p>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/guides/codex/step-4-chatgpt.png"
                    alt="Bước 4: Mở ứng dụng ChatGPT và code ngay"
                    className="w-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Cursor */}
        {activeTab === "cursor" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 p-4 space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  1
                </span>
                <span>Mở cài đặt Models trong Cursor IDE</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                Mở Cursor &gt; bấm biểu tượng bánh răng <strong>Settings</strong> ở góc trên bên phải &gt; chọn mục <strong>Models</strong> trong menu bên trái.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 p-4 space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  2
                </span>
                <span>Cấu hình OpenAI Compatible</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                Kéo xuống phần <strong>OpenAI API Key</strong> hoặc <strong>OpenAI Compatible</strong>, bật công tắc và điền chính xác 2 thông số sau:
              </p>

              <div className="pl-7 space-y-2.5">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Base URL (Bắt buộc):
                  </span>
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-mono text-blue-600 dark:text-blue-400">
                    <span>https://daitruongstore.fly.dev/v1</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("base-url", "https://daitruongstore.fly.dev/v1")}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {copiedKey === "base-url" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    API Key:
                  </span>
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-mono text-emerald-600 dark:text-emerald-400 truncate">
                    <span className="truncate mr-2">{currentKey}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("cursor-key", currentKey)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 shrink-0"
                    >
                      {copiedKey === "cursor-key" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 p-4 space-y-3.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  3
                </span>
                <span>Thêm model và bắt đầu lập trình</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                Tại danh sách Model, bạn có thể chọn hoặc thêm các model AI ưa thích như:
                <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200">claude-3-5-sonnet-20241022</code>,
                <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200">gpt-4o</code>,
                <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-slate-800 dark:text-slate-200">gemini-1.5-pro</code>.
                Hạn mức sẽ tự động trừ theo token thực tế bạn sử dụng.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: VS Code / Cline */}
        {activeTab === "vscode" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cấu hình cho Cline / Roo Code / Continue trong VS Code:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <li>Mở cài đặt extension (Cline hoặc Roo Code).</li>
                <li>Chọn <strong>API Provider</strong> là <strong>OpenAI Compatible</strong>.</li>
                <li>
                  Điền Base URL: <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-blue-600 dark:text-blue-400">https://daitruongstore.fly.dev/v1</code>
                </li>
                <li>Dán API Key của bạn vào mục API Key.</li>
                <li>Điền Model ID tương ứng (ví dụ: <code className="font-mono">claude-3-5-sonnet-20241022</code>).</li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab Content: CLI / Terminal */}
        {activeTab === "cli" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40 p-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cấu hình biến môi trường qua Terminal:
              </h3>
              <div className="rounded-xl bg-slate-950 p-3 text-xs font-mono text-slate-200 relative group">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      "cli-cmd",
                      `export OPENAI_BASE_URL="https://daitruongstore.fly.dev/v1"\nexport OPENAI_API_KEY="${currentKey}"`
                    )
                  }
                  className="absolute top-2 right-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 transition"
                  title="Sao chép lệnh"
                >
                  {copiedKey === "cli-cmd" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <p className="text-slate-400"># Linux / macOS / Git Bash</p>
                <p>export OPENAI_BASE_URL="https://daitruongstore.fly.dev/v1"</p>
                <p>export OPENAI_API_KEY="{currentKey}"</p>
                <p className="mt-2 text-slate-400"># Windows PowerShell</p>
                <p>$env:OPENAI_BASE_URL="https://daitruongstore.fly.dev/v1"</p>
                <p>$env:OPENAI_API_KEY="{currentKey}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Footer: Auto Topup Notice */}
        <div className="mt-5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200">
            <span className="font-semibold">Nạp hạn mức bất kỳ lúc nào:</span>
            <p className="mt-0.5 text-emerald-800 dark:text-emerald-300">
              Bạn có thể vào{" "}
              <Link href="/codex" className="font-bold underline hover:text-emerald-950 dark:hover:text-white">
                Trang nạp tự động Codex
              </Link>{" "}
              hoặc kiểm tra lịch sử request tại{" "}
              <Link href="/developer/usage" className="font-bold underline hover:text-emerald-950 dark:hover:text-white">
                Kiểm tra Quota Codex
              </Link>{" "}
              để theo dõi token thời gian thực 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
