"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Zap,
  Globe,
  Tag,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ShoppingBag,
  KeyRound,
  Play,
  Check,
  Ticket,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import type { ProductCardProps } from "@/components/ProductCard";
import { formatVND, getProductTypeInfo } from "@/lib/product-types";
import { useCart } from "@/contexts/CartContext";
import { resolveProductThumbnail } from "@/lib/catalog-grouping";

interface ParsedUpgradeAccount {
  line: string;
  user: string;
  pass: string;
  twoFa: string;
  isValid: boolean;
}

interface QuickViewModalProps {
  product: ProductCardProps["product"] | null;
  isOpen: boolean;
  onClose: () => void;
  isAdminPreview?: boolean;
}

export default function QuickViewModal({
  product,
  isOpen,
  onClose,
  isAdminPreview = false,
}: QuickViewModalProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const modalRef = useRef<HTMLDivElement>(null);

  const isSMM =
    Boolean(product) &&
    (product?.category?.slug === "dich-vu-mxh" ||
      product?.title.toLowerCase().includes("tiktok") ||
      product?.title.toLowerCase().includes("facebook") ||
      product?.title.toLowerCase().includes("tim") ||
      product?.title.toLowerCase().includes("like") ||
      product?.title.toLowerCase().includes("follow"));

  const isCodexProduct =
    Boolean(product) &&
    ((product?.slug || "").toLowerCase().includes("codex") ||
      (product?.slug || "").toLowerCase().includes("cdx") ||
      (product?.title || "").toLowerCase().includes("codex"));

  const isClaudeProduct =
    Boolean(product) &&
    ((product?.slug || "").toLowerCase().includes("claude") ||
      (product?.slug || "").toLowerCase().startsWith("cla-") ||
      (product?.title || "").toLowerCase().includes("claude"));

  const isApiKey =
    Boolean(product) &&
    (isCodexProduct ||
      isClaudeProduct ||
      product?.category?.slug === "ai-api" ||
      product?.category?.slug === "ai" ||
      product?.title.toLowerCase().includes("api") ||
      product?.title.toLowerCase().includes("credit") ||
      product?.title.toLowerCase().includes("token") ||
      product?.title.toLowerCase().includes("key"));

  const isYoutubeProduct =
    Boolean(product) &&
    ((product?.slug || "").toLowerCase().includes("youtube") ||
      (product?.title || "").toLowerCase().includes("youtube"));

  const isAccountUpgrade =
    Boolean(product) &&
    !isYoutubeProduct &&
    ((product?.slug || "").toLowerCase().includes("up-gemini") ||
      (product?.slug || "").toLowerCase().includes("chinh-chu") ||
      (product?.title || "").toLowerCase().includes("chính chủ") ||
      (product?.title || "").toLowerCase().includes("up pro"));

  const allowsManualFulfillment =
    isYoutubeProduct ||
    isAccountUpgrade ||
    isClaudeProduct ||
    isCodexProduct ||
    isApiKey;

  const hideExactStock = isSMM || isApiKey || isYoutubeProduct || isAccountUpgrade || (product?.stockCount ?? 0) >= 99999;

  const unitLabel = product?.title.toLowerCase().includes("follow")
    ? "follow"
    : product?.title.toLowerCase().includes("tim")
    ? "tim"
    : product?.title.toLowerCase().includes("like")
    ? "like"
    : "lượt";

  const effectiveMin = Math.max(1, product?.minQuantity || (isSMM ? 50 : 1));
  const effectiveMax = product?.maxQuantity
    ? Math.max(effectiveMin, product.maxQuantity)
    : isSMM
    ? 100000
    : allowsManualFulfillment && (product?.stockCount || 0) === 0
    ? 10
    : Math.max(1, product?.stockCount || 1);

  const [quantity, setQuantity] = useState<number>(effectiveMin);
  const [targetLink, setTargetLink] = useState<string>("");
  const [upgradeAccountsRaw, setUpgradeAccountsRaw] = useState<string>("");
  const [youtubeEmailInput, setYoutubeEmailInput] = useState<string>("");
  const [codexMode, setCodexMode] = useState<"new" | "topup">("new");
  const [customerApiKey, setCustomerApiKey] = useState<string>("");
  const [customerKeyUsername, setCustomerKeyUsername] = useState<string>("");
  const [showKeyNameInput, setShowKeyNameInput] = useState<boolean>(false);
  const [showCouponInput, setShowCouponInput] = useState<boolean>(false);
  const [showSafetyTip, setShowSafetyTip] = useState<boolean>(false);

  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [verifiedKeyData, setVerifiedKeyData] = useState<{
    rawKey: string;
    maskedKey: string;
    keyName: string;
    currentQuotaUsd: number;
  } | null>(null);
  const [keyVerifyError, setKeyVerifyError] = useState<string | null>(null);

  const parsedYoutubeEmails = React.useMemo<Array<{ email: string; isValid: boolean }>>(() => {
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

  const parsedUpgradeAccounts = React.useMemo<ParsedUpgradeAccount[]>(() => {
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

  const [imgError, setImgError] = useState(false);
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

  // Reset state on product change or modal open
  useEffect(() => {
    if (product) {
      setQuantity(isSMM ? effectiveMin : 1);
      setTargetLink("");
      setUpgradeAccountsRaw("");
      setYoutubeEmailInput("");
      setCodexMode("new");
      setCustomerApiKey("");
      setCustomerKeyUsername("");
      setShowKeyNameInput(false);
      setVerifiedKeyData(null);
      setKeyVerifyError(null);
      setShowCouponInput(false);
      setShowSafetyTip(false);
      setErrorMessage(null);
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponFeedback(null);
      setImgError(false);
    }
  }, [product, isOpen, isSMM, effectiveMin]);

  // Handle ESC key and focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const typeInfo = getProductTypeInfo(product.type, {
    categorySlug: product.category?.slug,
    title: product.title,
  });
  const TypeIcon = typeInfo.icon;
  const inStock = isSMM || isYoutubeProduct || isAccountUpgrade || (product?.stockCount ?? 0) > 0;
  const canPurchase = inStock || allowsManualFulfillment;
  const totalPrice = product.price * (quantity || 0);
  const netTotal = appliedCoupon
    ? Math.max(1000, totalPrice - appliedCoupon.discountAmount)
    : totalPrice;

  const isTikTok =
    product.title.toLowerCase().includes("tiktok") ||
    product.category?.slug?.toLowerCase() === "tiktok";
  const isFacebook =
    product.title.toLowerCase().includes("facebook") ||
    product.category?.slug?.toLowerCase() === "facebook";
  const isFollower =
    product.title.toLowerCase().includes("follow") ||
    product.title.toLowerCase().includes("kênh") ||
    product.title.toLowerCase().includes("trang") ||
    product.title.toLowerCase().includes("page");

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
    if (isAdminPreview) {
      setErrorMessage("Chế độ xem trước: Không thể thêm vào giỏ hàng.");
      return;
    }

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

    if (isSMM) {
      const linkErr = validateTargetLink(targetLink);
      if (linkErr) {
        setErrorMessage(linkErr);
        return;
      }
    }

    if (isCodexProduct && codexMode === "topup") {
      const raw = customerApiKey.trim();
      if (!raw) {
        setErrorMessage("Vui lòng dán API Key cần nạp hoặc chọn 'Cấp Key mới'.");
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
      setErrorMessage(`Số lượng tối thiểu là ${effectiveMin} ${unitLabel}.`);
      return;
    }

    if (!isSMM && !allowsManualFulfillment && (!inStock || product.stockCount < quantity)) {
      setErrorMessage("Số lượng sản phẩm trong kho không đủ.");
      return;
    }

    addToCart({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      thumbnailUrl: product.thumbnailUrl,
      quantity,
      minQuantity: effectiveMin,
      maxQuantity: effectiveMax,
      stockCount: product.stockCount,
      fulfillmentType: product.type,
      categorySlug: product.category?.slug,
      requiresLink: isSMM,
      targetLink: isYoutubeProduct
        ? parsedYoutubeEmails.map((e) => e.email).join("\n")
        : isSMM
        ? targetLink.trim()
        : isCodexProduct && codexMode === "topup" && customerApiKey.trim()
        ? customerApiKey.trim()
        : undefined,
    });

    onClose();
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminPreview) {
      setErrorMessage("Chế độ xem trước: Không thể đặt hàng.");
      return;
    }

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

    if (isSMM) {
      const linkErr = validateTargetLink(targetLink);
      if (linkErr) {
        setErrorMessage(linkErr);
        return;
      }
    }

    if (isCodexProduct && codexMode === "topup") {
      const raw = customerApiKey.trim();
      if (!raw) {
        setErrorMessage("Vui lòng dán API Key cần nạp hoặc chọn 'Cấp Key mới'.");
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
      setErrorMessage(`Số lượng tối thiểu là ${effectiveMin} ${unitLabel}.`);
      return;
    }

    if (!isSMM && !allowsManualFulfillment && (!inStock || product.stockCount < quantity)) {
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
        : isSMM
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: isYoutubeProduct && parsedYoutubeEmails.length > 0 ? parsedYoutubeEmails[0].email : null,
          customerNote: finalCustomerNote,
          couponCode: isAccountUpgrade ? undefined : appliedCoupon?.code || undefined,
          items: [
            {
              productId: product.id,
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
        throw new Error("Không nhận được mã đơn hàng.");
      }

      onClose();
      router.push(`/checkout/${orderCode}`);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <span id="quick-view-title" className="text-xs font-semibold text-muted-foreground">
              Mua nhanh
            </span>
            {isAdminPreview && (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Preview
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Product Overview Header */}
          <div className="flex gap-3.5 items-start">
            <div className="relative aspect-[16/10] w-28 sm:w-36 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/50 flex items-center justify-center">
              {!imgError ? (
                <img
                  src={resolveProductThumbnail(
                    product.title,
                    product.slug,
                    product.thumbnailUrl,
                    product.category?.slug
                  )}
                  alt={product.title}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <TypeIcon className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {product.category?.name || "Dịch vụ số"}
                </span>
                {hideExactStock || inStock ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {hideExactStock ? "Giao tự động 24/7" : `Sẵn ${product.stockCount} suất`}
                  </span>
                ) : allowsManualFulfillment ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    Giao 5–15p
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 border border-destructive/25 px-2.5 py-0.5 text-xs font-semibold text-destructive">
                    Tạm hết hàng
                  </span>
                )}
              </div>

              <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug line-clamp-2">
                {product.title}
              </h3>

              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-primary font-mono">
                  {formatVND(product.price)}
                </span>
                {isSMM && (
                  <span className="text-xs text-muted-foreground">/ 1 {unitLabel}</span>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-muted-foreground line-through font-mono">
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Short summary from product description (first 3 lines) */}
          {product.description && (
            <div className="rounded-xl border border-border bg-secondary/30 p-3.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-4">
              {product.description}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Quantity Selector */}
            {isSMM ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Số lượng {unitLabel} cần tăng
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Tối thiểu: {effectiveMin.toLocaleString("vi-VN")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={effectiveMin}
                    max={effectiveMax}
                    step={10}
                    value={quantity || ""}
                    disabled={isLoading}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuantity(isNaN(val) ? 0 : val);
                    }}
                    className="flex-1 rounded-xl border border-border bg-secondary/60 py-2 px-3 text-sm font-bold text-foreground font-mono focus:border-primary focus:outline-none"
                    placeholder={`Tối thiểu ${effectiveMin}`}
                  />
                  <button
                    type="button"
                    disabled={isLoading || quantity <= effectiveMin}
                    onClick={() => handleQuantityChange(-100)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-border bg-secondary/60 text-foreground hover:bg-secondary disabled:opacity-40"
                    aria-label="Giảm 100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuantityChange(100)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-border bg-secondary/60 text-foreground hover:bg-secondary"
                    aria-label="Tăng 100"
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
                      onClick={() => setQuantity((prev) => (prev || 0) + chip)}
                      className="rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
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
                    disabled={!canPurchase || quantity <= 1 || isLoading}
                    onClick={() => handleQuantityChange(-1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-foreground hover:bg-background disabled:opacity-40"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold font-mono text-foreground">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={!canPurchase || quantity >= effectiveMax || isLoading}
                    onClick={() => handleQuantityChange(1)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-foreground hover:bg-background disabled:opacity-40"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* YouTube Family Invite Email Box */}
            {isYoutubeProduct && (
              <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
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
                  rows={Math.min(3, Math.max(2, parsedYoutubeEmails.length || 1))}
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
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs sm:text-sm font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Shop gửi thư mời Family vào Gmail này</span>
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

            {/* Account Upgrade Inputs */}
            {isAccountUpgrade && (
              <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
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
                  rows={Math.min(4, Math.max(2, parsedUpgradeAccounts.length || 2))}
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
                  className="w-full rounded-xl border border-border bg-background py-2 px-3 text-xs font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Cú pháp: <code className="font-mono text-foreground">Gmail|MậtKhẩu|2FA</code></span>
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
                  <p className="rounded-lg bg-primary/5 border border-primary/20 p-2 text-xs text-muted-foreground leading-relaxed">
                    Bạn có thể đưa <strong>Gmail phụ</strong> để shop nâng 5TB, sau đó tự tạo nhóm Family và mời Gmail chính vào dùng chung hoàn toàn bảo mật.
                  </p>
                )}
              </div>
            )}

            {/* Target Link for SMM */}
            {isSMM && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  {targetLinkLabel} <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder={targetLinkPlaceholder}
                    value={targetLink}
                    disabled={isLoading || !inStock}
                    onChange={(e) => setTargetLink(e.target.value)}
                    className="w-full rounded-xl border border-border bg-secondary/50 py-2.5 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Codex Mode Switcher */}
            {isCodexProduct && (
              <div className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3">
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
                  !showKeyNameInput ? (
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>Hệ thống tự tạo Key mới ngay sau thanh toán.</span>
                      <button
                        type="button"
                        onClick={() => setShowKeyNameInput(true)}
                        className="text-primary hover:underline font-medium shrink-0 ml-2"
                      >
                        Đặt tên Key
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Tên gợi nhớ cho Key (VD: cursor_cua_toi)..."
                      value={customerKeyUsername}
                      disabled={isLoading}
                      onChange={(e) => setCustomerKeyUsername(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background py-2 px-3 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                    />
                  )
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative flex items-center">
                      <input
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
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{verifiedKeyData.keyName} • Đang có ${verifiedKeyData.currentQuotaUsd.toFixed(2)}</span>
                      </p>
                    )}
                    {keyVerifyError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{keyVerifyError}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Collapsible Coupon input */}
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
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nhập mã giảm giá..."
                        value={couponCode}
                        disabled={isLoading || !canPurchase || appliedCoupon !== null}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 rounded-xl border border-border bg-secondary/40 py-2 px-3 text-xs text-foreground uppercase focus:border-primary focus:outline-none font-mono"
                      />
                      {appliedCoupon ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAppliedCoupon(null);
                            setCouponCode("");
                            setCouponFeedback(null);
                          }}
                          className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                        >
                          Bỏ mã
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon || !couponCode.trim() || !canPurchase}
                          className="rounded-xl bg-secondary hover:bg-secondary/80 border border-border px-3.5 py-2 text-xs font-semibold text-foreground disabled:opacity-50"
                        >
                          {isValidatingCoupon ? "..." : "Áp dụng"}
                        </button>
                      )}
                    </div>
                    {couponFeedback && (
                      <p className={`text-xs ${couponFeedback.type === "success" ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-destructive"}`}>
                        {couponFeedback.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit CTAs */}
            {canPurchase ? (
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-border bg-secondary/70 hover:bg-secondary text-foreground px-4 text-xs sm:text-sm font-semibold transition-all"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Thêm giỏ</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 px-4 text-xs sm:text-sm font-bold shadow-sm disabled:opacity-60 transition-all"
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
                className="w-full min-h-[46px] rounded-xl bg-muted py-2.5 px-4 text-sm font-semibold text-muted-foreground cursor-not-allowed"
              >
                Tạm hết hàng
              </button>
            )}
          </form>

          {/* Footer link to full detail page */}
          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
              Quét VietQR tự động 24/7
            </span>
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              <span>Xem chi tiết &amp; hướng dẫn</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
