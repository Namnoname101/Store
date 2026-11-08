const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PRODUCTS_TO_ADD = [
  {
    product: {
      title: "Tài Khoản Xingtu VIP 30 Ngày (醒图 App Chỉnh Ảnh Douyin)",
      slug: "xingtu-vip-30-ngay",
      description: "Tài khoản Xingtu (醒图) VIP 30 ngày mở khóa trọn bộ tính năng chỉnh ảnh chuyên nghiệp: kho bộ lọc filter độc quyền Douyin, công cụ bóp dáng AI, xóa vật thể nâng cao, kho template chỉnh ảnh hot trend và xuất ảnh 4K không logo. Giao ngay link OTP số điện thoại để đăng nhập.",
      price: 89000,
      originalPrice: 150000,
      type: "ACCOUNT",
      thumbnailUrl: "/images/products/xingtu-vip.svg",
      isActive: true,
      fulfillmentType: "API_DROPSHIP",
      minQuantity: 1,
      maxQuantity: 5,
    },
    mapping: {
      supplierProductCode: "6ad16d3b02296012a32425ad",
      supplierPrice: 65000,
      supplierStock: 44,
      markupType: "FIXED_AMOUNT",
      markupValue: 24000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        resellerPrice: 79000,
        supplierCost: 65000,
        warrantyPolicy: "Bảo hành full 28 - 30 ngày (1 đổi 1 nếu mất VIP). Dùng trên 1 thiết bị duy nhất. Không đăng xuất, không xóa app, không đổi số điện thoại để duy trì bảo hành.",
        alternativeSuppliers: [
          { supplierCode: "DKEY_API", supplierProductCode: "6a852d4946f7272861585714", supplierPrice: 85000 },
          { supplierCode: "DKEY_API", supplierProductCode: "6a9f6bde4f6e4dbc7714845b", supplierPrice: 95000 }
        ]
      }),
    }
  },
  {
    product: {
      title: "Tài Khoản Quizlet Plus 1 Tháng (Gói Teacher Bản Quyền)",
      slug: "quizlet-plus-1-thang",
      description: "Tài khoản Quizlet Plus 1 tháng dành cho Teacher/Học viên: học tập 100% không quảng cáo, mở khóa full chế độ Learn, Test thông minh, tạo bộ thẻ ghi nhớ (Flashcard) không giới hạn, tạo lớp học và giao bài ôn tập cho học viên. Giao tài khoản cấp sẵn tự động tức thì.",
      price: 49000,
      originalPrice: 120000,
      type: "ACCOUNT",
      thumbnailUrl: "/images/products/quizlet-plus.svg",
      isActive: true,
      fulfillmentType: "API_DROPSHIP",
      minQuantity: 1,
      maxQuantity: 5,
    },
    mapping: {
      supplierProductCode: "6ad21a7c02296012a344f7ad",
      supplierPrice: 25000,
      supplierStock: 20,
      markupType: "FIXED_AMOUNT",
      markupValue: 24000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        resellerPrice: 42000,
        supplierCost: 25000,
        warrantyPolicy: "Bảo hành Full 30 ngày (1 đổi 1 nếu mất Plus). Đăng nhập dùng trên cả Web và App. Không chia sẻ tài khoản cho người khác."
      }),
    }
  },
  {
    product: {
      title: "Tài Khoản Photoroom Max 7 Ngày (Tách Nền & Chỉnh Ảnh AI)",
      slug: "photoroom-max-7-ngay",
      description: "Tài khoản Photoroom gói Max cao cấp 7 ngày: công nghệ AI tự động tách nền siêu sạch chuẩn từng sợi tóc, tạo nền studio sản phẩm chuyên nghiệp cho bán hàng online Shopee, TikTok Shop, xuất ảnh 4K không watermark. Giao tài khoản cấp sẵn dùng ngay.",
      price: 39000,
      originalPrice: 80000,
      type: "ACCOUNT",
      thumbnailUrl: "/images/products/photoroom-pro.svg",
      isActive: true,
      fulfillmentType: "API_DROPSHIP",
      minQuantity: 1,
      maxQuantity: 5,
    },
    mapping: {
      supplierProductCode: "6acf7dea452526529250fa37",
      supplierPrice: 19000,
      supplierStock: 8,
      markupType: "FIXED_AMOUNT",
      markupValue: 20000,
      isAutoSync: true,
      customConfig: JSON.stringify({
        resellerPrice: 32000,
        supplierCost: 19000,
        warrantyPolicy: "Bảo hành Full 7 ngày (1 đổi 1 nếu lỗi tài khoản)."
      }),
    }
  }
];

async function main() {
  console.log("=== THÊM 3 SẢN PHẨM NHÓM 2: CHỈNH ẢNH & HỌC TẬP ===");

  // 1. Tìm hoặc tạo Supplier DKEY_API
  let sup = await prisma.supplier.findFirst({ where: { code: "DKEY_API" } });
  if (!sup) {
    sup = await prisma.supplier.create({
      data: {
        code: "DKEY_API",
        name: "DKey Shop (Canboso API)",
        type: "CANBOSO_BUYER",
        baseUrl: "https://canboso.com",
        apiKey: "tgb_67d29cc012c999717a1f645ca0fb0079de354bf09d5af05e",
        depositBankId: "BIDV",
        depositAccountNo: "963869DKEY",
        depositAccountName: "DKEYSHOP MMO",
        depositSyntax: "Nạp qua bot @dkeyshop_bot",
        isActive: true,
      }
    });
    console.log("Đã tạo mới supplier DKEY_API:", sup.id);
  } else {
    console.log("Tìm thấy supplier DKEY_API:", sup.id);
  }

  // 2. Tìm Category Học tập & Thiết kế
  let category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: "hoc-tap-phan-mem" },
        { id: "16537245-a45f-48bc-bc11-d230e67e5332" },
        { name: { contains: "Học tập" } }
      ]
    }
  });

  if (!category) {
    const allCats = await prisma.category.findMany();
    category = allCats[0];
  }
  console.log("Sử dụng danh mục:", category.name, `(${category.id})`);

  // 3. Upsert từng sản phẩm
  for (const item of PRODUCTS_TO_ADD) {
    const existing = await prisma.product.findUnique({
      where: { slug: item.product.slug },
      include: { supplierMapping: true }
    });

    let product;
    const pData = { ...item.product, categoryId: category.id };
    if (existing) {
      product = await prisma.product.update({
        where: { id: existing.id },
        data: pData,
      });
      console.log(`✅ Đã cập nhật SP: ${product.title}`);
    } else {
      product = await prisma.product.create({
        data: pData,
      });
      console.log(`✅ Đã tạo mới SP: ${product.title}`);
    }

    const mData = {
      ...item.mapping,
      productId: product.id,
      supplierId: sup.id,
    };

    if (existing?.supplierMapping) {
      await prisma.supplierProductMapping.update({
        where: { id: existing.supplierMapping.id },
        data: mData,
      });
      console.log(`   -> Cập nhật mapping NCC cho ${product.title}`);
    } else {
      await prisma.supplierProductMapping.create({
        data: mData,
      });
      console.log(`   -> Tạo mới mapping NCC cho ${product.title}`);
    }
  }

  console.log("\n🎉 HOÀN TẤT THÊM 3 SẢN PHẨM NHÓM 2!");
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)));
