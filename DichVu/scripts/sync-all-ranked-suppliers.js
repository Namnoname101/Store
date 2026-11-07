const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SUPPLIERS = [
  {
    code: "DKEY_API",
    name: "DKey Shop (Canboso API)",
    type: "CANBOSO_BUYER",
    baseUrl: "https://canboso.com",
    apiKey: "tgb_67d29cc012c999717a1f645ca0fb0079de354bf09d5af05e",
    isActive: true,
  },
  {
    code: "SHOPHXN_API",
    name: "Shop HXN (Canboso API)",
    type: "CANBOSO_BUYER",
    baseUrl: "https://canboso.com",
    apiKey: "tgb_8813c30a3c6f232192884ca050d9e5822e8955989ad932f2",
    isActive: true,
  },
  {
    code: "CHODAUMOI_API",
    name: "Chợ Đầu Mối (DBot API)",
    type: "DBOT_API",
    baseUrl: "https://dbot.pro.vn",
    apiKey: "dbot_ceb5d392136482bef5617717bb099c1f",
    isActive: true,
  },
  {
    code: "KHOMMO_API",
    name: "Kho MMO (Partner API)",
    type: "KHOMMO_API",
    baseUrl: "https://api.khommo.vn/api/partner/v1",
    apiKey: "brk_66ba6f1e26e8df69df2dab56bf7400d3354ceb001d074023",
    isActive: true,
  },
];

