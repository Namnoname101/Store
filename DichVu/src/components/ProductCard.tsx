"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Zap } from "lucide-react";
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

  const inStock = isSMM || stockCount > 0;

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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/90 dark:border-white/10 bg-white/90 dark:bg-zinc-900/60 p-3 sm:p-3.5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 dark:hover:border-blue-400/30 hover:shadow-xl hover:shadow-blue-500/10">
      <div>
        {/* Compact 16:10 Aspect Ratio Product Image */}
        <div className="relative mb-2.5 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-950/60">
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
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-900/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs backdrop-blur-md">
              <TypeIcon className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
              {typeInfo.shortLabel}
            </span>
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2">
              <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                -{discountPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Category Label */}
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 truncate">
          {getProductBadgeLabel(product)}
        </p>

        {/* Product Title */}
        <Link href={`/products/${slug}`} className="block">
          <h3 className="line-clamp-2 text-xs sm:text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug min-h-[2.1rem]">
            {title}
          </h3>
        </Link>
      </div>

      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-white/10">
        {/* Price & Stock Row */}
        <div className="flex items-center justify-between gap-1 mb-2.5">
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-white tracking-tight truncate font-mono">
              {formatVND(price)}
              {isSMM && (
                <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 ml-0.5 font-sans">
                  /lượt
                </span>
              )}
            </div>
            {originalPrice && originalPrice > price && (
              <div className="text-[10px] text-zinc-400 line-through font-mono">
                {formatVND(originalPrice)}
              </div>
            )}
          </div>

          {/* Live Stock Indicator */}
          <div className="shrink-0">
            {isSMM || stockCount >= 99999 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sẵn kho
              </span>
            ) : inStock ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Còn {stockCount}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-500">
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
              onClick={() => onQuickView(product)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              title="Xem nhanh"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              href={`/products/${slug}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
              title="Chi tiết"
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${slug}`}
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-2 text-[11px] sm:text-xs font-bold text-white shadow-md shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              <span>Mua ngay</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <button
              disabled
              className="flex h-8 flex-1 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-[11px] sm:text-xs font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
            >
              Hết hàng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
