"use client";

import Link from "next/link";
import { KeyRound, UserCheck, GraduationCap, ArrowRight, Eye } from "lucide-react";
import type { Product } from "@prisma/client";

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

import { formatVND, getProductTypeInfo } from "@/lib/product-types";
export { formatVND, getProductTypeInfo };

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { title, slug, price, originalPrice, type, stockCount, thumbnailUrl } = product;
  const typeInfo = getProductTypeInfo(type);
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

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800/90 bg-white dark:bg-slate-900/80 p-2.5 sm:p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md hover:shadow-blue-500/5 dark:hover:shadow-blue-950/20">
      <div>
        {/* Compact 16:10 Aspect Ratio Product Image */}
        <div className="relative mb-2 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                <TypeIcon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium">{typeInfo.shortLabel}</span>
            </div>
          )}

          {/* Type Badge */}
          <div className="absolute top-1.5 left-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold backdrop-blur-md ${typeInfo.badgeClass}`}
            >
              <TypeIcon className="h-2.5 w-2.5" />
              {typeInfo.shortLabel}
            </span>
          </div>

          {/* Discount Badge (Only if real discount) */}
          {discountPercent > 0 && (
            <div className="absolute top-1.5 right-1.5">
              <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white shadow-xs">
                -{discountPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Category Name */}
        {product.category && (
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 truncate">
            {product.category.name}
          </p>
        )}

        {/* Product Title */}
        <Link href={`/products/${slug}`} className="block">
          <h3 className="line-clamp-2 text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug min-h-[2.1rem]">
            {title}
          </h3>
        </Link>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Price & Real Availability Row */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {formatVND(price)}
              {isSMM && (
                <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 ml-0.5">
                  /lượt
                </span>
              )}
            </div>
            {originalPrice && originalPrice > price && (
              <div className="text-[10px] text-slate-400 line-through">
                {formatVND(originalPrice)}
              </div>
            )}
          </div>

          {/* Real Stock Status */}
          <div className="shrink-0">
            {isSMM || stockCount >= 99999 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Có sẵn
              </span>
            ) : inStock ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-medium text-blue-700 dark:text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                Còn {stockCount}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-medium text-rose-600 dark:text-rose-400">
                Hết hàng
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons: Compact row with Quick View icon button + Buy Now button */}
        <div className="flex items-center gap-1.5">
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              title="Xem nhanh"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              href={`/products/${slug}`}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              title="Chi tiết"
            >
              <Eye className="h-3.5 w-3.5" />
            </Link>
          )}

          {inStock ? (
            <Link
              href={`/products/${slug}`}
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
      </div>
    </div>
  );
}
