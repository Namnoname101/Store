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

  // DSHOP media
  const dshop = await client.getEntity("mmo_dshop_bot");
  const dshopMsgs = await client.getMessages(dshop, { limit: 2 });
  const dshopMsg = dshopMsgs.find(m => !m.out && m.media);
  if (dshopMsg) {
    const buf = await client.downloadMedia(dshopMsg);
    fs.writeFileSync(path.join(__dirname, "../dshop-qr.jpg"), buf);
    console.log("Saved dshop-qr.jpg, size:", buf.length);
  }

  // CHODAUMOI media
  const cdm = await client.getEntity("chodaumoi_bot");
  const cdmMsgs = await client.getMessages(cdm, { limit: 2 });
  const cdmMsg = cdmMsgs.find(m => !m.out && m.media);
  if (cdmMsg) {
    const buf = await client.downloadMedia(cdmMsg);
    fs.writeFileSync(path.join(__dirname, "../chodaumoi-qr.jpg"), buf);
    console.log("Saved chodaumoi-qr.jpg, size:", buf.length);
  }
}

main().catch(console.error).finally(() => process.exit(0));
