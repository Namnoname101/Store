# Thiết kế tính năng: Tự động kích hoạt Locket Gold 24/7 (Auto Locket Gold)

- **Ngày tạo:** 2026-10-07
- **Trạng thái:** Chờ phê duyệt (Draft)
- **Tác giả:** Antigravity AI & @Namnoname

---

## 1. Bối cảnh & Mục tiêu

### 1.1 Bối cảnh
- Hệ thống DigiStore là nền tảng bán dịch vụ số xây dựng trên Next.js (App Router), Prisma và SQLite.
- Quản trị viên hiện đang sở hữu gói **GoldPass** trên trang đối tác `https://locketgold.yuichycsa.id.vn` gắn với tài khoản cá nhân `@Namnoname` và UID Locket `@qthinh0106`.
- Hệ thống đối tác cho phép kích hoạt gói GoldPass định kỳ sau mỗi chu kỳ chờ (cooldown ~60 giây/lần). Hiện tại thao tác thủ công đòi hỏi phải đăng nhập và bấm kích hoạt liên tục trên trình duyệt.

### 1.2 Mục tiêu
- Xây dựng công cụ quản trị **Auto Locket Gold** ngay trong trang Admin (`/admin/locket-auto`).
- Cung cấp cơ chế **Background Worker chạy ngầm 24/7 trên server** để tự động gửi yêu cầu kích hoạt mỗi 1 phút (hoặc theo chu kỳ tùy chỉnh), kể cả khi quản trị viên tắt trình duyệt / tắt máy.
- Cho phép cấu hình thông tin GoldPass (link hoặc mã pass), Session Cookie của tài khoản đối tác, kèm theo tính năng kiểm tra kết nối và kích thử nghiệm ngay lập tức.
- Ghi nhật ký đầy đủ các lần kích hoạt để dễ dàng theo dõi trạng thái, phát hiện khi phiên đăng nhập hết hạn.

---

## 2. Kiến trúc hệ thống

```
+-------------------------------------------------------------------------+
|                              Admin Browser                              |
|   - Bật/Tắt Auto 24/7    - Cập nhật Cookie/Link   - Xem Live Logs/Status|
+------------------------------------+------------------------------------+
                                     | (REST API)
+------------------------------------v------------------------------------+
|                         Next.js Server (Node.js)                        |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  | /api/admin/locket-auto/*  |       | LocketAutoWorker (Singleton)  |  |
|  | - get/save config         |       | - Timer loop: mỗi 60 giây     |  |
|  | - trigger-now             |       | - Mutex lock chống trùng lặp  |  |
|  | - test-connection         |       | - Tự ngắt nếu 401 Session Exp |  |
|  +-------------+-------------+       +---------------+---------------+  |
|                |                             |                          |
|                +--------------+--------------+                          |
|                               |                                         |
|                   +-----------v-----------+                             |
|                   |   LocketPartnerClient |                             |
|                   +-----------+-----------+                             |
+-------------------------------|-----------------------------------------+
                                | (HTTPS Request)
                                v
+-------------------------------------------------------------------------+
|                 Đối tác: locketgold.yuichycsa.id.vn                     |
|   - Endpoint: POST /api/v1/goldpass/use                                 |
|   - Headers: Cookie session @Namnoname, X-CSRF-Token                    |
|   - Body: pass_id, link_version, signature, idempotency_key            |
+-------------------------------------------------------------------------+
```

---

## 3. Thiết kế Cấu trúc Dữ liệu (Prisma Schema)

Bổ sung 2 Model vào `prisma/schema.prisma`:

### 3.1 Model `LocketAutoConfig`
Lưu trữ cấu hình duy nhất của bộ tự động kích hoạt:
```prisma
model LocketAutoConfig {
  id              String    @id @default("default")
  goldPassUrl     String    // Full URL GoldPass
  passId          String    // Trích xuất từ URL (tham số ?p=)
  linkVersion     Int       @default(1) // Tham số ?v=
  signature       String    // Tham số ?t=
  sessionCookie   String    // Cookie đăng nhập tài khoản Yuicsa
  csrfToken       String?   // CSRF token nếu đối tác yêu cầu
  targetUsername  String?   // @qthinh0106
  isActive        Boolean   @default(false) // Trạng thái bật/tắt Auto 24/7
  intervalSeconds Int       @default(60)    // Khoảng cách giữa các lần kích
  lastRunAt       DateTime? // Lần kích gần nhất
  lastStatus      String?   // SUCCESS | COOLDOWN | FAILED | SESSION_EXPIRED
  lastMessage     String?   // Chi tiết phản hồi từ đối tác
  updatedAt       DateTime  @updatedAt
  createdAt       DateTime  @default(now())
}
```

### 3.2 Model `LocketAutoLog`
Lưu trữ nhật ký lịch sử các lượt kích hoạt (giới hạn hiển thị 100 dòng mới nhất):
```prisma
model LocketAutoLog {
  id          String   @id @default(uuid())
  status      String   // SUCCESS | COOLDOWN | FAILED | SESSION_EXPIRED
  jobId       String?  // Mã job nhận từ đối tác nếu có
  message     String   // Mô tả kết quả
  rawPayload  String?  // JSON response từ đối tác
  durationMs  Int?     // Thời gian phản hồi mạng (ms)
  createdAt   DateTime @default(now())

  @@index([createdAt])
}
```

