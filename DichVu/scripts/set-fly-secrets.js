const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
const match = envContent.match(/^\s*FLY_API_TOKEN\s*=\s*["']?(.*?)["']?\s*$/m);
const token = match ? match[1].trim() : '';

console.log('Setting secrets on Fly.io...');
const res = spawnSync('fly.exe', ['secrets', 'set', 'CRON_SECRET=daemon-internal-khodee-2024', '--app', 'daitruongstore'], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log('stdout:', res.stdout);
console.log('stderr:', res.stderr);
console.log('exitCode:', res.status);
