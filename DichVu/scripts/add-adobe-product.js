const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== THÊM SẢN PHẨM ADOBE FULL APPS 1 THÁNG ===");

  // 1. Tìm hoặc tạo Supplier CHODAUMOI_API
  let sup = await prisma.supplier.findFirst({ where: { code: "CHODAUMOI_API" } });
  if (!sup) {
    sup = await prisma.supplier.create({
      data: {
        code: "CHODAUMOI_API",
        name: "Chợ Đầu Mối (DBot API)",
        type: "DBOT_API",
        baseUrl: "https://dbot.pro.vn",
        apiKey: "dbot_ceb5d392136482bef5617717bb099c1f",
        depositBankId: "ACB",
        depositAccountNo: "31597857",
        depositAccountName: "NGUYEN CUU DUC",
        depositSyntax: "Nạp qua bot @chodaumoi_bot",
        isActive: true,
      }
    });
    console.log("Đã tạo mới supplier CHODAUMOI_API:", sup.id);
  } else {
    console.log("Tìm thấy supplier CHODAUMOI_API:", sup.id);
  }

  // 2. Tìm Category Học tập & Thiết kế
  let category = await prisma.category.findFirst({
    where: {
      OR: [
        { slug: "hoc-tap-phan-mem" },
        { slug: "software" },
        { slug: "phan-mem-ban-quyen" }
      ]
    }
  });

  if (!category) {
    const allCats = await prisma.category.findMany();
    category = allCats[0];
  }
  console.log("Sử dụng danh mục:", category.name, `(${category.id})`);

  // 3. Upsert Product
  const productData = {
    title: "Tài Khoản Adobe Full Apps 1 Tháng (Giao Ngay)",
    slug: "adobe-full-apps-1-thang",
    description: "Tài khoản Adobe Creative Cloud All Apps 1 tháng bản quyền chính hãng cấp sẵn (Photoshop, Illustrator, Premiere Pro, After Effects, Acrobat Pro, Lightroom...). Giao tài khoản tự động tức thì ngay sau khi thanh toán, đăng nhập dùng được trên 2 thiết bị cùng lúc. Bảo hành full 30 ngày.",
    price: 419000,
    originalPrice: 590000,
    type: "ACCOUNT",
    thumbnailUrl: "/images/products/adobe-all-apps.svg",
    isActive: true,
    categoryId: category.id,
    fulfillmentType: "API_DROPSHIP",
    minQuantity: 1,
    maxQuantity: 5,
  };

  const existingProd = await prisma.product.findUnique({
    where: { slug: productData.slug },
    include: { supplierMapping: true }
  });

  let product;
  if (existingProd) {
    product = await prisma.product.update({
      where: { id: existingProd.id },
      data: productData,
    });
    console.log("Đã cập nhật sản phẩm:", product.title, product.id);
  } else {
    product = await prisma.product.create({
      data: productData,
    });
    console.log("Đã tạo mới sản phẩm:", product.title, product.id);
  }

  // 4. Upsert Supplier Mapping
  const mappingData = {
    productId: product.id,
    supplierId: sup.id,
    supplierProductCode: "ds_176bv9", // Mã SP Adobe 1 tháng cấp sẵn của Chợ Đầu Mối
    supplierPrice: 370000,
    supplierStock: 4,
    markupType: "FIXED_AMOUNT",
    markupValue: 49000,
    isAutoSync: true,
    customConfig: JSON.stringify({
      resellerPrice: 395000,
      supplierCost: 370000,
      warrantyPolicy: "Bảo hành full 30 ngày (1 đổi 1). Sử dụng đồng thời 2 thiết bị. Hỗ trợ đầy đủ tính năng AI (Generative Fill, Firefly). Không thay đổi email đăng nhập của tài khoản để duy trì bảo hành."
    }),
  };

  if (existingProd?.supplierMapping) {
    await prisma.supplierProductMapping.update({
      where: { id: existingProd.supplierMapping.id },
      data: mappingData,
    });
    console.log("Đã cập nhật mapping NCC cho sản phẩm.");
  } else {
    await prisma.supplierProductMapping.create({
      data: mappingData,
    });
    console.log("Đã tạo mapping NCC cho sản phẩm.");
  }

  console.log("\n✅ Hoàn tất cấu hình sản phẩm Adobe Full Apps 1 Tháng!");
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)));
