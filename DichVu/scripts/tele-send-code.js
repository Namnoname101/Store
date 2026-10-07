const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

const apiId = 30557242;
const apiHash = "2ade2dd2c0c5a42e9d3e7b224dac9337";
const phoneNumber = "+84774483215";

async function main() {
  console.log("Connecting to Telegram MTProto...");
  const session = new StringSession("");
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log("Connected to Telegram servers!");

  console.log(`Sending authentication code to ${phoneNumber}...`);
  const { phoneCodeHash, isCodeViaApp } = await client.sendCode(
    { apiId, apiHash },
    phoneNumber
  );

  console.log(`Code sent! viaApp: ${isCodeViaApp}, phoneCodeHash: ${phoneCodeHash}`);

  // Save session state for the next step (verifying OTP)
  const state = {
    apiId,
    apiHash,
    phoneNumber,
    phoneCodeHash,
    sessionString: client.session.save(),
    createdAt: new Date().toISOString(),
  };

  const statePath = path.join(__dirname, "../tele-auth-state.json");
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
  console.log("Saved auth state to tele-auth-state.json successfully.");
}

main().catch((err) => {
  console.error("Error sending Telegram code:", err);
  process.exit(1);
});
