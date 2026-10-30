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
import { formatVND } from "@/lib/product-types";
import SecretDisplay from "@/components/SecretDisplay";
import OrderSuccessCelebration from "@/components/OrderSuccessCelebration";

interface OrderSuccessPageProps {
  params: {
    orderCode: string;
  };
  searchParams?: {
    token?: string;
  };
}

export async function generateMetadata({
  params,
}: OrderSuccessPageProps): Promise<Metadata> {
  const { orderCode } = await Promise.resolve(params);
  return {
    title: `Đơn hàng hoàn tất #${orderCode} - Daitruong Store`,
    description: `Thanh toán thành công đơn hàng #${orderCode}. Nhận mã bản quyền / tài khoản tự động tức thì.`,
  };
}

export default async function OrderSuccessPage({
  params,
  searchParams,
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
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/30"
        >
          <span>Về trang chủ</span>
        </Link>
      </div>
    );
  }

  // Guest order token protection: prevent ORDxxxxxx enumeration attacks
  const isGuestOrder = !order.userId && !order.customerEmail;
  const token = searchParams?.token;
  const isTokenExpired = Boolean(
    order.createdAt &&
      Date.now() - new Date(order.createdAt).getTime() >
        30 * 24 * 60 * 60 * 1000
  );

  if (isGuestOrder && isTokenExpired) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Liên kết đơn hàng đã hết hạn
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          Đơn hàng <strong>#{orderCode}</strong> đã được tạo hơn 30 ngày. Vì lý do an toàn bảo mật, liên kết truy cập mã đã hết hiệu lực.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/30"
        >
          <span>Quay lại trang chủ</span>
        </Link>
      </div>
    );
  }

  if (isGuestOrder && order.accessToken && token !== order.accessToken) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Yêu cầu mã xác thực truy cập
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-6">
          Đơn hàng <strong>#{orderCode}</strong> là đơn mua của khách vãng lai. Để bảo mật mã bàn giao, vui lòng sử dụng liên kết chính xác có chứa mã bảo mật truy cập.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/30"
        >
          <span>Quay lại trang chủ</span>
        </Link>
      </div>
    );
  }

  // If order is not paid yet, redirect back to checkout
  if (order.status !== "PAID") {
    const tokenQuery = order.accessToken ? `?token=${order.accessToken}` : "";
    redirect(`/checkout/${orderCode}${tokenQuery}`);
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
      <OrderSuccessCelebration
        orderCode={order.orderCode}
        totalAmount={order.totalAmount}
        paidAtFormatted={paidFormattedDate}
        itemCount={order.deliveredItems?.length || 1}
      />

      {/* Secret Display & Activation Guides */}
      <div className="mb-10">
        <SecretDisplay
          orderCode={order.orderCode}
          upstreamStatus={order.upstreamStatus}
          refundInfo={order.refundInfo}
          deliveredItems={order.deliveredItems}
          orderItems={order.orderItems}
          accessToken={order.accessToken}
        />
      </div>

      {/* Return Home Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          Đơn hàng đã được lưu trữ trong hệ thống.
          {order.customerEmail ? (
            <span> Một bản sao đã được gửi tới email <strong>{order.customerEmail}</strong>.</span>
          ) : (
            <span> Quý khách vui lòng lưu lại mã đơn hàng <strong>#{order.orderCode}</strong> để tra cứu khi cần.</span>
          )}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/30 hover:scale-[1.02] shrink-0"
        >
          <span>Khám phá thêm sản phẩm khác</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
