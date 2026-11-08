const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");

async function scanPotentialProducts() {
  console.log("=== 1. DANH SÁCH SẢN PHẨM HIỆN CÓ TRÊN WEB ===");
  const currentProducts = await prisma.product.findMany({
    select: { title: true, slug: true, price: true, isActive: true }
  });
  console.log(`Hiện có ${currentProducts.length} sản phẩm trên web:`);
  currentProducts.forEach(p => console.log(`  - [${p.isActive ? 'ACTIVE' : 'INACTIVE'}] ${p.title} (${p.slug})`));

  console.log("\n=== 2. QUÉT SẢN PHẨM CÓ TỒN KHO DỒI DÀO TỪ CÁC ĐỐI TÁC API ===");

  // 1. Canboso (DKey Shop)
  const dkeyKey = "tgb_67d29cc012c999717a1f645ca0fb0079de354bf09d5af05e";
  try {
    const res = await fetch(`https://canboso.com/api/v2/telegram-buyer/products?key=${encodeURIComponent(dkeyKey)}`, {
      headers: { "x-buyer-key": dkeyKey, Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      const prods = data.products || data.data || [];
      console.log(`\n[DKey Shop - Canboso API] Tìm thấy ${prods.length} sản phẩm:`);
      prods.filter(p => (p.availability?.available ?? p.stock ?? 0) > 2).forEach(p => {
        console.log(`  * ${p.name} | Giá nhập: ${p.price?.amount || p.price}đ | Kho: ${p.availability?.available ?? p.stock}`);
      });
    }
  } catch (e) {
    console.log("Lỗi DKey:", e.message);
  }

  // 2. Chợ Đầu Mối (DBot)
  const dbotKey = "dbot_ceb5d392136482bef5617717bb099c1f";
  try {
    const res = await fetch("https://dbot.pro.vn/public-api/v1/products", {
      headers: { "X-API-Key": dbotKey, Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      const prods = data.products || [];
      console.log(`\n[Chợ Đầu Mối - DBot API] Tìm thấy ${prods.length} sản phẩm:`);
      prods.filter(p => (p.stock || 0) > 2).forEach(p => {
        console.log(`  * ${p.name} | Giá nhập: ${p.price}đ | Kho: ${p.stock}`);
      });
    }
  } catch (e) {
    console.log("Lỗi DBot:", e.message);
  }

  // 3. Kho MMO Partner API
  const khommoKey = "brk_66ba6f1e26e8df69df2dab56bf7400d3354ceb001d074023";
  try {
    const res = await fetch("https://api.khommo.vn/api/partner/v1/products", {
      headers: { Authorization: `Bearer ${khommoKey}`, Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      const prods = data.data?.products || data.data || [];
      console.log(`\n[Kho MMO Partner API] Tìm thấy ${prods.length} sản phẩm:`);
      prods.filter(p => (p.stock || 0) > 2).forEach(p => {
        console.log(`  * ${p.name} (${p.sku}) | Giá nhập: ${p.priceVnd || p.price}đ | Kho: ${p.stock}`);
      });
    }
  } catch (e) {
    console.log("Lỗi Kho MMO:", e.message);
  }
}

scanPotentialProducts().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)));
