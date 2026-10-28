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
  currentCount?: number;
  targetCount?: number;
  serviceName?: string;
  providerName?: string;
  serverOrderId?: string;
  createdAt?: string;
  lastUpdated?: string;
  error?: string;
}

export const STAGE_LABELS: Record<BuffStage, string> = {
  RECEIVED: "Đang tiếp nhận đơn",
  INITIALIZING: "Đang kết nối & quét số gốc",
  IN_PROGRESS: "Đang tăng tương tác",
  COMPLETED: "Đã hoàn thành 100%",
  PARTIAL: "Hoàn tất một phần (Đã hoàn lại phần chưa chạy)",
  CANCELLED: "Đã hủy đơn",
  FAILED: "Lỗi kết nối máy chủ",
};

/**
 * Accurately calculate stage, delivered count, remains, and progress percent
 * based on upstream supplier truth without premature 100% false completions.
 */
export function computeBuffMetrics(params: {
  totalQuantity: number;
  rawStatus?: string;
  serverStartCount?: number;
  serverRemains?: number;
}): {
  stage: BuffStage;
  startCount: number;
  remains: number;
  deliveredCount: number;
  progressPercent: number;
  currentCount?: number;
  targetCount?: number;
} {
  const { totalQuantity, rawStatus = "", serverStartCount, serverRemains } = params;
  const normStatus = rawStatus.toUpperCase().trim();
  const safeTotal = Math.max(1, totalQuantity);
  const startCount =
    serverStartCount !== undefined && !isNaN(serverStartCount) && serverStartCount > 0
      ? serverStartCount
      : 0;

  // 1. Order is COMPLETED
  if (normStatus === "COMPLETED" || normStatus === "SUCCESS") {
    return {
      stage: "COMPLETED",
      startCount,
      remains: 0,
      deliveredCount: safeTotal,
      progressPercent: 100,
      currentCount: startCount > 0 ? startCount + safeTotal : undefined,
      targetCount: startCount > 0 ? startCount + safeTotal : undefined,
    };
  }

  // 2. Order is CANCELLED
  if (normStatus === "CANCELLED" || normStatus === "CANCELED") {
    return {
      stage: "CANCELLED",
      startCount,
      remains: safeTotal,
      deliveredCount: 0,
      progressPercent: 0,
      currentCount: startCount > 0 ? startCount : undefined,
      targetCount: startCount > 0 ? startCount + safeTotal : undefined,
    };
  }

  // 3. Order is PENDING or INITIALIZING
  // Note: SMM panels (e.g. HackTim) return remains: 0 and start_count: 0 while queued/Pending.
  // This must NEVER evaluate to 100% delivered!
  if (normStatus === "PENDING" || normStatus === "INITIALIZING" || normStatus === "WAITING") {
    return {
      stage: "INITIALIZING",
      startCount: 0,
      remains: safeTotal,
      deliveredCount: 0,
      progressPercent: 0,
      currentCount: undefined,
      targetCount: undefined,
    };
  }

  // 4. Order is PARTIAL
  if (normStatus === "PARTIAL") {
    const remains =
      serverRemains !== undefined && !isNaN(serverRemains)
        ? Math.min(safeTotal, Math.max(0, serverRemains))
        : 0;
    const deliveredCount = Math.max(0, Math.min(safeTotal, safeTotal - remains));
    const progressPercent = Math.min(
      100,
      Math.max(0, Math.round((deliveredCount / safeTotal) * 100))
    );
    return {
      stage: "PARTIAL",
      startCount,
      remains,
      deliveredCount,
      progressPercent,
      currentCount: startCount > 0 ? startCount + deliveredCount : undefined,
      targetCount: startCount > 0 ? startCount + safeTotal : undefined,
    };
  }

  // 5. Order is IN_PROGRESS / PROCESSING
  // Case A: supplier has non-zero remains reported
  if (serverRemains !== undefined && !isNaN(serverRemains) && serverRemains > 0) {
    const remains = Math.min(safeTotal, Math.max(0, serverRemains));
    const deliveredCount = Math.max(0, Math.min(safeTotal, safeTotal - remains));
    const progressPercent = Math.min(
      99,
      Math.max(0, Math.round((deliveredCount / safeTotal) * 100))
    );
    return {
      stage: "IN_PROGRESS",
      startCount,
      remains,
      deliveredCount,
      progressPercent,
      currentCount: startCount > 0 ? startCount + deliveredCount : undefined,
      targetCount: startCount > 0 ? startCount + safeTotal : undefined,
    };
  }

  // Case B: serverRemains is 0 or undefined, but not completed yet
  // If startCount has not been scanned yet, it is still queued/initializing
  if (startCount === 0) {
    return {
      stage: "INITIALIZING",
      startCount: 0,
      remains: safeTotal,
      deliveredCount: 0,
      progressPercent: 0,
      currentCount: undefined,
      targetCount: undefined,
    };
  }

  // Case C: startCount > 0 and serverRemains is 0, but status is IN_PROGRESS
  // Delivery is practically finished, capping at 99% until status flips to COMPLETED
  return {
    stage: "IN_PROGRESS",
    startCount,
    remains: 0,
    deliveredCount: safeTotal,
    progressPercent: 99,
    currentCount: startCount + safeTotal,
    targetCount: startCount + safeTotal,
  };
}

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

    const metrics = computeBuffMetrics({
      totalQuantity,
      rawStatus: statusRes.status || statusRes.rawStatus || "",
      serverStartCount: statusRes.startCount,
      serverRemains: statusRes.remains,
    });

    return {
      orderCode,
      isBuffOrder: true,
      status: metrics.stage,
      statusLabel: STAGE_LABELS[metrics.stage] || STAGE_LABELS.IN_PROGRESS,
      targetLink,
      totalQuantity,
      startCount: metrics.startCount,
      remains: metrics.remains,
      deliveredCount: metrics.deliveredCount,
      progressPercent: metrics.progressPercent,
      currentCount: metrics.currentCount,
      targetCount: metrics.targetCount,
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
