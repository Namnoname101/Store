const fs = require('fs');
const { spawnSync } = require('child_process');
const env = fs.readFileSync('.env', 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { ModelApiService } = require('./dist/services/modelapi/modelapi.service');
// Or use direct fetch with ModelAPI
const apiKey = 'sk-D0wq8qqqIQKHo2NMPSO2xi0udXbdIWbtXpj6FaGiBU7IC67B';
const baseUrl = process.env.MODELAPI_BASE_URL || 'https://modelapi.vn';

async function check() {
  const res = await fetch(baseUrl + '/api/usage/token/', {
    headers: { Authorization: 'Bearer ' + apiKey }
  });
  const data = await res.json();
  console.log('---TOKEN_STATUS---' + JSON.stringify(data) + '---END---');
}

check().catch(e => console.error(e));
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
if (res.stderr && !res.stderr.includes('Connecting')) {
  console.error(res.stderr);
}
