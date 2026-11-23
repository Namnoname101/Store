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
  const isYoutube =
    (activeVariant?.slug || "").toLowerCase().includes("youtube") ||
    activeVariant?.title.toLowerCase().includes("youtube");
  const isManualAllowed =
    isYoutube ||
    (activeVariant?.slug || "").toLowerCase().includes("up-gemini") ||
    activeVariant?.title.toLowerCase().includes("up pro");
  const inStock = isManualAllowed || activeVariant.stockCount > 0;

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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
      <div>
        {/* Full-bleed 16:10 Thumbnail (No nested box-in-box border) */}
        <Link
          href={`/products/${activeVariant.slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block aspect-[16/10] w-full overflow-hidden border-b border-border/70 bg-secondary/40"
        >
          <img
            key={displayThumbnail}
            ref={imgRef}
            src={displayThumbnail}
            alt={activeVariant.title || title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />

          {/* Official Brand Badge with SVG logo */}
          <div className="pointer-events-none absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-zinc-950/75 px-2.5 py-1 text-xs font-semibold text-zinc-100 shadow-sm backdrop-blur-md whitespace-nowrap">
              <BrandLogo brandName={brandName} size={14} className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
              {brandName}
            </span>
          </div>

          {/* Variants Count Badge */}
          <div className="pointer-events-none absolute top-2.5 right-2.5">
            <span className="inline-flex items-center rounded-lg bg-zinc-950/75 border border-white/15 px-2.5 py-1 text-xs font-semibold font-mono text-zinc-100 shadow-sm backdrop-blur-md whitespace-nowrap">
              {sortedVariants.length} gói
            </span>
          </div>
        </Link>

        {/* Card Content Body */}
        <div className="px-3.5 pt-3.5 sm:px-4 sm:pt-4">
          {/* Category Header Label */}
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {category?.name || badgeLabel}
          </p>

          {/* Title synced with active variant */}
          <Link
            href={`/products/${activeVariant.slug}`}
            className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug min-h-[2.5rem]">
              {activeVariant.title || title}
            </h3>
          </Link>

          {/* Interactive Credit / Variant Selector Pills with >= 44px Touch Targets */}
          <div className="mt-3 pt-2.5 border-t border-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Chọn mức gói:
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {sortedVariants.map((variant, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    className={`min-h-[44px] px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center touch-manipulation focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "border border-primary bg-primary text-primary-foreground shadow-sm ring-1 ring-primary scale-[1.02] font-bold"
                        : "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
      </div>

      <div className="mx-3.5 mb-3.5 sm:mx-4 sm:mb-4 mt-3.5 pt-3 border-t border-border">
        {/* Price & Stock Row */}
        <div className="flex items-center justify-between gap-1 mb-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-foreground tracking-tight whitespace-nowrap font-mono">
                {formatVND(activeVariant.price)}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                ({activeVariant.variantLabel})
              </span>
            </div>
            {activeVariant.originalPrice &&
              activeVariant.originalPrice > activeVariant.price && (
                <div className="text-xs text-muted-foreground line-through font-mono">
                  {formatVND(activeVariant.originalPrice)}
                </div>
              )}
          </div>

          {/* 3-Tier Stock Status */}
          <div className="shrink-0">
            {isManualAllowed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                {isYoutube ? "Gia hạn 24/7" : "Nhận nâng 24/7"}
              </span>
            ) : activeVariant.stockCount > 5 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Sẵn hàng ({activeVariant.stockCount})
              </span>
            ) : activeVariant.stockCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Còn ít ({activeVariant.stockCount})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                Hết hàng
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons with >= 44px Touch Targets */}
        <div className="flex items-center gap-2">
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(activeVariant)}
              className="flex min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring transition-all"
              title="Xem nhanh gói này"
              aria-label={`Xem nhanh ${activeVariant.title || title}`}
            >
              <Eye className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/products/${activeVariant.slug}`}
              className="flex min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring transition-all"
              title="Chi tiết"
              aria-label={`Xem chi tiết ${activeVariant.title || title}`}
            >
              <Eye className="h-4 w-4" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${activeVariant.slug}`}
              className="flex min-h-[44px] h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-3 text-xs sm:text-sm font-bold shadow-sm shadow-primary/25 transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Mua ngay</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <button
              disabled
              className="flex min-h-[44px] h-11 flex-1 items-center justify-center rounded-xl bg-muted text-muted-foreground text-xs sm:text-sm font-medium cursor-not-allowed"
            >
              Hết hàng
            </button>
          )}
        </div>

        {cleanBrand === "CODEX" && (
          <div className="mt-2.5 pt-2 border-t border-border text-center">
            <Link
              href="/codex"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
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
