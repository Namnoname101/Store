const fs = require('fs');
const { spawnSync } = require('child_process');
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();
const res = spawnSync('fly.exe', ['status', '-a', 'daitruongstore'], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});
console.log(res.stdout || res.stderr);
