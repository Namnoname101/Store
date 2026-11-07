const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const OUTPUT_DIR = path.resolve(__dirname, "../../docs/ux-redesign-v2/screenshots");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Helper: Generate authentic user_session cookie token
function createDemoUserSessionToken(userId, username, role = "CUSTOMER") {
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

const SAMPLE_CART_ITEMS = [
  {
    productId: "931c7c9b-f83e-47cb-8ffe-c239a63f4efe",
    title: "API Claude 10$ Max (10$ Credit)",
    slug: "api-claude-10-max-10-credit",
    price: 18000,
    originalPrice: 25000,
    thumbnailUrl: "/images/products/claude-api.svg",
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 10,
    stockCount: 15,
    fulfillmentType: "LICENSE_KEY",
    categorySlug: "ai-api",
    requiresLink: false,
    selected: true,
  },
  {
    productId: "duo-super-12m",
    title: "Duolingo Super Học Ngoại Ngữ 12 Tháng",
    slug: "duolingo-super-12-thang",
    price: 70000,
    originalPrice: 120000,
    thumbnailUrl: null,
    quantity: 1,
    minQuantity: 1,
    maxQuantity: 5,
    stockCount: 8,
    fulfillmentType: "COURSE_LINK",
    categorySlug: "hoc-tap-ngoai-ngu",
    requiresLink: false,
    selected: true,
  },
];

const BLUEPRINT_JOBS = [
  // 1. Storefront
  { id: "01-storefront-desktop-dark", url: "/", viewport: { width: 1440, height: 900 }, theme: "dark" },
  { id: "01-storefront-desktop-light", url: "/", viewport: { width: 1440, height: 900 }, theme: "light" },
  { id: "01-storefront-mobile-dark", url: "/", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "dark" },
  { id: "01-storefront-mobile-light", url: "/", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "light" },
  {
    id: "01-quickview-modal-dark",
    url: "/",
    viewport: { width: 1440, height: 900 },
    theme: "dark",
    action: async (page) => {
      const qvBtn = page.locator("button[aria-label^='Xem nhanh'], button[title='Xem nhanh']").first();
      if ((await qvBtn.count()) > 0) {
        await qvBtn.click();
        await page.waitForTimeout(600);
      }
    },
  },

  // 2. PDP (Using active license product: api-claude-10-max-10-credit)
  { id: "02-pdp-desktop-dark", url: "/products/api-claude-10-max-10-credit", viewport: { width: 1440, height: 900 }, theme: "dark" },
  {
    id: "02-pdp-desktop-light",
    url: "/products/api-claude-10-max-10-credit",
    viewport: { width: 1440, height: 900 },
    theme: "light",
    action: async (page) => {
      const techTab = page.locator("#tab-technical, button:has-text('Thông số kỹ thuật')").first();
      if ((await techTab.count()) > 0) {
        await techTab.click();
        await page.waitForTimeout(500);
      }
    },
  },
  { id: "02-pdp-mobile-dark", url: "/products/api-claude-10-max-10-credit", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "dark" },
  { id: "02-pdp-mobile-light", url: "/products/api-claude-10-max-10-credit", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "light" },

  // 3. Cart (Seed localStorage so active rows, steppers, and coupon input render)
  {
    id: "03-cart-drawer-desktop-dark",
    url: "/",
    viewport: { width: 1440, height: 900 },
    theme: "dark",
    needsCart: true,
    action: async (page) => {
      const cartBtn = page.locator("button[aria-label='Mở giỏ hàng']").first();
      if ((await cartBtn.count()) > 0) {
        await cartBtn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  {
    id: "03-cart-drawer-mobile-dark",
    url: "/",
    viewport: { width: 375, height: 812, isMobile: true, hasTouch: true },
    theme: "dark",
    needsCart: true,
    action: async (page) => {
      const cartBtn = page.locator("button[aria-label='Mở giỏ hàng']").first();
      if ((await cartBtn.count()) > 0) {
        await cartBtn.click();
        await page.waitForTimeout(600);
      }
    },
  },
  { id: "03-cart-page-desktop-light", url: "/cart", viewport: { width: 1440, height: 900 }, theme: "light", needsCart: true },
  { id: "03-cart-page-mobile-light", url: "/cart", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "light", needsCart: true },

  // 4. Checkout
  { id: "04-checkout-vietqr-desktop-dark", url: "/checkout/DEMO-CHECKOUT", viewport: { width: 1440, height: 900 }, theme: "dark" },
  { id: "04-checkout-vietqr-desktop-light", url: "/checkout/DEMO-CHECKOUT", viewport: { width: 1440, height: 900 }, theme: "light" },
  { id: "04-checkout-vietqr-mobile-dark", url: "/checkout/DEMO-CHECKOUT", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "dark" },
  { id: "04-checkout-vietqr-mobile-light", url: "/checkout/DEMO-CHECKOUT", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "light" },
  { id: "04-checkout-expired-desktop-dark", url: "/checkout/DEMO-EXPIRED", viewport: { width: 1440, height: 900 }, theme: "dark" },

  // 5. Handover
  { id: "05-handover-masked-desktop-dark", url: "/order-success/DEMO-CODEX", viewport: { width: 1440, height: 900 }, theme: "dark" },
  {
    id: "05-handover-unmasked-desktop-light",
    url: "/order-success/DEMO-CODEX",
    viewport: { width: 1440, height: 900 },
    theme: "light",
    action: async (page) => {
      const eyeBtn = page.locator("button[aria-label='Hiện mã bí mật'], button[aria-label*='Hiện mật khẩu']").first();
      if ((await eyeBtn.count()) > 0) {
        await eyeBtn.click();
        await page.waitForTimeout(500);
      }
    },
  },
  { id: "05-handover-mobile-dark", url: "/order-success/DEMO-CODEX", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "dark" },
  { id: "05-handover-mobile-light", url: "/order-success/DEMO-CODEX", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "light" },

  // 6. Developer Zone
  { id: "06-developer-quota-desktop-dark", url: "/developer/usage?key=sk-modelapi-demo7455abcd1234efgh5678ijkl9012", viewport: { width: 1440, height: 900 }, theme: "dark" },
  { id: "06-developer-quota-desktop-light", url: "/developer/usage?key=sk-modelapi-demo7455abcd1234efgh5678ijkl9012", viewport: { width: 1440, height: 900 }, theme: "light" },
  { id: "06-developer-quota-mobile-dark", url: "/developer/usage?key=sk-modelapi-demo7455abcd1234efgh5678ijkl9012", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "dark" },
  { id: "06-developer-quota-mobile-light", url: "/developer/usage?key=sk-modelapi-demo7455abcd1234efgh5678ijkl9012", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "light" },
  { id: "06-check-usage-desktop-dark", url: "/check-usage", viewport: { width: 1440, height: 900 }, theme: "dark" },

  // 7. Guides
  { id: "07-guide-claude-desktop-dark", url: "/huong-dan/api-claude", viewport: { width: 1440, height: 900 }, theme: "dark" },
  {
    id: "07-guide-claude-desktop-light",
    url: "/huong-dan/api-claude",
    viewport: { width: 1440, height: 900 },
    theme: "light",
    action: async (page) => {
      const cursorTab = page.locator("button:has-text('Cursor AI')").first();
      if ((await cursorTab.count()) > 0) {
        await cursorTab.click();
        await page.waitForTimeout(500);
      }
    },
  },
  { id: "07-guide-claude-mobile-dark", url: "/huong-dan/api-claude", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "dark" },
  { id: "07-guide-codex-desktop-dark", url: "/huong-dan/codex", viewport: { width: 1440, height: 900 }, theme: "dark" },

  // 8. Profile & Topup (Needs authentication session cookie)
  { id: "08-profile-wallet-desktop-dark", url: "/profile", viewport: { width: 1440, height: 900 }, theme: "dark", needsAuth: true },
  { id: "08-profile-wallet-desktop-light", url: "/profile", viewport: { width: 1440, height: 900 }, theme: "light", needsAuth: true },
  { id: "08-topup-preset-mobile-dark", url: "/topup", viewport: { width: 375, height: 812, isMobile: true, hasTouch: true }, theme: "dark", needsAuth: true },
  { id: "08-topup-vietqr-desktop-dark", url: "/topup/DEMO-TOPUP", viewport: { width: 1440, height: 900 }, theme: "dark" },
];

async function run() {
  console.log(`Starting capture of ${BLUEPRINT_JOBS.length} screenshot jobs into: ${OUTPUT_DIR}`);
  const browser = await chromium.launch({ channel: "msedge", headless: true });

  const sessionToken = createDemoUserSessionToken("94c3daab-6439-4ad4-949b-2b955a195423", "testuser3", "CUSTOMER");

  for (let i = 0; i < BLUEPRINT_JOBS.length; i++) {
    const job = BLUEPRINT_JOBS[i];
    console.log(`[${i + 1}/${BLUEPRINT_JOBS.length}] Capturing ${job.id} (${job.theme})...`);
    try {
      const context = await browser.newContext({
        viewport: { width: job.viewport.width, height: job.viewport.height },
        isMobile: job.viewport.isMobile || false,
        hasTouch: job.viewport.hasTouch || false,
        colorScheme: job.theme,
      });

      if (job.needsAuth) {
        await context.addCookies([
          {
            name: "user_session",
            value: sessionToken,
            domain: "localhost",
            path: "/",
            httpOnly: true,
            sameSite: "Lax",
          },
        ]);
      }

      if (job.needsCart) {
        await context.addInitScript((items) => {
          try {
            window.localStorage.setItem("khodee_cart_items", JSON.stringify(items));
            window.localStorage.setItem("daitruong_cart_items", JSON.stringify(items));
            window.localStorage.setItem("khodee_auto_coupon", "CHAOBANMOI");
          } catch {}
        }, SAMPLE_CART_ITEMS);
      }

      const page = await context.newPage();
      await page.goto(`${BASE_URL}${job.url}`, { waitUntil: "networkidle", timeout: 30000 });

      // Explicitly set html theme class
      await page.evaluate((theme) => {
        if (theme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }, job.theme);

      await page.waitForTimeout(600);

      if (job.action) {
        try {
          await job.action(page);
        } catch (actErr) {
          console.warn(`Action warning for ${job.id}:`, actErr.message);
        }
      }

      const savePath = path.join(OUTPUT_DIR, `${job.id}.png`);
      await page.screenshot({ path: savePath, fullPage: false });
      console.log(`  ✓ Saved: ${savePath}`);
      await context.close();
    } catch (err) {
      console.error(`  ✗ Failed ${job.id}:`, err.message);
    }
  }

  await browser.close();
  console.log("Screenshot capture process completed!");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
