import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { getOrderDetails } from "@/services/order.service";
import { SUPPORTED_BANKS } from "@/lib/vietqr";
import CheckoutClient, { BankConfig } from "@/components/CheckoutClient";

interface CheckoutPageProps {
  params: {
    orderCode: string;
  };
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { orderCode } = await Promise.resolve(params);
  return {
    title: `Thanh toán đơn hàng #${orderCode} - DigiStore.vn`,
    description: `Quét mã VietQR chuyển khoản tự động cho đơn hàng #${orderCode}. Bàn giao mã kích hoạt tức thì.`,
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
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
          Mã đơn hàng <strong>{orderCode}</strong> không tồn tại trong hệ thống hoặc đã quá hạn và bị hủy.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-indigo-600/30"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại trang chủ mua sắm</span>
        </Link>
      </div>
    );
  }

  // If already paid and fulfilled, immediately redirect to delivery screen
  if (
    order.status === "PAID" &&
    order.upstreamStatus !== "PENDING_UPSTREAM" &&
    order.upstreamStatus !== "FAILED"
  ) {
    redirect(`/order-success/${orderCode}`);
  }

  const bankId = process.env.BANK_ID || "MB";
  const bankAccountNo = process.env.BANK_ACCOUNT_NO || "0987654321";
  const bankAccountName = process.env.BANK_ACCOUNT_NAME || "DIGISTORE VIET NAM";
  const bankInfo = SUPPORTED_BANKS[bankId];
  const bankName = bankInfo
    ? `${bankInfo.shortName} - ${bankInfo.name}`
    : "MBBank - Ngân hàng TMCP Quân Đội";

  const bankConfig: BankConfig = {
    bankId,
    bankName,
    accountNo: bankAccountNo,
    accountName: bankAccountName,
  };

  return <CheckoutClient order={order} bankConfig={bankConfig} />;
}
