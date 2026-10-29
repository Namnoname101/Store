import { NextRequest, NextResponse } from "next/server";
import { prisma, ItemStatus, UpstreamStatus, OrderStatus } from "@/lib/prisma";

interface RouteParams {
  params: {
    orderId: string;
  } | Promise<{
    orderId: string;
  }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { orderId } = await Promise.resolve(params);
    const body = await req.json().catch(() => ({}));
    const { secrets, note } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã định danh đơn hàng (orderId)" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderCode: orderId }],
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        deliveredItems: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy đơn hàng trong hệ thống" },
        { status: 404 }
      );
    }

    // Parse secrets list (supports array or newline-separated string)
    let secretList: string[] = [];
    if (Array.isArray(secrets)) {
      secretList = secrets.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof secrets === "string") {
      secretList = secrets
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (secretList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng nhập ít nhất 1 mã bản quyền hoặc tài khoản bàn giao cho khách",
        },
        { status: 400 }
      );
    }

    const primaryProductId = order.orderItems[0]?.productId;
    if (!primaryProductId) {
      return NextResponse.json(
        { success: false, error: "Đơn hàng không chứa sản phẩm hợp lệ để bàn giao" },
        { status: 400 }
      );
    }

    // Atomic transaction: create ProductItems and mark order as COMPLETED
    await prisma.$transaction(async (tx) => {
      // 1. Insert ProductItems as SOLD
      await tx.productItem.createMany({
        data: secretList.map((secretContent) => ({
          productId: primaryProductId,
          secretContent,
          status: ItemStatus.SOLD,
          orderId: order.id,
        })),
      });

      // 2. Mark order as PAID & upstreamStatus as COMPLETED
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.PAID,
          paidAt: order.paidAt || new Date(),
          upstreamStatus: UpstreamStatus.COMPLETED,
          upstreamError: null,
          reconciliationNote: note
            ? `[Cấp thủ công]: ${note}`
            : order.reconciliationNote || "[Cấp thủ công bởi Quản trị viên]",
        },
      });

      // 3. Create AuditLog entry
      await tx.auditLog
        .create({
          data: {
            action: "MANUAL_FULFILLMENT",
            entityType: "ORDER",
            entityId: order.id,
            details: JSON.stringify({
              orderCode: order.orderCode,
              itemCount: secretList.length,
              note: note || "Cấp hàng thủ công từ Admin",
            }),
            performedBy: "ADMIN",
          },
        })
        .catch(() => {});
    });

    // 4. Fetch refreshed order with newly delivered items
    const refreshedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                type: true,
              },
            },
          },
        },
        deliveredItems: true,
        transactions: true,
      },
    });

    return NextResponse.json({
      success: true,
      order: refreshedOrder,
      itemsDelivered: secretList.length,
      message: `Đã bàn giao thành công ${secretList.length} mã/tài khoản cho đơn hàng #${order.orderCode}!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Đã xảy ra lỗi khi cấp hàng thủ công",
      },
      { status: 500 }
    );
  }
}
