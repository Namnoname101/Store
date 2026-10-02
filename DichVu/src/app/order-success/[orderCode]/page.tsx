import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Calendar,
  Mail,
  Receipt,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { getOrderDetails } from "@/services/order.service";
import { formatVND } from "@/components/ProductCard";
import SecretDisplay from "@/components/SecretDisplay";

interface OrderSuccessPageProps {
  params: {
    orderCode: string;
  };
}

export async function generateMetadata({
  params,
}: OrderSuccessPageProps): Promise<Metadata> {
  const { orderCode } = await Promise.resolve(params);
  return {
    title: `Đơn hàng hoàn tất #${orderCode} - DigiStore.vn`,
    description: `Thanh toán thành công đơn hàng #${orderCode}. Nhận mã bản quyền / tài khoản tự động tức thì.`,
  };
}

export default async function OrderSuccessPage({
  params,
}: OrderSuccessPageProps) {
  const { orderCode } = await Promise.resolve(params);
  const order = await getOrderDetails(orderCode);

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Không tìm thấy đơn hàng
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          Mã đơn hàng <strong>{orderCode}</strong> không tồn tại trong hệ thống.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/30"
        >
          <span>Về trang chủ</span>
        </Link>
      </div>
    );
  }

  // If order is not paid yet, redirect back to checkout
  if (order.status !== "PAID") {
    redirect(`/checkout/${orderCode}`);
  }

  const paidFormattedDate = order.paidAt
    ? new Date(order.paidAt).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Vừa xong";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 pb-24">
      {/* Celebration Header Banner */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 p-6 sm:p-10 shadow-2xl text-center">
        {/* Glow backdrop */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-950/50">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 animate-in zoom-in-50 duration-500" />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Thanh toán thành công 100%</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Giao Hàng Tự Động Hoàn Tất!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
            Hệ thống đã tự động xuất kho và bàn giao mã bản quyền / tài khoản số cho đơn hàng{" "}
            <strong className="text-white">#{order.orderCode}</strong>.
          </p>

          {/* Quick Order Info Pill Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-400 mb-0.5">
                <Receipt className="h-3 w-3 text-indigo-400" />
                <span>Số tiền đã thanh toán</span>
              </div>
              <div className="text-sm font-bold text-emerald-400">
                {formatVND(order.totalAmount)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-400 mb-0.5">
                <Mail className="h-3 w-3 text-indigo-400" />
                <span>Email nhận hóa đơn</span>
              </div>
              <div className="text-sm font-semibold text-slate-200 truncate">
                {order.customerEmail}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-slate-400 mb-0.5">
                <Calendar className="h-3 w-3 text-indigo-400" />
                <span>Thời gian thanh toán</span>
              </div>
              <div className="text-sm font-semibold text-slate-200">
                {paidFormattedDate}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secret Display & Activation Guides */}
      <div className="mb-10">
        <SecretDisplay
          deliveredItems={order.deliveredItems}
          orderItems={order.orderItems}
        />
      </div>

      {/* Return Home Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          Đơn hàng đã được lưu trữ trong hệ thống. Một bản sao đã được gửi tới email <strong>{order.customerEmail}</strong>.
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/30 hover:scale-[1.02] shrink-0"
        >
          <span>Khám phá thêm sản phẩm khác</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
