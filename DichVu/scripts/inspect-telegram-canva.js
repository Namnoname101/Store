const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');

const apiId = 30557242;
const apiHash = "2ade2dd2c0c5a42e9d3e7b224dac9337";
const sessionStr = process.env.TELEGRAM_USER_SESSION || "${process.env.TELEGRAM_USER_SESSION || ''}";

async function run() {
  const client = new TelegramClient(new StringSession(sessionStr), apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();

  const botEntity = await client.getEntity("shopxoainon_bot");
  const messages = await client.getMessages(botEntity, { limit: 10 });

  console.log('--- LAST 10 MESSAGES FROM shopxoainon_bot ---');
  for (const m of messages) {
    console.log({
      id: m.id,
      date: new Date(m.date * 1000).toISOString(),
      out: m.out,
      text: m.message
    });
  }

  await client.disconnect();
}

run().catch(console.error);
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
if (res.stderr) console.error('STDERR:', res.stderr);
