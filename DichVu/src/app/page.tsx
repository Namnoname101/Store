import Link from "next/link";
import { Search, ArrowRight, Terminal, Zap, ShieldCheck, Gift } from "lucide-react";
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

  // Retrieve categories with products and live stock count
  const categories = await getCategoriesWithProducts(undefined, search);
  const allCategories = await getAllCategories();

  return (
    <div className="flex flex-col gap-10 sm:gap-12 pb-20">
      {/* Modern Tech Studio Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-10 sm:pb-14 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-radial-[at_50%_0%] from-blue-500/10 via-zinc-50 to-white dark:from-blue-600/15 dark:via-zinc-900/30 dark:to-[#070b14]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-5">
            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 shadow-sm backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="whitespace-nowrap font-semibold">Tự động 24/7 qua VietQR • Bảo hành 1 đổi 1</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.18]">
              Chợ Tài Nguyên Số & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
                Key Bản Quyền Tự Động
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl leading-relaxed">
              API Claude, Cursor, ChatGPT, CapCut & Tài nguyên MMO tự động 24/7.
            </p>

            {/* Search Input Box */}
            <form
              action="/"
              method="GET"
              className="w-full max-w-xl relative flex items-center group pt-2"
            >
              <div className="relative w-full flex items-center rounded-2xl border border-zinc-300 dark:border-white/10 bg-white/95 dark:bg-[#0c1220] shadow-lg transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
                <Search className="absolute left-4 h-4 w-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search || ""}
                  placeholder="Tìm gói API Claude, Cursor, CapCut, Codex, ChatGPT..."
                  className="w-full bg-transparent py-3.5 pl-11 pr-24 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-blue-600/30"
                >
                  Tìm kiếm
                </button>
              </div>
            </form>

            {/* Quick Keyword Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-1">
              <span className="text-zinc-500 text-xs mr-1 font-mono">Tìm nhanh:</span>
              <a
                href="/?search=claude#catalog"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 transition-all shadow-xs"
              >
                <BrandLogo brandName="claude" size={13} className="w-3.5 h-3.5 shrink-0" />
                <span>Claude API</span>
              </a>
              <a
                href="/?search=cursor#catalog"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 transition-all shadow-xs"
              >
                <BrandLogo brandName="cursor" size={13} className="w-3.5 h-3.5 shrink-0" />
                <span>Cursor AI</span>
              </a>
              <a
                href="/?search=capcut#catalog"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:border-blue-400 transition-all shadow-xs"
              >
                <BrandLogo brandName="capcut" size={13} className="w-3.5 h-3.5 shrink-0" />
                <span>CapCut Pro</span>
              </a>
              <a
                href="/codex"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 transition-all shadow-xs"
              >
                <BrandLogo brandName="codex" size={13} className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                <span>Codex Topup</span>
              </a>
            </div>

            {/* Quota Dashboard Banner */}
            <div className="pt-1">
              <Link
                href="/developer/usage"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition-all shadow-xs group"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                <span>Đã có Key? Tra cứu Quota & Request Logs</span>
                <ArrowRight className="h-3 w-3 text-emerald-500 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Bento Highlights & Topup Bonus */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        {/* Wallet Bonus Banner */}
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-900/25 via-indigo-900/20 to-purple-900/25 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl shrink-0">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                  Ưu đãi nạp số dư ví tự động
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                  +5% THƯỞNG
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                Nạp từ <b>100.000đ</b> tặng ngay <b className="text-emerald-500">+3%</b> • Nạp từ <b>500.000đ</b> tặng ngay <b className="text-emerald-500">+5%</b> vào số dư ví.
              </p>
            </div>
          </div>
          <Link
            href="/topup"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            Nạp tiền vào ví →
          </Link>
        </div>
      </section>

      {/* Main Product Catalog Section */}
      <section id="catalog" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <CatalogExplorer
          categories={categories}
          allCategories={allCategories}
          initialCategory={categorySlug || "all"}
          initialSearch={search || ""}
        />
      </section>
    </div>
  );
}
