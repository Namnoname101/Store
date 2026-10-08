"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Globe,
  AlertCircle,
  PackageX,
  CheckSquare,
  Square,
  ShieldCheck,
  Tag,
  Loader2,
  Mail,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatVND, getProductTypeInfo } from "@/lib/product-types";

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    removeFromCart,
    updateQuantity,
    updateItemLink,
    toggleSelectItem,
    selectAll,
    clearCart,
    selectedItems,
    selectedCount,
    selectedSubtotal,
    isAllSelected,
  } = useCart();

  // Guest checkout form state
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalTotal: number;
  } | null>(null);

  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate final total
  const finalTotal = appliedCoupon
    ? Math.max(1000, selectedSubtotal - appliedCoupon.discountAmount)
    : selectedSubtotal;

  // Handle coupon apply
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponFeedback({ type: "error", message: "Vui lòng nhập mã giảm giá." });
      return;
    }
    if (selectedSubtotal <= 0) {
      setCouponFeedback({
        type: "error",
        message: "Vui lòng chọn ít nhất một sản phẩm để áp dụng mã.",
      });
      return;
    }

    setIsValidatingCoupon(true);
    setCouponFeedback(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          cartTotal: selectedSubtotal,
        }),
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
          message: data.message || `Đã áp dụng mã giảm giá ${data.code}`,
        });
      } else {
        setAppliedCoupon(null);
        setCouponFeedback({
          type: "error",
          message: data.message || "Mã giảm giá không hợp lệ.",
        });
      }
    } catch {
      setCouponFeedback({
        type: "error",
        message: "Không thể kiểm tra mã giảm giá vào lúc này.",
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

  // Handle Checkout submission with authoritative server validation
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedItems.length === 0) {
      setErrorMessage("Vui lòng tích chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    // Email is optional, but if provided, validate format
    if (customerEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail.trim())) {
        setErrorMessage("Địa chỉ email không đúng định dạng. Bạn có thể để trống nếu không muốn nhận email.");
        return;
      }
    }

    // Validate SMM items have required links
    for (const item of selectedItems) {
      if (item.requiresLink && (!item.targetLink || !item.targetLink.trim())) {
        setErrorMessage(`Vui lòng nhập link kênh / bài viết cho sản phẩm: "${item.title}".`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Step 1: Re-validate price and stock with server API
      const valRes = await fetch("/api/cart/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            targetLink: i.targetLink,
          })),
        }),
      });

      const valData = await valRes.json();
      if (!valRes.ok || !valData.valid) {
        const errorItem = valData.items?.find((i: any) => i.hasError);
        const detailError = errorItem
          ? `${errorItem.title}: ${errorItem.errorMessage}`
          : valData.error || "Một số sản phẩm không đủ tồn kho hoặc đã thay đổi.";
        setErrorMessage(detailError);
        setIsSubmitting(false);
        return;
      }

      // Build customer notes (combining general note + item links)
      const noteParts: string[] = [];
      if (customerNote.trim()) {
        noteParts.push(`Ghi chú: ${customerNote.trim()}`);
      }
      selectedItems.forEach((i) => {
        if (i.requiresLink && i.targetLink) {
          noteParts.push(`[${i.title}]: ${i.targetLink.trim()}`);
        }
      });
      const combinedNote = noteParts.length > 0 ? noteParts.join(" | ") : undefined;

      // Step 2: Create order on server
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: customerEmail.trim() || null,
          customerNote: combinedNote,
          couponCode: appliedCoupon?.code,
          items: selectedItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || "Không thể khởi tạo đơn hàng. Vui lòng thử lại.");
      }

      // Step 3: Remove checked out items from cart
      selectedItems.forEach((i) => removeFromCart(i.productId));

      // Step 4: Navigate to VietQR checkout screen
      router.push(`/checkout/${orderData.order.orderCode}`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Đã xảy ra lỗi trong quá trình tạo đơn hàng.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/#catalog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tiếp tục mua hàng</span>
        </Link>
        <span className="text-xs text-slate-400">
          Daitruong Store / Giỏ hàng & Thanh toán
        </span>
      </div>

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            <span>Giỏ hàng của bạn</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Kiểm tra các sản phẩm được chọn, cấu hình thông tin và tiến hành thanh toán tự động VietQR.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?")) {
                clearCart();
              }
            }}
            className="self-start sm:self-auto inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-600 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Xóa toàn bộ giỏ</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-10 sm:p-16 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
            <PackageX className="h-10 w-10" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            Giỏ hàng của bạn đang trống
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Bạn chưa thêm dịch vụ nào vào giỏ. Hãy khám phá kho tài khoản AI, Cloud và tương tác mạng xã hội của chúng tôi.
          </p>
          <div className="mt-6">
            <Link
              href="/#catalog"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/25 transition-all"
            >
              <span>Xem danh mục dịch vụ</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* Cart Layout: 2 Columns on Desktop */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Items List */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Header selection action bar */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-3.5 text-xs text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => selectAll(!isAllSelected)}
                className="flex items-center gap-2 font-medium hover:text-blue-600 transition-colors"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4 text-blue-600" />
                ) : (
                  <Square className="h-4 w-4 text-slate-400" />
                )}
                <span>Chọn tất cả ({items.length} món)</span>
              </button>

              <span className="text-slate-500">
                Đã chọn: <strong className="text-slate-900 dark:text-white">{selectedCount}</strong> mục
              </span>
            </div>

            {/* List of Cart Items */}
            <div className="space-y-3">
              {items.map((item) => {
                const typeInfo = getProductTypeInfo(item.fulfillmentType);
                const TypeIcon = typeInfo.icon;
                const minQty = Math.max(1, item.minQuantity || 1);
                const maxQty = item.maxQuantity || (item.fulfillmentType === "LOCAL_STOCK" ? Math.max(minQty, item.stockCount) : 100000);

                return (
                  <div
                    key={item.productId}
                    className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                      item.selected
                        ? "border-blue-500/30 bg-white dark:bg-slate-900/90 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.productId)}
                        className="mt-1 text-slate-400 hover:text-blue-600 shrink-0"
                        aria-label={item.selected ? "Bỏ chọn" : "Chọn sản phẩm"}
                      >
                        {item.selected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </button>

                      {/* 4:3 Thumbnail */}
                      <div className="relative aspect-[4/3] w-20 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <TypeIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Information */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/products/${item.slug}`}
                              className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 transition-colors"
                            >
                              {item.title}
                            </Link>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${typeInfo.badgeClass}`}
                              >
                                <TypeIcon className="h-3 w-3" />
                                {typeInfo.shortLabel}
                              </span>
                              {item.stockCount > 0 && item.fulfillmentType === "LOCAL_STOCK" && (
                                <span className="text-[11px] text-slate-400">
                                  Kho còn: {item.stockCount}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors"
                            title="Xóa khỏi giỏ hàng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Price and Stepper Row */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                          <div>
                            <span className="text-xs text-slate-500">Đơn giá: </span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {formatVND(item.price)}
                            </span>
                          </div>

                          {/* Stepper with touch-friendly min-h-[40px] */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">Số lượng:</span>
                            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
                              <button
                                type="button"
                                disabled={item.quantity <= minQty}
                                onClick={() => updateQuantity(item.productId, -1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-12 text-center text-xs font-bold text-slate-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={item.quantity >= maxQty}
                                onClick={() => updateQuantity(item.productId, 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-slate-500">Thành tiền: </span>
                            <span className="text-sm sm:text-base font-extrabold text-blue-600 dark:text-blue-400">
                              {formatVND(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SMM Target Link if required */}
                    {item.requiresLink && (
                      <div className="mt-3.5 rounded-xl border border-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 p-3">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                          Link kênh / bài viết nhận dịch vụ <span className="text-rose-500">*</span>:
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            placeholder="https://tiktok.com/@... hoặc link bài viết FB"
                            value={item.targetLink || ""}
                            onChange={(e) => updateItemLink(item.productId, e.target.value)}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-8 pr-3 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                          />
                          <Globe className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-blue-500" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Checkout Summary & Guest Checkout Form */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
            <form
              onSubmit={handleCheckout}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 sm:p-6 shadow-sm space-y-5"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span>Tóm tắt thanh toán</span>
              </h2>

              {/* Guest Checkout Fields */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Email nhận mã
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Tùy chọn</span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="tenban@gmail.com (Không bắt buộc)"
                      value={customerEmail}
                      disabled={isSubmitting}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Khách vãng lai có thể để trống. Bạn vẫn nhận được mã ngay trên màn hình sau khi quét VietQR.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Ghi chú đơn hàng
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">Tùy chọn</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Lời nhắn cho nhân viên hoặc cấu hình thêm..."
                      value={customerNote}
                      disabled={isSubmitting}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                    />
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="MÃ GIẢM GIÁ..."
                    value={couponCode}
                    disabled={isSubmitting || appliedCoupon !== null}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 px-3 text-xs font-mono uppercase text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      Hủy
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim() || selectedSubtotal <= 0}
                      className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
                      <span>Áp dụng</span>
                    </button>
                  )}
                </div>

                {couponFeedback && (
                  <p
                    className={`mt-1.5 text-xs ${
                      couponFeedback.type === "success"
                        ? "text-emerald-600 dark:text-emerald-400 font-medium"
                        : "text-rose-500"
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Tạm tính ({selectedCount} mục):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatVND(selectedSubtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Mã ưu đãi ({appliedCoupon.code}):</span>
                    <span className="font-semibold">
                      -{formatVND(appliedCoupon.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 dark:border-slate-800 text-sm">
                  <span className="font-bold text-slate-900 dark:text-white">Tổng thanh toán:</span>
                  <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                    {formatVND(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25 disabled:opacity-50 transition-all active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xác thực và tạo đơn VietQR...</span>
                  </>
                ) : (
                  <>
                    <span>Tiến hành thanh toán</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Safety Badges */}
              <div className="pt-2 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Giá và tồn kho xác thực lại tự động 100% phía máy chủ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Khóa tạm giữ kho an toàn trong 15 phút sau khi tạo đơn</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