async function main() {
  console.log("=== 1. Upserting Suppliers ===");
  for (const s of SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({ where: { code: s.code } });
    if (existing) {
      await prisma.supplier.update({
        where: { id: existing.id },
        data: s,
      });
      console.log(`Updated supplier: ${s.code}`);
    } else {
      await prisma.supplier.create({ data: s });
      console.log(`Created supplier: ${s.code}`);
    }
  }

  const xoainon = await prisma.supplier.findFirst({ where: { code: "XOAINON_TELE" } });
  const nghientrick = await prisma.supplier.findFirst({ where: { code: "NGHIENTRICK_TELE" } });

  console.log("\n=== 2. Configuring Mappings & Alternative Suppliers ===");

  // 1. ChatGPT Plus 1 Tháng
  const chatGpt = await prisma.product.findFirst({
    where: { OR: [{ slug: "chatgpt-plus-1-thang" }, { slug: "chatgpt-plus-k12-2-nam" }] },
  });
  if (chatGpt && xoainon) {
    const alt = [
      { supplierCode: "DKEY_API", supplierProductCode: "6aed24fbed839c4b838b0370", supplierPrice: 115000 },
      { supplierCode: "KHOMMO_API", supplierProductCode: "2075", supplierPrice: 199500 },
      { supplierCode: "SHOPHXN_API", supplierProductCode: "6ad8a9590c1a1b0e665031b3", supplierPrice: 268999 },
    ];
    await prisma.product.update({
      where: { id: chatGpt.id },
      data: { isActive: true, fulfillmentType: "API_DROPSHIP" },
    });
    const map = await prisma.supplierProductMapping.findFirst({ where: { productId: chatGpt.id } });
    const data = {
      productId: chatGpt.id,
      supplierId: xoainon.id,
      supplierProductCode: "37", // Active in-stock code (109.800đ)
      supplierPrice: 109800,
      supplierStock: 60,
      markupType: "PERCENTAGE",
      markupValue: 20,
      isAutoSync: true,
      customConfig: JSON.stringify({ alternativeSuppliers: alt }),
    };
    if (map) {
      await prisma.supplierProductMapping.update({ where: { id: map.id }, data });
    } else {
      await prisma.supplierProductMapping.create({ data });
    }
    console.log(`✓ Mapped ChatGPT Plus 1 Tháng -> XoaiNon #37 + 3 Fallbacks (DKey, KhoMMO, HXN)`);
  }

  // 2. CapCut Pro 30 Ngày
  const capcut30 = await prisma.product.findFirst({
    where: { slug: "capcut-pro-30-ngay" },
  });
  if (capcut30 && xoainon) {
    const alt = [
      { supplierCode: "DKEY_API", supplierProductCode: "6a339d1b086ed556b9f71e01", supplierPrice: 35000 },
      { supplierCode: "KHOMMO_API", supplierProductCode: "2157", supplierPrice: 47500 },
      { supplierCode: "KHOMMO_API", supplierProductCode: "2182", supplierPrice: 52250 },
      { supplierCode: "SHOPHXN_API", supplierProductCode: "6acfb93e45252652925fc7ce", supplierPrice: 78000 },
    ];
    await prisma.product.update({
      where: { id: capcut30.id },
      data: { isActive: true, fulfillmentType: "API_DROPSHIP" },
    });
    const map = await prisma.supplierProductMapping.findFirst({ where: { productId: capcut30.id } });
    const data = {
      productId: capcut30.id,
      supplierId: xoainon.id,
      supplierProductCode: "35",
      supplierPrice: 32900,
      supplierStock: 32,
      markupType: "PERCENTAGE",
      markupValue: 20,
      isAutoSync: true,
      customConfig: JSON.stringify({ alternativeSuppliers: alt }),
    };
    if (map) {
      await prisma.supplierProductMapping.update({ where: { id: map.id }, data });
    } else {
      await prisma.supplierProductMapping.create({ data });
    }
    console.log(`✓ Mapped CapCut Pro 30 Ngày -> XoaiNon #35 + 4 Fallbacks (DKey, KhoMMO x2, HXN)`);
  }

  // 3. CapCut Pro 7 Ngày
  const capcut7 = await prisma.product.findFirst({
    where: { slug: "capcut-pro-7-ngay" },
  });
  if (capcut7 && xoainon) {
    const alt = [
      { supplierCode: "CHODAUMOI_API", supplierProductCode: "ds_cs0sg7", supplierPrice: 18500 },
    ];
    await prisma.product.update({
      where: { id: capcut7.id },
      data: { isActive: true, fulfillmentType: "API_DROPSHIP" },
    });
    const map = await prisma.supplierProductMapping.findFirst({ where: { productId: capcut7.id } });
    const data = {
      productId: capcut7.id,
      supplierId: xoainon.id,
      supplierProductCode: "21",
      supplierPrice: 3900,
      supplierStock: 8, // Chợ Đầu Mối has 8
      markupType: "PERCENTAGE",
      markupValue: 20,
      isAutoSync: true,
      customConfig: JSON.stringify({ alternativeSuppliers: alt }),
    };
    if (map) {
      await prisma.supplierProductMapping.update({ where: { id: map.id }, data });
    } else {
      await prisma.supplierProductMapping.create({ data });
    }
    console.log(`✓ Mapped CapCut Pro 7 Ngày -> XoaiNon #21 + Fallback ChoDauMoi (ds_cs0sg7)`);
  }

  // 4. Gemini Pro 18 Tháng
  const gemini = await prisma.product.findFirst({
    where: { slug: "gemini-advanced-18-thang" },
  });
  if (gemini && nghientrick) {
    const alt = [
      { supplierCode: "XOAINON_TELE", supplierProductCode: "70", supplierPrice: 21800 },
      { supplierCode: "KHOMMO_API", supplierProductCode: "3087", supplierPrice: 66500 },
      { supplierCode: "DKEY_API", supplierProductCode: "6ae8666b5edeecad99c77919", supplierPrice: 80000 },
    ];
    await prisma.product.update({
      where: { id: gemini.id },
      data: { isActive: true, fulfillmentType: "API_DROPSHIP" },
    });
    const map = await prisma.supplierProductMapping.findFirst({ where: { productId: gemini.id } });
    const data = {
      productId: gemini.id,
      supplierId: nghientrick.id,
      supplierProductCode: "19",
      supplierPrice: 14567,
      supplierStock: 56,
      markupType: "PERCENTAGE",
      markupValue: 20,
      isAutoSync: true,
      customConfig: JSON.stringify({ alternativeSuppliers: alt }),
    };
    if (map) {
      await prisma.supplierProductMapping.update({ where: { id: map.id }, data });
    } else {
      await prisma.supplierProductMapping.create({ data });
    }
    console.log(`✓ Mapped Gemini Pro 18 Tháng -> NghienTrick #19 + Fallbacks (XoaiNon, KhoMMO, DKey)`);
  }

  // 5. Office 365 1 Năm
  const office = await prisma.product.findFirst({
    where: { OR: [{ slug: "office-365-1-nam" }, { slug: "microsoft-365-1-nam-1tb-onedrive" }] },
  });
  if (office && xoainon) {
    const alt = [
      { supplierCode: "CHODAUMOI_API", supplierProductCode: "ds_f13dhw", supplierPrice: 42000 },
      { supplierCode: "SHOPHXN_API", supplierProductCode: "6aacdba45271203cb12d94f2", supplierPrice: 79000 },
      { supplierCode: "DKEY_API", supplierProductCode: "6a8e99bf5bc0bcbeecc98d85", supplierPrice: 90000 },
    ];
    await prisma.product.update({
      where: { id: office.id },
      data: { isActive: true, fulfillmentType: "API_DROPSHIP" },
    });
    const map = await prisma.supplierProductMapping.findFirst({ where: { productId: office.id } });
    const data = {
      productId: office.id,
      supplierId: xoainon.id,
      supplierProductCode: "73",
      supplierPrice: 16800,
      supplierStock: 30,
      markupType: "PERCENTAGE",
      markupValue: 20,
      isAutoSync: true,
      customConfig: JSON.stringify({ alternativeSuppliers: alt }),
    };
    if (map) {
      await prisma.supplierProductMapping.update({ where: { id: map.id }, data });
    } else {
      await prisma.supplierProductMapping.create({ data });
    }
    console.log(`✓ Mapped Office 365 1 Năm -> XoaiNon #73 + Fallbacks (ChoDauMoi, HXN, DKey)`);
  }

  // 6. NordVPN
  const nord = await prisma.product.findFirst({
    where: { slug: "nordvpn-premium-1-nam" },
  });
  if (nord && xoainon) {
    const alt = [
      { supplierCode: "CHODAUMOI_API", supplierProductCode: "ds_4l8pnc", supplierPrice: 88000 },
      { supplierCode: "DKEY_API", supplierProductCode: "6acc3f719c22979a68b5c0e5", supplierPrice: 165000 },
    ];
    await prisma.product.update({
      where: { id: nord.id },
      data: { isActive: true, fulfillmentType: "API_DROPSHIP" },
    });
    const map = await prisma.supplierProductMapping.findFirst({ where: { productId: nord.id } });
    const data = {
      productId: nord.id,
      supplierId: xoainon.id,
      supplierProductCode: "65",
      supplierPrice: 68000,
      supplierStock: 14,
      markupType: "PERCENTAGE",
      markupValue: 20,
      isAutoSync: true,
      customConfig: JSON.stringify({ alternativeSuppliers: alt }),
    };
    if (map) {
      await prisma.supplierProductMapping.update({ where: { id: map.id }, data });
    } else {
      await prisma.supplierProductMapping.create({ data });
    }
    console.log(`✓ Mapped NordVPN -> XoaiNon #65 + Fallbacks (ChoDauMoi, DKey)`);
  }

  console.log("\n=== ALL SUPPLIERS & RANKED MAPPINGS CONFIGURED SUCCESSFULLY ===");
}

main().finally(() => prisma.$disconnect());
