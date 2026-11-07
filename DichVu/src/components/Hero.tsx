"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { AI_FRONTIER_MODELS } from "@/lib/constants/ai-models";

interface HeroProps {
  initialSearch?: string;
  totalProductsCount?: number;
}

export default function Hero({ initialSearch = "" }: HeroProps) {
  return (
    <section className="relative overflow-hidden pt-6 sm:pt-10 pb-8 sm:pb-10 border-b border-border bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
          {/* Live Status Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 shadow-2xs backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="whitespace-nowrap">Hệ thống tự động 24/7 • Bàn giao tức thì</span>
          </div>

          {/* Headline - Punchy & Impactful */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            Kho Bản Quyền &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Tài Nguyên AI
            </span>
          </h1>

          {/* Subtitle - 1-Line Value Proposition with Frontier SSOT Models */}
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg leading-relaxed">
            API thế hệ mới (Claude 5.5/5.6, OpenAI GPT-6, Gemini 4 Argon) &amp; bản quyền số tự động 24/7.
          </p>

          {/* Primary Search Bar */}
          <form
            action="/#catalog"
            method="GET"
            className="w-full max-w-lg relative flex items-center group pt-1"
          >
            <div className="relative w-full flex items-center rounded-2xl border border-border bg-card shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <Search className="absolute left-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                name="search"
                defaultValue={initialSearch}
                placeholder="Tìm kiếm gói API, key bản quyền, tài khoản..."
                className="w-full bg-transparent py-3 pl-11 pr-24 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1.5 min-h-[44px] sm:min-h-[36px] rounded-xl bg-primary hover:bg-primary/90 px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-all shadow-xs active:scale-[0.98] flex items-center justify-center"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          {/* Compact Trust Highlights & Developer Access */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs text-muted-foreground font-medium pt-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">⚡</span>
              <span>Nhận key &lt; 30s</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-blue-500 font-bold">🛡️</span>
              <span>Bảo hành 1-đổi-1</span>
            </span>
            <Link
              href="/check-usage"
              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold min-h-[44px] sm:min-h-0 py-2 sm:py-0"
            >
              <span>Kiểm tra Quota Key →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
