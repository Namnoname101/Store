import prisma from "../src/lib/prisma";
import { computeKeyFingerprint, maskApiKey } from "../src/lib/key-security";

async function seedAllDemoFixtures() {
  console.log("Seeding QA demo fixtures...");

  let product = await prisma.product.findFirst({
    where: { OR: [{ slug: { contains: "codex" } }, { title: { contains: "Codex" } }] },
  });

  if (!product) {
    let cat = await prisma.category.findFirst();
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: "AI & API", slug: "ai-api" },
      });
    }
    product = await prisma.product.create({
      data: {
        title: "Gói Codex 10$ Credit",
        slug: "codex-credit-10usd",
        description: "5.000.000 Quota Points — Thích hợp dùng thử cá nhân hoặc test bot",
        price: 12000,
        type: "LICENSE_KEY",
        categoryId: cat.id,
      },
    });
  }

  const demoCodes = ["DEMO-CODEX", "DEMO-CHECKOUT", "DEMO-EXPIRED"];
  for (const code of demoCodes) {
    await prisma.paymentIntent.deleteMany({ where: { order: { orderCode: code } } }).catch(() => {});
    await prisma.productItem.deleteMany({ where: { order: { orderCode: code } } }).catch(() => {});
    await prisma.orderItem.deleteMany({ where: { order: { orderCode: code } } }).catch(() => {});
    await prisma.order.deleteMany({ where: { orderCode: code } }).catch(() => {});
  }

  // 1. DEMO-CODEX (Paid with delivered secret key)
  const orderCodex = await prisma.order.create({
    data: {
      orderCode: "DEMO-CODEX",
      customerEmail: "demo@daitruong.com",
      customerNote: "0988888888",
      totalAmount: 12000,
      subtotalAmount: 12000,
      status: "PAID",
      upstreamStatus: "COMPLETED",
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      orderItems: {
        create: {
          productId: product.id,
          price: product.price,
          quantity: 1,
        },
      },
      deliveredItems: {
        create: {
          productId: product.id,
          secretContent: "sk-modelapi-demo7455abcd1234efgh5678ijkl9012",
          status: "SOLD",
        },
      },
    },
  });
  console.log("Created DEMO-CODEX:", orderCodex.orderCode);

  // 2. DEMO-CHECKOUT (Active VietQR checkout)
  const orderCheckout = await prisma.order.create({
    data: {
      orderCode: "DEMO-CHECKOUT",
      customerEmail: "guest@example.com",
      customerNote: "Test payment note",
      totalAmount: 12000,
      subtotalAmount: 12000,
      status: "PENDING",
      upstreamStatus: "NOT_APPLICABLE",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      orderItems: {
        create: {
          productId: product.id,
          price: product.price,
          quantity: 1,
        },
      },
      paymentIntents: {
        create: {
          intentCode: "PI_DEMO_CHECKOUT",
          qrUrl: "https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=12000&addInfo=DEMO-CHECKOUT",
          amount: 12000,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
    },
  });
  console.log("Created DEMO-CHECKOUT:", orderCheckout.orderCode);

  // 3. DEMO-EXPIRED (Expired order with regenerate QR prompt)
  const orderExpired = await prisma.order.create({
    data: {
      orderCode: "DEMO-EXPIRED",
      customerEmail: "expired@example.com",
      totalAmount: 12000,
      subtotalAmount: 12000,
      status: "EXPIRED",
      upstreamStatus: "NOT_APPLICABLE",
      expiresAt: new Date(Date.now() - 60 * 1000),
      orderItems: {
        create: {
          productId: product.id,
          price: product.price,
          quantity: 1,
        },
      },
      paymentIntents: {
        create: {
          intentCode: "PI_DEMO_EXPIRED",
          qrUrl: "https://img.vietqr.io/image/MB-0987654321-compact2.png?amount=12000&addInfo=DEMO-EXPIRED",
          amount: 12000,
          status: "EXPIRED",
          expiresAt: new Date(Date.now() - 60 * 1000),
        },
      },
    },
  });
  console.log("Created DEMO-EXPIRED:", orderExpired.orderCode);

  // 4. Seed Developer API Key Binding
  const demoApiKey = "sk-modelapi-demo7455abcd1234efgh5678ijkl9012";
  const fingerprint = computeKeyFingerprint(demoApiKey);
  const masked = maskApiKey(demoApiKey);

  await prisma.customerApiKeyBinding.deleteMany({
    where: { OR: [{ keyFingerprint: fingerprint }, { upstreamTokenId: 7455999 }] },
  }).catch(() => {});

  const binding = await prisma.customerApiKeyBinding.create({
    data: {
      keyFingerprint: fingerprint,
      maskedKey: masked,
      keyName: "KhoDEE Demo Production Key",
      upstreamTokenId: 7455999,
      status: "ACTIVE",
      totalCreditUsd: 10.0,
      lastSyncedAt: new Date(),
    },
  });
  console.log("Created CustomerApiKeyBinding:", binding.keyName, binding.maskedKey);

  // 5. Seed Demo User & Wallet Transactions
  let user = await prisma.user.findFirst({
    where: { OR: [{ username: "demouser" }, { username: "testuser3" }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: "94c3daab-6439-4ad4-949b-2b955a195423",
        username: "testuser3",
        passwordHash: "dummy-salt:dummy-hash",
        role: "CUSTOMER",
        balance: 350000,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { balance: 350000 },
    });
  }
  console.log("Ensured User:", user.username, "| Balance:", user.balance);

  await prisma.walletTransaction.deleteMany({ where: { userId: user.id } }).catch(() => {});
  await prisma.walletTransaction.createMany({
    data: [
      {
        userId: user.id,
        type: "TOPUP",
        amount: 500000,
        balanceBefore: 0,
        balanceAfter: 500000,
        referenceId: "NAP829140",
        description: "Nạp tiền tự động qua VietQR - NAP829140",
      },
      {
        userId: user.id,
        type: "ORDER_PAYMENT",
        amount: -150000,
        balanceBefore: 500000,
        balanceAfter: 350000,
        referenceId: "ORD-8942",
        description: "Thanh toán đơn hàng ORD-8942 bằng số dư ví",
      },
    ],
  });

  // 6. Seed DEMO-TOPUP with explicit createdAt & expiresAt
  await prisma.paymentTransaction.deleteMany({ where: { depositOrder: { depositCode: "DEMO-TOPUP" } } }).catch(() => {});
  await prisma.depositOrder.deleteMany({ where: { depositCode: "DEMO-TOPUP" } }).catch(() => {});

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);

  const deposit = await prisma.depositOrder.create({
    data: {
      depositCode: "DEMO-TOPUP",
      userId: user.id,
      amount: 50000,
      status: "PENDING",
      createdAt: now,
      expiresAt: expiresAt,
    },
  });
  console.log("Created DEMO-TOPUP:", deposit.depositCode, "| expiresAt:", deposit.expiresAt.toISOString());

  console.log("ALL_DEMO_FIXTURES_SEEDED_SUCCESSFULLY");
  process.exit(0);
}

seedAllDemoFixtures().catch((e) => {
  console.error(e);
  process.exit(1);
});
