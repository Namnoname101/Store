"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Zap,
  Mail,
  Globe,
  Tag,
  Ticket,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  ExternalLink,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ShoppingBag,
} from "lucide-react";
import type { ProductCardProps } from "@/components/ProductCard";
import { formatVND, getProductTypeInfo } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";

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

  // Determine if product is SMM based on category or title
  const isSMM =
    Boolean(product) &&
    (product?.category?.slug === "dich-vu-mxh" ||
      product?.title.toLowerCase().includes("tiktok") ||
      product?.title.toLowerCase().includes("facebook") ||
      product?.title.toLowerCase().includes("tim") ||
      product?.title.toLowerCase().includes("like") ||
      product?.title.toLowerCase().includes("follow"));

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
  const [email, setEmail] = useState<string>("");
  const [targetLink, setTargetLink] = useState<string>("");
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

  // Reset state on product change or modal open
  useEffect(() => {
    if (product) {
      setQuantity(isSMM ? effectiveMin : 1);
      setEmail("");
      setTargetLink("");
      setErrorMessage(null);
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponFeedback(null);
    }
  }, [product, isOpen, isSMM, effectiveMin]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const typeInfo = getProductTypeInfo(product.type);
  const TypeIcon = typeInfo.icon;
  const inStock = isSMM || product.stockCount > 0;
  const totalPrice = product.price * (quantity || 0);
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

    if (isSMM && !targetLink.trim()) {
      setErrorMessage("Vui lòng nhập link bài viết / video / kênh.");
      return;
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
      targetLink: isSMM ? targetLink.trim() : undefined,
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
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ hoặc để trống.");
      return;
    }

    if (isSMM && !targetLink.trim()) {
      setErrorMessage("Vui lòng nhập link bài viết / video / kênh.");
      return;
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
          customerEmail: email.trim() || null,
          customerNote: isSMM ? targetLink.trim() : undefined,
          couponCode: appliedCoupon?.code || undefined,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl transition-all max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Xem nhanh & Cấu hình
            </span>
            {isAdminPreview && (
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Preview Mode
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
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
            <div className="relative aspect-[4/3] w-full sm:w-44 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 flex items-center justify-center">
              {product.thumbnailUrl ? (
                <img
                  src={product.thumbnailUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <TypeIcon className="h-10 w-10 text-blue-500" />
                  <span className="text-[11px] font-medium mt-1">{typeInfo.shortLabel}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {product.category?.name || "Dịch vụ số"}
                </span>
                <span className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {typeInfo.label}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {product.title}
              </h3>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                  {formatVND(product.price)}
                </span>
                {isSMM && (
                  <span className="text-xs text-slate-500">/ 1 {unitLabel}</span>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-xs text-slate-400 line-through">
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Real stock indicator */}
              <div className="mt-2">
                {isSMM || product.stockCount >= 99999 ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Tự động 24/7 (Sẵn sàng khởi chạy)
                  </span>
                ) : inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Còn {product.stockCount} sản phẩm khả dụng
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Tạm hết hàng trong kho
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleCheckout} className="space-y-4">
            {/* Quantity Selector */}
            {isSMM ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Số lượng đặt ({unitLabel}) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
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
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-sm font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                    placeholder={`Tối thiểu ${effectiveMin}`}
                  />
                  <button
                    type="button"
                    disabled={isLoading || quantity <= effectiveMin}
                    onClick={() => handleQuantityChange(-100)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleQuantityChange(100)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-500 mr-1">Chọn nhanh:</span>
                  {quickChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setQuantity((prev) => (prev || 0) + chip)}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      +{chip.toLocaleString("vi-VN")}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Số lượng mua
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                    <button
                      type="button"
                      disabled={!inStock || quantity <= 1 || isLoading}
                      onClick={() => handleQuantityChange(-1)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-slate-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={!inStock || quantity >= (product.stockCount || 1) || isLoading}
                      onClick={() => handleQuantityChange(1)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Target Link for SMM */}
            {isSMM && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Link video / bài viết / kênh <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://www.tiktok.com/@... hoặc link bài viết FB"
                    value={targetLink}
                    disabled={isLoading || !inStock}
                    onChange={(e) => setTargetLink(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>
            )}

            {/* Email input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Email nhận hàng
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Tùy chọn</span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="tenban@gmail.com (Không bắt buộc)"
                  value={email}
                  disabled={isLoading || !inStock}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Để trống nếu bạn muốn nhận mã trực tiếp trên màn hình sau thanh toán.
              </p>
            </div>

            {/* Coupon input */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Mã giảm giá
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi..."
                  value={couponCode}
                  disabled={isLoading || !inStock || appliedCoupon !== null}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-sm text-slate-900 dark:text-white uppercase focus:border-blue-600 focus:outline-none font-mono"
                />
                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCode("");
                      setCouponFeedback(null);
                    }}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    Hủy
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim() || !inStock}
                    className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
                    <span>Áp dụng</span>
                  </button>
                )}
              </div>

              {couponFeedback && (
                <p className={`mt-1 text-xs ${couponFeedback.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                  {couponFeedback.message}
                </p>
              )}
            </div>

            {/* Error message */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Price total calculation banner */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/30 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-600 dark:text-slate-400 block">
                  Tổng thanh toán:
                </span>
                {appliedCoupon && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Đã giảm -{formatVND(appliedCoupon.discountAmount)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatVND(netTotal)}
                </span>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              {inStock ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isLoading}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all active:scale-[0.99]"
                  >
                    <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Thêm vào giỏ</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/25 disabled:opacity-60 transition-all active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Đang tạo đơn...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-white" />
                        <span>Mua ngay - {formatVND(netTotal)}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl bg-slate-200 dark:bg-slate-800 py-3 px-4 text-sm font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed"
                >
                  Tạm hết hàng
                </button>
              )}
            </div>
          </form>

          {/* Direct link to full detail page */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
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
