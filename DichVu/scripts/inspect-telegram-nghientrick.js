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

  const messages = await client.getMessages("nghientrickshop_bot", { limit: 10 });

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    console.log(`\n================ Message #${i} (ID: ${m.id}) ================`);
    console.log("Text:\n", m.text);
    if (m.media) {
      console.log("Media className:", m.media.className);
      if (m.media.document) {
        console.log("Mime type:", m.media.document.mimeType);
        for (const attr of m.media.document.attributes || []) {
          if (attr.fileName) console.log("File name:", attr.fileName);
        }
        if (m.media.document.mimeType.includes("text") || m.media.document.mimeType.includes("plain")) {
          const buf = await client.downloadMedia(m);
          console.log("TXT file content:\n", buf.toString("utf-8"));
        }
      }
    }
  }

  await client.disconnect();
}

main().catch(console.error);
