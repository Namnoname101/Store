"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
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
  ShoppingBag,
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

  // New key username state
  const [keyUsername, setKeyUsername] = useState("");

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

  // Authentication state for mandatory account-bound orders
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingAuth(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
  const handleVerifyKey = async (
    keyToVerify?: string
  ): Promise<{ valid: boolean; bindingId?: string; error?: string }> => {
    const key = (keyToVerify !== undefined ? keyToVerify : apiKeyInput).trim();
    if (!key) {
      setVerifyError("Vui lòng nhập API Key bắt đầu bằng 'sk-'");
      return { valid: false, error: "Vui lòng nhập API Key" };
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
        const msg =
          data.error || "API Key không hợp lệ hoặc đã bị gắn với tài khoản khác";
        setVerifyError(msg);
        setVerifiedKey(null);
        return { valid: false, error: msg };
      } else {
        const verifiedInfo = {
          bindingId: data.bindingId,
          maskedKey: data.maskedKey,
          keyName: data.keyName || "API Key của bạn",
          currentQuotaUsd: data.currentQuotaUsd || 0,
        };
        setVerifiedKey(verifiedInfo);
        setApiKeyInput("");
        return { valid: true, bindingId: data.bindingId };
      }
    } catch (err: any) {
      const msg = err.message || "Lỗi mạng khi kiểm tra API Key";
      setVerifyError(msg);
      return { valid: false, error: msg };
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Checkout Submit
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetBindingId = verifiedKey?.bindingId;

    if (hasKeyMode === "has_key" && !targetBindingId) {
      if (apiKeyInput.trim()) {
        const verifyRes = await handleVerifyKey(apiKeyInput.trim());
        if (!verifyRes.valid || !verifyRes.bindingId) {
          setCheckoutError(
            verifyRes.error || "API Key không hợp lệ. Vui lòng kiểm tra lại trước khi thanh toán"
          );
          return;
        }
        targetBindingId = verifyRes.bindingId;
      } else {
        setCheckoutError("Vui lòng kiểm tra và xác nhận API Key trước khi thanh toán");
        return;
      }
    }

    if (hasKeyMode === "no_key" && !keyUsername.trim()) {
      setCheckoutError("Vui lòng nhập Username để đặt tên cho API Key mới của bạn");
      return;
    }

    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const res = await fetch("/api/codex/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isNewKey: hasKeyMode === "no_key",
          username: hasKeyMode === "no_key" ? keyUsername.trim() : undefined,
          bindingId: hasKeyMode === "has_key" ? targetBindingId : undefined,
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
        router.push(`/checkout/${data.orderCode}`);
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
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs font-mono font-medium text-zinc-300 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DaiTruong Store Codex API Quota Platform</span>
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
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs text-card-foreground">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                1
              </span>
              <span>Xác định API Key của bạn</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasKeyMode("has_key")}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                  hasKeyMode === "has_key"
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <Key className="h-5 w-5 text-primary" />
                <span className="text-xs sm:text-sm">Tôi đã có API Key</span>
              </button>

              <button
                type="button"
                onClick={() => setHasKeyMode("no_key")}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1.5 rounded-xl border p-4 text-center transition-all ${
                  hasKeyMode === "no_key"
                    ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="text-xs sm:text-sm">Tôi chưa có API Key</span>
              </button>
            </div>

            {/* If No Key: Auto-creation note & Username Input */}
            {hasKeyMode === "no_key" && (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div className="text-xs sm:text-sm text-foreground">
                      <p className="font-semibold">
                        Tự động khởi tạo API Key theo Username của bạn!
                      </p>
                      <p className="mt-1 text-muted-foreground leading-relaxed">
                        Nhập Username bên dưới và chọn gói hạn mức. Hệ thống sẽ tự động tạo một API Key mới với tên Username này cùng hạn mức bạn đã mua và bàn giao tức thì sau khi thanh toán.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <label className="block text-xs font-semibold text-foreground">
                    Username đặt tên cho API Key <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">
                    Tên này sẽ được gán làm tên hiển thị của API Key để bạn dễ quản lý.
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="VD: thang_dev, cursor_user, team_ai..."
                      value={keyUsername}
                      onChange={(e) => {
                        setKeyUsername(e.target.value);
                        if (checkoutError) setCheckoutError(null);
                      }}
                      className="w-full min-h-[44px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm font-medium text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition"
                    />
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
                    <label className="text-xs font-medium text-muted-foreground">
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
                          className={`min-h-[44px] rounded-xl border px-3.5 py-2 text-xs font-mono transition inline-flex items-center justify-center ${
                            verifiedKey?.bindingId === k.id
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                              : "border-border bg-card text-foreground hover:bg-muted/40"
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
                  <label className="text-xs font-medium text-foreground">
                    Nhập API Key cần nạp ({`sk-...`}):
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="password"
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        if (verifyError) setVerifyError(null);
                        if (checkoutError) setCheckoutError(null);
                      }}
                      onBlur={() => {
                        const trimmed = apiKeyInput.trim();
                        if (trimmed.startsWith("sk-")) {
                          handleVerifyKey(trimmed);
                        }
                      }}
                      className="flex-1 min-h-[44px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isVerifying || !apiKeyInput.trim()}
                      onClick={() => handleVerifyKey()}
                      className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition"
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
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{verifyError}</span>
                  </div>
                )}

                {/* Verified success card */}
                {verifiedKey && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-semibold text-xs sm:text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Key hợp lệ: {verifiedKey.maskedKey}</span>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
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
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs text-card-foreground">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
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
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                        : "border-border bg-card hover:border-primary/50 text-card-foreground"
                    }`}
                  >
                    {pkg.badge && (
                      <span
                        className={`absolute -top-2.5 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                          pkg.popular
                            ? "bg-purple-600 text-white"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {pkg.badge}
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-extrabold text-foreground">
                          ${pkg.creditUsd}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Credit
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {pkg.priceVnd.toLocaleString("vi-VN")}đ
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Zap className="h-3.5 w-3.5" />
                      <span>+{pkg.quotaUnits.toLocaleString("vi-VN")} Quota</span>
                    </div>

                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                      {pkg.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Optional info & Coupon */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs text-card-foreground">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                3
              </span>
              <span>Thông tin nhận thông báo (Không bắt buộc)</span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Email nhận hóa đơn & thông báo hoàn tất:
                </label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Mã giảm giá (nếu có):
                </label>
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full min-h-[44px] rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs sm:text-sm uppercase font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Summary Card: 5 cols */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5 text-card-foreground">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Tóm tắt đơn hàng</span>
            </h2>

            <div className="divide-y divide-border text-xs sm:text-sm space-y-3">
              <div className="flex justify-between pt-2">
                <span className="text-muted-foreground">Gói nạp:</span>
                <span className="font-semibold text-foreground">
                  ${selectedPackage.creditUsd} Credit
                </span>
              </div>

              <div className="flex justify-between pt-3">
                <span className="text-muted-foreground">Quota tương ứng:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  +{selectedPackage.quotaUnits.toLocaleString("vi-VN")} Points
                </span>
              </div>

              <div className="flex justify-between pt-3">
                <span className="text-muted-foreground">API Key nhận quota:</span>
                <span className="font-mono font-medium text-foreground">
                  {hasKeyMode === "has_key"
                    ? (verifiedKey ? verifiedKey.maskedKey : "Chưa chọn")
                    : (keyUsername.trim() ? `Tạo mới: ${keyUsername.trim()}` : "Chờ nhập Username")}
                </span>
              </div>

              <div className="flex justify-between pt-3 text-base">
                <span className="font-bold text-foreground">Tổng thanh toán:</span>
                <span className="font-extrabold text-primary">
                  {selectedPackage.priceVnd.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Error banner */}
            {checkoutError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Action Checkout Button */}
            <button
              type="button"
              disabled={
                isSubmitting ||
                (hasKeyMode === "has_key" && !verifiedKey) ||
                (hasKeyMode === "no_key" && !keyUsername.trim())
              }
              onClick={handleCheckout}
              className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3 text-sm font-bold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Đang khởi tạo đơn VietQR...</span>
                </>
              ) : (
                <>
                  <span>
                    {hasKeyMode === "no_key" ? "Tạo Key Mới & Thanh Toán VietQR" : "Thanh toán VietQR Tự Động"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Trust badge */}
            <div className="rounded-xl bg-muted/40 p-3 text-center text-[11px] text-muted-foreground">
              ⚡ Quota cộng tự động vào API Key trong 5 - 15 giây sau khi ngân hàng xác nhận chuyển khoản.
            </div>
          </div>
        </div>
      </div>

      {/* Modal VietQR Payment View if order created */}
      {orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground">
            {paymentStatus === "PAID" ? (
              <div className="text-center py-6 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Thanh Toán & Nạp Quota Thành Công!
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Hạn mức <span className="font-bold text-emerald-600 dark:text-emerald-400">+${selectedPackage.creditUsd}</span> (+{selectedPackage.quotaUnits.toLocaleString()} quota) đã được cộng vào API Key của bạn.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={() => router.push(`/developer/usage`)}
                    className="w-full min-h-[44px] rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition inline-flex items-center justify-center"
                  >
                    Xem Usage & Lịch sử Request
                  </button>
                  <button
                    onClick={() => {
                      setOrderResult(null);
                      setPaymentStatus("PENDING");
                    }}
                    className="w-full min-h-[44px] rounded-xl border border-border py-2 text-xs font-semibold text-foreground hover:bg-muted/40 transition inline-flex items-center justify-center"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center">
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[11px] font-bold text-primary">
                    ĐANG CHỜ THANH TOÁN
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-foreground">
                    Quét Mã VietQR Tự Động
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Mã đơn: <span className="font-mono font-bold text-foreground">{orderResult.orderCode}</span>
                  </p>
                </div>

                {/* QR Image */}
                <div className="mt-4 flex justify-center">
                  <div className="rounded-2xl border border-border bg-white p-2 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={orderResult.vietQrUrl}
                      alt="VietQR Payment Code"
                      className="h-56 w-56 object-contain"
                    />
                  </div>
                </div>

                {/* Transfer Info Details */}
                <div className="mt-4 space-y-2 rounded-xl bg-muted/40 p-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số tiền:</span>
                    <span className="font-bold text-primary">
                      {orderResult.totalAmount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Nội dung chuyển:</span>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                      <span>{orderResult.orderCode}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(orderResult.orderCode)}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        title="Copy nội dung"
                      >
                        {copiedMemo ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Polling spinner & Cancel button */}
                <div className="mt-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Đang chờ nhận tiền...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderResult(null)}
                    className="min-h-[44px] px-3 text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center"
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
