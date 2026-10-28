"use client";

import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  CategoryType,
  OutputFormatType,
  PROMPT_CATEGORIES,
  TARGET_AI_OPTIONS,
  TargetAiType,
} from "@/lib/prompt-master-constants";

interface PromptInputStepProps {
  prompt: string;
  category: CategoryType;
  formatType?: OutputFormatType;
  targetAi?: TargetAiType;
  onPromptChange: (value: string) => void;
  onCategoryChange: (value: CategoryType) => void;
  onFormatTypeChange?: (value: OutputFormatType) => void;
  onTargetAiChange?: (value: TargetAiType) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS = [
  {
    category: "coding" as CategoryType,
    label: "Bot cào dữ liệu Shopee",
    text: "viết bot cào dữ liệu sản phẩm shopee bằng python có proxy xoay vòng và xuất file excel",
  },
  {
    category: "coding" as CategoryType,
    label: "Auth JWT Next.js 14",
    text: "xây dựng api xác thực đăng nhập jwt và refresh token cho nextjs 14 app router",
  },
  {
    category: "content" as CategoryType,
    label: "Bài viết SEO E-E-A-T",
    text: "viết bài chuẩn seo chuyên sâu phân tích xu hướng ai agent trong lập trình năm 2026",
  },
  {
    category: "marketing" as CategoryType,
    label: "Kịch bản TikTok Viral",
    text: "viết kịch bản video ngắn 60 giây bán khóa học tiếng anh ứng dụng cho người đi làm theo công thức AIDA",
  },
  {
    category: "image" as CategoryType,
    label: "Chân dung Cyberpunk 8K",
    text: "chân dung cyberpunk chiến binh nữ samurai dưới mưa ánh sáng neon tokyo 8k lens 85mm f1.4",
  },
];

export default function PromptInputStep({
  prompt,
  category = "auto",
  formatType = "standard",
  targetAi = "all",
  onPromptChange,
  onCategoryChange,
  onFormatTypeChange,
  onTargetAiChange,
  onSubmit,
  isLoading,
}: PromptInputStepProps) {
  const isTooShort = prompt.trim().length > 0 && prompt.trim().length < 3;
  const isTooLong = prompt.length > 1000;
  const canSubmit = prompt.trim().length >= 3 && !isTooLong && !isLoading;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSelectExample = (ex: (typeof EXAMPLE_PROMPTS)[0]) => {
    onCategoryChange(ex.category);
    onPromptChange(ex.text);
    if (onFormatTypeChange) {
      onFormatTypeChange(ex.category === "coding" ? "system_rule" : "standard");
    }
  };

  return (
    <div className="space-y-5 animate-fade-slide-in">
      {/* Main Single-Box Container */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Textarea Header */}
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="prompt-input"
            className="font-medium text-zinc-700 dark:text-zinc-300"
          >
            Nhập ý tưởng hoặc yêu cầu của bạn
          </label>
          <span
            className={`font-mono text-[11px] ${
              isTooLong ? "text-red-500 font-semibold" : "text-zinc-400"
            }`}
          >
            {prompt.length} / 1000
          </span>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="prompt-input"
            rows={4}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ví dụ: Viết bot Telegram bán hàng tự động bằng Python có quét VietQR và cấp key, hoặc Viết bài chuẩn SEO phân tích AI..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 p-3.5 sm:p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-600 focus:bg-white dark:focus:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 transition-all resize-none leading-relaxed"
          />
        </div>

        {isTooShort && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Vui lòng nhập tối thiểu 3 ký tự để bắt đầu.
          </p>
        )}
        {isTooLong && (
          <p className="text-xs text-red-500">
            Câu prompt vượt quá 1000 ký tự. Vui lòng rút gọn nội dung.
          </p>
        )}

        {/* Inline Controls Toolbar: Clean, No-friction */}
        <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Select */}
            <div className="relative inline-block text-xs">
              <select
                aria-label="Chọn lĩnh vực"
                value={category}
                onChange={(e) => onCategoryChange(e.target.value as CategoryType)}
                className="appearance-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium py-1.5 pl-3 pr-7 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer text-xs transition-colors"
              >
                {PROMPT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400 text-[10px]">
                ▼
              </div>
            </div>

            {/* Target AI Select */}
            {onTargetAiChange && (
              <div className="relative inline-block text-xs">
                <select
                  aria-label="Chọn AI đích"
                  value={targetAi}
                  onChange={(e) => onTargetAiChange(e.target.value as TargetAiType)}
                  className="appearance-none bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium py-1.5 pl-3 pr-7 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer text-xs transition-colors"
                >
                  {TARGET_AI_OPTIONS.map((ai) => (
                    <option key={ai.id} value={ai.id}>
                      {ai.name} {ai.badge ? `(${ai.badge})` : ""}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400 text-[10px]">
                  ▼
                </div>
              </div>
            )}

            {/* Format toggle (only shown when relevant) */}
            {(category === "coding" || targetAi === "cursor") && onFormatTypeChange && (
              <button
                type="button"
                onClick={() =>
                  onFormatTypeChange(formatType === "standard" ? "system_rule" : "standard")
                }
                className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Định dạng: {formatType === "system_rule" ? ".cursorrules" : "Chatbot"}
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang phân tích...</span>
              </>
            ) : (
              <>
                <span>Nâng cấp Prompt</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick Starter Chips: Flat, elegant, no icon clutter */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        <span className="text-zinc-400 font-medium text-[11px] mr-1">
          Gợi ý thử nhanh:
        </span>
        {EXAMPLE_PROMPTS.map((ex, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelectExample(ex)}
            className="rounded-lg bg-zinc-100 dark:bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}