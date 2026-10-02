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

  // Retrieve categories with products and live stock count
  const categories = await getCategoriesWithProducts(categorySlug, search);
  const allCategories = await getAllCategories();

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 lg:pt-24 border-b border-slate-900 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/15 via-violet-600/10 to-cyan-400/15 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-400 backdrop-blur-md mb-6">
              <Zap className="h-3.5 w-3.5 text-indigo-400" />
              <span>Giao dịch tự động 100% qua chuẩn VietQR NAPAS 24/7</span>
            </div>

            {/* Headline */}
            <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
              Bản Quyền Phần Mềm & Tài Khoản Số{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Giao Hàng Trong 30 Giây
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 max-w-2xl text-base text-slate-400 sm:text-lg leading-relaxed">
              Mua mã bản quyền Windows, Office, tài khoản AI và khóa học số hoàn toàn tự động. Quét mã QR ngân hàng — Hệ thống trả key ngay trên màn hình không cần chờ đợi.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#catalog"
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:scale-[1.02]"
              >
                <span>Xem kho sản phẩm</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <a
                href="#how-it-works"
                className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all"
              >
                <span>Quy trình thanh toán QR</span>
              </a>
            </div>

            {/* Key feature pills */}
            <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl w-full">
              <div className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-center">
                <span className="text-xl font-bold text-indigo-400">30 Giây</span>
                <span className="text-xs text-slate-400 mt-0.5">Khớp lệnh tự động</span>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-center">
                <span className="text-xl font-bold text-emerald-400">100%</span>
                <span className="text-xs text-slate-400 mt-0.5">Bảo hành 1-đổi-1</span>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-center">
                <span className="text-xl font-bold text-cyan-400">Zero Lock</span>
                <span className="text-xs text-slate-400 mt-0.5">Không bán trùng kho</span>
              </div>

              <div className="flex flex-col items-center rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 text-center">
                <span className="text-xl font-bold text-violet-400">Guest Checkout</span>
                <span className="text-xs text-slate-400 mt-0.5">Không cần tạo nick</span>
              </div>
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

      {/* How it works Section */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-slate-900 bg-slate-900/30 py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Quy Trình Siêu Tốc
            </span>
            <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Nhận Hàng Sau 3 Bước Đơn Giản
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Không cần đăng ký tài khoản phức tạp, chỉ cần email và app ngân hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-lg font-bold">
                01
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                Chọn sản phẩm & Số lượng
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Nhập email của bạn và chọn số lượng. Hệ thống lập tức tạm khóa số lượng key trong kho để đảm bảo bạn không bị tranh mua.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-lg font-bold">
                02
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                Quét mã VietQR 24/7
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Mở app ngân hàng bất kỳ (Vietcombank, MB, Techcombank,...) quét mã QR có sẵn số tiền và mã đơn hàng chính xác.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-lg font-bold">
                03
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                Nhận key tức thì
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Ngay khi tiền vào tài khoản, màn hình tự động chuyển sang trang nhận key bản quyền kèm hướng dẫn kích hoạt chi tiết.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Guarantees Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">
                <ShieldCheck className="h-4 w-4" />
                <span>Cam Kết Chất Lượng Dịch Vụ</span>
              </div>
              <h3 className="text-2xl font-bold text-white sm:text-3xl leading-snug">
                Hệ Thống Tự Động Hóa Hiện Đại Nhất
              </h3>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Chúng tôi áp dụng cơ chế khóa tài nguyên theo thời gian thực (Atomic Status Locking) loại bỏ hoàn toàn khả năng bán trùng key. Key được kiểm tra hợp lệ trước khi bàn giao.
              </p>
              <div className="mt-6 flex flex-col gap-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Mã kích hoạt chính hãng 100%, bảo hành suốt hạn sử dụng</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Hoàn tiền 100% nếu có lỗi từ hệ thống không khắc phục được</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Hỗ trợ kỹ thuật qua Zalo / Hotline 24/7</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Bảo mật thông tin</h4>
                  <p className="text-xs text-slate-400">Không lưu trữ tài khoản ngân hàng, chỉ nhận thông báo qua VietQR</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Chuẩn VietQR NAPAS 247</h4>
                  <p className="text-xs text-slate-400">Tương thích hơn 40+ ứng dụng ngân hàng và ví điện tử tại Việt Nam</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Headphones className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Chăm sóc khách hàng</h4>
                  <p className="text-xs text-slate-400">Đội ngũ kỹ thuật viên sẵn sàng trợ giúp kích hoạt phần mềm</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
