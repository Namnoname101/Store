"use client";

import React from "react";
import { ArrowLeft, ArrowRight, Check, FastForward, HelpCircle, Loader2 } from "lucide-react";
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
  return (
    <div className="space-y-6">
      {/* Header & Prompt Summary */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 p-4">
        <div className="flex items-center justify-between text-xs text-blue-500 mb-1">
          <span className="font-semibold uppercase tracking-wider">Ý tưởng ban đầu:</span>
          <span className="capitalize px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[11px]">
            {category}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
          "{prompt}"
        </p>
      </div>

      {/* Clarification Questions list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Làm rõ bối cảnh (Chọn để AI tối ưu sát thực tế hơn)
          </h4>
          <span className="text-xs text-slate-400">Không bắt buộc</span>
        </div>

        {questions.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center text-sm text-slate-400">
            Không có câu hỏi làm rõ nào thêm cho yêu cầu này. Bạn có thể tiến hành tạo prompt ngay!
          </div>
        ) : (
          questions.map((q, idx) => {
            const currentSelected = answers[q.id];

            return (
              <div
                key={q.id || idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[11px] font-bold text-blue-500 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {q.question}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pl-7">
                  {q.options.map((opt, oIdx) => {
                    const isPicked = currentSelected === opt;

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => onAnswerChange(q.id, isPicked ? "" : opt)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs text-left transition-all ${
                          isPicked
                            ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium ring-1 ring-blue-500"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
                        }`}
                      >
                        <span className="line-clamp-2">{opt}</span>
                        {isPicked && <Check className="h-3.5 w-3.5 shrink-0 text-blue-500 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Sửa lại prompt</span>
        </button>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <FastForward className="h-3.5 w-3.5 text-slate-400" />
            <span>Bỏ qua & Tạo ngay</span>
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading}
            className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 hover:opacity-95 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang tạo prompt...</span>
              </>
            ) : (
              <>
                <span>Tạo Master Prompt</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
