"use client";

import React, { useMemo } from "react";
import BrandLogo from "@/components/BrandLogo";
import { LayoutGrid, X, Sparkles } from "lucide-react";

export interface BrandFilterItem {
  id: string;
  name: string;
  query: string;
  iconKey: string;
  badge?: string;
  hoverBorder?: string;
}

export const BRAND_NAVIGATOR_ITEMS: BrandFilterItem[] = [
  { id: "all", name: "Tất cả", query: "", iconKey: "all" },
  { id: "claude", name: "Claude API", query: "claude", iconKey: "claude", badge: "API", hoverBorder: "hover:border-[#D97757]" },
  { id: "chatgpt", name: "ChatGPT", query: "chatgpt", iconKey: "openai", badge: "PLUS", hoverBorder: "hover:border-emerald-500" },
  { id: "cursor", name: "Cursor AI", query: "cursor", iconKey: "cursor", badge: "PRO", hoverBorder: "hover:border-zinc-400 dark:hover:border-zinc-600" },
  { id: "gemini", name: "Gemini", query: "gemini", iconKey: "gemini", hoverBorder: "hover:border-blue-400" },
  { id: "deepseek", name: "DeepSeek", query: "deepseek", iconKey: "deepseek", hoverBorder: "hover:border-indigo-400" },
  { id: "grok", name: "Grok AI", query: "grok", iconKey: "grok", hoverBorder: "hover:border-zinc-400 dark:hover:border-zinc-600" },
  { id: "veo", name: "Google Veo", query: "veo", iconKey: "veo", hoverBorder: "hover:border-blue-500" },
  { id: "capcut", name: "CapCut Pro", query: "capcut", iconKey: "capcut", badge: "VIP", hoverBorder: "hover:border-cyan-500" },
  { id: "canva", name: "Canva Pro", query: "canva", iconKey: "canva", hoverBorder: "hover:border-teal-500" },
  { id: "duolingo", name: "Duolingo", query: "duolingo", iconKey: "duolingo", badge: "1 NĂM", hoverBorder: "hover:border-lime-500" },
  { id: "meitu", name: "Meitu VIP", query: "meitu", iconKey: "meitu", hoverBorder: "hover:border-pink-500" },
  { id: "adobe", name: "Adobe", query: "adobe", iconKey: "adobe", hoverBorder: "hover:border-red-500" },
  { id: "office", name: "Office 365", query: "office", iconKey: "microsoft", hoverBorder: "hover:border-amber-500" },
  { id: "windows", name: "Key Windows", query: "windows", iconKey: "windows", hoverBorder: "hover:border-sky-500" },
  { id: "tiktok", name: "TikTok", query: "tiktok", iconKey: "tiktok", badge: "BUFF", hoverBorder: "hover:border-pink-500" },
  { id: "facebook", name: "Facebook", query: "facebook", iconKey: "facebook", badge: "BM", hoverBorder: "hover:border-blue-500" },
  { id: "nordvpn", name: "NordVPN", query: "vpn", iconKey: "nordvpn", hoverBorder: "hover:border-blue-400" },
  { id: "netflix", name: "Netflix", query: "netflix", iconKey: "netflix", hoverBorder: "hover:border-rose-500" },
  { id: "youtube", name: "YouTube", query: "youtube", iconKey: "youtube", hoverBorder: "hover:border-red-600" },
  { id: "codex", name: "Codex AI", query: "codex", iconKey: "codex", badge: "Credit", hoverBorder: "hover:border-emerald-500" },
];

interface BrandFilterNavigatorProps {
  activeQuery: string;
  onSelectBrand: (query: string, brandName: string) => void;
  totalCount: number;
  filteredCount?: number;
  className?: string;
}

