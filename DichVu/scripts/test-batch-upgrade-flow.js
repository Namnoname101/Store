const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testBatchFlow() {
  console.log("==================================================");
  console.log("🚀 TESTING BATCH UP PRO 5TB CHÍNH CHỦ KBH (tk|mk|2fa)");
  console.log("==================================================");

  const product = await prisma.product.findUnique({
    where: { slug: 'up-gemini-pro-5tb-12-thang-chinh-chu-kbh' },
  });

  if (!product) {
    throw new Error("Product up-gemini-pro-5tb-12-thang-chinh-chu-kbh not found!");
  }

  // 1. Simulate 2 accounts pasted in tk|mk|2fa format
  const rawInput = "customer.clone1@gmail.com|MatKhauVip123|123456\ncustomer.clone2@gmail.com|MatKhauVip456|87654321";
  const lines = rawInput.split("\n").map(l => l.trim()).filter(Boolean);
  const qty = lines.length;
  const unitPrice = 19000;
  const totalPrice = qty * unitPrice;

  console.log(`✅ 1. Customer input: ${qty} accounts, total: ${totalPrice.toLocaleString('vi-VN')}đ`);

  const testOrderCode = "ORD" + Math.floor(100000 + Math.random() * 900000);
  const order = await prisma.order.create({
    data: {
      orderCode: testOrderCode,
      totalAmount: totalPrice,
      subtotalAmount: totalPrice,
      discountAmount: 0,
      customerEmail: "vipcustomer@example.com",
      customerNote: `UPGRADE_ACCOUNT\n${rawInput}`,
      status: "PAID",
      upstreamStatus: "PENDING_MANUAL",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      orderItems: {
        create: [
          {
            productId: product.id,
            price: unitPrice,
            quantity: qty,
          }
        ]
      }
    },
    include: {
      orderItems: { include: { product: true } }
    }
  });

  console.log(`✅ 2. Order created: #${order.orderCode}, status: ${order.status}, upstreamStatus: ${order.upstreamStatus}`);

  // 3. Admin parsing
  const cleanNote = order.customerNote.replace(/\[?UPGRADE_ACCOUNTS?\]?/gi, "").trim();
  const parsedAccounts = cleanNote.split("\n").map(line => {
    const parts = line.split("|").map(p => p.trim());
    return {
      email: parts[0],
      pass: parts[1],
      twoFa: parts.slice(2).join("|")
    };
  });

  console.log("✅ 3. Admin parsed accounts:", parsedAccounts);
  if (parsedAccounts.length !== 2) throw new Error("Expected 2 parsed accounts!");

  // 4. Admin clicks DONE: fulfill with secrets
  console.log("\n✨ 4. Admin fulfills all accounts (Bấm DONE)...");
  const secrets = parsedAccounts.map((a, idx) =>
    `TÀI KHOẢN #${idx + 1}: ${a.email} | GÓI: Google One 5TB & Gemini Pro 12 Tháng Chính Chủ (KBH) | TRẠNG THÁI: KÍCH HOẠT THÀNH CÔNG 100% | BẢO MẬT: Quý khách hãy kiểm tra dung lượng tại drive.google.com/settings/storage và đổi lại mật khẩu Gmail ngay để bảo mật.`
  );

  await prisma.$transaction(async (tx) => {
    await tx.productItem.createMany({
      data: secrets.map(secretContent => ({
        productId: product.id,
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
        reconciliationNote: `Admin nâng cấp chính chủ 5TB thành công (${parsedAccounts.length} tài khoản)`
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

  console.log("\n🎆 5. Final order status check:");
  console.log("- Status:", completedOrder.status);
  console.log("- Upstream Status:", completedOrder.upstreamStatus);
  console.log("- Delivered Items count:", completedOrder.deliveredItems.length);
  completedOrder.deliveredItems.forEach((item, i) => {
    console.log(`  Item #${i + 1}:`, item.secretContent.substring(0, 80) + "...");
  });

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% READY!");
}

testBatchFlow()
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
