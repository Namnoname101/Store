"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FastForward,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { ClarifyQuestion, CategoryType } from "@/lib/prompt-master-constants";

interface ClarifyStepProps {
  prompt: string;
  category: CategoryType;
  questions: ClarifyQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function ClarifyStep({
  prompt,
  category,
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onSkip,
  onBack,
  isLoading,
}: ClarifyStepProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customInput, setCustomInput] = useState("");

  const total = questions.length;
  const currentQuestion = questions[currentIndex] || questions[0];
  const isLastQuestion = currentIndex === total - 1;
  const selectedOption = currentQuestion ? answers[currentQuestion.id] || "" : "";

  // Previous question context
  const prevQuestion = currentIndex > 0 ? questions[currentIndex - 1] : null;
  const prevAnswer = prevQuestion ? answers[prevQuestion.id] : null;

  useEffect(() => {
    setCustomInput("");
  }, [currentIndex]);

  if (total === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Không cần thêm câu hỏi làm rõ nào. Bấm nút bên dưới để tạo Master Prompt ngay!
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 shadow-md transition-all"
        >
          {isLoading ? "Đang xử lý..." : "Tạo Master Prompt ngay"}
        </button>
      </div>
    );
  }

  const handleSelectOption = (opt: string) => {
    onAnswerChange(currentQuestion.id, opt);
    setCustomInput("");

    // Auto-advance smoothly after 260ms if not last question
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(total - 1, prev + 1));
      }, 260);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    onAnswerChange(currentQuestion.id, customInput.trim());
    if (isLastQuestion) {
      onSubmit();
    } else {
      setCurrentIndex((prev) => Math.min(total - 1, prev + 1));
      setCustomInput("");
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      onSubmit();
    } else {
      setCurrentIndex((prev) => Math.min(total - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Step Header with progress */}
      <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Làm Rõ Ngữ Cảnh
              </h3>
              <p className="text-xs text-slate-400">
                Câu hỏi {currentIndex + 1} / {total} — Chỉ hỏi thêm để đảm bảo AI sinh prompt chuẩn xác nhất
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            {progressPercent}% Hoàn thành
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Step-by-step Pill Track */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {questions.map((q, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const hasAnswer = Boolean(answers[q.id]);

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isCurrent
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-400/50 scale-105"
                    : isCompleted || hasAnswer
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {isCompleted || hasAnswer ? (
                  <Check className="h-3 w-3 stroke-[3]" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-slate-700 text-[9px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                )}
                <span>
                  Bước {idx + 1}
                  {answers[q.id] ? `: ${answers[q.id]}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Initial prompt summary chip */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 p-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">Ý tưởng:</span>
        <span className="truncate italic">"{prompt}"</span>
      </div>

      {/* Context badge from previous question */}
      {prevQuestion && prevAnswer && (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <span className="text-slate-500 dark:text-slate-400">Đã chọn ở câu trước:</span>
          <span className="font-semibold text-blue-600 dark:text-blue-200 truncate">
            {prevAnswer}
          </span>
        </div>
      )}

      {/* Question Details with smooth step transition */}
      <div key={`question-${currentIndex}`} className="animate-fade-slide-in space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-500">
            Bước {currentIndex + 1} trên {total}:
          </span>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
            {currentQuestion.question}
          </h4>
        </div>

        {/* Option cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 font-medium ring-2 ring-blue-500 shadow-md shadow-blue-500/15 scale-[1.01]"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-xs"
                }`}
              >
                <span className="pr-3 leading-relaxed">{opt}</span>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500 text-white shadow-sm"
                      : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3] animate-checkmark-pop" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom user answer input */}
        <form onSubmit={handleCustomSubmit} className="pt-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Hoặc tự nhập câu trả lời khác theo ý bạn..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {customInput.trim() && (
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all shrink-0"
              >
                Lưu
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div>
          {currentIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Câu trước</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sửa lại ý tưởng</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 transition-all duration-150"
          >
            <FastForward className="h-3.5 w-3.5" />
            <span>Bỏ qua & Tạo ngay</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-5 py-2.5 text-xs font-semibold shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-150"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : isLastQuestion ? (
              <>
                <span>Tạo Master Prompt</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                <span>Tiếp tục</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
