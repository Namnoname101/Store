"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  User,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  LogOut,
  PlusCircle,
  Receipt,
  ExternalLink,
  Shield,
  Key,
} from "lucide-react";

export default function ProfileClient() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"wallet" | "orders">("wallet");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
          // Fetch history
          fetch("/api/wallet/history")
            .then((r) => r.json())
            .then((hData) => {
              if (hData?.success) {
                setTransactions(hData.transactions || []);
                setOrders(hData.orders || []);
              }
            })
            .finally(() => setLoadingHistory(false));
        } else {
          router.push("/login?callbackUrl=/profile");
        }
      })
      .catch(() => router.push("/login?callbackUrl=/profile"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* User Header Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-xl mb-8">
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full rounded-[14px] bg-slate-950 flex items-center justify-center text-white text-xl font-bold">
                {user?.username?.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{user?.username}</h1>
                <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
                  {user?.role === "ADMIN" ? "Quản trị viên" : "Thành viên"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {user?.email || "Chưa cập nhật email"} • Tham gia từ {new Date(user?.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          {/* Quick Balance Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-2.5">
              <div className="text-[11px] text-slate-400 uppercase font-medium">Số dư ví khả dụng</div>
              <div className="text-xl font-bold text-emerald-300">
                {user?.balance.toLocaleString("vi-VN")}đ
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2.5">
              <div className="text-[11px] text-slate-400 uppercase font-medium">Tổng tiền đã nạp</div>
              <div className="text-xl font-bold text-slate-200">
                {user?.totalDeposited.toLocaleString("vi-VN")}đ
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/topup"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-4 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-400 transition-all"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Nạp tiền</span>
              </Link>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-3 text-xs font-medium text-slate-400 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "wallet"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <Wallet className="h-4 w-4" />
          <span>Biến động số dư ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "orders"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Đơn hàng đã mua ({orders.length})</span>
        </button>
      </div>

      {/* Tab 1: Wallet Transactions */}
      {activeTab === "wallet" && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
          {loadingHistory ? (
            <div className="p-8 text-center text-slate-400">Đang tải lịch sử giao dịch ví...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Chưa có giao dịch ví nào</h3>
              <p className="text-xs text-slate-400 mb-4">
                Hãy nạp tiền vào ví để mua dịch vụ và theo dõi lịch sử số dư tại đây.
              </p>
              <Link
                href="/topup"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Nạp tiền ngay
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4">Loại GD</th>
                    <th className="py-3 px-4">Số tiền</th>
                    <th className="py-3 px-4">Số dư sau GD</th>
                    <th className="py-3 px-4">Mã tham chiếu</th>
                    <th className="py-3 px-4">Diễn giải</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {transactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${
                              tx.type === "TOPUP"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : tx.type === "ORDER_PAYMENT"
                                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                : tx.type === "REFUND"
                                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : (
                              <ArrowUpRight className="h-3 w-3" />
                            )}
                            {tx.type === "TOPUP"
                              ? "Nạp tiền"
                              : tx.type === "ORDER_PAYMENT"
                              ? "Thanh toán"
                              : tx.type === "REFUND"
                              ? "Hoàn tiền"
                              : "Điều chỉnh"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold whitespace-nowrap">
                          <span className={isPositive ? "text-emerald-400" : "text-rose-400"}>
                            {isPositive ? "+" : ""}
                            {tx.amount.toLocaleString("vi-VN")}đ
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-200 whitespace-nowrap">
                          {tx.balanceAfter.toLocaleString("vi-VN")}đ
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-indigo-300">
                          {tx.referenceId || "—"}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-400">
                          {tx.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Purchased Orders */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="p-8 text-center text-slate-400">Đang tải danh sách đơn hàng...</div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center shadow-xl">
              <ShoppingBag className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">Chưa có đơn hàng nào</h3>
              <p className="text-xs text-slate-400 mb-4">
                Bạn chưa thực hiện đơn mua dịch vụ nào qua tài khoản này.
              </p>
              <Link
                href="/#catalog"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                Khám phá dịch vụ
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-sm font-bold text-white">{ord.orderCode}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        ord.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {ord.status === "PAID" ? "Đã thanh toán" : "Đang chờ"}
                    </span>
                    {ord.paymentMethod === "WALLET" && (
                      <span className="text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-medium">
                        Ví số dư
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {new Date(ord.createdAt).toLocaleString("vi-VN")} •{" "}
                    {ord.orderItems?.map((i: any) => i.product?.title).join(", ") || "Dịch vụ số"}
                  </div>
                  {ord.deliveredItems && ord.deliveredItems.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      <Key className="h-3.5 w-3.5" />
                      <span>Key: {ord.deliveredItems[0].secretContent}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Tổng thanh toán</div>
                    <div className="text-base font-bold text-emerald-400">
                      {ord.totalAmount.toLocaleString("vi-VN")}đ
                    </div>
                  </div>
                  <Link
                    href={`/order-success/${ord.orderCode}`}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    <span>Chi tiết</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
