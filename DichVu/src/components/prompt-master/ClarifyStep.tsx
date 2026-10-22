"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FastForward,
  HelpCircle,
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Không cần thêm câu hỏi làm rõ nào. Bấm nút bên dưới để tạo Master Prompt ngay!
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isLoading}
          className="rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-5 py-2.5 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xs transition-all"
        >
          {isLoading ? "Đang xử lý..." : "Tạo Master Prompt ngay"}
        </button>
      </div>
    );
  }

  const handleSelectOption = (opt: string) => {
    onAnswerChange(currentQuestion.id, opt);
    setCustomInput("");

    // Auto-advance smoothly after 220ms if not last question
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(total - 1, prev + 1));
      }, 220);
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
      {/* Step Header with progress */}
      <div className="space-y-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Làm rõ ngữ cảnh
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Câu hỏi {currentIndex + 1} / {total} — Đảm bảo prompt sinh ra bám sát mục tiêu thực tế
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            {progressPercent}% hoàn thành
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
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isCurrent
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs ring-1 ring-zinc-900 dark:ring-zinc-100"
                    : isCompleted || hasAnswer
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {isCompleted || hasAnswer ? (
                  <Check className="h-3 w-3 stroke-[3]" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-[10px] flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                )}
                <span>
                  Câu {idx + 1}
                  {answers[q.id] ? `: ${answers[q.id]}` : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Initial prompt summary chip */}
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">Ý tưởng ban đầu:</span>
        <span className="truncate italic">"{prompt}"</span>
      </div>

      {/* Context badge from previous question */}
      {prevQuestion && prevAnswer && (
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 p-3 text-xs text-zinc-700 dark:text-zinc-300">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <span className="text-zinc-500 dark:text-zinc-400">Đã chọn ở câu trước:</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {prevAnswer}
          </span>
        </div>
      )}

      {/* Question Details with smooth step transition */}
      <div key={`question-${currentIndex}`} className="animate-fade-slide-in space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
            Câu {currentIndex + 1} trên {total}
          </span>
          <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
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
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all duration-150 hover:-translate-y-0.5 active:scale-95 ${
                  isSelected
                    ? "border-zinc-900 dark:border-zinc-100 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold ring-1 ring-zinc-900 dark:ring-zinc-100 shadow-xs"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                }`}
              >
                <span className="pr-3 leading-relaxed">{opt}</span>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                      : "border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
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
              className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400/20 transition-all shadow-xs"
            />
            {customInput.trim() && (
              <button
                type="submit"
                className="rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shrink-0 shadow-xs"
              >
                Lưu
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <div>
          {currentIndex > 0 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Câu trước</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white py-2 px-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
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
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all duration-150"
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
