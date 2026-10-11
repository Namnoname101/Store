const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

async function main() {
  const creds = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../tele-session.json"), "utf-8")
  );

  const client = new TelegramClient(
    new StringSession(creds.sessionString),
    Number(creds.apiId),
    creds.apiHash,
    { connectionRetries: 5 }
  );

  await client.connect();
  console.log("Connected to Telegram!");

  const messages = await client.getMessages("shopxoainon_bot", { limit: 5 });

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    console.log(`\n--- Message #${i} (ID: ${m.id}) ---`);
    console.log("Text:", m.text);
    console.log("Has media:", !!m.media);
    if (m.media) {
      console.log("Media type:", m.media.className);
      try {
        const buffer = await client.downloadMedia(m);
        if (buffer) {
          console.log("Downloaded buffer size:", buffer.length);
          console.log("Downloaded content preview:\n", buffer.toString("utf-8"));
        }
      } catch (err) {
        console.error("Failed to download media:", err);
      }
    }
  }

  await client.disconnect();
}

main().catch(console.error);
