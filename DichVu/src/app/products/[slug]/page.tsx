import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { getProductBySlug } from "@/services/catalog.service";
import ProductPurchaseBox from "@/components/ProductPurchaseBox";
import { getProductTypeInfo, formatVND } from "@/components/ProductCard";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return {
      title: "Không tìm thấy sản phẩm - DigiStore.vn",
    };
  }

  return {
    title: `${product.title} - Bản Quyền Tự Động | DigiStore.vn`,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const product = await getProductBySlug(params.slug);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-20">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-slate-400">
        <Link href="/" className="hover:text-white transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
        <Link
          href={`/?category=${product.category.slug}#catalog`}
          className="hover:text-white transition-colors"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-600" />
        <span className="truncate max-w-[200px] sm:max-w-md text-slate-200 font-medium">
          {product.title}
        </span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left column: Product Overview & Details */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Header Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold backdrop-blur-md ${typeInfo.badgeClass}`}
              >
                <TypeIcon className="h-3.5 w-3.5" />
                {typeInfo.label}
              </span>

              <span className="inline-flex items-center rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400">
                {product.category.name}
              </span>

              {discountPercent > 0 && (
                <span className="rounded-lg bg-rose-500/90 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                  Tiết kiệm {discountPercent}%
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
              {product.title}
            </h1>

            {/* Price Preview */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-indigo-400">
                {formatVND(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base text-slate-500 line-through">
                  {formatVND(product.originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Product Media Card */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 p-8 shadow-inner">
            {product.thumbnailUrl ? (
              <img
                src={product.thumbnailUrl}
                alt={product.title}
                className="h-full w-full object-contain rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-950/50">
                  <TypeIcon className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-200">
                    {product.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Mã bản quyền / Tài khoản số cấp phát tự động
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Product Description */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              <span>Mô tả & Hướng dẫn sử dụng</span>
            </h2>

            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line space-y-4">
              {product.description}
            </div>

            {/* Feature Highlights List */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Đặc quyền khi mua sản phẩm này
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Kích hoạt online trực tiếp 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Bảo hành 1-đổi-1 suốt thời gian sử dụng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Hỗ trợ kỹ thuật qua UltraViewer nếu cần</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Nhận mã kích hoạt ngay trên màn hình</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Sticky Purchase Box */}
        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <ProductPurchaseBox
              productId={product.id}
              price={product.price}
              stockCount={product.stockCount}
              productTitle={product.title}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
