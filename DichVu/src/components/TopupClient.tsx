"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  QrCode,
  Clock,
  Sparkles,
} from "lucide-react";

const PRESET_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000];

export default function TopupClient() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>("50000");
  const [user, setUser] = useState<{ id: string; username: string; balance: number } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        } else {
          router.push("/login?callbackUrl=/topup");
        }
      })
      .catch(() => router.push("/login?callbackUrl=/topup"))
      .finally(() => setLoadingUser(false));
  }, [router]);

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(amount.toString());
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    setCustomAmount(rawVal);
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed)) {
      setSelectedAmount(parsed);
    } else {
      setSelectedAmount(0);
    }
    setError(null);
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = selectedAmount;
    if (!amount || isNaN(amount) || amount < 20000) {
      setError("Số tiền nạp tối thiểu là 20.000đ");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Không thể tạo lệnh nạp tiền");
        setSubmitting(false);
        return;
      }

      router.push(`/topup/${data.deposit.depositCode}`);
    } catch {
      setError("Không thể kết nối đến máy chủ. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Balance Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-6 sm:p-8 shadow-xl mb-8">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ví Thành Viên DigiStore</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Xin chào, <span className="text-indigo-400">{user?.username}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Nạp tiền qua VietQR tự động cộng số dư trong 3 giây. Mua mọi dịch vụ 1 chạm.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase font-medium">Số dư khả dụng</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-300">
                {user?.balance.toLocaleString("vi-VN")}đ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topup Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Nạp tiền vào ví qua VietQR</h2>
            <p className="text-xs text-slate-400">Chuyển khoản 24/7 từ mọi ngân hàng hoặc ví MoMo/ZaloPay</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateDeposit} className="space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              Chọn nhanh số tiền nạp
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PRESET_AMOUNTS.map((amt) => {
                const isSelected = selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectPreset(amt)}
                    className={`flex items-center justify-center py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-600/20 text-white shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500"
                        : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    {amt.toLocaleString("vi-VN")}đ
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Hoặc nhập số tiền khác (Tối thiểu 20.000đ)
            </label>
            <div className="relative">
              <input
                type="text"
                value={customAmount ? parseInt(customAmount, 10).toLocaleString("vi-VN") : ""}
                onChange={handleCustomChange}
                placeholder="Ví dụ: 75.000"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-4 pr-12 text-base font-bold text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="absolute right-4 top-3.5 text-sm font-semibold text-slate-400">
                VND
              </span>
            </div>
          </div>

          {/* Value Summary Box */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Số tiền nạp vào ví:</span>
              <span className="text-base font-bold text-emerald-400">
                {selectedAmount ? selectedAmount.toLocaleString("vi-VN") + "đ" : "0đ"}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Thời gian xử lý:</span>
              <span className="text-slate-200">Tự động 3 - 5 giây</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Phí nạp tiền:</span>
              <span className="text-emerald-400 font-medium">Miễn phí 0đ</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || selectedAmount < 20000}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-400 focus:outline-none disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                <span>Tạo mã VietQR nạp tiền</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Security badges */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs text-slate-400 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Đối soát tự động 24/7</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span>Cộng tiền tức thì</span>
          </div>
        </div>
      </div>
    </div>
  );
}
