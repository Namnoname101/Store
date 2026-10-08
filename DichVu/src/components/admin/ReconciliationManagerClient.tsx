"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Check,
  Info,
} from "lucide-react";
import type { PendingReconciliationStats } from "@/services/admin-reconciliation.service";

interface ReconciliationTransaction {
  id: string;
  transactionId: string;
  amount: number;
  bankCode?: string | null;
  content?: string | null;
  reconciliationStatus?: string | null;
  reconciliationNote?: string | null;
  createdAt: string | Date;
  orderId?: string | null;
  order?: {
    id: string;
    orderCode: string;
    customerEmail?: string | null;
    totalAmount: number;
    status: string;
    createdAt: string | Date;
    orderItems: Array<{
      id: string;
      price: number;
      quantity: number;
      targetLink?: string | null;
      product: {
        id: string;
        title: string;
        slug: string;
        fulfillmentType: string;
      };
    }>;
  } | null;
}

interface ReconciliationManagerClientProps {
  initialTransactions: ReconciliationTransaction[];
  initialStats: PendingReconciliationStats;
}

export default function ReconciliationManagerClient({
  initialTransactions,
  initialStats,
}: ReconciliationManagerClientProps) {
  const [transactions, setTransactions] = useState<ReconciliationTransaction[]>(initialTransactions);
  const [stats, setStats] = useState<PendingReconciliationStats>(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active modal state
  const [activeModalTx, setActiveModalTx] = useState<ReconciliationTransaction | null>(null);
  const [modalAction, setModalAction] = useState<"MATCH_AND_FULFILL" | "MARK_REFUNDED" | "DISMISS" | null>(null);
  const [orderCodeInput, setOrderCodeInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchLatest = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/reconciliation");
      const data = await res.json();
      if (res.ok && data.success) {
        setTransactions(data.transactions);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to refresh reconciliations:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by status
      if (statusFilter !== "ALL" && tx.reconciliationStatus !== statusFilter) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTxId = tx.transactionId?.toLowerCase().includes(query);
        const matchContent = tx.content?.toLowerCase().includes(query);
        const matchOrderCode = tx.order?.orderCode?.toLowerCase().includes(query);
        const matchEmail = tx.order?.customerEmail?.toLowerCase().includes(query);

        if (!matchTxId && !matchContent && !matchOrderCode && !matchEmail) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, statusFilter, searchQuery]);

  const openActionModal = (
    tx: ReconciliationTransaction,
    action: "MATCH_AND_FULFILL" | "MARK_REFUNDED" | "DISMISS"
  ) => {
    setActiveModalTx(tx);
    setModalAction(action);
    setOrderCodeInput(tx.order?.orderCode || "");
    setActionError(null);

    if (action === "MATCH_AND_FULFILL") {
      setNoteInput("Chủ sở hữu xác nhận hợp lệ & tiến hành giao hàng");
    } else if (action === "MARK_REFUNDED") {
      setNoteInput("Đã hoàn tiền cho khách qua ngân hàng");
    } else {
      setNoteInput("Giao dịch rác / hủy bỏ đối soát");
    }
  };

  const closeModal = () => {
    setActiveModalTx(null);
    setModalAction(null);
    setOrderCodeInput("");
    setNoteInput("");
    setActionError(null);
  };

  const handleExecuteAction = async () => {
    if (!activeModalTx || !modalAction) return;

    if (modalAction === "MATCH_AND_FULFILL" && !activeModalTx.order && !orderCodeInput.trim()) {
      setActionError("Vui lòng nhập mã đơn hàng (ORD...) để khớp và cấp hàng");
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);

      const res = await fetch(`/api/admin/reconciliation/${activeModalTx.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: modalAction,
          orderCode: orderCodeInput.trim() || undefined,
          note: noteInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể thực hiện hành động");
      }

      setSuccessToast(
        modalAction === "MATCH_AND_FULFILL"
          ? `Đã khớp và cấp đơn thành công cho đơn ${data.orderCode || activeModalTx.order?.orderCode || ""}`
          : modalAction === "MARK_REFUNDED"
          ? `Đã đánh dấu hoàn tiền thành công`
          : `Đã hủy bỏ đối soát giao dịch`
      );

      closeModal();
      await fetchLatest();
    } catch (err: any) {
      setActionError(err?.message || "Đã xảy ra lỗi khi xử lý");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "UNDERPAID":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-500/30">
            <AlertTriangle className="h-3.5 w-3.5" />
            Chuyển thiếu tiền
          </span>
        );
      case "OVERPAID":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-400 border border-blue-500/30">
            <Info className="h-3.5 w-3.5" />
            Chuyển thừa tiền
          </span>
        );
      case "EXPIRED_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-semibold text-orange-400 border border-orange-500/30">
            <Clock className="h-3.5 w-3.5" />
            Quá hạn QR (10m)
          </span>
        );
      case "UNMATCHED_ORDER":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400 border border-red-500/30">
            <HelpCircle className="h-3.5 w-3.5" />
            Sai cú pháp / Không rõ đơn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/15 px-2.5 py-1 text-xs font-semibold text-slate-400 border border-slate-500/30">
            {status || "Chờ xử lý"}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl bg-emerald-500/90 text-white px-4 py-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="ml-2 rounded-lg p-1 hover:bg-emerald-600 transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                Đối Soát Ngân Hàng & Giao Hàng
              </h1>
              <p className="text-xs text-slate-400">
                Xử lý các giao dịch bất thường (thiếu/thừa tiền, quá hạn, sai cú pháp) với nhật ký AuditLog minh bạch
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLatest}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/80 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Làm mới danh sách</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "ALL"
              ? "border-indigo-500/60 bg-indigo-500/10 shadow-lg shadow-indigo-500/5"
              : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/40"
          }`}
        >
          <div className="text-xs font-medium text-slate-400">Tất cả chờ duyệt</div>
          <div className="mt-2 text-2xl font-black text-white">{stats.totalPending}</div>
          <div className="mt-1 text-[11px] text-slate-500">Giao dịch cần can thiệp</div>
        </div>

        <div
          onClick={() => setStatusFilter("UNDERPAID")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "UNDERPAID"
              ? "border-amber-500/60 bg-amber-500/10 shadow-lg shadow-amber-500/5"
              : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/40"
          }`}
        >
          <div className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" /> Chuyển thiếu
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">{stats.underpaidCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Chặn tự cấp hàng</div>
        </div>

        <div
          onClick={() => setStatusFilter("OVERPAID")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "OVERPAID"
              ? "border-blue-500/60 bg-blue-500/10 shadow-lg shadow-blue-500/5"
              : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/40"
          }`}
        >
          <div className="text-xs font-medium text-blue-400 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" /> Chuyển thừa
          </div>
          <div className="mt-2 text-2xl font-black text-blue-400">{stats.overpaidCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Đã giao, chờ hoàn dư</div>
        </div>

        <div
          onClick={() => setStatusFilter("EXPIRED_PAYMENT")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "EXPIRED_PAYMENT"
              ? "border-orange-500/60 bg-orange-500/10 shadow-lg shadow-orange-500/5"
              : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/40"
          }`}
        >
          <div className="text-xs font-medium text-orange-400 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Quá hạn QR
          </div>
          <div className="mt-2 text-2xl font-black text-orange-400">{stats.expiredPaymentCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Chuyển sau 10 phút</div>
        </div>

        <div
          onClick={() => setStatusFilter("UNMATCHED_ORDER")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            statusFilter === "UNMATCHED_ORDER"
              ? "border-red-500/60 bg-red-500/10 shadow-lg shadow-red-500/5"
              : "border-slate-800/80 bg-slate-900/50 hover:bg-slate-800/40"
          }`}
        >
          <div className="text-xs font-medium text-red-400 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5" /> Sai cú pháp
          </div>
          <div className="mt-2 text-2xl font-black text-red-400">{stats.unmatchedCount}</div>
          <div className="mt-1 text-[11px] text-slate-500">Không tìm thấy mã đơn</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo mã GD, nội dung, mã đơn (ORD...), email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === "ALL"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-800/60 text-slate-400 hover:text-white"
            }`}
          >
            Tất cả ({transactions.length})
          </button>
          <button
            onClick={() => setStatusFilter("UNDERPAID")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === "UNDERPAID"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                : "bg-slate-800/60 text-slate-400 hover:text-white"
            }`}
          >
            Thiếu tiền ({stats.underpaidCount})
          </button>
          <button
            onClick={() => setStatusFilter("OVERPAID")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === "OVERPAID"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "bg-slate-800/60 text-slate-400 hover:text-white"
            }`}
          >
            Thừa tiền ({stats.overpaidCount})
          </button>
          <button
            onClick={() => setStatusFilter("EXPIRED_PAYMENT")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === "EXPIRED_PAYMENT"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                : "bg-slate-800/60 text-slate-400 hover:text-white"
            }`}
          >
            Quá hạn QR ({stats.expiredPaymentCount})
          </button>
          <button
            onClick={() => setStatusFilter("UNMATCHED_ORDER")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === "UNMATCHED_ORDER"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "bg-slate-800/60 text-slate-400 hover:text-white"
            }`}
          >
            Sai cú pháp ({stats.unmatchedCount})
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 overflow-hidden shadow-xl">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-white">Không có giao dịch cần đối soát</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Tất cả các giao dịch ngân hàng đã được hệ thống tự động đối soát chính xác hoặc đã được giải quyết xong.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Mã Giao Dịch & Thời Gian</th>
                  <th className="py-3.5 px-4">Số Tiền Thực Nhận</th>
                  <th className="py-3.5 px-4">Nội Dung Chuyển Khoản</th>
                  <th className="py-3.5 px-4">Tình Trạng Đối Soát</th>
                  <th className="py-3.5 px-4">Đơn Hàng Khớp</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác Chủ Sở Hữu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  const expectedAmount = tx.order?.totalAmount;
                  const diff = expectedAmount ? tx.amount - expectedAmount : null;

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Mã GD & Thời gian */}
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-slate-200">
                          {tx.transactionId}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </div>
                        {tx.bankCode && (
                          <span className="mt-1 inline-block text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                            {tx.bankCode}
                          </span>
                        )}
                      </td>

                      {/* Số tiền */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-sm font-black text-emerald-400">
                          {tx.amount.toLocaleString("vi-VN")}đ
                        </div>
                        {expectedAmount !== undefined && (
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            Cần thanh toán: {expectedAmount.toLocaleString("vi-VN")}đ
                          </div>
                        )}
                        {diff !== null && diff !== 0 && (
                          <div
                            className={`mt-0.5 text-[11px] font-semibold ${
                              diff < 0 ? "text-amber-400" : "text-blue-400"
                            }`}
                          >
                            {diff < 0
                              ? `Thiếu: ${Math.abs(diff).toLocaleString("vi-VN")}đ`
                              : `Thừa: +${diff.toLocaleString("vi-VN")}đ`}
                          </div>
                        )}
                      </td>

                      {/* Nội dung CK */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-mono text-slate-300 bg-slate-950/50 p-2 rounded-lg border border-slate-800 break-all select-all">
                          {tx.content || "(Không có nội dung)"}
                        </div>
                        {tx.reconciliationNote && (
                          <div className="mt-1 text-[11px] text-amber-400/90 italic">
                            Lý do: {tx.reconciliationNote}
                          </div>
                        )}
                      </td>

                      {/* Tình trạng */}
                      <td className="py-4 px-4">
                        {getStatusBadge(tx.reconciliationStatus)}
                      </td>

                      {/* Đơn hàng khớp */}
                      <td className="py-4 px-4">
                        {tx.order ? (
                          <div className="space-y-1">
                            <Link
                              href={`/admin/orders`}
                              className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                              <span>{tx.order.orderCode}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <div className="text-[11px] text-slate-400">
                              {tx.order.customerEmail || "(Khách vãng lai)"}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {tx.order.orderItems.length} món • Trạng thái:{" "}
                              <span className="text-slate-300">{tx.order.status}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Chưa khớp với đơn nào</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openActionModal(tx, "MATCH_AND_FULFILL")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-all font-semibold"
                            title="Xác nhận hợp lệ & tiến hành giao hàng"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Khớp & Giao</span>
                          </button>

                          <button
                            onClick={() => openActionModal(tx, "MARK_REFUNDED")}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-all font-semibold"
                            title="Đánh dấu đã hoàn tiền cho khách"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Hoàn tiền</span>
                          </button>

                          <button
                            onClick={() => openActionModal(tx, "DISMISS")}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 border border-slate-700 transition-all"
                            title="Hủy bỏ / Spam"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {activeModalTx && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {modalAction === "MATCH_AND_FULFILL" && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                )}
                {modalAction === "MARK_REFUNDED" && (
                  <RotateCcw className="h-5 w-5 text-blue-400" />
                )}
                {modalAction === "DISMISS" && (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <h3 className="text-base font-bold text-white">
                  {modalAction === "MATCH_AND_FULFILL" && "Xác Nhận Khớp & Giao Hàng"}
                  {modalAction === "MARK_REFUNDED" && "Đánh Dấu Đã Hoàn Tiền"}
                  {modalAction === "DISMISS" && "Hủy Bỏ / Bỏ Qua Giao Dịch"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Transaction Preview */}
            <div className="rounded-xl bg-slate-950/70 p-3.5 border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Mã GD:</span>
                <span className="font-mono font-bold text-white">{activeModalTx.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền:</span>
                <span className="font-bold text-emerald-400">
                  {activeModalTx.amount.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nội dung:</span>
                <span className="font-mono text-slate-300 max-w-xs truncate">
                  {activeModalTx.content || "(Trống)"}
                </span>
              </div>
            </div>

            {/* Inputs */}
            {modalAction === "MATCH_AND_FULFILL" && !activeModalTx.order && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mã đơn hàng cần khớp (ORD...): <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: ORD123456"
                  value={orderCodeInput}
                  onChange={(e) => setOrderCodeInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Ghi chú lý do của Chủ sở hữu (AuditLog):
              </label>
              <textarea
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Nhập lý do đối soát minh bạch..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 ${
                  modalAction === "MATCH_AND_FULFILL"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : modalAction === "MARK_REFUNDED"
                    ? "bg-blue-600 hover:bg-blue-500"
                    : "bg-red-600 hover:bg-red-500"
                } disabled:opacity-50`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <span>Xác nhận thực hiện</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
