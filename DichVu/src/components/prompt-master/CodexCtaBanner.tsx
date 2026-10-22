"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Terminal } from "lucide-react";

export default function CodexCtaBanner() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 p-5 sm:p-6 shadow-xs">
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800 px-2.5 py-0.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            <Terminal className="h-3 w-3" />
            <span>codex-gateway • openai-compatible</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Thử nghiệm Master Prompt này trên Codex API
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Nạp hạn mức API Credit cho Cursor & Claude Code tự động 24/7 qua VietQR. Giá chỉ từ{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">12.000đ</span>, không lo nghẽn mạng hay khóa tài khoản.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <Link
            href="/codex"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2.5 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-xs transition-all"
          >
            <span>Nạp Codex API Credit</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
