import { prisma } from "@/lib/prisma";
import CouponsManagerClient from "@/components/admin/CouponsManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  });

  const serializedCoupons = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: c.value,
    minOrderValue: c.minOrderValue,
    maxDiscount: c.maxDiscount,
    usageLimit: c.usageLimit,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
    _count: c._count,
  }));

  return <CouponsManagerClient initialCoupons={serializedCoupons} />;
}
