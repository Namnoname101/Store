"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CodexCtaBanner() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Thử nghiệm Master Prompt này trên Codex API
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-lg">
            Nạp hạn mức API Credit cho Cursor & Claude Code tự động qua VietQR chỉ từ <strong className="text-zinc-700 dark:text-zinc-200">12.000đ</strong>. Không cần thẻ quốc tế, tương thích chuẩn OpenAI & Anthropic.
          </p>
        </div>

        <Link
          href="/codex"
          className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3.5 py-2 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shrink-0"
        >
          <span>Nạp Codex API Credit</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}