export default function BrandFilterNavigator({
  activeQuery,
  onSelectBrand,
  totalCount,
  filteredCount,
  className = "",
}: BrandFilterNavigatorProps) {
  // Determine which brand is active based on current search query
  const activeBrand = useMemo(() => {
    if (!activeQuery || !activeQuery.trim()) return BRAND_NAVIGATOR_ITEMS[0];
    const q = activeQuery.toLowerCase().trim();
    const matched = BRAND_NAVIGATOR_ITEMS.find(
      (b) => b.id !== "all" && b.query && (q.includes(b.query) || b.query.includes(q))
    );
    return matched || null;
  }, [activeQuery]);

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-xl p-3.5 sm:p-4.5 shadow-sm dark:shadow-2xl transition-all ${className}`}
    >
      {/* Navigator Top Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-slate-100 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-white/10 border border-blue-500/20 dark:border-white/15 flex items-center justify-center text-blue-600 dark:text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Lối tắt thương hiệu &amp; tài nguyên
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-mono hidden sm:inline">
            • Bấm chọn nhanh
          </span>
        </div>

        {/* Filter Feedback Status Badge */}
        <div className="flex items-center gap-2">
          {activeBrand && activeBrand.id !== "all" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-white/[0.08] border border-blue-200 dark:border-white/15 text-blue-700 dark:text-zinc-200 text-[11px] font-semibold">
              <span>Đang lọc: <strong className="font-bold text-blue-800 dark:text-blue-400">{activeBrand.name}</strong></span>
              {typeof filteredCount === "number" && (
                <span className="font-mono text-[10px] opacity-80">({filteredCount} gói)</span>
              )}
              <button
                type="button"
                onClick={() => onSelectBrand("", "Tất cả")}
                className="ml-1 p-0.5 rounded-full hover:bg-blue-200/50 dark:hover:bg-white/20 text-blue-600 dark:text-zinc-300 hover:text-blue-900 dark:hover:text-white transition-colors"
                title="Bỏ lọc"
                aria-label="Bỏ lọc"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50/70 dark:bg-white/[0.06] border border-blue-100 dark:border-white/10 text-[11px] font-semibold text-slate-700 dark:text-zinc-200">
              <span>Đang chọn: <strong className="font-bold text-blue-600 dark:text-blue-400">Tất cả</strong></span>
              <span className="font-mono text-[10px] opacity-80">({totalCount} gói)</span>
            </div>
          )}
        </div>
      </div>

      {/* Unified Brand Capsule Grid: 2 cols on mobile, 3 on sm, 4 on md, 5 on lg/xl */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-2.5">
        {BRAND_NAVIGATOR_ITEMS.map((item) => {
          const isItemActive =
            (item.id === "all" && (!activeQuery || !activeQuery.trim())) ||
            (activeBrand?.id === item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectBrand(item.query, item.name)}
              className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold select-none transition-all duration-150 text-left ${
                isItemActive
                  ? "border border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600 dark:text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-500/30 font-bold"
                  : `border border-slate-200/90 dark:border-zinc-800/90 bg-slate-50/90 hover:bg-white dark:bg-[#131926] dark:hover:bg-[#1c2538] text-slate-800 dark:text-zinc-100 hover:text-slate-950 dark:hover:text-white shadow-2xs hover:shadow-xs ${item.hoverBorder || "hover:border-slate-300 dark:hover:border-zinc-700"}`
              }`}
            >
              {/* Official Real Vector Brand Icon */}
              {item.id === "all" ? (
                <LayoutGrid className={`w-4 h-4 shrink-0 ${isItemActive ? "text-white" : "text-blue-600 dark:text-blue-400"}`} />
              ) : (
                <div className="w-4 h-4 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
                  <BrandLogo brandName={item.iconKey} className="w-4 h-4" size={16} />
                </div>
              )}

              {/* Brand Label */}
              <span className="truncate flex-1">{item.name}</span>

              {/* All Count or Badge */}
              {item.id === "all" ? (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isItemActive
                      ? "bg-white/20 text-white font-bold"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  {totalCount}
                </span>
              ) : item.badge ? (
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors ${
                    isItemActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-200"
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
