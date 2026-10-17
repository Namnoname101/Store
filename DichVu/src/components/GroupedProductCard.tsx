"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, ArrowRight, Layers, ChevronDown } from "lucide-react";
import type { Product } from "@prisma/client";
import { formatVND } from "@/lib/product-types";
import BrandLogo from "@/components/BrandLogo";
import { resolveProductThumbnail } from "@/lib/catalog-grouping";

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

  const cleanBrand = brandName.replace(/AI$/i, "").trim().toUpperCase();
  const badgeLabel = `API ${cleanBrand}`;

  const discountPercent =
    activeVariant.originalPrice && activeVariant.originalPrice > activeVariant.price
      ? Math.round(
          ((activeVariant.originalPrice - activeVariant.price) /
            activeVariant.originalPrice) *
            100
        )
      : 0;

  const candidateThumbnail = activeVariant.thumbnailUrl || thumbnailUrl;
  const displayThumbnail = resolveProductThumbnail(
    title,
    groupKey,
    candidateThumbnail,
    category?.slug
  );

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-950/5 dark:hover:shadow-zinc-950/30">
      <div>
        {/* Compact 16:10 Thumbnail */}
        <div className="relative mb-2.5 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60">
          <img
            src={displayThumbnail}
            alt={activeVariant.title || title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Official Brand Badge with SVG logo */}
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 px-2 py-0.5 text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs backdrop-blur-md">
              <BrandLogo brandName={brandName} size={12} className="w-3 h-3 text-zinc-700 dark:text-zinc-300" />
              {brandName}
            </span>
          </div>

          {/* Variants Count Badge */}
          <div className="absolute top-2 right-2">
            <span className="rounded-md bg-zinc-900/85 dark:bg-zinc-800/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300 shadow-xs backdrop-blur-md">
              {sortedVariants.length} gói
            </span>
          </div>
        </div>

        {/* Category Header Label */}
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
          {category?.name || badgeLabel}
        </p>

        {/* Title synced with active variant */}
        <Link href={`/products/${activeVariant.slug}`} className="block">
          <h3 className="line-clamp-2 text-xs sm:text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug min-h-[2.1rem]">
            {activeVariant.title || title}
          </h3>
        </Link>

        {/* Interactive Credit / Variant Selector Pills */}
        <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
              Chọn mức gói:
            </span>
          </div>

          {/* Variant Pills Grid - Clean Tech Studio Style */}
          <div className="flex flex-wrap gap-1.5">
            {sortedVariants.map((variant, index) => {
              const isSelected = selectedIndex === index;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${
                    isSelected
                      ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 shadow-xs ring-1 ring-zinc-700 dark:ring-zinc-300 scale-[1.02]"
                      : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white border border-transparent dark:border-zinc-800"
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

      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
        {/* Price & Stock Row */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                {formatVND(activeVariant.price)}
              </span>
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                ({activeVariant.variantLabel})
              </span>
            </div>
            {activeVariant.originalPrice &&
              activeVariant.originalPrice > activeVariant.price && (
                <div className="text-[10px] text-zinc-400 line-through">
                  {formatVND(activeVariant.originalPrice)}
                </div>
              )}
          </div>

          {/* Stock Status */}
          <div className="shrink-0">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Có sẵn
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-50/60 dark:bg-rose-950/30 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:text-rose-400">
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Xem nhanh gói này"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              href={`/products/${activeVariant.slug}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Chi tiết"
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${activeVariant.slug}`}
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-white px-2 text-[11px] sm:text-xs font-bold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Mua ngay</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <button
              disabled
              className="flex h-8 flex-1 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-900 text-[11px] sm:text-xs font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
            >
              Hết hàng
            </button>
          )}
        </div>

        {cleanBrand === "CODEX" && (
          <div className="mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
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
