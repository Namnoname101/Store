async function inspectAdobeDetails() {
  console.log("=== KIỂM TRA ĐỊNH DẠNG GIAO HÀNG CỦA CÁC GÓI ADOBE ===");

  // 1. DKey Shop (Canboso)
  const dkeyKey = "tgb_67d29cc012c999717a1f645ca0fb0079de354bf09d5af05e";
  try {
    const res = await fetch(`https://canboso.com/api/v2/telegram-buyer/products?key=${encodeURIComponent(dkeyKey)}`, {
      headers: { "x-buyer-key": dkeyKey, Accept: "application/json" }
    });
    if (res.ok) {
      const data = await res.json();
      const prods = data.products || data.data || [];
      const adobe = prods.filter(p => /adobe/i.test(p.name || ""));
      console.log("\n--- DKEY SHOP (CANBOSO) ---");
      for (const p of adobe) {
        console.log(`ID: ${p.productId || p.id} | Tên: ${p.name}`);
        console.log(`Giá: ${p.price?.amount || p.price} | Tồn kho: ${p.availability?.available ?? p.stock}`);
        console.log(`Mô tả: ${p.description || "Không có"}`);
        console.log(`Yêu cầu input khách hàng: ${JSON.stringify(p.fields || p.inputs || p.requiredFields || "None")}`);
        console.log("------------------------");
      }
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
      const adobe = prods.filter(p => /adobe/i.test(p.name || ""));
      console.log("\n--- CHỢ ĐẦU MỐI (DBOT) ---");
      for (const p of adobe) {
        console.log(`ID: ${p.id} | Tên: ${p.name}`);
        console.log(`Giá: ${p.price} | Tồn kho: ${p.stock}`);
        console.log(`Mô tả: ${p.description || "Không có"}`);
        console.log(`Loại SP: ${p.type || p.category_name || "N/A"}`);
        console.log("------------------------");
      }
    }
  } catch (e) {
    console.log("Lỗi DBot:", e.message);
  }
}

inspectAdobeDetails().catch(console.error).finally(() => process.exit(0));
