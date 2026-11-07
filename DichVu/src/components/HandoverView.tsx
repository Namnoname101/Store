"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Mail, Calendar, Hash, CheckCircle2 } from "lucide-react";
import OrderSuccessCelebration from "@/components/OrderSuccessCelebration";
import SecretDisplay, { type SecretDisplayProps } from "@/components/SecretDisplay";

export interface HandoverOrderData {
  orderCode: string;
  totalAmount: number;
  paidAt?: string | Date | null;
  status?: string;
  upstreamStatus?: string | null;
  customerEmail?: string | null;
  accessToken?: string | null;
  deliveredItems?: Array<{
    id: string;
    productId: string;
    secretContent?: string;
    status: string;
  }>;
  orderItems?: Array<{
    id: string;
    productId: string;
    price: number;
    quantity: number;
    product: any;
  }>;
  refundInfo?: any;
}

export interface HandoverViewProps {
  order: HandoverOrderData;
}

export default function HandoverView({ order }: HandoverViewProps) {
  const paidFormattedDate = order.paidAt
    ? new Date(order.paidAt).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Vừa xong";

  return (
    <div className="space-y-8">
      {/* Celebration Header */}
      <OrderSuccessCelebration
        orderCode={order.orderCode}
        totalAmount={order.totalAmount}
        paidAtFormatted={paidFormattedDate}
        itemCount={order.deliveredItems?.length || order.orderItems?.length || 1}
      />

      {/* Secret Display & Guides */}
      <SecretDisplay
        orderCode={order.orderCode}
        upstreamStatus={order.upstreamStatus || undefined}
        refundInfo={order.refundInfo}
        deliveredItems={order.deliveredItems || []}
        orderItems={order.orderItems || []}
        accessToken={order.accessToken}
      />

      {/* Return Home Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border bg-card text-card-foreground p-5 shadow-sm">
        <div className="text-xs text-muted-foreground text-center sm:text-left">
          Đơn hàng đã được lưu trữ trong hệ thống KhoDEE.
          {order.customerEmail ? (
            <span> Một bản sao đã được gửi tới email <strong className="text-foreground">{order.customerEmail}</strong>.</span>
          ) : (
            <span> Quý khách vui lòng lưu lại mã đơn hàng <strong className="text-foreground">#{order.orderCode}</strong> để tra cứu khi cần.</span>
          )}
        </div>

        <Link
          href="/"
          className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-5 py-2.5 text-xs font-bold text-primary-foreground transition-all shadow-sm shrink-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>Khám phá thêm sản phẩm khác</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export { HandoverView };
