"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Eye, ArrowRight } from "lucide-react";
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

  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const candidateThumbnail = activeVariant.thumbnailUrl || thumbnailUrl;
  const displayThumbnail = resolveProductThumbnail(
    title,
    groupKey,
    imgError ? null : candidateThumbnail,
    category?.slug
  );

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth === 0) {
      setImgError(true);
    }
  }, [displayThumbnail]);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0b0f19] p-3.5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-950/20">
      <div>
        {/* Compact 16:10 Thumbnail */}
        <div className="relative mb-3 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-100 dark:border-zinc-800/70 bg-slate-50 dark:bg-[#131926]">
          <img
            key={displayThumbnail}
            ref={imgRef}
            src={displayThumbnail}
            alt={activeVariant.title || title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />

          {/* Official Brand Badge with SVG logo */}
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-[#131926]/95 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-zinc-200 shadow-xs backdrop-blur-md">
              <BrandLogo brandName={brandName} size={14} className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              {brandName}
            </span>
          </div>

          {/* Variants Count Badge */}
          <div className="absolute top-2.5 right-2.5">
            <span className="rounded-lg bg-zinc-900/85 dark:bg-zinc-800/90 border border-zinc-700/50 px-2 py-0.5 text-xs font-medium font-mono text-zinc-200 shadow-xs backdrop-blur-md">
              {sortedVariants.length} gói
            </span>
          </div>
        </div>

        {/* Category Header Label */}
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
          {category?.name || badgeLabel}
        </p>

        {/* Title synced with active variant */}
        <Link href={`/products/${activeVariant.slug}`} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug min-h-[2.5rem]">
            {activeVariant.title || title}
          </h3>
        </Link>

        {/* Interactive Credit / Variant Selector Pills */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-zinc-800/70">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
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
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
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

      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800/70">
        {/* Price & Stock Row */}
        <div className="flex items-center justify-between gap-1 mb-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight whitespace-nowrap font-mono">
                {formatVND(activeVariant.price)}
              </span>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                ({activeVariant.variantLabel})
              </span>
            </div>
            {activeVariant.originalPrice &&
              activeVariant.originalPrice > activeVariant.price && (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 line-through font-mono">
                  {formatVND(activeVariant.originalPrice)}
                </div>
              )}
          </div>

          {/* Stock Status */}
          <div className="shrink-0">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Có sẵn
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                Hết hàng
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(activeVariant)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-slate-50 dark:bg-[#131926] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c2538] transition-colors"
              title="Xem nhanh gói này"
              aria-label="Xem nhanh gói này"
            >
              <Eye className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/products/${activeVariant.slug}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-slate-50 dark:bg-[#131926] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c2538] transition-colors"
              title="Chi tiết"
              aria-label="Xem chi tiết gói này"
            >
              <Eye className="h-4 w-4" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${activeVariant.slug}`}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-white px-3 text-xs sm:text-sm font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-sm transition-all duration-200 active:scale-[0.98]"
            >
              <span>Mua ngay</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              disabled
              className="flex h-9 flex-1 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-900 text-xs sm:text-sm font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
            >
              Hết hàng
            </button>
          )}
        </div>

        {cleanBrand === "CODEX" && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/70 text-center">
            <Link
              href="/codex"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Đã có Key? Nạp thêm Credit tại đây</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
