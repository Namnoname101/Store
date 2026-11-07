"use client";

import { useState, useEffect } from "react";
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
  const [customerNote, setCustomerNote] = useState("");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    try {
      const savedCode = localStorage.getItem("khodee_auto_coupon");
      if (savedCode && typeof savedCode === "string" && savedCode.trim()) {
        setCouponCode(savedCode.trim());
      }
    } catch {}
  }, []);
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
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});

  // Dynamic coupon re-evaluation when selectedSubtotal changes
  useEffect(() => {
    if (!appliedCoupon || selectedSubtotal <= 0) return;
    fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: appliedCoupon.code,
        cartTotal: selectedSubtotal,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setAppliedCoupon({
            code: data.code,
            discountAmount: data.discountAmount,
            finalTotal: data.finalTotal,
          });
        } else {
          setAppliedCoupon(null);
          setCouponFeedback({
            type: "error",
            message: `Mã "${appliedCoupon.code}" đã được gỡ bỏ: ${data.message}`,
          });
        }
      })
      .catch(() => {});
  }, [selectedSubtotal]);

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
    setItemErrors({});

    if (selectedItems.length === 0) {
      setErrorMessage("Vui lòng tích chọn ít nhất một sản phẩm để thanh toán.");
      return;
    }

    // Validate SMM items have required links with case-insensitive protocol check
    for (const item of selectedItems) {
      if (item.requiresLink) {
        const link = (item.targetLink || "").trim();
        if (!link) {
          setErrorMessage(`Vui lòng nhập link kênh / bài viết cho sản phẩm: "${item.title}".`);
          return;
        }
        const lower = link.toLowerCase();
        if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
          setErrorMessage(`Link sản phẩm "${item.title}" phải bắt đầu bằng http:// hoặc https://`);
          return;
        }
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
        const errorMap: Record<string, string> = {};
        valData.items?.forEach((i: any) => {
          if (i.hasError && i.errorMessage) errorMap[i.productId] = i.errorMessage;
        });
        setItemErrors(errorMap);
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
          customerEmail: null,
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 text-foreground">
      {/* Breadcrumb & Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/#catalog"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-2 py-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Tiếp tục mua hàng</span>
        </Link>
        <span className="text-xs text-muted-foreground">
          KhoDEE / Giỏ hàng & Thanh toán
        </span>
      </div>

      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="h-7 w-7 text-primary" />
            <span>Giỏ hàng</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Xem lại các sản phẩm đã chọn và tiến hành thanh toán.
          </p>
        </div>

        {items.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm("Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?")) {
                clearCart();
              }
            }}
            className="self-start sm:self-auto min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive dark:hover:text-rose-400 hover:bg-destructive/10 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Xóa toàn bộ giỏ</span>
          </button>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-border bg-card p-10 sm:p-16 text-center shadow-xs text-card-foreground">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
            <PackageX className="h-10 w-10" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Giỏ hàng trống
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs sm:text-sm text-muted-foreground">
            Bạn chưa thêm sản phẩm nào vào giỏ hàng.
          </p>
          <div className="mt-6">
            <Link
              href="/#catalog"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-6 py-3 text-xs sm:text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/25 transition-all focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>Xem danh mục sản phẩm</span>
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
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3.5 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => selectAll(!isAllSelected)}
                className="min-h-[44px] flex items-center gap-2 font-medium hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-1"
              >
                {isAllSelected ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground" />
                )}
                <span>Chọn tất cả ({items.length} món)</span>
              </button>

              <span>
                Đã chọn: <strong className="text-foreground font-mono">{selectedCount}</strong> mục
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
                        ? "border-primary/40 bg-card shadow-xs"
                        : "border-border/70 bg-card/50 opacity-75"
                    }`}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectItem(item.productId)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-muted-foreground hover:text-primary shrink-0 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                        aria-label={item.selected ? "Bỏ chọn" : "Chọn sản phẩm"}
                      >
                        {item.selected ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>

                      {/* 4:3 Thumbnail */}
                      <div className="relative aspect-[4/3] w-20 sm:w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary flex items-center justify-center">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
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
                              className="text-sm sm:text-base font-bold text-foreground line-clamp-2 hover:text-primary transition-colors"
                            >
                              {item.title}
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold border ${typeInfo.badgeClass}`}
                              >
                                <TypeIcon className="h-3 w-3" />
                                {typeInfo.shortLabel}
                              </span>
                              {item.fulfillmentType === "LOCAL_STOCK" && (
                                item.stockCount === 0 ? (
                                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border border-destructive/30 bg-destructive/10 text-destructive dark:text-rose-400">
                                    Hết hàng
                                  </span>
                                ) : item.stockCount <= 5 ? (
                                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-mono">
                                    Còn ít ({item.stockCount})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono">
                                    Kho sẵn sàng ({item.stockCount})
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                            title="Xóa khỏi giỏ hàng"
                            aria-label="Xóa sản phẩm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Price and Stepper Row */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                          <div>
                            <span className="text-xs text-muted-foreground">Đơn giá: </span>
                            <span className="text-sm font-bold text-foreground font-mono">
                              {formatVND(item.price)}
                            </span>
                          </div>

                          {/* Stepper with touch-friendly min-h-[44px] */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Số lượng:</span>
                            <div className="flex items-center rounded-xl border border-border bg-secondary/50 p-0.5">
                              <button
                                type="button"
                                disabled={item.quantity <= minQty}
                                onClick={() => updateQuantity(item.productId, -1)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground hover:bg-background disabled:opacity-30 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Giảm số lượng"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-12 text-center text-xs font-bold text-foreground font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                disabled={item.quantity >= maxQty}
                                onClick={() => updateQuantity(item.productId, 1)}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground hover:bg-background disabled:opacity-30 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                                aria-label="Tăng số lượng"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">Thành tiền: </span>
                            <span className="text-sm sm:text-base font-extrabold text-primary font-mono">
                              {formatVND(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>

                        {/* Card-Level Error Alert if validation failed */}
                        {itemErrors[item.productId] && (
                          <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive dark:text-rose-400 font-medium">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{itemErrors[item.productId]}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SMM Target Link if required */}
                    {item.requiresLink && (
                      <div className="mt-3.5 rounded-xl border border-border bg-secondary/40 p-3">
                        <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block mb-1">
                          Link kênh / bài viết nhận dịch vụ <span className="text-destructive">*</span>:
                        </label>
                        <div className="relative">
                          <input
                            type="url"
                            placeholder="https://tiktok.com/@... hoặc link bài viết FB"
                            value={item.targetLink || ""}
                            onChange={(e) => updateItemLink(item.productId, e.target.value)}
                            className="w-full min-h-[44px] rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                          />
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
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
              className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-5 text-card-foreground"
            >
              <h2 className="text-base font-bold text-foreground border-b border-border pb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Tóm tắt thanh toán</span>
              </h2>

              {/* Guest Checkout Fields */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Ghi chú đơn hàng
                    </label>
                    <span className="text-[10px] text-muted-foreground font-medium">Tùy chọn</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ghi chú thêm nếu có..."
                      value={customerNote}
                      disabled={isSubmitting}
                      onChange={(e) => setCustomerNote(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-border bg-secondary/50 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                    />
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="pt-2 border-t border-border">
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground mb-1.5">
                  Mã giảm giá
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="MÃ GIẢM GIÁ..."
                    value={couponCode}
                    disabled={isSubmitting || appliedCoupon !== null}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 min-h-[44px] rounded-xl border border-border bg-secondary/50 py-2.5 px-3 text-xs font-mono uppercase text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                  />
                  {appliedCoupon ? (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="min-h-[44px] rounded-xl border border-border px-4 py-2.5 text-xs font-semibold text-destructive dark:text-rose-400 hover:bg-destructive/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      Hủy
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isValidatingCoupon || !couponCode.trim() || selectedSubtotal <= 0}
                      className="min-h-[44px] rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring shadow-sm shadow-primary/20"
                    >
                      {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Tag className="h-3.5 w-3.5" />}
                      <span>Áp dụng</span>
                    </button>
                  )}
                </div>

                {couponFeedback && (
                  <p
                    className={`mt-1.5 text-xs font-medium ${
                      couponFeedback.type === "success"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive dark:text-rose-400"
                    }`}
                  >
                    {couponFeedback.message}
                  </p>
                )}
              </div>

              {/* Price Calculation Summary */}
              <div className="space-y-2.5 pt-3 border-t border-border text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính ({selectedCount} sản phẩm):</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatVND(selectedSubtotal)}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      <span>Ưu đãi ({appliedCoupon.code}):</span>
                    </span>
                    <span className="font-mono font-bold">
                      -{formatVND(appliedCoupon.discountAmount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-3 border-t border-border">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground text-sm">Tổng thanh toán:</span>
                    <span className="text-[10px] text-muted-foreground">Đã bao gồm VAT & giao nhận tức thì</span>
                  </div>
                  <span className="text-2xl font-extrabold text-primary font-mono tracking-tight">
                    {formatVND(finalTotal)}
                  </span>
                </div>
              </div>

              {/* Error banner */}
              {errorMessage && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive dark:text-rose-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || selectedItems.length === 0}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 disabled:opacity-50 transition-all active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang xác thực & tạo đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <span>Tiến hành thanh toán</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Order note */}
              <div className="pt-2 text-[11px] text-muted-foreground text-center">
                <span>Đơn hàng được giữ trong 15 phút để bạn hoàn tất thanh toán.</span>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
