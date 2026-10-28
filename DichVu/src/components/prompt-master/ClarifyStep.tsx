"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
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

  useEffect(() => {
    setCustomInput("");
  }, [currentIndex]);

  if (total === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Không cần thêm câu hỏi làm rõ nào. Bấm nút bên dưới để tạo Master Prompt ngay!
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-5 py-2.5 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
        >
          {isLoading ? "Đang xử lý..." : "Tạo Master Prompt ngay"}
        </button>
      </div>
    );
  }

  const handleSelectOption = (opt: string) => {
    onAnswerChange(currentQuestion.id, opt);
    setCustomInput("");

    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(total - 1, prev + 1));
      }, 200);
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
    <div className="space-y-6 animate-fade-slide-in">
      {/* Header & Clean Progress Track */}
      <div className="space-y-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Làm rõ bài toán ({currentIndex + 1} / {total})
          </span>
          <span className="font-mono text-zinc-400">
            {progressPercent}%
          </span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Initial Prompt Reference */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate italic">
          "{prompt}"
        </p>
      </div>

      {/* Current Question */}
      <div key={`q-${currentIndex}`} className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
          {currentQuestion.question}
        </h3>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedOption === opt;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(opt)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all duration-150 active:scale-[0.99] ${
                  isSelected
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span className="pr-3 leading-relaxed">{opt}</span>
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                  }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Answer Input */}
        <form onSubmit={handleCustomSubmit} className="pt-1">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Hoặc tự nhập phương án khác của bạn..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
            />
            {customInput.trim() && (
              <button
                type="submit"
                className="rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shrink-0"
              >
                Lưu
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          {currentIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Câu trước</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Sửa ý tưởng</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors px-2 py-1"
          >
            Bỏ qua & Tạo ngay
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-5 py-2.5 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
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