import { prisma, ItemStatus, FulfillmentType } from "@/lib/prisma";
import type { ProductItem } from "@prisma/client";

/**
 * Retries a database operation on transient lock/write conflicts (e.g. SQLite busy or P2034)
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  baseDelayMs = 50
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const isConflict =
        error?.code === "P2034" ||
        error?.code === "P2028" ||
        (typeof error?.message === "string" &&
          (error.message.includes("database is locked") ||
            error.message.includes("write conflict") ||
            error.message.includes("Transaction failed")));

      if (isConflict && attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 25)
        );
        continue;
      }
      throw error;
    }
  }
}

/**
 * Reserves available items for a specific order.
 * Prevents race conditions and double-selling using transactions and optimistic status locking.
 *
 * @param productId The ID of the product to reserve
 * @param quantity The number of items to reserve
 * @param orderId The ID of the order making the reservation
 * @param durationMinutes The reservation expiration window in minutes (defaults to 15)
 * @returns Array of reserved ProductItem records
 */
export async function reserveItemsForOrder(
  productId: string,
  quantity: number,
  orderId: string,
  durationMinutes: number = 15,
  txClient?: any
): Promise<ProductItem[]> {
  if (quantity <= 0) {
    throw new Error("Insufficient stock available");
  }

  const execute = async (tx: any) => {
    // Query top available items
    const availableItems = await tx.productItem.findMany({
      where: {
        productId,
        status: ItemStatus.AVAILABLE,
      },
      take: quantity,
      orderBy: { createdAt: "asc" },
    });

    if (availableItems.length < quantity) {
      throw new Error("Insufficient stock available");
    }

    const itemIds = availableItems.map((item: any) => item.id);
    const reservedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

    // Atomic update with status guard to protect against concurrent updates
    const updateResult = await tx.productItem.updateMany({
      where: {
        id: { in: itemIds },
        status: ItemStatus.AVAILABLE,
      },
      data: {
        status: ItemStatus.RESERVED,
        orderId,
        reservedUntil,
      },
    });

    if (updateResult.count < quantity) {
      throw new Error("Insufficient stock available");
    }

    return await tx.productItem.findMany({
      where: {
        id: { in: itemIds },
        orderId,
        status: ItemStatus.RESERVED,
      },
    });
  };

  if (txClient) {
    return await execute(txClient);
  }

  return await withRetry(async () => {
    return await prisma.$transaction(
      async (tx) => {
        return await execute(tx);
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );
  });
}

/**
 * Releases expired reservations back to AVAILABLE status.
 *
 * @returns Number of items released
 */
export async function releaseExpiredReservations(): Promise<number> {
  const now = new Date();
  const result = await prisma.productItem.updateMany({
    where: {
      status: ItemStatus.RESERVED,
      reservedUntil: {
        lt: now,
      },
    },
    data: {
      status: ItemStatus.AVAILABLE,
      orderId: null,
      reservedUntil: null,
    },
  });

  return result.count;
}

/**
 * Commits reserved items for an order to SOLD status when payment is confirmed.
 *
 * @param orderId The order ID whose reserved items should be committed
 * @returns Array of sold ProductItem records
 */
export async function commitReservedItemsToSold(
  orderId: string,
  txClient?: any
): Promise<ProductItem[]> {
  const execute = async (tx: any) => {
    const reservedItems = await tx.productItem.findMany({
      where: {
        orderId,
        status: ItemStatus.RESERVED,
      },
    });

    if (reservedItems.length === 0) {
      return [];
    }

    const itemIds = reservedItems.map((item: any) => item.id);

    await tx.productItem.updateMany({
      where: {
        id: { in: itemIds },
        status: ItemStatus.RESERVED,
      },
      data: {
        status: ItemStatus.SOLD,
        reservedUntil: null,
      },
    });

    return await tx.productItem.findMany({
      where: {
        id: { in: itemIds },
      },
    });
  };

  if (txClient) {
    return await execute(txClient);
  }

  return await withRetry(async () => {
    return await prisma.$transaction(async (tx) => {
      return await execute(tx);
    });
  });
}

/**
 * Gets the current available stock count for a product.
 * Returns live supplier stock for dropship items, or available local inventory for stock items.
 *
 * @param productId The ID of the product
 * @returns Available stock count
 */
export async function getAvailableStockCount(
  productId: string
): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      fulfillmentType: true,
      isActive: true,
      supplierMapping: {
        select: {
          supplierStock: true,
          supplier: {
            select: { isActive: true },
          },
        },
      },
    },
  });

  if (!product || !product.isActive) {
    return 0;
  }

  if (product.fulfillmentType === FulfillmentType.API_DROPSHIP) {
    if (!product.supplierMapping || !product.supplierMapping.supplier?.isActive) {
      return 0;
    }
    return Math.max(0, product.supplierMapping.supplierStock);
  }

  return await prisma.productItem.count({
    where: {
      productId,
      status: ItemStatus.AVAILABLE,
    },
  });
}
