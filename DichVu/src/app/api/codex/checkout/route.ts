import { NextRequest, NextResponse } from "next/server";
import prisma, { OrderStatus, TopupStatus } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/key-security";
import { generateOrderCode, generateVietQrUrl } from "@/lib/vietqr";
import { validateCoupon } from "@/services/coupon.service";
import { createPaymentIntentForOrder } from "@/services/payment-intent.service";

import { CODEX_PACKAGES, CodexPackage } from "@/lib/codex.constants";

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Dữ liệu JSON không hợp lệ" },
        { status: 400 }
      );
    }

    const { bindingId, packageId, email, customerNote, couponCode } = body || {};

    if (!bindingId || typeof bindingId !== "string") {
      return NextResponse.json(
        { error: "Vui lòng chọn hoặc kiểm tra API Key hợp lệ" },
        { status: 400 }
      );
    }

    // 1. Verify CustomerApiKeyBinding
    const binding = await prisma.customerApiKeyBinding.findUnique({
      where: { id: bindingId },
    });

    if (!binding) {
      return NextResponse.json(
        { error: "API Key chưa được xác minh hoặc không tồn tại trong hệ thống" },
        { status: 404 }
      );
    }

    // 2. Verify selected package
    const selectedPkg = CODEX_PACKAGES.find((p) => p.id === packageId);
    if (!selectedPkg) {
      return NextResponse.json(
        { error: "Vui lòng chọn gói nạp Codex Credit hợp lệ" },
        { status: 400 }
      );
    }

    // 3. User session check
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.userId || binding.userId || null;

    // 4. Find or ensure Category & Product exists
    let category = await prisma.category.findFirst({
      where: { slug: "codex-credit" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Codex Credit",
          slug: "codex-credit",
        },
      });
    }

    const productSlug = `codex-credit-${selectedPkg.creditUsd}usd`;
    let product = await prisma.product.findUnique({
      where: { slug: productSlug },
    });

    if (!product) {
      product = await prisma.product.create({
        data: {
          title: selectedPkg.title,
          slug: productSlug,
          description: selectedPkg.description,
          price: selectedPkg.priceVnd,
          type: "CODEX_CREDIT",
          fulfillmentType: "API_DROPSHIP",
          categoryId: category.id,
        },
      });
    }

    // 5. Calculate pricing and coupons
    const subtotalAmount = selectedPkg.priceVnd;
    let discountAmount = 0;
    let couponId: string | null = null;

    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      try {
        const validation = await validateCoupon(couponCode.trim(), subtotalAmount);
        if (validation.valid && validation.coupon) {
          discountAmount = validation.discountAmount;
          couponId = validation.coupon.id;
        }
      } catch {
        // Ignore invalid coupon, continue with subtotal
      }
    }

    const totalAmount = Math.max(1000, subtotalAmount - discountAmount);

    // 6. Generate unique orderCode
    let orderCode = "";
    let isUnique = false;
    while (!isUnique) {
      orderCode = generateOrderCode();
      const existing = await prisma.order.findUnique({
        where: { orderCode },
        select: { id: true },
      });
      if (!existing) isUnique = true;
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // 7. Atomic Order Creation
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderCode,
          customerEmail: email ? email.trim() : binding.guestEmail || null,
          customerNote: customerNote ? customerNote.trim() : null,
          userId,
          totalAmount,
          subtotalAmount,
          discountAmount,
          couponId,
          status: OrderStatus.PENDING,
          paymentMethod: "VIETQR",
          expiresAt,
          orderItems: {
            create: [
              {
                productId: product.id,
                price: selectedPkg.priceVnd,
                quantity: 1,
              },
            ],
          },
        },
      });

      // Create linked CreditTopupOrder
      await tx.creditTopupOrder.create({
        data: {
          orderId: createdOrder.id,
          bindingId: binding.id,
          creditUsd: selectedPkg.creditUsd,
          quotaUnits: selectedPkg.quotaUnits,
          status: TopupStatus.PENDING,
        },
      });

      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Create active PaymentIntent for order so webhook and expiration tracking works
      await createPaymentIntentForOrder(createdOrder.id, createdOrder.totalAmount, tx);

      return createdOrder;
    });

    // 8. Generate VietQR Link
    const bankId =
      process.env.BANK_ID ||
      process.env.VIETQR_BANK_ID ||
      process.env.NEXT_PUBLIC_VIETQR_BANK_ID ||
      "TPB";
    const bankAccountNo =
      process.env.BANK_ACCOUNT_NO ||
      process.env.VIETQR_ACCOUNT_NO ||
      process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO ||
      "93320022006";

    const vietQrUrl = generateVietQrUrl(
      bankId,
      bankAccountNo,
      totalAmount,
      order.orderCode,
      "compact2"
    );

    return NextResponse.json(
      {
        success: true,
        orderCode: order.orderCode,
        totalAmount,
        creditUsd: selectedPkg.creditUsd,
        quotaUnits: selectedPkg.quotaUnits,
        vietQrUrl,
        expiresAt: order.expiresAt,
        binding: {
          maskedKey: binding.maskedKey,
          keyName: binding.keyName,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[POST /api/codex/checkout Error]:", err);
    return NextResponse.json(
      { error: err.message || "Lỗi máy chủ khi tạo đơn nạp Codex Credit" },
      { status: 500 }
    );
  }
}