---

## 4. Thiết kế Chi tiết các Module Backend

### 4.1 Module `LocketPartnerClient` (`src/services/locket-auto/locket-partner.client.ts`)
- **Hàm `parseGoldPassUrl(url: string)`**:
  - Trích xuất an toàn các tham số `p` (passId), `v` (linkVersion), `t` (signature).
- **Hàm `testAccess(config)`**:
  - Gọi `GET /api/v1/goldpass/access?p=...&v=...&t=...` kèm Cookie.
  - Trả về thông tin gói: tài khoản mục tiêu (`@qthinh0106`), trạng thái gói, số ngày còn lại, thời gian cooldown còn lại.
- **Hàm `triggerUsePass(config)`**:
  - Gọi `POST /api/v1/goldpass/use`.
  - Body: `{ pass_id, link_version, signature, idempotency_key: uuid() }`.
  - Headers: `Cookie: sessionCookie`, `X-CSRF-Token: csrfToken`.
  - Xử lý các mã trạng thái:
    - `200`: Thành công, trả về `job_id`.
    - `400 / 429`: Đang trong cooldown hoặc có job đang chạy.
    - `401`: Phiên đăng nhập hết hạn (`SESSION_EXPIRED`).

### 4.2 Module `LocketAutoWorker` (`src/services/locket-auto/locket-auto.worker.ts`)
- Quản lý vòng lặp Node.js (`setInterval` / async timer).
- **Cơ chế chống chạy chồng chéo (Concurrency Lock)**: Biến cờ `isExecuting` ngăn worker kích lần mới khi lần trước chưa nhận được phản hồi mạng.
- **Tự động phục hồi**: Khi server khởi động lại (Docker/Node reload), đọc trạng thái `isActive` từ DB, nếu là `true` thì tự động tiếp tục chạy mà không cần Admin can thiệp.
- **Ngắt an toàn (Circuit Breaker)**: Nếu gặp lỗi 401 (Cookie hết hạn), tự động cập nhật `isActive = false` trong DB và dừng worker để tránh gửi request rác liên tục.

### 4.3 API Endpoints (`src/app/api/admin/locket-auto/`)
1. `GET /api/admin/locket-auto/config`: Lấy cấu hình hiện tại và trạng thái live của worker.
2. `POST /api/admin/locket-auto/config`: Lưu link, cookie, chu kỳ và bật/tắt `isActive`.
3. `POST /api/admin/locket-auto/test-connection`: Kiểm tra tính hợp lệ của link & cookie mà không kích hoạt.
4. `POST /api/admin/locket-auto/trigger-now`: Kích hoạt ngay 1 lần lập tức để kiểm tra.
5. `GET /api/admin/locket-auto/logs`: Lấy 50-100 bản ghi log mới nhất.
6. `DELETE /api/admin/locket-auto/logs`: Dọn dẹp bảng log.

---

## 5. Thiết kế Giao diện Quản trị Admin

- Đường dẫn: `/admin/locket-auto`
- Tích hợp thêm mục **"Auto Locket Gold"** trên thanh Sidebar Navigation Admin (`src/app/admin/layout.tsx`).

### Giao diện gồm 3 khối:
1. **Khối Giám sát & Điều khiển Live (Hero Control Card):**
   - Switch Bật/Tắt Auto 24/7 với hiệu ứng trạng thái (Đang chạy ngầm / Đã tạm dừng).
   - Nút **"Kích hoạt ngay (1 lần)"** kèm trạng thái loading khi đang gửi.
   - Thẻ thông tin GoldPass: Username (`@qthinh0106`), Trạng thái (`Đang hoạt động`), Thời gian còn lại (`178 ngày`), Thời gian chạy gần nhất.
   - Đồng hồ đếm ngược nhịp 60 giây tiếp theo.
2. **Khối Cấu hình (Settings Card):**
   - Input: Link GoldPass (hỗ trợ dán link đầy đủ).
   - Textarea: Cookie đăng nhập (lấy từ F12/Application hoặc Network của trang Yuicsa).
   - Input: CSRF Token (tùy chọn).
   - Nút **"Kiểm tra kết nối"** & Nút **"Lưu cấu hình"**.
3. **Khối Nhật ký (Live Logs Card):**
   - Bảng phân loại màu sắc badge:
     - `SUCCESS`: Màu xanh lá (Thành công, hiển thị Job ID).
     - `COOLDOWN`: Màu vàng cam (Đang trong thời gian chờ).
     - `SESSION_EXPIRED`: Màu đỏ tím (Cần cập nhật Cookie mới).
     - `FAILED`: Màu đỏ (Lỗi kết nối / lỗi máy chủ).
   - Nút "Làm mới logs" và nút "Xóa lịch sử".

---

## 6. Kế hoạch Kiểm thử & Xác minh

1. **Kiểm thử phân tích Link:** Thử nghiệm bóc tách URL với các link GoldPass hợp lệ và không hợp lệ.
2. **Kiểm thử API Test Connection:** Kiểm tra phản hồi với Cookie thật và Cookie giả định.
3. **Kiểm thử Trigger Now:** Bấm kích hoạt 1 lần và xác nhận bản ghi thành công/cooldown trong bảng log.
4. **Kiểm thử Auto Run 24/7:** Bật switch, kiểm tra worker kích đúng nhịp 60s và dừng đúng lúc khi tắt switch.
