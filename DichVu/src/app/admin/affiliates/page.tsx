"use client";

import { useState, useEffect } from "react";
import {
  Users,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  QrCode,
  Search,
  ExternalLink,
  Coins,
  ArrowUpRight,
  X,
  AlertCircle,
  Check,
  Copy,
} from "lucide-react";

export default function AdminAffiliatesPage() {
  const [data, setData] = useState<{ affiliates: any[]; withdrawals: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"withdrawals" | "affiliates">("withdrawals");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [qrModalWithdrawal, setQrModalWithdrawal] = useState<any>(null);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch("/api/admin/affiliates");
      const json = await res.json();
      if (json.success) {
        setData({ affiliates: json.affiliates, withdrawals: json.withdrawals });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleResolve = async (id: string, action: "APPROVE" | "REJECT") => {
    setIsProcessing(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/admin/affiliates/withdrawals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          adminNote: action === "REJECT" ? rejectReason : "Đã duyệt và chuyển khoản",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Lỗi xử lý");
      }

      setActionMessage(json.message);
      setSelectedWithdrawal(null);
      setRejectReason("");
      fetchAffiliates();
    } catch (err: any) {
      alert(err?.message || "Lỗi xử lý");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  const pendingWithdrawals = data?.withdrawals.filter((w) => w.status === "PENDING") || [];
  const totalCommissionPaid = data?.affiliates.reduce((sum, a) => sum + (a.totalCommission || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            <span>Quản Lý Cộng Tác Viên (CTV)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Duyệt yêu cầu rút tiền hoa hồng và quản lý mạng lưới affiliate sinh viên.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Yêu Cầu Rút Chờ Duyệt</span>
          <div className="text-2xl font-black text-amber-500 flex items-center gap-2">
            <span>{pendingWithdrawals.length} lệnh</span>
          </div>
          <p className="text-[11px] text-slate-400">Cần chuyển khoản và duyệt</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Tổng Số CTV Đang Hoạt Động</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {data?.affiliates.length || 0} thành viên
          </div>
          <p className="text-[11px] text-slate-400">Đã kích hoạt mã giới thiệu</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">Tổng Hoa Hồng Đã Chi</span>
          <div className="text-2xl font-black text-emerald-500">
            {totalCommissionPaid.toLocaleString("vi-VN")}đ
          </div>
          <p className="text-[11px] text-slate-400">Tích lũy từ tất cả đơn hàng</p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button type="button" onClick={() => setActionMessage(null)} className="text-emerald-500 hover:underline">
            Đóng
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("withdrawals")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "withdrawals"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Yêu Cầu Rút Tiền ({data?.withdrawals.length || 0})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("affiliates")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "affiliates"
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Danh Sách CTV ({data?.affiliates.length || 0})
        </button>
      </div>

      {/* Tab 1: Withdrawals */}
      {activeTab === "withdrawals" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã Lệnh</th>
                  <th className="py-3 px-4">CTV</th>
                  <th className="py-3 px-4">Số Tiền Rút</th>
                  <th className="py-3 px-4">Tài Khoản Nhận</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {data?.withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chưa có yêu cầu rút tiền nào.
                    </td>
                  </tr>
                ) : (
                  data?.withdrawals.map((w: any) => (
                    <tr key={w.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {w.withdrawalCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {w.user.username || w.user.email}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                          {w.user.affiliateCode || "Chưa có mã"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-black text-sm text-slate-900 dark:text-white">
                        {w.amount.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {w.bankName} - {w.accountNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase">
                          {w.accountName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(w.createdAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            w.status === "APPROVED"
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : w.status === "REJECTED"
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {w.status === "APPROVED"
                            ? "Đã Duyệt"
                            : w.status === "REJECTED"
                            ? "Từ Chối"
                            : "Chờ Duyệt"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {w.status === "PENDING" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setQrModalWithdrawal(w)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                              title="Tạo VietQR chuyển khoản nhanh"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>VietQR</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolve(w.id, "APPROVE")}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                              Duyệt Đã Chuyển
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedWithdrawal(w)}
                              disabled={isProcessing}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                            >
                              Từ Chối
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            {w.adminNote || "Đã xử lý"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Affiliates List */}
      {activeTab === "affiliates" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tài Khoản</th>
                  <th className="py-3 px-4">Mã CTV (Voucher)</th>
                  <th className="py-3 px-4">Cấp Bậc</th>
                  <th className="py-3 px-4">Số Dư Ví</th>
                  <th className="py-3 px-4">Tổng Hoa Hồng</th>
                  <th className="py-3 px-4">Đơn Thành Công</th>
                  <th className="py-3 px-4">Thông Tin Rút Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {data?.affiliates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Chưa có CTV nào đăng ký.
                    </td>
                  </tr>
                ) : (
                  data?.affiliates.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {a.name || a.username || "Chưa đặt tên"}
                        </div>
                        <div className="text-[11px] text-slate-500">{a.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {a.affiliateCode || "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {a.affiliateTier}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {a.balance.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {a.totalCommission.toLocaleString("vi-VN")}đ
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {a.totalAffOrders} đơn
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {a.bankName && a.bankAccountNumber ? (
                          <div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{a.bankName}:</span> {a.bankAccountNumber}
                            {a.bankAccountName && (
                              <div className="uppercase text-[10px] text-slate-400">{a.bankAccountName}</div>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Chưa cập nhật</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Từ chối yêu cầu rút {selectedWithdrawal.withdrawalCode}?
            </h3>
            <p className="text-xs text-slate-500">
              Số tiền <span className="font-bold text-slate-900 dark:text-white">{selectedWithdrawal.amount.toLocaleString("vi-VN")}đ</span> sẽ được tự động hoàn lại vào số dư ví của CTV.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Lý do từ chối (hiển thị cho CTV)
              </label>
              <input
                type="text"
                placeholder="Sai số tài khoản, tên không khớp..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedWithdrawal(null)}
                className="px-3.5 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleResolve(selectedWithdrawal.id, "REJECT")}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
              >
                Xác Nhận Từ Chối & Hoàn Tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick VietQR Transfer Modal */}
      {qrModalWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-500" />
                <span>Quét VietQR Chuyển Tiền Cho CTV</span>
              </h3>
              <button type="button" onClick={() => setQrModalWithdrawal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <div>Người nhận: <span className="font-bold text-slate-900 dark:text-white">{qrModalWithdrawal.accountName}</span></div>
              <div>Ngân hàng: <span className="font-bold">{qrModalWithdrawal.bankName}</span> - STK: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{qrModalWithdrawal.accountNumber}</span></div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 pt-1">
                {qrModalWithdrawal.amount.toLocaleString("vi-VN")}đ
              </div>
            </div>

            {/* Quick VietQR Image */}
            <div className="p-3 bg-white rounded-xl inline-block border border-slate-200 shadow-xs">
              {/* VietQR Quick Image generator link */}
              <img
                src={`https://img.vietqr.io/image/${qrModalWithdrawal.bankName}-${qrModalWithdrawal.accountNumber}-compact.png?amount=${qrModalWithdrawal.amount}&addInfo=HOA%20HONG%20${qrModalWithdrawal.withdrawalCode}&accountName=${encodeURIComponent(qrModalWithdrawal.accountName)}`}
                alt="VietQR Payout"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-400">
              Mở App ngân hàng quét mã QR trên để chuyển tiền tức thì. Sau khi chuyển xong, bấm nút duyệt bên dưới.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQrModalWithdrawal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = qrModalWithdrawal.id;
                  setQrModalWithdrawal(null);
                  handleResolve(id, "APPROVE");
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              >
                Xác Nhận Đã Chuyển Khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
