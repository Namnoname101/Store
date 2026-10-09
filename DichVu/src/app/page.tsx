import { Search } from "lucide-react";
import { getCategoriesWithProducts, getAllCategories } from "@/services/catalog.service";
import CatalogExplorer from "@/components/CatalogExplorer";

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
    <div className="flex flex-col gap-8 sm:gap-10 pb-16">
      {/* Search Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 pb-8 sm:pb-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tài khoản & Nguồn tài nguyên giá rẻ
            </h1>

            {/* Subtitle */}
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl">
              Cung cấp tài khoản AI, API AI, dịch vụ mạng xã hội . . . . Thanh toán tự động nhanh chóng Uy Tín 24/7.
            </p>

            {/* Search Input Box */}
            <form
              action="/"
              method="GET"
              className="mt-6 w-full max-w-xl relative flex items-center"
            >
              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="Tìm kiếm tài khoản AI, key bản quyền, dịch vụ MXH..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-3 pl-11 pr-24 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
              />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                Tìm kiếm
              </button>
            </form>

            {/* Quick Category Shortcuts */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs">
              <span className="text-slate-400 text-xs mr-1">Gợi ý:</span>
              <a
                href="/?category=ai-api#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                AI & API
              </a>
              <a
                href="/?category=cloud#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Cloud VPS
              </a>
              <a
                href="/?category=tiktok#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                TikTok
              </a>
              <a
                href="/?category=facebook#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Facebook
              </a>
              <a
                href="/?category=youtube#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                YouTube
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

      {/* Quick 3-Step Guide */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 py-10"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Quy trình mua hàng
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Nhận thông tin ngay sau khi chuyển khoản, không cần đăng ký tài khoản.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="mb-2 text-sm font-bold text-blue-600 dark:text-blue-400">Bước 1</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Chọn sản phẩm
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Chọn gói dịch vụ hoặc số lượng cần mua. Có thể nhập email để lưu lịch sử (không bắt buộc).
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="mb-2 text-sm font-bold text-blue-600 dark:text-blue-400">Bước 2</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Quét mã QR
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Mở app ngân hàng quét mã QR có sẵn số tiền và nội dung chuyển khoản chính xác.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="mb-2 text-sm font-bold text-blue-600 dark:text-blue-400">Bước 3</span>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Nhận thông tin đơn hàng
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Màn hình tự động hiển thị tài khoản, key kích hoạt hoặc tiến trình thực hiện đơn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
