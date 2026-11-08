const https = require('https');

https.get('https://daitruongstore.fly.dev/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('[STATUS]', res.statusCode);
    const checks = ['Xingtu VIP', 'Photoroom', 'Quizlet Plus', 'Figma Pro'];
    for (const c of checks) {
      console.log(`Contains "${c}":`, data.includes(c));
    }
  });
}).on('error', console.error);
