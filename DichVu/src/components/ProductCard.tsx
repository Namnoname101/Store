"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, UserCheck, GraduationCap, ArrowRight, Eye } from "lucide-react";
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

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-950 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-400 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-950/5 dark:hover:shadow-zinc-950/30">
      <div>
        {/* Compact 16:10 Aspect Ratio Product Image */}
        <div className="relative mb-2.5 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60">
          <img
            src={resolvedThumbnail}
            alt={title}
            onError={() => {
              if (!imgError) {
                setImgError(true);
              }
            }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Type Badge */}
          <div className="absolute top-2 left-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 px-2 py-0.5 text-[10px] font-semibold text-zinc-800 dark:text-zinc-200 shadow-xs backdrop-blur-md"
            >
              <TypeIcon className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
              {typeInfo.shortLabel}
            </span>
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2">
              <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                -{discountPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Category Badge Name */}
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

      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
        {/* Price & Real Availability Row */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white tracking-tight truncate">
              {formatVND(price)}
              {isSMM && (
                <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400 ml-0.5 font-mono">
                  /lượt
                </span>
              )}
            </div>
            {originalPrice && originalPrice > price && (
              <div className="text-[10px] text-zinc-400 line-through">
                {formatVND(originalPrice)}
              </div>
            )}
          </div>

          {/* Real Stock Status */}
          <div className="shrink-0">
            {isSMM || stockCount >= 99999 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/30 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Có sẵn
              </span>
            ) : inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:text-zinc-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Còn {stockCount}
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
              onClick={() => onQuickView(product)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Xem nhanh"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              href={`/products/${slug}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Chi tiết"
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${slug}`}
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
      </div>
    </div>
  );
}
