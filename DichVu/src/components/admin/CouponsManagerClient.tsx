"use client";

import React, { useState } from "react";
import {
  Ticket,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Percent,
  DollarSign,
  Loader2,
  Copy,
  Check,
  Tag,
} from "lucide-react";
import { formatVND } from "@/components/ProductCard";

export interface CouponItem {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: {
    orders: number;
  };
}

interface CouponsManagerClientProps {
  initialCoupons: CouponItem[];
}

export default function CouponsManagerClient({
  initialCoupons,
}: CouponsManagerClientProps) {
  const [coupons, setCoupons] = useState<CouponItem[]>(initialCoupons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState<"FIXED" | "PERCENT">("FIXED");
  const [value, setValue] = useState<number>(20000);
  const [minOrderValue, setMinOrderValue] = useState<number>(50000);
  const [maxDiscount, setMaxDiscount] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.isActive).length;
  const totalUsed = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error("Không thể cập nhật trạng thái");
      setCoupons((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !currentStatus } : c))
      );
    } catch (err: any) {
      alert(err.message || "Lỗi cập nhật");
    }
  };

  const handleDelete = async (id: string, couponCode: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã giảm giá "${couponCode}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Không thể xóa mã");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.message || "Lỗi khi xóa mã");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          type,
          value: Number(value),
          minOrderValue: Number(minOrderValue) || 0,
          maxDiscount: maxDiscount ? Number(maxDiscount) : null,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tạo mã giảm giá");

      setCoupons([data.coupon, ...coupons]);
      setSuccessMessage(`Đã tạo thành công mã "${data.coupon.code}"`);
      setIsModalOpen(false);

      // Reset form
      setCode("");
      setValue(20000);
      setMinOrderValue(50000);
      setMaxDiscount("");
      setUsageLimit("");
      setExpiresAt("");
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Ticket className="h-6 w-6 text-indigo-400" />
            <span>Quản Lý Mã Giảm Giá</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Tạo và cấu hình các mã khuyến mãi, voucher kích cầu cho khách hàng
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo Mã Mới</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tổng Số Mã
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
            {totalCoupons}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Đang Hoạt Động
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-emerald-400">
            {activeCoupons}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Lượt Khách Đã Sử Dụng
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-indigo-300">
            {totalUsed}
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Coupons Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Mã Code</th>
                <th className="py-3.5 px-4 font-semibold">Mức Giảm</th>
                <th className="py-3.5 px-4 font-semibold">Đơn Tối Thiểu</th>
                <th className="py-3.5 px-4 font-semibold">Đã Dùng / Giới Hạn</th>
                <th className="py-3.5 px-4 font-semibold">Hạn Dùng</th>
                <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                <th className="py-3.5 px-4 font-semibold text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Chưa có mã giảm giá nào. Hãy bấm "Tạo Mã Mới" để bắt đầu.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date() > new Date(coupon.expiresAt);
                  const isExhausted = coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;

                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
                            title="Sao chép mã"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-200">
                        {coupon.type === "PERCENT" ? (
                          <span>
                            Giảm {coupon.value}%
                            {coupon.maxDiscount && (
                              <span className="text-[11px] text-slate-400 block font-normal">
                                Tối đa {formatVND(coupon.maxDiscount)}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span>-{formatVND(coupon.value)}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {coupon.minOrderValue > 0
                          ? formatVND(coupon.minOrderValue)
                          : "Không giới hạn"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white">
                          {coupon.usedCount}
                        </span>
                        <span className="text-slate-400 font-normal">
                          {" "}/ {coupon.usageLimit !== null ? coupon.usageLimit : "∞"}
                        </span>
                        {isExhausted && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px]">
                            Hết lượt
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        {coupon.expiresAt ? (
                          <span
                            className={
                              isExpired ? "text-rose-400 font-medium" : "text-slate-300"
                            }
                          >
                            {new Date(coupon.expiresAt).toLocaleDateString("vi-VN")}
                            {isExpired && " (Hết hạn)"}
                          </span>
                        ) : (
                          <span className="text-slate-400">Vĩnh viễn</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            coupon.isActive
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              coupon.isActive ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                          <span>{coupon.isActive ? "Hoạt động" : "Tạm ngưng"}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(coupon.id, coupon.code)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Xóa mã này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Ticket className="h-5 w-5 text-indigo-400" />
                <span>Tạo Mã Khuyến Mãi Mới</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Mã Code (Tự động in hoa) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: GIAM20K, CHAOBANMOI"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Hình Thức Giảm
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="FIXED">Số tiền cố định (VND)</option>
                    <option value="PERCENT">Phần trăm (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Giá Trị Giảm <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    placeholder={type === "PERCENT" ? "10" : "20000"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {type === "PERCENT" && (
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Mức Giảm Tối Đa (VND - Tùy chọn)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    placeholder="VD: 50000 (để trống nếu không giới hạn trần)"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Đơn Hàng Tối Thiểu (VND)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                    Giới Hạn Lượt Dùng
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Không giới hạn"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5">
                  Ngày Hết Hạn (Tùy chọn)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <span>Lưu Mã Giảm Giá</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
