import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  CheckCircle,
  QrCode,
  ArrowRight,
  Sparkles,
  Lock,
  Headphones,
  Search,
  CheckCircle2,
  Cpu,
  Cloud,
  Share2,
  Video,
} from "lucide-react";
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
    <div className="flex flex-col gap-12 sm:gap-16 pb-20">
      {/* Search-First Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-10 sm:pb-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Top Announcement Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50 dark:bg-blue-950/40 px-3.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 mb-5 shadow-xs">
              <Zap className="h-3.5 w-3.5 fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400" />
              <span>Giao dịch tự động 100% qua VietQR NAPAS 24/7</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl leading-[1.2]">
              Marketplace Dịch Vụ Số & Bản Quyền{" "}
              <span className="text-blue-600">Giao Nhận Tự Động</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Cung cấp mã bản quyền Windows, Office, tài khoản AI ChatGPT, Claude, Cloud VPS và dịch vụ mạng xã hội. Quét mã QR ngân hàng — Hệ thống kích hoạt tức thì không cần chờ đợi.
            </p>

            {/* Search Input Box in Hero */}
            <form
              action="/"
              method="GET"
              className="mt-6 w-full max-w-xl relative flex items-center"
            >
              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="Tìm key bản quyền, tài khoản AI, follow TikTok, like FB..."
                className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-3.5 pl-11 pr-28 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
              />
              <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <button
                type="submit"
                className="absolute right-2 top-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
              >
                Tìm ngay
              </button>
            </form>

            {/* Quick Category Shortcuts */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1">Gợi ý tìm kiếm:</span>
              <a
                href="/?category=ai-api#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                AI & API
              </a>
              <a
                href="/?category=cloud#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Cloud VPS
              </a>
              <a
                href="/?category=tiktok#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                TikTok
              </a>
              <a
                href="/?category=facebook#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Facebook
              </a>
              <a
                href="/?category=youtube#catalog"
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900 px-2.5 py-1 font-medium text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                YouTube
              </a>
            </div>

            {/* Key feature pills */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 max-w-2xl w-full">
              <div className="flex flex-col items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-center">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">30 Giây</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Khớp lệnh tự động</span>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-center">
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">100%</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Bảo hành 1-đổi-1</span>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-center">
                <span className="text-lg font-bold text-sky-600 dark:text-sky-400">Zero Lock</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Không bán trùng kho</span>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-center">
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Guest Order</span>
                <span className="text-[11px] text-slate-500 mt-0.5">Không cần tạo nick</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Promotion Banner (Clean & Non-distracting) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/20 p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Thanh Toán Siêu Tốc Chuẩn VietQR NAPAS 24/7
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Hệ thống tự động nhận diện giao dịch qua mã đơn, cấp phát key bản quyền và khởi tạo dịch vụ ngay sau khi chuyển khoản.
              </p>
            </div>
          </div>

          <a
            href="#catalog"
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Khám phá kho dịch vụ
          </a>
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

      {/* How it works Section */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-14"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Quy Trình Tự Động Hóa
            </span>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              Nhận Hàng Sau 3 Bước Đơn Giản
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Không cần đăng ký tài khoản phức tạp, chỉ cần email và ứng dụng ngân hàng bất kỳ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-xs">
              <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-base font-bold border border-blue-200 dark:border-blue-900">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Chọn sản phẩm & Cấu hình
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Nhập email của bạn và chọn số lượng hoặc link cần tăng tương tác. Hệ thống lập tức tạm khóa kho để đảm bảo không bị tranh mua.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-xs">
              <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-base font-bold border border-indigo-200 dark:border-indigo-900">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Quét mã VietQR 24/7
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Mở app ngân hàng bất kỳ (Vietcombank, MB, Techcombank, VPBank,...) quét mã QR có sẵn số tiền và mã đơn hàng chính xác.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 shadow-xs">
              <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-base font-bold border border-emerald-200 dark:border-emerald-900">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nhận hàng tức thì
              </h3>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ngay khi tiền vào tài khoản, màn hình tự động chuyển sang trang nhận key bản quyền hoặc khởi chạy tiến trình cấp phát tự động.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Guarantees Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Cam Kết Chất Lượng Dịch Vụ</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                Nền Tảng Phân Phối Kỹ Thuật Số Minh Bạch
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Chúng tôi áp dụng cơ chế khóa tài nguyên theo thời gian thực (Atomic Status Locking) loại bỏ hoàn toàn khả năng bán trùng key. Key được kiểm tra hợp lệ trước khi bàn giao.
              </p>
              <div className="mt-5 flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Mã kích hoạt chính hãng 100%, bảo hành suốt thời hạn sử dụng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Hoàn tiền nếu có lỗi từ hệ thống không thể xử lý</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Hỗ trợ kỹ thuật trực tuyến 24/7 qua Messenger & Zalo</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Bảo mật giao dịch</h4>
                  <p className="text-[11px] text-slate-500">Không lưu trữ số tài khoản ngân hàng, chỉ đối soát qua VietQR</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Chuẩn VietQR NAPAS 24/7</h4>
                  <p className="text-[11px] text-slate-500">Tương thích với hơn 40+ ứng dụng ngân hàng và ví điện tử tại Việt Nam</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Chăm sóc khách hàng</h4>
                  <p className="text-[11px] text-slate-500">Đội ngũ kỹ thuật viên sẵn sàng trợ giúp kích hoạt phần mềm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
