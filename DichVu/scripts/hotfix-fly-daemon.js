const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const localScript = fs.readFileSync(path.resolve('scripts/telegram-assistant-daemon.js'), 'utf8');
const b64 = Buffer.from(localScript).toString('base64');

// Script to run remotely on Fly
const remoteCmd = `sh -c '
echo "Writing updated daemon to /app/scripts/telegram-assistant-daemon.js..."
echo "${b64}" | base64 -d > /app/scripts/telegram-assistant-daemon.js

echo "Finding and stopping old daemon PID..."
PIDS=$(pgrep -f "telegram-assistant-daemon.js" || true)
if [ -n "$PIDS" ]; then
  echo "Killing old daemon PIDs: $PIDS"
  kill -9 $PIDS 2>/dev/null || true
fi

echo "Starting new daemon in background..."
nohup node /app/scripts/telegram-assistant-daemon.js >> /var/log/tele-daemon.log 2>&1 &
NEW_PID=$!
echo "New daemon started with PID $NEW_PID"
sleep 2
ps aux | grep telegram-assistant-daemon
'`;

const envContent = fs.readFileSync('.env', 'utf8');
const match = envContent.match(/^\s*FLY_API_TOKEN\s*=\s*["']?(.*?)["']?\s*$/m);
const token = match ? match[1] : '';

console.log('Deploying hotfix to Fly remote (daitruongstore)...');
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', remoteCmd], {
  encoding: 'utf8',
  timeout: 60000,
  env: {
    ...process.env,
    FLY_API_TOKEN: token,
    FLY_ACCESS_TOKEN: token,
  }
});

if (res.error) console.error('Error:', res.error);
if (res.stdout) console.log(res.stdout);
if (res.stderr) console.error(res.stderr);
