import Link from "next/link";
import { Mail, Phone, Store } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 transition-colors">
      {/* Main footer links */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Daitruong<span className="text-blue-600">Store</span>
              </span>
            </Link>
            <p className="mt-3 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
              Cung cấp tài khoản bản quyền, công cụ AI và dịch vụ số. Nhận thông tin tự động ngay sau khi thanh toán.
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
              Danh mục
            </h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/?category=ai-api#catalog" className="hover:text-blue-600 transition-colors">
                  AI & API
                </Link>
              </li>
              <li>
                <Link href="/?category=cloud#catalog" className="hover:text-blue-600 transition-colors">
                  Cloud VPS
                </Link>
              </li>
              <li>
                <Link href="/?category=tiktok#catalog" className="hover:text-blue-600 transition-colors">
                  Dịch vụ TikTok & Facebook
                </Link>
              </li>
              <li>
                <Link href="/?category=khac#catalog" className="hover:text-blue-600 transition-colors">
                  Phần mềm & Khác
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Hỗ trợ
            </h3>
            <ul className="mt-3 space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-blue-600 transition-colors">
                  Hướng dẫn mua hàng
                </Link>
              </li>
              <li>
                <Link href="/lookup" className="hover:text-blue-600 transition-colors">
                  Tra cứu đơn hàng
                </Link>
              </li>
              <li>
                <Link href="/topup" className="hover:text-blue-600 transition-colors">
                  Nạp tiền vào tài khoản
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Daitruong Store. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Hỗ trợ thanh toán VietQR chuyển khoản 24/7</p>
        </div>
      </div>
    </footer>
  );
}
