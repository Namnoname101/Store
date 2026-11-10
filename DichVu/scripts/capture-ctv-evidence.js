const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const ARTIFACT_DIR = path.resolve("C:/Users/lehop/.gemini/antigravity/brain/b5d38039-9fec-443b-a5bb-fb7c203c13d3");
const LOCAL_DIR = path.resolve(__dirname, "../docs/screenshots/ctv");
if (!fs.existsSync(LOCAL_DIR)) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
}
const BASE_URL = "http://localhost:3005";

function createSessionCookie(userId, username, role = "CUSTOMER") {
  const secret =
    process.env.USER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "digistore-user-secure-fallback-secret-2026";
  const payload = {
    userId,
    username,
    role,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

async function seedData() {
  console.log("Seeding test accounts for screenshots...");

  // 1. Normal user (Logged in, NOT CTV)
  const normalUser = await prisma.user.upsert({
    where: { username: "quang_tester" },
    update: {
      isAffiliate: false,
      affiliateCode: null,
      balance: 50000,
    },
    create: {
      id: "user-normal-screenshot-demo",
      username: "quang_tester",
      email: "quang.tester@gmail.com",
      passwordHash: "dummy:hash",
      role: "CUSTOMER",
      balance: 50000,
      isAffiliate: false,
    },
  });

  // 2. Affiliate CTV user (Logged in, PRO tier, full stats)
  const ctvUser = await prisma.user.upsert({
    where: { username: "nam_affiliate" },
    update: {
      isAffiliate: true,
      affiliateCode: "CTV_NAM_PRO",
      affiliateTier: "PRO",
      balance: 385000,
      totalCommission: 1420000,
      totalAffOrders: 28,
      bankName: "Techcombank",
      bankAccountNumber: "1903678912345",
      bankAccountName: "NGUYEN THANH NAM",
    },
    create: {
      id: "user-ctv-screenshot-demo",
      username: "nam_affiliate",
      email: "nam.affiliate@gmail.com",
      passwordHash: "dummy:hash",
      role: "CUSTOMER",
      balance: 385000,
      totalCommission: 1420000,
      totalAffOrders: 28,
      isAffiliate: true,
      affiliateCode: "CTV_NAM_PRO",
      affiliateTier: "PRO",
      bankName: "Techcombank",
      bankAccountNumber: "1903678912345",
      bankAccountName: "NGUYEN THANH NAM",
    },
  });

  // Affiliate coupon
  await prisma.coupon.upsert({
    where: { code: "CTV_NAM_PRO" },
    update: {
      type: "PERCENT",
      value: 5,
      affiliateUserId: ctvUser.id,
      affiliateRate: 15.0,
      usedCount: 28,
      isActive: true,
    },
    create: {
      code: "CTV_NAM_PRO",
      type: "PERCENT",
      value: 5,
      affiliateRate: 15.0,
      affiliateUserId: ctvUser.id,
      usedCount: 28,
      isActive: true,
    },
  });

  // Clean old dummy transactions for demo
  await prisma.walletTransaction.deleteMany({
    where: { userId: ctvUser.id },
  });

  // Insert recent affiliate commissions
  const txs = [
    {
      userId: ctvUser.id,
      type: "AFFILIATE_COMMISSION",
      amount: 45000,
      balanceBefore: 340000,
      balanceAfter: 385000,
      description: "Hoa hồng CTV từ đơn #ORD982312 (Mã: CTV_NAM_PRO)",
      createdAt: new Date(Date.now() - 1000 * 60 * 35),
    },
    {
      userId: ctvUser.id,
      type: "AFFILIATE_COMMISSION",
      amount: 30000,
      balanceBefore: 310000,
      balanceAfter: 340000,
      description: "Hoa hồng CTV từ đơn #ORD891455 (Mã: CTV_NAM_PRO)",
      createdAt: new Date(Date.now() - 1000 * 60 * 180),
    },
    {
      userId: ctvUser.id,
      type: "AFFILIATE_COMMISSION",
      amount: 60000,
      balanceBefore: 250000,
      balanceAfter: 310000,
      description: "Hoa hồng CTV từ đơn #ORD771230 (Mã: CTV_NAM_PRO)",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
  ];

  for (const tx of txs) {
    await prisma.walletTransaction.create({ data: tx });
  }

  // Insert withdrawal history
  await prisma.withdrawalRequest.deleteMany({
    where: { userId: ctvUser.id },
  });

  await prisma.withdrawalRequest.create({
    data: {
      withdrawalCode: "WTH889123",
      userId: ctvUser.id,
      amount: 500000,
      bankName: "Techcombank",
      accountNumber: "1903678912345",
      accountName: "NGUYEN THANH NAM",
      status: "APPROVED",
      adminNote: "Đã chuyển khoản VietQR thành công",
      paidAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50),
    },
  });

  await prisma.withdrawalRequest.create({
    data: {
      withdrawalCode: "WTH994512",
      userId: ctvUser.id,
      amount: 250000,
      bankName: "Techcombank",
      accountNumber: "1903678912345",
      accountName: "NGUYEN THANH NAM",
      status: "PENDING",
      createdAt: new Date(Date.now() - 1000 * 60 * 40),
    },
  });

  return { normalUser, ctvUser };
}

async function saveScreenshot(page, filename) {
  const localPath = path.join(LOCAL_DIR, filename);
  await page.screenshot({ path: localPath, fullPage: false });
  try {
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    fs.copyFileSync(localPath, artifactPath);
  } catch (e) {
    console.warn("Could not copy to artifact dir:", e.message);
  }
  console.log("Saved:", filename);
}

async function capture() {
  const { normalUser, ctvUser } = await seedData();

  const normalCookie = createSessionCookie(normalUser.id, normalUser.username);
  const ctvCookie = createSessionCookie(ctvUser.id, ctvUser.username);

  const browser = await chromium.launch({ channel: "msedge", headless: true });

  console.log("Starting screenshots capture...");

  // --- 1. GUEST: Homepage with Guides Dropdown showing CTV link ---
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Open Guides dropdown
    const guidesButton = page.locator("button:has-text('Hướng Dẫn')");
    if (await guidesButton.isVisible()) {
      await guidesButton.click();
      await page.waitForTimeout(300);
    }
    await saveScreenshot(page, "01-guest-navbar-dropdown.png");
    await context.close();
  }

  // --- 2. GUEST: /ctv landing page (hero, commission table, login CTA) ---
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/ctv`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    await saveScreenshot(page, "02-guest-ctv-landing.png");

    // Scroll down to register form showing login button
    const regForm = page.locator("#register-form");
    if (await regForm.isVisible()) {
      await regForm.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await saveScreenshot(page, "03-guest-ctv-register-form.png");
    }
    await context.close();
  }

  // --- 3. LOGGED-IN NON-CTV USER: /ctv landing with active account recognition ---
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([
      {
        name: "user_session",
        value: normalCookie,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/ctv`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const regForm = page.locator("#register-form");
    if (await regForm.isVisible()) {
      await regForm.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      await saveScreenshot(page, "04-logged-in-non-ctv-form.png");
    }
    await context.close();
  }

  // --- 4. LOGGED-IN CTV: Navbar showing dedicated CTV Management button ---
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([
      {
        name: "user_session",
        value: ctvCookie,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    // Open Guides dropdown to see "Bảng Quản Lý CTV"
    const guidesButton = page.locator("button:has-text('Hướng Dẫn')");
    if (await guidesButton.isVisible()) {
      await guidesButton.click();
      await page.waitForTimeout(300);
    }
    await saveScreenshot(page, "05-ctv-navbar-dropdown.png");
    await context.close();
  }

  // --- 5. LOGGED-IN CTV: /dashboard/affiliate overview (Stats & Referral code) ---
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.addCookies([
      {
        name: "user_session",
        value: ctvCookie,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/dashboard/affiliate`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);

    await saveScreenshot(page, "06-ctv-dashboard-overview.png");

    // Scroll to commissions and withdrawals history tables
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(400);
    await saveScreenshot(page, "07-ctv-history-tables.png");

    // Click "Yêu Cầu Rút Tiền" to open modal
    const withdrawBtn = page.locator("button:has-text('Yêu Cầu Rút Tiền')");
    if (await withdrawBtn.isVisible()) {
      await withdrawBtn.click();
      await page.waitForTimeout(400);
      await saveScreenshot(page, "08-ctv-withdrawal-modal.png");
    }
    await context.close();
  }

  // --- 6. MOBILE VIEWPORT (390px): Mobile Menu Drawer for CTV ---
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
    });
    await context.addCookies([
      {
        name: "user_session",
        value: ctvCookie,
        domain: "localhost",
        path: "/",
        httpOnly: true,
      },
    ]);
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    // Open mobile hamburger
    const hamburger = page.locator("button[aria-label='Toggle menu']");
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(400);
      await saveScreenshot(page, "09-mobile-ctv-drawer.png");
    }
    await context.close();
  }

  await browser.close();
  await prisma.$disconnect();
  console.log("All screenshots successfully captured and stored in artifact directory!");
}

capture().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
