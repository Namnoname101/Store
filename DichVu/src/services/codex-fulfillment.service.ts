import prisma from "@/lib/prisma";
import { ItemStatus, UpstreamStatus } from "@/lib/prisma";
import { ModelApiService } from "@/services/modelapi/modelapi.service";
import { computeKeyFingerprint, maskApiKey } from "@/lib/key-security";

export interface CodexFulfillmentResult {
  success: boolean;
  status: string;
  discrepancyDelta?: number;
  deliveredKey?: string;
  error?: string;
}

/**
 * Checks if a product or order is related to Codex.
 */
export function isCodexProduct(product?: {
  slug?: string | null;
  title?: string | null;
  type?: string | null;
} | null): boolean {
  if (!product) return false;
  const slug = (product.slug || "").toLowerCase();
  const title = (product.title || "").toLowerCase();
  const type = product.type || "";
  return (
    type === "CODEX_CREDIT" ||
    slug.includes("codex") ||
    slug.includes("cdx") ||
    title.includes("codex")
  );
}

/**
 * Fulfills a Codex Credit / API Key order automatically via ModelAPI.
 * - If customer has an existing API key: adds purchased quota directly to that key.
 * - If customer does not have a key: auto-creates a new key on ModelAPI with quota and delivers it.
 * - Idempotent, serialized via mutex & atomic DB state transitions.
 */
export async function fulfillCodexCreditOrder(
  orderId: string
): Promise<CodexFulfillmentResult> {
  // 1. Check if CreditTopupOrder exists
  let topupOrder = await prisma.creditTopupOrder.findUnique({
    where: { orderId },
    include: {
      binding: true,
      order: {
        include: {
          orderItems: {
            include: { product: true },
          },
        },
      },
    },
  });

  // If no CreditTopupOrder yet, check if this is an order for a Codex product from catalog
  if (!topupOrder) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        status: "SKIPPED",
        error: "Order not found",
      };
    }

    const codexItem = order.orderItems.find((item) =>
      isCodexProduct(item.product)
    );

    if (!codexItem || !codexItem.product) {
      return {
        success: false,
        status: "SKIPPED",
        error: "Not a codex order",
      };
    }

    // Determine creditUsd from product title / slug (e.g. "10$ Credit" -> 10, "50$ Credit" -> 50)
    let creditUsd = 10;
    const match = codexItem.product.title.match(/(\d+)\s*\$\s*Credit/i) ||
      codexItem.product.slug.match(/(\d+)(?:-credit|usd)/i);
    if (match && match[1]) {
      creditUsd = Number(match[1]);
    }

    const quotaUnits = ModelApiService.usdToQuota(creditUsd);

    // Check if customer provided their existing API key in customerNote
    const customerKeyMatch = (order.customerNote || "").match(/sk-[a-zA-Z0-9_\-]{10,}/);
    let resolvedBindingId: string | null = null;

    if (customerKeyMatch) {
      const providedKey = customerKeyMatch[0].trim();
      const verifyRes = await ModelApiService.verifyCustomerKey(providedKey);
      if (verifyRes.valid && verifyRes.tokenId) {
        const fp = computeKeyFingerprint(providedKey);
        let binding = await prisma.customerApiKeyBinding.findUnique({
          where: { keyFingerprint: fp },
        });
        if (!binding) {
          binding = await prisma.customerApiKeyBinding.create({
            data: {
              upstreamTokenId: verifyRes.tokenId,
              keyFingerprint: fp,
              maskedKey: maskApiKey(providedKey),
              keyName: verifyRes.name || "API Key của bạn",
              userId: order.userId || null,
              guestEmail: order.customerEmail || null,
              status: "ACTIVE",
              lastSyncedAt: new Date(),
            },
          });
        }
        resolvedBindingId = binding.id;
      }
    }

    // If still no binding, customer requested a brand new key -> create on ModelAPI
    let deliveredRawKey: string | null = null;
    if (!resolvedBindingId) {
      const createRes = await ModelApiService.createCustomerKey({
        creditUsd,
        guestEmail: order.customerEmail,
        userId: order.userId,
        name: `DaiTruong_${order.orderCode}`,
      });

      if (!createRes.success || !createRes.bindingId || !createRes.key) {
        const errorMsg = createRes.error || "Không thể tự động khởi tạo API Key Codex mới";
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

      resolvedBindingId = createRes.bindingId;
      deliveredRawKey = createRes.key;
    }

    // Create linked CreditTopupOrder
    topupOrder = await prisma.creditTopupOrder.create({
      data: {
        orderId,
        bindingId: resolvedBindingId,
        creditUsd,
        quotaUnits,
        status: deliveredRawKey ? "COMPLETED" : "PENDING",
        completedAt: deliveredRawKey ? new Date() : null,
      },
      include: {
        binding: true,
        order: {
          include: {
            orderItems: {
              include: { product: true },
            },
          },
        },
      },
    });

    // If new key was created, record delivery and complete order
    if (deliveredRawKey) {
      const secretContent = `🎉 API Key mới của bạn đã được khởi tạo thành công!

• API Key: ${deliveredRawKey}
• Hạn mức ban đầu: $${creditUsd} (${quotaUnits.toLocaleString("vi-VN")} Quota Points)
• Base URL: https://modelapi.vn/v1

📖 Hướng dẫn kết nối nhanh vào Cursor IDE:
1. Mở Cursor > Cài đặt (Settings) > Models
2. Bật công tắc "OpenAI Compatible"
3. Điền Base URL: https://modelapi.vn/v1
4. Dán API Key ở trên và bắt đầu sử dụng!`;

      await prisma.productItem.create({
        data: {
          productId: codexItem.productId,
          secretContent,
          status: ItemStatus.SOLD,
          orderId,
        },
      });

      await prisma.order.update({
        where: { id: orderId },
        data: {
          upstreamStatus: UpstreamStatus.COMPLETED,
          upstreamError: null,
        },
      });

      return {
        success: true,
        status: "COMPLETED",
        deliveredKey: deliveredRawKey,
      };
    }
  }

  // 2. State transition: PENDING or RECONCILE_REQUIRED -> PROCESSING
  const lockResult = await prisma.creditTopupOrder.updateMany({
    where: {
      orderId,
      status: { in: ["PENDING", "RECONCILE_REQUIRED"] },
    },
    data: {
      status: "PROCESSING",
    },
  });

  if (lockResult.count === 0 && topupOrder.status !== "PROCESSING") {
    return {
      success: topupOrder.status === "COMPLETED",
      status: topupOrder.status,
      error:
        topupOrder.status === "COMPLETED"
          ? undefined
          : `Order is already in ${topupOrder.status} status`,
    };
  }

  // 3. Topup quota to existing key via ModelApiService.applyQuotaTopup
  if (!topupOrder.binding) {
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
            secretContent: `✅ Đã nạp thành công $${topupOrder.creditUsd} vào API Key: ${topupOrder.binding.maskedKey} (+${topupOrder.quotaUnits.toLocaleString("vi-VN")} quota points). Bạn có thể tiếp tục sử dụng ngay!`,
            status: ItemStatus.SOLD,
            orderId: orderId,
          },
        });
      }

      return {
        success: true,
        status: "COMPLETED",
        discrepancyDelta: topupResult.discrepancyDelta,
      };
    } else {
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
