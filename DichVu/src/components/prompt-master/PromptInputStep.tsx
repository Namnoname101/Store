"use client";

import React, { useState } from "react";
import {
  Code2,
  PenTool,
  Megaphone,
  Sparkles,
  Compass,
  ArrowRight,
  ArrowLeft,
  Lightbulb,
  Loader2,
  FileCode2,
  MessageSquareText,
  BookmarkCheck,
  CheckCircle2,
  Check,
} from "lucide-react";
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
    category: "marketing",
    label: "Copywriting AIDA",
    text: "viết kịch bản video ngắn bán khóa học tiếng anh ứng dụng cho người đi làm",
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
  formatType = "standard",
  targetAi = "all",
  onPromptChange,
  onCategoryChange,
  onFormatTypeChange,
  onTargetAiChange,
  onSubmit,
  isLoading,
}: PromptInputStepProps) {
  const [subStep, setSubStep] = useState<1 | 2 | 3>(1);

  const isTooShort = prompt.trim().length > 0 && prompt.trim().length < 3;
  const isTooLong = prompt.length > 1000;
  const canSubmit = prompt.trim().length >= 3 && !isTooLong && !isLoading;

  const currentCategoryObj = PROMPT_CATEGORIES.find((c) => c.id === category);
  const currentTargetAiObj = TARGET_AI_OPTIONS.find((a) => a.id === targetAi);

  const handleCategorySelect = (catId: CategoryType) => {
    onCategoryChange(catId);
    setTimeout(() => {
      setSubStep(2);
    }, 220);
  };

  const handleTargetAiSelect = (aiId: TargetAiType) => {
    if (onTargetAiChange) {
      onTargetAiChange(aiId);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* SUB-STEP 1: CHỌN LĨNH VỰC                                    */}
      {/* ============================================================== */}
      <div className={subStep === 1 ? "block animate-fade-slide-in space-y-4" : "hidden"}>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
              Bước 1 trên 3
            </span>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              Chọn lĩnh vực bạn muốn tối ưu
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Hệ thống áp dụng chính xác các framework chuẩn quốc tế tương ứng
            </p>
          </div>
          {currentCategoryObj?.repoReference && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono">
              <BookmarkCheck className="h-3.5 w-3.5" />
              <span>Chuẩn: {currentCategoryObj.repoReference}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROMPT_CATEGORIES.map((cat) => {
            const Icon = ICONS_MAP[cat.iconName] || Sparkles;
            const isSelected = category === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                  isSelected
                    ? "border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs ring-1 ring-zinc-900 dark:ring-zinc-100"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold block">{cat.name}</span>
                  </div>
                  {cat.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {cat.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                  {cat.shortDesc}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setSubStep(2)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xs transition-all"
          >
            <span>Tiếp tục: Chọn AI đích</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-STEP 2: BẠN ĐỊNH DÙNG PROMPT TRÊN AI NÀO?                */}
      {/* ============================================================== */}
      <div className={subStep === 2 ? "block animate-fade-slide-in space-y-4" : "hidden"}>
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setSubStep(1)}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium transition-colors mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại bước 1: {currentCategoryObj?.name.split("&")[0].trim()}</span>
            </button>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Bước 2 trên 3: Bạn định dùng prompt trên AI nào?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Định dạng tối ưu 100% cú pháp và thế mạnh riêng của từng model
            </p>
          </div>
          <span className="hidden sm:inline-block text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
            Model mới nhất
          </span>
        </div>

        {/* Spacious 3-column AI grid — No ugly truncated text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TARGET_AI_OPTIONS.map((ai) => {
            const isSelected = targetAi === ai.id;
            return (
              <button
                key={ai.id}
                type="button"
                onClick={() => handleTargetAiSelect(ai.id)}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                  isSelected
                    ? "border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs ring-1 ring-zinc-900 dark:ring-zinc-100"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-bold">{ai.name}</span>
                  {ai.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {ai.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                  {ai.syntaxDesc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Output Format Toggle - Clean Segmented Control */}
        {onFormatTypeChange && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                Định dạng xuất bản
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Chọn cấu trúc đầu ra phù hợp với công cụ của bạn
              </span>
            </div>

            <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800/80 p-1 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => onFormatTypeChange("standard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  formatType === "standard"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <MessageSquareText className="h-3.5 w-3.5" />
                <span>Prompt Chatbot</span>
              </button>

              <button
                type="button"
                onClick={() => onFormatTypeChange("system_rule")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  formatType === "system_rule"
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                <FileCode2 className="h-3.5 w-3.5" />
                <span>File .cursorrules</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setSubStep(1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại Bước 1</span>
          </button>

          <button
            type="button"
            onClick={() => setSubStep(3)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xs transition-all"
          >
            <span>Tiếp tục: Nhập ý tưởng</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-STEP 3: NHẬP CÂU PROMPT BAN ĐẦU                         */}
      {/* ============================================================== */}
      <div className={subStep === 3 ? "block animate-fade-slide-in space-y-4" : "hidden"}>
        <div className="space-y-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <button
              type="button"
              onClick={() => setSubStep(2)}
              className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-medium transition-colors mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại bước 2: {currentTargetAiObj?.name}</span>
            </button>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Bước 3 trên 3: Nhập câu prompt ban đầu của bạn
            </h3>
          </div>

          {/* Active Configuration Summary Badges */}
          <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs">
            <span className="text-zinc-500 font-mono text-[11px] ml-1">config:</span>
            <button
              type="button"
              onClick={() => setSubStep(1)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 font-medium transition-all"
            >
              <CheckCircle2 className="h-3 w-3 text-zinc-500" />
              <span>{currentCategoryObj?.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setSubStep(2)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 font-medium transition-all"
            >
              <CheckCircle2 className="h-3 w-3 text-zinc-500" />
              <span>
                {currentTargetAiObj?.name} ({currentTargetAiObj?.badge})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubStep(2)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 font-medium transition-all"
            >
              <CheckCircle2 className="h-3 w-3 text-zinc-500" />
              <span>{formatType === "system_rule" ? ".cursorrules" : "Chatbot"}</span>
            </button>
          </div>
        </div>

        {/* Input textarea */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="prompt-input"
              className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              Mô tả yêu cầu hoặc ý tưởng thô
            </label>
            <span
              className={`text-xs font-mono ${
                isTooLong ? "text-red-500 font-bold" : "text-zinc-400"
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
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-all shadow-xs resize-none"
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
          <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-mono text-[11px]">
            <Lightbulb className="h-3.5 w-3.5 text-zinc-500" />
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
              className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-all duration-150"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Navigation & Submit Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSubStep(2)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Đổi AI / Lĩnh vực</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 py-3.5 px-6 text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xs active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
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
    </div>
  );
}
