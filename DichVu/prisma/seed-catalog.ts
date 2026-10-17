import { PrismaClient } from "@prisma/client";
import { resolveProductThumbnail } from "../src/lib/catalog-grouping";

const prisma = new PrismaClient();

async function main() {
  console.log("--> Starting DaiTruong Store Comprehensive Catalog Seed...");

  // 1. Create or verify Categories
  const catAiApi = await prisma.category.upsert({
    where: { slug: "ai-api" },
    update: { name: "AI & API" },
    create: {
      name: "AI & API",
      slug: "ai-api",
      description: "API Claude, Cursor, OpenAI, Codex Credit cấp phát tự động 24/7",
    },
  });

  const catStreaming = await prisma.category.upsert({
    where: { slug: "giai-tri" },
    update: { name: "Giải trí & Streaming" },
    create: {
      name: "Giải trí & Streaming",
      slug: "giai-tri",
      description: "Tài khoản Netflix 4K, Spotify Premium, YouTube Premium",
    },
  });

  const catSoftware = await prisma.category.upsert({
    where: { slug: "phan-mem" },
    update: { name: "Học tập & Phần mềm" },
    create: {
      name: "Học tập & Phần mềm",
      slug: "phan-mem",
      description: "Microsoft 365, Canva Pro, CapCut Pro, Locket Gold, Duolingo, VPN",
    },
  });

  const catSocial = await prisma.category.upsert({
    where: { slug: "dich-vu-mxh" },
    update: { name: "Dịch vụ MXH" },
    create: {
      name: "Dịch vụ MXH",
      slug: "dich-vu-mxh",
      description: "Tăng follow, tương tác TikTok, Facebook an toàn chất lượng cao",
    },
  });

  console.log("✓ Categories verified.");

  // 2. Define Products
  const products = [
    // --- Claude AI ---
    {
      title: "API Claude 3.5 Sonnet (1300 Request)",
      slug: "api-claude-3-5-sonnet-1300-request",
      description: "API Anthropic Claude 3.5 Sonnet tốc độ cao, hỗ trợ coding Cursor/Cline. Hạn mức 1300 Request.",
      price: 180000,
      originalPrice: 220000,
      categoryId: catAiApi.id,
      type: "LICENSE_KEY",
      stock: 25,
      brand: "claude",
    },
    {
      title: "API Claude 3.5 Sonnet (700 Request)",
      slug: "api-claude-3-5-sonnet-700-request",
      description: "API Anthropic Claude 3.5 Sonnet, hạn mức 700 Request dùng cho lập trình và viết lách.",
      price: 105000,
      originalPrice: 130000,
      categoryId: catAiApi.id,
      type: "LICENSE_KEY",
      stock: 40,
      brand: "claude",
    },
    {
      title: "API Claude 3.5 Sonnet (50$ Credit)",
      slug: "api-claude-3-5-sonnet-50-credit",
      description: "Hạn mức 50$ số dư API Claude chính hãng, không giới hạn request/phút.",
      price: 250000,
      originalPrice: 300000,
      categoryId: catAiApi.id,
      type: "LICENSE_KEY",
      stock: 18,
      brand: "claude",
    },

    // --- Cursor AI ---
    {
      title: "API Cursor AI Pro (1300 Request)",
      slug: "api-cursor-ai-pro-1300-request",
      description: "Gói API chuyên dụng cho Cursor IDE, Windsurf, Roo Code. 1300 Request tốc độ cao.",
      price: 185000,
      originalPrice: 230000,
      categoryId: catAiApi.id,
      type: "LICENSE_KEY",
      stock: 30,
      brand: "cursor",
    },
    {
      title: "API Cursor AI Pro (700 Request)",
      slug: "api-cursor-ai-pro-700-request",
      description: "Gói API Cursor 700 Request, phản hồi siêu nhanh, hỗ trợ đa mô hình Claude và GPT-4o.",
      price: 110000,
      originalPrice: 140000,
      categoryId: catAiApi.id,
      type: "LICENSE_KEY",
      stock: 55,
      brand: "cursor",
    },

    // --- Codex Credit ---
    {
      title: "Gói Codex 10$ Credit",
      slug: "codex-credit-10usd",
      description: "5.000.000 Quota Points — Thích hợp dùng thử cá nhân hoặc test bot, tra cứu logs real-time.",
      price: 12000,
      originalPrice: 15000,
      categoryId: catAiApi.id,
      type: "CODEX_CREDIT",
      stock: 100,
      brand: "codex",
    },
    {
      title: "Gói Codex 50$ Credit",
      slug: "codex-credit-50usd",
      description: "25.000.000 Quota Points — Gói phổ biến nhất cho Developer và Freelancer.",
      price: 60000,
      originalPrice: 75000,
      categoryId: catAiApi.id,
      type: "CODEX_CREDIT",
      stock: 80,
      brand: "codex",
    },

    // --- DeepSeek ---
    {
      title: "API DeepSeek V3 & R1 (100$ Quota)",
      slug: "api-deepseek-v3-r1-100-quota",
      description: "API DeepSeek V3 và R1 Reasoning, chi phí siêu rẻ, suy luận logic toán học và lập trình cực đỉnh.",
      price: 65000,
      originalPrice: 90000,
      categoryId: catAiApi.id,
      type: "LICENSE_KEY",
      stock: 50,
      brand: "deepseek",
    },

    // --- Gemini ---
    {
      title: "Tài khoản Gemini Advanced 18 Tháng",
      slug: "gemini-advanced-18-thang",
      description: "Tài khoản Google Gemini Advanced 18 tháng sử dụng mô hình Gemini 2.0 Flash 2M Context.",
      price: 85000,
      originalPrice: 150000,
      categoryId: catAiApi.id,
      type: "ACCOUNT",
      stock: 20,
      brand: "gemini",
    },

    // --- ChatGPT Plus ---
    {
      title: "ChatGPT Plus K12 - 2 Năm",
      slug: "chatgpt-plus-k12-2-nam",
      description: "Tài khoản ChatGPT Plus 2 năm không giới hạn mô hình GPT-4o, phân tích dữ liệu, tạo ảnh DALL-E 3.",
      price: 195000,
      originalPrice: 350000,
      categoryId: catAiApi.id,
      type: "ACCOUNT",
      stock: 15,
      brand: "chatgpt",
    },

    // --- Streaming & Entertainment ---
    {
      title: "Netflix Premium 4K UHD 1 Tháng",
      slug: "netflix-premium-4k-uhd-1-thang",
      description: "Tài khoản Netflix Premium 4K HDR 1 tháng, xem mượt mà trên Smart TV, điện thoại, máy tính.",
      price: 85000,
      originalPrice: 120000,
      categoryId: catStreaming.id,
      type: "ACCOUNT",
      stock: 35,
      brand: "netflix",
    },
    {
      title: "Spotify Premium 1 Năm (Gia Hạn Chính Chủ)",
      slug: "spotify-premium-1-nam",
      description: "Nâng cấp Spotify Premium 1 năm trên chính tài khoản của bạn, chất lượng Lossless không quảng cáo.",
      price: 240000,
      originalPrice: 350000,
      categoryId: catStreaming.id,
      type: "ACCOUNT",
      stock: 25,
      brand: "spotify",
    },
    {
      title: "YouTube Premium 1 Năm (Không Quảng Cáo)",
      slug: "youtube-premium-1-nam",
      description: "Gia hạn YouTube Premium 1 năm chính chủ, nghe nhạc tắt màn hình, xem video 4K không quảng cáo.",
      price: 280000,
      originalPrice: 390000,
      categoryId: catStreaming.id,
      type: "ACCOUNT",
      stock: 30,
      brand: "youtube",
    },

    // --- Software & Education ---
    {
      title: "Canva Pro Vĩnh Viễn (Full Tính Năng)",
      slug: "canva-pro-vinh-vien",
      description: "Tài khoản Canva Pro trọn đời, mở khóa toàn bộ kho tài nguyên ảnh, video, xóa phông nền AI 1 click.",
      price: 120000,
      originalPrice: 250000,
      categoryId: catSoftware.id,
      type: "ACCOUNT",
      stock: 60,
      brand: "canva",
    },
    {
      title: "CapCut Pro 1 Năm (Full Hiệu Ứng AI)",
      slug: "capcut-pro-1-nam",
      description: "Tài khoản CapCut Pro 1 năm, xuất video 4K sắc nét, phụ đề tự động đa ngôn ngữ, kho hiệu ứng VIP.",
      price: 190000,
      originalPrice: 320000,
      categoryId: catSoftware.id,
      type: "ACCOUNT",
      stock: 45,
      brand: "capcut",
    },
    {
      title: "Microsoft 365 Bản Quyền 1 Năm + 1TB OneDrive",
      slug: "microsoft-365-1-nam-1tb-onedrive",
      description: "Bản quyền trọn bộ Word, Excel, PowerPoint, Outlook và 1000GB dung lượng đám mây OneDrive bảo mật.",
      price: 160000,
      originalPrice: 280000,
      categoryId: catSoftware.id,
      type: "ACCOUNT",
      stock: 50,
      brand: "microsoft",
    },
    {
      title: "Locket Gold Vĩnh Viễn (Mở Khóa Toàn Bộ)",
      slug: "locket-gold-vinh-vien",
      description: "Tài khoản Locket Gold mở full tính năng, huy hiệu Gold VIP, tải video dài và zoom ảnh độ phân giải cao.",
      price: 65000,
      originalPrice: 120000,
      categoryId: catSoftware.id,
      type: "ACCOUNT",
      stock: 80,
      brand: "locket",
    },
    {
      title: "Duolingo Super Học Ngoại Ngữ 12 Tháng",
      slug: "duolingo-super-12-thang",
      description: "Tài khoản Duolingo Super 1 năm không giới hạn trái tim, không quảng cáo, luyện phát âm và ngữ pháp.",
      price: 95000,
      originalPrice: 160000,
      categoryId: catSoftware.id,
      type: "ACCOUNT",
      stock: 40,
      brand: "duolingo",
    },
    {
      title: "NordVPN Premium 1 Năm (Bảo Mật Tối Đa)",
      slug: "nordvpn-premium-1-nam",
      description: "VPN bảo mật số 1 thế giới, tốc độ siêu nhanh, mở khóa nội dung quốc tế và chống rò rỉ dữ liệu.",
      price: 150000,
      originalPrice: 290000,
      categoryId: catSoftware.id,
      type: "ACCOUNT",
      stock: 25,
      brand: "nordvpn",
    },

    // --- Social Services ---
    {
      title: "Gói 1.000 Follow TikTok Người Dùng Thật",
      slug: "tiktok-1000-follow-real",
      description: "Tăng 1.000 follower TikTok người dùng thật Việt Nam, bảo hành tụt 30 ngày, an toàn tuyệt đối cho kênh.",
      price: 75000,
      originalPrice: 110000,
      categoryId: catSocial.id,
      type: "COURSE_LINK",
      stock: 999,
      brand: "tiktok",
    },
    {
      title: "Gói 1.000 Sub / Follow Facebook Trang Cá Nhân",
      slug: "facebook-1000-sub-profile",
      description: "Tăng 1.000 theo dõi profile Facebook chất lượng cao, người thật nick xịn, tăng độ uy tín bán hàng.",
      price: 65000,
      originalPrice: 95000,
      categoryId: catSocial.id,
      type: "COURSE_LINK",
      stock: 999,
      brand: "facebook",
    },
  ];

  for (const p of products) {
    const thumbnail = resolveProductThumbnail(p.title, p.slug, null, p.brand);

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        type: p.type,
        thumbnailUrl: thumbnail,
        categoryId: p.categoryId,
        isActive: true,
      },
      create: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        type: p.type,
        thumbnailUrl: thumbnail,
        categoryId: p.categoryId,
        isActive: true,
      },
    });

    // Populate stock keys if LOCAL_STOCK
    if (p.type !== "COURSE_LINK") {
      const existingItems = await prisma.productItem.count({
        where: { productId: product.id, status: "AVAILABLE" },
      });

      if (existingItems < 5) {
        const dummyKeys = Array.from({ length: 5 - existingItems }, (_, i) => ({
          productId: product.id,
          secretContent:
            p.type === "LICENSE_KEY"
              ? `sk-daitruong-${p.brand}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
              : `daitruong_${p.brand}_${i + 1}@gmail.com|pass_${Math.random().toString(36).slice(2, 8)}`,
          status: "AVAILABLE",
        }));

        await prisma.productItem.createMany({
          data: dummyKeys,
        });
      }
    }

    console.log(`✓ [${product.slug}] -> Ảnh: ${thumbnail}`);
  }

  // Update Netflix 1 Month if it existed
  const oldNetflix = await prisma.product.findUnique({ where: { slug: "netflix-1-month" } });
  if (oldNetflix) {
    await prisma.product.update({
      where: { id: oldNetflix.id },
      data: {
        thumbnailUrl: "/images/brands/netflix.svg",
      },
    });
    console.log("✓ Updated legacy netflix-1-month with /images/brands/netflix.svg");
  }

  console.log("\n🎉 Catalog seeded successfully with corresponding brand images for all products!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
