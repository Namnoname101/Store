"use client";

import React, { useState, useEffect } from "react";
import {
  Terminal,
  CheckCircle2,
  Loader2,
  Cpu,
  Layers,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  CategoryType,
  PROMPT_CATEGORIES,
  TARGET_AI_OPTIONS,
  TargetAiType,
} from "@/lib/prompt-master-constants";

interface AnalyzingStepProps {
  prompt: string;
  category: CategoryType;
  targetAi: TargetAiType;
}

export default function AnalyzingStep({
  prompt,
  category,
  targetAi,
}: AnalyzingStepProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const categoryObj = PROMPT_CATEGORIES.find((c) => c.id === category);
  const targetAiObj = TARGET_AI_OPTIONS.find((a) => a.id === targetAi);

  const steps = [
    {
      title: "Phân tích ngữ cảnh & bóc tách thực thể",
      desc: `Trích xuất từ khóa, mục tiêu dự án và quy mô tính năng`,
      icon: Search,
    },
    {
      title: `Đối chiếu framework chuẩn (${categoryObj?.badge || "Chuyên gia"})`,
      desc: `Áp dụng tiêu chuẩn từ ${categoryObj?.repoReference || "Quốc tế"}`,
      icon: Layers,
    },
    {
      title: "Rà soát biến số kiến trúc & ca biên (Edge Cases)",
      desc: "Kiểm tra dữ liệu thiếu, xử lý đồng thời và bảo mật",
      icon: ShieldCheck,
    },
    {
      title: `Tối ưu hóa cấu trúc lệnh cho ${targetAiObj?.name || "AI"}`,
      desc: targetAiObj?.badge
        ? `Định hình cú pháp cho ${targetAiObj.badge} & chuẩn bị câu hỏi...`
        : `Định hình cú pháp đặc thù và khởi tạo bảng câu hỏi...`,
      icon: Cpu,
    },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStepIndex(1), 500);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), 1100);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), 1700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const progressPercent = Math.min(
    100,
    Math.round(((currentStepIndex + 1) / steps.length) * 100)
  );

  return (
    <div className="py-6 px-2 sm:px-6 space-y-6 animate-fade-slide-in">
      {/* Top Terminal Header - Clean & grounded */}
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-xs">
          <Terminal className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
            <span>Hệ thống đang thẩm định & phân tích Prompt</span>
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono max-w-md mx-auto truncate">
            "{prompt}"
          </p>
        </div>
      </div>

      {/* Dynamic Checklist Steps appearing Step-by-Step */}
      <div className="max-w-lg mx-auto space-y-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-3.5 sm:p-4">
        {steps.map((s, idx) => {
          const isDone = currentStepIndex > idx;
          const isActive = currentStepIndex === idx;
          const isRevealed = idx <= currentStepIndex;
          const StepIcon = s.icon;

          return (
            <div
              key={idx}
              className={`transition-all duration-300 ease-out ${
                isRevealed
                  ? "opacity-100 max-h-24 translate-y-0"
                  : "opacity-0 max-h-0 -translate-y-2 overflow-hidden pointer-events-none"
              }`}
            >
              <div
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 ${
                  isActive
                    ? "bg-white dark:bg-zinc-900 border-zinc-400 dark:border-zinc-600 shadow-xs"
                    : "bg-white/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : (
                    <StepIcon className="h-4 w-4 text-zinc-400" />
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-xs font-semibold ${
                        isActive
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {s.title}
                    </p>
                    {isDone && (
                      <span className="shrink-0 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        ok
                      </span>
                    )}
                    {isActive && (
                      <span className="shrink-0 text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        analyzing...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {s.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic progress bar - Linear style */}
      <div className="max-w-xs mx-auto space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
            progress
          </span>
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold text-xs">
            {progressPercent}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
