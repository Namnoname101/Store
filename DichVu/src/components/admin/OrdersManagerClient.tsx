"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  KeyRound,
  ExternalLink,
  RefreshCw,
  Truck,
} from "lucide-react";
import type { AdminOrderDetail } from "@/services/admin.service";

interface OrdersManagerClientProps {
  initialOrders: AdminOrderDetail[];
}

export default function OrdersManagerClient({
  initialOrders,
}: OrdersManagerClientProps) {
  const [orders, setOrders] = useState<AdminOrderDetail[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<{
    id: string;
    success: boolean;
    text: string;
  } | null>(null);

  const handleRetryUpstream = async (orderId: string) => {
    try {
      setRetryingOrderId(orderId);
      setRetryMessage(null);
      const res = await fetch(`/api/admin/orders/${orderId}/retry-upstream`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRetryMessage({
          id: orderId,
          success: true,
          text: `Cấp mã lại thành công! (Mã đối tác: ${data.upstreamOrderId || "OK"})`,
        });
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  upstreamStatus: data.status || "COMPLETED",
                  upstreamOrderId: data.upstreamOrderId || o.upstreamOrderId,
                  upstreamError: null,
                }
              : o
          )
        );
      } else {
        setRetryMessage({
          id: orderId,
          success: false,
          text: data.error || "Thử lại thất bại",
        });
      }
    } catch (err: any) {
      setRetryMessage({
        id: orderId,
        success: false,
        text: err?.message || "Lỗi kết nối khi gửi yêu cầu thử lại",
      });
    } finally {
      setRetryingOrderId(null);
    }
  };

  const getUpstreamStatusBadge = (upstreamStatus?: string) => {
    switch (upstreamStatus) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Cấp mã tự động: Thành công
          </span>
        );
      case "PENDING_UPSTREAM":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3 text-amber-400 animate-spin" />
            Đang cấp mã tự động...
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3 w-3 text-rose-400" />
            Lỗi cấp mã đối tác
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-400 border border-purple-500/20">
            Đã hoàn tiền
          </span>
        );
      default:
        return null;
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Đã thanh toán
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Chờ thanh toán
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            Hết hạn
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            {status}
          </span>
        );
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customerEmail && order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.transactions?.some((t) =>
          t.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    return {
      ALL: orders.length,
      PAID: orders.filter((o) => o.status === "PAID").length,
      PENDING: orders.filter((o) => o.status === "PENDING").length,
      EXPIRED: orders.filter((o) => o.status === "EXPIRED").length,
    };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý đơn hàng</h1>
        <p className="text-sm text-slate-400 mt-1">
          Theo dõi trạng thái đối soát VietQR, lịch sử thanh toán và mã sản phẩm đã bàn giao cho khách hàng.
        </p>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "ALL", label: "Tất cả", count: statusCounts.ALL },
            { key: "PAID", label: "Đã thanh toán", count: statusCounts.PAID },
            { key: "PENDING", label: "Chờ thanh toán", count: statusCounts.PENDING },
            { key: "EXPIRED", label: "Hết hạn", count: statusCounts.EXPIRED },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "border border-slate-800 bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  statusFilter === tab.key
                    ? "bg-indigo-800 text-indigo-100"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, email, mã GD..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Mã đơn</th>
                <th className="px-5 py-3.5 font-semibold">Khách hàng</th>
                <th className="px-5 py-3.5 font-semibold">Sản phẩm</th>
                <th className="px-5 py-3.5 font-semibold">Số tiền</th>
                <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                <th className="px-5 py-3.5 font-semibold">Thời gian</th>
                <th className="px-5 py-3.5 font-semibold text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    Không tìm thấy đơn hàng nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`hover:bg-slate-800/30 transition-colors ${
                          isExpanded ? "bg-indigo-600/5" : ""
                        }`}
                      >
                        <td className="px-5 py-4 font-mono font-bold text-indigo-300">
                          {order.orderCode}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {order.customerEmail || <span className="text-slate-500 italic">Khách vãng lai</span>}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          {order.orderItems?.length > 0
                            ? order.orderItems
                                .map((i) => `${i.product?.title || "Sản phẩm"} (x${i.quantity})`)
                                .join(", ")
                            : "N/A"}
                        </td>
                        <td className="px-5 py-4 font-bold text-white">
                          {formatVND(order.totalAmount)}
                        </td>
                        <td className="px-5 py-4 space-y-1">
                          <div>{getStatusBadge(order.status)}</div>
                          {order.upstreamStatus && order.upstreamStatus !== "NOT_APPLICABLE" && (
                            <div>{getUpstreamStatusBadge(order.upstreamStatus)}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          <div>Tạo: {formatDate(order.createdAt)}</div>
                          {order.paidAt && (
                            <div className="text-emerald-400 font-medium">
                              Thanh toán: {formatDate(order.paidAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                          >
                            <span>Key & GD</span>
                            {isExpanded ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Order Details (Delivered Keys & Payment Transactions) */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80 border-b border-slate-800">
                          <td colSpan={7} className="px-6 py-5">
                            <div className="space-y-4">
                              {/* Refund Request Info Banner */}
                              {order.refundInfo && (() => {
                                let refundData: any = null;
                                try {
                                  refundData = JSON.parse(order.refundInfo);
                                } catch {
                                  refundData = { raw: order.refundInfo };
                                }

                                return (
                                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-xs space-y-2">
                                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                                      <AlertTriangle className="h-4 w-4 shrink-0" />
                                      <span className="text-sm">Yêu cầu hoàn tiền từ khách hàng</span>
                                    </div>
                                    {refundData.bankName ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 text-slate-300">
                                        <div>
                                          <span className="text-slate-400 block text-[11px]">Ngân hàng:</span>
                                          <span className="font-semibold text-white">{refundData.bankName}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[11px]">Số tài khoản:</span>
                                          <span className="font-mono font-bold text-amber-300 select-all">{refundData.accountNumber}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[11px]">Chủ tài khoản:</span>
                                          <span className="font-bold text-white uppercase">{refundData.accountName}</span>
                                        </div>
                                        <div>
                                          <span className="text-slate-400 block text-[11px]">Thời gian yêu cầu:</span>
                                          <span className="text-slate-300">{formatDate(refundData.requestedAt)}</span>
                                        </div>
                                        {refundData.note && (
                                          <div className="sm:col-span-2 md:col-span-4 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                            <span className="text-slate-400">Ghi chú:</span> {refundData.note}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="font-mono text-slate-300 select-all">{refundData.raw || order.refundInfo}</div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Upstream Dropship Details & Retry */}
                              {order.upstreamStatus && order.upstreamStatus !== "NOT_APPLICABLE" && (
                                <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <Truck className="h-4 w-4 text-indigo-400" />
                                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                        Cấp phát tự động qua đối tác (Dropshipping)
                                      </span>
                                      {getUpstreamStatusBadge(order.upstreamStatus)}
                                    </div>
                                    {order.upstreamOrderId && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-mono">
                                          Mã đối tác: <strong className="text-indigo-300">{order.upstreamOrderId}</strong>
                                        </span>
                                        <Link
                                          href={`/order-success/${order.orderCode}`}
                                          target="_blank"
                                          className="text-[11px] text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 font-medium bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/20 transition-colors"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          <span>Xem tiến trình</span>
                                        </Link>
                                      </div>
                                    )}
                                  </div>

                                  {order.upstreamError && (
                                    <div className="rounded-lg bg-rose-950/40 border border-rose-800/40 p-2.5 text-xs text-rose-300 space-y-1">
                                      <div className="font-semibold flex items-center gap-1.5">
                                        <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                                        <span>Lỗi phản hồi từ sàn nguồn:</span>
                                      </div>
                                      <p className="font-mono text-[11px] select-all">{order.upstreamError}</p>
                                    </div>
                                  )}

                                  {retryMessage && retryMessage.id === order.id && (
                                    <div
                                      className={`p-2.5 rounded-lg text-xs font-medium border ${
                                        retryMessage.success
                                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                          : "bg-rose-500/10 border-rose-500/20 text-rose-300"
                                      }`}
                                    >
                                      {retryMessage.text}
                                    </div>
                                  )}

                                  {order.upstreamStatus === "FAILED" && (
                                    <div className="flex items-center gap-2 pt-1">
                                      <button
                                        onClick={() => handleRetryUpstream(order.id)}
                                        disabled={retryingOrderId === order.id}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                                      >
                                        <RefreshCw
                                          className={`h-3.5 w-3.5 ${
                                            retryingOrderId === order.id ? "animate-spin" : ""
                                          }`}
                                        />
                                        <span>{retryingOrderId === order.id ? "Đang gửi đơn..." : "Thử đặt lại qua API"}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                              {/* Delivered Items / Keys Section */}
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                  <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
                                  <span>Mã bản quyền / Tài khoản bàn giao ({order.deliveredItems?.length || 0})</span>
                                </h4>
                                {order.deliveredItems && order.deliveredItems.length > 0 ? (
                                  <div className="space-y-2">
                                    {order.deliveredItems.map((item, idx) => (
                                      <div
                                        key={item.id || idx}
                                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="font-mono text-xs text-indigo-400 font-bold">
                                            #{idx + 1}
                                          </span>
                                          <code className="font-mono text-sm text-emerald-300 select-all">
                                            {item.secretContent}
                                          </code>
                                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {item.status}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleCopy(item.secretContent)}
                                          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 transition-all"
                                        >
                                          {copiedKey === item.secretContent ? (
                                            <>
                                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                                              <span className="text-emerald-400">Đã copy</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="h-3.5 w-3.5" />
                                              <span>Copy</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-500 italic p-3 rounded-lg border border-slate-800/60 bg-slate-900/40">
                                    Chưa có key nào được giao (Đơn chưa thanh toán hoặc đang giữ kho).
                                  </div>
                                )}
                              </div>

                              {/* Payment Transactions Section */}
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                                  <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                                  <span>Giao dịch ngân hàng VietQR ({order.transactions?.length || 0})</span>
                                </h4>
                                {order.transactions && order.transactions.length > 0 ? (
                                  <div className="space-y-2">
                                    {order.transactions.map((tx) => (
                                      <div
                                        key={tx.id}
                                        className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs flex flex-wrap items-center justify-between gap-4"
                                      >
                                        <div className="flex items-center gap-3">
                                          <span className="font-semibold text-white">
                                            Mã GD: <strong className="font-mono text-indigo-300">{tx.transactionId}</strong>
                                          </span>
                                          <span className="text-slate-400">Ngân hàng: {tx.bankCode || "VietQR"}</span>
                                          {tx.content && (
                                            <span className="text-slate-400">Nội dung: {tx.content}</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="font-bold text-emerald-400">
                                            +{formatVND(tx.amount)}
                                          </span>
                                          <span className="text-slate-500 text-[11px]">
                                            {formatDate(tx.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-slate-500 italic p-3 rounded-lg border border-slate-800/60 bg-slate-900/40">
                                    Chưa ghi nhận giao dịch chuyển khoản cho đơn hàng này.
                                  </div>
                                )}
                              </div>

                              {/* Order Link */}
                              <div className="pt-2 flex justify-end">
                                <Link
                                  href={`/order-success/${order.orderCode}`}
                                  target="_blank"
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                                >
                                  <span>Xem trang nhận hàng của khách</span>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
