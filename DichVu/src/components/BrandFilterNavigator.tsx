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
  hoverColor?: string;
}

export const BRAND_NAVIGATOR_ITEMS: BrandFilterItem[] = [
  { id: "all", name: "Tất cả", query: "", iconKey: "all" },
  { id: "claude", name: "Claude API", query: "claude", iconKey: "claude", badge: "API", hoverColor: "hover:border-[#D97757] hover:bg-[#D97757]/5 dark:hover:bg-[#D97757]/15" },
  { id: "chatgpt", name: "ChatGPT", query: "chatgpt", iconKey: "openai", badge: "Plus", hoverColor: "hover:border-emerald-500 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/15" },
  { id: "codex", name: "Codex AI", query: "codex", iconKey: "codex", badge: "Credit", hoverColor: "hover:border-emerald-500 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/15" },
  { id: "cursor", name: "Cursor AI", query: "cursor", iconKey: "cursor", badge: "Pro", hoverColor: "hover:border-zinc-400 hover:bg-zinc-500/5 dark:hover:bg-zinc-500/15" },
  { id: "gemini", name: "Gemini", query: "gemini", iconKey: "gemini", hoverColor: "hover:border-blue-400 hover:bg-blue-500/5 dark:hover:bg-blue-500/15" },
  { id: "deepseek", name: "DeepSeek", query: "deepseek", iconKey: "deepseek", hoverColor: "hover:border-indigo-400 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/15" },
  { id: "grok", name: "Grok AI", query: "grok", iconKey: "grok", hoverColor: "hover:border-zinc-400 hover:bg-zinc-500/5 dark:hover:bg-zinc-500/15" },
  { id: "veo", name: "Google Veo", query: "veo", iconKey: "veo", hoverColor: "hover:border-blue-500 hover:bg-blue-500/5 dark:hover:bg-blue-500/15" },
  { id: "capcut", name: "CapCut Pro", query: "capcut", iconKey: "capcut", badge: "VIP", hoverColor: "hover:border-cyan-500 hover:bg-cyan-500/5 dark:hover:bg-cyan-500/15" },
  { id: "canva", name: "Canva Pro", query: "canva", iconKey: "canva", hoverColor: "hover:border-teal-500 hover:bg-teal-500/5 dark:hover:bg-teal-500/15" },
  { id: "duolingo", name: "Duolingo Super", query: "duolingo", iconKey: "duolingo", badge: "1 Năm", hoverColor: "hover:border-lime-500 hover:bg-lime-500/5 dark:hover:bg-lime-500/15" },
  { id: "meitu", name: "Meitu VIP", query: "meitu", iconKey: "meitu", hoverColor: "hover:border-pink-500 hover:bg-pink-500/5 dark:hover:bg-pink-500/15" },
  { id: "adobe", name: "Adobe", query: "adobe", iconKey: "adobe", hoverColor: "hover:border-red-500 hover:bg-red-500/5 dark:hover:bg-red-500/15" },
  { id: "office", name: "Office 365", query: "office", iconKey: "microsoft", hoverColor: "hover:border-amber-500 hover:bg-amber-500/5 dark:hover:bg-amber-500/15" },
  { id: "windows", name: "Key Windows", query: "windows", iconKey: "windows", hoverColor: "hover:border-sky-500 hover:bg-sky-500/5 dark:hover:bg-sky-500/15" },
  { id: "tiktok", name: "TikTok", query: "tiktok", iconKey: "tiktok", badge: "Buff", hoverColor: "hover:border-pink-500 hover:bg-pink-500/5 dark:hover:bg-pink-500/15" },
  { id: "facebook", name: "Facebook", query: "facebook", iconKey: "facebook", badge: "BM", hoverColor: "hover:border-blue-500 hover:bg-blue-500/5 dark:hover:bg-blue-500/15" },
  { id: "nordvpn", name: "NordVPN", query: "vpn", iconKey: "nordvpn", hoverColor: "hover:border-blue-400 hover:bg-blue-500/5 dark:hover:bg-blue-500/15" },
  { id: "netflix", name: "Netflix", query: "netflix", iconKey: "netflix", hoverColor: "hover:border-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/15" },
  { id: "youtube", name: "YouTube", query: "youtube", iconKey: "youtube", hoverColor: "hover:border-red-600 hover:bg-red-600/5 dark:hover:bg-red-600/15" },
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
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Lối tắt thương hiệu &amp; tài nguyên
            </h3>
          </div>
        </div>

        {/* Filter Feedback Status Badge */}
        <div className="flex items-center gap-2">
          {activeBrand && activeBrand.id !== "all" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
              <span>Đang lọc: <strong className="font-bold text-blue-800 dark:text-white">{activeBrand.name}</strong></span>
              {typeof filteredCount === "number" && (
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-200">({filteredCount} gói)</span>
              )}
              <button
                type="button"
                onClick={() => onSelectBrand("", "Tất cả")}
                className="ml-1 p-0.5 rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white transition-colors"
                title="Bỏ lọc"
                aria-label="Bỏ lọc"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 hidden sm:inline">
              Bấm nhanh để lọc toàn bộ sản phẩm
            </span>
          )}
        </div>
      </div>

      {/* Unified Brand Capsule Grid: 2 cols on mobile, 3 on sm, 4 on md, 5 on lg, 7 on xl */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
        {BRAND_NAVIGATOR_ITEMS.map((item) => {
          const isItemActive =
            (item.id === "all" && (!activeQuery || !activeQuery.trim())) ||
            (activeBrand?.id === item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectBrand(item.query, item.name)}
              className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold select-none transition-all duration-150 text-left ${
                isItemActive
                  ? "border border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500/25 dark:text-blue-300 shadow-sm shadow-blue-500/20 ring-2 ring-blue-500/30 font-bold"
                  : `border border-slate-200/90 dark:border-white/10 bg-slate-50/90 hover:bg-white dark:bg-white/[0.05] text-slate-800 dark:text-zinc-200 hover:text-slate-950 dark:hover:text-white shadow-2xs ${item.hoverColor || "hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100 dark:hover:bg-white/[0.1]"}`
              }`}
            >
              {/* Official Real Vector Brand Icon */}
              {item.id === "all" ? (
                <LayoutGrid className={`w-4 h-4 shrink-0 ${isItemActive ? "text-white dark:text-blue-300" : "text-blue-600 dark:text-blue-400"}`} />
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
                      ? "bg-white/20 text-white dark:bg-blue-500/30 dark:text-blue-200 font-bold"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-zinc-300"
                  }`}
                >
                  {totalCount}
                </span>
              ) : item.badge ? (
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded transition-opacity ${
                    isItemActive
                      ? "bg-white/20 text-white dark:bg-blue-500/30 dark:text-blue-200"
                      : "bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-zinc-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200"
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
