import Link from "next/link";
import { getCategoriesWithProducts, getAllCategories } from "@/services/catalog.service";
import CatalogExplorer from "@/components/CatalogExplorer";
import Hero from "@/components/Hero";

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
      {/* Extracted Swiss Tech Minimalism Hero Section */}
      <Hero initialSearch={search} />

      {/* Flagship Bento Highlights & Topup Bonus */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="rounded-2xl p-4 sm:p-5 bg-card border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-xl shrink-0">
              🎁
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Ưu đãi nạp số dư ví tự động
                </h3>
                <span className="px-2 py-0.5 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-bold font-mono">
                  +5% THƯỞNG
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Nạp từ <b>100.000đ</b> tặng ngay <b className="text-accent">+3%</b> • Nạp từ <b>500.000đ</b> tặng ngay <b className="text-accent">+5%</b> vào số dư ví.
              </p>
            </div>
          </div>
          <Link
            href="/topup"
            className="px-4 py-2 min-h-[44px] flex items-center justify-center rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs shadow-sm transition-all shrink-0 active:scale-[0.98]"
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
