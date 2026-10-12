const fs = require('fs');
const { spawnSync } = require('child_process');

const remoteScript = fs.readFileSync('scripts/check-ord626949.js', 'utf8');
const b64 = Buffer.from(remoteScript).toString('base64');
const cmd = `sh -c "echo ${b64} | base64 -d | node"`;

console.log('Sending update-thumbnails.js to Fly remote...');
const res = spawnSync('fly.exe', ['ssh', 'console', '-C', cmd], {
  encoding: 'utf8',
  timeout: 45000,
});

if (res.error) {
  console.error('Error:', res.error);
}
console.log('STDOUT:', res.stdout);
console.log('STDERR:', res.stderr);
