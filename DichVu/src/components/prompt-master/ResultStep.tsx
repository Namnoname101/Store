"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  Terminal,
  FileText,
} from "lucide-react";

import { CategoryType } from "@/lib/prompt-master-constants";

interface ResultStepProps {
  prompt: string;
  category?: CategoryType;
  masterPrompt: string;
  isStreaming: boolean;
  onReset: () => void;
}

export default function ResultStep({
  prompt,
  category,
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
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Master Prompt Hoàn Chỉnh
            </h3>
            <p className="text-xs text-slate-400">
              {isStreaming ? "AI đang gõ từng dòng..." : "Đã sẵn sàng để sao chép & sử dụng"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!masterPrompt || isStreaming}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              copied
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
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
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isCoding ? "Tải .cursorrules" : "Tải .md"}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* Result box */}
      <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-inner font-mono text-xs sm:text-sm text-slate-200 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-blue-500/30">
        {masterPrompt}
        {isStreaming && (
          <span className="inline-block h-4 w-1.5 bg-blue-500 animate-pulse ml-0.5 align-middle" />
        )}
      </div>
    </div>
  );
}
