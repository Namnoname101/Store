const https = require('https');

const urls = [
  'https://daitruongstore.fly.dev/',
  'https://daitruongstore.fly.dev/cart',
  'https://daitruongstore.fly.dev/products/xingtu-vip-30-ngay',
  'https://daitruongstore.fly.dev/login',
  'https://daitruongstore.fly.dev/register'
];

async function check(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`[PAGE STATUS ${res.statusCode}] ${url}`);
      resolve();
    }).on('error', (e) => {
      console.error(`Error on ${url}:`, e.message);
      resolve();
    });
  });
}

async function run() {
  for (const u of urls) {
    await check(u);
  }
}

run();
