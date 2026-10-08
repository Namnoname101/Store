import {
  prisma,
  OrderStatus,
  ItemStatus,
  FulfillmentType,
  UpstreamStatus,
} from "@/lib/prisma";
import { getSupplierAdapter } from "@/services/suppliers/adapter.registry";

export interface UpstreamFulfillmentResult {
  success: boolean;
  status: string;
  upstreamOrderId?: string | null;
  error?: string | null;
  itemsDelivered?: number;
}

/**
 * Fulfills dropship order items via configured upstream suppliers.
 *
 * @param orderId ID of the order to fulfill
 * @returns UpstreamFulfillmentResult
 */
export async function fulfillOrderViaUpstream(
  orderId: string
): Promise<UpstreamFulfillmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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
      success: false,
      status: UpstreamStatus.FAILED,
      error: `Order not found: ${orderId}`,
    };
  }

  if (order.status !== OrderStatus.PAID) {
    return {
      success: false,
      status: order.upstreamStatus,
      error: `Order ${order.orderCode} is not in PAID status (current: ${order.status})`,
    };
  }

  const dropshipItems = order.orderItems.filter(
    (item) => item.product?.fulfillmentType === FulfillmentType.API_DROPSHIP
  );

  if (dropshipItems.length === 0) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        upstreamStatus: UpstreamStatus.NOT_APPLICABLE,
      },
    });

    return {
      success: true,
      status: UpstreamStatus.NOT_APPLICABLE,
    };
  }

  // Concurrency lock: atomically transition to PENDING_UPSTREAM only if not already PENDING_UPSTREAM or COMPLETED
  const lockAcquired = await prisma.order.updateMany({
    where: {
      id: order.id,
      upstreamStatus: {
        notIn: [UpstreamStatus.PENDING_UPSTREAM, UpstreamStatus.COMPLETED],
      },
    },
    data: {
      upstreamStatus: UpstreamStatus.PENDING_UPSTREAM,
    },
  });

  if (lockAcquired.count === 0) {
    // Another worker is running or it was already completed
    const current = await prisma.order.findUnique({
      where: { id: order.id },
      select: { upstreamStatus: true, upstreamOrderId: true },
    });
    return {
      success: current?.upstreamStatus === UpstreamStatus.COMPLETED,
      status: current?.upstreamStatus || UpstreamStatus.PENDING_UPSTREAM,
      upstreamOrderId: current?.upstreamOrderId,
      error:
        current?.upstreamStatus === UpstreamStatus.PENDING_UPSTREAM
          ? "Đang có tiến trình giao hàng tự động khác xử lý đơn này."
          : undefined,
    };
  }

  let lastUpstreamOrderId: string | null = order.upstreamOrderId || null;
  let totalKeysDelivered = 0;
  const MAX_RETRIES = 3;

  for (const item of dropshipItems) {
    const mapping = item.product?.supplierMapping;
    if (!mapping || !mapping.supplier || !mapping.supplier.isActive) {
      const errorMsg = "Cần Chủ sở hữu xử lý: Cấu hình nhà cung cấp chưa khả dụng.";
      await prisma.order.update({
        where: { id: order.id },
        data: {
          upstreamStatus: UpstreamStatus.FAILED,
          upstreamError: errorMsg,
        },
      });

      return {
        success: false,
        status: UpstreamStatus.FAILED,
        error: errorMsg,
      };
    }

    // Check if this item was already delivered in a previous attempt (for retries)
    const alreadyFulfilledCount = await prisma.productItem.count({
      where: {
        orderId: order.id,
        productId: item.productId,
      },
    });

    const quantityNeeded = item.quantity - alreadyFulfilledCount;
    if (quantityNeeded <= 0) {
      continue;
    }

    // Extract item-specific targetLink, or customerNote, or order customerNote
    const targetLink =
      (item as any).targetLink ||
      (item as any).customerNote ||
      order.customerNote ||
      undefined;

    let purchaseResult: any = null;
    let lastError: string | null = null;
    const adapter = getSupplierAdapter(mapping.supplier.type);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        purchaseResult = await adapter.buyProduct(
          {
            baseUrl: mapping.supplier.baseUrl,
            apiKey: mapping.supplier.apiKey,
            apiSecret: mapping.supplier.apiSecret,
          },
          mapping.supplierProductCode,
          quantityNeeded,
          `${order.orderCode}_${item.id.slice(-4)}_${attempt}`,
          {
            link: targetLink,
            customerNote: (item as any).customerNote || order.customerNote || undefined,
          }
        );

        if (purchaseResult && purchaseResult.success) {
          lastError = null;
          break;
        }

        lastError = purchaseResult?.error || "Giao dịch không thành công";
      } catch (err: any) {
        lastError = err?.message || "Lỗi kết nối máy chủ cấp phát";
      }
    }

    if (!purchaseResult || !purchaseResult.success) {
      const errorMsg = `Cần Chủ sở hữu xử lý: ${lastError || "Lỗi cấp phát tự động"}`;
      await prisma.order.update({
        where: { id: order.id },
        data: {
          upstreamStatus: UpstreamStatus.FAILED,
          upstreamError: errorMsg,
        },
      });

      return {
        success: false,
        status: UpstreamStatus.FAILED,
        error: errorMsg,
      };
    }

    if (purchaseResult.upstreamOrderId) {
      lastUpstreamOrderId = purchaseResult.upstreamOrderId;
    }

    if (
      purchaseResult.deliveredKeys &&
      purchaseResult.deliveredKeys.length > 0
    ) {
      await prisma.productItem.createMany({
        data: purchaseResult.deliveredKeys.map((key: string) => ({
          productId: item.productId,
          secretContent: key,
          status: ItemStatus.SOLD,
          orderId: order.id,
        })),
      });
      totalKeysDelivered += purchaseResult.deliveredKeys.length;
    }
  }

  // Update order as COMPLETED
  await prisma.order.update({
    where: { id: order.id },
    data: {
      upstreamStatus: UpstreamStatus.COMPLETED,
      upstreamOrderId: lastUpstreamOrderId,
      upstreamError: null,
    },
  });

  return {
    success: true,
    status: UpstreamStatus.COMPLETED,
    upstreamOrderId: lastUpstreamOrderId,
    itemsDelivered: totalKeysDelivered,
  };
}

/**
 * Retries upstream fulfillment for an order that previously failed or remains pending.
 *
 * @param orderId ID of the order to retry
 * @returns UpstreamFulfillmentResult
 */
export async function retryUpstreamFulfillment(
  orderId: string
): Promise<UpstreamFulfillmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, upstreamStatus: true },
  });

  if (!order) {
    return {
      success: false,
      status: UpstreamStatus.FAILED,
      error: `Order not found: ${orderId}`,
    };
  }

  if (
    order.upstreamStatus !== UpstreamStatus.FAILED &&
    order.upstreamStatus !== UpstreamStatus.PENDING_UPSTREAM
  ) {
    return {
      success: false,
      status: order.upstreamStatus,
      error: `Order upstreamStatus is ${order.upstreamStatus}; only FAILED or PENDING_UPSTREAM orders can be retried`,
    };
  }

  return await fulfillOrderViaUpstream(orderId);
}
