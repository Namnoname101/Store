import Link from "next/link";
import { getAdminOverviewStats } from "@/services/admin.service";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  PackagePlus,
  KeyRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const stats = await getAdminOverviewStats();

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi doanh thu, trạng thái đơn hàng và tình trạng tồn kho theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
          >
            <KeyRound className="h-4 w-4" />
            <span>Nhập kho key</span>
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
          >
            <PackagePlus className="h-4 w-4" />
            <span>Thêm sản phẩm</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Doanh thu */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Tổng doanh thu</span>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">
              {formatVND(stats.totalRevenue)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">100% tự động</span> qua VietQR
            </p>
          </div>
        </div>

        {/* Đơn thành công */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Đơn thành công</span>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-indigo-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-white">
              {stats.paidOrders}{" "}
              <span className="text-sm font-normal text-slate-400">/ {stats.totalOrders} đơn</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tỷ lệ thanh toán:{" "}
              <span className="text-indigo-400 font-medium">
                {stats.totalOrders > 0
                  ? Math.round((stats.paidOrders / stats.totalOrders) * 100)
                  : 0}
                %
              </span>
            </p>
          </div>
        </div>

        {/* Đơn chờ thanh toán */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Chờ thanh toán</span>
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-amber-400">
              {stats.pendingOrders}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Đang giữ kho (Tự hoàn kho sau 15p)
            </p>
          </div>
        </div>

        {/* Cảnh báo kho */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-400">Tồn kho cảnh báo</span>
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-rose-400">
              {stats.lowStockProductsCount}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Sản phẩm có tồn kho &le; 5 key
            </p>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Đơn hàng mới nhất</h2>
            <p className="text-xs text-slate-400 mt-0.5">10 đơn hàng phát sinh gần nhất trong hệ thống</p>
          </div>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Xem tất cả</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Mã đơn</th>
                <th className="px-5 py-3 font-semibold">Khách hàng</th>
                <th className="px-5 py-3 font-semibold">Sản phẩm</th>
                <th className="px-5 py-3 font-semibold">Số tiền</th>
                <th className="px-5 py-3 font-semibold">Trạng thái</th>
                <th className="px-5 py-3 font-semibold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                    Chưa có đơn hàng nào được tạo.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-indigo-300 text-xs">
                      {order.orderCode}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {order.customerEmail}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {order.orderItems?.length > 0
                        ? order.orderItems
                            .map((i) => `${i.product?.title || "Sản phẩm"} (x${i.quantity})`)
                            .join(", ")
                        : "N/A"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">
                      {formatVND(order.totalAmount)}
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
