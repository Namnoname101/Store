const fs = require('fs');
const { spawn } = require('child_process');

const env = fs.readFileSync('.env', 'utf8');
const tokenMatch = env.match(/FLY_API_TOKEN=([^\r\n]+)/);
const token = tokenMatch ? tokenMatch[1].trim().replace(/['"]/g, '') : '';

// fly logs
const proc = spawn('fly.exe', ['logs', '-a', 'daitruongstore'], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token }
});

let output = '';
proc.stdout.on('data', d => { output += d.toString(); });
proc.stderr.on('data', d => { output += d.toString(); });

setTimeout(() => {
  proc.kill();
  const lines = output.split('\n');
  const relevant = lines.filter(l => l.includes('AssistantDaemon') || l.includes('Msg') || l.includes('Error') || l.includes('error') || l.includes('telegram'));
  console.log('=== MATCHING LINES (' + relevant.length + ') ===');
  console.log(relevant.slice(-30).join('\n'));
  console.log('=== LAST 20 LINES ===');
  console.log(lines.slice(-20).join('\n'));
  process.exit(0);
}, 6000);
