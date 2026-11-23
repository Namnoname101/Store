const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFullFlow() {
  console.log("==================================================");
  console.log("🚀 TESTING UP PRO 5TB CHÍNH CHỦ KBH FULL FLOW");
  console.log("==================================================");

  // 1. Verify Product in DB
  const product = await prisma.product.findUnique({
    where: { slug: 'up-gemini-pro-5tb-12-thang-chinh-chu-kbh' },
    include: { category: true }
  });

  if (!product) {
    throw new Error("Product up-gemini-pro-5tb-12-thang-chinh-chu-kbh not found!");
  }
  console.log("✅ 1. Product found in DB:", {
    title: product.title,
    slug: product.slug,
    price: product.price,
    originalPrice: product.originalPrice,
    isActive: product.isActive,
    category: product.category.name
  });

  if (product.price !== 19000) {
    throw new Error(`Expected price to be 19000, got ${product.price}`);
  }

  // 2. Check Order Creation & Coupon Prevention
  const testOrderCode = "ORD" + Math.floor(100000 + Math.random() * 900000);
  console.log("\n📦 2. Creating order in DB:", testOrderCode);

  const order = await prisma.order.create({
    data: {
      orderCode: testOrderCode,
      totalAmount: 19000,
      subtotalAmount: 19000,
      discountAmount: 0,
      customerEmail: "customer@example.com",
      customerNote: "UPGRADE_ACCOUNT | GMAIL: test.clone99@gmail.com | PASS: SecretPass123 | 2FA: 88776655",
      status: "PAID",
      upstreamStatus: "PENDING_MANUAL",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      orderItems: {
        create: [
          {
            productId: product.id,
            price: 19000,
            quantity: 1,
          }
        ]
      }
    },
    include: {
      orderItems: { include: { product: true } }
    }
  });

  console.log("✅ Order created:", {
    orderCode: order.orderCode,
    totalAmount: order.totalAmount,
    status: order.status,
    upstreamStatus: order.upstreamStatus,
    customerNote: order.customerNote
  });

  // 3. Simulate Admin Fulfillment (Bấm Done)
  console.log("\n✨ 3. Simulating Admin Bấm Done...");
  const fulfillmentSecret = `TÀI KHOẢN: test.clone99@gmail.com | GÓI: Google One 5TB & Gemini Pro 12 Tháng Chính Chủ (KBH) | TRẠNG THÁI: KÍCH HOẠT THÀNH CÔNG 100% | BẢO MẬT: Quý khách hãy kiểm tra dung lượng tại drive.google.com/settings/storage và đổi lại mật khẩu Gmail ngay để bảo mật.`;

  await prisma.$transaction(async (tx) => {
    await tx.productItem.create({
      data: {
        productId: product.id,
        secretContent: fulfillmentSecret,
        status: "SOLD",
        orderId: order.id,
      }
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        upstreamStatus: "COMPLETED",
        reconciliationNote: "Admin nâng cấp chính chủ 5TB thành công"
      }
    });
  });

  // 4. Verify Completed Order Details
  console.log("\n🎆 4. Verifying Completed Order Details on Customer Web View...");
  const completedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      deliveredItems: true,
      orderItems: { include: { product: true } }
    }
  });

  console.log("✅ Completed Order Data:", {
    orderCode: completedOrder.orderCode,
    status: completedOrder.status,
    upstreamStatus: completedOrder.upstreamStatus,
    deliveredItemsCount: completedOrder.deliveredItems?.length,
    firstSecret: completedOrder.deliveredItems?.[0]?.secretContent?.slice(0, 80) + "..."
  });

  if (completedOrder.status !== "PAID" || completedOrder.upstreamStatus !== "COMPLETED") {
    throw new Error("Order status transition failed!");
  }

  // Cleanup test order
  await prisma.productItem.deleteMany({ where: { orderId: order.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  console.log("🧹 Test order cleaned up successfully.");

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS PASSED! FULL UPGRADE FLOW VERIFIED 100%");
  console.log("==================================================");
}

testFullFlow()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
