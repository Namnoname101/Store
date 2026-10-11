const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "C:/Users/lehop/.gemini/antigravity/brain/767dcf25-9674-468e-b6cb-22b315b8ef6b/preview";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  // Desktop 1440
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 950 },
  });
  const pageDesktop = await contextDesktop.newPage();

  console.log("Navigating to Desktop view...");
  await pageDesktop.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
  await pageDesktop.waitForTimeout(2000);

  // Scroll directly to API section
  const apiHeader = await pageDesktop.locator("h3:has-text('API')").first();
  if (await apiHeader.count() > 0) {
    await apiHeader.scrollIntoViewIfNeeded();
    await pageDesktop.evaluate(() => window.scrollBy(0, -90));
    await pageDesktop.waitForTimeout(1000);
  }

  // 1. Grouped cards overview with tabs
  await pageDesktop.screenshot({
    path: path.join(ARTIFACT_DIR, "grouped_services_desktop.png"),
    fullPage: false,
  });
  console.log("Captured grouped_services_desktop.png");

  // 2. Select a variant pill on the first card (e.g. Claude or Cursor $50, $100...)
  const variantPills = await pageDesktop.$$("button:has-text('$50'), button:has-text('$100'), button:has-text('50')");
  if (variantPills.length > 0) {
    console.log("Clicking variant pill...");
    await variantPills[0].click();
    await pageDesktop.waitForTimeout(600);
    await pageDesktop.screenshot({
      path: path.join(ARTIFACT_DIR, "grouped_card_variant_active.png"),
      fullPage: false,
    });
    console.log("Captured grouped_card_variant_active.png");
  }

  // 3. Click a sub-brand filter tab (e.g. Claude)
  const claudeTab = await pageDesktop.locator("button:has-text('Claude')").first();
  if (await claudeTab.count() > 0) {
    console.log("Clicking Claude filter tab...");
    await claudeTab.click();
    await pageDesktop.waitForTimeout(800);
    await pageDesktop.screenshot({
      path: path.join(ARTIFACT_DIR, "sub_brand_tab_filtered.png"),
      fullPage: false,
    });
    console.log("Captured sub_brand_tab_filtered.png");
  }

  // 4. Mobile View 390
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const pageMobile = await contextMobile.newPage();

  console.log("Navigating to Mobile view...");
  await pageMobile.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
  await pageMobile.waitForTimeout(2000);

  const apiHeaderMobile = await pageMobile.locator("h3:has-text('API')").first();
  if (await apiHeaderMobile.count() > 0) {
    await apiHeaderMobile.scrollIntoViewIfNeeded();
    await pageMobile.evaluate(() => window.scrollBy(0, -70));
    await pageMobile.waitForTimeout(1000);
  }

  await pageMobile.screenshot({
    path: path.join(ARTIFACT_DIR, "grouped_services_mobile.png"),
    fullPage: false,
  });
  console.log("Captured grouped_services_mobile.png");

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Error capturing:", err);
  process.exit(1);
});
