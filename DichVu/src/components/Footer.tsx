import Link from "next/link";
import { Mail, Phone, Store, ShieldCheck, Zap, Headphones, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070b14] text-slate-400 text-xs transition-colors">
      {/* Top MMO Trust Pillars Bar */}
      <div className="border-b border-white/5 bg-slate-900/40 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Giao Hàng Tự Động 24/7</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Nhận mã tức thì sau khi quét mã VietQR</div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Bảo Hành 1 Đổi 1 Chuẩn Chỉ</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Đổi mới ngay lập tức nếu phát sinh lỗi</div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Headphones className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-white text-sm">Hỗ Trợ Kỹ Thuật MMO</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Zalo & Hotline trực tuyến hỗ trợ nhanh</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Brand info (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-extrabold text-white shadow-lg shadow-blue-500/30 text-base">
                D
              </div>
              <div className="font-extrabold tracking-tight text-white flex items-center gap-1.5 text-base">
                <span>DaiTruong</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Store</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">MMO HUB</span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Hệ thống cung cấp API Trí Tuệ Nhân Tạo (Claude, Codex, OpenAI), Tài Khoản Bản Quyền & Nguyên Liệu MMO tự động hàng đầu. Cổng thanh toán VietQR thông minh 24/7.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
                <span className="font-mono">Dai99133@gmail.com</span>
              </div>

            </div>
          </div>

          {/* Quick links: Catalog (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Kho Tài Nguyên
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/?category=ai-api#catalog" className="hover:text-blue-400 transition-colors">
                  API AI (Claude, Codex, Cursor)
                </Link>
              </li>
              <li>
                <Link href="/?category=tai-khoan-ai#catalog" className="hover:text-blue-400 transition-colors">
                  Tài Khoản AI (ChatGPT Plus, Gemini)
                </Link>
              </li>
              <li>
                <Link href="/?category=ban-quyen#catalog" className="hover:text-blue-400 transition-colors">
                  Phần Mềm (CapCut Pro, Canva, Office)
                </Link>
              </li>
              <li>
                <Link href="/?category=mxh#catalog" className="hover:text-blue-400 transition-colors">
                  Dịch Vụ MXH (TikTok, Facebook Buff)
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick links: Services & Tools (4 cols) */}
          <div className="md:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Tiện Ích & Hỗ Trợ
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/topup" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>Nạp Số Dư Ví Tự Động</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">+5%</span>
                </Link>
              </li>
              <li>
                <Link href="/lookup" className="hover:text-blue-400 transition-colors">
                  Tra Cứu Đơn Hàng & Lấy Lại Key
                </Link>
              </li>
              <li>
                <Link href="/developer/usage" className="hover:text-blue-400 transition-colors">
                  Kiểm Tra Quota & Request Logs API
                </Link>
              </li>
              <li>
                <Link href="/tools/prompt-master" className="hover:text-blue-400 transition-colors">
                  Công Cụ Tạo Prompt AI Chuẩn
                </Link>
              </li>
              <li>
                <Link href="/huong-dan/api-claude" className="hover:text-indigo-400 transition-colors flex items-center gap-1 font-semibold text-indigo-400">
                  <span>Hướng Dẫn Cấu Hình API Claude</span>
                  <ArrowUpRight className="h-3 w-3 text-indigo-400" />
                </Link>
              </li>
              <li>
                <Link href="/preview/guide" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                  <span>Xem Trước Quy Trình Bàn Giao</span>
                  <ArrowUpRight className="h-3 w-3 text-indigo-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} DaiTruongStore. Bản quyền thuộc về hệ thống cung cấp tài nguyên MMO.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-500 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              TPBank VietQR Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
