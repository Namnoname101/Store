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
} from "lucide-react";
import { formatVND } from "@/components/ProductCard";

interface ProductPurchaseBoxProps {
  productId: string;
  price: number;
  stockCount: number;
  productTitle: string;
}

export default function ProductPurchaseBox({
  productId,
  price,
  stockCount,
  productTitle,
}: ProductPurchaseBoxProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inStock = stockCount > 0;
  const totalPrice = price * quantity;

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > stockCount) return stockCount;
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
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ để nhận mã bản quyền / tài khoản.");
      return;
    }

    if (!inStock || stockCount < quantity) {
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

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-md shadow-xl">
      {/* Price summary */}
      <div className="mb-6 pb-6 border-b border-slate-800/80">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
          Đơn giá sản phẩm
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {formatVND(price)}
          </span>
          <span className="text-xs text-slate-400">/ 1 sản phẩm</span>
        </div>
      </div>

      {/* Stock status banner */}
      <div className="mb-6">
        {inStock ? (
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
