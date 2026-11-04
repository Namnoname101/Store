const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== SYNCHRONIZING LIVE PRODUCT MAPPINGS ===");

  // 1. Update CapCut 7 day mapping to #49 (in-stock)
  const capcut7 = await prisma.product.findFirst({
    where: { slug: "capcut-pro-7-ngay" },
    include: { supplierMapping: true },
  });

  if (capcut7) {
    await prisma.product.update({
      where: { id: capcut7.id },
      data: {
        isActive: true,
        price: 21000,
        fulfillmentType: "API_DROPSHIP",
      },
    });

    if (capcut7.supplierMapping) {
      await prisma.supplierProductMapping.update({
        where: { id: capcut7.supplierMapping.id },
        data: {
          supplierProductCode: "49",
          supplierPrice: 5500,
          supplierStock: 117,
          isAutoSync: true,
          lastSyncAt: new Date(),
        },
      });
      console.log("✅ Updated CapCut 7-Day mapping to Supplier Code #49 (Price: 5,500đ, Stock: 117)");
    }
  }

  // 2. Update CapCut 30 day mapping to #35 (in-stock: 35)
  const capcut30 = await prisma.product.findFirst({
    where: { slug: "capcut-pro-30-ngay" },
    include: { supplierMapping: true },
  });
  if (capcut30 && capcut30.supplierMapping) {
    await prisma.supplierProductMapping.update({
      where: { id: capcut30.supplierMapping.id },
      data: {
        supplierProductCode: "35",
        supplierPrice: 38800,
        supplierStock: 35,
        lastSyncAt: new Date(),
      },
    });
    console.log("✅ Updated CapCut 30-Day mapping to Supplier Code #35 (Price: 38,800đ, Stock: 35)");
  }

  // 3. Update Canva Pro 1 month to #71 (in-stock: 5)
  const canva = await prisma.product.findFirst({
    where: { slug: "canva-pro-1-thang" },
    include: { supplierMapping: true },
  });
  if (canva && canva.supplierMapping) {
    await prisma.supplierProductMapping.update({
      where: { id: canva.supplierMapping.id },
      data: {
        supplierProductCode: "71",
        supplierPrice: 9900,
        supplierStock: 5,
        lastSyncAt: new Date(),
      },
    });
    console.log("✅ Updated Canva Pro mapping to Supplier Code #71 (Price: 9,900đ, Stock: 5)");
  }

  // 4. Update Office 365 to #73 (in-stock: 77)
  const office = await prisma.product.findFirst({
    where: { slug: "office-365-1-nam" },
    include: { supplierMapping: true },
  });
  if (office && office.supplierMapping) {
    await prisma.supplierProductMapping.update({
      where: { id: office.supplierMapping.id },
      data: {
        supplierProductCode: "73",
        supplierPrice: 16800,
        supplierStock: 77,
        lastSyncAt: new Date(),
      },
    });
    console.log("✅ Updated Office 365 mapping to Supplier Code #73 (Price: 16,800đ, Stock: 77)");
  }

  // 5. Update Duolingo Super to #60 (in-stock: 31)
  const duo = await prisma.product.findFirst({
    where: { slug: "duolingo-super-12-thang" },
    include: { supplierMapping: true },
  });
  if (duo && duo.supplierMapping) {
    await prisma.supplierProductMapping.update({
      where: { id: duo.supplierMapping.id },
      data: {
        supplierProductCode: "60",
        supplierPrice: 19800,
        supplierStock: 31,
        lastSyncAt: new Date(),
      },
    });
    console.log("✅ Updated Duolingo Super mapping to Supplier Code #60 (Price: 19,800đ, Stock: 31)");
  }

  // 6. Update Meitu VIP to #55 (in-stock: 8)
  const meitu = await prisma.product.findFirst({
    where: { slug: "meitu-vip-7-ngay" },
    include: { supplierMapping: true },
  });
  if (meitu && meitu.supplierMapping) {
    await prisma.supplierProductMapping.update({
      where: { id: meitu.supplierMapping.id },
      data: {
        supplierProductCode: "55",
        supplierPrice: 9500,
        supplierStock: 8,
        lastSyncAt: new Date(),
      },
    });
    console.log("✅ Updated Meitu VIP mapping to Supplier Code #55 (Price: 9,500đ, Stock: 8)");
  }

  // 7. Update Live Balances in Supplier table
  await prisma.supplier.updateMany({
    where: { code: "XOAINON_TELE" },
    data: {
      currentBalance: 3745,
      lastNotifiedBalance: 3745,
    },
  });
  console.log("✅ Updated XOAINON_TELE balance to 3,745đ");

  await prisma.supplier.updateMany({
    where: { code: "NGHIENTRICK_TELE" },
    data: {
      currentBalance: 17131,
      lastNotifiedBalance: 17131,
    },
  });
  console.log("✅ Updated NGHIENTRICK_TELE balance to 17,131đ");
}

main().catch(console.error).finally(() => prisma.$disconnect());
