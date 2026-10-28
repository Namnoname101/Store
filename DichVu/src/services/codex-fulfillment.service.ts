import prisma from "@/lib/prisma";
import { ItemStatus, UpstreamStatus, SupplierType } from "@/lib/prisma";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { GENZSHOP_CODEX_MAPPING } from "@/lib/codex.constants";
import { getSupplierAdapter } from "@/services/suppliers/adapter.registry";

export interface CodexFulfillmentResult {
  success: boolean;
  status: string;
  discrepancyDelta?: number;
  error?: string;
}

/**
 * Fulfills a Codex Credit Topup order idempotently.
 * Serialized via in-process mutex and atomic DB status transitions.
 */
export async function fulfillCodexCreditOrder(
  orderId: string
): Promise<CodexFulfillmentResult> {
  // 1. Atomic state transition: PENDING or RECONCILE_REQUIRED -> PROCESSING
  const lockResult = await prisma.creditTopupOrder.updateMany({
    where: {
      orderId,
      status: { in: ["PENDING", "RECONCILE_REQUIRED"] },
    },
    data: {
      status: "PROCESSING",
    },
  });

  if (lockResult.count === 0) {
    const existing = await prisma.creditTopupOrder.findUnique({
      where: { orderId },
    });
    if (!existing) {
      return {
        success: false,
        status: "SKIPPED",
        error: "Not a codex credit order",
      };
    }
    return {
      success: existing.status === "COMPLETED",
      status: existing.status,
      error:
        existing.status === "COMPLETED"
          ? undefined
          : `Order is already in ${existing.status} status`,
    };
  }

  // 2. Fetch full topup order with binding and order items
  const topupOrder = await prisma.creditTopupOrder.findUnique({
    where: { orderId },
    include: {
      binding: true,
      order: {
        include: {
          orderItems: true,
        },
      },
    },
  });

  if (!topupOrder || !topupOrder.binding) {
    const errorMsg = "Customer API key binding not found for order";
    await prisma.creditTopupOrder.update({
      where: { orderId },
      data: { status: "FAILED", errorMessage: errorMsg },
    });
    await prisma.order.update({
      where: { id: orderId },
      data: { upstreamStatus: UpstreamStatus.FAILED, upstreamError: errorMsg },
    });
    return {
      success: false,
      status: "FAILED",
      error: errorMsg,
    };
  }

  // 3. Purchase replenishment card from GenzShop and redeem into ModelAPI master account
  const genzProductCode = GENZSHOP_CODEX_MAPPING[topupOrder.creditUsd];
  let genzRedemptionCode: string | null = null;

  if (genzProductCode) {
    try {
      const genzSupplier = await prisma.supplier.findFirst({
        where: {
          type: SupplierType.GENZSHOP,
          isActive: true,
        },
      });

      if (genzSupplier && genzSupplier.apiKey) {
        const adapter = getSupplierAdapter(SupplierType.GENZSHOP);
        const buyResult = await adapter.buyProduct(
          {
            baseUrl: genzSupplier.baseUrl,
            apiKey: genzSupplier.apiKey,
          },
          genzProductCode,
          1,
          topupOrder.order?.orderCode || `CODEX_${orderId}`
        );

        if (buyResult.success && buyResult.deliveredKeys?.length > 0) {
          genzRedemptionCode = buyResult.deliveredKeys[0];
          const redeemRes = await ModelApiService.redeemMasterAccount(genzRedemptionCode);
          if (!redeemRes.success) {
            console.warn(
              `[CodexFulfillment] Redeeming GenzShop card ${genzRedemptionCode} into ModelAPI master account returned:`,
              redeemRes.message
            );
          }
        } else {
          console.warn(
            `[CodexFulfillment] GenzShop purchase failed for ${genzProductCode}:`,
            buyResult.error
          );
        }
      }
    } catch (genzErr: any) {
      console.warn(`[CodexFulfillment] Error in GenzShop replenishment pipeline:`, genzErr.message);
    }
  }

  // 4. Call ModelApiService.applyQuotaTopup to allocate quota to customer key
  try {
    const topupResult = await ModelApiService.applyQuotaTopup({
      bindingId: topupOrder.bindingId,
      orderId: topupOrder.orderId,
      creditUsd: topupOrder.creditUsd,
      upstreamTokenId: topupOrder.binding.upstreamTokenId,
      performedBy: "SYSTEM",
    });

    if (topupResult.success) {
      await prisma.creditTopupOrder.update({
        where: { id: topupOrder.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          errorMessage: null,
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          upstreamStatus: UpstreamStatus.COMPLETED,
          upstreamError: null,
        },
      });

      // Record delivered ProductItem for customer view
      const firstProductId = topupOrder.order?.orderItems?.[0]?.productId;
      if (firstProductId) {
        await prisma.productItem.create({
          data: {
            productId: firstProductId,
            secretContent: `Đã nạp thành công $${topupOrder.creditUsd} vào API Key: ${topupOrder.binding.maskedKey} (+${topupOrder.quotaUnits.toLocaleString()} quota points)`,
            status: ItemStatus.SOLD,
            orderId: orderId,
          },
        });

        // Decrement supplierStock if mapping exists
        try {
          const mapping = await prisma.supplierProductMapping.findUnique({
            where: { productId: firstProductId },
            select: { id: true, supplierStock: true },
          });
          if (mapping && mapping.supplierStock > 0) {
            await prisma.supplierProductMapping.update({
              where: { id: mapping.id },
              data: {
                supplierStock: Math.max(0, mapping.supplierStock - 1),
              },
            });
          }
        } catch (stockErr) {
          console.warn(`Failed to decrement supplierStock for codex product ${firstProductId}:`, stockErr);
        }
      }

      return {
        success: true,
        status: "COMPLETED",
        discrepancyDelta: topupResult.discrepancyDelta,
      };
    } else {
      // Upstream failure or reconcile required
      const finalStatus = "RECONCILE_REQUIRED";

      await prisma.creditTopupOrder.update({
        where: { id: topupOrder.id },
        data: {
          status: finalStatus,
          errorMessage: topupResult.error,
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          upstreamStatus: UpstreamStatus.FAILED,
          upstreamError: topupResult.error,
        },
      });

      // Audit Log for Owner / Admin investigation
      await prisma.auditLog
        .create({
          data: {
            action: "CODEX_TOPUP_FAILED",
            entityType: "ORDER",
            entityId: orderId,
            details: JSON.stringify({
              status: finalStatus,
              error: topupResult.error,
              topupOrderId: topupOrder.id,
              discrepancyDelta: topupResult.discrepancyDelta,
            }),
            performedBy: "SYSTEM",
          },
        })
        .catch(() => {});

      return {
        success: false,
        status: finalStatus,
        error: topupResult.error,
        discrepancyDelta: topupResult.discrepancyDelta,
      };
    }
  } catch (err: any) {
    const errorMsg = err?.message || "Unexpected error during topup fulfillment";
    await prisma.creditTopupOrder.update({
      where: { id: topupOrder.id },
      data: {
        status: "FAILED",
        errorMessage: errorMsg,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        upstreamStatus: UpstreamStatus.FAILED,
        upstreamError: errorMsg,
      },
    });

    return {
      success: false,
      status: "FAILED",
      error: errorMsg,
    };
  }
}

/**
 * Retries a failed or reconcile-required Codex Credit order.
 */
export async function retryCodexCreditOrder(
  orderId: string,
  performedBy: string = "OWNER"
): Promise<CodexFulfillmentResult> {
  const resetResult = await prisma.creditTopupOrder.updateMany({
    where: {
      orderId,
      status: { in: ["FAILED", "RECONCILE_REQUIRED"] },
    },
    data: {
      status: "PENDING",
      retryCount: { increment: 1 },
    },
  });

  if (resetResult.count === 0) {
    const existing = await prisma.creditTopupOrder.findUnique({
      where: { orderId },
    });
    if (!existing) {
      return {
        success: false,
        status: "SKIPPED",
        error: "Not a codex credit order",
      };
    }
    return {
      success: existing.status === "COMPLETED",
      status: existing.status,
      error: `Cannot retry order in ${existing.status} status`,
    };
  }

  return fulfillCodexCreditOrder(orderId);
}
