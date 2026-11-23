import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ChevronRight,
  ShieldCheck,
  Clock,
  Send,
} from "lucide-react";
import { getProductBySlug } from "@/services/catalog.service";
import ProductPurchaseBox from "@/components/ProductPurchaseBox";
import ProductDetailTabs from "@/components/ProductDetailTabs";
import { getProductTypeInfo } from "@/lib/product-types";
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
  const slugLower = product.slug.toLowerCase();

  const isChatGPT =
    slugLower.includes("chatgpt") ||
    titleLower.includes("chatgpt") ||
    titleLower.includes("openai") ||
    titleLower.includes("gpt-4");

  const isChatGPTFree = slugLower.includes("free-verify-phone") || titleLower.includes("free verify phone");
  const isChatGPTBusiness = slugLower.includes("business") || titleLower.includes("business");
  const isChatGPTPlusBHF = (slugLower.includes("bhf") || titleLower.includes("bhf") || titleLower.includes("bảo hành full")) && !isChatGPTBusiness;
  const isChatGPTPlus24H = isChatGPT && !isChatGPTFree && !isChatGPTBusiness && !isChatGPTPlusBHF;

  const isCapCut = slugLower.includes("capcut") || titleLower.includes("capcut");
  const isCapCut7D = isCapCut && (slugLower.includes("7-ngay") || titleLower.includes("7 ngày"));
  const isCapCut30D = isCapCut && !isCapCut7D;

  const isCodex =
    slugLower.includes("codex") ||
    slugLower.includes("cdx") ||
    titleLower.includes("codex");

  const isClaude =
    slugLower.includes("claude") ||
    titleLower.includes("claude");

  const isApiKeyProduct =
    isClaude ||
    isCodex ||
    slugLower.includes("api") ||
    titleLower.includes("api") ||
    product.category?.slug === "ai-api";

  const isSuno = slugLower.includes("suno") || titleLower.includes("suno");
  const isHMA = slugLower.includes("hma") || titleLower.includes("hma");
  const isYoutube = slugLower.includes("youtube") || titleLower.includes("youtube");
  const isGeminiSlot = slugLower.includes("gemini") && slugLower.includes("slot");
  const isGeminiFamily =
    slugLower.includes("gemini") &&
    (slugLower.includes("chu-family") || slugLower.includes("family")) &&
    !isGeminiSlot;
  const isGeminiUpPro5TB = slugLower.includes("up-gemini-pro-5tb") || titleLower.includes("up pro 5tb");
  const isGeminiKBH = !isGeminiUpPro5TB && slugLower.includes("gemini") && (slugLower.includes("kbh") || titleLower.includes("kbh") || titleLower.includes("2 năm") || slugLower.includes("2-nam"));

  const deliveryFormat = isSMM
    ? "Tự động chạy theo link"
    : isYoutube
    ? "Gửi thư mời vào Gmail chính chủ"
    : isGeminiUpPro5TB
    ? "Nâng trực tiếp trên Gmail của bạn"
    : isCodex
    ? "Cấp Key mới hoặc nạp Key cũ 24/7"
    : isChatGPTFree
    ? "Cấp sẵn Email | Pass (Đã xác minh SĐT)"
    : isChatGPTBusiness
    ? "Cấp sẵn tài khoản Workspace Business"
    : isChatGPT
    ? "Cấp sẵn tài khoản riêng (Email | Pass)"
    : isCapCut
    ? "Cấp sẵn tài khoản (Dùng 1 thiết bị)"
    : isGeminiSlot
    ? "Cấp link nâng Gmail chính chủ 24/7"
    : isGeminiFamily
    ? "Cấp sẵn tài khoản Chủ Family 5TB"
    : product.type === "LICENSE_KEY"
    ? "Nhận mã Key ngay sau thanh toán"
    : product.type === "ACCOUNT"
    ? "Nhận tài khoản ngay sau thanh toán"
    : "Giao tự động 24/7";

  const durationLabel = isSMM
    ? "Theo số lượng đặt mua"
    : isYoutube
    ? "Hạn 30 ngày (1 tháng)"
    : isGeminiUpPro5TB
    ? "Hạn 12 tháng (5TB)"
    : isCodex
    ? "Không giới hạn thời hạn (Trừ theo Credit)"
    : isClaude
    ? "Tính theo hạn mức Credit đã chọn"
    : isChatGPTFree
    ? "Sử dụng vĩnh viễn"
    : isChatGPTBusiness || isChatGPTPlusBHF || isChatGPTPlus24H
    ? "Hạn 30 ngày (1 tháng)"
    : isCapCut7D
    ? "Hạn 7 ngày"
    : isCapCut30D
    ? "Hạn 30 ngày"
    : isGeminiFamily
    ? "Hạn 90 ngày (3 tháng)"
    : isGeminiSlot
    ? "Hạn 12 tháng (1 năm)"
    : isGeminiKBH || titleLower.includes("2 năm") || slugLower.includes("2-nam")
    ? "Hạn 24 tháng (2 năm)"
    : isSuno
    ? "Hạn 30 ngày (2.500 Credits)"
    : titleLower.includes("18 tháng")
    ? "Hạn 18 tháng"
    : titleLower.includes("12 tháng") || titleLower.includes("1 năm")
    ? "Hạn 12 tháng (1 năm)"
    : titleLower.includes("30 ngày") || titleLower.includes("1 tháng")
    ? "Hạn 30 ngày"
    : titleLower.includes("7 ngày")
    ? "Hạn 7 ngày"
    : titleLower.includes("3 tháng")
    ? "Hạn 3 tháng"
    : "Theo thời hạn gói";

  const warrantyLabel = isSMM
    ? "Bảo hành tụt theo server"
    : isGeminiUpPro5TB
    ? "Bảo hành kích hoạt đủ 5TB (Gói KBH)"
    : isApiKeyProduct
    ? "Bảo hành 100% số dư Credit"
    : isChatGPTFree
    ? "Bảo hành đăng nhập 24H"
    : isChatGPTBusiness || isChatGPTPlusBHF
    ? "Bảo hành 1 đổi 1 suốt 30 ngày"
    : isChatGPTPlus24H
    ? "Bảo hành đăng nhập 24H"
    : isCapCut
    ? "Bảo hành 1 đổi 1 suốt thời hạn"
    : isGeminiKBH
    ? "Bảo hành đăng nhập 2H (Gói KBH)"
    : titleLower.includes("bh 3 tháng") || titleLower.includes("bảo hành 3 tháng")
    ? "Bảo hành 3 tháng 1 đổi 1"
    : titleLower.includes("bh 1 tuần") || titleLower.includes("bảo hành 1 tuần")
    ? "Bảo hành 7 ngày 1 đổi 1"
    : isSuno
    ? "Bảo hành đăng nhập 24H & đủ 2.500 Credits"
    : isHMA
    ? "Bảo hành 1 đổi 1 suốt 30 ngày (5 máy)"
    : "Bảo hành 1 đổi 1 đúng cam kết";

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

            {/* Compact 3-pill Summary Bar (Replaces redundant price row & bulky 4-box grid) */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 font-medium text-foreground">
                <Send className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{deliveryFormat}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 font-medium text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{durationLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-1.5 font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                <span>{warrantyLabel}</span>
              </span>
            </div>
          </div>

          {/* Product Media Card */}
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
            <img
              src={resolvedThumbnail}
              alt={product.title}
              className="h-full w-full object-contain rounded-xl"
            />
          </div>

          {/* Contextual Product Tabs */}
          <ProductDetailTabs
            product={product}
            guide={guide}
            isCodex={isCodex}
            isClaude={isClaude}
            isApiKeyProduct={isApiKeyProduct}
            isChatGPT={isChatGPT}
            isChatGPTBHF={isChatGPTPlusBHF}
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
