"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  FastForward,
  Sparkles,
  HelpCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { ClarifyQuestion } from "@/lib/prompt-master-constants";

interface ClarifyModalProps {
  isOpen: boolean;
  prompt: string;
  category: string;
  questions: ClarifyQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  onSkipAll: () => void;
  onClose: () => void;
  isLoading: boolean;
}

export default function ClarifyModal({
  isOpen,
  prompt,
  category,
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onSkipAll,
  onClose,
  isLoading,
}: ClarifyModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customInput, setCustomInput] = useState("");

  // Reset index when modal opens or questions change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setCustomInput("");
    }
  }, [isOpen]);

  if (!isOpen || questions.length === 0) return null;

  const currentQuestion = questions[currentIndex] || questions[0];
  const total = questions.length;
  const isLastQuestion = currentIndex === total - 1;
  const selectedOption = answers[currentQuestion.id] || "";

  // Get previous question answer for contextual chaining
  const prevQuestion = currentIndex > 0 ? questions[currentIndex - 1] : null;
  const prevAnswer = prevQuestion ? answers[prevQuestion.id] : null;

  const handleSelectOption = (opt: string) => {
    onAnswerChange(currentQuestion.id, opt);
    setCustomInput("");

    // Auto-advance to next question smoothly after 280ms
    if (!isLastQuestion) {
      setTimeout(() => {
        setCurrentIndex((prev) => Math.min(total - 1, prev + 1));
      }, 280);
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
      setCustomInput("");
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setCustomInput("");
  };

  const progressPercent = Math.round(((currentIndex + 1) / total) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-blue-500/30 bg-slate-900 text-slate-100 shadow-2xl shadow-blue-500/10 transition-all">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative border-b border-slate-800 p-5 sm:p-6 pb-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Xác nhận thông tin</span>
                  <span className="text-[11px] font-normal text-slate-400">
                    ({currentIndex + 1}/{total})
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Chỉ hỏi thêm để đảm bảo AI sinh prompt chuẩn xác nhất
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              title="Đóng modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Content Body */}
        <div className="relative p-5 sm:p-6 space-y-4">
          {/* Previous answer context badge */}
          {prevQuestion && prevAnswer && (
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] text-blue-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-400 shrink-0" />
              <span className="text-slate-400">Đã chọn trước đó:</span>
              <span className="font-semibold text-blue-200 truncate max-w-[280px]">
                {prevAnswer}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
              Bước {currentIndex + 1}:
            </span>
            <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
              {currentQuestion.question}
            </h4>
          </div>

          {/* Options list */}
          <div className="space-y-2 pt-1">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/20 text-white font-medium ring-1 ring-blue-500 shadow-md shadow-blue-500/10"
                      : "border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 active:scale-[0.99]"
                  }`}
                >
                  <span className="pr-3 leading-relaxed">{option}</span>
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom user answer input */}
          <form onSubmit={handleCustomSubmit} className="pt-1">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Hoặc tự nhập câu trả lời khác..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950/60 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {customInput.trim() && (
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-all shrink-0"
                >
                  Lưu
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer Controls */}
        <div className="relative flex items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/40 p-4 sm:p-5">
          <div>
            {currentIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white py-1.5 px-2.5 rounded-lg hover:bg-slate-800 transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Câu trước</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSkipAll}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 py-1.5 px-2.5 rounded-lg hover:bg-slate-800/60 transition-all"
              >
                <FastForward className="h-3.5 w-3.5" />
                <span>Bỏ qua tất cả</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLastQuestion && (
              <button
                type="button"
                onClick={onSkipAll}
                disabled={isLoading}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-800 px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              >
                <span>Tạo ngay</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : isLastQuestion ? (
                <>
                  <span>Tạo Master Prompt</span>
                  <Sparkles className="h-3.5 w-3.5" />
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
    </div>
  );
}
