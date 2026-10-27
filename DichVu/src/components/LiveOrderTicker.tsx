"use client";

import React from "react";
import { Zap, Flame } from "lucide-react";

const INITIAL_TRANSACTIONS = [
  { phone: "093****216", item: "API Claude 3.5 Sonnet (10$ Credit)", time: "1 phút trước", type: "BUY" },
  { phone: "dai****33", item: "Nạp +200.000đ vào ví tự động", time: "2 phút trước", type: "TOPUP" },
  { phone: "quang****88", item: "Tài khoản ChatGPT Plus 1 Tháng", time: "4 phút trước", type: "BUY" },
  { phone: "minh****01", item: "CapCut Pro 1 Năm Bản Quyền", time: "6 phút trước", type: "BUY" },
  { phone: "hoang****92", item: "Cursor Pro 1 Tháng (API ModelAPI)", time: "8 phút trước", type: "BUY" },
  { phone: "tuan****55", item: "Nạp +500.000đ (Nhận thưởng +5%)", time: "11 phút trước", type: "TOPUP" },
];

export default function LiveOrderTicker() {
  return (
    <div className="bg-[#0b1222] border-b border-white/5 py-2 overflow-hidden text-xs text-slate-300 print:hidden select-none">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
        {/* Badge */}
        <div className="flex items-center gap-1.5 font-bold text-amber-400 shrink-0 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <Flame className="w-3 h-3 text-amber-400" />
          <span>Giao dịch mới</span>
        </div>

        {/* Marquee Track */}
        <div className="overflow-hidden relative w-full">
          <div className="animate-marquee flex items-center gap-8 text-[11px] font-mono">
            {INITIAL_TRANSACTIONS.concat(INITIAL_TRANSACTIONS).map((tx, idx) => (
              <span key={idx} className="flex items-center gap-1.5 whitespace-nowrap text-slate-300">
                {tx.type === "TOPUP" ? (
                  <>
                    <Zap className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Khách <b className="text-emerald-400 font-semibold">{tx.phone}</b> vừa {tx.item}</span>
                  </>
                ) : (
                  <>
                    <span className="text-blue-400">🔥</span>
                    <span>Khách <b className="text-blue-400 font-semibold">{tx.phone}</b> vừa mua <b className="text-white font-semibold">{tx.item}</b></span>
                  </>
                )}
                <span className="text-slate-500 text-[10px]">• {tx.time}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
