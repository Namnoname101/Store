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
} from "lucide-react";

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 2000000];

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
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoadingUser(false));
  }, []);

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

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-foreground">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-xs text-center text-card-foreground">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-5 border border-primary/20">
            <Wallet className="h-8 w-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Nạp tiền vào tài khoản
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Hệ thống nạp tiền tự động qua VietQR 24/7, cộng số dư ví KhoDEE tức thì trong 3-5 giây để thanh toán 1 chạm.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?callbackUrl=/topup"
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs px-6 py-3 text-sm font-bold transition-all active:scale-95"
            >
              <span>Đăng nhập để nạp tiền</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/register?callbackUrl=/topup"
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-muted px-6 py-3 text-sm font-semibold text-foreground transition-colors"
            >
              <span>Đăng ký tài khoản</span>
            </Link>
          </div>

          {/* Guest Direct Buy Notice */}
          <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
            <p>
              💡 <strong>Lưu ý:</strong> Bạn không bắt buộc phải tạo tài khoản ví để mua hàng. Bạn có thể chọn sản phẩm và thanh toán trực tiếp qua mã VietQR tại trang chủ.
            </p>
            <Link
              href="/#catalog"
              className="min-h-[44px] inline-flex items-center mt-3 text-primary font-semibold hover:underline"
            >
              Xem danh mục sản phẩm &amp; mua ngay →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-foreground">
      {/* Balance Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs mb-8 transition-colors text-card-foreground">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 font-mono">
              <Wallet className="h-3.5 w-3.5" />
              <span>Ví Thành Viên KhoDEE</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Xin chào, <span className="text-primary font-extrabold">{user?.username}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Nạp tiền qua VietQR tự động cộng số dư trong 3 giây. Mua mọi dịch vụ 1 chạm.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-muted/40 border border-border rounded-xl px-4 py-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase font-semibold">Số dư khả dụng</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {user?.balance.toLocaleString("vi-VN")}đ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Topup Form Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs transition-colors text-card-foreground">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Nạp tiền vào ví qua VietQR</h2>
            <p className="text-xs text-muted-foreground">Chuyển khoản 24/7 từ mọi ngân hàng hoặc ví MoMo/ZaloPay</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateDeposit} className="space-y-6">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
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
                    className={`min-h-[44px] flex items-center justify-center py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20 font-bold"
                        : "border-border bg-card text-foreground hover:bg-muted/50"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
              Hoặc nhập số tiền khác (Tối thiểu 20.000đ)
            </label>
            <div className="relative">
              <input
                type="text"
                value={customAmount ? parseInt(customAmount, 10).toLocaleString("vi-VN") : ""}
                onChange={handleCustomChange}
                placeholder="Ví dụ: 75.000"
                className="w-full min-h-[44px] rounded-xl border border-input bg-background py-3 pl-4 pr-12 text-base font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                VND
              </span>
            </div>
          </div>

          {/* Value Summary Box */}
          <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-xs text-foreground">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Số tiền nạp vào ví:</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {selectedAmount ? selectedAmount.toLocaleString("vi-VN") + "đ" : "0đ"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Thời gian xử lý:</span>
              <span className="font-semibold text-foreground">Tự động 3 - 5 giây</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Phí nạp tiền:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Miễn phí 0đ</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || selectedAmount < 20000}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 py-3.5 text-sm font-bold text-primary-foreground shadow-xs disabled:opacity-50 transition-all cursor-pointer active:scale-95"
          >
            {submitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
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
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-2 gap-4 text-xs text-muted-foreground text-center">
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Đối soát tự động 24/7</span>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span>Cộng tiền tức thì</span>
          </div>
        </div>
      </div>
    </div>
  );
}
