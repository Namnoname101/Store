/**
 * Sync HHPremium Supplier (HHPREMIUM_API) & 6 Locket Gold Tiers into SQLite via Prisma.
 * Usage:
 *   HHPREMIUM_API_KEY="shop_..." node scripts/sync-hhpremium-locket.js
 *   node scripts/sync-hhpremium-locket.js --key=shop_...
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const BASE_URL = "https://bot.hhpremiumsv.fun/api/shop";

function resolveApiKey() {
  const arg = process.argv.find((a) => a.startsWith("--key="));
  if (arg) return arg.slice("--key=".length).trim();
  if (process.env.HHPREMIUM_API_KEY) return process.env.HHPREMIUM_API_KEY.trim();
  return "";
}

const LOCKET_PRODUCTS = [
  {
    supplierCode: "4",
    slug: "locket-gold-trial-3-ngay",
    title: "Locket Gold Trial 3 Ngày - Mở Khóa VIP, Video 30s & Chống Thu Hồi DNS",
    price: 29000,
    originalPrice: 59000,
    fallbackCost: 9000,
    fallbackStock: 999999,
    description: [
      "Gói trải nghiệm Locket Gold VIP thời hạn 3 Ngày – Giao tự động 24/7 ngay sau khi thanh toán.",
      "",
      "Quyền lợi nổi bật:",
      "- Mở khóa full 7 đặc quyền VIP Locket Gold & huy hiệu nổi bật.",
      "- Hỗ trợ quay video Locket lên tới 30 giây siêu mượt.",
      "- Mở khóa tính năng PhotoBooth độc quyền.",
      "- Tích hợp cấu hình DNS chống thu hồi ổn định.",
      "- Tặng kèm tiện ích Free Spotify Premium (Youtube Premium hiện đang bảo trì từ hệ thống nguồn).",
      "- Phù hợp trải nghiệm nhanh trước khi nâng gói dài hạn; bảo hành trọn vẹn 3 ngày.",
    ].join("\n"),
  },
  {
    supplierCode: "5",
    slug: "locket-gold-1-thang",
    title: "Locket Gold 1 Tháng - Mở Khóa Huy Hiệu VIP, Filter AI & Chống Thu Hồi DNS",
    price: 39000,
    originalPrice: 79000,
    fallbackCost: 15000,
    fallbackStock: 6,
    description: [
      "Gói nâng cấp Locket Gold VIP thời hạn 1 Tháng – Kích hoạt nhanh chóng, giao tự động 24/7.",
      "",
      "Quyền lợi nổi bật:",
      "- Bản quyền Locket Gold VIP 1 Tháng đầy đủ 7 đặc quyền VIP.",
      "- Mở khóa Filter AI (1 lần/ngày) & tính năng PhotoBooth độc quyền.",
      "- Quay video Locket thời lượng 30 giây, không quảng cáo.",
      "- Đi kèm hướng dẫn cấu hình DNS chống thu hồi an toàn.",
      "- Bảo hành ổn định xuyên suốt thời hạn 1 tháng sử dụng.",
    ].join("\n"),
  },
  {
    supplierCode: "6",
    slug: "locket-gold-3-thang",
    title: "Locket Gold 3 Tháng - Mở Khóa Huy Hiệu VIP, Filter AI & Chống Thu Hồi DNS",
    price: 49000,
    originalPrice: 99000,
    fallbackCost: 20000,
    fallbackStock: 3,
    description: [
      "Gói nâng cấp Locket Gold VIP thời hạn 3 Tháng – Tiết kiệm chi phí, giao tự động 24/7.",
      "",
      "Quyền lợi nổi bật:",
      "- Bản quyền Locket Gold VIP 3 Tháng đầy đủ 7 đặc quyền VIP.",
      "- Mở khóa Filter AI (1 lần/ngày) & PhotoBooth độc quyền.",
      "- Quay video 30 giây mượt mà, hiển thị huy hiệu Gold VIP.",
      "- Có sẵn cấu hình DNS chống thu hồi & bảo hành trọn gói 3 tháng.",
    ].join("\n"),
  },
  {
    supplierCode: "7",
    slug: "locket-gold-6-thang",
    title: "Locket Gold 6 Tháng - Mở Khóa Huy Hiệu VIP, Filter AI & Chống Thu Hồi DNS",
    price: 69000,
    originalPrice: 149000,
    fallbackCost: 25000,
    fallbackStock: 3,
    description: [
      "Gói nâng cấp Locket Gold VIP thời hạn 6 Tháng – Sử dụng nửa năm siêu ổn định, giao tự động 24/7.",
      "",
      "Quyền lợi nổi bật:",
      "- Bản quyền Locket Gold VIP 6 Tháng mở khóa trọn bộ 7 đặc quyền VIP.",
      "- Mở khóa Filter AI (1 lần/ngày) & PhotoBooth chụp ảnh chuyên nghiệp.",
      "- Quay video Locket lên đến 30 giây, bỏ giới hạn tài khoản thường.",
      "- Tích hợp cấu hình DNS chống thu hồi & bảo hành trọn gói 6 tháng.",
    ].join("\n"),
  },
  {
    supplierCode: "8",
    slug: "locket-gold-1-nam",
    title: "Locket Gold 1 Năm - Filter AI 3 Lần/Ngày, Video 30s & Chống Thu Hồi DNS",
    price: 89000,
    originalPrice: 199000,
    fallbackCost: 35000,
    fallbackStock: 3,
    description: [
      "Gói Locket Gold VIP 1 Năm cao cấp – Hạn mức Filter AI x3, hỗ trợ bảo hành lâu dài, giao tự động 24/7.",
      "",
      "Quyền lợi nổi bật:",
      "- Bản quyền Locket Gold VIP 1 Năm (12 tháng) full 7 đặc quyền VIP.",
      "- Nâng hạn mức Filter AI lên tới 3 lần/ngày + mở khóa PhotoBooth.",
      "- Quay video Locket thời lượng 30 giây sắc nét.",
      "- Cấu hình DNS chống thu hồi & chính sách bảo hành trọn đời gói.",
    ].join("\n"),
  },
  {
    supplierCode: "9",
    slug: "locket-gold-vinh-vien",
    title: "Locket Gold Vĩnh Viễn - Filter AI 3 Lần/Ngày, Chống Thu Hồi DNS Trọn Đời",
    price: 119000,
    originalPrice: 299000,
    fallbackCost: 50000,
    fallbackStock: 2,
    description: [
      "Gói Locket Gold VIP Vĩnh Viễn cao cấp nhất – Mua 1 lần dùng lâu dài, giao tự động 24/7.",
      "",
      "Quyền lợi nổi bật:",
      "- Bản quyền Locket Gold VIP Vĩnh Viễn đầy đủ 7 đặc quyền VIP cao cấp.",
      "- Hỗ trợ Filter AI tối đa 3 lần/ngày & tính năng PhotoBooth độc quyền.",
      "- Quay video Locket dài 30 giây, trải nghiệm đầy đủ tính năng VIP.",
      "- Tích hợp DNS chống thu hồi & chính sách bảo hành trọn đời hỗ trợ 24/7.",
    ].join("\n"),
  },
];

async function fetchUpstreamCatalog(apiKey) {
  if (!apiKey) return { balance: null, productsMap: new Map() };
  const headers = { "X-API-Key": apiKey, Accept: "application/json" };

  let balance = null;
  const productsMap = new Map();

  try {
    const [balRes, prodRes] = await Promise.all([
      fetch(`${BASE_URL}/balance`, { headers }),
      fetch(`${BASE_URL}/products`, { headers }),
    ]);

    if (balRes.ok) {
      const balJson = await balRes.json();
      if (balJson && balJson.success && typeof balJson.balance === "number") {
        balance = Math.floor(balJson.balance);
      }
    }

    if (prodRes.ok) {
      const prodJson = await prodRes.json();
      const rows = Array.isArray(prodJson?.products)
        ? prodJson.products
        : Array.isArray(prodJson?.data)
        ? prodJson.data
        : Array.isArray(prodJson)
        ? prodJson
        : [];

      for (const item of rows) {
        const idStr = String(item.id);
        const stock = item.unlimited
          ? 999999
          : Math.min(Math.max(0, Number(item.stock ?? 0)), 999999);
        const price = Number(item.price ?? 0);
        productsMap.set(idStr, { stock, price, name: item.name });
      }
    }
  } catch (err) {
    console.warn("[WARN] Could not reach HHPremium API during seed, using fallback stock/cost:", err.message);
  }

  return { balance, productsMap };
}

async function main() {
  console.log("=== SYNCING HHPREMIUM SUPPLIER & LOCKET GOLD PRODUCTS ===");
  const apiKey = resolveApiKey();
  const existingSupplier = await prisma.supplier.findUnique({
    where: { code: "HHPREMIUM" },
  });

  if (!apiKey && !existingSupplier) {
    throw new Error(
      "Missing HHPREMIUM_API_KEY env var or --key=... argument for initial Supplier creation."
    );
  }

  const effectiveKey = apiKey || existingSupplier.apiKey;
  const { balance, productsMap } = await fetchUpstreamCatalog(effectiveKey);

  // 1. Ensure category "software" exists
  const category = await prisma.category.upsert({
    where: { slug: "software" },
    update: {},
    create: {
      name: "Phần mềm & Bản quyền",
      slug: "software",
      description: "Tài khoản & Bản quyền phần mềm chính hãng giao tự động",
    },
  });
  console.log(`Category ready: ${category.name} (${category.id})`);

  // 2. Upsert HHPREMIUM Supplier
  const supplier = await prisma.supplier.upsert({
    where: { code: "HHPREMIUM" },
    update: {
      name: "HHPremium Shop API",
      type: "HHPREMIUM_API",
      baseUrl: BASE_URL,
      ...(apiKey ? { apiKey } : {}),
      ...(balance !== null ? { currentBalance: balance } : {}),
      isActive: true,
    },
    create: {
      name: "HHPremium Shop API",
      code: "HHPREMIUM",
      type: "HHPREMIUM_API",
      baseUrl: BASE_URL,
      apiKey: effectiveKey,
      currentBalance: balance ?? 0,
      isActive: true,
    },
  });
  console.log(`Supplier ready: ${supplier.name} (${supplier.code}) | Balance: ${supplier.currentBalance}đ`);

  // 3. Upsert 6 Locket Gold products + SupplierProductMapping
  const now = new Date();
  for (const spec of LOCKET_PRODUCTS) {
    const live = productsMap.get(spec.supplierCode);
    const supplierPrice = live && live.price > 0 ? live.price : spec.fallbackCost;
    const supplierStock = live ? live.stock : spec.fallbackStock;
    const markupValue = spec.price - supplierPrice;

    const product = await prisma.product.upsert({
      where: { slug: spec.slug },
      update: {
        title: spec.title,
        description: spec.description,
        price: spec.price,
        originalPrice: spec.originalPrice,
        type: "ACCOUNT",
        fulfillmentType: "API_DROPSHIP",
        thumbnailUrl: "/images/products/locket-gold.svg",
        categoryId: category.id,
        isActive: true,
        maxQuantity: 10,
      },
      create: {
        title: spec.title,
        slug: spec.slug,
        description: spec.description,
        price: spec.price,
        originalPrice: spec.originalPrice,
        type: "ACCOUNT",
        fulfillmentType: "API_DROPSHIP",
        thumbnailUrl: "/images/products/locket-gold.svg",
        categoryId: category.id,
        isActive: true,
        minQuantity: 1,
        maxQuantity: 10,
      },
    });

    await prisma.supplierProductMapping.upsert({
      where: { productId: product.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: spec.supplierCode,
        supplierPrice,
        supplierStock,
        markupType: "FIXED_AMOUNT",
        markupValue,
        isAutoSync: true,
        lastSyncAt: now,
        customConfig: JSON.stringify({
          source: "https://bot.hhpremiumsv.fun/api/shop",
          upstreamName: live?.name || spec.title,
        }),
      },
      create: {
        productId: product.id,
        supplierId: supplier.id,
        supplierProductCode: spec.supplierCode,
        supplierPrice,
        supplierStock,
        markupType: "FIXED_AMOUNT",
        markupValue,
        isAutoSync: true,
        lastSyncAt: now,
        customConfig: JSON.stringify({
          source: "https://bot.hhpremiumsv.fun/api/shop",
          upstreamName: live?.name || spec.title,
        }),
      },
    });

    console.log(
      `✓ ${spec.slug} [id=${spec.supplierCode}] | Cost=${supplierPrice}đ | Retail=${spec.price}đ | Markup=+${markupValue}đ | Stock=${supplierStock}`
    );
  }

  console.log("=== HHPREMIUM & LOCKET GOLD SYNC COMPLETED ===");
}

main()
  .catch((err) => {
    console.error("SYNC FAILED:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
