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
  console.log("Connected to Telegram!");

  const dialogs = await client.getDialogs({ limit: 40 });
  console.log("\n--- BOTS IN USER'S TELEGRAM DIALOGS ---");
  for (const d of dialogs) {
    const entity = d.entity;
    if (entity && entity.bot) {
      console.log(`• @${entity.username || "no_username"} - ${entity.firstName} (ID: ${entity.id})`);
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
