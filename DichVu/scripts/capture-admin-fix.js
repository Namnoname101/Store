const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "C:/Users/lehop/.gemini/antigravity/brain/767dcf25-9674-468e-b6cb-22b315b8ef6b/preview";

async function capture() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  console.log("Navigating to /admin/login...");
  await page.goto("http://localhost:3000/admin/login", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "admin_login_isolated.png"),
    fullPage: false,
  });
  console.log("Captured admin_login_isolated.png");

  console.log("Navigating to /...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1000);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "storefront_intact.png"),
    fullPage: false,
  });
  console.log("Captured storefront_intact.png");

  await browser.close();
  console.log("Screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Capture error:", err);
  process.exit(1);
});
