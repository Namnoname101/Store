"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Wallet,
  TrendingUp,
  ShoppingBag,
  Award,
  Copy,
  Check,
  CreditCard,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Share2,
} from "lucide-react";

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Withdrawal modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/affiliate");
      if (res.status === 401) {
        router.push("/login?callbackUrl=/dashboard/affiliate");
        return;
      }
      const json = await res.json();
      if (json.success) {
        if (!json.data.isAffiliate) {
          router.push("/ctv");
          return;
        }
        setData(json.data);
        if (json.data.bankInfo) {
          setBankName(json.data.bankInfo.bankName || "");
          setAccountNumber(json.data.bankInfo.bankAccountNumber || "");
          setAccountName(json.data.bankInfo.bankAccountName || "");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleCopyCode = () => {
    if (!data?.affiliateCode) return;
    navigator.clipboard.writeText(data.affiliateCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!data?.affiliateCode) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${origin}/?coupon=${data.affiliateCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWithdraw(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const amount = Number(withdrawAmount);
    if (!amount || amount < 50000) {
      setWithdrawError("Số tiền rút tối thiểu là 50.000đ");
      setIsSubmittingWithdraw(false);
      return;
    }

    try {
      const res = await fetch("/api/affiliate/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          bankName,
          accountNumber,
          accountName,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || "Không thể tạo yêu cầu rút tiền");
      }

      setWithdrawSuccess("Tạo yêu cầu rút tiền thành công! Admin sẽ duyệt trong 24h.");
      setWithdrawAmount("");
      setTimeout(() => {
        setIsWithdrawModalOpen(false);
        setWithdrawSuccess(null);
        fetchData();
      }, 1500);
    } catch (err: any) {
      setWithdrawError(err?.message || "Lỗi xử lý");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${origin}/?coupon=${data.affiliateCode}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-black pb-16">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Bảng Quản Lý CTV</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {data.affiliateTier}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Theo dõi lượt bán, hoa hồng tích lũy và rút tiền về tài khoản ngân hàng.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Yêu Cầu Rút Tiền</span>
            </button>
            <Link
              href="/ctv"
              className="px-4 py-2.5 rounded-xl font-medium text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            >
              Thể lệ & Bảng giá
            </Link>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Số Dư Hoa Hồng Khả Dụng</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {data.balance.toLocaleString("vi-VN")}đ
            </div>
            <div className="text-[11px] text-slate-500">
              Tối thiểu 50.000đ là rút được
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Tổng Hoa Hồng Đã Nhận</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {data.totalCommission.toLocaleString("vi-VN")}đ
            </div>
            <div className="text-[11px] text-slate-500">
              Tích lũy từ tất cả đơn hàng
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Số Đơn Giới Thiệu</span>
              <ShoppingBag className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {data.totalAffOrders} đơn
            </div>
            <div className="text-[11px] text-slate-500">
              {data.activeCoupon?.usedCount || 0} lượt áp dụng mã
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-850 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Cấp Bậc CTV</span>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {data.affiliateTier}
            </div>
            <div className="text-[11px] text-slate-500">
              {data.totalAffOrders < 10
                ? `Cần thêm ${10 - data.totalAffOrders} đơn để lên PRO`
                : data.totalAffOrders < 50
                ? `Cần thêm ${50 - data.totalAffOrders} đơn để lên MASTER`
                : "Cấp bậc cao nhất"}
            </div>
          </div>
        </div>

        {/* Affiliate Link & Code Box */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Mã Giảm Giá & Đường Dẫn Chia Sẻ Của Bạn</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Khách nhập mã sẽ được giảm ngay 5% đơn hàng. Bạn tự động nhận hoa hồng 8% - 20%.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Coupon Code Box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Mã Giảm Giá Khách Nhập (Voucher 5%)
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                <code className="text-base font-black text-emerald-400 tracking-wider font-mono">
                  {data.affiliateCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Đã copy" : "Copy mã"}</span>
                </button>
              </div>
            </div>

            {/* Direct Referral Link Box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Đường Dẫn Mua Hàng (Tự động áp mã)
              </span>
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-300 truncate font-mono">
                  {shareUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Đã copy" : "Copy link"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Tables: Commission History & Withdrawal Requests */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Commission History */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-850 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Lịch Sử Nhận Hoa Hồng Gần Nhất</span>
            </h3>

            {data.recentCommissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Chưa có đơn hàng nào phát sinh hoa hồng. Hãy đăng Story/Note FB để kiếm đơn đầu tiên nhé!
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {data.recentCommissions.map((item: any) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white">
                        {item.description}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div className="font-bold text-sm text-emerald-400 shrink-0">
                      +{item.amount.toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Withdrawal Requests */}
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-850 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>Yêu Cầu Rút Tiền Gần Nhất</span>
            </h3>

            {data.recentWithdrawals.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Chưa có yêu cầu rút tiền nào. Số dư từ 50.000đ có thể bấm &quot;Yêu Cầu Rút Tiền&quot;.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {data.recentWithdrawals.map((item: any) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{item.withdrawalCode}</span>
                        <span className="text-[11px] text-slate-400">({item.bankName})</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {new Date(item.createdAt).toLocaleString("vi-VN")}
                      </div>
                    </div>
                    <div className="text-right space-y-0.5 shrink-0">
                      <div className="font-bold text-sm text-white">
                        {item.amount.toLocaleString("vi-VN")}đ
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.status === "APPROVED"
                          ? "Đã chuyển"
                          : item.status === "REJECTED"
                          ? "Từ chối"
                          : "Đang duyệt"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>Yêu Cầu Rút Tiền Về STK</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Số dư khả dụng:</span>
              <span className="text-base font-bold text-emerald-400">
                {data.balance.toLocaleString("vi-VN")}đ
              </span>
            </div>

            {withdrawSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                {withdrawSuccess}
              </div>
            )}

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
                {withdrawError}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-3.5 text-left text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Số tiền muốn rút (VND, tối thiểu 50.000đ)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  min={50000}
                  max={data.balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 text-white text-sm font-bold font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Tên Ngân Hàng
                </label>
                <input
                  type="text"
                  placeholder="MB, VCB, Techcombank..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Số Tài Khoản (STK)
                </label>
                <input
                  type="text"
                  placeholder="0987654321..."
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Tên Chủ Thẻ (In hoa không dấu)
                </label>
                <input
                  type="text"
                  placeholder="NGUYEN VAN A"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs uppercase outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdraw || data.balance < 50000}
                  className="px-5 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 cursor-pointer transition-all"
                >
                  {isSubmittingWithdraw ? "Đang gửi..." : "Gửi Yêu Cầu Rút"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
