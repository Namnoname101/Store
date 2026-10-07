import { prisma, FulfillmentType } from "@/lib/prisma";
import { getSupplierAdapter } from "@/services/suppliers/adapter.registry";

export type BuffStage =
  | "RECEIVED"
  | "INITIALIZING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "CANCELLED"
  | "FAILED";

export interface BuffProgressResult {
  orderCode: string;
  isBuffOrder: boolean;
  status?: BuffStage;
  statusLabel?: string;
  targetLink?: string;
  totalQuantity?: number;
  startCount?: number;
  remains?: number;
  deliveredCount?: number;
  progressPercent?: number;
  serviceName?: string;
  providerName?: string;
  serverOrderId?: string;
  createdAt?: string;
  lastUpdated?: string;
  error?: string;
}

const STAGE_LABELS: Record<BuffStage, string> = {
  RECEIVED: "Đang tiếp nhận đơn",
  INITIALIZING: "Khởi tạo & Quét số gốc",
  IN_PROGRESS: "Đang đẩy tương tác",
  COMPLETED: "Đã hoàn thành",
  PARTIAL: "Hoàn tất một phần (Đã hoàn lại phần chưa chạy)",
  CANCELLED: "Đã hủy đơn",
  FAILED: "Lỗi kết nối máy chủ",
};

export async function getBuffProgress(orderCode: string): Promise<BuffProgressResult> {
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              supplierMapping: {
                include: {
                  supplier: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return {
      orderCode,
      isBuffOrder: false,
      error: "Không tìm thấy đơn hàng",
    };
  }

  // Find dropship buff item
  const buffItem = order.orderItems.find((item) => {
    const supp = item.product?.supplierMapping?.supplier;
    return (
      item.product?.fulfillmentType === FulfillmentType.API_DROPSHIP &&
      supp &&
      supp.isActive !== false
    );
  });

  if (!buffItem || !buffItem.product?.supplierMapping?.supplier) {
    return {
      orderCode,
      isBuffOrder: false,
    };
  }

  const supplier = buffItem.product.supplierMapping.supplier;
  const adapter = getSupplierAdapter(supplier.type);

  // If adapter does not support status checking
  if (typeof adapter.checkOrderStatus !== "function") {
    return {
      orderCode,
      isBuffOrder: false,
    };
  }

  const totalQuantity = buffItem.quantity;
  const serviceName = buffItem.product.title;
  const providerName = "Máy chủ cấp phát DigiStore";
  const targetLink = order.customerNote || undefined;
  const serverOrderId = order.upstreamOrderId || undefined;
  const createdAt = order.createdAt.toISOString();
  const lastUpdated = new Date().toISOString();

  // If server order has not been placed yet
  if (!serverOrderId) {
    return {
      orderCode,
      isBuffOrder: true,
      status: "INITIALIZING",
      statusLabel: STAGE_LABELS.INITIALIZING,
      targetLink,
      totalQuantity,
      startCount: 0,
      remains: totalQuantity,
      deliveredCount: 0,
      progressPercent: 0,
      serviceName,
      providerName,
      createdAt,
      lastUpdated,
    };
  }

  try {
    const statusRes = await adapter.checkOrderStatus(
      {
        baseUrl: supplier.baseUrl,
        apiKey: supplier.apiKey,
        apiSecret: supplier.apiSecret,
      },
      serverOrderId
    );

    if (!statusRes.success) {
      // Return initializing or running with fallback if temporary server error
      return {
        orderCode,
        isBuffOrder: true,
        status: "INITIALIZING",
        statusLabel: STAGE_LABELS.INITIALIZING,
        targetLink,
        totalQuantity,
        startCount: 0,
        remains: totalQuantity,
        deliveredCount: 0,
        progressPercent: 0,
        serviceName,
        providerName,
        serverOrderId,
        createdAt,
        lastUpdated,
      };
    }

    let stage: BuffStage = "IN_PROGRESS";
    const rawStatus = (statusRes.status || "").toUpperCase();

    if (rawStatus === "COMPLETED") {
      stage = "COMPLETED";
    } else if (rawStatus === "PARTIAL") {
      stage = "PARTIAL";
    } else if (rawStatus === "CANCELLED" || rawStatus === "CANCELED") {
      stage = "CANCELLED";
    } else if (rawStatus === "PENDING" || rawStatus === "PROCESSING") {
      stage = "INITIALIZING";
    } else {
      stage = "IN_PROGRESS";
    }

    const startCount = statusRes.startCount ?? 0;
    let remains = statusRes.remains !== undefined ? statusRes.remains : totalQuantity;
    let deliveredCount = Math.max(0, Math.min(totalQuantity, totalQuantity - remains));

    if (stage === "COMPLETED") {
      remains = 0;
      deliveredCount = totalQuantity;
    }

    const progressPercent =
      totalQuantity > 0
        ? Math.min(100, Math.max(0, Math.round((deliveredCount / totalQuantity) * 100)))
        : 0;

    return {
      orderCode,
      isBuffOrder: true,
      status: stage,
      statusLabel: STAGE_LABELS[stage] || STAGE_LABELS.IN_PROGRESS,
      targetLink,
      totalQuantity,
      startCount,
      remains,
      deliveredCount,
      progressPercent,
      serviceName,
      providerName,
      serverOrderId,
      createdAt,
      lastUpdated,
    };
  } catch (error) {
    return {
      orderCode,
      isBuffOrder: true,
      status: "IN_PROGRESS",
      statusLabel: STAGE_LABELS.IN_PROGRESS,
      targetLink,
      totalQuantity,
      startCount: 0,
      remains: totalQuantity,
      deliveredCount: 0,
      progressPercent: 0,
      serviceName,
      providerName,
      serverOrderId,
      createdAt,
      lastUpdated,
    };
  }
}
