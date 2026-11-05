const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const targetScript = process.argv[2] || 'scripts/inspect-prod-orders.js';
const remoteScript = fs.readFileSync(path.resolve(targetScript), 'utf8');
const b64 = Buffer.from(remoteScript).toString('base64');
const cmd = `sh -c "echo ${b64} | base64 -d | node"`;

// Read .env to get FLY_API_TOKEN
const envContent = fs.readFileSync(path.resolve('.env'), 'utf8');
let token = process.env.FLY_API_TOKEN;
const match = envContent.match(/^\s*FLY_API_TOKEN\s*=\s*["']?(.*?)["']?\s*$/m);
if (match) {
  token = match[1];
}

console.log(`Running ${targetScript} on Fly remote (daitruongstore)...`);
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  encoding: 'utf8',
  timeout: 60000,
  env: {
    ...process.env,
    FLY_API_TOKEN: token,
    FLY_ACCESS_TOKEN: token,
  }
});

if (res.error) {
  console.error('Error:', res.error);
}
if (res.stdout) console.log(res.stdout);
if (res.stderr) console.error(res.stderr);
