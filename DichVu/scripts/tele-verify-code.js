const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const path = require("path");

async function main() {
  const code = process.argv[2]?.trim();
  const password = process.argv[3]?.trim();

  if (!code) {
    console.error("Vui lòng truyền mã OTP: node scripts/tele-verify-code.js <MÃ_OTP> [MẬT_KHẨU_2FA]");
    process.exit(1);
  }

  const statePath = path.join(__dirname, "../tele-auth-state.json");
  if (!fs.existsSync(statePath)) {
    console.error("Không tìm thấy file tele-auth-state.json. Hãy gửi mã trước.");
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
  const { apiId, apiHash, phoneNumber, phoneCodeHash, sessionString } = state;

  console.log(`Đang xác thực Telegram với số ${phoneNumber} và mã ${code}...`);
  const session = new StringSession(sessionString);
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();

  try {
    const res = await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode: code,
      })
    );
    console.log("SignIn response:", res.className);
  } catch (err) {
    if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
      if (!password) {
        console.log("SESSION_PASSWORD_NEEDED: Tài khoản đang bật bảo mật 2 lớp (2FA). Vui lòng cung cấp mật khẩu 2FA.");
        process.exit(2);
      }
      console.log("Đang nhập mật khẩu 2FA...");
      await client.signInWithPassword({
        password,
      });
    } else {
      throw err;
    }
  }

  const finalSessionString = client.session.save();
  console.log("XÁC THỰC THÀNH CÔNG 100%!");
  console.log("SESSION_STRING_LENGTH:", finalSessionString.length);

  // Save persistent credentials
  const credsPath = path.join(__dirname, "../tele-session.json");
  fs.writeFileSync(
    credsPath,
    JSON.stringify(
      {
        apiId,
        apiHash,
        phoneNumber,
        sessionString: finalSessionString,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log("Đã lưu session vào tele-session.json thành công!");
}

main().catch((err) => {
  console.error("Lỗi xác thực:", err.message || err);
  process.exit(1);
});
