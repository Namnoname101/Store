import { NextRequest, NextResponse } from "next/server";
import prisma, { OrderStatus, TopupStatus } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/key-security";
import { generateOrderCode, generateVietQrUrl } from "@/lib/vietqr";
import { validateCoupon } from "@/services/coupon.service";

export interface CodexPackage {
  id: string;
  title: string;
  creditUsd: number;
  quotaUnits: number;
  priceVnd: number;
  badge?: string;
  popular?: boolean;
  description: string;
}

export const CODEX_PACKAGES: CodexPackage[] = [
  {
    id: "codex-5",
    title: "Gói Codex $5 Credit",
    creditUsd: 5,
    quotaUnits: 2500000,
    priceVnd: 125000,
    badge: "Thử nghiệm",
    popular: false,
    description: "2.500.000 Quota Points — Thích hợp dùng thử hoặc dự án cá nhân nhỏ",
  },
  {
    id: "codex-10",
    title: "Gói Codex $10 Credit",
    creditUsd: 10,
    quotaUnits: 5000000,
    priceVnd: 245000,
    badge: "Phổ biến nhất",
    popular: true,
    description: "5.000.000 Quota Points — Tối ưu cho lập trình viên và Cursor / Claude Code",
  },
  {
    id: "codex-20",
    title: "Gói Codex $20 Credit",
    creditUsd: 20,
    quotaUnits: 10000000,
    priceVnd: 485000,
    badge: "Tiết kiệm",
    popular: false,
    description: "10.000.000 Quota Points — Nạp số lượng lớn cho team nhỏ",
  },
  {
    id: "codex-50",
    title: "Gói Codex $50 Credit",
    creditUsd: 50,
    quotaUnits: 25000000,
    priceVnd: 1200000,
    badge: "Chuyên nghiệp",
    popular: false,
    description: "25.000.000 Quota Points — Tiết kiệm chi phí vận hành cho Agent & Bot",
  },
  {
    id: "codex-100",
    title: "Gói Codex $100 Credit",
    creditUsd: 100,
    quotaUnits: 50000000,
    priceVnd: 2350000,
    badge: "Doanh nghiệp",
    popular: false,
    description: "50.000.000 Quota Points — Dành cho hệ thống Production tải cao",
  },
];

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

      return createdOrder;
    });

    // 8. Generate VietQR Link
    const bankId =
      process.env.VIETQR_BANK_ID ||
      process.env.NEXT_PUBLIC_VIETQR_BANK_ID ||
      "MB";
    const bankAccountNo =
      process.env.VIETQR_ACCOUNT_NO ||
      process.env.NEXT_PUBLIC_VIETQR_ACCOUNT_NO ||
      "0000000000";

    const vietQrUrl = generateVietQrUrl(
      bankId,
      bankAccountNo,
      totalAmount,
      order.orderCode
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
