"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { formatVND } from "@/lib/product-types";

interface OrderSuccessCelebrationProps {
  orderCode: string;
  totalAmount: number;
  paidAtFormatted: string;
  itemCount: number;
}

export default function OrderSuccessCelebration({
  orderCode,
  totalAmount,
  paidAtFormatted,
  itemCount,
}: OrderSuccessCelebrationProps) {
  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if browser environment denies canvas
    }
  }, []);

  return (
    <div className="rounded-2xl p-4 sm:p-5 border border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-lg mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xl shrink-0">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <div className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <span>Xác nhận thanh toán thành công!</span>
            <span className="text-xs text-emerald-500 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              #{orderCode}
            </span>
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5 font-mono">
            Đã thanh toán <b className="text-emerald-500 font-extrabold">{formatVND(totalAmount)}</b> • {paidAtFormatted} • Đã bàn giao {itemCount} mục
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-mono self-start sm:self-auto shrink-0">
        <span className="text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Bảo hành 1 đổi 1</span>
        </span>
      </div>
    </div>
  );
}
