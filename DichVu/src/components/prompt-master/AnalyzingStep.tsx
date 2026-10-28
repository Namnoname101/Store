"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import {
  CategoryType,
  PROMPT_CATEGORIES,
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
}: AnalyzingStepProps) {
  const categoryObj = PROMPT_CATEGORIES.find((c) => c.id === category);

  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4 animate-fade-slide-in max-w-md mx-auto">
      {/* Calm, single spinner */}
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Đang phân tích ý tưởng của bạn...
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Hệ thống đang đối chiếu framework {categoryObj?.name || "chuẩn"} và chuẩn bị câu hỏi làm rõ.
        </p>
      </div>

      {/* Quote Prompt Box */}
      <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs text-zinc-600 dark:text-zinc-400 italic line-clamp-2">
        "{prompt}"
      </div>
    </div>
  );
}