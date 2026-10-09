"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ReceiptText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  QrCode,
  KeyRound,
  Trash2,
  Loader2,
  ShieldCheck,
  ShoppingBag,
  Activity,
} from "lucide-react";
import { formatVND } from "@/components/ProductCard";
import { getRecentOrders, clearRecentOrders, type SavedOrder } from "@/lib/order-storage";

interface LookupItem {
  productTitle: string;
  quantity: number;
  price: number;
}

interface LookupOrder {
  orderCode: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  upstreamStatus?: string | null;
  items: LookupItem[];
}

export default function OrderLookupPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [orders, setOrders] = useState<LookupOrder[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<SavedOrder[]>([]);

  useEffect(() => {
    // Load local history on mount
    setRecentOrders(getRecentOrders());
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setIsLoading(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tra cứu đơn hàng. Vui lòng thử lại.");
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      setErrorMessage(err.message || "Đã xảy ra lỗi khi tìm kiếm đơn hàng.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    clearRecentOrders();
    setRecentOrders([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Đã thanh toán / Đã giao
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            Chờ thanh toán VietQR
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Đã hết hạn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Tra cứu đơn hàng
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-lg mx-auto">
          Nhập <strong>email</strong> hoặc <strong>mã đơn hàng (ORD...)</strong> để kiểm tra trạng thái và xem lại thông tin sản phẩm.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-md shadow-2xl mb-10">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              placeholder="Nhập email mua hàng hoặc mã đơn (ví dụ: ORD123456)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/90 py-3.5 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            <Search className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
          </div>

          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-indigo-500 disabled:opacity-50 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tìm...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Tra cứu</span>
              </>
            )}
          </button>
        </form>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Search Results Section */}
      {hasSearched && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-indigo-400" />
              <span>Kết quả tra cứu ({orders.length})</span>
            </h2>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-500 mb-3" />
              <h3 className="text-base font-semibold text-slate-200">
                Không tìm thấy đơn hàng nào
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Vui lòng kiểm tra lại chính xác email bạn đã nhập khi thanh toán hoặc mã
                đơn hàng (ORDxxxxxx).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isPaid = order.status === "PAID";
                const isPending = order.status === "PENDING";
                const isBuffOrder = order.items.some((i) => {
                  const t = i.productTitle.toLowerCase();
                  return (
                    t.includes("follow") ||
                    t.includes("like") ||
                    t.includes("view") ||
                    t.includes("buff") ||
                    t.includes("sub") ||
                    t.includes("mạng xã hội") ||
                    t.includes("facebook") ||
                    t.includes("tiktok") ||
                    t.includes("instagram")
                  );
                });
                const targetUrl = isPaid
                  ? `/order-success/${order.orderCode}`
                  : `/checkout/${order.orderCode}`;

                return (
                  <div
                    key={order.orderCode}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-700 hover:bg-slate-900/90"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-white tracking-wide">
                          {order.orderCode}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="text-xs text-slate-300">
                        {order.items.map((i) => i.productTitle).join(", ")}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>
                          Ngày tạo:{" "}
                          {new Date(order.createdAt).toLocaleString("vi-VN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                        <span>•</span>
                        <span>Email: {order.customerEmail}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                      <div className="text-base font-bold text-white tracking-tight">
                        {formatVND(order.totalAmount)}
                      </div>

                      <Link
                        href={targetUrl}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-md transition-all ${
                          isPaid
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25"
                            : isPending
                            ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                      >
                        {isPaid ? (
                          isBuffOrder ? (
                            <>
                              <Activity className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
                              <span>Xem tiến trình</span>
                            </>
                          ) : (
                            <>
                              <KeyRound className="h-3.5 w-3.5" />
                              <span>Lấy Key / Xem hàng</span>
                            </>
                          )
                        ) : isPending ? (
                          <>
                            <QrCode className="h-3.5 w-3.5" />
                            <span>Thanh toán VietQR</span>
                          </>
                        ) : (
                          <>
                            <span>Xem chi tiết</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Orders on This Device (LocalStorage) */}
      {recentOrders.length > 0 && (
        <div className="mt-10 pt-8 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Đơn hàng gần đây trên thiết bị này</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tự động ghi nhớ trên máy của bạn không cần đăng nhập
              </p>
            </div>

            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-400 hover:border-rose-500/40 hover:text-rose-400 transition-colors"
              title="Xóa lịch sử trên máy này"
            >
              <Trash2 className="h-3 w-3" />
              <span>Xóa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentOrders.map((ro) => (
              <Link
                key={ro.orderCode}
                href={
                  ro.status === "PAID"
                    ? `/order-success/${ro.orderCode}`
                    : `/checkout/${ro.orderCode}`
                }
                className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 transition-all hover:border-indigo-500/50 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-indigo-950/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs font-bold text-indigo-400 group-hover:text-indigo-300">
                      {ro.orderCode}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        ro.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {ro.status === "PAID" ? "Đã giao" : "Chờ thanh toán"}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-200 line-clamp-1">
                    {ro.itemsSummary}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold">
                    {formatVND(ro.totalAmount)}
                  </span>
                  <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-medium">
                    Xem ngay <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Guarantees info footer */}
      <div className="mt-12 rounded-2xl border border-slate-800/60 bg-slate-900/30 p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0" />
          <span>Bảo mật 100% dữ liệu đơn hàng và thông tin khách hàng</span>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-cyan-400 shrink-0" />
          <span>Hệ thống lưu trữ vĩnh viễn, xem lại key bất cứ lúc nào</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>Hỗ trợ kỹ thuật 24/7 khi cần trợ giúp đơn hàng</span>
        </div>
      </div>
    </div>
  );
}
