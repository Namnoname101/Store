"use strict";

// prisma/seed-genzshop.ts
var import_client = require("@prisma/client");
var prisma = new import_client.PrismaClient();
async function main() {
  const apiKey = "gzsk_40b12b84ea9f5ab3e304299568e59f07e11ec59741bf7dbf9107f3d8f3c972ff";
  const baseUrl = "https://genzshop.vn/api/partner/v1";
  console.log("--> Fetching GenzShop balance...");
  let currentBalance = 0;
  try {
    const balRes = await fetch(`${baseUrl}/balance.php`, {
      headers: { "X-API-Key": apiKey }
    });
    const balJson = await balRes.json();
    if (balJson.success) {
      currentBalance = Number(balJson.balance || 0);
      console.log(`GenzShop Wallet Balance: ${currentBalance.toLocaleString("vi-VN")} VND`);
    }
  } catch (err) {
    console.warn("Could not fetch balance:", err);
  }
  const supplier = await prisma.supplier.upsert({
    where: { code: "GENZSHOP" },
    update: {
      name: "GenzShop (genzshop.vn)",
      type: "GENZSHOP",
      baseUrl,
      apiKey,
      currentBalance,
      isActive: true
    },
    create: {
      code: "GENZSHOP",
      name: "GenzShop (genzshop.vn)",
      type: "GENZSHOP",
      baseUrl,
      apiKey,
      currentBalance,
      isActive: true
    }
  });
  console.log(`\u2713 Supplier saved: ${supplier.name} (${supplier.code})`);
  const category = await prisma.category.upsert({
    where: { slug: "ai-api-keys" },
    update: {
      name: "API & Key AI (Cursor, Claude, Gemini, DeepSeek)",
      description: "Cung c\u1EA5p Key API v\xE0 T\xE0i kho\u1EA3n AI ch\xEDnh h\xE3ng, t\u1EF1 \u0111\u1ED9ng giao t\u1EE9c th\xEC qua GenzShop"
    },
    create: {
      slug: "ai-api-keys",
      name: "API & Key AI (Cursor, Claude, Gemini, DeepSeek)",
      description: "Cung c\u1EA5p Key API v\xE0 T\xE0i kho\u1EA3n AI ch\xEDnh h\xE3ng, t\u1EF1 \u0111\u1ED9ng giao t\u1EE9c th\xEC qua GenzShop"
    }
  });
  console.log(`\u2713 Category saved: ${category.name}`);
  console.log("--> Fetching products from GenzShop...");
  const prodRes = await fetch(`${baseUrl}/products.php`, {
    headers: { "X-API-Key": apiKey }
  });
  const prodJson = await prodRes.json();
  if (prodJson.success && Array.isArray(prodJson.products)) {
    console.log(`Found ${prodJson.products.length} products on GenzShop`);
    for (const item of prodJson.products) {
      const code = item.product_id;
      const title = item.name || `S\u1EA3n ph\u1EA9m ${code}`;
      const description = item.description || `Key/T\xE0i kho\u1EA3n ${title} c\u1EA5p t\u1EF1 \u0111\u1ED9ng 24/7.`;
      const costPrice = Number(item.walletPricing || 1e5);
      const stock = Number(item.available || 0);
      const markupPercent = 20;
      const rawPrice = costPrice * (1 + markupPercent / 100);
      const retailPrice = Math.max(costPrice, Math.round(rawPrice / 1e3) * 1e3);
      const slug = `${code.toLowerCase()}-${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      const product = await prisma.product.upsert({
        where: { slug },
        update: {
          title,
          description,
          price: retailPrice,
          originalPrice: Math.round(retailPrice * 1.25),
          type: "LICENSE_KEY",
          fulfillmentType: "API_DROPSHIP",
          categoryId: category.id,
          isActive: true
        },
        create: {
          slug,
          title,
          description,
          price: retailPrice,
          originalPrice: Math.round(retailPrice * 1.25),
          type: "LICENSE_KEY",
          fulfillmentType: "API_DROPSHIP",
          categoryId: category.id,
          isActive: true
        }
      });
      await prisma.supplierProductMapping.upsert({
        where: { productId: product.id },
        update: {
          supplierId: supplier.id,
          supplierProductCode: code,
          supplierPrice: costPrice,
          supplierStock: stock,
          markupType: "PERCENTAGE",
          markupValue: markupPercent,
          isAutoSync: true,
          lastSyncAt: /* @__PURE__ */ new Date()
        },
        create: {
          productId: product.id,
          supplierId: supplier.id,
          supplierProductCode: code,
          supplierPrice: costPrice,
          supplierStock: stock,
          markupType: "PERCENTAGE",
          markupValue: markupPercent,
          isAutoSync: true,
          lastSyncAt: /* @__PURE__ */ new Date()
        }
      });
      console.log(`  + [${code}] ${title} -> Gi\xE1 nh\u1EADp: ${costPrice.toLocaleString()}\u0111, Gi\xE1 b\xE1n: ${retailPrice.toLocaleString()}\u0111 (Kho: ${stock})`);
    }
  }
  console.log("\nDone seeding GenzShop!");
}
main().catch((e) => {
  console.error("Seed error:", e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
