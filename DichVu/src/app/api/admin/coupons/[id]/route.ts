import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Mã giảm giá không tồn tại" },
        { status: 404 }
      );
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: {
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        usageLimit: body.usageLimit !== undefined ? body.usageLimit : undefined,
        expiresAt: body.expiresAt !== undefined ? (body.expiresAt ? new Date(body.expiresAt) : null) : undefined,
      },
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi khi cập nhật mã giảm giá" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Mã giảm giá không tồn tại" },
        { status: 404 }
      );
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi khi xóa mã giảm giá" },
      { status: 500 }
    );
  }
}
