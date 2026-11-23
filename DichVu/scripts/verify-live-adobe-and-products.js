const puppeteer = require('puppeteer');
const path = require('path');

async function main() {
  console.log('--- CAPTURING LIVE VERIFICATION SCREENSHOTS ---');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Visit Catalog Filtered by Adobe
  console.log('Navigating to Adobe catalog...');
  await page.goto('https://daitruongstore.fly.dev/?brand=adobe#catalog', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'live_adobe_catalog.png' });
  console.log('Saved live_adobe_catalog.png');

  // 2. Visit Adobe Express Product Detail
  console.log('Navigating to Adobe Express product page...');
  await page.goto('https://daitruongstore.fly.dev/products/adobe-express-12-thang', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'live_adobe_express_detail.png' });
  console.log('Saved live_adobe_express_detail.png');

  // 3. Visit CapCut 7 Days Product Detail (Check strict 1-device & logout rules)
  console.log('Navigating to CapCut 7 Days product page...');
  await page.goto('https://daitruongstore.fly.dev/products/capcut-pro-7-ngay', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'live_capcut_detail.png' });
  console.log('Saved live_capcut_detail.png');

  await browser.close();
  console.log('--- ALL LIVE SCREENSHOTS CAPTURED ---');
}

main().catch(console.error);
