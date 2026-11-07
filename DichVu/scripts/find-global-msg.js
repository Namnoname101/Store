const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const credsPath = path.join(__dirname, "../tele-session.json");
const creds = JSON.parse(fs.readFileSync(credsPath, "utf-8"));

async function main() {
  const session = new StringSession(creds.sessionString);
  const client = new TelegramClient(session, creds.apiId, creds.apiHash, {
    connectionRetries: 3,
  });

  await client.connect();
  const res = await client.getMessages(undefined, { search: "luisalfredomadelein", limit: 10 });
  console.log(`Global search found ${res.length} messages:`);
  for (const m of res) {
    const peer = m.peerId ? (m.peerId.userId || m.peerId.channelId || m.peerId.chatId) : "unknown";
    console.log(`From peer ${peer} (msg id ${m.id}): ${m.message}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
