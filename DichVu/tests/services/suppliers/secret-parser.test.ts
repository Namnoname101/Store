import { describe, it, expect } from "vitest";
import { extractDeliveredSecret, extractAccountsFromText, sanitizeInstructions } from "@/services/suppliers/secret-parser";

describe("Smart Secret Parser for Supplier Delivery Messages", () => {
  it("should extract CapCut credentials from raw Telegram bot chat and scrub sensitive supplier billing info", () => {
    const rawCapcutMessage = `✅ **ĐƠN HÀNG THÀNH CÔNG**
━━━━━━━━━━━━━━━━
🧾 Mã đơn: \`UUJ87ZSYDY\`
🛒 Sản phẩm: 🎬 **Capcut Pro 30d full Date - BHF**
📊 Số lượng: **1**
💵 Thanh toán: **32.900đ**
💰 Số dư còn lại: **47.452đ**
━━━━━━━━━━━━━━━━
📝 **Mô tả lúc bán:**
Email | Pass
Hiện Full Date 30 ngày
📌 Thông tin tài khoản:
- Định dạng: Email + Mật khẩu (Password)
- Loại tài khoản: Dùng riêng tư

📱 BƯỚC 1: ĐĂNG NHẬP TRÊN ĐIỆN THOẠI (Bắt buộc làm trước)
* Lưu ý: Bạn BẮT BUỘC phải đăng nhập thành công trên điện thoại trước tiên.
1. Mở ứng dụng CapCut trên điện thoại.
2. Chọn mục "Sign in with email" (Đăng nhập bằng email).
3. Nhập địa chỉ Email và Mật khẩu (Password) của tài khoản được cung cấp.
4. Bấm Đăng nhập để hoàn tất.

💻 BƯỚC 2: ĐĂNG NHẬP TRÊN MÁY TÍNH / PC (Nếu cần)
Sau khi đã đăng nhập thành công trên điện thoại, tiến hành quét mã QR để đăng nhập PC:
- Trên iPhone (iOS): Mở CapCut -> Vào mục "Tôi" (Profile) -> Chọn biểu tượng Quét mã QR ở góc trên -> Quét mã QR trên màn hình CapCut PC.
- Trên Android: Cập nhật CapCut lên phiên bản mới nhất -> Sử dụng tính năng Quét QR trong app -> Quét mã QR trên màn hình CapCut PC.
Bảo hành 30 ngày
━━━━━━━━━━━━━━━━
🔐 **THÔNG TIN TÀI KHOẢN**
1)
\`ObergVillagran786@outlook.com 1234567\`
━━━━━━━━━━━━━━━━
⚠️ Vui lòng lưu lại thông tin.
💚 Cảm ơn bạn đã mua hàng tại shop!`;

    const parsed = extractDeliveredSecret(rawCapcutMessage);

    expect(parsed.type).toBe("credentials");
    expect(parsed.content).toBe("ObergVillagran786@outlook.com|1234567");
    expect(parsed.deliveredKeys).toEqual(["ObergVillagran786@outlook.com|1234567"]);

    // CRITICAL: Ensure sensitive supplier info is NEVER leaked in instructions
    expect(parsed.instructions).not.toContain("32.900");
    expect(parsed.instructions).not.toContain("47.452");
    expect(parsed.instructions).not.toContain("UUJ87ZSYDY");
    expect(parsed.instructions).not.toContain("Thanh toán");
    expect(parsed.instructions).not.toContain("Số dư còn lại");
    expect(parsed.instructions).not.toContain("Cảm ơn bạn đã mua hàng tại shop");

    // Helpful user instructions are preserved
    expect(parsed.instructions).toContain("BƯỚC 1: ĐĂNG NHẬP TRÊN ĐIỆN THOẠI");
    expect(parsed.instructions).toContain("BƯỚC 2: ĐĂNG NHẬP TRÊN MÁY TÍNH / PC");
  });

  it("should extract standard pipe-separated credentials", () => {
    const res = extractDeliveredSecret("test.account@gmail.com|SuperPassword@888");
    expect(res.type).toBe("credentials");
    expect(res.content).toBe("test.account@gmail.com|SuperPassword@888");
    expect(res.deliveredKeys).toEqual(["test.account@gmail.com|SuperPassword@888"]);
  });

  it("should extract pipe credentials with 2FA key", () => {
    const res = extractDeliveredSecret("user@domain.com|pass123|2FASECRET");
    expect(res.type).toBe("credentials");
    expect(res.content).toBe("user@domain.com|pass123|2FASECRET");
  });

  it("should extract space-separated credentials in backticks or lines", () => {
    const res = extractDeliveredSecret("`myuser@hotmail.com 12345678`");
    expect(res.type).toBe("credentials");
    expect(res.content).toBe("myuser@hotmail.com|12345678");
  });

  it("should extract colon-separated credentials", () => {
    const res = extractDeliveredSecret("service.ai@outlook.com:PassSecure99");
    expect(res.type).toBe("credentials");
    expect(res.content).toBe("service.ai@outlook.com|PassSecure99");
  });

  it("should extract multi-line labeled credentials (Tài khoản & Mật khẩu)", () => {
    const text = `Tài khoản: pro.user@gmail.com\nMật khẩu: Secret12345\nLưu ý đăng nhập sớm`;
    const res = extractDeliveredSecret(text);
    expect(res.type).toBe("credentials");
    expect(res.content).toBe("pro.user@gmail.com|Secret12345");
  });

  it("should extract short label credentials (TK & MK)", () => {
    const text = `TK: vip.member@yahoo.com\nMK: MemberPass888`;
    const res = extractDeliveredSecret(text);
    expect(res.type).toBe("credentials");
    expect(res.content).toBe("vip.member@yahoo.com|MemberPass888");
  });

  it("should extract multiple accounts when quantity > 1", () => {
    const text = `DANH SÁCH TÀI KHOẢN:\n1) user1@gmail.com pass1\n2) user2@gmail.com pass2`;
    const res = extractDeliveredSecret(text);
    expect(res.type).toBe("credentials");
    expect(res.deliveredKeys).toEqual(["user1@gmail.com|pass1", "user2@gmail.com|pass2"]);
  });

  it("should extract license key and API tokens", () => {
    const resKey = extractDeliveredSecret("Key: VK7JG-NPHTM-C97JM-9MPGT-3V66T");
    expect(resKey.type).toBe("key");
    expect(resKey.content).toBe("VK7JG-NPHTM-C97JM-9MPGT-3V66T");

    const resToken = extractDeliveredSecret("API Token của bạn: `sk-ant-api03-abcdef1234567890abcdef`");
    expect(resToken.type).toBe("key");
    expect(resToken.content).toBe("sk-ant-api03-abcdef1234567890abcdef");
  });

  it("should extract external invite links while excluding Telegram internal links", () => {
    const res = extractDeliveredSecret("Vào nhóm hỗ trợ t.me/supporthere và nhận link gia đình: https://families.google.com/join/xyz123");
    expect(res.type).toBe("link");
    expect(res.content).toBe("https://families.google.com/join/xyz123");
  });

  it("should detect balance and error notices as notice-only", () => {
    const res = extractDeliveredSecret("Số dư ví không đủ để mua sản phẩm này. Vui lòng nạp thêm tiền.");
    expect(res.isNoticeOnly).toBe(true);
    expect(res.content).toBe("");
  });
});
