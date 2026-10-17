import { Search, ArrowRight, Zap, ShieldCheck, Clock } from "lucide-react";
import { getCategoriesWithProducts, getAllCategories } from "@/services/catalog.service";
import CatalogExplorer from "@/components/CatalogExplorer";
import BrandLogo from "@/components/BrandLogo";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams?: {
    category?: string;
    search?: string;
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const categorySlug = searchParams?.category;
  const search = searchParams?.search;

  // Retrieve categories with products and live stock count (pass full catalog to CatalogExplorer)
  const categories = await getCategoriesWithProducts(undefined, search);
  const allCategories = await getAllCategories();

  return (
    <div className="flex flex-col gap-10 sm:gap-14 pb-20">
      {/* Modern Tech Studio Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16 pb-12 sm:pb-16 border-b border-zinc-200/80 dark:border-zinc-850 bg-radial-[at_50%_0%] from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs backdrop-blur-md mb-5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống cấp phát tự động 24/7 qua VietQR</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.15]">
              Kho API & Tài nguyên số <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">chất lượng cao</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              API Claude, OpenAI, Cursor, Codex Credit và bản quyền số. Cấp phát tức thì sau 3 giây quét mã, không cần chờ đợi.
            </p>

            {/* Search Input Box - Tech Studio Style */}
            <form
              action="/"
              method="GET"
              className="mt-8 w-full max-w-2xl relative flex items-center group"
            >
              <div className="relative w-full flex items-center rounded-xl border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-sm transition-all focus-within:border-zinc-600 dark:focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-400/20">
                <Search className="absolute left-4 h-4 w-4 text-zinc-400 group-focus-within:text-zinc-700 dark:group-focus-within:text-zinc-300 transition-colors" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search || ""}
                  placeholder="Tìm gói API Claude, Cursor, CapCut, Codex, Office..."
                  className="w-full bg-transparent py-3.5 pl-11 pr-28 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2 rounded-lg bg-zinc-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-2xs"
                >
                  Tìm kiếm
                </button>
              </div>
            </form>

            {/* Quick Brand Badges */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="text-zinc-400 text-xs mr-1 font-mono">Top tìm kiếm:</span>
              <a
                href="/?search=claude#catalog"
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/80 px-2.5 py-1 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <BrandLogo brandName="claude" size={12} className="w-3 h-3 text-amber-600" />
                Claude API
              </a>
              <a
                href="/?search=cursor#catalog"
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/80 px-2.5 py-1 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <BrandLogo brandName="cursor" size={12} className="w-3 h-3 text-cyan-500" />
                Cursor AI
              </a>
              <a
                href="/codex"
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/80 px-2.5 py-1 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <BrandLogo brandName="codex" size={12} className="w-3 h-3 text-emerald-500" />
                Codex Topup
              </a>
              <a
                href="/?search=capcut#catalog"
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/80 px-2.5 py-1 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <BrandLogo brandName="capcut" size={12} className="w-3 h-3" />
                CapCut Pro
              </a>
              <a
                href="/?search=deepseek#catalog"
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/80 px-2.5 py-1 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <BrandLogo brandName="deepseek" size={12} className="w-3 h-3 text-blue-500" />
                DeepSeek
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <CatalogExplorer
          categories={categories}
          allCategories={allCategories}
          initialCategory={categorySlug || "all"}
          initialSearch={search || ""}
        />
      </section>

      {/* Feature Pillars: Clean Tech Studio Style */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950 py-12"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col p-6 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/60">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-zinc-400">01</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Chọn gói & Tạo đơn tức thì
              </h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Tùy chọn dung lượng hoặc hạn mức ngay trên card sản phẩm. Không bắt buộc đăng ký tài khoản rườm rà.
              </p>
            </div>

            <div className="flex flex-col p-6 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/60">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-zinc-400">02</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Quét VietQR tự động
              </h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Mã QR động khớp số tiền và mã đơn. Ngân hàng xác nhận giao dịch tự động trong 3 đến 5 giây.
              </p>
            </div>

            <div className="flex flex-col p-6 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-zinc-900/60">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs font-bold text-zinc-400">03</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Cấp key & Quota realtime
              </h3>
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Màn hình tự động hiển thị key bản quyền, hoặc nạp trực tiếp credit vào API key với cơ chế đối soát minh bạch.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
