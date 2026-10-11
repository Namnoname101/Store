import { describe, it, expect } from "vitest";
import { extractDeliveredSecret } from "../../../src/services/suppliers/secret-parser";

describe("Smart Secret Parser", () => {
  it("should extract external invite/claim links while ignoring Telegram links", () => {
    const raw = `
🎉 ĐƠN HÀNG THÀNH CÔNG!
📦 Gói Gemini Pro & Drive 5TB 18 Tháng
🔗 Link nhận: https://families.google.com/join/claim-token-12345
⚠️ Link có hạn 12h.
Tham gia kênh @notificationshop hoặc https://t.me/notificationshop để nhận ưu đãi!
    `;
    const res = extractDeliveredSecret(raw);
    expect(res.type).toBe("link");
    expect(res.content).toBe("https://families.google.com/join/claim-token-12345");
    expect(res.instructions).toContain("Link có hạn 12h");
  });

  it("should extract pipe-separated email|password credentials", () => {
    const raw = `
Đơn hàng #9981 hoàn tất!
Sản phẩm: Canva Pro 1 Tháng
Thông tin: user123@gmail.com | passSecret123
Vui lòng đổi mật khẩu sau khi nhận!
    `;
    const res = extractDeliveredSecret(raw);
    expect(res.type).toBe("credentials");
    expect(res.content).toBe("user123@gmail.com|passSecret123");
  });

  it("should extract labeled credentials with Tài khoản / Mật khẩu", () => {
    const raw = `
Giao hàng thành công!
Tài khoản: \`duolingo_vip@gmail.com\`
Mật khẩu: \`Pass@12345\`
Bảo hành 12 tháng.
    `;
    const res = extractDeliveredSecret(raw);
    expect(res.type).toBe("credentials");
    expect(res.content).toBe("duolingo_vip@gmail.com|Pass@12345");
  });

  it("should extract license activation keys", () => {
    const raw = `
Đơn hàng phần mềm Office 365:
Key: \`W269N-WFGWX-YVC9B-4J6C9-T83GX\`
Cảm ơn quý khách đã mua hàng!
    `;
    const res = extractDeliveredSecret(raw);
    expect(res.type).toBe("key");
    expect(res.content).toBe("W269N-WFGWX-YVC9B-4J6C9-T83GX");
  });

  it("should return clean text fallback if no specific pattern matches", () => {
    const raw = "Mã PIN đổi quà: 89324";
    const res = extractDeliveredSecret(raw);
    expect(res.type).toBe("text");
    expect(res.content).toBe("Mã PIN đổi quà: 89324");
  });

  it("should recognize notification pointing to attached file as notice-only (empty content)", () => {
    const raw = `
✅ **ĐƠN HÀNG ĐÃ ĐƯỢC GIAO**

🧾 Mã đơn: \`ORD49EDD7D333B4\`
📦 Số lượng: **1**
Nội dung sản phẩm nằm trong file TXT đính kèm.
    `;
    const res = extractDeliveredSecret(raw);
    expect(res.type).toBe("text");
    expect(res.content).toBe("");
    expect(res.isNoticeOnly).toBe(true);
  });

  it("should recognize video check notification as notice-only", () => {
    const raw = `
🎥 **VIDEO KIỂM TRA TRƯỚC GIAO HÀNG**

Đơn: \`ORD49EDD7D333B4\`
Kết quả: **1/1 link LIVE** ✅
    `;
    const res = extractDeliveredSecret(raw);
    expect(res.type).toBe("text");
    expect(res.content).toBe("");
    expect(res.isNoticeOnly).toBe(true);
  });

  it("should extract delivery link from content of attached txt file", () => {
    const fileContent = "https://go.serviceactivation-google.co/subscription/new/ZcdVr-TTSN5iqJNcxdBBrH3PZb0zOSRCaPWd6FLISGTeHvtAzG1gO0JbQ3e6igIYtR5yrp7Mx5hM4gA0fVQSGSKuv9X2l7xQ3ZRsgMhdAdzCn5EW9kdlAiFGE3fy3vdxgcq3RUCtpTyjeGB4AV3e8M14mNtKMfkNJAw2SUeF64Uzvhf-bPLWDujBADQibFkmrYLYVZt9A6s2z7oxxzhEOgohKBSKOes-k46TXjfeiYSxPqoCNEeYhbyWuEnKSm79\n";
    const res = extractDeliveredSecret(fileContent);
    expect(res.type).toBe("link");
    expect(res.content).toContain("serviceactivation-google.co");
  });
});

