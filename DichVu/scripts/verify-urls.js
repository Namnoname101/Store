const https = require('https');

const urls = [
  'https://daitruongstore.fly.dev/products/xingtu-vip-30-ngay',
  'https://daitruongstore.fly.dev/products/quizlet-plus-1-thang',
  'https://daitruongstore.fly.dev/products/photoroom-max-7-ngay'
];

async function checkUrl(u) {
  return new Promise((resolve) => {
    https.get(u, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const titleMatch = data.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'No title';
        console.log(`[STATUS ${res.statusCode}] ${u} -> Title: ${title}`);
        resolve();
      });
    }).on('error', (err) => {
      console.error(`[ERROR] ${u}:`, err.message);
      resolve();
    });
  });
}

async function run() {
  for (const u of urls) {
    await checkUrl(u);
  }
}

run();
