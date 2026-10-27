import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isAuthed = adminCookie ? await verifyAdminSessionToken(adminCookie) : false;

    // Also allow x-cron-secret or internal trigger
    const cronSecret = process.env.CRON_SECRET || "internal_sync_secret_token";
    const headerSecret = req.headers.get("x-cron-secret");
    const isSecretAuthed = headerSecret === cronSecret;

    if (!isAuthed && !isSecretAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeSlugs = [
      "cdx-0055-api-codex-ai-toc-o-nhanh-10-credit",
      "codex-credit-10usd",
      "nordvpn-premium-3-thang",
      "gemini-advanced-18-thang",
      "duolingo-super-12-thang",
      "capcut-pro-7-ngay",
      "meitu-vip-7-ngay",
      "capcut-pro-30-ngay",
      "canva-pro-1-thang",
      "office-365-1-nam",
      "tang-follow-facebook-1000",
      "tang-like-facebook-1000",
      "tang-follow-tiktok-1000",
      "tang-tim-tiktok-1000",
    ];

    const allProducts = await prisma.product.findMany({
      include: {
        _count: {
          select: { orderItems: true },
        },
        supplierMapping: true,
      },
    });

    let keptCount = 0;
    let deletedCount = 0;
    let deactivatedCount = 0;

    for (const prod of allProducts) {
      const isStorefrontActive = activeSlugs.includes(prod.slug) || prod.isActive;

      if (isStorefrontActive) {
        keptCount++;
        if (!prod.isActive) {
          await prisma.product.update({
            where: { id: prod.id },
            data: { isActive: true },
          });
        }
      } else {
        if (prod._count.orderItems === 0) {
          if (prod.supplierMapping) {
            await prisma.supplierProductMapping.delete({
              where: { productId: prod.id },
            }).catch(() => {});
          }

          await prisma.productItem.deleteMany({
            where: { productId: prod.id },
          }).catch(() => {});

          await prisma.product.delete({
            where: { id: prod.id },
          }).catch(() => {});

          deletedCount++;
        } else {
          await prisma.product.update({
            where: { id: prod.id },
            data: { isActive: false },
          });
          deactivatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      keptCount,
      deletedCount,
      deactivatedCount,
      message: `Đã dọn dẹp thành công: Giữ lại ${keptCount} sản phẩm, đã xóa ${deletedCount} sản phẩm không mở bán.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Lỗi dọn dẹp sản phẩm" },
      { status: 500 }
    );
  }
}
