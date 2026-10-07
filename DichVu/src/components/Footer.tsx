import Link from "next/link";
import { Zap, ShieldCheck, Clock, RefreshCw, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400">
      {/* Trust banner */}
      <div className="border-b border-slate-900 bg-slate-900/40 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Giao hàng tức thì 30s
                </h4>
                <p className="text-xs text-slate-400">
                  Hệ thống VietQR tự động khớp lệnh và gửi mã ngay trên màn hình.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Bảo hành 1-đổi-1
                </h4>
                <p className="text-xs text-slate-400">
                  Cam kết bảo hành suốt thời hạn sử dụng. Hỗ trợ kích hoạt nhanh chóng.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  Tự động hóa 100%
                </h4>
                <p className="text-xs text-slate-400">
                  Không cần chờ nhân viên duyệt hay đợi tin nhắn qua đêm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5">
                <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-slate-950">
                  <Zap className="h-4 w-4 text-white" />
                </div>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                DigiStore<span className="text-indigo-500">.vn</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-slate-400 max-w-sm leading-relaxed">
              Cửa hàng cung cấp bản quyền phần mềm, tài khoản dịch vụ AI, giải trí và tài liệu khóa học số uy tín hàng đầu. Thanh toán VietQR NAPAS 247 nhận mã tự động trong 30 giây.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <span>support@digistore.vn</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <span>Hotline: 1900 8888</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Danh mục sản phẩm
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/?category=windows-office#catalog" className="hover:text-indigo-400 transition-colors">
                  Key Windows & Office
                </Link>
              </li>
              <li>
                <Link href="/?category=tai-khoan-ai#catalog" className="hover:text-indigo-400 transition-colors">
                  Tài khoản AI & Tiện ích
                </Link>
              </li>
              <li>
                <Link href="/?category=giai-tri#catalog" className="hover:text-indigo-400 transition-colors">
                  Tài khoản Giải trí & Nghe nhạc
                </Link>
              </li>
              <li>
                <Link href="/?category=khoa-hoc#catalog" className="hover:text-indigo-400 transition-colors">
                  Khóa học & Tài liệu số
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Hỗ trợ khách hàng
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/#how-it-works" className="hover:text-indigo-400 transition-colors">
                  Hướng dẫn mua hàng & VietQR
                </Link>
              </li>
              <li>
                <span className="cursor-pointer hover:text-indigo-400 transition-colors">
                  Chính sách bảo hành & hoàn tiền
                </span>
              </li>
              <li>
                <span className="cursor-pointer hover:text-indigo-400 transition-colors">
                  Điều khoản dịch vụ
                </span>
              </li>
              <li>
                <Link href="/lookup" className="hover:text-indigo-400 transition-colors">
                  Tra cứu lịch sử đơn hàng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} DigiStore.vn. Bản quyền đã được bảo lưu.</p>
          <p className="mt-2 sm:mt-0">Hệ thống phân phối kỹ thuật số tức thì VietQR</p>
        </div>
      </div>
    </footer>
  );
}
