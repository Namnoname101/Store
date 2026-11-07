const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const localScript = fs.readFileSync(path.resolve('scripts/telegram-assistant-daemon.js'), 'utf8');
const b64 = Buffer.from(localScript).toString('base64');

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/^\s*FLY_API_TOKEN\s*=\s*["']?(.*?)["']?\s*$/m);
const token = match ? match[1] : '';

const proc = spawn('fly.exe', ['ssh', 'console', '-a', 'daitruongstore'], {
  env: {
    ...process.env,
    FLY_API_TOKEN: token,
    FLY_ACCESS_TOKEN: token,
  }
});

let out = '';
proc.stdout.on('data', d => { out += d.toString(); });
proc.stderr.on('data', d => { out += d.toString(); });

// Write commands via stdin chunks
proc.stdin.write(`cat << 'EOF' | base64 -d > /app/scripts/telegram-assistant-daemon.js\n${b64}\nEOF\n`);
proc.stdin.write(`kill -9 $(pgrep -f "telegram-assistant-daemon.js") 2>/dev/null || true\n`);
proc.stdin.write(`nohup node /app/scripts/telegram-assistant-daemon.js >> /var/log/tele-daemon.log 2>&1 &\n`);
proc.stdin.write(`sleep 2\n`);
proc.stdin.write(`ps aux | grep telegram\n`);
proc.stdin.write(`exit\n`);
proc.stdin.end();

proc.on('close', (code) => {
  console.log('Output from Fly SSH stdin session:');
  console.log(out);
  console.log('Exit code:', code);
});
