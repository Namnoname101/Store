"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Globe,
  AlertCircle,
  PackageX,
  CheckSquare,
  Square,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatVND } from "@/lib/product-types";

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    updateItemLink,
    toggleSelectItem,
    selectAll,
    selectedItems,
    selectedCount,
    selectedSubtotal,
    isAllSelected,
  } = useCart();

  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const handleCheckoutSelected = () => {
    if (selectedItems.length === 0) return;
    closeCart();
    router.push("/cart#checkout");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={closeCart}
    >
      <div
        className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Giỏ hàng ({items.length})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Đóng giỏ hàng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selection Bar */}
        {items.length > 0 && (
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 px-5 py-2.5 text-xs text-slate-600 dark:text-slate-400">
            <button
              onClick={() => selectAll(!isAllSelected)}
              className="flex items-center gap-2 font-medium hover:text-blue-600 transition-colors"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span>Chọn tất cả ({items.length})</span>
            </button>
            <span>Đã chọn: {selectedItems.length} sản phẩm</span>
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.productId}
                className={`flex flex-col gap-2 rounded-xl border p-3 transition-all ${
                  item.selected
                    ? "border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/10"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 opacity-80"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Select Checkbox */}
                  <button
                    onClick={() => toggleSelectItem(item.productId)}
                    className="mt-1 text-slate-400 hover:text-blue-600 shrink-0"
                    aria-label={item.selected ? "Bỏ chọn" : "Chọn sản phẩm"}
                  >
                    {item.selected ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                  </button>

                  {/* Thumbnail 4:3 */}
                  <div className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-slate-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="block text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 hover:text-blue-600 leading-snug"
                    >
                      {item.title}
                    </Link>

                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatVND(item.price)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatVND(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 transition-colors"
                    title="Xóa khỏi giỏ"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* SMM Target Link if required */}
                {item.requiresLink && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Link kênh / bài viết:
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://tiktok.com/@... hoặc link bài viết"
                        value={item.targetLink || ""}
                        onChange={(e) => updateItemLink(item.productId, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-1.5 pl-7 pr-2 text-xs text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none"
                      />
                      <Globe className="absolute left-2 top-2 h-3.5 w-3.5 text-blue-500" />
                    </div>
                  </div>
                )}

                {/* Stepper Row */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Thành tiền:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {formatVND(item.price * item.quantity)}
                    </strong>
                  </span>

                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
                    <button
                      type="button"
                      disabled={item.quantity <= (item.minQuantity || 1)}
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="flex h-6 w-6 items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-9 text-center font-bold text-slate-900 dark:text-white text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="flex h-6 w-6 items-center justify-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                <PackageX className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Giỏ hàng trống
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Chưa có sản phẩm nào trong giỏ hàng.
              </p>
              <button
                onClick={closeCart}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Xem sản phẩm
              </button>
            </div>
          )}
        </div>

        {/* Footer / Total & Checkout CTA */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 p-5 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Tạm tính ({selectedCount} mục):</span>
              <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                {formatVND(selectedSubtotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex h-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
              >
                Xem giỏ hàng
              </Link>

              <button
                onClick={handleCheckoutSelected}
                disabled={selectedItems.length === 0}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-600/20"
              >
                <span>Thanh toán</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-slate-400 text-center">
              <span>Đơn hàng được giữ trong 15 phút sau khi tạo đơn</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
