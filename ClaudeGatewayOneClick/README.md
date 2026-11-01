# Khodee Gateway OneClick (Windows)

**Mục đích:** Cấu hình Gateway cho ứng dụng Claude Desktop chính chủ và bật tính năng Import chat từ Claude.ai chỉ với 1 cú click.

---

## 🚀 Cách sử dụng (Dành cho người dùng)

1. Tải và cài đặt Claude Desktop chính chủ từ: https://claude.com/download (nếu chưa cài).
2. Tải hoặc mở file **`KhodeeGateway.exe`**.
3. **Dán API Key** của bạn vào ô duy nhất.
4. Nhấn **`⚡ AUTO CONFIGURE`** > xác nhận đồng ý.
5. **Thoát hoàn toàn Claude Desktop** (tắt cả icon dưới System Tray góc phải nếu còn chạy) và mở lại.
6. Vào `Settings` > `Import & export` trong Claude Desktop để đăng nhập và nhập lịch sử chat từ Claude.ai.
7. Khi chat, API Claude name mặc định sẽ là **`instruct`**.

---

## ⚙️ Cấu hình mặc định (Đã thiết lập sẵn)

| Thiết lập | Giá trị | Ghi chú |
|---|---|---|
| **Preset** | `Instruct API` | Chuẩn bị sẵn cho hệ thống |
| **Gateway Base URL** | `https://1gw.gwai.cloud` | Endpoint proxy gateway |
| **Auth Scheme** | `x-api-key` | Header xác thực |
| **Model ID** | `instruct` | Tên model hiển thị & gọi inference |
| **Chat Import** | `Bật` | Cho phép import lịch sử từ Claude.ai |
| **Export Session** | `Tắt` | Tránh lộ data cục bộ |

> 💡 Người dùng nâng cao có thể bấm vào dòng **`▶ Nâng cao`** trên giao diện để xem các thông số hoặc dùng tính năng **Test API** và **Restore Backup**.

---

## 🛡️ Bảo mật & An toàn

- **Tự động sao lưu**: Trước khi ghi bất kỳ cấu hình nào, ứng dụng luôn tạo bản sao lưu mã hoá DPAPI tại `%LOCALAPPDATA%\KhodeeGateway\backups\`.
- **Khôi phục dễ dàng**: Có thể hoàn tác về cấu hình cũ bằng nút `Restore Backup` bất kỳ lúc nào.
- **Không bao giờ log key**: API Key không bị ghi vào file log, không gửi đi đâu ngoại trừ ghi vào Registry chính sách của Windows (`HKCU\SOFTWARE\Policies\Claude`) mà Claude Desktop yêu cầu.
- **Không cần quyền Administrator**: Chỉ ghi vào nhánh `HKCU` của tài khoản hiện tại, không đụng tới file hệ thống hay `HKLM`.

---

## 🛠️ Build lại từ mã nguồn

Nếu muốn tự chỉnh sửa và build lại file EXE:
- Chạy file `build.bat` (tự động cài `ps2exe` và compile trực tiếp sang `KhodeeGateway.exe`).
- Hoặc chỉnh sửa mã nguồn GUI tại `src/interface.ps1`.
