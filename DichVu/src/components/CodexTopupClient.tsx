"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  CreditCard,
  RefreshCw,
  Info,
} from "lucide-react";
import { CODEX_PACKAGES, CodexPackage } from "@/lib/codex.constants";

interface VerifiedKeyData {
  bindingId: string;
  maskedKey: string;
  keyName: string;
  currentQuotaUsd: number;
}

export default function CodexTopupClient() {
  const router = useRouter();

  // Mode: "has_key" | "no_key"
  const [hasKeyMode, setHasKeyMode] = useState<"has_key" | "no_key">("has_key");

  // Key verification states
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifiedKey, setVerifiedKey] = useState<VerifiedKeyData | null>(null);

  // Saved keys for authenticated users
  const [savedKeys, setSavedKeys] = useState<any[]>([]);
  const [isLoadingSavedKeys, setIsLoadingSavedKeys] = useState(false);

  // Package selection
  const [selectedPackage, setSelectedPackage] = useState<CodexPackage>(
    CODEX_PACKAGES.find((p) => p.popular) || CODEX_PACKAGES[1]
  );

  // Customer info & coupon
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [customerNote, setCustomerNote] = useState("");

  // Checkout states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderCode: string;
    totalAmount: number;
    vietQrUrl: string;
    expiresAt: string;
  } | null>(null);

  // Payment status polling
  const [paymentStatus, setPaymentStatus] = useState<string>("PENDING");
  const [copiedMemo, setCopiedMemo] = useState(false);

  // Load saved keys if user is logged in
  useEffect(() => {
    setIsLoadingSavedKeys(true);
    fetch("/api/codex/my-keys")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.success && Array.isArray(data.keys)) {
          setSavedKeys(data.keys);
          if (data.keys.length > 0 && !verifiedKey) {
            const first = data.keys[0];
            setVerifiedKey({
              bindingId: first.id,
              maskedKey: first.maskedKey,
              keyName: first.keyName || "API Key đã liên kết",
              currentQuotaUsd: 0,
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingSavedKeys(false));
  }, []);

  // Poll order status if order created
  useEffect(() => {
    if (!orderResult || paymentStatus === "PAID" || paymentStatus === "COMPLETED")
      return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderResult.orderCode}`);
        if (res.ok) {
          const data = await res.json();
          const currentStatus = data?.order?.status || data?.status;
          if (currentStatus === "PAID" || currentStatus === "COMPLETED") {
            setPaymentStatus("PAID");
            clearInterval(interval);
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderResult, paymentStatus]);

  // Handle Verify Key
  const handleVerifyKey = async (keyToVerify?: string) => {
    const key = (keyToVerify !== undefined ? keyToVerify : apiKeyInput).trim();
    if (!key) {
      setVerifyError("Vui lòng nhập API Key bắt đầu bằng 'sk-'");
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const res = await fetch("/api/codex/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key, email: email || undefined }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setVerifyError(
          data.error || "API Key không hợp lệ hoặc đã bị gắn với tài khoản khác"
        );
        setVerifiedKey(null);
      } else {
        setVerifiedKey({
          bindingId: data.bindingId,
          maskedKey: data.maskedKey,
          keyName: data.keyName || "API Key của bạn",
          currentQuotaUsd: data.currentQuotaUsd || 0,
        });
        setApiKeyInput("");
      }
    } catch (err: any) {
      setVerifyError(err.message || "Lỗi mạng khi kiểm tra API Key");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Checkout Submit
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedKey) {
      setCheckoutError("Vui lòng kiểm tra và xác nhận API Key trước khi thanh toán");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/codex/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bindingId: verifiedKey.bindingId,
          packageId: selectedPackage.id,
          email: email || undefined,
          couponCode: couponCode || undefined,
          customerNote: customerNote || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCheckoutError(data.error || "Không thể tạo đơn nạp credit");
      } else {
        setOrderResult({
          orderCode: data.orderCode,
          totalAmount: data.totalAmount,
          vietQrUrl: data.vietQrUrl,
          expiresAt: data.expiresAt,
        });
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Lỗi kết nối khi tạo đơn hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header Banner */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
          <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
          <span>DaiTruong Codex Credit Platform</span>
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          Nạp Tự Động API Credit & Quota
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Hạn mức API tốc độ cao cho lập trình viên, Cursor, Claude Code & AI Agent.
          Hệ thống cộng quota tức thì qua mã QR VietQR tự động 24/7.
        </p>
      </div>

      {/* Main Grid: Left Flow / Right Summary */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Form: 8 cols */}
        <div className="space-y-8 lg:col-span-7">
          {/* Step 1: Key Mode Selector */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                1
              </span>
              <span>Xác định API Key của bạn</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasKeyMode("has_key")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                  hasKeyMode === "has_key"
                    ? "border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-semibold shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <Key className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs sm:text-sm">Tôi đã có API Key</span>
              </button>

              <button
                type="button"
                onClick={() => setHasKeyMode("no_key")}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                  hasKeyMode === "no_key"
                    ? "border-purple-600 bg-purple-50/60 dark:border-purple-500 dark:bg-purple-950/30 text-purple-900 dark:text-purple-100 font-semibold shadow-sm"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs sm:text-sm">Tôi chưa có API Key</span>
              </button>
            </div>

            {/* If No Key: Helpful assistance card */}
            {hasKeyMode === "no_key" && (
              <div className="mt-5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/20 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div className="text-xs sm:text-sm text-purple-950 dark:text-purple-200">
                    <p className="font-semibold">
                      Chưa có API Key? Cửa hàng cấp miễn phí key định danh ban đầu
                    </p>
                    <p className="mt-1 text-purple-800/80 dark:text-purple-300/80">
                      Để đảm bảo an toàn hạn mức và quản lý quota độc lập, vui lòng
                      nhắn tin nhanh cho Admin qua kênh hỗ trợ để được cấp key trong 2 phút:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href="https://m.me/daitruongstore"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Chat Messenger</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <a
                        href="https://t.me/daitruong"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-600 transition"
                      >
                        <span>Telegram @daitruong</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If Has Key: Input & Verify */}
            {hasKeyMode === "has_key" && (
              <div className="mt-5 space-y-3">
                {/* Saved keys pills if available */}
                {savedKeys.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Key đã liên kết của bạn:
                    </label>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {savedKeys.map((k) => (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => {
                            setVerifiedKey({
                              bindingId: k.id,
                              maskedKey: k.maskedKey,
                              keyName: k.keyName || "API Key đã chọn",
                              currentQuotaUsd: 0,
                            });
                            setVerifyError(null);
                          }}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-mono transition ${
                            verifiedKey?.bindingId === k.id
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          {k.maskedKey} {k.keyName ? `(${k.keyName})` : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input box */}
                <div>
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Nhập API Key cần nạp ({`sk-...`}):
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="password"
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isVerifying || !apiKeyInput.trim()}
                      onClick={() => handleVerifyKey()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {isVerifying ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      <span>Kiểm tra</span>
                    </button>
                  </div>
                </div>

                {/* Error feedback */}
                {verifyError && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {/* Verified success card */}
                {verifiedKey && (
                  <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Key hợp lệ: {verifiedKey.maskedKey}</span>
                      </div>
                      <span className="rounded-full bg-emerald-200 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                        SẴN SÀNG NẠP
                      </span>
                    </div>
                    {verifiedKey.keyName && (
                      <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                        Tên key: <span className="font-medium">{verifiedKey.keyName}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Package Selection */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                2
              </span>
              <span>Chọn gói Codex Credit</span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {CODEX_PACKAGES.map((pkg) => {
                const isSelected = selectedPackage.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative cursor-pointer rounded-2xl border p-4 transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-950/20 ring-2 ring-blue-600/20 shadow-md"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    {pkg.badge && (
                      <span
                        className={`absolute -top-2.5 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                          pkg.popular
                            ? "bg-purple-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {pkg.badge}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                          ${pkg.creditUsd}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Credit
                        </span>
                      </div>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {pkg.priceVnd.toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Zap className="h-3.5 w-3.5" />
                      <span>+{pkg.quotaUnits.toLocaleString("vi-VN")} Quota</span>
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {pkg.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Optional info & Coupon */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                3
              </span>
              <span>Thông tin nhận thông báo (Không bắt buộc)</span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Email nhận hóa đơn & thông báo hoàn tất:
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Mã giảm giá (nếu có):
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm uppercase font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Card: 5 cols */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-lg space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Tóm tắt đơn hàng</span>
            </h2>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm space-y-3">
              <div className="flex justify-between pt-2">
                <span className="text-slate-500 dark:text-slate-400">Gói nạp:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  ${selectedPackage.creditUsd} Credit
                </span>
              </div>

              <div className="flex justify-between pt-3">
                <span className="text-slate-500 dark:text-slate-400">Quota tương ứng:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{selectedPackage.quotaUnits.toLocaleString("vi-VN")} Points
                </span>
              </div>

              <div className="flex justify-between pt-3">
                <span className="text-slate-500 dark:text-slate-400">API Key nhận quota:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {verifiedKey ? verifiedKey.maskedKey : "Chưa chọn"}
                </span>
              </div>

              <div className="flex justify-between pt-3 text-base">
                <span className="font-bold text-slate-900 dark:text-white">Tổng thanh toán:</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">
                  {selectedPackage.priceVnd.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Error banner */}
            {checkoutError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Action Checkout Button */}
            <button
              type="button"
              disabled={isSubmitting || !verifiedKey}
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang khởi tạo đơn VietQR...</span>
                </>
              ) : (
                <>
                  <span>Thanh toán VietQR Tự Động</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Trust badge */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
              ⚡ Quota cộng tự động vào API Key trong 5 - 15 giây sau khi ngân hàng xác nhận chuyển khoản.
            </div>
          </div>
        </div>
      </div>

      {/* Modal VietQR Payment View if order created */}
      {orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            {paymentStatus === "PAID" ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Thanh Toán & Nạp Quota Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Hạn mức <span className="font-bold text-emerald-600">+${selectedPackage.creditUsd}</span> (+{selectedPackage.quotaUnits.toLocaleString()} quota) đã được cộng vào API Key của bạn.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/developer/usage`)}
                    className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition"
                  >
                    Xem Usage & Lịch sử Request
                  </button>
                  <button
                    onClick={() => {
                      setOrderResult(null);
                      setPaymentStatus("PENDING");
                    }}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center">
                  <span className="rounded-full bg-blue-100 dark:bg-blue-950/60 px-3 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    ĐANG CHỜ THANH TOÁN
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                    Quét Mã VietQR Tự Động
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mã đơn: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{orderResult.orderCode}</span>
                  </p>
                </div>

                {/* QR Image */}
                <div className="mt-4 flex justify-center">
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white p-2 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={orderResult.vietQrUrl}
                      alt="VietQR Payment Code"
                      className="h-56 w-56 object-contain"
                    />
                  </div>
                </div>

                {/* Transfer Info Details */}
                <div className="mt-4 space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số tiền:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {orderResult.totalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Nội dung chuyển:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white">
                      <span>{orderResult.orderCode}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(orderResult.orderCode)}
                        className="rounded p-1 text-slate-400 hover:text-blue-600"
                        title="Copy nội dung"
                      >
                        {copiedMemo ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Polling spinner & Cancel button */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                    <span>Đang chờ nhận tiền...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderResult(null)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
