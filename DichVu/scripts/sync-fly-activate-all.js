const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const scriptContent = fs.readFileSync(path.resolve(__dirname, 'activate-all-storefront-products.js'), 'utf8');
const b64 = Buffer.from(scriptContent).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;

console.log("Pushing activate-all script to Fly.io production container...");
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
if (res.stderr) console.error(res.stderr);
