const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3009";

const VIEWPORTS = [
  { name: "desktop_1920", width: 1920, height: 1080, isMobile: false },
  { name: "desktop_1440", width: 1440, height: 900, isMobile: false },
  { name: "tablet_768", width: 768, height: 1024, isMobile: false },
  { name: "mobile_390", width: 390, height: 844, isMobile: true },
  { name: "mobile_375", width: 375, height: 667, isMobile: true },
  { name: "mobile_320", width: 320, height: 568, isMobile: true },
];

const SCREENSHOT_DIRS = [
  path.resolve(__dirname, "../.superpowers/qa-screenshots"),
  path.resolve("C:/Users/lehop/.gemini/antigravity/brain/767dcf25-9674-468e-b6cb-22b315b8ef6b/screenshots"),
];

SCREENSHOT_DIRS.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function saveScreenshot(page, filename) {
  for (const dir of SCREENSHOT_DIRS) {
    const fullPath = path.join(dir, filename);
    await page.screenshot({ path: fullPath, fullPage: true });
  }
  console.log(`Saved screenshot: ${filename}`);
}

async function checkHorizontalOverflow(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const winWidth = window.innerWidth;
    const bodyWidth = document.body.scrollWidth;
    const hasOverflow = docWidth > winWidth || bodyWidth > winWidth;
    return {
      hasOverflow,
      docWidth,
      winWidth,
      bodyWidth,
      diff: Math.max(docWidth, bodyWidth) - winWidth,
    };
  });
}

async function runStorefrontQA() {
  console.log("=== STARTING STOREFRONT BROWSER QA AUDIT ===");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const auditReport = {
    timestamp: new Date().toISOString(),
    viewportsTested: [],
    overflowIssues: [],
    brokenLinks: [],
    consoleErrors: [],
    pagesAudited: [],
  };

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      auditReport.consoleErrors.push(msg.text());
    }
  });

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    // 1. Homepage (Dark mode default)
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    const hpOverflow = await checkHorizontalOverflow(page);
    if (hpOverflow.hasOverflow) {
      auditReport.overflowIssues.push({ page: "Homepage", viewport: vp.name, ...hpOverflow });
    }
    await saveScreenshot(page, `homepage_${vp.name}_dark.png`);

    // 2. Homepage (Light mode)
    const themeBtn = await page.$('button[aria-label*="giao diện"], button[aria-label*="chế độ"], button[aria-label*="Sáng"], button[aria-label*="Tối"]');
    if (themeBtn && await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(400);
      await saveScreenshot(page, `homepage_${vp.name}_light.png`);
      // Toggle back to dark
      await themeBtn.click();
      await page.waitForTimeout(400);
    } else {
      // On mobile viewports, theme toggle may be inside mobile drawer
      const menuBtn = await page.$('button[aria-label*="menu" i], button[aria-label*="Menu" i], button:has(svg.lucide-menu)');
      if (menuBtn && await menuBtn.isVisible()) {
        await menuBtn.click();
        await page.waitForTimeout(400);
        await saveScreenshot(page, `mobile_menu_drawer_${vp.name}.png`);
        const drawerThemeBtn = await page.$('button[aria-label*="giao diện"], button[aria-label*="chế độ"], button[aria-label*="Sáng"], button[aria-label*="Tối"]');
        if (drawerThemeBtn && await drawerThemeBtn.isVisible()) {
          await drawerThemeBtn.click();
          await page.waitForTimeout(400);
          await saveScreenshot(page, `homepage_${vp.name}_light.png`);
          await drawerThemeBtn.click();
          await page.waitForTimeout(400);
        }
        const closeMenu = await page.$('button[aria-label*="Đóng" i], button[aria-label*="close" i], button:has(svg.lucide-x)');
        if (closeMenu && await closeMenu.isVisible()) await closeMenu.click();
        await page.waitForTimeout(300);
      }
    }

    // 3. Quick View on Homepage
    const quickViewBtn = await page.$('button:has-text("Xem nhanh"), [data-testid="quick-view-btn"]');
    if (quickViewBtn && !vp.isMobile) {
      await quickViewBtn.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, `quickview_modal_${vp.name}.png`);
      // Close quick view
      const closeBtn = await page.$('button[aria-label="Đóng"], button:has-text("✕"), button:has-text("Đóng")');
      if (closeBtn) await closeBtn.click();
      await page.waitForTimeout(300);
    }

    // 4. Product Detail Page
    await page.goto(`${BASE_URL}/products/netflix-1-month`, { waitUntil: "networkidle" });
    const pdpOverflow = await checkHorizontalOverflow(page);
    if (pdpOverflow.hasOverflow) {
      auditReport.overflowIssues.push({ page: "Product Detail", viewport: vp.name, ...pdpOverflow });
    }
    await saveScreenshot(page, `product_detail_${vp.name}.png`);

    // 5. Cart Page
    await page.goto(`${BASE_URL}/cart`, { waitUntil: "networkidle" });
    const cartOverflow = await checkHorizontalOverflow(page);
    if (cartOverflow.hasOverflow) {
      auditReport.overflowIssues.push({ page: "Cart", viewport: vp.name, ...cartOverflow });
    }
    await saveScreenshot(page, `cart_${vp.name}.png`);

    // 6. Order Lookup Page
    await page.goto(`${BASE_URL}/lookup`, { waitUntil: "networkidle" });
    const lookupOverflow = await checkHorizontalOverflow(page);
    if (lookupOverflow.hasOverflow) {
      auditReport.overflowIssues.push({ page: "Lookup", viewport: vp.name, ...lookupOverflow });
    }
    await saveScreenshot(page, `lookup_${vp.name}.png`);

    auditReport.viewportsTested.push(vp.name);
  }

  // 7. Check for Broken links on Homepage
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href]"))
      .map((a) => a.getAttribute("href"))
      .filter((href) => href && href.startsWith("/") && !href.startsWith("/#"));
  });

  const uniqueLinks = Array.from(new Set(links));
  console.log(`\nAuditing ${uniqueLinks.length} internal links for 404 dead ends...`);

  for (const link of uniqueLinks) {
    const res = await page.goto(`${BASE_URL}${link}`, { waitUntil: "domcontentloaded" });
    const status = res ? res.status() : 500;
    if (status >= 400) {
      auditReport.brokenLinks.push({ link, status });
      console.log(`[DEAD LINK] ${link} returned status ${status}`);
    } else {
      console.log(`[OK] ${link} -> ${status}`);
    }
  }

  await browser.close();

  const reportPath = path.resolve(__dirname, "../.superpowers/qa-screenshots/audit-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  console.log("\nStorefront QA Audit Completed! Report written to:", reportPath);
  console.log("Summary:", {
    viewportsTested: auditReport.viewportsTested.length,
    overflowIssues: auditReport.overflowIssues.length,
    brokenLinks: auditReport.brokenLinks.length,
    consoleErrors: auditReport.consoleErrors.length,
  });
}

runStorefrontQA().catch((err) => {
  console.error("QA Audit failed with error:", err);
  process.exit(1);
});
