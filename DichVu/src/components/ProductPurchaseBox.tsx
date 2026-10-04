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
} from "lucide-react";
import { formatVND } from "@/components/ProductCard";

interface ProductPurchaseBoxProps {
  productId: string;
  price: number;
  stockCount: number;
  productTitle: string;
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
  requiresLink = false,
  isCustomQuantity = false,
  minQuantity = 1,
  maxQuantity = null,
  unitLabel = "lượt",
}: ProductPurchaseBoxProps) {
  const router = useRouter();
  const effectiveMin = Math.max(1, minQuantity);
  const effectiveMax = maxQuantity ? Math.max(effectiveMin, maxQuantity) : stockCount;

  const [quantity, setQuantity] = useState<number>(isCustomQuantity ? effectiveMin : 1);
  const [email, setEmail] = useState<string>("");
  const [targetLink, setTargetLink] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inStock = stockCount > 0;
  const totalPrice = price * (quantity || 0);

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

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !validateEmail(email)) {
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ để nhận thông báo / mã đơn hàng.");
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
          customerEmail: email.trim(),
          customerNote: requiresLink ? targetLink.trim() : undefined,
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl">
      {/* Price summary */}
      <div className="mb-6 pb-6 border-b border-slate-800/80">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
          {isCustomQuantity ? "Đơn giá theo lượt" : "Đơn giá sản phẩm"}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {formatVND(price)}
          </span>
          <span className="text-xs text-slate-400">
            {isCustomQuantity ? `/ 1 ${unitLabel}` : "/ 1 sản phẩm"}
          </span>
        </div>
      </div>

      {/* Stock status banner */}
      <div className="mb-6">
        {isCustomQuantity ? (
          <div className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-2.5 text-xs font-medium text-cyan-400">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Hệ thống tự động 24/7 (Khởi chạy ngay khi thanh toán)</span>
          </div>
        ) : inStock ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Sẵn sàng giao hàng ngay (Còn <strong>{stockCount}</strong> sản phẩm khả dụng)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 text-xs font-medium text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span>Sản phẩm hiện đang tạm hết hàng trong kho.</span>
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleCheckout} className="space-y-5">
        {/* Quantity Selector */}
        {isCustomQuantity ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="customQuantity"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Số lượng đặt ({unitLabel}) <span className="text-rose-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
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
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-2.5 px-4 text-base font-bold text-white focus:border-indigo-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                  placeholder={`Tối thiểu ${effectiveMin}`}
                />
              </div>

              <button
                type="button"
                disabled={isLoading || quantity <= effectiveMin}
                onClick={() => handleQuantityChange(-100)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 transition-colors"
                title="Giảm 100"
              >
                <Minus className="h-4 w-4" />
              </button>

              <button
                type="button"
                disabled={isLoading || (maxQuantity !== null && quantity >= maxQuantity)}
                onClick={() => handleQuantityChange(100)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40 transition-colors"
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
                  className="rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-indigo-500 hover:bg-indigo-600/20 hover:text-white transition-all"
                >
                  +{chip.toLocaleString("vi-VN")}
                </button>
              ))}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setQuantity(effectiveMin)}
                className="rounded-lg border border-slate-800 bg-slate-850 px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                Min
              </button>
            </div>

            {/* Live calculation banner */}
            <div className="mt-3 flex items-center justify-between rounded-xl bg-indigo-950/40 border border-indigo-500/25 p-3 text-xs">
              <span className="text-slate-300">
                Thành tiền ({quantity.toLocaleString("vi-VN")} × {formatVND(price)}):
              </span>
              <span className="text-sm font-bold text-indigo-300">
                {formatVND(totalPrice)}
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Số lượng mua
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-850 p-1">
                <button
                  type="button"
                  disabled={!inStock || quantity <= 1 || isLoading}
                  onClick={() => handleQuantityChange(-1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-750 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Giảm số lượng"
                >
                  <Minus className="h-4 w-4" />
                </button>

                <span className="w-12 text-center text-sm font-bold text-white">
                  {quantity}
                </span>

                <button
                  type="button"
                  disabled={!inStock || quantity >= stockCount || isLoading}
                  onClick={() => handleQuantityChange(1)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-slate-750 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Tăng số lượng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="text-xs text-slate-400">
                Tổng tiền: <strong className="text-white text-sm">{formatVND(totalPrice)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Target Link Input for SMM services */}
        {requiresLink && (
          <div>
            <label
              htmlFor="targetLink"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
            >
              Link video / bài viết / kênh <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                id="targetLink"
                type="url"
                required
                placeholder="https://www.tiktok.com/@... hoặc https://facebook.com/..."
                value={targetLink}
                disabled={isLoading || !inStock}
                onChange={(e) => setTargetLink(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all"
              />
              <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-indigo-400" />
            </div>
            <p className="mt-1.5 text-[11px] text-slate-400">
              Dán chính xác link video TikTok hoặc bài viết/fanpage Facebook cần tăng.
            </p>
          </div>
        )}

        {/* Customer Email Input */}
        <div>
          <label
            htmlFor="customerEmail"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
          >
            Email nhận hàng <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <input
              id="customerEmail"
              type="email"
              required
              placeholder="tenban@gmail.com"
              value={email}
              disabled={isLoading || !inStock}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-50 transition-all"
            />
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">
            Hệ thống sẽ gửi mã kích hoạt và hóa đơn vào email này ngay sau khi thanh toán.
          </p>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Buy Now CTA Button */}
        <div>
          {inStock ? (
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 py-3.5 px-6 text-sm font-bold text-white shadow-xl shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-500 disabled:opacity-60 transition-all hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang khởi tạo đơn hàng VietQR...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 fill-white" />
                  <span>MUA NGAY - {formatVND(totalPrice)}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-slate-800 py-3.5 px-6 text-sm font-bold text-slate-500 cursor-not-allowed"
            >
              Hết Hàng Tạm Thời
            </button>
          )}
        </div>
      </form>

      {/* Guarantees & security info */}
      <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-400 shrink-0" />
          <span>Giao hàng tức thì qua VietQR NAPAS 24/7 (30s)</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Bảo hành 1-đổi-1 hoặc hoàn tiền nếu sản phẩm có lỗi</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>Tạm giữ kho chống bán trùng tự động 15 phút</span>
        </div>
      </div>
    </div>
  );
}
