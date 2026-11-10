import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Clock,
  Headphones,
  Send,
  Sparkles,
} from "lucide-react";
import { getProductBySlug } from "@/services/catalog.service";
import ProductPurchaseBox from "@/components/ProductPurchaseBox";
import ProductDetailTabs from "@/components/ProductDetailTabs";
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
      title: "Không tìm thấy sản phẩm - DaiTruong Store",
    };
  }

  return {
    title: `${product.title} - DaiTruong Store`,
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
  const isChatGPT =
    product.slug.toLowerCase().includes("chatgpt") ||
    titleLower.includes("chatgpt") ||
    titleLower.includes("openai") ||
    titleLower.includes("gpt-4");

  const isChatGPTBHF =
    product.slug.toLowerCase().includes("bhf") ||
    titleLower.includes("bhf") ||
    titleLower.includes("bảo hành full");

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
    : isCodex
    ? "Nạp vào Key có sẵn hoặc cấp Key mới tức thì 24/7"
    : isChatGPT
    ? "Tài khoản (Email | Mật khẩu) bàn giao tức thì 24/7"
    : product.type === "LICENSE_KEY"
    ? "Mã bản quyền / API Key cấp tức thì sau thanh toán"
    : product.type === "ACCOUNT"
    ? "Tài khoản riêng tư / Link kích hoạt chính chủ"
    : "Bàn giao tự động qua hệ thống 24/7";

  const durationLabel = isSMM
    ? "Hoàn thành theo số lượng đặt mua"
    : isCodex
    ? "Bảo lưu vĩnh viễn (Dùng đến khi hết Quota)"
    : isClaude
    ? "Bảo lưu theo hạn mức Credit / Request đã chọn"
    : isChatGPTBHF
    ? "30 ngày bảo hành Full Date (BHF)"
    : isChatGPT
    ? "30 ngày sử dụng (BH đăng nhập 24H)"
    : titleLower.includes("18 tháng")
    ? "18 tháng đầy đủ (Full date)"
    : titleLower.includes("12 tháng") || titleLower.includes("1 năm")
    ? "12 tháng (1 năm) bản quyền"
    : titleLower.includes("30 ngày") || titleLower.includes("1 tháng")
    ? "30 ngày đầy đủ"
    : titleLower.includes("3 tháng")
    ? "90 ngày (3 tháng)"
    : "Theo gói dịch vụ đã chọn";

  const isSuno = slug.includes("suno") || titleLower.includes("suno");
  const isHMA = slug.includes("hma") || titleLower.includes("hma");
  const isGeminiKBH = slug.includes("gemini") && (slug.includes("family") || slug.includes("kbh") || titleLower.includes("kbh"));

  const warrantyLabel = isSMM
    ? "Bảo hành duy trì số lượng theo server"
    : isApiKeyProduct
    ? "Bảo đảm kết nối ổn định & bảo lưu hạn mức trọn vẹn"
    : isChatGPTBHF
    ? "1 Đổi 1 Trọn Vẹn 30 Ngày (Gói BHF Cao Cấp)"
    : isChatGPT
    ? "Bảo hành đăng nhập 24H (Gói Tiết Kiệm - Chuẩn NCC)"
    : isGeminiKBH
    ? "Bảo hành đăng nhập 2H (Gói Trải Nghiệm - KBH)"
    : isSuno
    ? "Bảo hành đăng nhập 24H & 2.500 Credits ban đầu"
    : isHMA
    ? "Bảo hành kích hoạt 5 thiết bị trong suốt thời hạn key"
    : titleLower.includes("gemini") || titleLower.includes("duolingo")
    ? "1 đổi 1 trong 24h kích hoạt & hỗ trợ suốt thời hạn"
    : "Bảo hành 1 đổi 1 theo đúng cam kết từng gói";

  const unitLabel = product.title.toLowerCase().includes("follow")
    ? "follow"
    : product.title.toLowerCase().includes("tim")
    ? "tim"
    : product.title.toLowerCase().includes("like")
    ? "like"
    : "lượt";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8 pb-28 lg:pb-16">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-primary transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <Link
          href={`/?category=${product.category.slug}#catalog`}
          className="hover:text-primary transition-colors"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="truncate max-w-[200px] sm:max-w-md text-foreground font-medium">
          {product.title}
        </span>
      </nav>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left column: Overview, Media, Details, and Dual Tabs */}
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

              <span className="inline-flex items-center rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {product.category.name}
              </span>

              {discountPercent > 0 && (
                <span className="rounded-lg bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground shadow-xs">
                  Tiết kiệm {discountPercent}%
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
              {product.title}
            </h1>

            {/* Price Row */}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-primary font-mono">
                {formatVND(product.price)}
              </span>
              {isSMM && (
                <span className="text-sm font-medium text-muted-foreground">
                  / 1 {unitLabel}
                </span>
              )}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base text-muted-foreground line-through font-mono">
                  {formatVND(product.originalPrice)}
                </span>
              )}
            </div>

            {isCodex && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/10 p-3.5 flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="text-xs text-foreground">
                  <span className="font-semibold">Bạn đã có API Key từ trước?</span>
                  <p className="mt-0.5 text-muted-foreground">
                    Không cần mua key mới! Bạn có thể{" "}
                    <Link href="/codex" className="font-bold text-primary underline hover:text-primary/80">
                      vào đây để nạp thêm hạn mức thẳng vào key cũ của bạn
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Product Media Card */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
            <img
              src={resolvedThumbnail}
              alt={product.title}
              className="h-full w-full object-contain rounded-xl"
            />
          </div>

          {/* Standardized Product Specification Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hình thức nhận hàng</span>
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{deliveryFormat}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thời hạn sử dụng</span>
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{durationLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chính sách bảo hành</span>
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug">{warrantyLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-secondary/50 border border-border">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Headphones className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hỗ trợ kỹ thuật</span>
                <p className="text-xs font-semibold text-foreground mt-0.5 leading-snug">Đồng hành 24/7 qua Zalo &amp; Telegram</p>
              </div>
            </div>
          </div>

          {/* Dual-Level Tabs: Beginner Onboarding vs Developer Gateway Specs */}
          <ProductDetailTabs
            product={product}
            guide={guide}
            isCodex={isCodex}
            isClaude={isClaude}
            isApiKeyProduct={isApiKeyProduct}
            isChatGPT={isChatGPT}
            isChatGPTBHF={isChatGPTBHF}
          />
        </div>

        {/* Right column: Sticky Purchase Configuration Box */}
        <div className="lg:col-span-5">
          <div id="purchase-config-box" className="sticky top-20">
            <ProductPurchaseBox
              productId={product.id}
              price={product.price}
              originalPrice={product.originalPrice}
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
