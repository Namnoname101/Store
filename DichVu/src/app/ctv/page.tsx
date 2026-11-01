"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Zap,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Gift,
  Copy,
  Check,
  Coins,
  Share2,
  Users,
  CreditCard,
  ChevronRight,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export default function AffiliateLandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [customCode, setCustomCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          if (data.user.isAffiliate) {
            router.push("/dashboard/affiliate");
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?callbackUrl=/ctv");
      return;
    }

    setIsRegistering(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customCode: customCode ? customCode.trim() : undefined,
          bankName: bankName.trim() || undefined,
          bankAccountNumber: bankAccountNumber.trim() || undefined,
          bankAccountName: bankAccountName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      setMessage("Đăng ký thành công! Đang chuyển hướng tới trang quản lý CTV...");
      setTimeout(() => {
        router.push("/dashboard/affiliate");
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi, vui lòng thử lại");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-emerald-500/15 via-blue-500/10 to-transparent blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chương trình Cộng Tác Viên (Affiliate 0đ Vốn)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Kiếm <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">50k - 150k mỗi ngày</span> chỉ với Story & Note Facebook
          </h1>

          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Không cọc vốn, không ôm hàng, không sợ lừa đảo. Chia sẻ mã giảm giá độc quyền cho bạn bè mua tài khoản học tập, phần mềm bản quyền & API AI – Website tự động giao hàng 24/7 và chia hoa hồng tươi về ví bạn.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {user ? (
              <a
                href="#register-form"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Kích hoạt mã CTV ngay (Miễn phí)</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            ) : (
              <Link
                href="/login?callbackUrl=/ctv"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Đăng nhập để nhận mã CTV</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <a
              href="#commission-table"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-sm bg-slate-900/80 hover:bg-slate-850 text-slate-300 border border-slate-800 transition-colors"
            >
              <span>Xem bảng hoa hồng chi tiết</span>
            </a>
          </div>
        </div>

        {/* 3 Steps Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-white">Lấy Mã Giảm Giá Riêng</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Nhận ngay 1 mã giảm giá độc quyền dạng <code className="text-emerald-400 font-mono">CTV_TÊN</code>. Khách của bạn nhập mã sẽ được giảm 5% toàn bộ đơn hàng.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-white">Đăng Story / Note FB</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Đăng kèm bài viết, ảnh mẫu hoặc gợi ý cho bạn bè. Khách tự vào web đặt hàng, quét VietQR thanh toán và nhận tài khoản tức thì mà bạn không cần trực gửi.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-white">Nhận Tiền Tươi & Rút Ngân Hàng</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Hệ thống tự động cộng 8% - 20% hoa hồng vào ví ngay khi khách thanh toán xong. Đủ từ 50.000đ là bạn có thể bấm rút thẳng về STK ngân hàng.
            </p>
          </div>
        </div>

        {/* Commission Table */}
        <div id="commission-table" className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Bảng Tỷ Lệ Hoa Hồng Dành Cho CTV</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Tỷ lệ áp dụng tự động trên giá trị thanh toán thực tế của khách hàng.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Khách luôn được giảm 5% khi nhập mã CTV</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Nhóm Sản Phẩm</th>
                  <th className="pb-3 px-4">Sản Phẩm Tiêu Biểu</th>
                  <th className="pb-3 px-4">Hoa Hồng CTV</th>
                  <th className="pb-3 pl-4">Thu Nhập Ước Tính/Đơn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pr-4 font-semibold text-white">Dịch Vụ Buff Mạng Xã Hội (SMM)</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">Tăng Follower TikTok, Like Facebook, Tim TikTok...</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      20%
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 font-medium text-emerald-400">+10.000đ – 50.000đ / đơn</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pr-4 font-semibold text-white">Phần Mềm & Tài Khoản Học Tập</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">Canva Pro, CapCut Pro, Gemini Pro + 5TB Drive, Office 365...</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      15%
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 font-medium text-emerald-400">+3.000đ – 15.000đ / đơn</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 pr-4 font-semibold text-white">API AI & Công Cụ Lập Trình (Dev Tools)</td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">Claude AI, Cursor IDE, Codex AI, DeepSeek, Grok...</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      8% – 10%
                    </span>
                  </td>
                  <td className="py-3.5 pl-4 font-medium text-emerald-400">+2.500đ – 110.000đ / đơn</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Registration Form */}
        <div id="register-form" className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Đăng Ký Làm CTV Trong 30 Giây</h2>
            <p className="text-xs text-slate-400">
              Điền thông tin để hệ thống tạo mã giới thiệu riêng và kết nối số tài khoản ngân hàng của bạn.
            </p>
          </div>

          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Mã Giảm Giá Bạn Muốn Đặt (Tùy chọn)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  CTV_
                </span>
                <input
                  type="text"
                  placeholder="NAM_IT, THAO99..."
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                  maxLength={15}
                  className="w-full pl-14 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-sm font-mono uppercase tracking-wider outline-none transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Để trống hệ thống sẽ tự sinh theo tên tài khoản của bạn.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tên Ngân Hàng Rút Tiền
                </label>
                <input
                  type="text"
                  placeholder="MB, VCB, Techcombank..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-sm outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Số Tài Khoản (STK)
                </label>
                <input
                  type="text"
                  placeholder="0987654321..."
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-sm font-mono outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tên Chủ Thẻ (In hoa không dấu)
              </label>
              <input
                type="text"
                placeholder="NGUYEN VAN A"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-sm uppercase tracking-wider outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Thông tin ngân hàng có thể cập nhật lại bất kỳ lúc nào trong trang cá nhân.
              </p>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRegistering ? (
                <span>Đang khởi tạo mã CTV...</span>
              ) : (
                <>
                  <span>Xác Nhận Đăng Ký Làm CTV</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto space-y-4 pt-6">
          <h3 className="text-lg font-bold text-white text-center">Câu Hỏi Thường Gặp (FAQ)</h3>
          
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-bold text-emerald-400">Tôi có cần phải bỏ tiền cọc hay đóng phí gì không?</div>
            <div className="text-xs text-slate-300 leading-relaxed">
              Hoàn toàn 0đ. Bạn không cần nạp tiền hay ôm hàng. Khách tự lên web mua, quét VietQR trả tiền, bạn nhận hoa hồng tự động.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-bold text-emerald-400">Bao nhiêu tiền thì rút được về ngân hàng?</div>
            <div className="text-xs text-slate-300 leading-relaxed">
              Chỉ cần từ 50.000đ là bạn có thể bấm lệnh rút. Admin duyệt và chuyển khoản nhanh qua VietQR trong vòng 24h mỗi ngày.
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-bold text-emerald-400">Nếu khách cần bảo hành tài khoản thì ai hỗ trợ?</div>
            <div className="text-xs text-slate-300 leading-relaxed">
              Đội ngũ admin của website chịu trách nhiệm 100% về bảo hành, đổi trả và hỗ trợ kỹ thuật qua Telegram/Zalo cho khách. Bạn chỉ cần chia sẻ mã giảm giá.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
