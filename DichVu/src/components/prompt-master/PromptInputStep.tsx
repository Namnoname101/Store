"use client";

import React from "react";
import {
  Code2,
  PenTool,
  Megaphone,
  Sparkles,
  Compass,
  ArrowRight,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { CategoryType, PROMPT_CATEGORIES } from "@/lib/prompt-master-constants";

interface PromptInputStepProps {
  prompt: string;
  category: CategoryType;
  onPromptChange: (value: string) => void;
  onCategoryChange: (value: CategoryType) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const EXAMPLE_PROMPTS: { category: CategoryType; label: string; text: string }[] = [
  {
    category: "coding",
    label: "Bot cào dữ liệu",
    text: "viết bot cào dữ liệu sản phẩm shopee bằng python có proxy và xuất excel",
  },
  {
    category: "coding",
    label: "Auth JWT Next.js",
    text: "xây dựng api xác thực đăng nhập jwt và refresh token cho nextjs 14 app router",
  },
  {
    category: "content",
    label: "Bài viết SEO",
    text: "viết bài chuẩn seo phân tích xu hướng ai agent trong lập trình năm 2026",
  },
  {
    category: "image",
    label: "Midjourney Cinematic",
    text: "chân dung cyberpunk chiến binh nữ samurai dưới mưa ánh sáng neon tokyo 8k",
  },
];

const ICONS_MAP: Record<string, React.ElementType> = {
  Code2,
  PenTool,
  Megaphone,
  Sparkles,
  Compass,
};

export default function PromptInputStep({
  prompt,
  category,
  onPromptChange,
  onCategoryChange,
  onSubmit,
  isLoading,
}: PromptInputStepProps) {
  const isTooShort = prompt.trim().length > 0 && prompt.trim().length < 3;
  const isTooLong = prompt.length > 1000;
  const canSubmit = prompt.trim().length >= 3 && !isTooLong && !isLoading;

  return (
    <div className="space-y-6">
      {/* Category selector */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          1. Chọn lĩnh vực bạn muốn tối ưu
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PROMPT_CATEGORIES.map((cat) => {
            const Icon = ICONS_MAP[cat.iconName] || Sparkles;
            const isSelected = category === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onCategoryChange(cat.id)}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Icon className={`h-4 w-4 ${isSelected ? "text-blue-500" : "text-slate-400"}`} />
                  {cat.badge && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {cat.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold block">{cat.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {cat.shortDesc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input textarea */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="prompt-input"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
          >
            2. Nhập câu prompt ban đầu của bạn
          </label>
          <span
            className={`text-xs ${
              isTooLong ? "text-red-500 font-bold" : "text-slate-400"
            }`}
          >
            {prompt.length}/1000 ký tự
          </span>
        </div>

        <div className="relative">
          <textarea
            id="prompt-input"
            rows={4}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Ví dụ: viết bot cào dữ liệu shopee bằng python có proxy, hoặc viết bài seo..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm resize-none"
          />
        </div>

        {isTooShort && (
          <p className="mt-1.5 text-xs text-amber-500">
            Vui lòng nhập tối thiểu 3 ký tự để AI có đủ dữ liệu phân tích.
          </p>
        )}
        {isTooLong && (
          <p className="mt-1.5 text-xs text-red-500">
            Câu prompt vượt quá 1000 ký tự. Vui lòng rút gọn nội dung.
          </p>
        )}
      </div>

      {/* Quick sample chips */}
      <div className="flex items-center flex-wrap gap-2 pt-1">
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
          <span>Gợi ý mẫu:</span>
        </span>
        {EXAMPLE_PROMPTS.map((ex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              onCategoryChange(ex.category);
              onPromptChange(ex.text);
            }}
            className="rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 py-3.5 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang phân tích ý tưởng...</span>
            </>
          ) : (
            <>
              <span>Phân tích & Tối ưu</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
