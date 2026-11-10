const fs = require('fs');
const { spawnSync } = require('child_process');
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

console.log('Seeding products on Fly.io production...');
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', 'node scripts/seed-3-new-products.js'], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log('STDOUT:\n', res.stdout);
console.log('STDERR:\n', res.stderr);
console.log('EXIT CODE:', res.status);
