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

  // Set status to PENDING_UPSTREAM while processing
  await prisma.order.update({
    where: { id: order.id },
    data: {
      upstreamStatus: UpstreamStatus.PENDING_UPSTREAM,
    },
  });

  let lastUpstreamOrderId: string | null = order.upstreamOrderId || null;
  let totalKeysDelivered = 0;

  for (const item of dropshipItems) {
    const mapping = item.product?.supplierMapping;
    if (!mapping || !mapping.supplier || !mapping.supplier.isActive) {
      const errorMsg = "Supplier mapping missing or inactive";
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

    try {
      const adapter = getSupplierAdapter(mapping.supplier.type);
      const purchaseResult = await adapter.buyProduct(
        {
          baseUrl: mapping.supplier.baseUrl,
          apiKey: mapping.supplier.apiKey,
          apiSecret: mapping.supplier.apiSecret,
        },
        mapping.supplierProductCode,
        quantityNeeded,
        order.orderCode
      );

      if (!purchaseResult.success) {
        const errorMsg = purchaseResult.error || "Upstream purchase failed";
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
          data: purchaseResult.deliveredKeys.map((key) => ({
            productId: item.productId,
            secretContent: key,
            status: ItemStatus.SOLD,
            orderId: order.id,
          })),
        });
        totalKeysDelivered += purchaseResult.deliveredKeys.length;
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Upstream purchase failed";
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
