"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
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

  const hideExactStock = isSMM || isApiKey || stockCount >= 99999;
  const inStock = hideExactStock || stockCount > 0;

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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 dark:border-zinc-800/80 bg-white/95 dark:bg-[#0b0f19] p-3.5 backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-blue-950/20">
      <div>
        {/* Aspect Ratio Product Image */}
        <div className="relative mb-3 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-100 dark:border-zinc-800/70 bg-slate-50 dark:bg-[#131926]">
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
          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 dark:border-zinc-800/90 bg-white/95 dark:bg-[#131926]/95 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-zinc-200 shadow-xs backdrop-blur-md">
              <TypeIcon className="h-3.5 w-3.5 text-zinc-700 dark:text-zinc-300" />
              {typeInfo.shortLabel}
            </span>
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2.5 right-2.5">
              <span className="rounded-lg bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-xs font-bold font-mono text-rose-600 dark:text-rose-400 shadow-xs backdrop-blur-md">
                -{discountPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Category Label */}
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
          {getProductBadgeLabel(product)}
        </p>

        {/* Product Title */}
        <Link href={`/products/${slug}`} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug min-h-[2.5rem]">
            {title}
          </h3>
        </Link>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-zinc-800/70">
        {/* Price & Stock Row */}
        <div className="flex items-center justify-between gap-1 mb-3">
          <div className="min-w-0">
            <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight whitespace-nowrap font-mono">
              {formatVND(price)}
              {isSMM && (
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-1 font-sans">
                  /lượt
                </span>
              )}
            </div>
            {originalPrice && originalPrice > price && (
              <div className="text-xs text-zinc-400 dark:text-zinc-500 line-through font-mono">
                {formatVND(originalPrice)}
              </div>
            )}
          </div>

          {/* Live Stock Indicator */}
          <div className="shrink-0">
            {hideExactStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sẵn kho
              </span>
            ) : inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Còn {stockCount}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-xs font-medium text-rose-500">
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
              onClick={() => onQuickView(product)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-slate-50 dark:bg-[#131926] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c2538] transition-colors"
              title="Xem nhanh"
              aria-label="Xem nhanh sản phẩm"
            >
              <Eye className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/products/${slug}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/90 dark:border-zinc-800/90 bg-slate-50 dark:bg-[#131926] text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1c2538] transition-colors"
              title="Chi tiết"
              aria-label="Xem chi tiết sản phẩm"
            >
              <Eye className="h-4 w-4" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${slug}`}
              className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-all duration-150 active:scale-[0.98]"
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
      </div>
    </div>
  );
}
