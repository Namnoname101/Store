"use client";

import React from "react";
import Link from "next/link";
import { Zap, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export default function CodexCtaBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-slate-900/60 p-6 sm:p-8 backdrop-blur-md shadow-xl">
      {/* Background glow effects */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tối ưu cho Cursor, Claude Code & Windsurf</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Thử nghiệm Master Prompt này trên Codex API
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Nạp hạn mức API Credit cho Cursor & Claude Code tự động 24/7 qua VietQR. Giá chỉ từ{" "}
            <span className="font-semibold text-emerald-400">12.000đ</span>, không lo nghẽn mạng hay giới hạn tài khoản.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          <Link
            href="/codex"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:opacity-95 transition-all"
          >
            <Zap className="h-4 w-4" />
            <span>Nạp Codex API Credit</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
