import { NextRequest, NextResponse } from "next/server";
import { prisma, CouponType } from "@/lib/prisma";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    return NextResponse.json({ coupons });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Không thể lấy danh sách mã giảm giá" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      type,
      value,
      minOrderValue = 0,
      maxDiscount = null,
      usageLimit = null,
      expiresAt = null,
      isActive = true,
    } = body || {};

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "Vui lòng nhập mã giảm giá" },
        { status: 400 }
      );
    }

    const normalizedCode = code.trim().toUpperCase();

    if (!value || typeof value !== "number" || value <= 0) {
      return NextResponse.json(
        { error: "Giá trị giảm giá phải lớn hơn 0" },
        { status: 400 }
      );
    }

    const couponType =
      type === CouponType.PERCENT ? CouponType.PERCENT : CouponType.FIXED;

    if (couponType === CouponType.PERCENT && value > 100) {
      return NextResponse.json(
        { error: "Mức giảm phần trăm không được vượt quá 100%" },
        { status: 400 }
      );
    }

    // Check unique code
    const existing = await prisma.coupon.findUnique({
      where: { code: normalizedCode },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Mã giảm giá "${normalizedCode}" đã tồn tại trên hệ thống` },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizedCode,
        type: couponType,
        value: Math.floor(value),
        minOrderValue: typeof minOrderValue === "number" && minOrderValue > 0 ? Math.floor(minOrderValue) : 0,
        maxDiscount: typeof maxDiscount === "number" && maxDiscount > 0 ? Math.floor(maxDiscount) : null,
        usageLimit: typeof usageLimit === "number" && usageLimit > 0 ? Math.floor(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, coupon }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Lỗi khi tạo mã giảm giá" },
      { status: 500 }
    );
  }
}
