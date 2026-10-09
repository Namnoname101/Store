"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  ShieldCheck,
  Clock,
  Mail,
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
import { formatVND } from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";

interface ProductPurchaseBoxProps {
  productId: string;
  price: number;
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
  const effectiveMax = maxQuantity ? Math.max(effectiveMin, maxQuantity) : stockCount;

  const [quantity, setQuantity] = useState<number>(isCustomQuantity ? effectiveMin : 1);
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

  const inStock = isCustomQuantity || stockCount > 0;
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

  const handleAddToCart = () => {
    setErrorMessage(null);
    if (requiresLink && !targetLink.trim()) {
      setErrorMessage("Vui lòng nhập link bài viết / video / kênh cần tăng tương tác.");
      return;
    }

    if (!quantity || quantity < effectiveMin) {
      setErrorMessage(`Số lượng đặt tối thiểu là ${effectiveMin.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (maxQuantity && quantity > maxQuantity) {
      setErrorMessage(`Số lượng đặt tối đa là ${maxQuantity.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (!isCustomQuantity && (!inStock || stockCount < quantity)) {
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
      targetLink: requiresLink ? targetLink.trim() : undefined,
    });
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (email.trim() && !validateEmail(email)) {
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ hoặc để trống.");
      return;
    }

    if (requiresLink && !targetLink.trim()) {
      setErrorMessage("Vui lòng nhập link bài viết / video / kênh cần tăng tương tác.");
      return;
    }

    if (!quantity || quantity < effectiveMin) {
      setErrorMessage(`Số lượng đặt tối thiểu là ${effectiveMin.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (maxQuantity && quantity > maxQuantity) {
      setErrorMessage(`Số lượng đặt tối đa là ${maxQuantity.toLocaleString("vi-VN")} ${unitLabel}.`);
      return;
    }

    if (!isCustomQuantity && (!inStock || stockCount < quantity)) {
      setErrorMessage("Số lượng sản phẩm trong kho không đủ để đáp ứng yêu cầu.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerEmail: email.trim() || null,
          customerNote: requiresLink ? targetLink.trim() : undefined,
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

  const quickChips =
    effectiveMin >= 500
      ? [500, 1000, 2000, 5000, 10000]
      : [100, 500, 1000, 2000, 5000];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl">
      {/* Price summary */}
      <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-1">
          {isCustomQuantity ? "Đơn giá theo lượt" : "Đơn giá sản phẩm"}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
            {formatVND(price)}
          </span>
          <span className="text-xs text-slate-500">
            {isCustomQuantity ? `/ 1 ${unitLabel}` : "/ 1 sản phẩm"}
          </span>
        </div>
      </div>

      {/* Stock status banner */}
      <div className="mb-5">
        {isCustomQuantity ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 px-3 py-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Dịch vụ tự động — Khởi tạo sau khi thanh toán</span>
          </div>
        ) : inStock ? (
          <div className="flex items-center gap-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 px-3 py-2 text-xs font-medium text-blue-800 dark:text-blue-300">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span>
              Còn <strong>{stockCount}</strong> sản phẩm trong kho
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/20 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Tạm hết hàng</span>
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
              <span className="text-[11px] text-slate-500">
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
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 px-4 text-base font-bold text-slate-900 dark:text-white focus:border-blue-600 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder={`Tối thiểu ${effectiveMin}`}
                />
              </div>

              <button
                type="button"
                disabled={isLoading || quantity <= effectiveMin}
                onClick={() => handleQuantityChange(-100)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors"
                title="Giảm 100"
              >
                <Minus className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={isLoading || (maxQuantity !== null && quantity >= maxQuantity)}
                onClick={() => handleQuantityChange(100)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-40 transition-colors"
                title="Tăng 100"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Quick chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="text-[11px] text-slate-500 mr-1">Chọn nhanh:</span>
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
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 transition-all"
                >
                  +{chip.toLocaleString("vi-VN")}
                </button>
              ))}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setQuantity(effectiveMin)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 px-2 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors"
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Số lượng mua
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  disabled={!inStock || quantity <= 1 || isLoading}
                  onClick={() => handleQuantityChange(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="w-12 text-center text-sm font-bold text-slate-900 dark:text-white">
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={!inStock || quantity >= stockCount || isLoading}
                  onClick={() => handleQuantityChange(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                Tổng tiền: <strong className="text-slate-900 dark:text-white text-sm">{formatVND(totalPrice)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Target Link Input for SMM services */}
        {requiresLink && (
          <div>
            <label
              htmlFor="targetLink"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Link video / bài viết / kênh <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="targetLink"
                type="url"
                required
                placeholder="https://www.tiktok.com/@... hoặc link bài viết FB"
                value={targetLink}
                disabled={isLoading || !inStock}
                onChange={(e) => setTargetLink(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all"
              />
              <Globe className="absolute left-3.5 top-3 h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Nhập chính xác link cần thực hiện dịch vụ.
            </p>
          </div>
        )}

        {/* Customer Email Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="customerEmail"
              className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
            >
              Email nhận thông tin
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Tùy chọn</span>
          </div>
          <div className="relative">
            <input
              id="customerEmail"
              type="email"
              placeholder="tenban@gmail.com (Không bắt buộc)"
              value={email}
              disabled={isLoading || !inStock}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 transition-all"
            />
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Không bắt buộc. Bạn vẫn nhận được thông tin trên màn hình sau khi thanh toán.
          </p>
        </div>

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
                disabled={isLoading || !inStock || appliedCoupon !== null}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 uppercase focus:border-blue-600 focus:outline-none font-mono"
              />
              <Ticket className="absolute left-3 top-2.5 h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>

            {appliedCoupon ? (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <CloseIcon className="h-3.5 w-3.5 text-rose-500" />
                <span>Hủy</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={isValidatingCoupon || !couponCode.trim() || !inStock}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
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
          {inStock ? (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isLoading}
                className="flex-1 flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all active:scale-[0.99] shadow-2xs"
              >
                <ShoppingBag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Thêm vào giỏ</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-5 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60 transition-all active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang tạo đơn...</span>
                  </>
                ) : (
                  <span>Mua ngay</span>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-3 px-6 text-sm font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed"
            >
              Tạm hết hàng
            </button>
          )}
        </div>
      </form>

      {/* Basic product notes */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>Thanh toán quét mã VietQR nhận thông tin tự động</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span>Hỗ trợ kỹ thuật và bảo hành theo thời hạn gói</span>
        </div>
      </div>
    </div>
  );
}
