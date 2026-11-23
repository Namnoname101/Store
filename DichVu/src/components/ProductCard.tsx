"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Clock } from "lucide-react";
import type { Product } from "@prisma/client";
import { formatVND, getProductTypeInfo, getProductBadgeLabel } from "@/lib/product-types";
import { resolveProductThumbnail } from "@/lib/catalog-grouping";

export interface ProductCardProps {
  product: Product & {
    stockCount: number;
    category?: {
      name: string;
      slug: string;
    };
  };
  onQuickView?: (product: ProductCardProps["product"]) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { title, slug, price, originalPrice, type, stockCount, thumbnailUrl } = product;
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const typeInfo = getProductTypeInfo(type, {
    categorySlug: product.category?.slug,
    title,
  });
  const TypeIcon = typeInfo.icon;

  const isSMM =
    product.category?.slug === "dich-vu-mxh" ||
    title.toLowerCase().includes("tiktok") ||
    title.toLowerCase().includes("facebook") ||
    title.toLowerCase().includes("tim") ||
    title.toLowerCase().includes("like") ||
    title.toLowerCase().includes("follow");

  const isApiKey =
    product.category?.slug === "ai-api" ||
    product.category?.slug === "ai" ||
    title.toLowerCase().includes("api") ||
    title.toLowerCase().includes("codex") ||
    title.toLowerCase().includes("credit") ||
    title.toLowerCase().includes("token") ||
    title.toLowerCase().includes("key");

  const titleLower = (title || "").toLowerCase();
  const slugLower = (slug || "").toLowerCase();

  const isYoutube = slugLower.includes("youtube") || titleLower.includes("youtube");

  const isAccountUpgrade =
    !isYoutube &&
    (slugLower.includes("up-gemini") ||
    titleLower.includes("up pro"));

  const hideExactStock = isSMM || isApiKey || isYoutube || isAccountUpgrade || stockCount >= 99999;
  const inStock = hideExactStock || stockCount > 0;
  let durationBadge: string | null = null;
  if (!isSMM) {
    if (titleLower.includes("2 năm") || slugLower.includes("2-nam")) {
      durationBadge = "HẠN 2 NĂM";
    } else if (titleLower.includes("18 tháng") || slugLower.includes("18-thang")) {
      durationBadge = "18 THÁNG";
    } else if (titleLower.includes("1 năm") || titleLower.includes("12 tháng") || slugLower.includes("1-nam") || slugLower.includes("12-thang")) {
      durationBadge = "1 NĂM";
    } else if (titleLower.includes("6 tháng") || slugLower.includes("6-thang")) {
      durationBadge = "6 THÁNG";
    } else if (titleLower.includes("3 tháng") || slugLower.includes("3-thang")) {
      durationBadge = "3 THÁNG";
    } else if (titleLower.includes("30 ngày") || titleLower.includes("1 tháng") || slugLower.includes("1-thang") || slugLower.includes("30-ngay")) {
      durationBadge = "30 NGÀY";
    } else if (titleLower.includes("7 ngày") || slugLower.includes("7-ngay")) {
      durationBadge = "7 NGÀY";
    } else if (titleLower.includes("vĩnh viễn") || slugLower.includes("vinh-vien")) {
      durationBadge = "VĨNH VIỄN";
    }
  }

  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const resolvedThumbnail = resolveProductThumbnail(
    title,
    slug,
    imgError ? null : thumbnailUrl,
    product.category?.slug
  );

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth === 0) {
      setImgError(true);
    }
  }, [resolvedThumbnail]);

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card text-card-foreground transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
      <div>
        {/* Full-bleed 16:10 Product Media (No nested box-in-box border) */}
        <Link
          href={`/products/${slug}`}
          tabIndex={-1}
          aria-hidden="true"
          className="relative block aspect-[16/10] w-full overflow-hidden border-b border-border/70 bg-secondary/40"
        >
          <img
            key={resolvedThumbnail}
            ref={imgRef}
            src={resolvedThumbnail}
            alt={title}
            onError={() => {
              if (!imgError) {
                setImgError(true);
              }
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Type Badge */}
          <div className="pointer-events-none absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-zinc-950/75 px-2 py-0.5 text-xs font-semibold text-zinc-100 shadow-sm backdrop-blur-md whitespace-nowrap">
              <TypeIcon aria-hidden="true" className="h-3.5 w-3.5 text-zinc-300 shrink-0" />
              {typeInfo.shortLabel}
            </span>
          </div>

          {/* Duration Pill at bottom-left */}
          {durationBadge && (
            <div className="pointer-events-none absolute bottom-2 left-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-950/80 border border-amber-400/40 px-2 py-0.5 text-xs font-bold font-mono text-amber-300 shadow-sm backdrop-blur-md whitespace-nowrap">
                <Clock aria-hidden="true" className="h-3 w-3 text-amber-400 shrink-0" />
                {durationBadge}
              </span>
            </div>
          )}

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="pointer-events-none absolute top-2 right-2">
              <span className="inline-flex items-center rounded-lg bg-rose-600/90 border border-rose-400/40 px-2 py-0.5 text-xs font-bold font-mono text-white shadow-sm backdrop-blur-md whitespace-nowrap">
                -{discountPercent}%
              </span>
            </div>
          )}
        </Link>

        {/* Card Content Body */}
        <div className="px-3.5 pt-3.5 sm:px-4 sm:pt-4">
          {/* Category Label */}
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {getProductBadgeLabel(product)}
          </p>

          {/* Product Title */}
          <Link
            href={`/products/${slug}`}
            className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug min-h-[2.5rem]">
              {title}
            </h3>
          </Link>
        </div>
      </div>

      <div className="mx-3.5 mb-3.5 sm:mx-4 sm:mb-4 mt-3.5 pt-3 border-t border-border">
        {/* Price & Stock Row */}
        <div className="flex items-center justify-between gap-1 mb-3">
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold text-foreground tracking-tight whitespace-nowrap font-mono">
              {formatVND(price)}
              {isSMM && (
                <span className="text-xs font-normal text-muted-foreground ml-1 font-sans">
                  /lượt
                </span>
              )}
            </div>
            {originalPrice && originalPrice > price && (
              <div className="text-xs text-muted-foreground line-through font-mono">
                {formatVND(originalPrice)}
              </div>
            )}
          </div>

          {/* 3-Tier Live Stock Indicator */}
          <div className="shrink-0">
            {hideExactStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                {isYoutube ? "Gia hạn 24/7" : isAccountUpgrade ? "Nhận nâng 24/7" : "Sẵn hàng"}
              </span>
            ) : stockCount > 5 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                Sẵn hàng ({stockCount})
              </span>
            ) : stockCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                Còn ít ({stockCount})
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
              onClick={() => onQuickView(product)}
              className="flex min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring transition-all"
              title="Xem nhanh"
              aria-label={`Xem nhanh ${title}`}
            >
              <Eye className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/products/${slug}`}
              className="flex min-h-[44px] min-w-[44px] h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring transition-all"
              title="Chi tiết"
              aria-label={`Xem chi tiết ${title}`}
            >
              <Eye className="h-4 w-4" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${slug}`}
              className="flex min-h-[44px] h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 px-3 text-xs sm:text-sm font-bold shadow-sm shadow-primary/25 transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>{isAccountUpgrade ? "Nâng cấp ngay" : "Mua ngay"}</span>
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
      </div>
    </div>
  );
}
