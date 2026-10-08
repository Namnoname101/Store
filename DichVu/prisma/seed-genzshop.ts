import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const typeFeaturedImages: Record<string, string> = {
  cursor: "https://genzshop.vn/assets/images/featured/featured_cursor_1791432465_324d.png",
  claude: "https://genzshop.vn/assets/images/featured/featured_claude_1791432484_48b7.png",
  codex: "https://genzshop.vn/assets/images/featured/featured_codex_1791432649_07eb.png",
  gemini: "https://genzshop.vn/assets/images/featured/featured_gemini_1791432636_8640.png",
  grok: "https://genzshop.vn/assets/images/featured/featured_grok_1791432680_1c82.png",
  deepseek: "https://genzshop.vn/assets/images/featured/featured_deepseek_1791432802_0e47.jpg",
  kimi: "https://genzshop.vn/assets/images/featured/featured_kimi_1791432662_9462.png",
  zhipu: "https://genzshop.vn/assets/images/featured/featured_zhipu_1791432694_66f4.png",
  kiro: "https://genzshop.vn/assets/images/api-circle.png",
};

async function fetchPartnerThumbnails(): Promise<Array<{ title: string; description: string; imgUrl: string }>> {
  const categories = ["cursor", "codex", "claude", "deepseek", "kimi", "zhipu", "gemini", "grok"];
  const list: Array<{ title: string; description: string; imgUrl: string }> = [];

  for (const cat of categories) {
    try {
      const res = await fetch(`https://genzshop.vn/san-pham/${cat}`);
      if (!res.ok) continue;
      const html = await res.text();

      const segments = html.split(/src=["'](https:\/\/genzshop\.vn\/assets\/images\/products\/[^"']+)["']/gi);
      for (let i = 1; i < segments.length; i += 2) {
        const imgUrl = segments[i];
        const seg = segments[i + 1] || "";
        const titleMatch = seg.match(/<h3[^>]*>([^<]+)<\/h3>/i);
        const descMatch = seg.match(/<p[^>]*class=["'][^"']*line-clamp[^"']*["'][^>]*>([^<]+)<\/p>/i);

        if (titleMatch) {
          list.push({
            title: titleMatch[1].trim(),
            description: descMatch ? descMatch[1].trim() : "",
            imgUrl,
          });
        }
      }
    } catch (err) {
      console.warn(`Could not crawl thumbnails for category ${cat}:`, err);
    }
  }

  return list;
}

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
  let category = await prisma.category.findFirst({
    where: { slug: { in: ["ai-api", "ai-api-keys"] } },
  });

  if (category) {
    category = await prisma.category.update({
      where: { id: category.id },
      data: {
        slug: "ai-api",
        name: "API & Key AI (Cursor, Claude, Gemini, DeepSeek)",
        description: "Cung cấp Key API và Tài khoản AI chính hãng, tự động giao tức thì qua GenzShop",
      },
    });
  } else {
    category = await prisma.category.create({
      data: {
        slug: "ai-api",
        name: "API & Key AI (Cursor, Claude, Gemini, DeepSeek)",
        description: "Cung cấp Key API và Tài khoản AI chính hãng, tự động giao tức thì qua GenzShop",
      },
    });
  }

  console.log(`✓ Category saved: ${category.name}`);

  // 3. Fetch exact partner thumbnails from genzshop.vn
  console.log("--> Crawling thumbnails from genzshop.vn...");
  const partnerThumbnails = await fetchPartnerThumbnails();
  console.log(`Crawled ${partnerThumbnails.length} product thumbnails from partner site.`);

  // 4. Fetch products from GenzShop API
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

      // Match exact thumbnail from partner site
      const matched = partnerThumbnails.find(
        (c) =>
          c.description &&
          item.description &&
          (c.description.toLowerCase().trim() === item.description.toLowerCase().trim() ||
            item.description.toLowerCase().includes(c.description.toLowerCase())) &&
          (c.title.toLowerCase().includes(item.name.toLowerCase().slice(0, 8)) ||
            item.name.toLowerCase().includes(c.title.toLowerCase().slice(0, 8)))
      ) || partnerThumbnails.find(
        (c) =>
          c.description &&
          item.description &&
          c.description.toLowerCase().trim() === item.description.toLowerCase().trim()
      );

      const thumbnailUrl = matched?.imgUrl || typeFeaturedImages[item.type] || typeFeaturedImages.cursor;

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
          thumbnailUrl,
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
          thumbnailUrl,
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

      console.log(`  + [${code}] ${title} -> Ảnh: ${thumbnailUrl.split("/").pop()} (Giá bán: ${retailPrice.toLocaleString()}đ)`);
    }
  }

  console.log("\nDone updating GenzShop products with partner thumbnails!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
