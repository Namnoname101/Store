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
  const audioPlayedRef = useRef(false);

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

  // Initial fetch and 3-second polling
  useEffect(() => {
    if (!depositCode) return;
    checkStatus();

    const interval = setInterval(() => {
      if (!isPaid) {
        checkStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [depositCode, isPaid]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <p className="text-sm text-slate-400">Đang tạo mã thanh toán VietQR...</p>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-center">
        <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white mb-2">Không tìm thấy lệnh nạp tiền</h2>
        <p className="text-sm text-slate-400 mb-6">{error || "Lệnh nạp không tồn tại hoặc đã bị hủy"}</p>
        <Link
          href="/topup"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Tạo lệnh nạp mới
        </Link>
      </div>
    );
  }

  // SUCCESS STATE
  if (isPaid) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Nạp tiền thành công!</h2>
          <p className="text-sm text-slate-400 mb-6">
            Số dư ví của bạn đã được cộng ngay lập tức.
          </p>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 mb-6 text-left space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Mã lệnh nạp:</span>
              <span className="font-mono font-bold text-slate-200">{deposit.depositCode}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Số tiền đã nạp:</span>
              <span className="font-bold text-emerald-400 text-sm">
                +{deposit.amount.toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Phương thức:</span>
              <span className="text-slate-200">VietQR Tự Động</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link
              href="/profile"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-400 transition-all"
            >
              <Wallet className="h-4 w-4" />
              <span>Xem số dư & Lịch sử ví</span>
            </Link>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">Quét mã VietQR để nạp tiền</h1>
        <p className="text-sm text-slate-400 mt-1">
          Hệ thống sẽ tự động cộng số dư vào ví ngay khi nhận được chuyển khoản
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VietQR Box */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl text-center">
          <div className="relative rounded-xl border border-indigo-500/30 bg-white p-3 shadow-lg mb-4">
            <img
              src={deposit.qrCodeUrl}
              alt={`VietQR ${deposit.depositCode}`}
              className="h-64 w-64 object-contain rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium animate-pulse">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Đang chờ chuyển khoản (Tự động kiểm tra 3s/lần)...</span>
          </div>
        </div>

        {/* Bank Details Box */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <div>
            <h2 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>Thông tin chuyển khoản</span>
              <span className="text-xs font-mono font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                {deposit.depositCode}
              </span>
            </h2>

            <div className="space-y-4">
              {/* Ngân hàng */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Ngân hàng:</span>
                <span className="font-bold text-white">{deposit.bankInfo.bankId} (Tiên Phong Bank)</span>
              </div>

              {/* Số tài khoản */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-300 text-base">
                    {deposit.bankInfo.accountNo}
                  </span>
                  <button
                    onClick={() => copyToClipboard(deposit.bankInfo.accountNo, "accNo")}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === "accNo" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Chủ tài khoản */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Chủ tài khoản:</span>
                <span className="font-semibold text-slate-200">{deposit.bankInfo.accountName}</span>
              </div>

              {/* Số tiền */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Số tiền nạp:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-400 text-lg">
                    {deposit.amount.toLocaleString("vi-VN")}đ
                  </span>
                  <button
                    onClick={() => copyToClipboard(deposit.amount.toString(), "amount")}
                    className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                    title="Sao chép số tiền"
                  >
                    {copiedField === "amount" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Nội dung bắt buộc */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300">
                <div className="font-bold mb-1 flex items-center justify-between">
                  <span>NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):</span>
                  <button
                    onClick={() => copyToClipboard(deposit.depositCode, "memo")}
                    className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-amber-200 hover:bg-amber-500/30"
                  >
                    {copiedField === "memo" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>Sao chép</span>
                  </button>
                </div>
                <div className="font-mono text-base font-black text-amber-400 tracking-wider">
                  {deposit.depositCode}
                </div>
                <div className="text-[11px] text-amber-200/80 mt-1">
                  * Vui lòng giữ nguyên nội dung trên để hệ thống tự động cộng tiền sau 3 giây.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-500" />
              <span>Hết hạn sau 30 phút</span>
            </span>
            <button
              onClick={() => checkStatus()}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Tôi đã chuyển khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
