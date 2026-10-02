import Link from "next/link";
import { KeyRound, UserCheck, GraduationCap, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import type { Product } from "@prisma/client";

export interface ProductCardProps {
  product: Product & {
    stockCount: number;
    category?: {
      name: string;
      slug: string;
    };
  };
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function getProductTypeInfo(type: string) {
  switch (type) {
    case "LICENSE_KEY":
      return {
        label: "Key Bản Quyền",
        shortLabel: "Key",
        icon: KeyRound,
        badgeClass: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      };
    case "ACCOUNT":
      return {
        label: "Tài Khoản",
        shortLabel: "Tài khoản",
        icon: UserCheck,
        badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      };
    case "COURSE_LINK":
      return {
        label: "Khóa Học",
        shortLabel: "Khóa học",
        icon: GraduationCap,
        badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      };
    default:
      return {
        label: "Sản phẩm số",
        shortLabel: "Digital",
        icon: KeyRound,
        badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      };
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const { title, slug, price, originalPrice, type, stockCount, thumbnailUrl } = product;
  const typeInfo = getProductTypeInfo(type);
  const TypeIcon = typeInfo.icon;
  const inStock = stockCount > 0;

  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-indigo-950/20">
      <div>
        {/* Thumbnail or placeholder */}
        <div className="relative mb-3.5 flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 via-slate-850 to-slate-900 border border-slate-800/60">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-500 group-hover:text-indigo-400 transition-colors">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700/50 shadow-inner">
                <TypeIcon className="h-7 w-7" />
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                {typeInfo.shortLabel}
              </span>
            </div>
          )}

          {/* Product Type Badge */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide backdrop-blur-md ${typeInfo.badgeClass}`}
            >
              <TypeIcon className="h-3 w-3" />
              {typeInfo.shortLabel}
            </span>
          </div>

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <div className="absolute top-2.5 right-2.5">
              <span className="rounded-md bg-rose-500/90 px-1.5 py-0.5 text-[11px] font-bold text-white shadow-sm">
                -{discountPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Category name if available */}
        {product.category && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-400/90">
            {product.category.name}
          </p>
        )}

        {/* Title */}
        <Link href={`/products/${slug}`} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors leading-snug">
            {title}
          </h3>
        </Link>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/70">
        {/* Price & Stock Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <div className="text-base font-bold text-white tracking-tight">
              {formatVND(price)}
            </div>
            {originalPrice && originalPrice > price && (
              <div className="text-xs text-slate-500 line-through">
                {formatVND(originalPrice)}
              </div>
            )}
          </div>

          {/* Stock Tag */}
          <div>
            {inStock ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Còn {stockCount} hàng
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/25 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-medium text-rose-400">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Hết hàng
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/products/${slug}`}
            className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
          >
            Xem chi tiết
          </Link>
          {inStock ? (
            <Link
              href={`/products/${slug}`}
              className="flex items-center justify-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all"
            >
              <span>Mua ngay</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          ) : (
            <button
              disabled
              className="flex items-center justify-center rounded-xl bg-slate-800 px-2.5 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
            >
              Hết hàng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
