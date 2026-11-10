"use client";

import React from "react";
import { ShieldCheck, Zap, Headphones, CheckCircle2, Gift } from "lucide-react";

const PLATFORM_STATUS_NOTICES = [
  {
    icon: CheckCircle2,
    text: "Hệ thống VietQR 24/7 NAPAS hoạt động bình thường",
  },
  {
    icon: Zap,
    text: "Bàn giao tự động tức thì < 30s",
  },
  {
    icon: ShieldCheck,
    text: "Bảo hành 1 đổi 1 chuẩn chính sách từng gói",
  },
  {
    icon: Gift,
    text: "Nạp ví tự động thưởng thêm tới +5%",
  },
  {
    icon: Headphones,
    text: "Hỗ trợ kỹ thuật trực tuyến 24/7",
  },
];

export default function LiveOrderTicker() {
  return (
    <div className="bg-slate-100/90 dark:bg-[#0b1222] border-b border-slate-200/80 dark:border-white/5 py-1.5 overflow-hidden text-xs text-slate-600 dark:text-slate-300 print:hidden select-none transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 flex items-center gap-2.5 sm:gap-3">
        {/* Status Indicator Badge */}
        <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 shrink-0 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 dark:border-emerald-500/20 text-[11px]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="whitespace-nowrap font-mono font-semibold">VietQR 24/7 Active</span>
        </div>

        {/* Marquee Track with Fade Edges */}
        <div className="relative overflow-hidden w-full [mask-image:linear-gradient(to_right,transparent_0,black_28px,black_calc(100%-28px),transparent_100%)]">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-100 dark:from-[#0b1222] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-100 dark:from-[#0b1222] to-transparent z-10" />

          <div className="animate-marquee flex items-center gap-8 text-[11px]">
            {PLATFORM_STATUS_NOTICES.concat(PLATFORM_STATUS_NOTICES).map((notice, idx) => {
              const Icon = notice.icon;
              return (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 whitespace-nowrap text-slate-700 dark:text-slate-200"
                >
                  <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{notice.text}</span>
                  <span className="text-slate-400 dark:text-slate-600 text-[10px]">•</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Desktop SLA Badge */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0 text-[11px] font-mono text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-zinc-800">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>SLA: 100% Tự động</span>
        </div>
      </div>
    </div>
  );
}
