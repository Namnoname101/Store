"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Laptop,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Zap,
  CheckCircle2,
  BookOpen,
  Layers,
  Download,
  ArrowRight,
  Info,
  Play,
  MonitorCheck,
  Sparkles,
  Code,
  FileCode,
} from "lucide-react";
import { AI_FRONTIER_MODELS } from "@/lib/constants/ai-models";

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
  const [cliEnvTab, setCliEnvTab] = useState<"curl" | "python" | "node" | "env" | "shell">("curl");
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
      name: "Codex & ChatGPT App",
      badge: "DaiTruong 1-Click",
      icon: Zap,
    },
    {
      id: "cursor" as const,
      name: "Cursor IDE",
      badge: "Composer",
      icon: Laptop,
    },
    {
      id: "vscode" as const,
      name: "VS Code",
      badge: "Cline / Roo",
      icon: Layers,
    },
    {
      id: "cli" as const,
      name: "Terminal & Script",
      badge: "Env / Python",
      icon: Terminal,
    },
  ];

  return (
    <div className="w-full space-y-3">
      {/* Sleek Preview / Key Sync Bar */}
      {showKeyInput && (
        <div className="rounded-xl border border-border bg-card px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs text-card-foreground">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-muted-foreground">
              {isRealKey ? (
                <>
                  <strong className="text-emerald-600 dark:text-emerald-400">Đã áp dụng Key của bạn:</strong> Cấu hình bên dưới đã chèn key thật.
                </>
              ) : (
                <>
                  <strong className="text-foreground">Xem trước cấu hình:</strong> Key thật sẽ tự động bàn giao ngay sau khi thanh toán.
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="Dán key nếu đã có..."
              className="w-44 sm:w-52 min-h-[44px] rounded-xl border border-input bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => handleCopy("main-key", currentKey)}
              className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted/50 hover:bg-muted text-foreground px-3.5 py-2 text-xs font-semibold transition active:scale-95"
            >
              {copiedKey === "main-key" ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Guide Card */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4 text-card-foreground">
        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              Chọn công cụ muốn kết nối:
            </span>
          </div>

          <Link
            href="/huong-dan/codex"
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cẩm nang chi tiết</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>

        {/* Crisp Tab Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? "border-emerald-600 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 shadow-2xs ring-1 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                    isActive
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate leading-tight">{tab.name}</div>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded font-semibold inline-block truncate mt-0.5 ${
                      isActive
                        ? "bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200"
                        : "bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab 1: App Codex qua DaiTruong-helper */}
        {activeTab === "helper" && (
          <div className="space-y-4 pt-1">
            {/* Beginner Context Explainer Callout */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-3 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-amber-700 dark:text-amber-300 font-semibold">
                  Nguyên lý hoạt động cho người mới:
                </strong>{" "}
                Máy tính cần cài phần mềm <strong>OpenAI Codex / ChatGPT Desktop</strong> trước. Tool{" "}
                <strong>DaiTruong-helper</strong> là công cụ độc quyền của DaiTruong Store giúp{" "}
                <em>thay bạn tự động ghi cấu hình Key và Server</em>, giúp mở app lên là dùng ngay mà không cần biết gõ lệnh hay sửa file ẩn!
              </div>
            </div>

            {/* Clear 3-Step Sequential Workflow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* BƯỚC 1: TẢI CHÍNH HÃNG OPENAI */}
              <div className="rounded-xl border border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/20 p-3.5 flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md">
                      Bước 1: Tải phần mềm
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">OpenAI Chính Hãng</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MonitorCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Cài Đặt ChatGPT / Codex</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Nếu máy bạn chưa có app, hãy tải bản chính thức từ website OpenAI:
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <a
                    href="https://openai.com/chatgpt/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 text-xs font-bold transition shadow-xs active:scale-95 text-center"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Tải từ OpenAI (Chính thức)</span>
                  </a>
                  <p className="text-[10px] text-muted-foreground text-center">
                    (Hoặc CLI: <code className="font-mono text-foreground font-semibold">npm i -g @openai/codex</code>)
                  </p>
                </div>
              </div>

              {/* BƯỚC 2: CẤU HÌNH TỰ ĐỘNG VỚI DAITRUONG-HELPER */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      Bước 2: Cấu hình 1-Click
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">DaiTruong Store</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Tải Tool DaiTruong-helper</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Tool tự động nhận diện hệ điều hành và ghi cấu hình Key &amp; Gateway vào máy:
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <a
                    href="/downloads/DaiTruong-helper.zip"
                    download="DaiTruong-helper.zip"
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs active:scale-95 text-center"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải DaiTruong-helper.zip (59 KB)</span>
                  </a>
                  <p className="text-[10px] text-muted-foreground text-center">
                    Giải nén và chạy ngay, không cần cài đặt
                  </p>
                </div>
              </div>

              {/* BƯỚC 3: MỞ LÊN VÀ LẬP TRÌNH NGAY */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-50/60 dark:bg-purple-950/20 p-3.5 flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md">
                      Bước 3: Trải nghiệm
                    </span>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">Không Giới Hạn</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Play className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>Mở App &amp; Dùng Ngay</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Bấm <strong>&quot;Mở ứng dụng&quot;</strong> trên tool hoặc khởi chạy ChatGPT Desktop để lập trình cùng AI:
                  </p>
                </div>

                <div className="pt-1">
                  <div className="rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 px-3 py-2 text-center">
                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      <span>Sẵn sàng code 24/7!</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Screenshot Guide: 3 simple actions inside DaiTruong-helper */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  3 Thao tác thực tế trong Tool DaiTruong-helper:
                </div>
                <span className="text-[10px] text-slate-500 font-medium">Cực kỳ nhanh (dưới 10 giây)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Hành động 1 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                      1
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Mở Tool &amp; Dán Key
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/guides/codex/step-2-key.png"
                      alt="Mở tool và dán mã API Key"
                      className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Mở <code className="font-semibold text-slate-700 dark:text-slate-300">DaiTruong-helper.exe</code>, dán API Key được cấp vào ô duy nhất.
                  </p>
                </div>

                {/* Hành động 2 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                      2
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Bấm Kích Hoạt
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/guides/codex/step-3-activate.png"
                      alt="Bấm nút Kích hoạt Codex"
                      className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Bấm <strong>&quot;Kích hoạt Codex&quot;</strong>, tool tự động tạo file cấu hình chuẩn vào máy tính.
                  </p>
                </div>

                {/* Hành động 3 */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-2.5 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold shrink-0">
                      3
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Mở Lên &amp; Dùng Ngay
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/guides/codex/step-4-chatgpt.png"
                      alt="Mở ứng dụng và bắt đầu dùng"
                      className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Bấm <strong>&quot;Mở ứng dụng&quot;</strong> để khởi động Codex / ChatGPT và tận hưởng lập trình tốc độ cao.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cursor IDE */}
        {activeTab === "cursor" && (
          <div className="space-y-3 pt-1 text-xs">
            <p className="text-muted-foreground">
              Vào Cursor: <strong>Settings &gt; Models &gt; OpenAI API Key</strong> (hoặc OpenAI Compatible) và điền:
            </p>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Base URL:
                </span>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-1 font-mono text-emerald-600 dark:text-emerald-400">
                  <span>https://daitruongstore.fly.dev/v1</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("base-url", "https://daitruongstore.fly.dev/v1")}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                    title="Sao chép Base URL"
                  >
                    {copiedKey === "base-url" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  API Key:
                </span>
                <div className="mt-1 flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-1 font-mono text-foreground truncate">
                  <span className="truncate mr-2">{currentKey}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("cursor-key", currentKey)}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0 transition"
                    title="Sao chép Key"
                  >
                    {copiedKey === "cursor-key" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Model hỗ trợ: <code className="font-mono text-foreground font-semibold">gpt-6-astra</code>, <code className="font-mono text-foreground font-semibold">openai-o3</code>, <code className="font-mono text-foreground font-semibold">o3-mini</code>, <code className="font-mono text-foreground font-semibold">o1-pro</code>, <code className="font-mono text-foreground font-semibold">gpt-4.5</code>, và <code className="font-mono text-foreground font-semibold">claude-sonnet-5-5</code>.
            </p>
          </div>
        )}

        {/* Tab 3: VS Code / Cline */}
        {activeTab === "vscode" && (
          <div className="space-y-3 pt-1 text-xs">
            <p className="text-muted-foreground">
              Dùng cho extension <strong>Cline, Roo Code hoặc Continue.dev</strong>:
            </p>

            <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-muted-foreground">API Provider:</span>
                <span className="font-mono font-semibold text-foreground">OpenAI Compatible</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-border">
                <span className="text-muted-foreground">Base URL:</span>
                <div className="flex items-center gap-1.5 font-mono text-emerald-600 dark:text-emerald-400">
                  <span>https://daitruongstore.fly.dev/v1</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("vscode-url", "https://daitruongstore.fly.dev/v1")}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
                    title="Sao chép URL"
                  >
                    {copiedKey === "vscode-url" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground">API Key:</span>
                <div className="flex items-center gap-1.5 font-mono text-foreground truncate max-w-[220px]">
                  <span className="truncate">{currentKey}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy("vscode-key", currentKey)}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0 transition"
                    title="Sao chép Key"
                  >
                    {copiedKey === "vscode-key" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Terminal & Script (Rich SDK Selector) */}
        {activeTab === "cli" && (
          <div className="space-y-3 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2.5">
              {[
                { id: "curl" as const, label: "cURL" },
                { id: "python" as const, label: "Python (OpenAI SDK)" },
                { id: "node" as const, label: "Node.js (OpenAI SDK)" },
                { id: "env" as const, label: ".env" },
                { id: "shell" as const, label: "Bash / PowerShell" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setCliEnvTab(sub.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition inline-flex items-center justify-center ${
                    cliEnvTab === sub.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <div className="relative rounded-xl border border-border bg-muted/40 p-4 font-mono text-[11px] text-foreground">
              {cliEnvTab === "curl" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "codex-curl",
                        `curl https://daitruongstore.fly.dev/v1/chat/completions \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer ${currentKey}" \\\n  -d '{\n    "model": "gpt-6-astra",\n    "messages": [{"role": "user", "content": "Xin chào GPT-6!"}]\n  }'`
                      )
                    }
                    className="absolute top-2.5 right-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-2xs"
                    title="Sao chép cURL"
                  >
                    {copiedKey === "codex-curl" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <pre className="overflow-x-auto pr-12 text-muted-foreground">{`curl https://daitruongstore.fly.dev/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${currentKey}" \\
  -d '{
    "model": "gpt-6-astra",
    "messages": [{"role": "user", "content": "Xin chào GPT-6!"}]
  }'`}</pre>
                </div>
              )}

              {cliEnvTab === "python" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "codex-python",
                        `from openai import OpenAI\n\nclient = OpenAI(\n    api_key="${currentKey}",\n    base_url="https://daitruongstore.fly.dev/v1"\n)\n\nresponse = client.chat.completions.create(\n    model="gpt-6-astra",\n    messages=[{"role": "user", "content": "Xin chào GPT-6!"}]\n)\nprint(response.choices[0].message.content)`
                      )
                    }
                    className="absolute top-2.5 right-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-2xs"
                    title="Sao chép Python"
                  >
                    {copiedKey === "codex-python" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <pre className="overflow-x-auto pr-12 text-muted-foreground">{`from openai import OpenAI

client = OpenAI(
    api_key="${currentKey}",
    base_url="https://daitruongstore.fly.dev/v1"
)

response = client.chat.completions.create(
    model="gpt-6-astra",
    messages=[{"role": "user", "content": "Xin chào GPT-6!"}]
)
print(response.choices[0].message.content)`}</pre>
                </div>
              )}

              {cliEnvTab === "node" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "codex-node",
                        `import OpenAI from "openai";\n\nconst openai = new OpenAI({\n  apiKey: "${currentKey}",\n  baseURL: "https://daitruongstore.fly.dev/v1",\n});\n\nconst completion = await openai.chat.completions.create({\n  model: "gpt-6-astra",\n  messages: [{ role: "user", content: "Xin chào GPT-6!" }],\n});\n\nconsole.log(completion.choices[0].message.content);`
                      )
                    }
                    className="absolute top-2.5 right-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-2xs"
                    title="Sao chép Node.js"
                  >
                    {copiedKey === "codex-node" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <pre className="overflow-x-auto pr-12 text-muted-foreground">{`import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "${currentKey}",
  baseURL: "https://daitruongstore.fly.dev/v1",
});

const completion = await openai.chat.completions.create({
  model: "gpt-6-astra",
  messages: [{ role: "user", content: "Xin chào GPT-6!" }],
});

console.log(completion.choices[0].message.content);`}</pre>
                </div>
              )}

              {cliEnvTab === "env" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "codex-env",
                        `OPENAI_API_KEY=${currentKey}\nOPENAI_BASE_URL=https://daitruongstore.fly.dev/v1\nOPENAI_DEFAULT_MODEL=gpt-6-astra`
                      )
                    }
                    className="absolute top-2.5 right-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-2xs"
                    title="Sao chép .env"
                  >
                    {copiedKey === "codex-env" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <pre className="overflow-x-auto pr-12 text-muted-foreground">{`OPENAI_API_KEY=${currentKey}
OPENAI_BASE_URL=https://daitruongstore.fly.dev/v1
OPENAI_DEFAULT_MODEL=gpt-6-astra`}</pre>
                </div>
              )}

              {cliEnvTab === "shell" && (
                <div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "codex-shell",
                        `# Linux / macOS / Bash\nexport OPENAI_BASE_URL="https://daitruongstore.fly.dev/v1"\nexport OPENAI_API_KEY="${currentKey}"\n\n# Windows PowerShell\n$env:OPENAI_BASE_URL="https://daitruongstore.fly.dev/v1"\n$env:OPENAI_API_KEY="${currentKey}"`
                      )
                    }
                    className="absolute top-2.5 right-2.5 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition shadow-2xs"
                    title="Sao chép Shell"
                  >
                    {copiedKey === "codex-shell" ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <pre className="overflow-x-auto pr-12 text-muted-foreground">{`# Linux / macOS / Bash
export OPENAI_BASE_URL="https://daitruongstore.fly.dev/v1"
export OPENAI_API_KEY="${currentKey}"

# Windows PowerShell
$env:OPENAI_BASE_URL="https://daitruongstore.fly.dev/v1"
$env:OPENAI_API_KEY="${currentKey}"`}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Persistent Footer: Minimal, 1 line notice */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Hạn mức bảo lưu vĩnh viễn tại DaiTruong Store, trừ theo token thực tế.</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/codex" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Nạp thêm Quota 24/7 &rarr;
            </Link>
            <span>•</span>
            <Link href="/check-usage" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
              Tra cứu Quota &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
