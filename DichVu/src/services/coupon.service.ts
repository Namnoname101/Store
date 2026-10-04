import { prisma, CouponType } from "@/lib/prisma";
import type { Coupon } from "@prisma/client";

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  finalTotal: number;
  message?: string;
}

export const MIN_ORDER_PAYMENT_FLOOR = 1000; // 1,000 VND minimum for VietQR

export function calculateDiscount(coupon: Coupon, cartTotal: number): number {
  let discount = 0;

  if (coupon.type === CouponType.PERCENT) {
    discount = Math.round((cartTotal * coupon.value) / 100);
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    // FIXED
    discount = coupon.value;
  }

  // Ensure discount does not exceed cartTotal
  discount = Math.min(discount, cartTotal);

  // Floor safeguard: order total cannot drop below 1,000 VND
  if (cartTotal > MIN_ORDER_PAYMENT_FLOOR && cartTotal - discount < MIN_ORDER_PAYMENT_FLOOR) {
    discount = cartTotal - MIN_ORDER_PAYMENT_FLOOR;
  }

  return Math.max(0, discount);
}

export async function validateCoupon(
  rawCode: string,
  cartTotal: number
): Promise<CouponValidationResult> {
  if (!rawCode || typeof rawCode !== "string") {
    return {
      valid: false,
      discountAmount: 0,
      finalTotal: cartTotal,
      message: "Vui lòng nhập mã giảm giá",
    };
  }

  const code = rawCode.trim().toUpperCase();

  const coupon = await prisma.coupon.findUnique({
    where: { code },
  });

  if (!coupon) {
    return {
      valid: false,
      discountAmount: 0,
      finalTotal: cartTotal,
      message: `Mã giảm giá "${code}" không tồn tại`,
    };
  }

  if (!coupon.isActive) {
    return {
      valid: false,
      discountAmount: 0,
      finalTotal: cartTotal,
      message: `Mã giảm giá "${code}" hiện đang tạm ngưng sử dụng`,
    };
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return {
      valid: false,
      discountAmount: 0,
      finalTotal: cartTotal,
      message: `Mã giảm giá "${code}" đã hết hạn sử dụng`,
    };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      discountAmount: 0,
      finalTotal: cartTotal,
      message: `Mã giảm giá "${code}" đã hết lượt sử dụng`,
    };
  }

  if (coupon.minOrderValue > 0 && cartTotal < coupon.minOrderValue) {
    const formattedMin = new Intl.NumberFormat("vi-VN").format(coupon.minOrderValue);
    return {
      valid: false,
      discountAmount: 0,
      finalTotal: cartTotal,
      message: `Mã "${code}" chỉ áp dụng cho đơn hàng tối thiểu từ ${formattedMin}đ`,
    };
  }

  const discountAmount = calculateDiscount(coupon, cartTotal);
  const finalTotal = Math.max(
    cartTotal >= MIN_ORDER_PAYMENT_FLOOR ? MIN_ORDER_PAYMENT_FLOOR : 0,
    cartTotal - discountAmount
  );

  return {
    valid: true,
    coupon,
    discountAmount,
    finalTotal,
    message: `Áp dụng thành công mã "${code}"`,
  };
}
