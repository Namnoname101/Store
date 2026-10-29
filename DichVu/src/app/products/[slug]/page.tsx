import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  BookOpen,
  ShieldCheck,
  Clock,
  Headphones,
  Send,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { getProductBySlug } from "@/services/catalog.service";
import ProductPurchaseBox from "@/components/ProductPurchaseBox";
import ClaudeApiGuideHub from "@/components/ClaudeApiGuideHub";
import CodexApiGuideHub from "@/components/CodexApiGuideHub";
import { getProductTypeInfo, formatVND } from "@/lib/product-types";
import { resolveProductInstruction } from "@/lib/product-guides";
import { resolveProductThumbnail } from "@/lib/catalog-grouping";

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

  const guide = resolveProductInstruction({
    slug: product.slug,
    title: product.title,
    type: product.type,
  });

  const typeInfo = getProductTypeInfo(product.type, {
    categorySlug: product.category?.slug,
    title: product.title,
  });
  const TypeIcon = typeInfo.icon;

  const resolvedThumbnail = resolveProductThumbnail(
    product.title,
    product.slug,
    product.thumbnailUrl,
    product.category?.slug
  );

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

  const titleLower = product.title.toLowerCase();
  const isCodex =
    product.slug.toLowerCase().includes("codex") ||
    product.slug.toLowerCase().includes("cdx") ||
    titleLower.includes("codex");

  const isClaude =
    product.slug.toLowerCase().includes("claude") ||
    titleLower.includes("claude");

  const isApiKeyProduct =
    isClaude ||
    isCodex ||
    product.slug.toLowerCase().includes("api") ||
    titleLower.includes("api") ||
    product.category?.slug === "ai-api";

  const deliveryFormat = isSMM
    ? "Hệ thống tự động khởi tạo theo link mục tiêu"
    : product.type === "LICENSE_KEY"
    ? "Mã bản quyền / API Key cấp tức thì sau thanh toán"
    : product.type === "ACCOUNT"
    ? "Tài khoản riêng tư / Link kích hoạt chính chủ"
    : "Bàn giao tự động qua hệ thống 24/7";

  const durationLabel = isSMM
    ? "Hoàn thành theo số lượng đặt mua"
    : titleLower.includes("18 tháng")
    ? "18 tháng đầy đủ (Full date)"
    : titleLower.includes("12 tháng") || titleLower.includes("1 năm")
    ? "12 tháng (1 năm) bản quyền"
    : titleLower.includes("30 ngày") || titleLower.includes("1 tháng")
    ? "30 ngày đầy đủ"
    : titleLower.includes("3 tháng")
    ? "90 ngày (3 tháng)"
    : "Theo gói dịch vụ đã chọn";

  const warrantyLabel = isSMM
    ? "Bảo hành duy trì số lượng trong 30 ngày"
    : titleLower.includes("gemini") || titleLower.includes("duolingo")
    ? "1 đổi 1 trong 24h kích hoạt & hỗ trợ suốt 18 tháng"
    : "Bảo hành 1 đổi 1 trong suốt thời hạn sử dụng gói";

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

            {isCodex && (
              <div className="mt-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">Bạn đã có API Key từ trước?</span>
                  <p className="mt-0.5 text-blue-700 dark:text-blue-300">
                    Không cần mua key mới! Bạn có thể{" "}
                    <Link href="/codex" className="font-bold underline hover:text-blue-900 dark:hover:text-white">
                      vào đây để nạp thêm hạn mức thẳng vào key cũ của bạn
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Product Media Card (4:3 or standard ratio, clean look) */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
            <img
              src={resolvedThumbnail}
              alt={product.title}
              className="h-full w-full object-contain rounded-xl"
            />
          </div>

          {/* Standardized Product Specification Grid (Ẩn đối với sản phẩm API theo phản hồi) */}
          {!isApiKeyProduct && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4 sm:p-5 shadow-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hình thức nhận hàng</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">{deliveryFormat}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thời hạn sử dụng</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">{durationLabel}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chính sách bảo hành</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">{warrantyLabel}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                  <Headphones className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hỗ trợ kỹ thuật</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-snug">Đồng hành 24/7 qua Zalo & Telegram</p>
                </div>
              </div>
            </div>
          )}

          {/* Product Description */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Thông tin sản phẩm</span>
            </h2>

            <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>

          {/* Product Instruction Guide if available */}
          {isCodex ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Hướng dẫn cấu hình API Codex (Cursor & OpenAI Compatible)</span>
                </h2>
                <Link
                  href="/codex"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <span>Mở trang nạp hạn mức tự động</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <CodexApiGuideHub showKeyInput={true} />
            </div>
          ) : isClaude ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Hướng dẫn cấu hình & tương thích (Hỗ trợ 5 nền tảng)</span>
                </h2>
                <Link
                  href="/huong-dan/api-claude"
                  target="_blank"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <span>Mở trang hướng dẫn toàn màn hình</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <ClaudeApiGuideHub
                compactMode={false}
                showKeyInput={true}
              />
            </div>
          ) : guide && guide.steps && guide.steps.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-7 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{guide.title}</span>
              </h2>

              <div className="space-y-3.5">
                {guide.steps.map((stepItem, idx) => {
                  const isObj = typeof stepItem === "object" && stepItem !== null;
                  const text = isObj ? stepItem.text : String(stepItem);
                  const image = isObj ? stepItem.image : undefined;
                  const caption = isObj ? stepItem.caption : undefined;

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-start gap-3">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 font-mono font-bold text-xs mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-0.5">
                          {text}
                        </div>
                      </div>

                      {image && (
                        <div className="ml-8 mt-2">
                          <img
                            src={image}
                            alt={caption || `Bước ${idx + 1}`}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 max-w-md w-full object-cover"
                          />
                          {caption && (
                            <p className="mt-1 text-xs text-slate-500 italic">{caption}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {guide.note && (
                <div className="mt-5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                  <span className="font-bold shrink-0">Lưu ý bảo hành:</span>
                  <span className="leading-relaxed">{guide.note}</span>
                </div>
              )}
            </div>
          ) : null}
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
