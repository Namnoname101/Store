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
      className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={closeCart}
    >
      <div
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-card/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-right duration-300 text-card-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">
              Giỏ hàng ({items.length})
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Đóng giỏ hàng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selection Bar */}
        {items.length > 0 && (
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-2.5 text-xs text-muted-foreground">
            <button
              onClick={() => selectAll(!isAllSelected)}
              className="min-h-[44px] flex items-center gap-2 font-medium hover:text-primary transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-1"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground" />
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
                className={`flex flex-col gap-2.5 rounded-2xl border p-3.5 transition-all ${
                  item.selected
                    ? "border-primary/40 bg-primary/5 shadow-xs"
                    : "border-border/70 bg-card/50 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Select Checkbox */}
                  <button
                    onClick={() => toggleSelectItem(item.productId)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-muted-foreground hover:text-primary shrink-0 focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                    aria-label={item.selected ? "Bỏ chọn" : "Chọn sản phẩm"}
                  >
                    {item.selected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Thumbnail 4:3 */}
                  <div className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary flex items-center justify-center">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="block text-xs font-semibold text-foreground line-clamp-2 hover:text-primary leading-snug transition-colors"
                    >
                      {item.title}
                    </Link>

                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-primary font-mono">
                        {formatVND(item.price)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-[10px] text-muted-foreground line-through font-mono">
                          {formatVND(item.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                    title="Xóa khỏi giỏ"
                    aria-label="Xóa sản phẩm"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* SMM Target Link if required */}
                {item.requiresLink && (
                  <div className="pt-2 border-t border-border">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                      Link kênh / bài viết:
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        placeholder="https://tiktok.com/@... hoặc link bài viết"
                        value={item.targetLink || ""}
                        onChange={(e) => updateItemLink(item.productId, e.target.value)}
                        className="w-full min-h-[44px] rounded-xl border border-border bg-secondary/60 py-2.5 pl-9 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                      />
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                    </div>
                  </div>
                )}

                {/* Stepper Row */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    Thành tiền:{" "}
                    <strong className="text-foreground font-mono">
                      {formatVND(item.price * item.quantity)}
                    </strong>
                  </span>

                  <div className="flex items-center rounded-xl border border-border bg-secondary/50 p-0.5">
                    <button
                      type="button"
                      disabled={item.quantity <= (item.minQuantity || 1)}
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground hover:bg-background disabled:opacity-30 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-mono font-bold text-foreground text-xs">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-foreground hover:bg-background transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-3">
                <PackageX className="h-8 w-8" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Giỏ hàng trống
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Chưa có sản phẩm nào trong giỏ hàng.
              </p>
              <button
                onClick={closeCart}
                className="mt-4 min-h-[44px] rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                Xem sản phẩm
              </button>
            </div>
          )}
        </div>

        {/* Footer / Total & Checkout CTA */}
        {items.length > 0 && (
          <div className="border-t border-border bg-card/80 p-5 space-y-3 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tạm tính ({selectedCount} mục):</span>
              <span className="text-base font-extrabold text-primary font-mono">
                {formatVND(selectedSubtotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/cart"
                onClick={closeCart}
                className="flex h-11 min-h-[44px] items-center justify-center rounded-xl border border-border bg-secondary text-xs font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              >
                Xem giỏ hàng
              </Link>

              <button
                onClick={handleCheckoutSelected}
                disabled={selectedItems.length === 0}
                className="flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span>Thanh toán</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground text-center">
              <span>Đơn hàng được giữ trong 15 phút sau khi tạo đơn</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
