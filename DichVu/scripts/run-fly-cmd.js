const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const tokenMatch = env.match(/FLY_API_TOKEN=([^\r\n]+)/);
if (!tokenMatch) {
  console.error("FLY_API_TOKEN not found in .env");
  process.exit(1);
}
const token = tokenMatch[1].trim().replace(/['"]/g, '');

const cmd = process.argv.slice(2).join(' ') || 'status -a daitruongstore';
console.log(`Running: fly ${cmd}`);

try {
  const output = execSync(`fly ${cmd}`, {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
    stdio: 'inherit'
  });
} catch (e) {
  console.error("Command failed:", e.message);
  process.exit(1);
}
