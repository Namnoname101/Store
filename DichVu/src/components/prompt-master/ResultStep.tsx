"use client";

import React, { useState } from "react";
import { Copy, Check, Download, RotateCcw, ExternalLink } from "lucide-react";
import { CategoryType, TARGET_AI_OPTIONS, TargetAiType } from "@/lib/prompt-master-constants";

interface ResultStepProps {
  prompt: string;
  category?: CategoryType;
  targetAi?: TargetAiType;
  masterPrompt: string;
  isStreaming: boolean;
  onReset: () => void;
}

const CHATBOT_SHORTCUTS = [
  { name: "ChatGPT", url: "https://chatgpt.com" },
  { name: "Claude", url: "https://claude.ai" },
  { name: "DeepSeek", url: "https://chat.deepseek.com" },
  { name: "Gemini", url: "https://gemini.google.com" },
];

export default function ResultStep({
  category,
  targetAi = "all",
  masterPrompt,
  isStreaming,
  onReset,
}: ResultStepProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(masterPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isCoding = category === "coding";
  const targetAiObj = TARGET_AI_OPTIONS.find((a) => a.id === targetAi);

  const handleDownload = () => {
    const blob = new Blob([masterPrompt], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = isCoding ? ".cursorrules" : `master-prompt-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fade-slide-in">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Master Prompt Hoàn Chỉnh
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            {isStreaming ? "đang tạo nội dung..." : "sẵn sàng copy & dán vào AI"}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!masterPrompt || isStreaming}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Đã sao chép</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép 1-Click</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!masterPrompt || isStreaming}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isCoding ? "Tải .cursorrules" : "Tải .md"}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Làm câu mới"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Usage Guide Callout */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3 text-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-zinc-600 dark:text-zinc-300 font-medium">
            {copied ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Đã sao chép vào bộ nhớ tạm! Giờ hãy dán vào con AI bạn muốn dùng:
              </span>
            ) : (
              <span>
                👉 Bấm <strong>Sao chép 1-Click</strong> rồi dán trực tiếp vào ô chat của các con AI bên dưới:
              </span>
            )}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {CHATBOT_SHORTCUTS.map((bot) => (
              <a
                key={bot.name}
                href={bot.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <span>{bot.name}</span>
                <ExternalLink className="h-2.5 w-2.5 text-zinc-400" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Target Info Tag */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
        <span>
          Định dạng: <strong>{targetAiObj?.name || "Đa năng"}</strong>
        </span>
        {targetAiObj?.badge && (
          <span className="font-mono text-[11px] text-zinc-400">
            [{targetAiObj.badge}]
          </span>
        )}
      </div>

      {/* Result Display Box */}
      <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 font-mono text-xs sm:text-sm text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-zinc-800">
        {masterPrompt}
        {isStreaming && (
          <span className="inline-block h-4 w-1.5 bg-zinc-400 animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}