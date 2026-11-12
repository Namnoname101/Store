const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const proc = spawn('fly.exe', ['deploy', '--remote-only', '-a', 'daitruongstore'], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  shell: true
});

proc.stdout.on('data', (d) => process.stdout.write(d));
proc.stderr.on('data', (d) => process.stderr.write(d));
proc.on('close', (code) => console.log('\n[FLY DEPLOY FINISHED] Exit code:', code));
