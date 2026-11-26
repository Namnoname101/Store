# DaiTruong-helper v3.0 (Unified Claude Desktop & OpenAI Codex Helper)

**Mục đích:** Công cụ 1-Click cấu hình đồng thời **Claude Desktop Gateway** (Claude Opus 5.5 & Sonnet 5.5 + mở khóa Import Chat) và **OpenAI Codex CLI / App** (`gpt-6.1-sol`), hỗ trợ cả **Windows 10/11** (`DaiTruong-helper.exe`) và **macOS** (`DaiTruong-helper.command`).

---

## Tính năng nổi bật (v3.0)

- **Giao diện 2 Tab riêng biệt (Zinc Dark Native UI)**:
  - **Tab 1 — Claude Desktop:** Kiểm tra hạn mức Key thời gian thực qua `genzshop.vn/api/check-usage.php` (đầy đủ header `Origin`/`Referer`), sao lưu DPAPI/Plist, nạp cấu hình Gateway `https://1gw.gwai.cloud`, mở khóa sẵn tính năng **Import & export** lịch sử trò chuyện từ `claude.ai` và tự động khởi động lại Claude Desktop.
  - **Tab 2 — OpenAI Codex:** Kiểm tra hạn mức Key thời gian thực qua `modelapi.vn/api/usage/token/` (cảnh báo nếu nhập nhầm Profile Token), tự nhận diện & hỗ trợ 1-Click cài đặt `@openai/codex` CLI, sao lưu & ghi `~/.codex/config.toml` (`gpt-6.1-sol`) + `~/.codex/auth.json` (khóa phân quyền bảo mật Windows ACL / macOS `chmod 600`).
- **Đa nền tảng (Windows & macOS)**:
  - **Windows 10 & 11:** Chạy trực tiếp `DaiTruong-helper.exe` (Native C# WPF, ~126 KB, không cần cài runtime phụ).
  - **macOS (Apple Silicon & Intel):** Nhấp đúp mở `DaiTruong-helper.command` để mở giao diện 2 Tab đồng bộ trên macOS.

---

## Cấu trúc mã nguồn & Build

- `src/DaiTruongHelper.cs`: Mã nguồn Native C# WPF cho Windows (`DaiTruong-helper.exe`).
- `src/DaiTruong-helper.command`: Script ứng dụng giao diện 2 Tab cho macOS.
- `HUONG_DAN.txt`: Tài liệu hướng dẫn đi kèm trong file `.zip`.
- `build.bat`: Biên dịch trực tiếp bằng trình biên dịch `csc.exe` có sẵn trên Windows.
