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
  ShieldCheck,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  PhoneCall,
  Send,
  Wallet,
  Zap,
  PlusCircle,
} from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { formatVND } from "@/components/ProductCard";
import type { OrderDetailsResponse } from "@/services/order.service";
import { playSuccessChime } from "@/lib/sound";
import { saveRecentOrder } from "@/lib/order-storage";

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
  const [upstreamStatus, setUpstreamStatus] = useState<string | undefined>(
    order.upstreamStatus
  );
  const [refundInfo, setRefundInfo] = useState<any>(() => {
    if (order.refundInfo) {
      try {
        return JSON.parse(order.refundInfo);
      } catch {
        return { raw: order.refundInfo };
      }
    }
    return null;
  });

  const [currentVietQrUrl, setCurrentVietQrUrl] = useState<string | undefined>(
    order.vietQrUrl
  );
  const [currentTotal, setCurrentTotal] = useState<number>(order.totalAmount);
  const [currentExpiresAt, setCurrentExpiresAt] = useState<Date | string>(
    order.expiresAt
  );
  const [reconciliationStatus, setReconciliationStatus] = useState<string | null | undefined>(
    order.reconciliationStatus
  );
  const [reconciliationNote, setReconciliationNote] = useState<string | null | undefined>(
    order.reconciliationNote
  );
  const [isRegeneratingQR, setIsRegeneratingQR] = useState<boolean>(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [priceChangedNotice, setPriceChangedNotice] = useState<string | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);

  // Refund Form State
  const [refundBank, setRefundBank] = useState<string>("");
  const [refundAccountNo, setRefundAccountNo] = useState<string>("");
  const [refundAccountName, setRefundAccountName] = useState<string>("");
  const [refundNote, setRefundNote] = useState<string>("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState<boolean>(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [refundSuccessMsg, setRefundSuccessMsg] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // User wallet state
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; balance: number } | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"VIETQR" | "WALLET">("VIETQR");
  const [isPayingWallet, setIsPayingWallet] = useState<boolean>(false);
  const [walletPayError, setWalletPayError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setCurrentUser(data.user);
          if (data.user.balance >= currentTotal) {
            setSelectedMethod("WALLET");
          }
        }
      })
      .catch(() => {});
  }, [currentTotal]);

  const handleWalletPayment = async () => {
    setWalletPayError(null);
    setIsPayingWallet(true);
    try {
      const res = await fetch(`/api/orders/${order.orderCode}/pay-with-wallet`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setWalletPayError(data.message || "Thanh toán bằng số dư ví thất bại");
        setIsPayingWallet(false);
        return;
      }

      playSuccessChime();
      setStatus("PAID");
      const tokenParam = order.accessToken ? `?token=${order.accessToken}` : "";
      router.push(`/order-success/${order.orderCode}${tokenParam}`);
    } catch {
      setWalletPayError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
      setIsPayingWallet(false);
    }
  };

  const handleRegenerateQR = async () => {
    setIsRegeneratingQR(true);
    setRegenerateError(null);
    setPriceChangedNotice(null);
    try {
      const res = await fetch(`/api/orders/${order.orderCode}/regenerate-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: order.accessToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRegenerateError(data.error || "Không thể tạo lại mã QR.");
        setIsRegeneratingQR(false);
        return;
      }

      if (data.paymentIntent) {
        setCurrentVietQrUrl(data.paymentIntent.qrUrl);
        setCurrentExpiresAt(data.paymentIntent.expiresAt);
        setCurrentTotal(data.paymentIntent.amount);
        setStatus("PENDING");
        if (data.priceChanged && data.message) {
          setPriceChangedNotice(data.message);
        }
      }
    } catch {
      setRegenerateError("Lỗi kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setIsRegeneratingQR(false);
    }
  };

  // Save order to LocalStorage on mount
  useEffect(() => {
    const itemsSummary =
      order.orderItems?.map((i) => i.product?.title || "Sản phẩm").join(", ") ||
      "Sản phẩm số";
    saveRecentOrder({
      orderCode: order.orderCode,
      accessToken: order.accessToken,
      totalAmount: currentTotal,
      customerEmail: order.customerEmail,
      createdAt: order.createdAt ? String(order.createdAt) : new Date().toISOString(),
      itemsSummary,
      status: order.status,
    });
  }, [order, currentTotal]);

  // If already paid and completed, navigate immediately
  useEffect(() => {
    if (status === "PAID") {
      if (
        upstreamStatus === "COMPLETED" ||
        !upstreamStatus ||
        upstreamStatus === "NOT_APPLICABLE"
      ) {
        const tokenParam = order.accessToken ? `?token=${order.accessToken}` : "";
        router.push(`/order-success/${order.orderCode}${tokenParam}`);
      }
    }
  }, [status, upstreamStatus, order.orderCode, order.accessToken, router]);

  // Polling while PENDING or while PAID with PENDING_UPSTREAM
  useEffect(() => {
    const shouldPoll =
      status === "PENDING" ||
      (status === "PAID" && upstreamStatus === "PENDING_UPSTREAM");

    if (!shouldPoll) {
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
        }
        if (
          data.upstreamStatus !== undefined &&
          data.upstreamStatus !== upstreamStatus
        ) {
          setUpstreamStatus(data.upstreamStatus);
        }
        if (data.reconciliationStatus !== undefined) {
          setReconciliationStatus(data.reconciliationStatus);
        }
        if (data.reconciliationNote !== undefined) {
          setReconciliationNote(data.reconciliationNote);
        }
        if (data.totalAmount !== undefined && data.totalAmount !== currentTotal) {
          setCurrentTotal(data.totalAmount);
        }
        if (data.refundInfo && !refundInfo) {
          setRefundInfo(data.refundInfo);
        }

        if (data.status === "PAID") {
          playSuccessChime();
          const itemsSummary =
            order.orderItems?.map((i) => i.product?.title || "Sản phẩm").join(", ") ||
            "Sản phẩm số";
          saveRecentOrder({
            orderCode: order.orderCode,
            accessToken: order.accessToken,
            totalAmount: currentTotal,
            customerEmail: order.customerEmail,
            createdAt: order.createdAt ? String(order.createdAt) : new Date().toISOString(),
            itemsSummary,
            status: "PAID",
          });
          if (
            data.upstreamStatus === "COMPLETED" ||
            !data.upstreamStatus ||
            data.upstreamStatus === "NOT_APPLICABLE"
          ) {
            const tokenParam = order.accessToken ? `?token=${order.accessToken}` : "";
            router.push(`/order-success/${order.orderCode}${tokenParam}`);
          }
        }
      } catch {
        // Silently retry on next tick
      }
    };

    pollingRef.current = setInterval(checkStatus, 2500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, upstreamStatus, refundInfo, order, currentTotal, router]);

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
        if (data.upstreamStatus !== undefined) {
          setUpstreamStatus(data.upstreamStatus);
        }
        if (data.refundInfo) {
          setRefundInfo(data.refundInfo);
        }

        if (
          data.upstreamStatus === "COMPLETED" ||
          !data.upstreamStatus ||
          data.upstreamStatus === "NOT_APPLICABLE"
        ) {
          router.push(`/order-success/${order.orderCode}`);
        } else if (data.upstreamStatus === "PENDING_UPSTREAM") {
          setVerificationNotice(
            "Thanh toán thành công! Hệ thống đang tự động cấp phát mã, vui lòng đợi trong giây lát."
          );
        } else if (data.upstreamStatus === "FAILED") {
          setVerificationNotice(
            "Máy chủ cấp phát mã đang bị quá tải hoặc tạm thời gián đoạn. Vui lòng gửi thông tin nhận hoàn tiền bên dưới."
          );
        }
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

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError(null);

    if (
      !refundBank.trim() ||
      !refundAccountNo.trim() ||
      !refundAccountName.trim()
    ) {
      setRefundError(
        "Vui lòng điền đầy đủ tên ngân hàng, số tài khoản và họ tên chủ tài khoản."
      );
      return;
    }

    setIsSubmittingRefund(true);
    try {
      const res = await fetch(`/api/orders/${order.orderCode}/refund-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: refundBank.trim(),
          accountNumber: refundAccountNo.trim(),
          accountName: refundAccountName.trim(),
          note: refundNote.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRefundError(
          data.error || "Không thể gửi yêu cầu hoàn tiền. Vui lòng thử lại."
        );
      } else {
        setRefundSuccessMsg(
          data.message ||
            "Yêu cầu hoàn tiền của bạn đã được ghi nhận. Nhân viên CSKH sẽ chuyển khoản lại theo thông tin đã cung cấp."
        );
        setRefundInfo({
          bankName: refundBank.trim(),
          accountNumber: refundAccountNo.trim(),
          accountName: refundAccountName.trim().toUpperCase(),
          note: refundNote.trim(),
          requestedAt: new Date().toISOString(),
        });
      }
    } catch {
      setRefundError("Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleTimerExpire = () => {
    setStatus("EXPIRED");
  };

  const isExpired = status === "EXPIRED";
  const isPaidPendingFulfillment =
    status === "PAID" && upstreamStatus === "PENDING_UPSTREAM";
  const isPaidFulfillmentFailed =
    status === "PAID" && upstreamStatus === "FAILED";

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
          {status === "PENDING" && !isExpired && (
            <CountdownTimer
              expiresAt={currentExpiresAt}
              onExpire={handleTimerExpire}
            />
          )}

          {isExpired ? (
            <span className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400">
              Đơn hàng hết hạn (10 phút)
            </span>
          ) : isPaidPendingFulfillment ? (
            <span className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
              <span>Hệ thống đang cấp phát tự động...</span>
            </span>
          ) : isPaidFulfillmentFailed ? (
            <span className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              <span>Máy chủ cấp phát quá tải - Hỗ trợ hoàn tiền</span>
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

      {/* 4-Stage Progress Indicator */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              status === "PENDING" && !isExpired
                ? "border-blue-500/50 bg-blue-500/10 text-blue-400 font-bold"
                : "border-slate-800 text-slate-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600/20 text-[10px] font-bold">
              1
            </span>
            <span>1. Chờ thanh toán</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              isVerifying || reconciliationStatus === "UNDERPAID" || reconciliationStatus === "EXPIRED_PAYMENT"
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400 font-bold"
                : "border-slate-800 text-slate-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600/20 text-[10px] font-bold">
              2
            </span>
            <span>2. Đang xác minh</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              isPaidPendingFulfillment
                ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 font-bold"
                : "border-slate-800 text-slate-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/20 text-[10px] font-bold">
              3
            </span>
            <span>3. Đang xử lý</span>
          </div>

          <div
            className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
              status === "PAID" && !isPaidPendingFulfillment && !isPaidFulfillmentFailed
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 font-bold"
                : "border-slate-800 text-slate-400"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600/20 text-[10px] font-bold">
              4
            </span>
            <span>4. Hoàn thành</span>
          </div>
        </div>
      </div>

      {/* Price Changed Alert Banner */}
      {priceChangedNotice && (
        <div className="mb-6 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4 text-xs text-sky-300 font-medium flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-sky-400 shrink-0" />
          <span>{priceChangedNotice}</span>
        </div>
      )}

      {/* Underpaid Reconciliation Banner */}
      {reconciliationStatus === "UNDERPAID" && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                Đã ghi nhận thanh toán một phần — Chờ đối soát
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {reconciliationNote ||
                  "Hệ thống đã nhận được tiền chuyển khoản nhưng chưa đủ tổng giá trị đơn hàng. Giao dịch đang chờ Chủ sở hữu kiểm tra đối soát."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expired Payment Reconciliation Banner */}
      {reconciliationStatus === "EXPIRED_PAYMENT" && (
        <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                Thanh toán sau khi hết hạn 10 phút — Chờ Chủ sở hữu xử lý
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {reconciliationNote ||
                  "Giao dịch chuyển khoản được ghi nhận sau khi mã QR hết hiệu lực. Chúng tôi đã chuyển thông tin cho Chủ sở hữu để kiểm tra và cấp hàng thủ công cho bạn."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CASE 1: PENDING_UPSTREAM Banner */}
      {isPaidPendingFulfillment && (
        <div className="mb-8 space-y-6">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 p-8 sm:p-10 shadow-2xl text-center">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-950/50">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-300 mb-3">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Đã ghi nhận thanh toán thành công</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-3">
                Hệ Thống Đang Cấp Phát Sản Phẩm Tự Động
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed mb-6 font-medium">
                Hệ thống đang cấp phát mã bản quyền / tài khoản tự động cho bạn, vui lòng đợi trong giây lát (khoảng 5-15 giây)...
              </p>

              {/* Animated Progress Bar */}
              <div className="w-full max-w-md mx-auto mb-8">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full w-full bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 animate-pulse" />
                </div>
              </div>

              {/* Progress Steps Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl text-left">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                    <Check className="h-4 w-4 shrink-0" />
                    <span>1. Nhận chuyển khoản</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Giao dịch VietQR hợp lệ đã khớp
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-3.5 ring-2 ring-indigo-500/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-1">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0 text-indigo-400" />
                    <span>2. Khởi tạo mã tự động</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Máy chủ cấp phát mã đang xử lý
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-slate-500" />
                    <span>3. Bàn giao mã tức thì</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tự động chuyển trang nhận key
                  </p>
                </div>
              </div>

              <p className="mt-6 text-xs text-slate-400">
                ⚡ Bạn không cần tải lại trang. Hệ thống sẽ tự động cập nhật ngay khi hoàn tất.
              </p>
            </div>
          </div>

          {/* Purchased Items Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800/80">
              <ShoppingBag className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Chi tiết đơn hàng #{order.orderCode}
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
                <span className="text-slate-400">Email nhận thông báo:</span>
                <span className="font-mono font-medium text-indigo-300 truncate max-w-[200px]">
                  {order.customerEmail || "Không có (Khách vãng lai)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASE 2: FAILED Status & Self-Service Refund Form */}
      {isPaidFulfillmentFailed && (
        <div className="mb-8 space-y-6">
          {/* Issue Notification Banner */}
          <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-400 mb-2">
                  <span>Thông báo cấp phát sản phẩm</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                  Đơn hàng #{order.orderCode} - Đang xử lý hỗ trợ
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Máy chủ cấp phát mã đang bị quá tải hoặc tạm thời gián đoạn. Chúng tôi cam kết xử lý hoàn tiền tự động hoặc gửi mã qua email cho bạn trong vòng 5-15 phút.
                </p>
              </div>
            </div>
          </div>

          {/* Refund Form or Refund Submitted Status */}
          {refundInfo || refundSuccessMsg ? (
            <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 sm:p-8 backdrop-blur-md shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Đã Ghi Nhận Yêu Cầu Hoàn Tiền
                  </h3>
                  <p className="text-xs text-emerald-400">
                    {refundSuccessMsg ||
                      "Yêu cầu hoàn tiền của bạn đã được ghi nhận. Nhân viên CSKH sẽ chuyển khoản lại theo thông tin đã cung cấp."}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-white">
                    {refundInfo?.bankName || refundBank}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Số tài khoản:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {refundInfo?.accountNumber || refundAccountNo}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Chủ tài khoản:</span>
                  <span className="font-bold text-white">
                    {refundInfo?.accountName || refundAccountName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Số tiền hoàn trả:</span>
                  <span className="text-sm font-extrabold text-indigo-400">
                    {formatVND(order.totalAmount)}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400 leading-relaxed">
                Đội ngũ kỹ thuật và CSKH sẽ kiểm tra đối soát và hoàn tiền vào tài khoản trên trong vòng <strong>5-15 phút</strong>. Cảm ơn sự thông cảm của bạn!
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                  Yêu Cầu Hoàn Tiền Tự Động (100% Số Tiền)
                </h3>
                <p className="text-xs text-slate-400">
                  Vui lòng cung cấp số tài khoản ngân hàng để hệ thống hoàn lại{" "}
                  <strong className="text-indigo-400">
                    {formatVND(order.totalAmount)}
                  </strong>{" "}
                  ngay lập tức:
                </p>
              </div>

              {refundError && (
                <div className="mb-5 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{refundError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitRefund} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tên ngân hàng thụ hưởng <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={refundBank}
                    onChange={(e) => setRefundBank(e.target.value)}
                    placeholder="Ví dụ: MBBank, Vietcombank, Techcombank, VPBank..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Số tài khoản ngân hàng <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={refundAccountNo}
                      onChange={(e) => setRefundAccountNo(e.target.value)}
                      placeholder="Nhập số tài khoản..."
                      className="w-full font-mono rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Họ và tên chủ tài khoản <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={refundAccountName}
                      onChange={(e) => setRefundAccountName(e.target.value)}
                      placeholder="Ví dụ: NGUYEN VAN A"
                      className="w-full uppercase rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Ghi chú thêm (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={refundNote}
                    onChange={(e) => setRefundNote(e.target.value)}
                    placeholder="Ghi chú thêm nếu có..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingRefund}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 px-6 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.01] disabled:opacity-50"
                  >
                    {isSubmittingRefund ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Đang gửi thông tin yêu cầu...</span>
                      </>
                    ) : (
                      <span>Gửi yêu cầu hoàn tiền ngay</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Emergency Support Channels */}
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-purple-950/40 p-5 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Cần hỗ trợ trực tiếp từ đội ngũ kỹ thuật?</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Đội ngũ chăm sóc khách hàng và kỹ thuật viên sẵn sàng giải đáp 24/7.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href="https://zalo.me/0987654321"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/20 hover:scale-[1.02]"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Zalo Hỗ Trợ</span>
                </a>

                <a
                  href="https://t.me/digistore_support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-3.5 py-2 text-xs font-bold text-white transition-all shadow-md shadow-sky-500/20 hover:scale-[1.02]"
                >
                  <Send className="h-4 w-4" />
                  <span>Telegram 24/7</span>
                </a>

                <a
                  href="tel:0987654321"
                  className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-750 px-3.5 py-2 text-xs font-bold text-slate-200 transition-all hover:scale-[1.02]"
                >
                  <PhoneCall className="h-4 w-4 text-emerald-400" />
                  <span>0987.654.321</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expired Notification Notice with 1-Click QR Regeneration */}
      {isExpired && (
        <div className="mb-8 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center backdrop-blur-md">
          <AlertCircle className="mx-auto h-10 w-10 text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">
            Mã QR đơn hàng #{order.orderCode} đã hết hạn (10 phút)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mb-5 leading-relaxed">
            Thời gian thanh toán 10 phút đã kết thúc. Bạn có thể bấm tạo lại mã QR bên dưới để kiểm tra lại tồn kho, giá sản phẩm và tiếp tục thanh toán an toàn.
          </p>
          {regenerateError && (
            <div className="mb-4 max-w-md mx-auto p-3 rounded-xl border border-rose-500/40 bg-rose-500/20 text-xs text-rose-300 font-medium">
              {regenerateError}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRegenerateQR}
              disabled={isRegeneratingQR}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-xs font-bold text-white transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {isRegeneratingQR ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang kiểm tra và tạo lại mã QR...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span>Tạo lại mã QR thanh toán (10 phút mới)</span>
                </>
              )}
            </button>
            <Link
              href="/"
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-5 py-2.5 text-xs font-semibold text-slate-200 transition-all"
            >
              Chọn mua sản phẩm khác
            </Link>
          </div>
        </div>
      )}

      {/* Payment Method Selector (VietQR vs Wallet) */}
      {!isPaidPendingFulfillment && !isPaidFulfillmentFailed && !isExpired && (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Chọn phương thức thanh toán
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: VietQR */}
            <button
              type="button"
              onClick={() => setSelectedMethod("VIETQR")}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                selectedMethod === "VIETQR"
                  ? "border-indigo-500 bg-indigo-950/30 ring-1 ring-indigo-500 text-white"
                  : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">Chuyển khoản VietQR</div>
                  <div className="text-[11px] text-slate-400">Quét mã QR từ mọi ngân hàng</div>
                </div>
              </div>
              <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedMethod === "VIETQR" ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-600"}`}>
                {selectedMethod === "VIETQR" && <Check className="h-3 w-3" />}
              </div>
            </button>

            {/* Option 2: Wallet Balance */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => setSelectedMethod("WALLET")}
                className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedMethod === "WALLET"
                    ? "border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500 text-white"
                    : "border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span>Ví thành viên</span>
                      <span className="text-xs text-emerald-400 font-extrabold">
                        ({currentUser.balance.toLocaleString("vi-VN")}đ)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">Thanh toán tức thì 1-click</div>
                  </div>
                </div>
                <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedMethod === "WALLET" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-600"}`}>
                  {selectedMethod === "WALLET" && <Check className="h-3 w-3" />}
                </div>
              </button>
            ) : (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/checkout/${order.orderCode}`)}`}
                className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Thanh toán bằng số dư ví?</div>
                    <div className="text-[11px] text-indigo-400 font-semibold">Đăng nhập để dùng ví & nhận key 1-click →</div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Wallet Checkout Card (Shown when selectedMethod === 'WALLET') */}
      {selectedMethod === "WALLET" && currentUser && !isPaidPendingFulfillment && !isPaidFulfillmentFailed && !isExpired && (
        <div className="mb-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/20 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <div className="max-w-xl mx-auto text-center">
            <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-4 shadow-lg shadow-emerald-950/50">
              <Wallet className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">
              Thanh toán bằng Số dư Ví Thành viên
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Số tiền đơn hàng sẽ được trừ trực tiếp và hệ thống sẽ cấp phát ngay lập tức.
            </p>

            {walletPayError && (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 text-left">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{walletPayError}</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 mb-6 space-y-2.5 text-xs text-left">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Số dư ví hiện tại:</span>
                <span className="text-sm font-bold text-emerald-300">{currentUser.balance.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tổng tiền đơn hàng:</span>
                <span className="text-sm font-extrabold text-white">{formatVND(order.totalAmount)}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between items-center">
                <span className="text-slate-400">Số dư còn lại sau khi thanh toán:</span>
                <span className={`text-sm font-bold ${currentUser.balance >= order.totalAmount ? "text-slate-200" : "text-rose-400"}`}>
                  {currentUser.balance >= order.totalAmount
                    ? (currentUser.balance - order.totalAmount).toLocaleString("vi-VN") + "đ"
                    : "Không đủ số dư"}
                </span>
              </div>
            </div>

            {currentUser.balance >= order.totalAmount ? (
              <button
                type="button"
                onClick={handleWalletPayment}
                disabled={isPayingWallet}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:from-emerald-500 hover:to-teal-400 focus:outline-none disabled:opacity-60 transition-all cursor-pointer"
              >
                {isPayingWallet ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Xác nhận thanh toán ngay (1-click)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  Số dư ví không đủ. Bạn cần nạp thêm ít nhất{" "}
                  <strong>{(order.totalAmount - currentUser.balance).toLocaleString("vi-VN")}đ</strong> để hoàn tất đơn hàng.
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    href="/topup"
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white hover:bg-indigo-500"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Nạp tiền vào ví ngay (Mở tab mới)</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("VIETQR")}
                    className="flex-1 py-3 text-xs font-medium text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-750"
                  >
                    Chuyển sang quét mã VietQR
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Standard Checkout View: QR Card + Payment Details Card (Shown when pending payment) */}
      {!isPaidPendingFulfillment && !isPaidFulfillmentFailed && selectedMethod === "VIETQR" && (
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
                {isExpired ? (
                  <div className="flex h-64 w-64 flex-col items-center justify-center rounded-lg bg-slate-900/95 p-4 text-center">
                    <AlertCircle className="h-10 w-10 text-rose-400 mb-2" />
                    <span className="text-xs font-bold text-white mb-1">Mã QR đã hết hạn</span>
                    <span className="text-[11px] text-slate-400 mb-4">
                      Thời gian hiệu lực 10 phút đã kết thúc
                    </span>
                    <button
                      type="button"
                      onClick={handleRegenerateQR}
                      disabled={isRegeneratingQR}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      {isRegeneratingQR ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Đang tạo lại...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Tạo lại mã QR</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : currentVietQrUrl ? (
                  <img
                    src={currentVietQrUrl}
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

                {order.discountAmount && order.discountAmount > 0 ? (
                  <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Tạm tính:</span>
                      <span>{formatVND(order.subtotalAmount || order.totalAmount + order.discountAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400 font-medium">
                      <span>Ưu đãi giảm giá:</span>
                      <span>- {formatVND(order.discountAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-white font-bold pt-1 border-t border-slate-800/40">
                      <span>Tổng thanh toán:</span>
                      <span className="text-indigo-400 font-extrabold">{formatVND(order.totalAmount)}</span>
                    </div>
                  </div>
                ) : null}

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Email nhận hàng:</span>
                  <span className="font-mono font-medium text-indigo-300 truncate max-w-[200px]">
                    {order.customerEmail || "Không có (Khách vãng lai)"}
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
                        {formatVND(currentTotal)}
                      </div>
                      {order.discountAmount && order.discountAmount > 0 ? (
                        <div className="text-[11px] text-emerald-400 font-medium mt-0.5">
                          ✓ Đã áp dụng ưu đãi -{formatVND(order.discountAmount)}
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy("amount", currentTotal.toString())}
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

                {/* Field 4: Nội dung chuyển khoản */}
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
                    ⚠️ <strong>Quan trọng:</strong> Vui lòng giữ nguyên mã <strong>{order.orderCode}</strong> trong nội dung chuyển khoản để hệ thống tự động nhận diện và bàn giao mã kích hoạt sau 10-30 giây.
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
      )}
    </div>
  );
}
