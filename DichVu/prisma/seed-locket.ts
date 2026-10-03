import { prisma, SupplierType, MarkupType, FulfillmentType, ProductType } from "../src/lib/prisma";
import { syncAllActiveSuppliers } from "../src/services/pricing.service";

async function main() {
  console.log("Seeding Locket.com.vn and dropship products...");

  // 1. Create or update Supplier Locket.com.vn
  const supplier = await prisma.supplier.upsert({
    where: { code: "LOCKET_VN" },
    update: {
      name: "Locket.com.vn",
      type: SupplierType.LOCKET_VN,
      baseUrl: "https://locket.com.vn/api/reseller/v1",
      apiKey: "ntsh_fjylxnHZxu6rMoNVpuNQ-ErMGgsLzYw4",
      isActive: true,
    },
    create: {
      name: "Locket.com.vn",
      code: "LOCKET_VN",
      type: SupplierType.LOCKET_VN,
      baseUrl: "https://locket.com.vn/api/reseller/v1",
      apiKey: "ntsh_fjylxnHZxu6rMoNVpuNQ-ErMGgsLzYw4",
      isActive: true,
    },
  });
  console.log("Supplier ready:", supplier.name);

  // 2. Create Categories
  const catAI = await prisma.category.upsert({
    where: { slug: "ai-tool" },
    update: {},
    create: {
      name: "Tài khoản AI & Công nghệ",
      slug: "ai-tool",
      description: "Tài khoản trí tuệ nhân tạo Gemini, ChatGPT Plus bản quyền",
    },
  });

  const catEdu = await prisma.category.upsert({
    where: { slug: "hoc-tap-phan-mem" },
    update: {},
    create: {
      name: "Học tập & Thiết kế",
      slug: "hoc-tap-phan-mem",
      description: "Duolingo, Adobe Express, NordVPN",
    },
  });

  // 3. Define Locket items
  const itemsToSeed = [
    {
      title: "Tài khoản Gemini Advanced 18 Tháng",
      slug: "gemini-advanced-18-thang",
      description: "Tài khoản Google Gemini Advanced 18 tháng sử dụng mô hình AI thông minh nhất từ Google. Cấp phát tài khoản tự động.",
      categoryId: catAI.id,
      supplierProductCode: "19",
      initialCost: 19555,
      markupType: MarkupType.PERCENTAGE,
      markupValue: 50, // Lãi 50%
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "Adobe Express Bản Quyền 12 Tháng",
      slug: "adobe-express-12-thang",
      description: "Tài khoản Adobe Express Premium 12 tháng thiết kế đồ họa, hình ảnh chuyên nghiệp và video nhanh chóng.",
      categoryId: catEdu.id,
      supplierProductCode: "73",
      initialCost: 14567,
      markupType: MarkupType.FIXED_AMOUNT,
      markupValue: 15000, // Lãi +15.000đ
      thumbnailUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "Duolingo Super Học Ngoại Ngữ 12 Tháng",
      slug: "duolingo-super-12-thang",
      description: "Tài khoản Duolingo Super 1 năm không giới hạn trái tim, không quảng cáo, luyện phát âm và ngữ pháp.",
      categoryId: catEdu.id,
      supplierProductCode: "82",
      initialCost: 17777,
      markupType: MarkupType.PERCENTAGE,
      markupValue: 40, // Lãi 40%
      thumbnailUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "NordVPN Premium 3 Tháng",
      slug: "nordvpn-premium-3-thang",
      description: "VPN bảo mật hàng đầu thế giới, fake IP tốc độ cao, truy cập internet an toàn tuyệt đối.",
      categoryId: catEdu.id,
      supplierProductCode: "84",
      initialCost: 15555,
      markupType: MarkupType.FIXED_AMOUNT,
      markupValue: 15000,
      thumbnailUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80",
    },
    {
      title: "ChatGPT Plus K12 - 2 Năm",
      slug: "chatgpt-plus-k12-2-nam",
      description: "Gói ChatGPT Plus 2 năm không giới hạn mô hình GPT-4o, phân tích dữ liệu, tạo ảnh DALL-E 3.",
      categoryId: catAI.id,
      supplierProductCode: "85",
      initialCost: 150000,
      markupType: MarkupType.PERCENTAGE,
      markupValue: 30, // Lãi 30%
      thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80",
    },
  ];

  for (const item of itemsToSeed) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        categoryId: item.categoryId,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        type: ProductType.ACCOUNT,
        thumbnailUrl: item.thumbnailUrl,
        isActive: true,
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        price: Math.round(item.initialCost * 1.5),
        type: ProductType.ACCOUNT,
        fulfillmentType: FulfillmentType.API_DROPSHIP,
        thumbnailUrl: item.thumbnailUrl,
        categoryId: item.categoryId,
        isActive: true,
      },
    });

    await prisma.supplierProductMapping.upsert({
      where: { productId: product.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: item.supplierProductCode,
        supplierPrice: item.initialCost,
        markupType: item.markupType,
        markupValue: item.markupValue,
        isAutoSync: true,
      },
      create: {
        productId: product.id,
        supplierId: supplier.id,
        supplierProductCode: item.supplierProductCode,
        supplierPrice: item.initialCost,
        markupType: item.markupType,
        markupValue: item.markupValue,
        isAutoSync: true,
      },
    });

    console.log(`Mapped: ${product.title} -> Locket ID ${item.supplierProductCode}`);
  }

  // 4. Sync live prices & inventory from Locket.com.vn
  console.log("Triggering live price and stock synchronization from Locket API...");
  const syncResult = await syncAllActiveSuppliers();
  console.log("Sync completed successfully:", syncResult);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
