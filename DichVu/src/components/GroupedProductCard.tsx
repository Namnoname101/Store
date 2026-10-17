"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, ArrowRight, Sparkles, Layers, ChevronDown } from "lucide-react";
import type { Product } from "@prisma/client";
import { formatVND } from "@/lib/product-types";

export interface VariantProduct extends Product {
  stockCount: number;
  category?: {
    name: string;
    slug: string;
  };
  variantLabel: string;
}

export interface GroupedProductCardProps {
  groupKey: string;
  brandName: string;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  category?: {
    name: string;
    slug: string;
  };
  variants: VariantProduct[];
  onQuickView?: (product: VariantProduct) => void;
}

export default function GroupedProductCard({
  groupKey,
  brandName,
  title,
  thumbnailUrl,
  category,
  variants,
  onQuickView,
}: GroupedProductCardProps) {
  // Sort variants by price ascending
  const sortedVariants = [...variants].sort((a, b) => a.price - b.price);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const activeVariant = sortedVariants[selectedIndex] || sortedVariants[0];
  const inStock = activeVariant.stockCount > 0;

  // Check if any variant indicates high speed
  const hasFastSpeed = sortedVariants.some(
    (v) =>
      (v.title + (v.description || "")).toLowerCase().includes("tốc độ") ||
      (v.title + (v.description || "")).toLowerCase().includes("nhanh")
  );

  const cleanBrand = brandName.replace(/AI$/i, "").trim().toUpperCase();
  const badgeLabel = `API ${cleanBrand}${hasFastSpeed ? " • TỐC ĐỘ CAO" : ""}`;

  const discountPercent =
    activeVariant.originalPrice && activeVariant.originalPrice > activeVariant.price
      ? Math.round(
          ((activeVariant.originalPrice - activeVariant.price) /
            activeVariant.originalPrice) *
            100
        )
      : 0;

  const displayThumbnail = activeVariant.thumbnailUrl || thumbnailUrl;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 p-2.5 sm:p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/5 dark:hover:shadow-blue-950/20">
      <div>
        {/* Compact 16:10 Thumbnail */}
        <div className="relative mb-2 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          {displayThumbnail ? (
            <img
              src={displayThumbnail}
              alt={activeVariant.title || title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-medium">{brandName}</span>
            </div>
          )}

          {/* Brand Badge */}
          <div className="absolute top-1.5 left-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/30 bg-blue-50/90 dark:bg-blue-950/80 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-blue-700 dark:text-blue-300 backdrop-blur-md">
              <Sparkles className="h-2.5 w-2.5 text-blue-500" />
              {brandName}
            </span>
          </div>

          {/* Variants Count Badge */}
          <div className="absolute top-1.5 right-1.5">
            <span className="rounded-md bg-slate-900/80 dark:bg-slate-800/90 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-white shadow-xs backdrop-blur-md">
              {sortedVariants.length} gói lựa chọn
            </span>
          </div>
        </div>

        {/* Category / Speed Badge Label */}
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
          {badgeLabel}
        </p>

        {/* Title synced with active variant */}
        <Link href={`/products/${activeVariant.slug}`} className="block">
          <h3 className="line-clamp-2 text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug min-h-[2.1rem]">
            {activeVariant.title || title}
          </h3>
        </Link>

        {/* Interactive Credit / Variant Selector Pills - All shown openly */}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Chọn mức giá / gói credit:
            </span>
          </div>

          {/* Variant Pills Grid - Show all without truncation */}
          <div className="flex flex-wrap gap-1.5">
            {sortedVariants.map((variant, index) => {
              const isSelected = selectedIndex === index;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-all ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-500 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title={`${variant.title} - ${formatVND(variant.price)}`}
                >
                  {variant.variantLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Price & Stock Row */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {formatVND(activeVariant.price)}
              </span>
              <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">
                (Gói {activeVariant.variantLabel})
              </span>
            </div>
            {activeVariant.originalPrice &&
              activeVariant.originalPrice > activeVariant.price && (
                <div className="text-[10px] text-slate-400 line-through">
                  {formatVND(activeVariant.originalPrice)}
                </div>
              )}
          </div>

          {/* Stock Status */}
          <div className="shrink-0">
            {inStock ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Có sẵn
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-medium text-rose-600 dark:text-rose-400">
                Hết hàng
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(activeVariant)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              title="Xem nhanh gói này"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              href={`/products/${activeVariant.slug}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              title="Chi tiết"
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${activeVariant.slug}`}
              className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-2 text-[11px] sm:text-xs font-bold text-white hover:bg-blue-700 shadow-xs shadow-blue-600/20 transition-all active:scale-95"
            >
              <span>Mua ngay</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <button
              disabled
              className="flex h-8 flex-1 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] sm:text-xs font-medium text-slate-400 dark:text-slate-500 cursor-not-allowed"
            >
              Hết hàng
            </button>
          )}
        </div>

        {cleanBrand === "CODEX" && (
          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <Link
              href="/codex"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Đã có Key? Nạp thêm Credit tại đây</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
