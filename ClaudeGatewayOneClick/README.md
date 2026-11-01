# Khodee Gateway OneClick v0.3.3 (Windows)

**Mục đích:** Cấu hình Gateway cho ứng dụng Claude Desktop chính chủ, kiểm tra hạn mức API Key thời gian thực và tự động mở tính năng Import chat từ Claude.ai chỉ với 1 cú click chuột.

---

## 🚀 Tính năng nổi bật (v0.3.3)

- ⚡ **Kiểm tra Key thời gian thực**: Tự động kết nối hệ sinh thái API check-usage để kiểm tra tính hợp lệ và hạn mức của Key. Nếu hết hạn mức hoặc sai key sẽ cảnh báo ngay; key hợp lệ hiển thị số dư còn lại (ví dụ: `Còn $9.99/$10.00`).
- 🎯 **Trải nghiệm 1-Click sạch sẽ**: Không có bất kỳ hộp thoại popup nào (`Yes/No` hay `OK`) làm gián đoạn — toàn bộ tiến trình xuất trực tiếp ra thanh **Terminal Log macOS** sang trọng.
- 🔄 **Tự động mở khóa Import Chat**: Mặc định kích hoạt sẵn tính năng **Import & export** trong Claude Desktop, cho phép tải toàn bộ lịch sử trò chuyện & projects từ `claude.ai` về máy.
- 🔄 **Tự động khởi động lại Claude Desktop**: Tự nhận diện và khởi động lại Claude Desktop chỉ trong 1-2 giây sau khi cấu hình thành công.
- 📦 **1 File duy nhất (Portable Standalone)**: Dung lượng siêu nhẹ (~95 KB), chạy ngay trên mọi máy Windows 10 & 11 không cần cài đặt môi trường phụ.

---

## 📖 Cách sử dụng (Dành cho người dùng)

1. Tải và cài đặt Claude Desktop chính chủ từ: https://claude.com/download (nếu chưa cài).
2. Tải và mở file **`KhodeeGateway.exe`** (chọn *Yes* khi Windows hỏi quyền Administrator).
3. **Dán API Key** vào ô nhập (hoặc bấm nút `Dán`).
4. Bấm **`⚡ START`**.
5. Tool tự động kiểm tra key, ghi cấu hình và tự khởi động lại Claude Desktop trong tích tắc.
6. Vào `Settings` (hoặc phím tắt `Ctrl + ,`) > `Import & export` > bấm `Import...` để đồng bộ chat từ Claude.ai về máy.

---

## ⚙️ Cấu hình thiết lập mặc định

| Thiết lập | Giá trị | Ghi chú |
|---|---|---|
| **Gateway Base URL** | `https://1gw.gwai.cloud` | Endpoint proxy gateway |
| **Auth Scheme** | `x-api-key` | Header xác thực |
| **Inference Provider** | `gateway` | Chế độ Enterprise Gateway |
| **Chat Import** | `Bật` | Cho phép import lịch sử từ Claude.ai |
| **Export Session** | `Tắt` | Tránh lộ data cục bộ |

---

## 🛡️ Bảo mật & An toàn

- **Tự động sao lưu**: Trước khi ghi bất kỳ cấu hình nào, ứng dụng luôn tạo bản sao lưu mã hoá DPAPI tại `%LOCALAPPDATA%\KhodeeGateway\backups\`.
- **Không bao giờ log key**: API Key không bị ghi vào file log hay gửi đi đâu ngoại trừ xác thực hạn mức với hệ thống và ghi vào Registry chính sách của Windows (`HKCU\SOFTWARE\Policies\Claude`).

---

## 🛠️ Build lại từ mã nguồn

Nếu muốn tự chỉnh sửa và build lại file EXE:
- Chạy file `build.bat` (tự động gọi `ps2exe` và compile trực tiếp sang `KhodeeGateway.exe`).
- Hoặc chỉnh sửa mã nguồn GUI tại `src/interface.ps1`.
