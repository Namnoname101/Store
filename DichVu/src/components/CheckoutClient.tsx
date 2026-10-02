"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  Check,
  QrCode,
  Building2,
  CreditCard,
  Hash,
  AlertCircle,
  Loader2,
  RefreshCw,
  Clock,
  ShieldCheck,
  ArrowLeft,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { formatVND } from "@/components/ProductCard";
import type { OrderDetailsResponse } from "@/services/order.service";

export interface BankConfig {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
}

export interface CheckoutClientProps {
  order: OrderDetailsResponse;
  bankConfig?: BankConfig;
}

export default function CheckoutClient({
  order,
  bankConfig = {
    bankId: "MB",
    bankName: "MBBank - Ngân hàng TMCP Quân Đội",
    accountNo: "0987654321",
    accountName: "DIGISTORE VIET NAM",
  },
}: CheckoutClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState<string>(order.status);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // If already paid at mount, navigate immediately
  useEffect(() => {
    if (status === "PAID") {
      router.push(`/order-success/${order.orderCode}`);
    }
  }, [status, order.orderCode, router]);

  // Polling every 3 seconds while order is PENDING
  useEffect(() => {
    if (status !== "PENDING") {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${order.orderCode}/status`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.status && data.status !== status) {
          setStatus(data.status);
          if (data.status === "PAID") {
            router.push(`/order-success/${order.orderCode}`);
          }
        }
      } catch {
        // Silently retry on next tick
      }
    };

    pollingRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, order.orderCode, router]);

  const handleCopy = async (field: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleManualCheck = async () => {
    setIsVerifying(true);
    setVerificationNotice(null);

    try {
      const res = await fetch(`/api/orders/${order.orderCode}/status`);
      const data = await res.json();

      if (data.status === "PAID") {
        setStatus("PAID");
        router.push(`/order-success/${order.orderCode}`);
      } else if (data.status === "EXPIRED") {
        setStatus("EXPIRED");
        setVerificationNotice("Đơn hàng đã hết hạn hiệu lực 15 phút.");
      } else {
        setVerificationNotice(
          "Chưa nhận được giao dịch từ ngân hàng. Thường mất 10-30 giây để xử lý chuyển khoản liên ngân hàng 24/7."
        );
      }
    } catch {
      setVerificationNotice(
        "Không thể kiểm tra giao dịch vào lúc này. Vui lòng thử lại sau vài giây."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTimerExpire = () => {
    setStatus("EXPIRED");
  };

  const isExpired = status === "EXPIRED";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 pb-20">
      {/* Top Breadcrumb & Status Indicator */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Về trang chủ</span>
        </Link>

        <div className="flex items-center gap-3">
          {status === "PENDING" && (
            <CountdownTimer
              expiresAt={order.expiresAt}
              onExpire={handleTimerExpire}
            />
          )}

          {isExpired ? (
            <span className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400">
              Đơn hàng hết hạn
            </span>
          ) : status === "PAID" ? (
            <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
              Đã thanh toán
            </span>
          ) : (
            <span className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Chờ thanh toán VietQR
            </span>
          )}
        </div>
      </div>

      {/* Expired Notification Notice */}
      {isExpired && (
        <div className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center backdrop-blur-md">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">
            Đơn hàng #{order.orderCode} đã hết hạn
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-5 leading-relaxed">
            Thời gian tạm giữ kho 15 phút đã kết thúc. Sản phẩm đã được hoàn trả lại kho
            tự động để tránh tình trạng đọng key. Nếu bạn đã chuyển khoản, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật để được hỗ trợ kiểm tra đối soát thủ công.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/30"
            >
              Chọn mua sản phẩm khác
            </Link>
            <a
              href="https://zalo.me/0987654321"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-5 py-2.5 text-xs font-semibold text-slate-200 transition-all"
            >
              Hỗ trợ đối soát (Zalo)
            </a>
          </div>
        </div>
      )}

      {/* Main Checkout View: QR Card + Payment Details Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: QR Code Scan & instructions */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 p-6 backdrop-blur-md shadow-2xl text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="h-5 w-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                Quét mã VietQR để thanh toán
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Mở ứng dụng Mobile Banking của mọi ngân hàng để quét mã QR và xác nhận giao dịch.
            </p>

            {/* QR Image Frame */}
            <div className="relative mx-auto inline-block rounded-2xl bg-white p-3.5 shadow-2xl ring-4 ring-indigo-500/20">
              {order.vietQrUrl ? (
                <img
                  src={order.vietQrUrl}
                  alt={`VietQR thanh toán đơn hàng ${order.orderCode}`}
                  className="mx-auto aspect-square w-64 max-w-full rounded-lg object-contain"
                />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center bg-slate-100 text-slate-400 text-xs">
                  Không thể tải mã QR
                </div>
              )}
            </div>

            {/* Security Note under QR */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Chuyển khoản liên ngân hàng Napas 24/7 tức thì</span>
            </div>
          </div>

          {/* Purchased Items Summary */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800/80">
              <ShoppingBag className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Thông tin đơn hàng ({order.orderItems.length} mục)
              </h3>
            </div>

            <div className="space-y-3">
              {order.orderItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-3">
                    <p className="font-medium text-white truncate">
                      {item.product?.title || "Sản phẩm số"}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Số lượng: <strong>{item.quantity}</strong>
                    </p>
                  </div>
                  <span className="font-semibold text-slate-300 shrink-0">
                    {formatVND(item.price * item.quantity)}
                  </span>
                </div>
              ))}

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Email nhận hàng:</span>
                <span className="font-mono font-medium text-indigo-300 truncate max-w-[200px]">
                  {order.customerEmail}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Bank Transfer Fields with 1-Click Copy */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-2">
              Hoặc chuyển khoản thủ công
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Nếu không quét được mã QR, bạn có thể sao chép thông tin tài khoản bên dưới để chuyển khoản bằng tay:
            </p>

            {/* Copyable Fields */}
            <div className="space-y-4">
              {/* Field 1: Ngân hàng & Chủ tài khoản */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition-all hover:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Ngân hàng & Chủ tài khoản</span>
                    </div>
                    <div className="text-sm font-bold text-white truncate">
                      {bankConfig.bankName}
                    </div>
                    <div className="text-xs font-semibold text-indigo-300 mt-0.5">
                      {bankConfig.accountName}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy("bank", `${bankConfig.accountName}`)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                      copiedField === "bank"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    {copiedField === "bank" ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Field 2: Số tài khoản */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition-all hover:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Số tài khoản thụ hưởng</span>
                    </div>
                    <div className="font-mono text-lg font-extrabold text-white tracking-wider">
                      {bankConfig.accountNo}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy("accountNo", bankConfig.accountNo)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                      copiedField === "accountNo"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    {copiedField === "accountNo" ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Field 3: Số tiền thanh toán */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 transition-all hover:border-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Số tiền chính xác</span>
                    </div>
                    <div className="text-xl font-black text-indigo-400">
                      {formatVND(order.totalAmount)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy("amount", order.totalAmount.toString())}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                      copiedField === "amount"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    {copiedField === "amount" ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Đã chép số tiền</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Field 4: Nội dung chuyển khoản (Crucial) */}
              <div className="rounded-2xl border-2 border-indigo-500/40 bg-indigo-950/20 p-4 shadow-lg shadow-indigo-950/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                      <Hash className="h-3.5 w-3.5 text-amber-400" />
                      <span>Nội dung chuyển khoản (BẮT BUỘC ĐÚNG)</span>
                    </div>
                    <div className="font-mono text-xl sm:text-2xl font-black text-white tracking-widest select-all">
                      {order.orderCode}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy("memo", order.orderCode)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md ${
                      copiedField === "memo"
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.02]"
                    }`}
                  >
                    {copiedField === "memo" ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Đã chép mã</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Sao chép nội dung</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-amber-300/90 leading-tight">
                  ⚠️ <strong>Quan trọng:</strong> Vui lòng giữ nguyên mã <strong>{order.orderCode}</strong> trong nội dung chuyển khoản để bot tự động nhận diện và bàn giao mã kích hoạt sau 10-30 giây.
                </p>
              </div>
            </div>

            {/* Manual Verification Button */}
            <div className="mt-6 pt-6 border-t border-slate-800/80">
              <button
                type="button"
                disabled={isVerifying || isExpired}
                onClick={handleManualCheck}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-750 py-3.5 px-6 text-sm font-bold text-white border border-slate-700 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span>Đang kiểm tra giao dịch với ngân hàng...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 text-indigo-400" />
                    <span>Tôi đã chuyển khoản - Kiểm tra ngay</span>
                  </>
                )}
              </button>

              {verificationNotice && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-slate-700/60 bg-slate-850 p-3 text-xs text-slate-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>{verificationNotice}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
