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

  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 950 },
  });
  const page = await contextDesktop.newPage();

  console.log("Navigating to Desktop view...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);

  // 1. Capture API Section
  const apiHeader = await page.locator("h3:has-text('API')").first();
  if (await apiHeader.count() > 0) {
    await apiHeader.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -90));
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "clean_api_section.png"),
      fullPage: false,
    });
    console.log("Captured clean_api_section.png");
  }

  // 2. Capture AI Account Section (Gemini 18 Thang, ChatGPT Plus)
  const aiAccountHeader = await page.locator("h3:has-text('Tài Khoản AI')").first();
  if (await aiAccountHeader.count() > 0) {
    await aiAccountHeader.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -90));
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "clean_ai_account_section.png"),
      fullPage: false,
    });
    console.log("Captured clean_ai_account_section.png");
  }

  // 3. Capture Software & App License Section (CapCut Pro, Canva, Office...)
  const softwareHeader = await page.locator("h3:has-text('Bản Quyền'), h3:has-text('Phần Mềm')").first();
  if (await softwareHeader.count() > 0) {
    await softwareHeader.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -90));
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "clean_software_capcut_section.png"),
      fullPage: false,
    });
    console.log("Captured clean_software_capcut_section.png");
  }

  await browser.close();
  console.log("All clean section screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Error capturing:", err);
  process.exit(1);
});
