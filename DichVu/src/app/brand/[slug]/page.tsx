import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { getCategoriesWithProducts } from "@/services/catalog.service";
import { BRAND_NAVIGATOR_ITEMS, matchProductBrand } from "@/lib/brand-matching";
import BrandLogo from "@/components/BrandLogo";
import ProductCard from "@/components/ProductCard";
import { ArrowLeft, Sparkles, ShieldCheck, Zap, PackageCheck } from "lucide-react";

export const dynamic = "force-dynamic";

interface BrandPageProps {
  params: {
    slug: string;
  };
  searchParams?: {
    type?: string;
  };
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const brandSlug = params.slug.toLowerCase();
  const brandItem = BRAND_NAVIGATOR_ITEMS.find((b) => b.id === brandSlug);
  const brandName = brandItem ? brandItem.name : brandSlug.toUpperCase();

  return {
    title: `${brandName} Bản Quyền Tự Động 24/7 | Kho DEE Store`,
    description: `Mua tài khoản và key bản quyền ${brandName} chính chủ, kích hoạt tự động < 30s, bảo hành 1-đổi-1 uy tín tại Kho DEE Store.`,
  };
}

export default async function BrandPage({ params, searchParams }: BrandPageProps) {
  const brandSlug = params.slug.toLowerCase();
  const brandItem = BRAND_NAVIGATOR_ITEMS.find((b) => b.id === brandSlug);

  // Retrieve all active categories and products
  const categories = await getCategoriesWithProducts();

  // Flatten and match products strictly belonging to this brand
  const matchedProducts: any[] = [];
  categories.forEach((cat) => {
    cat.products.forEach((prod) => {
      const flattened = {
        ...prod,
        category: {
          name: cat.name,
          slug: cat.slug,
        },
      };
      if (matchProductBrand(flattened, brandSlug)) {
        // If sub-type requested (e.g. account vs api)
        if (searchParams?.type === "account") {
          const t = prod.title.toLowerCase();
          if (t.includes("api") || t.includes("codex")) return;
        } else if (searchParams?.type === "api") {
          const t = prod.title.toLowerCase();
          if (!t.includes("api") && !t.includes("codex")) return;
        }
        matchedProducts.push(flattened);
      }
    });
  });

  const displayName = brandItem ? brandItem.name : brandSlug.toUpperCase();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* 1. Breadcrumb & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-slate-400 dark:text-zinc-500">Thương hiệu</span>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white capitalize">{displayName}</span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition-all hover:-translate-x-0.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tất cả sản phẩm</span>
        </Link>
      </div>

      {/* 2. Sleek Dedicated Brand Header Card (NO Giant Generic Home Hero!) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-900 via-[#0a1020] to-slate-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            {/* Brand Emblem */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-lg shrink-0">
              <BrandLogo brandName={brandItem ? brandItem.iconKey : brandSlug} className="w-8 h-8 sm:w-9 sm:h-9" size={36} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                  {displayName}
                </h1>
                {brandItem?.badge && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-wider">
                    {brandItem.badge}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                Tài khoản & gói dịch vụ {displayName} chính chủ, kích hoạt tự động 24/7 với chế độ bảo hành 1-đổi-1 uy tín.
              </p>
            </div>
          </div>

          {/* Value Badges */}
          <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 text-xs text-zinc-300">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Giao tự động &lt; 30s</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bảo hành 1-đổi-1</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <PackageCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>{matchedProducts.length} dịch vụ sẵn có</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Product Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Danh sách gói & tài khoản
            </h2>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              ({matchedProducts.length} sản phẩm)
            </span>
          </div>
        </div>

        {matchedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {matchedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-card/40 p-12 text-center">
            <p className="text-sm text-slate-500 dark:text-zinc-400 mb-4">
              Hiện tại các gói của {displayName} đang tạm hết hàng hoặc đang được bổ sung kho.
            </p>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              Xem các sản phẩm khác
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
