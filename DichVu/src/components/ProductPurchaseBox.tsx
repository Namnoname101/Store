"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
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
  Check,
  Play,
  ChevronDown,
  Zap,
  KeyRound,
  HelpCircle,
} from "lucide-react";
import { formatVND } from "@/lib/product-types";
import { useCart } from "@/contexts/CartContext";

interface ParsedUpgradeAccount {
  line: string;
  user: string;
  pass: string;
  twoFa: string;
  isValid: boolean;
}

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
  warrantyLabel?: string;
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
  warrantyLabel = "Bảo hành theo quy định gói",
}: ProductPurchaseBoxProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const effectiveMin = Math.max(1, minQuantity);

  const slugLower = (slug || "").toLowerCase();
  const titleLower = productTitle.toLowerCase();

  const isClaudeProduct =
    slugLower.includes("claude") ||
    slugLower.startsWith("cla-") ||
    titleLower.includes("claude");

  const isYoutubeProduct =
    slugLower.includes("youtube") ||
    titleLower.includes("youtube");

  const isAccountUpgrade =
    !isYoutubeProduct &&
    (slugLower.includes("up-gemini") ||
      titleLower.includes("up pro"));

  const isLinkRedeemSlot =
    !isYoutubeProduct &&
    !isAccountUpgrade &&
    (slugLower.includes("gemini-pro-5tb-1-nam-slot") ||
      slugLower.includes("gemini-ai-plus-400gb") ||
      slugLower.includes("duolingo") ||
      slugLower.includes("adobe-express") ||
      slugLower.includes("chinh-chu") ||
      titleLower.includes("chính chủ"));

  const isPremadeSlotAccount =
    !isYoutubeProduct &&
    !isAccountUpgrade &&
    !isLinkRedeemSlot &&
    (slugLower.includes("slot-chatgpt-business") ||
      slugLower.includes("netflix") ||
      slugLower.includes("100-slots") ||
      slugLower.includes("slot"));

  const allowsManualFulfillment =
    isYoutubeProduct ||
    isAccountUpgrade ||
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
  const [codexMode, setCodexMode] = useState<"new" | "topup">("new");
  const [showKeyNameInput, setShowKeyNameInput] = useState<boolean>(false);
  const [upgradeAccountsRaw, setUpgradeAccountsRaw] = useState<string>("");
  const [youtubeEmailInput, setYoutubeEmailInput] = useState<string>("");
  const [showCouponInput, setShowCouponInput] = useState<boolean>(false);
  const [showSafetyTip, setShowSafetyTip] = useState<boolean>(false);

  const parsedYoutubeEmails = useMemo<Array<{ email: string; isValid: boolean }>>(() => {
    if (!youtubeEmailInput.trim()) return [];
    return youtubeEmailInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((email) => ({
        email,
        isValid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      }));
  }, [youtubeEmailInput]);

  const parsedUpgradeAccounts = useMemo<ParsedUpgradeAccount[]>(() => {
    if (!upgradeAccountsRaw.trim()) return [];
    const lines = upgradeAccountsRaw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    return lines.map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      const user = parts[0] || "";
      const pass = parts[1] || "";
      const twoFa = parts.slice(2).join(" | ");
      const isValid = Boolean(user && pass);
      return { line, user, pass, twoFa, isValid };
    });
  }, [upgradeAccountsRaw]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; email?: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.authenticated && data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

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
      setKeyVerifyError("API Key không đúng định dạng (bắt đầu bằng 'sk-')");
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
        const errMsg = data.error || "API Key không hợp lệ hoặc không tồn tại";
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
      const errMsg = err.message || "Lỗi mạng khi kiểm tra API Key.";
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

  const inStock = isYoutubeProduct || isAccountUpgrade || isCustomQuantity || effectiveStock > 0;
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
          message: data.message || `Đã giảm ${formatVND(data.discountAmount)}`,
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
      ? "Link kênh TikTok nhận Follow"
      : "Link video TikTok nhận Tim / View"
    : isFacebook
    ? isFollower
      ? "Link Facebook nhận Follow"
      : "Link bài viết Facebook nhận Like"
    : "Đường link cần tăng tương tác";

  const targetLinkPlaceholder = isTikTok
    ? isFollower
      ? "https://www.tiktok.com/@username"
      : "https://www.tiktok.com/@username/video/..."
    : isFacebook
    ? isFollower
      ? "https://www.facebook.com/username"
      : "https://www.facebook.com/username/posts/..."
    : "https://...";

  const validateTargetLink = (link: string): string | null => {
    const trimmed = link.trim();
    if (!trimmed) return "Vui lòng dán đường link cần thực hiện.";
    const lower = trimmed.toLowerCase();
    if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
      return "Link phải bắt đầu bằng https:// hoặc http://";
    }
    if (isTikTok && !lower.includes("tiktok.com")) {
      return "Vui lòng dán đúng link TikTok.";
    }
    if (
      isFacebook &&
      !lower.includes("facebook.com") &&
      !lower.includes("fb.watch") &&
      !lower.includes("fb.com")
    ) {
      return "Vui lòng dán đúng link Facebook.";
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

  const handleAddToCart = async () => {
    setErrorMessage(null);
    if (isYoutubeProduct) {
      if (parsedYoutubeEmails.length === 0) {
        setErrorMessage("Vui lòng nhập Gmail nhận lời mời YouTube Family.");
        return;
      }
      const invalid = parsedYoutubeEmails.find((a) => !a.isValid);
      if (invalid) {
        setErrorMessage(`"${invalid.email}" chưa đúng định dạng Gmail.`);
        return;
      }
      if (parsedYoutubeEmails.length !== quantity) {
        setErrorMessage(`Bạn chọn số lượng ${quantity} nhưng nhập ${parsedYoutubeEmails.length} Gmail.`);
        return;
      }
    } else if (isAccountUpgrade) {
      if (parsedUpgradeAccounts.length === 0) {
        setErrorMessage("Vui lòng nhập tài khoản theo định dạng: Gmail|MậtKhẩu|2FA");
        return;
      }
      const invalid = parsedUpgradeAccounts.find((a: ParsedUpgradeAccount) => !a.isValid);
      if (invalid) {
        setErrorMessage(`Dòng "${invalid.line}" thiếu mật khẩu (ngăn cách bằng dấu |).`);
        return;
      }
    }

    if (requiresLink) {
      const linkErr = validateTargetLink(targetLink);
      if (linkErr) {
        setErrorMessage(linkErr);
        return;
      }
    }

    if (isCodexProduct && codexMode === "topup") {
      const raw = customerApiKey.trim();
      if (!raw) {
        setErrorMessage("Vui lòng dán API Key cần nạp hoặc chuyển sang 'Tạo Key mới'.");
        return;
      }
      if (!raw.startsWith("sk-") || raw.length < 10) {
        setErrorMessage("API Key không đúng định dạng (bắt đầu bằng 'sk-').");
        return;
      }
      const alreadyVerified = verifiedKeyData && verifiedKeyData.rawKey === raw;
      if (!alreadyVerified) {
        const checkRes = await handleVerifyCodexKey(raw);
        if (!checkRes?.valid) {
          setErrorMessage(checkRes?.error || "API Key không hợp lệ.");
          return;
        }
      }
    }

    if (!quantity || quantity < effectiveMin) {
      setErrorMessage(`Số lượng tối thiểu là ${effectiveMin.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (maxQuantity && quantity > maxQuantity) {
      setErrorMessage(`Số lượng tối đa là ${maxQuantity.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (!isCustomQuantity && !allowsManualFulfillment && (!inStock || stockCount < quantity)) {
      setErrorMessage("Số lượng kho hiện không đủ.");
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
      targetLink: isYoutubeProduct
        ? parsedYoutubeEmails.map((e) => e.email).join("\n")
        : requiresLink
        ? targetLink.trim()
        : isCodexProduct && codexMode === "topup" && customerApiKey.trim()
        ? customerApiKey.trim()
        : undefined,
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isYoutubeProduct) {
      if (parsedYoutubeEmails.length === 0) {
        setErrorMessage("Vui lòng nhập Gmail nhận lời mời YouTube Family.");
        return;
      }
      const invalid = parsedYoutubeEmails.find((a) => !a.isValid);
      if (invalid) {
        setErrorMessage(`"${invalid.email}" chưa đúng định dạng Gmail.`);
        return;
      }
      if (parsedYoutubeEmails.length !== quantity) {
        setErrorMessage(`Bạn chọn số lượng ${quantity} nhưng nhập ${parsedYoutubeEmails.length} Gmail.`);
        return;
      }
    } else if (isAccountUpgrade) {
      if (parsedUpgradeAccounts.length === 0) {
        setErrorMessage("Vui lòng nhập tài khoản cần nâng cấp (Gmail|MậtKhẩu|2FA).");
        return;
      }
      const invalid = parsedUpgradeAccounts.find((a: ParsedUpgradeAccount) => !a.isValid);
      if (invalid) {
        setErrorMessage(`Dòng "${invalid.line}" thiếu mật khẩu (ngăn cách bằng dấu |).`);
        return;
      }
    }

    if (requiresLink) {
      const linkErr = validateTargetLink(targetLink);
      if (linkErr) {
        setErrorMessage(linkErr);
        return;
      }
    }

    if (isCodexProduct && codexMode === "topup") {
      const raw = customerApiKey.trim();
      if (!raw) {
        setErrorMessage("Vui lòng dán API Key cần nạp hoặc chọn 'Tạo Key mới'.");
        return;
      }
      if (!raw.startsWith("sk-") || raw.length < 10) {
        setErrorMessage("API Key không đúng định dạng (bắt đầu bằng 'sk-').");
        return;
      }
      const alreadyVerified = verifiedKeyData && verifiedKeyData.rawKey === raw;
      if (!alreadyVerified) {
        const checkRes = await handleVerifyCodexKey(raw);
        if (!checkRes?.valid) {
          setErrorMessage(checkRes?.error || "API Key không hợp lệ.");
          return;
        }
      }
    }

    if (!quantity || quantity < effectiveMin) {
      setErrorMessage(`Số lượng tối thiểu là ${effectiveMin.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (maxQuantity && quantity > maxQuantity) {
      setErrorMessage(`Số lượng tối đa là ${maxQuantity.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (!isCustomQuantity && !allowsManualFulfillment && (!inStock || stockCount < quantity)) {
      setErrorMessage("Số lượng sản phẩm trong kho không đủ.");
      return;
    }

    setIsLoading(true);

    try {
      const finalCustomerNote = isYoutubeProduct
        ? `YOUTUBE_FAMILY_INVITE\n` + parsedYoutubeEmails.map((e) => e.email).join("\n")
        : isAccountUpgrade
        ? `UPGRADE_ACCOUNT\n` +
          parsedUpgradeAccounts
            .map((a: ParsedUpgradeAccount) => (a.twoFa ? `${a.user}|${a.pass}|${a.twoFa}` : `${a.user}|${a.pass}`))
            .join("\n")
        : requiresLink
        ? targetLink.trim()
        : isCodexProduct
        ? codexMode === "topup" && customerApiKey.trim()
          ? customerApiKey.trim()
          : customerKeyUsername.trim()
          ? `CREATE_NEW_KEY:${customerKeyUsername.trim()}`
          : "CREATE_NEW_KEY"
        : undefined;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail: isYoutubeProduct && parsedYoutubeEmails.length > 0 ? parsedYoutubeEmails[0].email : null,
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
        throw new Error(data.error || "Không thể tạo đơn hàng. Vui lòng thử lại.");
      }

      const orderCode = data.order?.orderCode;
      if (!orderCode) {
        throw new Error("Không nhận được mã đơn hàng từ hệ thống.");
      }

      if (typeof window !== "undefined") {
        window.location.assign(`/checkout/${orderCode}`);
      } else {
        router.push(`/checkout/${orderCode}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi tạo đơn hàng.");
      setIsLoading(false);
    }
  };

  const quickChips =
    effectiveMin >= 500
      ? [500, 1000, 2000, 5000]
      : [100, 500, 1000, 2000];

  return (
    <>
      <div
        id="purchase-box"
        className="rounded-2xl border border-border bg-card text-card-foreground p-5 sm:p-6 shadow-lg"
      >
        {/* Header: Price & Live Stock Pill on one clean row */}
        <div className="flex items-start justify-between gap-3 pb-4 mb-5 border-b border-border">
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-0.5">
              {isCustomQuantity ? `Đơn giá / 1 ${unitLabel}` : "Giá thanh toán"}
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight font-mono">
                {formatVND(price)}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-sm text-muted-foreground line-through font-mono">
                  {formatVND(originalPrice)}
                </span>
              )}
            </div>
          </div>

          {/* Clean Compact Status Pill */}
          <div className="shrink-0 pt-1">
            {inStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {isYoutubeProduct || isAccountUpgrade
                  ? "Nhận đơn 24/7"
                  : allowsManualFulfillment || effectiveStock >= 99999
                  ? "Giao tự động 24/7"
                  : `Sẵn ${effectiveStock} suất`}
              </span>
            ) : allowsManualFulfillment ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Giao trong 5–15p
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 border border-destructive/25 px-3 py-1 text-xs font-semibold text-destructive">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Tạm hết hàng
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleCheckout} className="space-y-4">
          {/* 1. Quantity Selector */}
          {isCustomQuantity ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="customQuantity" className="text-xs font-semibold text-foreground">
                  Số lượng {unitLabel} cần tăng
                </label>
                <span className="text-xs text-muted-foreground">
                  Tối thiểu: {effectiveMin.toLocaleString("vi-VN")}
                </span>
              </div>

              <div className="flex items-center gap-2">
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
                  className="flex-1 rounded-xl border border-border bg-secondary/60 py-2.5 px-3.5 text-base font-bold text-foreground font-mono focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder={`Tối thiểu ${effectiveMin}`}
                />

                <button
                  type="button"
                  disabled={isLoading || quantity <= effectiveMin}
                  onClick={() => handleQuantityChange(-100)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary/60 text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
                  title="Giảm 100"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  disabled={isLoading || (maxQuantity !== null && quantity >= maxQuantity)}
                  onClick={() => handleQuantityChange(100)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-secondary/60 text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
                  title="Tăng 100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
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
                    className="rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    +{chip.toLocaleString("vi-VN")}
                  </button>
                ))}
              </div>
            </div>
          ) : !isAccountUpgrade ? (
            <div className="flex items-center justify-between gap-3">
              <label className="text-xs font-semibold text-foreground">
                Số lượng
              </label>

              <div className="flex items-center rounded-xl border border-border bg-secondary/50 p-1">
                <button
                  type="button"
                  disabled={!canPurchase || quantity <= effectiveMin || isLoading}
                  onClick={() => handleQuantityChange(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-background disabled:opacity-40 transition-colors"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-3.5 w-3.5" />
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
                  className="w-11 text-center text-sm font-bold bg-transparent text-foreground border-0 focus:outline-none font-mono"
                />

                <button
                  type="button"
                  disabled={!canPurchase || quantity >= effectiveMax || isLoading}
                  onClick={() => handleQuantityChange(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-background disabled:opacity-40 transition-colors"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}

          {/* 2. Product-Specific Input (Only 1 clean block when applicable) */}

          {/* 2A. YouTube Family Invite Email */}
          {isYoutubeProduct && (
            <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Play className="h-3.5 w-3.5 text-red-500 fill-current" />
                  <span>Gmail nhận lời mời YouTube</span>
                </label>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Không cần mật khẩu
                </span>
              </div>

              <textarea
                rows={Math.min(4, Math.max(2, parsedYoutubeEmails.length || 1))}
                required
                value={youtubeEmailInput}
                disabled={isLoading}
                onChange={(e) => {
                  const val = e.target.value;
                  setYoutubeEmailInput(val);
                  if (errorMessage) setErrorMessage(null);
                  const lines = val
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean);
                  if (lines.length > 0) {
                    setQuantity(lines.length);
                  }
                }}
                placeholder="Nhập địa chỉ @gmail.com của bạn..."
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Shop gửi thư mời Family qua Gmail này</span>
                {currentUser?.email && (
                  <button
                    type="button"
                    onClick={() => {
                      setYoutubeEmailInput(currentUser.email || "");
                      setQuantity(1);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Dùng {currentUser.email}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2B. Account Upgrade Input (Gemini 5TB Chính chủ) */}
          {isAccountUpgrade && (
            <div className="space-y-2.5 rounded-xl border border-border bg-secondary/30 p-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Tài khoản Google cần nâng cấp 5TB
                </label>
                {parsedUpgradeAccounts.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {parsedUpgradeAccounts.filter((a) => a.isValid).length} tài khoản
                  </span>
                )}
              </div>

              <textarea
                rows={Math.min(5, Math.max(2, parsedUpgradeAccounts.length || 2))}
                required
                value={upgradeAccountsRaw}
                disabled={isLoading}
                onChange={(e) => {
                  const val = e.target.value;
                  setUpgradeAccountsRaw(val);
                  if (errorMessage) setErrorMessage(null);
                  const lines = val
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean);
                  setQuantity(Math.max(1, lines.length));
                }}
                placeholder="email@gmail.com|MatKhau|Ma2FA"
                className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-xs sm:text-sm font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Mỗi dòng 1 nick: <code className="text-foreground font-mono">Gmail|MậtKhẩu|2FA</code></span>
                <button
                  type="button"
                  onClick={() => setShowSafetyTip(!showSafetyTip)}
                  className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <HelpCircle className="h-3 w-3" />
                  <span>Mẹo dùng Gmail phụ</span>
                </button>
              </div>

              {showSafetyTip && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-xs text-muted-foreground leading-relaxed">
                  Bạn có thể đưa <strong>Gmail phụ</strong> để shop nâng 5TB. Xong xuôi bạn dùng nick đó mời Gmail chính vào nhóm Family để hưởng trọn 5TB &amp; Gemini Pro mà không cần đưa mật khẩu nick chính.
                </div>
              )}
            </div>
          )}

          {/* 2B-2. Link Redeem / Auto Slot Activation Notice (No Password Required) */}
          {isLinkRedeemSlot && (
            <div className="space-y-1.5 rounded-xl border border-border bg-secondary/30 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {slugLower.includes("slot")
                      ? "Tự động cấp Link Add Slot chính chủ"
                      : "Tự động cấp Link kích hoạt chính chủ"}
                  </span>
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Không cần mật khẩu
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {slugLower.includes("gemini-pro-5tb-1-nam-slot")
                  ? "Thanh toán xong hệ thống cấp ngay Link kích hoạt tự động trên màn hình. Bạn chỉ cần mở link và điền địa chỉ Gmail của mình để nhận lời mời vào nhóm Google Family 5TB."
                  : "Thanh toán xong hệ thống cấp ngay Link Redeem chính thức trên màn hình. Bạn chỉ cần bấm mở link để nâng cấp trực tiếp trên tài khoản cá nhân của mình."}
              </p>
            </div>
          )}

          {/* 2B-3. Premade Slot / Team Admin Account Notice */}
          {isPremadeSlotAccount && (
            <div className="space-y-1.5 rounded-xl border border-border bg-secondary/30 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {slugLower.includes("100-slots")
                      ? "Cấp tài khoản Chủ Team (100 Slots)"
                      : "Cấp sẵn Tài khoản & Hồ sơ Slot"}
                  </span>
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Giao tự động &lt; 30s
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {slugLower.includes("100-slots")
                  ? "Hệ thống bàn giao tài khoản Admin Chủ Team (Email | Mật khẩu) có sẵn 100 slot để bạn tự mời các email thành viên vào nhóm Canva Pro."
                  : slugLower.includes("netflix")
                  ? "Hệ thống bàn giao sẵn Tài khoản kèm Hồ sơ (Profile) riêng ngay trên màn hình đơn hàng sau khi thanh toán."
                  : "Hệ thống bàn giao sẵn Tài khoản (Email | Mật khẩu) đã được thêm vào không gian làm việc Business bản quyền."}
              </p>
            </div>
          )}

          {/* 2C. SMM Target Link */}
          {requiresLink && (
            <div className="space-y-1.5">
              <label htmlFor="targetLink" className="block text-xs font-semibold text-foreground">
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
                  className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-9 pr-3.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Hãy để bài viết hoặc tài khoản ở chế độ Công khai.
              </p>
            </div>
          )}

          {/* 2D. Codex API Key Mode Switcher (Beginner friendly 2-choice toggle) */}
          {isCodexProduct && (
            <div className="space-y-2.5 rounded-xl border border-border bg-secondary/30 p-3">
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-secondary border border-border">
                <button
                  type="button"
                  onClick={() => {
                    setCodexMode("new");
                    setCustomerApiKey("");
                    setVerifiedKeyData(null);
                    setKeyVerifyError(null);
                  }}
                  className={`py-1.5 px-2.5 rounded-md text-xs font-semibold transition-all ${
                    codexMode === "new"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Cấp Key mới (Mặc định)
                </button>
                <button
                  type="button"
                  onClick={() => setCodexMode("topup")}
                  className={`py-1.5 px-2.5 rounded-md text-xs font-semibold transition-all ${
                    codexMode === "topup"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Nạp vào Key đã có
                </button>
              </div>

              {codexMode === "new" ? (
                <div className="px-1">
                  {!showKeyNameInput ? (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Hệ thống tự tạo Key mới ngay sau khi thanh toán.</span>
                      <button
                        type="button"
                        onClick={() => setShowKeyNameInput(true)}
                        className="text-primary hover:underline font-medium shrink-0 ml-2"
                      >
                        Đặt tên Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        id="customerKeyUsername"
                        type="text"
                        placeholder="Tên gợi nhớ cho Key (VD: cursor_cua_toi)..."
                        value={customerKeyUsername}
                        disabled={isLoading}
                        onChange={(e) => setCustomerKeyUsername(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative flex items-center">
                    <input
                      id="customerApiKey"
                      type="text"
                      placeholder="Dán mã sk-... của bạn vào đây"
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
                        if (keyVerifyError) setKeyVerifyError(null);
                      }}
                      className="w-full rounded-lg border border-border bg-background py-2 pl-3 pr-20 text-xs font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                    />
                    {customerApiKey.trim() && (
                      <button
                        type="button"
                        disabled={isVerifyingKey || isLoading}
                        onClick={() => handleVerifyCodexKey(customerApiKey.trim())}
                        className="absolute right-1 top-1 bottom-1 px-2.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isVerifyingKey
                          ? "..."
                          : verifiedKeyData && verifiedKeyData.rawKey === customerApiKey.trim()
                          ? "Hợp lệ ✓"
                          : "Kiểm tra"}
                      </button>
                    )}
                  </div>

                  {verifiedKeyData && verifiedKeyData.rawKey === customerApiKey.trim() && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {verifiedKeyData.keyName} • Đang có ${verifiedKeyData.currentQuotaUsd.toFixed(2)}
                      </span>
                    </p>
                  )}

                  {keyVerifyError && (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>{keyVerifyError}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Collapsible Coupon Code (Progressive Disclosure) */}
          {!isAccountUpgrade && (
            <div>
              {!showCouponInput && !appliedCoupon ? (
                <button
                  type="button"
                  onClick={() => setShowCouponInput(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span>Có mã giảm giá hoặc mã CTV?</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        id="couponCode"
                        type="text"
                        placeholder="Nhập mã giảm giá..."
                        value={couponCode}
                        disabled={isLoading || !canPurchase || appliedCoupon !== null}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full rounded-xl border border-border bg-secondary/40 py-2 pl-8 pr-3 text-xs font-mono uppercase text-foreground placeholder-muted-foreground focus:border-primary focus:bg-background focus:outline-none"
                      />
                      <Tag className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    </div>

                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="px-3 py-2 rounded-xl border border-border hover:bg-secondary text-xs font-semibold text-muted-foreground flex items-center gap-1"
                      >
                        <CloseIcon className="h-3.5 w-3.5 text-destructive" />
                        <span>Bỏ mã</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim() || !canPurchase}
                        className="px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border disabled:opacity-50 text-xs font-semibold transition-all"
                      >
                        {isValidatingCoupon ? "Đang kiểm..." : "Áp dụng"}
                      </button>
                    )}
                  </div>

                  {couponFeedback && (
                    <p
                      className={`text-xs ${
                        couponFeedback.type === "success"
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-destructive"
                      }`}
                    >
                      {couponFeedback.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error notification */}
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 4. Total Payment Summary (shown clearly when qty > 1 or coupon applied) */}
          {(quantity > 1 || appliedCoupon) && (
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border px-3.5 py-2.5 text-xs">
              <span className="text-muted-foreground font-medium">
                Tổng thanh toán ({quantity.toLocaleString("vi-VN")} {isCustomQuantity ? unitLabel : "sản phẩm"}):
              </span>
              <span className="text-base font-extrabold text-primary font-mono">
                {formatVND(netTotal)}
              </span>
            </div>
          )}

          {/* 5. Primary Action Buttons */}
          {canPurchase ? (
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 hover:bg-secondary text-foreground px-4 text-sm font-semibold transition-all active:scale-[0.99]"
                title="Thêm vào giỏ hàng"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Thêm giỏ</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-5 text-sm font-bold shadow-sm transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tạo mã QR...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-current" />
                    <span>Mua ngay • {formatVND(netTotal)}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="w-full min-h-[48px] rounded-xl bg-muted py-3 px-6 text-sm font-semibold text-muted-foreground cursor-not-allowed"
            >
              Tạm hết hàng
            </button>
          )}
        </form>

        {/* Minimal Footer Guarantee */}
        <div className="mt-4 pt-3.5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-primary" />
            Quét VietQR tự động 5 giây
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {warrantyLabel}
          </span>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 shadow-2xl safe-area-bottom flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs text-muted-foreground truncate">{productTitle}</span>
          <span className="text-base font-extrabold text-primary font-mono truncate">
            {formatVND(netTotal)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canPurchase && (
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isLoading}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-border bg-secondary text-foreground"
              aria-label="Thêm vào giỏ"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}

          {canPurchase ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={(e) => {
                if (requiresLink && !targetLink.trim()) {
                  const box = document.getElementById("purchase-config-box") || document.getElementById("targetLink");
                  if (box) box.scrollIntoView({ behavior: "smooth", block: "center" });
                  setErrorMessage("Vui lòng dán đường link cần thực hiện.");
                  return;
                }
                handleCheckout(e);
              }}
              className="min-h-[44px] px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center shadow-sm"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Mua ngay</span>}
            </button>
          ) : (
            <button
              disabled
              className="min-h-[44px] px-4 rounded-xl bg-muted text-muted-foreground font-semibold text-xs"
            >
              Hết hàng
            </button>
          )}
        </div>
      </div>
    </>
  );
}
