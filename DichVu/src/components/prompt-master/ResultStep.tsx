"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  Terminal,
  CheckCircle2,
} from "lucide-react";

import { CategoryType, TARGET_AI_OPTIONS, TargetAiType } from "@/lib/prompt-master-constants";

interface ResultStepProps {
  prompt: string;
  category?: CategoryType;
  targetAi?: TargetAiType;
  masterPrompt: string;
  isStreaming: boolean;
  onReset: () => void;
}

export default function ResultStep({
  prompt,
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
      setTimeout(() => setCopied(false), 2000);
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
    <div className="space-y-5">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Master Prompt Hoàn Chỉnh
            </h3>
            <p className="text-xs text-zinc-400 font-mono">
              {isStreaming ? "rendering output..." : "sẵn sàng copy & dán"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!masterPrompt || isStreaming}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-150 ${
              copied
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xs"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Đã sao chép!</span>
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
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 disabled:opacity-50 transition-all duration-150"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isCoding ? "Tải .cursorrules" : "Tải .md"}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-150"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Ready-to-use badge - Minimalist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-600 dark:text-zinc-300">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          <span>
            Đã tối ưu cấu trúc cho <strong>{targetAiObj?.name || "Mọi AI"}</strong>. Sao chép và dán trực tiếp vào dự án.
          </span>
        </div>
        {targetAiObj?.badge && (
          <span className="self-start sm:self-center shrink-0 px-2 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono font-medium text-zinc-700 dark:text-zinc-300">
            {targetAiObj.badge}
          </span>
        )}
      </div>

      {/* Result box - Clean terminal */}
      <div className="relative rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-inner font-mono text-xs sm:text-sm text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-zinc-800">
        {masterPrompt}
        {isStreaming && (
          <span className="inline-block h-4 w-1.5 bg-zinc-400 animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}
