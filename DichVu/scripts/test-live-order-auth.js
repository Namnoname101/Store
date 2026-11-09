const https = require('https');

async function testPostOrder() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      items: [{ productId: 'dummy-id', quantity: 1 }],
    });

    const options = {
      hostname: 'daitruongstore.fly.dev',
      port: 443,
      path: '/api/orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('[TEST /api/orders without session]');
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Request error:', e.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
}

testPostOrder();
