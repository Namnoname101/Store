"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  ShieldCheck,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Plus,
  Minus,
  Globe,
  Ticket,
  Tag,
  X as CloseIcon,
  ShoppingBag,
} from "lucide-react";
import { formatVND } from "@/lib/product-types";
import { useCart } from "@/contexts/CartContext";

interface ProductPurchaseBoxProps {
  productId: string;
  price: number;
  originalPrice?: number | null;
  stockCount: number;
  productTitle: string;
  slug?: string;
  thumbnailUrl?: string | null;
  fulfillmentType?: string;
  categorySlug?: string;
  requiresLink?: boolean;
  isCustomQuantity?: boolean;
  minQuantity?: number;
  maxQuantity?: number | null;
  unitLabel?: string;
}

export default function ProductPurchaseBox({
  productId,
  price,
  originalPrice,
  stockCount,
  productTitle,
  slug,
  thumbnailUrl,
  fulfillmentType,
  categorySlug,
  requiresLink = false,
  isCustomQuantity = false,
  minQuantity = 1,
  maxQuantity = null,
  unitLabel = "lượt",
}: ProductPurchaseBoxProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const effectiveMin = Math.max(1, minQuantity);

  const isClaudeProduct =
    (slug || "").toLowerCase().includes("claude") ||
    (slug || "").toLowerCase().startsWith("cla-") ||
    productTitle.toLowerCase().includes("claude");

  const allowsManualFulfillment =
    isClaudeProduct ||
    categorySlug === "ai-api" ||
    (slug || "").toLowerCase().includes("api") ||
    productTitle.toLowerCase().includes("api");

  const effectiveMax = maxQuantity
    ? Math.max(effectiveMin, maxQuantity)
    : allowsManualFulfillment && stockCount === 0
    ? 10
    : stockCount;

  const [liveStock, setLiveStock] = useState<number>(stockCount);
  const [isLiveChecked, setIsLiveChecked] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    fetch(`/api/products/${slug}/live-stock`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && typeof data.stockCount === "number") {
          setLiveStock(data.stockCount);
          setIsLiveChecked(true);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const effectiveStock = isLiveChecked ? liveStock : stockCount;
  const [quantity, setQuantity] = useState<number>(isCustomQuantity ? effectiveMin : 1);
  const [targetLink, setTargetLink] = useState<string>("");
  const [customerApiKey, setCustomerApiKey] = useState<string>("");
  const [customerKeyUsername, setCustomerKeyUsername] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Codex API Key verification state
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [verifiedKeyData, setVerifiedKeyData] = useState<{
    rawKey: string;
    maskedKey: string;
    keyName: string;
    currentQuotaUsd: number;
  } | null>(null);
  const [keyVerifyError, setKeyVerifyError] = useState<string | null>(null);

  const isCodexProduct =
    (slug || "").toLowerCase().includes("codex") ||
    (slug || "").toLowerCase().includes("cdx") ||
    productTitle.toLowerCase().includes("codex");

  const handleVerifyCodexKey = async (
    keyInput?: string
  ): Promise<{ valid: boolean; keyName?: string; error?: string } | null> => {
    const raw = (keyInput !== undefined ? keyInput : customerApiKey).trim();
    if (!raw) {
      setKeyVerifyError("Vui lòng nhập API Key bắt đầu bằng 'sk-'");
      return null;
    }
    if (!raw.startsWith("sk-") || raw.length < 10) {
      setKeyVerifyError("API Key không đúng định dạng (phải bắt đầu bằng 'sk-' và có ít nhất 10 ký tự)");
      return null;
    }

    setIsVerifyingKey(true);
    setKeyVerifyError(null);

    try {
      const res = await fetch("/api/codex/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: raw }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        const errMsg = data.error || "API Key không hợp lệ hoặc đã bị vô hiệu hóa trên upstream";
        setKeyVerifyError(errMsg);
        setVerifiedKeyData(null);
        return { valid: false, error: errMsg };
      }
      const result = {
        rawKey: raw,
        maskedKey: data.maskedKey,
        keyName: data.keyName || "API Key của bạn",
        currentQuotaUsd: data.currentQuotaUsd || 0,
      };
      setVerifiedKeyData(result);
      return { valid: true, keyName: result.keyName };
    } catch (err: any) {
      const errMsg = err.message || "Lỗi mạng khi kiểm tra API Key. Vui lòng thử lại.";
      setKeyVerifyError(errMsg);
      setVerifiedKeyData(null);
      return { valid: false, error: errMsg };
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalTotal: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const inStock = isCustomQuantity || effectiveStock > 0;
  const canPurchase = inStock || allowsManualFulfillment;
  const totalPrice = price * (quantity || 0);
  const netTotal = appliedCoupon
    ? Math.max(1000, totalPrice - appliedCoupon.discountAmount)
    : totalPrice;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponFeedback({ type: "error", message: "Vui lòng nhập mã giảm giá" });
      return;
    }
    setIsValidatingCoupon(true);
    setCouponFeedback(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), cartTotal: totalPrice }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
          finalTotal: data.finalTotal,
        });
        setCouponFeedback({
          type: "success",
          message: data.message || `Đã áp dụng mã ${data.code}`,
        });
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({
          type: "error",
          message: data.message || "Mã giảm giá không hợp lệ",
        });
      }
    } catch {
      setCouponFeedback({
        type: "error",
        message: "Không thể kiểm tra mã lúc này",
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponFeedback(null);
  };

  const isTikTok =
    productTitle.toLowerCase().includes("tiktok") ||
    categorySlug?.toLowerCase() === "tiktok";
  const isFacebook =
    productTitle.toLowerCase().includes("facebook") ||
    categorySlug?.toLowerCase() === "facebook";
  const isFollower =
    productTitle.toLowerCase().includes("follow") ||
    productTitle.toLowerCase().includes("kênh") ||
    productTitle.toLowerCase().includes("trang") ||
    productTitle.toLowerCase().includes("page");

  const targetLinkLabel = isTikTok
    ? isFollower
      ? "Link kênh TikTok cần tăng Follower"
      : "Link video TikTok cần tăng Tim / View"
    : isFacebook
    ? isFollower
      ? "Link trang cá nhân / Fanpage Facebook cần tăng Follow"
      : "Link bài viết Facebook cần tăng Like"
    : "Link mục tiêu cần thực hiện dịch vụ";

  const targetLinkPlaceholder = isTikTok
    ? isFollower
      ? "https://www.tiktok.com/@username"
      : "https://www.tiktok.com/@username/video/..."
    : isFacebook
    ? isFollower
      ? "https://www.facebook.com/username"
      : "https://www.facebook.com/username/posts/..."
    : "https://...";

  const targetLinkHelper = isTikTok
    ? isFollower
      ? "Mở ứng dụng TikTok -> Hồ sơ -> Chia sẻ hồ sơ -> Sao chép liên kết."
      : "Mở video TikTok -> Chia sẻ -> Sao chép liên kết."
    : isFacebook
    ? "Đảm bảo bài viết hoặc trang Facebook được đặt ở chế độ Công khai."
    : "Nhập chính xác liên kết công khai cần thực hiện dịch vụ.";

  const validateTargetLink = (link: string): string | null => {
    const trimmed = link.trim();
    if (!trimmed) return "Vui lòng nhập đường link mục tiêu.";
    const lower = trimmed.toLowerCase();
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      return "Đường link phải bắt đầu bằng https:// hoặc http://";
    }
    if (isTikTok && !lower.includes("tiktok.com")) {
      return "Vui lòng nhập đúng đường link TikTok (chứa tiktok.com).";
    }
    if (
      isFacebook &&
      !lower.includes("facebook.com") &&
      !lower.includes("fb.watch") &&
      !lower.includes("fb.com")
    ) {
      return "Vui lòng nhập đúng đường link Facebook (chứa facebook.com).";
    }
    return null;
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const current = typeof prev === "number" && !isNaN(prev) ? prev : effectiveMin;
      const next = current + delta;
      if (next < effectiveMin) return effectiveMin;
      if (next > effectiveMax) return effectiveMax;
      return next;
    });
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleAddToCart = async () => {
    setErrorMessage(null);
    if (requiresLink) {
      const linkErr = validateTargetLink(targetLink);
      if (linkErr) {
        setErrorMessage(linkErr);
        return;
      }
    }

    if (isCodexProduct && customerApiKey.trim()) {
      const raw = customerApiKey.trim();
      if (!raw.startsWith("sk-") || raw.length < 10) {
        setErrorMessage("API Key không đúng định dạng (phải bắt đầu bằng 'sk-' và có ít nhất 10 ký tự).");
        return;
      }
      const alreadyVerified = verifiedKeyData && verifiedKeyData.rawKey === raw;
      if (!alreadyVerified) {
        const checkRes = await handleVerifyCodexKey(raw);
        if (!checkRes?.valid) {
          setErrorMessage(checkRes?.error || "API Key không hợp lệ hoặc không tồn tại. Vui lòng kiểm tra lại trước khi thêm vào giỏ hàng.");
          return;
        }
      }
    }

    if (!quantity || quantity < effectiveMin) {
      setErrorMessage(`Số lượng đặt tối thiểu là ${effectiveMin.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (maxQuantity && quantity > maxQuantity) {
      setErrorMessage(`Số lượng đặt tối đa là ${maxQuantity.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (!isCustomQuantity && !allowsManualFulfillment && (!inStock || stockCount < quantity)) {
      setErrorMessage("Số lượng sản phẩm trong kho không đủ để đáp ứng yêu cầu.");
      return;
    }

    addToCart({
      productId,
      title: productTitle,
      slug: slug || "",
      price,
      thumbnailUrl,
      quantity,
      minQuantity: effectiveMin,
      maxQuantity: maxQuantity || null,
      stockCount,
      fulfillmentType: fulfillmentType || "LOCAL_STOCK",
      categorySlug,
      requiresLink,
      targetLink: requiresLink
        ? targetLink.trim()
        : isCodexProduct && customerApiKey.trim()
        ? customerApiKey.trim()
        : undefined,
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (requiresLink) {
      const linkErr = validateTargetLink(targetLink);
      if (linkErr) {
        setErrorMessage(linkErr);
        return;
      }
    }

    if (isCodexProduct && customerApiKey.trim()) {
      const raw = customerApiKey.trim();
      if (!raw.startsWith("sk-") || raw.length < 10) {
        setErrorMessage("API Key không đúng định dạng (phải bắt đầu bằng 'sk-' và có ít nhất 10 ký tự).");
        return;
      }
      const alreadyVerified = verifiedKeyData && verifiedKeyData.rawKey === raw;
      if (!alreadyVerified) {
        const checkRes = await handleVerifyCodexKey(raw);
        if (!checkRes?.valid) {
          setErrorMessage(checkRes?.error || "API Key không hợp lệ hoặc không tồn tại. Vui lòng kiểm tra lại trước khi thanh toán.");
          return;
        }
      }
    }

    if (!quantity || quantity < effectiveMin) {
      setErrorMessage(`Số lượng đặt tối thiểu là ${effectiveMin.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (maxQuantity && quantity > maxQuantity) {
      setErrorMessage(`Số lượng đặt tối đa là ${maxQuantity.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (!isCustomQuantity && !allowsManualFulfillment && (!inStock || stockCount < quantity)) {
      setErrorMessage("Số lượng sản phẩm trong kho không đủ để đáp ứng yêu cầu.");
      return;
    }

    setIsLoading(true);

    try {
      const finalCustomerNote = requiresLink
        ? targetLink.trim()
        : isCodexProduct
        ? customerApiKey.trim() ||
          (customerKeyUsername.trim() ? `CREATE_NEW_KEY:${customerKeyUsername.trim()}` : "CREATE_NEW_KEY")
        : undefined;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail: null,
          customerNote: finalCustomerNote,
          couponCode: appliedCoupon?.code || undefined,
          items: [
            {
              productId,
              quantity,
            },
          ],
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể khởi tạo đơn hàng. Vui lòng thử lại sau.");
      }

      const orderCode = data.order?.orderCode;
      if (!orderCode) {
        throw new Error("Không nhận được mã đơn hàng từ hệ thống.");
      }

      // Navigate to checkout VietQR screen
      router.push(`/checkout/${orderCode}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi trong quá trình tạo đơn hàng.");
      setIsLoading(false);
    }
  };

  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const quickChips =
    effectiveMin >= 500
      ? [500, 1000, 2000, 5000, 10000]
      : [100, 500, 1000, 2000, 5000];

  return (
    <>
      <div id="purchase-box" className="rounded-2xl border border-border bg-card text-card-foreground p-6 shadow-xl">
        {/* Price summary */}
        <div className="mb-6 pb-6 border-b border-border">
          <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            {isCustomQuantity ? "Đơn giá theo lượt" : "Đơn giá sản phẩm"}
          </div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-3xl font-extrabold text-primary tracking-tight font-mono">
              {formatVND(price)}
            </span>
            {isCustomQuantity ? (
              <span className="text-xs text-muted-foreground">/ 1 {unitLabel}</span>
            ) : (
              <span className="text-xs text-muted-foreground">/ 1 sản phẩm</span>
            )}
            {originalPrice && originalPrice > price && (
              <span className="text-base text-muted-foreground line-through font-mono">
                {formatVND(originalPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="rounded-lg bg-destructive/15 border border-destructive/30 px-2 py-0.5 text-xs font-bold font-mono text-destructive">
                -{discountPercent}%
              </span>
            )}
          </div>
        </div>

        {/* 3-Tier Stock status banner */}
        <div className="mb-5">
          {isCustomQuantity ? (
            <div className="flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/30 px-3.5 py-2 text-xs font-medium text-accent">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>Dịch vụ tự động — Khởi tạo tức thì sau khi thanh toán</span>
            </div>
          ) : inStock ? (
            effectiveStock > 5 ? (
              <div className="flex items-center justify-between rounded-xl bg-accent/10 border border-accent/30 px-3.5 py-2 text-xs font-medium text-accent">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                  </span>
                  <span>
                    {allowsManualFulfillment || categorySlug === "ai-api" || categorySlug === "ai" || productTitle.toLowerCase().includes("api") || productTitle.toLowerCase().includes("codex") || effectiveStock >= 99999 ? (
                      <>Dịch vụ tự động — Cấp phát 24/7 tức thì</>
                    ) : (
                      <>
                        Kho sẵn: <strong>{effectiveStock}</strong> slot {isLiveChecked ? "(Live)" : ""}
                      </>
                    )}
                  </span>
                </div>
                <span className="text-xs text-accent font-semibold uppercase">Sẵn hàng</span>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>
                    Sắp hết hàng: Chỉ còn <strong>{effectiveStock}</strong> slot
                  </span>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase">Còn ít</span>
              </div>
            )
          ) : allowsManualFulfillment ? (
            <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                Kho sẵn tạm hết — <strong>Cấp mã thủ công trong 5 - 15 phút</strong> sau thanh toán
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-destructive/10 border border-destructive/30 px-3.5 py-2 text-xs font-medium text-destructive">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                <span>Tạm hết hàng tại nhà cung cấp</span>
              </div>
              <span className="text-xs text-destructive font-semibold uppercase">Hết hàng</span>
            </div>
          )}
        </div>

        {/* Form */}
      <form onSubmit={handleCheckout} className="space-y-4 sm:space-y-5">
        {/* Quantity Selector */}
        {isCustomQuantity ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="customQuantity"
                className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Số lượng đặt ({unitLabel}) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-500">
                Min: {effectiveMin.toLocaleString("vi-VN")}
                {maxQuantity ? ` - Max: ${maxQuantity.toLocaleString("vi-VN")}` : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="customQuantity"
                  type="number"
                  min={effectiveMin}
                  max={maxQuantity || undefined}
                  step={10}
                  required
                  value={quantity || ""}
                  disabled={isLoading}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setQuantity(isNaN(val) ? 0 : val);
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#131926] py-2.5 px-4 text-base font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder={`Tối thiểu ${effectiveMin}`}
                />
              </div>

              <button
                type="button"
                disabled={isLoading || quantity <= effectiveMin}
                onClick={() => handleQuantityChange(-100)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#131926] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors"
                title="Giảm 100"
              >
                <Minus className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={isLoading || (maxQuantity !== null && quantity >= maxQuantity)}
                onClick={() => handleQuantityChange(100)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#131926] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors"
                title="Tăng 100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-xs text-slate-500 mr-1">Chọn nhanh:</span>
              {quickChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  disabled={isLoading}
                  onClick={() =>
                    setQuantity((prev) => {
                      const next = (prev || 0) + chip;
                      if (maxQuantity && next > maxQuantity) return maxQuantity;
                      return next;
                    })
                  }
                  className="rounded-lg border border-slate-200 dark:border-zinc-800/80 bg-white dark:bg-[#131926] px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all"
                >
                  +{chip.toLocaleString("vi-VN")}
                </button>
              ))}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setQuantity(effectiveMin)}
                className="rounded-lg border border-slate-200 dark:border-zinc-800/80 bg-slate-100 dark:bg-[#131926] px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors"
              >
                Min
              </button>
            </div>

            {/* Live calculation banner */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-500/20 p-3 text-xs">
              <span className="text-slate-700 dark:text-slate-300">
                Thành tiền ({quantity.toLocaleString("vi-VN")} × {formatVND(price)}):
              </span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                {formatVND(totalPrice)}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground">
                Số lượng mua
              </label>
              {quantity >= 5 && (
                <span className="text-xs font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  ⚡ Mua sỉ ≥ 5
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="flex items-center rounded-xl border border-border bg-secondary p-1">
                <button
                  type="button"
                  disabled={!canPurchase || quantity <= effectiveMin || isLoading}
                  onClick={() => handleQuantityChange(-1)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground hover:bg-background/80 disabled:opacity-40 transition-colors"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <input
                  type="number"
                  min={effectiveMin}
                  max={effectiveMax}
                  value={quantity || effectiveMin}
                  disabled={!canPurchase || isLoading}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val)) setQuantity(effectiveMin);
                    else setQuantity(Math.max(effectiveMin, Math.min(effectiveMax, val)));
                  }}
                  onBlur={() => {
                    setQuantity((prev) => Math.max(effectiveMin, Math.min(effectiveMax, prev || effectiveMin)));
                  }}
                  className="w-12 text-center text-sm font-bold bg-transparent text-foreground border-0 focus:outline-none font-mono"
                />

                <button
                  type="button"
                  disabled={!canPurchase || quantity >= effectiveMax || isLoading}
                  onClick={() => handleQuantityChange(1)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground hover:bg-background/80 disabled:opacity-40 transition-colors"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {(allowsManualFulfillment || categorySlug === "ai-api" || categorySlug === "ai" || productTitle.toLowerCase().includes("api") || productTitle.toLowerCase().includes("codex") || stockCount > 1) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 3, 5, 10].filter(n => (allowsManualFulfillment || categorySlug === "ai-api" || categorySlug === "ai" || productTitle.toLowerCase().includes("api") || productTitle.toLowerCase().includes("codex")) ? true : n <= stockCount).map(n => (
                    <button
                      key={n}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setQuantity(n)}
                      className={`min-h-[38px] px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        quantity === n
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground ml-auto">
                Tổng: <strong className="text-foreground text-sm font-mono">{formatVND(totalPrice)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Target Link Input for SMM services */}
        {requiresLink && (
          <div>
            <label
              htmlFor="targetLink"
              className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5"
            >
              {targetLinkLabel} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="targetLink"
                type="url"
                required
                placeholder={targetLinkPlaceholder}
                value={targetLink}
                disabled={isLoading || !inStock}
                onChange={(e) => {
                  setTargetLink(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`w-full rounded-xl border bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all ${
                  errorMessage && !targetLink.trim()
                    ? "border-destructive text-destructive focus:border-destructive"
                    : "border-border focus:border-primary"
                }`}
              />
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {targetLinkHelper}
            </p>
          </div>
        )}

        {/* Optional Customer API Key for Codex */}
        {isCodexProduct && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="customerApiKey"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  API Key cần nạp thêm
                </label>
                <span className="text-xs text-slate-400">
                  (để trống nếu muốn tạo key mới)
                </span>
              </div>
              <div className="relative flex items-center">
                <input
                  id="customerApiKey"
                  type="text"
                  placeholder="sk-... (nhập key đã có để nạp thêm)"
                  value={customerApiKey}
                  disabled={isLoading || isVerifyingKey}
                  onBlur={() => {
                    const trimmed = customerApiKey.trim();
                    if (trimmed.startsWith("sk-") && (!verifiedKeyData || verifiedKeyData.rawKey !== trimmed)) {
                      handleVerifyCodexKey(trimmed);
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerApiKey(val);
                    if (verifiedKeyData && verifiedKeyData.rawKey !== val.trim()) {
                      setVerifiedKeyData(null);
                    }
                    if (keyVerifyError) {
                      setKeyVerifyError(null);
                    }
                  }}
                  className={`w-full rounded-xl border bg-slate-50 dark:bg-[#131926] py-2.5 pl-3.5 pr-24 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all ${
                    keyVerifyError
                      ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                      : verifiedKeyData && verifiedKeyData.rawKey === customerApiKey.trim()
                      ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-slate-200 dark:border-zinc-800/80 focus:border-blue-600 focus:ring-blue-500/20"
                  }`}
                />

                {customerApiKey.trim() && (
                  <button
                    type="button"
                    disabled={isVerifyingKey || isLoading}
                    onClick={() => handleVerifyCodexKey(customerApiKey.trim())}
                    className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-50 ${
                      verifiedKeyData && verifiedKeyData.rawKey === customerApiKey.trim()
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-xs"
                    }`}
                  >
                    {isVerifyingKey ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : verifiedKeyData && verifiedKeyData.rawKey === customerApiKey.trim() ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {isVerifyingKey
                        ? "Đang check..."
                        : verifiedKeyData && verifiedKeyData.rawKey === customerApiKey.trim()
                        ? "Đã check"
                        : "Kiểm tra"}
                    </span>
                  </button>
                )}
              </div>

              {/* Verified badge */}
              {verifiedKeyData && verifiedKeyData.rawKey === customerApiKey.trim() && (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                        Key hợp lệ: {verifiedKeyData.keyName}
                      </p>
                      <p className="text-xs text-emerald-700/90 dark:text-emerald-300/90">
                        Hạn mức hiện tại: ${verifiedKeyData.currentQuotaUsd.toFixed(2)} USD • Sẵn sàng nạp cộng dồn
                      </p>
                    </div>
                  </div>
                  <span className="rounded-md bg-emerald-600/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    SẴN SÀNG
                  </span>
                </div>
              )}

              {/* Verify error */}
              {keyVerifyError && (
                <div className="mt-2 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{keyVerifyError}</p>
                    <p className="mt-0.5 text-xs text-rose-600/80 dark:text-rose-400/80">
                      Vui lòng kiểm tra lại key hoặc xóa trắng ô này để hệ thống tạo key mới mang tên bạn.
                    </p>
                  </div>
                </div>
              )}

              {!customerApiKey.trim() && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  💡 Nếu chưa có key, bạn có thể nhập Username bên dưới để tạo key mới mang tên mình.
                </p>
              )}
            </div>

            {!customerApiKey.trim() && (
              <div>
                <label
                  htmlFor="customerKeyUsername"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Username đặt tên cho Key mới
                </label>
                <div className="relative">
                  <input
                    id="customerKeyUsername"
                    type="text"
                    placeholder="VD: thang_dev, cursor_user..."
                    value={customerKeyUsername}
                    disabled={isLoading}
                    onChange={(e) => setCustomerKeyUsername(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#131926] py-2.5 px-3.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Tên này sẽ được đặt làm tên đại diện của API Key mới trên hệ thống.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Coupon Code Input */}
        <div>
          <label
            htmlFor="couponCode"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Mã giảm giá
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="couponCode"
                type="text"
                placeholder="Nhập mã giảm giá..."
                value={couponCode}
                disabled={isLoading || !canPurchase || appliedCoupon !== null}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-200 dark:border-zinc-800/80 bg-slate-50 dark:bg-[#131926] py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 uppercase focus:border-blue-600 focus:outline-none font-mono"
              />
              <Ticket className="absolute left-3 top-2.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>

            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <CloseIcon className="h-3.5 w-3.5 text-rose-500" />
                <span>Hủy</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponCode.trim() || !canPurchase}
                className="px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-white disabled:opacity-50 text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-100 flex items-center gap-1.5 transition-all shadow-sm"
              >
                {isValidatingCoupon ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Tag className="h-3.5 w-3.5" />
                )}
                <span>Áp dụng</span>
              </button>
            )}
          </div>

          {/* Coupon Feedback */}
          {couponFeedback && (
            <p
              className={`mt-1 text-xs ${
                couponFeedback.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                  : "text-rose-500"
              }`}
            >
              {couponFeedback.message}
            </p>
          )}

          {appliedCoupon && (
            <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
              <span className="font-mono font-bold">{appliedCoupon.code}</span>
              <span>giảm -{formatVND(appliedCoupon.discountAmount)}</span>
            </div>
          )}
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons: Add to cart + Buy Now */}
        <div>
          {canPurchase ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-1 flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2.5 px-4 text-sm font-semibold transition-all active:scale-[0.99] shadow-2xs"
              >
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span>Thêm vào giỏ</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 flex min-h-[46px] items-center justify-center gap-2 rounded-xl py-2.5 px-5 text-sm font-bold shadow-md disabled:opacity-60 transition-all active:scale-[0.99] ${
                  !inStock && allowsManualFulfillment
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/25 active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tạo đơn...</span>
                  </>
                ) : !inStock && allowsManualFulfillment ? (
                  <span>Mua ngay (Cấp mã thủ công)</span>
                ) : (
                  <span>Mua ngay</span>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-muted py-3 px-6 text-sm font-semibold text-muted-foreground cursor-not-allowed"
            >
              Tạm hết hàng
            </button>
          )}
        </div>
      </form>

      {/* Basic product notes */}
      <div className="mt-5 pt-4 border-t border-border space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span>Thanh toán quét mã VietQR nhận thông tin tự động</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-accent shrink-0" />
          <span>Hỗ trợ kỹ thuật và bảo hành theo thời hạn gói</span>
        </div>
      </div>
    </div>

    {/* Mobile Fixed Sticky Bottom Purchase Bar */}
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 shadow-2xl safe-area-bottom flex items-center justify-between gap-3">
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold text-foreground truncate">
          {productTitle}
        </span>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-base font-extrabold text-primary font-mono truncate">
            {formatVND(netTotal)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className="text-xs text-muted-foreground line-through font-mono">
              {formatVND(originalPrice * quantity)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {canPurchase && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isLoading}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all active:scale-95"
            title="Thêm vào giỏ"
            aria-label="Thêm vào giỏ"
          >
            <ShoppingBag className="h-4 w-4 text-primary" />
          </button>
        )}

        {canPurchase ? (
          <button
            type="button"
            disabled={isLoading}
            onClick={(e) => {
              if (requiresLink && !targetLink.trim()) {
                const box = document.getElementById("purchase-config-box") || document.getElementById("targetLink");
                if (box) {
                  box.scrollIntoView({ behavior: "smooth", block: "center" });
                  setTimeout(() => {
                    const input = document.getElementById("targetLink");
                    if (input) input.focus();
                  }, 400);
                }
                setErrorMessage("Vui lòng nhập đường link mục tiêu trước khi thanh toán.");
                return;
              }
              handleCheckout(e);
            }}
            className="min-h-[44px] px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm flex items-center justify-center shadow-md shadow-primary/20 active:scale-95 transition-all shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span>Mua ngay →</span>
            )}
          </button>
        ) : (
          <button
            disabled
            className="min-h-[44px] px-4 rounded-xl bg-muted text-muted-foreground font-semibold text-xs cursor-not-allowed"
          >
            Hết hàng
          </button>
        )}
      </div>
    </div>
  </>
  );
}
