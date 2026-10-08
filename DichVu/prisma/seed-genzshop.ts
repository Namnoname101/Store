import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const apiKey = "gzsk_40b12b84ea9f5ab3e304299568e59f07e11ec59741bf7dbf9107f3d8f3c972ff";
  const baseUrl = "https://genzshop.vn/api/partner/v1";

  console.log("--> Fetching GenzShop balance...");
  let currentBalance = 0;
  try {
    const balRes = await fetch(`${baseUrl}/balance.php`, {
      headers: { "X-API-Key": apiKey },
    });
    const balJson = await balRes.json();
    if (balJson.success) {
      currentBalance = Number(balJson.balance || 0);
      console.log(`GenzShop Wallet Balance: ${currentBalance.toLocaleString("vi-VN")} VND`);
    }
  } catch (err) {
    console.warn("Could not fetch balance:", err);
  }

  // 1. Create or update Supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: "GENZSHOP" },
    update: {
      name: "GenzShop (genzshop.vn)",
      type: "GENZSHOP",
      baseUrl,
      apiKey,
      currentBalance,
      isActive: true,
    },
    create: {
      code: "GENZSHOP",
      name: "GenzShop (genzshop.vn)",
      type: "GENZSHOP",
      baseUrl,
      apiKey,
      currentBalance,
      isActive: true,
    },
  });

  console.log(`✓ Supplier saved: ${supplier.name} (${supplier.code})`);

  // 2. Create or update Category
  const category = await prisma.category.upsert({
    where: { slug: "ai-api-keys" },
    update: {
      name: "API & Key AI (Cursor, Claude, Gemini, DeepSeek)",
      description: "Cung cấp Key API và Tài khoản AI chính hãng, tự động giao tức thì qua GenzShop",
    },
    create: {
      slug: "ai-api-keys",
      name: "API & Key AI (Cursor, Claude, Gemini, DeepSeek)",
      description: "Cung cấp Key API và Tài khoản AI chính hãng, tự động giao tức thì qua GenzShop",
    },
  });

  console.log(`✓ Category saved: ${category.name}`);

  // 3. Fetch products from GenzShop
  console.log("--> Fetching products from GenzShop...");
  const prodRes = await fetch(`${baseUrl}/products.php`, {
    headers: { "X-API-Key": apiKey },
  });
  const prodJson = await prodRes.json();

  if (prodJson.success && Array.isArray(prodJson.products)) {
    console.log(`Found ${prodJson.products.length} products on GenzShop`);

    for (const item of prodJson.products) {
      const code = item.product_id;
      const title = item.name || `Sản phẩm ${code}`;
      const description = item.description || `Key/Tài khoản ${title} cấp tự động 24/7.`;
      const costPrice = Number(item.walletPricing || 100000);
      const stock = Number(item.available || 0);
      
      // Calculate selling price with ~20% markup, rounded to 1.000 VND
      const markupPercent = 20;
      const rawPrice = costPrice * (1 + markupPercent / 100);
      const retailPrice = Math.max(costPrice, Math.round(rawPrice / 1000) * 1000);
      const slug = `${code.toLowerCase()}-${title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`;

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
          isActive: true,
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
          isActive: true,
        },
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
          lastSyncAt: new Date(),
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
          lastSyncAt: new Date(),
        },
      });

      console.log(`  + [${code}] ${title} -> Giá nhập: ${costPrice.toLocaleString()}đ, Giá bán: ${retailPrice.toLocaleString()}đ (Kho: ${stock})`);
    }
  }

  console.log("\nDone seeding GenzShop!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
