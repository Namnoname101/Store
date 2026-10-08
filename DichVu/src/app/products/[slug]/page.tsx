import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { getProductBySlug } from "@/services/catalog.service";
import ProductPurchaseBox from "@/components/ProductPurchaseBox";
import { getProductTypeInfo, formatVND } from "@/lib/product-types";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm - Daitruong Store",
    };
  }

  return {
    title: `${product.title} - Daitruong Store`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await Promise.resolve(params);
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const typeInfo = getProductTypeInfo(product.type);
  const TypeIcon = typeInfo.icon;

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) * 100
        )
      : 0;

  const isSMM =
    product.category?.slug === "dich-vu-mxh" ||
    product.title.toLowerCase().includes("tiktok") ||
    product.title.toLowerCase().includes("facebook") ||
    product.title.toLowerCase().includes("tim") ||
    product.title.toLowerCase().includes("like") ||
    product.title.toLowerCase().includes("follow");

  const unitLabel = product.title.toLowerCase().includes("follow")
    ? "follow"
    : product.title.toLowerCase().includes("tim")
    ? "tim"
    : product.title.toLowerCase().includes("like")
    ? "like"
    : "lượt";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 pb-20">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:text-blue-600 dark:hover:text-white transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <Link
          href={`/?category=${product.category.slug}#catalog`}
          className="hover:text-blue-600 dark:hover:text-white transition-colors"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="truncate max-w-[200px] sm:max-w-md text-slate-800 dark:text-slate-200 font-medium">
          {product.title}
        </span>
      </nav>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left column: Overview, Media, and Details */}
        <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-8">
          {/* Header Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${typeInfo.badgeClass}`}
              >
                <TypeIcon className="h-3.5 w-3.5" />
                {typeInfo.label}
              </span>

              <span className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                {product.category.name}
              </span>

              {discountPercent > 0 && (
                <span className="rounded-lg bg-rose-600 px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                  Tiết kiệm {discountPercent}%
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
              {product.title}
            </h1>

            {/* Price Row */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                {formatVND(product.price)}
              </span>
              {isSMM && (
                <span className="text-sm font-medium text-slate-500">
                  / 1 {unitLabel}
                </span>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base text-slate-400 line-through">
                  {formatVND(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Product Media Card (4:3 or standard ratio, clean look) */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={product.title}
                className="h-full w-full object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400">
                  <TypeIcon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã bản quyền / Tài khoản số cấp phát tự động 24/7
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Product Description */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-8 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Mô tả sản phẩm & Hướng dẫn sử dụng</span>
            </h2>

            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line space-y-4">
              {product.description}
            </div>

            {/* Feature Highlights List */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3.5">
                Đặc quyền cam kết dịch vụ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Kích hoạt tự động trực tuyến 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Bảo hành suốt thời hạn sử dụng cam kết</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Hỗ trợ kỹ thuật qua UltraViewer nếu gặp sự cố</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Nhận mã kích hoạt tức thì sau khi quét VietQR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Sticky Purchase Configuration Box */}
        <div className="lg:col-span-5">
          <div className="sticky top-20">
            <ProductPurchaseBox
              productId={product.id}
              price={product.price}
              stockCount={product.stockCount}
              productTitle={product.title}
              slug={product.slug}
              thumbnailUrl={product.thumbnailUrl}
              fulfillmentType={product.type}
              categorySlug={product.category.slug}
              requiresLink={isSMM}
              isCustomQuantity={isSMM}
              minQuantity={product.minQuantity || (isSMM ? 50 : 1)}
              maxQuantity={product.maxQuantity || null}
              unitLabel={unitLabel}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
