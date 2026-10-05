"use client";

import React, { useState } from "react";
import {
  Users,
  Wallet,
  TrendingUp,
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShoppingBag,
  ArrowDownLeft,
} from "lucide-react";
import { formatVND } from "@/components/ProductCard";

export interface AdminUserItem {
  id: string;
  username: string | null;
  email: string | null;
  role: string;
  balance: number;
  totalDeposited: number;
  orderCount: number;
  depositCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersStats {
  totalUsers: number;
  totalBalance: number;
  totalDeposited: number;
}

interface UsersManagerClientProps {
  initialUsers: AdminUserItem[];
  initialStats: AdminUsersStats;
}

export default function UsersManagerClient({
  initialUsers,
  initialStats,
}: UsersManagerClientProps) {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers);
  const [stats, setStats] = useState<AdminUsersStats>(initialStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Adjustment Modal State
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [adjustType, setAdjustType] = useState<"ADD" | "DEDUCT">("ADD");
  const [adjustAmount, setAdjustAmount] = useState<number>(50000);
  const [adjustReason, setAdjustReason] = useState<string>("Khuyến mãi thành viên");
  const [adminNote, setAdminNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setIsSearching(true);
    try {
      const url = term.trim()
        ? `/api/admin/users?search=${encodeURIComponent(term.trim())}`
        : `/api/admin/users`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const openAdjustModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setAdjustType("ADD");
    setAdjustAmount(50000);
    setAdjustReason("Khuyến mãi thành viên");
    setAdminNote("");
    setModalError(null);
  };

  const closeAdjustModal = () => {
    setSelectedUser(null);
    setModalError(null);
    setIsSubmitting(false);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!adjustAmount || adjustAmount <= 0) {
      setModalError("Vui lòng nhập số tiền hợp lệ lớn hơn 0");
      return;
    }

    if (!adjustReason.trim()) {
      setModalError("Vui lòng nhập lý do điều chỉnh");
      return;
    }

    const finalAmount = adjustType === "ADD" ? adjustAmount : -adjustAmount;

    if (adjustType === "DEDUCT" && selectedUser.balance < adjustAmount) {
      setModalError(
        `Số dư ví hiện tại (${formatVND(selectedUser.balance)}) không đủ để trừ ${formatVND(adjustAmount)}`
      );
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/adjust-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          reason: adjustReason.trim(),
          adminNote: adminNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Điều chỉnh số dư thất bại");
      }

      // Update state locally
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, balance: data.user.balance } : u
        )
      );

      setStats((prev) => ({
        ...prev,
        totalBalance: prev.totalBalance + finalAmount,
      }));

      setToastMessage(
        `Đã ${adjustType === "ADD" ? "cộng" : "trừ"} ${formatVND(adjustAmount)} cho tài khoản ${selectedUser.username || selectedUser.email || "thành viên"}`
      );
      setTimeout(() => setToastMessage(null), 4000);

      closeAdjustModal();
    } catch (err: any) {
      setModalError(err.message || "Đã xảy ra lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [20000, 50000, 100000, 200000, 500000];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-500/90 text-white px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md border border-emerald-400/30 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-400" />
            Quản lý Thành viên & Ví
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Theo dõi danh sách khách hàng, số dư ví thực tế và thực hiện điều chỉnh số dư có sổ cái kiểm toán
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng thành viên
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {stats.totalUsers.toLocaleString("vi-VN")}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng số dư trong ví
            </p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {formatVND(stats.totalBalance)}
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tổng tiền đã nạp
            </p>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {formatVND(stats.totalDeposited)}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Search Header */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên đăng nhập hoặc email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
            )}
          </div>
          <div className="text-xs text-slate-400 self-end sm:self-center">
            Hiển thị <span className="font-semibold text-slate-200">{users.length}</span> tài khoản
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Tài khoản</th>
                <th className="py-3 px-4">Số dư ví</th>
                <th className="py-3 px-4">Tổng nạp</th>
                <th className="py-3 px-4 text-center">Đơn hàng</th>
                <th className="py-3 px-4 text-center">Lệnh nạp</th>
                <th className="py-3 px-4">Ngày đăng ký</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Không tìm thấy thành viên nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          {user.username || "Chưa đặt"}
                          {user.role === "ADMIN" && (
                            <span className="text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {user.email || "Chưa cập nhật"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-sm">
                        <Wallet className="w-3.5 h-3.5" />
                        {formatVND(user.balance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-300">
                      {formatVND(user.totalDeposited)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                        {user.orderCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <ArrowDownLeft className="w-3.5 h-3.5 text-slate-500" />
                        {user.depositCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openAdjustModal(user)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-medium transition-all active:scale-95"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Điều chỉnh ví
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl relative">
            <button
              onClick={closeAdjustModal}
              className="absolute top-5 right-5 text-slate-400 hover:text-white rounded-xl p-1.5 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
              Điều chỉnh số dư ví
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Thực hiện nạp tiền hoặc khấu trừ ví cho thành viên với nhật ký kiểm toán minh bạch.
            </p>

            {/* Target User Info */}
            <div className="mt-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Thành viên</p>
                <p className="text-sm font-bold text-white mt-0.5">{selectedUser.username || "Chưa đặt"}</p>
                <p className="text-xs text-slate-500">{selectedUser.email || "Chưa cập nhật"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Số dư hiện tại</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5">
                  {formatVND(selectedUser.balance)}
                </p>
              </div>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="mt-5 space-y-4">
              {/* Type Switcher: ADD or DEDUCT */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Loại điều chỉnh
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("ADD")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      adjustType === "ADD"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/40"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Cộng tiền (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DEDUCT")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      adjustType === "DEDUCT"
                        ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-sm"
                        : "bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/40"
                    }`}
                  >
                    <Minus className="w-4 h-4" />
                    Trừ tiền (-)
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Số tiền (VND)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="50000"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Quick amount chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAdjustAmount(amt)}
                      className={`text-[11px] font-medium px-2 py-1 rounded-lg border transition-all ${
                        adjustAmount === amt
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-slate-950/50 text-slate-400 border-slate-800 hover:bg-slate-800/50"
                      }`}
                    >
                      {formatVND(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Lý do điều chỉnh (bắt buộc)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Ví dụ: Khuyến mãi, Hoàn tiền đơn lỗi..."
                  required
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Internal Admin Note */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ghi chú nội bộ (tuỳ chọn)
                </label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Mã vé hỗ trợ, trao đổi CSKH..."
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAdjustModal}
                  disabled={isSubmitting}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-1/2 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                    adjustType === "ADD"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                      : "bg-red-600 hover:bg-red-500 shadow-red-600/30"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      {adjustType === "ADD" ? "Xác nhận nạp" : "Xác nhận trừ"}
                    </>
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
