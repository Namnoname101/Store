const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const prod = await prisma.product.findUnique({
    where: { slug: "adobe-full-apps-1-thang" },
    include: { supplierMapping: true }
  });

  if (!prod || !prod.supplierMapping) {
    console.error("Product or mapping not found!");
    return;
  }

  let conf = {};
  try {
    conf = JSON.parse(prod.supplierMapping.customConfig || "{}");
  } catch (e) {}

  conf.alternativeSuppliers = [
    {
      supplierCode: "CHODAUMOI_TELE",
      supplierProductCode: "product|ds_176bv9",
      supplierPrice: 370000,
    }
  ];

  await prisma.supplierProductMapping.update({
    where: { id: prod.supplierMapping.id },
    data: { customConfig: JSON.stringify(conf) }
  });

  console.log("✅ Đã cấu hình CHODAUMOI_TELE làm NCC dự phòng cho Adobe Full Apps 1 Tháng!");
}

main().catch(console.error).finally(() => prisma.$disconnect().then(() => process.exit(0)));
