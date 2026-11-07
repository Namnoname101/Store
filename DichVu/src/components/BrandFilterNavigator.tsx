"use client";

import React, { useState, useMemo } from "react";
import BrandLogo from "@/components/BrandLogo";
import { LayoutGrid, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { AI_FRONTIER_MODELS } from "@/lib/constants/ai-models";

export interface BrandFilterItem {
  id: string;
  name: string;
  query: string;
  iconKey: string;
  badge?: string;
  hoverBorder?: string;
  frontierModel?: typeof AI_FRONTIER_MODELS[keyof typeof AI_FRONTIER_MODELS];
}

export const BRAND_NAVIGATOR_ITEMS: BrandFilterItem[] = [
  { id: "all", name: "Tất cả", query: "", iconKey: "all" },
  { id: "claude", name: "Claude API", query: "claude", iconKey: "claude", badge: "5.5/5.6", hoverBorder: "hover:border-[#D97757]", frontierModel: AI_FRONTIER_MODELS.claude },
  { id: "chatgpt", name: "ChatGPT", query: "chatgpt", iconKey: "openai", badge: "GPT-6/o3", hoverBorder: "hover:border-accent", frontierModel: AI_FRONTIER_MODELS.openai },
  { id: "cursor", name: "Cursor AI", query: "cursor", iconKey: "cursor", badge: "PRO", hoverBorder: "hover:border-foreground/40" },
  { id: "gemini", name: "Gemini", query: "gemini", iconKey: "gemini", badge: "ARGON 4", hoverBorder: "hover:border-blue-400", frontierModel: AI_FRONTIER_MODELS.gemini },
  { id: "deepseek", name: "DeepSeek", query: "deepseek", iconKey: "deepseek", badge: "V3/R1", hoverBorder: "hover:border-indigo-400" },
  { id: "codex", name: "Codex AI", query: "codex", iconKey: "codex", badge: "CREDIT", hoverBorder: "hover:border-accent" },
  { id: "grok", name: "Grok AI", query: "grok", iconKey: "grok", badge: "xAI", hoverBorder: "hover:border-foreground/40" },
  { id: "capcut", name: "CapCut Pro", query: "capcut", iconKey: "capcut", badge: "VIP", hoverBorder: "hover:border-cyan-500" },
  { id: "canva", name: "Canva Pro", query: "canva", iconKey: "canva", badge: "PRO", hoverBorder: "hover:border-teal-500" },
  { id: "duolingo", name: "Duolingo", query: "duolingo", iconKey: "duolingo", badge: "SUPER", hoverBorder: "hover:border-lime-500" },
  { id: "meitu", name: "Meitu VIP", query: "meitu", iconKey: "meitu", badge: "VIP", hoverBorder: "hover:border-pink-500" },
  { id: "adobe", name: "Adobe", query: "adobe", iconKey: "adobe", badge: "ALL", hoverBorder: "hover:border-red-500" },
  { id: "office", name: "Office 365", query: "office", iconKey: "microsoft", badge: "1 NĂM", hoverBorder: "hover:border-amber-500" },
  { id: "windows", name: "Key Windows", query: "windows", iconKey: "windows", badge: "PRO", hoverBorder: "hover:border-sky-500" },
  { id: "tiktok", name: "TikTok", query: "tiktok", iconKey: "tiktok", badge: "BUFF", hoverBorder: "hover:border-pink-500" },
  { id: "facebook", name: "Facebook", query: "facebook", iconKey: "facebook", badge: "BM", hoverBorder: "hover:border-blue-500" },
  { id: "vps", name: "Cloud VPS", query: "vps", iconKey: "vps", badge: "NVME", hoverBorder: "hover:border-sky-400" },
  { id: "nordvpn", name: "NordVPN", query: "nordvpn", iconKey: "nordvpn", badge: "VPN", hoverBorder: "hover:border-blue-400" },
  { id: "netflix", name: "Netflix", query: "netflix", iconKey: "netflix", badge: "4K", hoverBorder: "hover:border-rose-500" },
  { id: "youtube", name: "YouTube", query: "youtube", iconKey: "youtube", badge: "PREMIUM", hoverBorder: "hover:border-red-600" },
];

export interface BrandFilterNavigatorProps {
  activeBrandId?: string;
  activeQuery?: string;
  onSelectBrand: (brandId: string, brandName: string) => void;
  brandCounts?: Record<string, number>;
  totalCount: number;
  filteredCount?: number;
  className?: string;
}

export default function BrandFilterNavigator({
  activeBrandId,
  activeQuery,
  onSelectBrand,
  brandCounts,
  totalCount,
  filteredCount,
  className = "",
}: BrandFilterNavigatorProps) {
  // Default to expanded on mobile so the full "cái tổng" overview grid is immediately visible
  const [isMobileExpanded, setIsMobileExpanded] = useState<boolean>(true);

  // Determine which brand is active based on activeBrandId or search query
  const activeBrand = useMemo(() => {
    if (activeBrandId) {
      if (activeBrandId === "all") return BRAND_NAVIGATOR_ITEMS[0];
      const found = BRAND_NAVIGATOR_ITEMS.find((b) => b.id === activeBrandId);
      if (found) return found;
    }
    if (!activeQuery || !activeQuery.trim()) return BRAND_NAVIGATOR_ITEMS[0];
    const q = activeQuery.toLowerCase().trim();
    const matched = BRAND_NAVIGATOR_ITEMS.find(
      (b) => b.id !== "all" && (b.id === q || (b.query && (q.includes(b.query) || b.query.includes(q))))
    );
    return matched || null;
  }, [activeBrandId, activeQuery]);

  const renderBrandButton = (item: BrandFilterItem) => {
    const isItemActive =
      (item.id === "all" && (!activeBrand || activeBrand.id === "all")) ||
      (activeBrand?.id === item.id);

    const count = brandCounts ? brandCounts[item.id] : undefined;
    const isOutOfStock = count !== undefined && count === 0;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectBrand(item.id, item.name)}
        className={`group relative flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold select-none transition-all duration-150 text-left active:scale-[0.98] w-full ${
          isItemActive
            ? "border border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25 ring-2 ring-primary/30 font-bold"
            : isOutOfStock
            ? "border border-border/60 bg-card/60 hover:bg-secondary text-muted-foreground hover:border-primary/30 shadow-2xs"
            : "border border-border bg-card hover:bg-secondary text-foreground hover:border-primary/40 shadow-2xs hover:shadow-xs"
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {item.id === "all" ? (
            <LayoutGrid className={`w-4 h-4 shrink-0 ${isItemActive ? "text-primary-foreground" : "text-primary"}`} />
          ) : (
            <div className="w-4 h-4 shrink-0 flex items-center justify-center transition-transform group-hover:scale-110">
              <BrandLogo brandName={item.iconKey} className="w-4 h-4" size={16} />
            </div>
          )}
          {/* Brand Name is never cut off, clear and legible */}
          <span className="whitespace-nowrap text-xs font-semibold">{item.name}</span>
        </div>

        {/* Count or Badge */}
        {item.id === "all" ? (
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ml-1 ${
              isItemActive
                ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {totalCount}
          </span>
        ) : isOutOfStock ? (
          <span
            className={`text-[9px] font-medium tracking-tight px-1.5 py-0.5 rounded shrink-0 ml-1 ${
              isItemActive
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground/70"
            }`}
          >
            Sắp về
          </span>
        ) : item.badge ? (
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ml-1 transition-colors ${
              isItemActive
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-secondary text-muted-foreground group-hover:text-foreground"
            }`}
          >
            {item.badge}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-3 sm:p-4.5 shadow-sm transition-all ${className}`}
    >
      {/* Navigator Top Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider">
              Lối tắt thương hiệu &amp; tài nguyên
            </h3>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">
            • Xem nhanh ({BRAND_NAVIGATOR_ITEMS.length} danh mục)
          </span>
        </div>

        {/* Filter Feedback Status Badge */}
        <div className="flex items-center gap-2">
          {activeBrand && activeBrand.id !== "all" ? (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-semibold">
              <span className="truncate max-w-[120px] sm:max-w-none">
                Đang lọc: <strong className="font-bold">{activeBrand.name}</strong>
              </span>
              {typeof filteredCount === "number" && (
                <span className="font-mono text-[10px] opacity-80">({filteredCount})</span>
              )}
              <button
                type="button"
                onClick={() => onSelectBrand("all", "Tất cả")}
                className="ml-1 p-1 rounded-full hover:bg-primary/20 text-primary transition-colors min-h-[44px] min-w-[44px] sm:min-h-[20px] sm:min-w-[20px] flex items-center justify-center -mr-1"
                title="Bỏ lọc"
                aria-label="Bỏ lọc"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-secondary border border-border text-[11px] font-semibold text-muted-foreground">
              <span>Đang chọn: <strong className="font-bold text-foreground">Tất cả</strong></span>
              <span className="font-mono text-[10px] opacity-80">({totalCount})</span>
            </div>
          )}
        </div>
      </div>

      {/* Responsive Grid across mobile and desktop:
          Strictly 2 columns on mobile (under sm: 640px) so every brand name has full breathing room and is 100% visible!
          3 columns on sm (640px+), 4 columns on md (768px+), 5 columns on lg (1024px+). */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
        {(isMobileExpanded ? BRAND_NAVIGATOR_ITEMS : BRAND_NAVIGATOR_ITEMS.slice(0, 8)).map((item) =>
          renderBrandButton(item)
        )}
      </div>

      {/* Mobile Toggle Button: lets user collapse/expand the grid easily */}
      <div className="sm:hidden pt-2.5 mt-2 border-t border-border/60 flex justify-center">
        <button
          type="button"
          onClick={() => setIsMobileExpanded((prev) => !prev)}
          className="w-full py-2 px-3 rounded-xl border border-border bg-card hover:bg-secondary text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-all min-h-[44px] active:scale-[0.98]"
        >
          <span>
            {isMobileExpanded
              ? "Thu gọn lối tắt"
              : `Xem đầy đủ tất cả (${BRAND_NAVIGATOR_ITEMS.length} thương hiệu & tài nguyên)`}
          </span>
          {isMobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
