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
    viewport: { width: 1440, height: 900 },
  });
  const pageDesktop = await contextDesktop.newPage();
  
  console.log("Navigating to Desktop view...");
  await pageDesktop.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
  await pageDesktop.waitForTimeout(1000);

  // Capture normal desktop view
  await pageDesktop.screenshot({
    path: path.join(ARTIFACT_DIR, "timeline_desktop_dock.png"),
    fullPage: false,
  });
  console.log("Captured timeline_desktop_dock.png");

  // Hover over the second item in the dock (e.g. Cloud VPS) to capture slide-out effect!
  const dockButtons = await pageDesktop.$$("aside[aria-label='Điều hướng nhanh danh mục'] button");
  if (dockButtons.length > 1) {
    console.log("Hovering over dock button 2 to show expansion...");
    await dockButtons[1].hover();
    await pageDesktop.waitForTimeout(600);
    await pageDesktop.screenshot({
      path: path.join(ARTIFACT_DIR, "timeline_dock_hover.png"),
      fullPage: false,
    });
    console.log("Captured timeline_dock_hover.png");
  }

  // Mobile 390
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const pageMobile = await contextMobile.newPage();
  
  console.log("Navigating to Mobile view...");
  await pageMobile.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 30000 });
  await pageMobile.waitForTimeout(1000);

  await pageMobile.screenshot({
    path: path.join(ARTIFACT_DIR, "timeline_mobile_dense.png"),
    fullPage: false,
  });
  console.log("Captured timeline_mobile_dense.png");

  await browser.close();
  console.log("All screenshots captured successfully!");
}

capture().catch((err) => {
  console.error("Error capturing:", err);
  process.exit(1);
});
