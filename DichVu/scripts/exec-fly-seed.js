const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const envContent = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
const match = envContent.match(/^\s*FLY_API_TOKEN\s*=\s*["']?(.*?)["']?\s*$/m);
const token = match ? match[1].trim() : '';

const proc = spawn('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', 'node scripts/seed-gemini-argon.js'], {
  cwd: path.resolve(__dirname, '..'),
  env: {
    ...process.env,
    FLY_API_TOKEN: token,
    FLY_ACCESS_TOKEN: token,
  },
  stdio: 'inherit'
});

proc.on('close', (code) => {
  console.log(`Fly SSH seed finished with code: ${code}`);
  process.exit(code);
});
