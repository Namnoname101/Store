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
  Mail,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Play,
  Check,
} from "lucide-react";
import type { ProductCardProps } from "@/components/ProductCard";
import { formatVND, getProductTypeInfo } from "@/lib/product-types";
import { useCart } from "@/contexts/CartContext";
import { resolveProductThumbnail } from "@/lib/catalog-grouping";
import AuthRequiredModal from "@/components/AuthRequiredModal";

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

  // Determine if product is SMM based on category or title
  const isSMM =
    Boolean(product) &&
    (product?.category?.slug === "dich-vu-mxh" ||
      product?.title.toLowerCase().includes("tiktok") ||
      product?.title.toLowerCase().includes("facebook") ||
      product?.title.toLowerCase().includes("tim") ||
      product?.title.toLowerCase().includes("like") ||
      product?.title.toLowerCase().includes("follow"));

  const isApiKey =
    Boolean(product) &&
    (product?.category?.slug === "ai-api" ||
      product?.category?.slug === "ai" ||
      product?.title.toLowerCase().includes("api") ||
      product?.title.toLowerCase().includes("codex") ||
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

  const hideExactStock = isSMM || isApiKey || isYoutubeProduct || isAccountUpgrade || (product?.stockCount ?? 0) >= 99999;

  const unitLabel = product?.title.toLowerCase().includes("follow")
    ? "follow"
    : product?.title.toLowerCase().includes("tim")
    ? "tim"
    : product?.title.toLowerCase().includes("like")
    ? "like"
    : "lượt";

  const effectiveMin = Math.max(1, product?.minQuantity || (isSMM ? 50 : 1));
  const effectiveMax = product?.maxQuantity || (isSMM ? 100000 : product?.stockCount || 1);

  const [quantity, setQuantity] = useState<number>(effectiveMin);
  const [targetLink, setTargetLink] = useState<string>("");
  const [upgradeAccountsRaw, setUpgradeAccountsRaw] = useState<string>("");
  const [youtubeEmailInput, setYoutubeEmailInput] = useState<string>("");

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

  // Reset state on product change or modal open
  useEffect(() => {
    if (product) {
      setQuantity(isSMM ? effectiveMin : 1);
      setTargetLink("");
      setUpgradeAccountsRaw("");
      setYoutubeEmailInput("");
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

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const current = typeof prev === "number" && !isNaN(prev) ? prev : effectiveMin;
      const next = current + delta;
      if (next < effectiveMin) return effectiveMin;
      if (next > effectiveMax) return effectiveMax;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (isAdminPreview) {
      setErrorMessage("Chế độ xem trước: Không thể thêm vào giỏ hàng.");
      return;
    }

    if (isYoutubeProduct) {
      if (parsedYoutubeEmails.length === 0) {
        setErrorMessage("Vui lòng nhập địa chỉ Gmail nhận lời mời YouTube Family.");
        return;
      }
      const invalid = parsedYoutubeEmails.find((a) => !a.isValid);
      if (invalid) {
        setErrorMessage(`Địa chỉ "${invalid.email}" chưa đúng định dạng Gmail (VD: example@gmail.com).`);
        return;
      }
      if (parsedYoutubeEmails.length !== quantity) {
        setErrorMessage(`Số lượng đặt mua là ${quantity}, nhưng bạn đã nhập ${parsedYoutubeEmails.length} địa chỉ Gmail. Vui lòng nhập đủ mỗi dòng 1 Gmail.`);
        return;
      }
    } else if (isAccountUpgrade) {
      if (parsedUpgradeAccounts.length === 0) {
        setErrorMessage("Vui lòng nhập tài khoản cần nâng cấp theo định dạng: tk|mk|2fa (mỗi dòng 1 tài khoản).");
        return;
      }
      const invalid = parsedUpgradeAccounts.find((a: ParsedUpgradeAccount) => !a.isValid);
      if (invalid) {
        setErrorMessage(`Dòng "${invalid.line}" chưa đúng định dạng tk|mk|2fa (phải có ít nhất tài khoản và mật khẩu cách nhau bằng dấu |).`);
        return;
      }
      // Quantity is automatically synced with parsed accounts
    }

    if (isSMM) {
      const linkErr = validateTargetLink(targetLink);
      if (linkErr) {
        setErrorMessage(linkErr);
        return;
      }
    }

    if (!quantity || quantity < effectiveMin) {
      setErrorMessage(`Số lượng đặt tối thiểu là ${effectiveMin} ${unitLabel}.`);
      return;
    }

    if (!isSMM && (!inStock || product.stockCount < quantity)) {
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
        : undefined,
    });

    onClose();
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdminPreview) {
      setErrorMessage("Chế độ xem trước: Không thể thực hiện đặt hàng hoặc thanh toán.");
      return;
    }

    setErrorMessage(null);

    if (isYoutubeProduct) {
      if (parsedYoutubeEmails.length === 0) {
        setErrorMessage("Vui lòng nhập địa chỉ Gmail nhận lời mời YouTube Family.");
        return;
      }
      const invalid = parsedYoutubeEmails.find((a) => !a.isValid);
      if (invalid) {
        setErrorMessage(`Địa chỉ "${invalid.email}" chưa đúng định dạng Gmail (VD: example@gmail.com).`);
        return;
      }
      if (parsedYoutubeEmails.length !== quantity) {
        setErrorMessage(`Số lượng đặt mua là ${quantity}, nhưng bạn đã nhập ${parsedYoutubeEmails.length} địa chỉ Gmail. Vui lòng nhập đủ mỗi dòng 1 Gmail.`);
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

    if (!quantity || quantity < effectiveMin) {
      setErrorMessage(`Số lượng đặt tối thiểu là ${effectiveMin} ${unitLabel}.`);
      return;
    }

    if (!isSMM && (!inStock || product.stockCount < quantity)) {
      setErrorMessage("Số lượng sản phẩm trong kho không đủ.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: isYoutubeProduct && parsedYoutubeEmails.length > 0 ? parsedYoutubeEmails[0].email : null,
          customerNote: isYoutubeProduct
            ? `YOUTUBE_FAMILY_INVITE\n` + parsedYoutubeEmails.map((e) => e.email).join("\n")
            : isAccountUpgrade
            ? `UPGRADE_ACCOUNT\n` + parsedUpgradeAccounts.map((a: ParsedUpgradeAccount) => a.twoFa ? `${a.user}|${a.pass}|${a.twoFa}` : `${a.user}|${a.pass}`).join("\n")
            : isSMM
            ? targetLink.trim()
            : undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30 shrink-0">
          <div className="flex items-center gap-2">
            <span id="quick-view-title" className="text-xs font-semibold uppercase tracking-wider text-primary">
              Xem nhanh & Cấu hình
            </span>
            {isAdminPreview && (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Preview Mode
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Product Overview Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* 4:3 image container */}
            <div className="relative aspect-[4/3] w-full sm:w-44 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/50 flex items-center justify-center">
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
                  <TypeIcon className="h-10 w-10 text-primary" />
                  <span className="text-xs font-medium mt-1">{typeInfo.shortLabel}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {product.category?.name || "Dịch vụ số"}
                </span>
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {typeInfo.label}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {product.title}
              </h3>

              <div className="mt-2 flex items-baseline gap-2">
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

              {/* 3-Tier Live Stock Indicator */}
              <div className="mt-2">
                {hideExactStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Sẵn hàng
                  </span>
                ) : hideExactStock ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    {isYoutubeProduct ? "Gia hạn 24/7" : isAccountUpgrade ? "Nhận nâng 24/7" : "Sẵn hàng"}
                  </span>
                ) : product.stockCount > 5 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    Sẵn hàng ({product.stockCount})
                  </span>
                ) : product.stockCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Còn ít ({product.stockCount})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Tạm hết hàng
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Transparent Reassurance Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl border border-border bg-secondary/30 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold block text-foreground">Bàn giao 24/7</span>
                <span className="text-muted-foreground text-[11px]">Tự động qua VietQR</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent shrink-0" />
              <div>
                <span className="font-semibold block text-foreground">Bảo hành 1:1</span>
                <span className="text-muted-foreground text-[11px]">Theo cam kết gói</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold block text-foreground">Chính hãng</span>
                <span className="text-muted-foreground text-[11px]">Bảo mật & Ổn định</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Quantity Selector */}
            {isSMM ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Số lượng đặt ({unitLabel}) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Min: {effectiveMin.toLocaleString("vi-VN")}
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
                    className="w-full rounded-xl border border-border bg-secondary py-2.5 px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
                    placeholder={`Tối thiểu ${effectiveMin}`}
                  />
                  <button
                    type="button"
                    disabled={isLoading || quantity <= effectiveMin}
                    onClick={() => handleQuantityChange(-100)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40"
                    aria-label="Giảm 100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuantityChange(100)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary"
                    aria-label="Tăng 100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-xs text-muted-foreground mr-1">Chọn nhanh:</span>
                  {quickChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setQuantity((prev) => (prev || 0) + chip)}
                      className="min-h-[38px] rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      +{chip.toLocaleString("vi-VN")}
                    </button>
                  ))}
                </div>
              </div>
            ) : !isAccountUpgrade ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                  Số lượng mua
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-border bg-secondary p-1">
                    <button
                      type="button"
                      disabled={!inStock || quantity <= 1 || isLoading}
                      onClick={() => handleQuantityChange(-1)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-foreground hover:bg-background/80 disabled:opacity-40"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-foreground">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={!inStock || quantity >= (product.stockCount || 1) || isLoading}
                      onClick={() => handleQuantityChange(1)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-foreground hover:bg-background/80 disabled:opacity-40"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* YouTube Family Invite Email Box */}
            {isYoutubeProduct && (
              <div className="space-y-3 rounded-2xl border border-red-500/30 bg-red-500/5 dark:bg-red-950/20 p-3.5">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-4 w-4 rounded bg-red-600 flex items-center justify-center text-white">
                      <Play className="h-2 w-2 fill-current" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                      Gmail nhận lời mời YouTube Family
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                    Không Mật Khẩu
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-foreground">
                      Địa chỉ Gmail <span className="text-destructive">*</span>
                    </label>
                    {parsedYoutubeEmails.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Đã nhận diện: {parsedYoutubeEmails.filter((e) => e.isValid).length} Gmail
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={Math.min(4, Math.max(2, (parsedYoutubeEmails.length || 1) + 1))}
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
                    placeholder={`example@gmail.com\n(Nếu mua cho nhiều người, nhập mỗi dòng 1 Gmail)`}
                    className="w-full rounded-xl border border-border bg-secondary/80 py-2 px-3 text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all leading-relaxed"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Admin sẽ gửi lời mời Family vào Gmail này</span>
                    {currentUser?.username && (
                      <button
                        type="button"
                        onClick={() => {
                          setYoutubeEmailInput(currentUser.username.includes("@") ? currentUser.username : "");
                          setQuantity(1);
                        }}
                        className="text-red-600 dark:text-red-400 hover:underline font-semibold"
                      >
                        Tự động điền
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-2.5 text-[11px] text-red-900 dark:text-red-200">
                  <div className="font-bold flex items-center gap-1 text-red-700 dark:text-red-300 mb-0.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>An tâm tuyệt đối:</span>
                  </div>
                  <p className="text-[10.5px] leading-relaxed">
                    Không cần mật khẩu. Chỉ cần mở hộp thư Gmail bấm &quot;Chấp nhận lời mời&quot; là kích hoạt ngay!
                  </p>
                </div>
              </div>
            )}

            {/* Account Upgrade Inputs - Single Auto-detect Box */}
            {isAccountUpgrade && (
              <div className="space-y-3 rounded-2xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-950/20 p-3.5">
                <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Khung tự nhận diện (tk|mk|2fa)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                    1 Dòng = 1 Tài Khoản
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-foreground">
                      Định dạng <code className="bg-secondary px-1 py-0.5 rounded text-purple-600 dark:text-purple-400 font-mono">tk|mk|2fa</code> <span className="text-destructive">*</span>
                    </label>
                    {parsedUpgradeAccounts.length > 0 && (
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Đã nhận diện: {parsedUpgradeAccounts.filter((a: ParsedUpgradeAccount) => a.isValid).length} tk
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={Math.min(5, Math.max(3, (parsedUpgradeAccounts.length || 1) + 1))}
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
                    placeholder={`example1@gmail.com|MatKhau123|12345678\nexample2@gmail.com|MatKhau456\n(Mỗi dòng 1 tài khoản định dạng tk|mk|2fa hoặc tk|mk)`}
                    className="w-full rounded-xl border border-border bg-secondary py-2 px-3 text-xs font-mono text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none leading-relaxed"
                  />
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Cú pháp: <code className="font-mono">Gmail|Pass|2FA</code></span>
                    <button
                      type="button"
                      onClick={() => {
                        setUpgradeAccountsRaw("clonemail1@gmail.com|MatKhauGoogle123|12345678");
                        setQuantity(1);
                      }}
                      className="text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                    >
                      Dán mẫu
                    </button>
                  </div>
                </div>

                {/* Smart tip */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-2.5 text-[11px] text-blue-800 dark:text-blue-300">
                  <strong>💡 Mẹo an tâm:</strong> Bạn có thể đưa một <strong>Gmail phụ (clone)</strong> để shop up 5TB, sau đó tự tạo Family mời Gmail chính vào dùng chung 5TB &amp; Gemini Pro hoàn toàn bảo mật!
                </div>
              </div>
            )}

            {/* Target Link for SMM */}
            {isSMM && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1">
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
                    className="w-full rounded-xl border border-border bg-secondary py-2.5 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Coupon input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1">
                Mã giảm giá
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={couponCode}
                  disabled={isLoading || !inStock || appliedCoupon !== null}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 rounded-xl border border-border bg-secondary py-2 px-3 text-sm text-foreground uppercase focus:border-primary focus:outline-none font-mono"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                      setCouponFeedback(null);
                    }}
                    className="min-h-[44px] rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
                  >
                    Hủy
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim() || !inStock}
                    className="min-h-[44px] rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
                    <span>Áp dụng</span>
                  </button>
                )}
              </div>

              {couponFeedback && (
                <p className={`mt-1 text-xs ${couponFeedback.type === "success" ? "text-accent font-medium" : "text-destructive"}`}>
                  {couponFeedback.message}
                </p>
              )}
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Price total calculation banner */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block">
                  Tổng thanh toán:
                </span>
                {appliedCoupon && (
                  <span className="text-xs text-accent font-semibold">
                    Đã giảm -{formatVND(appliedCoupon.discountAmount)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-primary font-mono">
                  {formatVND(netTotal)}
                </span>
              </div>
            </div>

            {/* Submit CTAs with >= 44px Touch Targets */}
            <div className="pt-2">
              {inStock ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isLoading}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs sm:text-sm font-bold transition-all active:scale-[0.99]"
                  >
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <span>Thêm vào giỏ</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-4 text-xs sm:text-sm font-bold shadow-md shadow-primary/20 disabled:opacity-60 transition-all active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang tạo đơn...</span>
                      </>
                    ) : (
                      <span>Mua ngay ({formatVND(netTotal)})</span>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full min-h-[44px] rounded-xl bg-muted py-3 px-4 text-sm font-semibold text-muted-foreground cursor-not-allowed"
                >
                  Tạm hết hàng
                </button>
              )}
            </div>
          </form>

          {/* Direct link to full detail page */}
          <div className="text-center pt-2 border-t border-border">
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline min-h-[44px]"
            >
              <span>Xem trang mô tả chi tiết & hướng dẫn đầy đủ</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
