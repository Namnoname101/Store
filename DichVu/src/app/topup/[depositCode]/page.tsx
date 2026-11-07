"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Wallet,
  Home,
  RefreshCw,
} from "lucide-react";

export default function DepositCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const depositCode = params.depositCode as string;

  const [deposit, setDeposit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const audioPlayedRef = useRef(false);

  const formatTimeLeft = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Play audio chime
  const playSuccessChime = () => {
    if (audioPlayedRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.6);
      audioPlayedRef.current = true;
    } catch (e) {
      console.warn("Audio playback not supported or blocked", e);
    }
  };

  // Fetch status helper
  const checkStatus = async () => {
    try {
      const res = await fetch(`/api/wallet/deposit/${depositCode}/status`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDeposit(data.deposit);
        const expiresAtTime = data.deposit.expiresAt
          ? new Date(data.deposit.expiresAt).getTime()
          : data.deposit.createdAt
          ? new Date(data.deposit.createdAt).getTime() + 30 * 60 * 1000
          : Date.now() + 1800 * 1000;
        const diffSeconds = Math.max(0, Math.floor((expiresAtTime - Date.now()) / 1000));
        setTimeLeft(isNaN(diffSeconds) ? 1800 : diffSeconds);
        if (data.deposit.isExpired || diffSeconds <= 0) {
          setIsExpired(true);
        }
        if (data.deposit.isPaid && !isPaid) {
          setIsPaid(true);
          playSuccessChime();
        }
      } else {
        setError(data.message || "Không thể tải thông tin lệnh nạp");
      }
    } catch {
      // Background retry silently
    } finally {
      setLoading(false);
    }
  };

  // Live countdown timer effect
  useEffect(() => {
    if (isPaid || isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaid, isExpired]);

  // Initial fetch and 3-second polling
  useEffect(() => {
    if (!depositCode) return;
    checkStatus();

    const interval = setInterval(() => {
      if (!isPaid && !isExpired) {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [depositCode, isPaid, isExpired]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-muted-foreground">Đang tạo mã thanh toán VietQR...</p>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-center text-foreground">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
        <h2 className="text-lg font-bold text-foreground mb-2">Không tìm thấy lệnh nạp tiền</h2>
        <p className="text-sm text-muted-foreground mb-6">{error || "Lệnh nạp không tồn tại hoặc đã bị hủy"}</p>
        <Link
          href="/topup"
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-xs transition"
        >
          Tạo lệnh nạp mới
        </Link>
      </div>
    );
  }

  // EXPIRED STATE
  if (isExpired && !isPaid) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 text-foreground">
        <div className="relative overflow-hidden rounded-2xl border border-destructive/30 bg-card p-8 text-center shadow-xs text-card-foreground">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive mb-4">
            <Clock className="h-8 w-8" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Lệnh nạp tiền đã hết hạn</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Lệnh nạp tiền này đã quá thời hạn 30 phút. Vui lòng tạo lệnh mới để nhận mã VietQR và nội dung chuyển khoản hợp lệ.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/topup"
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-3 text-sm font-bold shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Tạo lệnh nạp tiền mới</span>
            </Link>

            <a
              href="https://t.me/daitruongstore"
              target="_blank"
              rel="noreferrer"
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 hover:bg-muted py-3 text-sm font-semibold text-foreground transition-all"
            >
              <span>Hỗ trợ qua Telegram (@daitruongstore)</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  if (isPaid) {
    return (
      <div className="max-w-md mx-auto my-12 px-4 text-foreground">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-card p-8 text-center shadow-xs text-card-foreground">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4 animate-fade-slide-in">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-1">Nạp tiền thành công!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Số dư ví của bạn đã được cộng ngay lập tức.
          </p>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 mb-6 text-left space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Mã lệnh nạp:</span>
              <span className="font-mono font-bold text-foreground">{deposit.depositCode}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Số tiền đã nạp:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                +{deposit.amount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Phương thức:</span>
              <span className="text-foreground font-semibold">VietQR Tự Động</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/profile"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 py-3 text-sm font-semibold text-primary-foreground shadow-xs transition-all active:scale-95"
            >
              <Wallet className="h-4 w-4" />
              <span>Xem số dư &amp; Lịch sử ví</span>
            </Link>
            <Link
              href="/"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-medium text-foreground hover:bg-muted transition-all"
            >
              <Home className="h-4 w-4" />
              <span>Khám phá sản phẩm ngay</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // PENDING PAYMENT STATE
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 text-foreground">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Quét mã VietQR để nạp tiền</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Hệ thống sẽ tự động cộng số dư vào ví ngay khi nhận được chuyển khoản
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VietQR Box */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-xs text-center text-card-foreground">
          <div className="relative rounded-xl border border-border bg-white p-3 shadow-xs mb-4">
            <img
              src={deposit.qrCodeUrl}
              alt={`VietQR ${deposit.depositCode}`}
              className="h-64 w-64 object-contain rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Đang chờ chuyển khoản (Tự động kiểm tra 3s/lần)...</span>
          </div>
        </div>

        {/* Bank Details Box */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-xs text-card-foreground">
          <div>
            <h2 className="text-base font-bold text-foreground mb-4 pb-3 border-b border-border flex items-center justify-between">
              <span>Thông tin chuyển khoản</span>
              <span className="text-xs font-mono font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                {deposit.depositCode}
              </span>
            </h2>

            <div className="space-y-4">
              {/* Ngân hàng */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="font-bold text-foreground">{deposit.bankInfo.bankId} (Tiên Phong Bank)</span>
              </div>

              {/* Số tài khoản */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary text-base">
                    {deposit.bankInfo.accountNo}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deposit.bankInfo.accountNo, "accNo")}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition"
                    title="Sao chép số tài khoản"
                    aria-label="Sao chép số tài khoản"
                  >
                    {copiedField === "accNo" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <span className="font-semibold text-foreground">{deposit.bankInfo.accountName}</span>
              </div>

              {/* Số tiền */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Số tiền nạp:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg font-mono">
                    {deposit.amount.toLocaleString("vi-VN")}đ
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deposit.amount.toString(), "amount")}
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition"
                    title="Sao chép số tiền"
                    aria-label="Sao chép số tiền"
                  >
                    {copiedField === "amount" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nội dung bắt buộc */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 font-medium">
                <div className="font-bold mb-1 flex items-center justify-between">
                  <span>NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(deposit.depositCode, "memo")}
                    className="min-h-[44px] px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold text-amber-900 dark:text-amber-200 transition"
                  >
                    {copiedField === "memo" ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>Sao chép</span>
                  </button>
                </div>
                <div className="font-mono text-base font-black text-amber-600 dark:text-amber-400 tracking-wider select-all">
                  {deposit.depositCode}
                </div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 font-semibold">
                  * Vui lòng giữ nguyên nội dung trên để hệ thống tự động cộng tiền sau 3 giây.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Hết hạn sau: <strong className="font-mono font-bold text-foreground">{formatTimeLeft(timeLeft)}</strong></span>
            </span>
            <div className="flex items-center gap-3">
              <a
                href="https://t.me/daitruongstore"
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] inline-flex items-center text-muted-foreground hover:text-foreground underline font-medium"
              >
                Hỗ trợ Telegram
              </a>
              <button
                type="button"
                onClick={() => checkStatus()}
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-primary font-semibold transition"
              >
                Tôi đã chuyển khoản
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
