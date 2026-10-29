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
  ArrowRight,
  ShieldCheck,
  Info,
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
  const [activeTab, setActiveTab] = useState<"cursor" | "vscode" | "cli">("cursor");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentKey = customKey.trim() || apiKey || "sk-modelapi-demo-key-8888";
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
      id: "cursor" as const,
      name: "Cursor IDE",
      badge: "Khuyên dùng",
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
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Hướng dẫn cấu hình theo công cụ:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://app.notion.com/p/H-NG-D-N-S-D-NG-CODEX-7941eac1481a823c8df601f79c282029?source=copy_link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Tài liệu Notion gốc đối tác</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-4">
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
                    ? "border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-2xs"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold truncate">{tab.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        isActive
                          ? "bg-blue-200/80 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200"
                          : "bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {tab.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

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
                    <span>https://modelapi.vn/v1</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("base-url", "https://modelapi.vn/v1")}
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
                  Điền Base URL: <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-blue-600 dark:text-blue-400">https://modelapi.vn/v1</code>
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
                      `export OPENAI_BASE_URL="https://modelapi.vn/v1"\nexport OPENAI_API_KEY="${currentKey}"`
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
                <p>export OPENAI_BASE_URL="https://modelapi.vn/v1"</p>
                <p>export OPENAI_API_KEY="{currentKey}"</p>
                <p className="mt-2 text-slate-400"># Windows PowerShell</p>
                <p>$env:OPENAI_BASE_URL="https://modelapi.vn/v1"</p>
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
              để kiểm tra số dư quota còn lại và nạp thêm hạn mức thẳng vào key đang dùng 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
