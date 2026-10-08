import Link from "next/link";
import { ShieldCheck, Clock, RefreshCw, Mail, Phone, Store } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 transition-colors">
      {/* Trust banner */}
      <div className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-900/30 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Giao hàng tức thì 30s
                </h4>
                <p className="text-xs text-slate-500">
                  Hệ thống VietQR NAPAS 24/7 tự động xác thực và cấp mã ngay lập tức.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Bảo hành 1-đổi-1
                </h4>
                <p className="text-xs text-slate-500">
                  Cam kết bảo hành suốt thời hạn cam kết. Hỗ trợ kích hoạt trực tiếp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Tự động hóa 100%
                </h4>
                <p className="text-xs text-slate-500">
                  Không phải chờ đợi nhân viên duyệt hay đợi qua đêm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Daitruong<span className="text-blue-600">Store</span>
              </span>
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              Cửa hàng cung cấp bản quyền phần mềm, tài khoản dịch vụ AI, Cloud và giải trí số uy tín. Thanh toán VietQR NAPAS 24/7 nhận mã tự động trong 30 giây.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                <span>support@daitruongstore.vn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>Hotline: 1900 8888</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Danh mục dịch vụ
            </h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/?category=ai-api#catalog" className="hover:text-blue-600 transition-colors">
                  AI & API (ChatGPT, Claude)
                </Link>
              </li>
              <li>
                <Link href="/?category=cloud#catalog" className="hover:text-blue-600 transition-colors">
                  Cloud VPS & Máy chủ
                </Link>
              </li>
              <li>
                <Link href="/?category=tiktok#catalog" className="hover:text-blue-600 transition-colors">
                  Tương tác TikTok & Facebook
                </Link>
              </li>
              <li>
                <Link href="/?category=khac#catalog" className="hover:text-blue-600 transition-colors">
                  Key Windows, Office & Khác
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Hỗ trợ khách hàng
            </h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-blue-600 transition-colors">
                  Hướng dẫn thanh toán VietQR
                </Link>
              </li>
              <li>
                <Link href="/lookup" className="hover:text-blue-600 transition-colors">
                  Tra cứu lịch sử đơn hàng
                </Link>
              </li>
              <li>
                <Link href="/topup" className="hover:text-blue-600 transition-colors">
                  Nạp tiền ví số dư
                </Link>
              </li>
              <li>
                <span className="text-slate-500 cursor-pointer hover:text-blue-600 transition-colors">
                  Chính sách hoàn tiền & Bảo hành
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Daitruong Store. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Hệ thống phân phối kỹ thuật số tức thì VietQR</p>
        </div>
      </div>
    </footer>
  );
}
