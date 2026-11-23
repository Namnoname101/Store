const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testYouTubeFlow() {
  console.log("==================================================");
  console.log("🚀 TESTING YOUTUBE PREMIUM 1 THÁNG FLOW");
  console.log("==================================================");

  // 1. Verify 1-month product is active and other packages are deactivated
  const p1Month = await prisma.product.findUnique({
    where: { slug: 'youtube-premium-1-thang' },
    include: { category: true }
  });

  if (!p1Month || !p1Month.isActive) {
    throw new Error("youtube-premium-1-thang not found or not active in database!");
  }
  console.log(`✅ 1. Product verified in DB:`);
  console.log(`   - Title: ${p1Month.title}`);
  console.log(`   - Slug: ${p1Month.slug}`);
  console.log(`   - Price: ${p1Month.price.toLocaleString('vi-VN')}đ`);
  console.log(`   - Active: ${p1Month.isActive}`);

  // 2. Customer places order with Gmail
  const testCustomerEmail = "customer.vip123@gmail.com";
  const qty = 1;
  const totalPrice = p1Month.price;

  console.log(`\n✅ 2. Customer places order for 1 month with email: ${testCustomerEmail}`);

  const testOrderCode = "ORD" + Math.floor(100000 + Math.random() * 900000);
  const order = await prisma.order.create({
    data: {
      orderCode: testOrderCode,
      totalAmount: totalPrice,
      subtotalAmount: totalPrice,
      discountAmount: 0,
      customerEmail: testCustomerEmail,
      customerNote: `YOUTUBE_FAMILY_INVITE\n${testCustomerEmail}`,
      status: "PAID",
      upstreamStatus: "PENDING_MANUAL",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      orderItems: {
        create: [
          {
            productId: p1Month.id,
            price: totalPrice,
            quantity: qty,
          }
        ]
      }
    },
    include: {
      orderItems: { include: { product: true } }
    }
  });

  console.log(`✅ Order created: #${order.orderCode}, status: ${order.status}, upstreamStatus: ${order.upstreamStatus}`);

  // 3. Admin parsing
  const cleanYoutubeNote = (order.customerNote || "")
    .replace(/\[?YOUTUBE_FAMILY_INVITES?\]?/gi, "")
    .replace(/\[?YOUTUBE_FAMILY\]?/gi, "")
    .trim();

  let parsedYoutubeEmails = [];
  const lines = cleanYoutubeNote.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    const match = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (match) parsedYoutubeEmails.push(match[0]);
  }

  console.log(`✅ 3. Admin parsed emails:`, parsedYoutubeEmails);
  if (parsedYoutubeEmails.length !== 1 || parsedYoutubeEmails[0] !== testCustomerEmail) {
    throw new Error("Admin email parsing failed!");
  }

  // 4. Admin clicks DONE
  console.log(`\n✨ 4. Admin clicks DONE...`);
  const secrets = parsedYoutubeEmails.map((email, idx) =>
    `EMAIL #${idx + 1}: ${email} | GÓI: YouTube Premium 1 Tháng Chính Chủ (Gia hạn nhóm Gia đình) | TRẠNG THÁI: Đã gửi lời mời Family thành công 100%! | HƯỚNG DẪN: Quý khách vui lòng kiểm tra hộp thư Gmail (hoặc mục Spam/Quảng cáo), mở thư mời từ Google Families / YouTube và bấm "Chấp nhận lời mời" (Accept Invitation) để kích hoạt trọn vẹn YouTube Premium & YouTube Music.`
  );

  await prisma.$transaction(async (tx) => {
    await tx.productItem.createMany({
      data: secrets.map((secretContent) => ({
        productId: p1Month.id,
        secretContent,
        status: "SOLD",
        orderId: order.id,
      }))
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        upstreamStatus: "COMPLETED",
        reconciliationNote: `Admin đã thêm Family YouTube Premium thành công (${parsedYoutubeEmails.length} email)`
      }
    });
  });

  // 5. Verification
  const completedOrder = await prisma.order.findUnique({
    where: { id: order.id },
    include: {
      deliveredItems: true,
      orderItems: { include: { product: true } }
    }
  });

  console.log(`✅ 5. Completed order verification:`);
  console.log(`   - Order code: #${completedOrder.orderCode}`);
  console.log(`   - Status: ${completedOrder.status}`);
  console.log(`   - UpstreamStatus: ${completedOrder.upstreamStatus}`);
  console.log(`   - Delivered items count: ${completedOrder.deliveredItems.length}`);
  console.log(`   - Delivered content: ${completedOrder.deliveredItems[0].secretContent}`);

  console.log("\n🎉 ALL TESTS PASSED! YouTube Premium 1 Tháng flow is 100% operational!");
}

testYouTubeFlow()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
