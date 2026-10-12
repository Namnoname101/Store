# DaiTruong Store — Codex Credit & API Usage Platform
## Architectural Specification (Spec)

**Version:** 1.0.0  
**Date:** 2026-10-12  
**Target Environment:** Next.js 14 (App Router), Prisma ORM, SQLite on Fly.io  
**Upstream Provider:** ModelAPI (`https://modelapi.vn/` - New API engine `v1.0.0-rc.25`)

---

## 1. Mục tiêu và Bối cảnh (Objectives & Context)

### 1.1. Mục tiêu sản phẩm
Cho phép khách hàng của DaiTruong Store:
1. **Nạp Credit API Codex tự động** vào API Key (`sk-...`) cá nhân được cấp bởi DaiTruong Store thông qua thanh toán VietQR 24/7.
2. **Theo dõi API Usage thực tế** (Tokens in/out, Requests, Chi phí tiêu thụ theo AI Model, Lịch sử request) trực tiếp trên trang **DaiTruong Developer Dashboard**, không cần đăng nhập vào nền tảng đối tác `modelapi.vn`.
3. **Quản lý an toàn và minh bạch**:
   - Đối soát số dư nguồn (Source Account Balance) so với tổng nghĩa vụ credit của khách.
   - Chặn tuyệt đối race condition khi nạp quota cho key đang có request AI chạy song song.
   - Bảo mật không rò rỉ API Key của khách và System Access Token của quản trị viên.

### 1.2. Ràng buộc kỹ thuật & Phát hiện từ Upstream (`modelapi.vn`)
- **Engine Upstream**: New API (`v1.0.0-rc.25`), chuẩn hóa tỉ lệ quy đổi `1 USD = 500.000 quota units`.
- **Hạn chế Concurrency của `PUT /api/token/`**:
  - Endpoint này **CHỈ HỖ TRỢ GHI ĐÈ GIÁ TRỊ TUYỆT ĐỐI** (`remain_quota`), không có atomic increment (`+=`).
  - Do đó, bắt buộc phải có cơ chế **Locking & Delta Reconciliation**:
    1. Lock xử lý theo token ID.
    2. Đọc snapshot `remain_quota` trước khi nạp (`quotaBefore`).
    3. Tính toán `quotaToAdd = creditUsd * QUOTA_PER_USD`.
    4. Gửi `PUT /api/token/` với giá trị `quotaBefore + quotaToAdd`.
    5. Đọc lại snapshot `quotaAfter` để kiểm tra độ lệch tiêu thụ AI trong lúc nạp.
    6. Ghi chép sổ cái `CreditLedger` đầy đủ, giải phóng lock.
- **Quyền riêng tư & IDOR**:
  - `GET /api/usage/token` và `GET /api/log/token` chấp nhận xác thực trực tiếp bằng chính `sk-...` của khách (Token-scoped).
  - Khách chỉ xem được dữ liệu token của chính mình.
  - Backend sử dụng `MODELAPI_SYSTEM_ACCESS_TOKEN` để quản lý danh sách token, nạp quota, và đối soát.

---

## 2. Mô hình Dữ liệu (Prisma Schema Extensions)

Bổ sung các model mới vào `prisma/schema.prisma` mà không ảnh hưởng tới bất kỳ bảng hiện hữu nào:

```prisma
model CustomerApiKeyBinding {
  id               String            @id @default(uuid())
  userId           String?           // Khách đăng nhập (User.id)
  user             User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  guestEmail       String?           // Khách vãng lai
  upstreamTokenId  Int               @unique // ID token trên modelapi.vn (Bắt buộc unique để 1 token chỉ thuộc 1 khách)
  keyFingerprint   String            @unique // HMAC-SHA256 của chuỗi sk-... (dùng để tìm kiếm mà không lưu plain text key)
  maskedKey        String            // sk-abc...xyz (dùng để hiển thị UI)
  keyName          String?           // Tên gợi nhớ của key trên ModelAPI
  status           String            @default("ACTIVE") // ACTIVE, DISABLED
  totalCreditUsd   Float             @default(0) // Tổng USD đã nạp lũy kế qua DaiTruong
  lastSyncedAt     DateTime?
  topupOrders      CreditTopupOrder[]
  ledgerEntries    CreditLedger[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  @@index([userId])
  @@index([keyFingerprint])
}

model CreditTopupOrder {
  id              String                @id @default(uuid())
  orderId         String                @unique
  order           Order                 @relation(fields: [orderId], references: [id], onDelete: Cascade)
  bindingId       String
  binding         CustomerApiKeyBinding @relation(fields: [bindingId], references: [id], onDelete: Cascade)
  creditUsd       Float                 // Gói credit khách mua (USD, ví dụ 10.0)
  quotaUnits      Int                   // Quota tương ứng (ví dụ: 5.000.000)
  status          String                @default("PENDING") // PENDING, PROCESSING, COMPLETED, RECONCILE_REQUIRED, FAILED
  errorMessage    String?
  retryCount      Int                   @default(0)
  completedAt     DateTime?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt

  @@index([bindingId])
  @@index([status])
}

model CreditLedger {
  id                 String                @id @default(uuid())
  bindingId          String
  binding            CustomerApiKeyBinding @relation(fields: [bindingId], references: [id], onDelete: Cascade)
  topupOrderId       String?
  upstreamTokenId    Int
  quotaBefore        Int                   // Quota đọc từ modelapi trước khi nạp
  quotaAddedExpected Int                   // Quota dự kiến cộng thêm
  quotaAfterReported Int                   // Quota đọc lại sau khi update
  discrepancyDelta   Int                   @default(0) // Độ lệch nếu key tiêu thụ AI trong lúc nạp
  performedBy        String                @default("SYSTEM") // SYSTEM, OWNER
  note               String?
  createdAt          DateTime              @default(now())

  @@index([bindingId])
  @@index([upstreamTokenId])
}

model ModelApiSyncSnapshot {
  id               String   @id @default(uuid())
  sourceQuotaTotal Int      // Quota tài khoản tổng modelapi.vn
  sourceQuotaUsed  Int
  sourceBalanceUsd Float
  totalCustomerObligationQuota Int // Tổng quota còn lại của tất cả key cửa hàng cấp
  status           String   @default("HEALTHY") // HEALTHY, WARNING_LOW_BALANCE, CRITICAL
  createdAt        DateTime @default(now())
}
```

---

## 3. Kiến Trúc Backend Service (`ModelApiService`)

Tọa lạc tại `src/services/modelapi/modelapi.service.ts`:

### 3.1. Các phương thức cốt lõi:
- **`checkConnection()`**: Kiểm tra xác thực qua `GET /api/user/self`. Trả về số dư tổng (`quota`).
- **`verifyCustomerKey(apiKey: string)`**:
  - Bước 1: Probe `GET /api/usage/token` bằng chính `apiKey` để kiểm tra key có hoạt động hay bị disable/hết hạn.
  - Bước 2: Gọi `GET /api/token/search?keyword={key}` bằng `SystemAccessToken` để kiểm tra key này có thuộc tài khoản quản lý của DaiTruong Store hay không.
  - Bước 3: Kiểm tra trong DB `CustomerApiKeyBinding` xem key đã bị gắn cho khách khác chưa.
- **`applyQuotaTopup(bindingId: string, orderId: string, creditUsd: number)`**:
  - Triển khai **In-Process Mutex Lock** theo `upstreamTokenId`.
  - Transaction ghi chép:
    1. Cập nhật `CreditTopupOrder.status = "PROCESSING"`.
    2. Đọc `quotaBefore` từ `GET /api/token/{id}`.
    3. `quotaTarget = quotaBefore + (creditUsd * QUOTA_PER_USD)`.
    4. Gửi `PUT /api/token/` với `remain_quota = quotaTarget`.
    5. Đọc lại `quotaAfter` từ `GET /api/token/{id}`.
    6. Tính toán delta: `discrepancyDelta = quotaTarget - quotaAfter`.
    7. Ghi sổ cái `CreditLedger`.
    8. Cập nhật `CreditTopupOrder.status = "COMPLETED"`, cập nhật `Order.upstreamStatus = "COMPLETED"`.
  - Nếu xảy ra timeout mạng hoặc response 5xx: Chuyển `CreditTopupOrder.status = "RECONCILE_REQUIRED"`, ghi log lỗi, không báo ảo.
- **`fetchTokenUsage(apiKey: string)`**:
  - Gọi `GET /api/usage/token` để lấy tổng quan quota (granted, used, available).
- **`fetchTokenLogs(apiKey: string, page: number, pageSize: number)`**:
  - Gọi `GET /api/log/token?p={page}&page_size={pageSize}` để lấy lịch sử requests thực tế.

### 3.2. Cấu hình biến môi trường:
- `MODELAPI_BASE_URL` (Mặc định: `https://modelapi.vn`)
- `MODELAPI_SYSTEM_ACCESS_TOKEN` (Bảo mật, chỉ lưu trên server)
- `MODELAPI_QUOTA_PER_USD` (Mặc định: `500000`)
- `MODELAPI_TIMEOUT_MS` (Mặc định: `10000`)

---

## 4. Quy trình Nghiệp Vụ (Business Workflows)

### 4.1. Khách Hàng Nạp Credit (Storefront)
1. Khách truy cập trang sản phẩm Codex Credit (hoặc `/codex`).
2. Chọn gói Credit ($5, $10, $20, $50, $100) -> Giá hiển thị quy đổi ra VNĐ theo cấu hình DB sản phẩm.
3. Lựa chọn:
   - **Đã có API Key**:
     - Nhập `sk-...`.
     - Nhấn nút **"Kiểm tra API Key"**. Hệ thống gọi API nội bộ `/api/codex/verify-key`.
     - Hiển thị thông tin: Tên key đã che (`sk-cde...789`), Trạng thái hoạt động, Quota khả dụng hiện tại.
   - **Chưa có API Key**:
     - Hiển thị hướng dẫn: Nhận key qua bộ phận hỗ trợ khách hàng hoặc đăng ký mua key mới.
4. Nhấn **"Thanh toán ngay"**:
   - Tạo đơn hàng qua `order.service.ts` kèm metadata `bindingId` và `creditUsd`.
   - Chuyển hướng sang trang `/checkout/[orderCode]` với mã VietQR tự động.

### 4.2. Cấp Quota Tự Động khi Thanh Toán Thành Công
1. Webhook ngân hàng `/api/webhooks/payment` nhận biến động số dư.
2. Xác thực số tiền và nội dung `ORDxxxxxx`. Chuyển đơn sang `PAID`.
3. Nhận diện đơn hàng có sản phẩm Codex Credit:
   - Gọi `ModelApiService.applyQuotaTopup()`.
   - Nếu thành công: Quota được cộng ngay lập tức trên `modelapi.vn`. Khách nhận được trang `/order-success/[orderCode]` hiển thị số dư mới cập nhật và nút chuyển sang **Usage Dashboard**.

---

## 5. DaiTruong Developer Usage Dashboard (`/developer/usage`)

Trang bảng điều khiển chuyên nghiệp, bảo mật cao:
- **Xác thực / Nhập Key**:
  - Nếu khách đã đăng nhập: Tự động hiển thị các key đã liên kết của tài khoản.
  - Nếu khách vãng lai: Nhập API Key hoặc truy cập thông qua link bảo mật từ đơn hàng (`/order-success/[orderCode]?token=...`).
- **Giao diện Tabs/Sections**:
  1. **Overview Cards**:
     - Số dư khả dụng (USD equivalent).
     - Chi phí đã sử dụng (USD).
     - Tổng Token tiêu thụ (Input / Output tokens).
     - Số lượt Request ghi nhận.
  2. **Biểu đồ Analytics**:
     - Biểu đồ cột tiêu thụ Token/Credit theo ngày (7 ngày, 30 ngày).
     - Phân bổ chi phí theo Model (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro...).
  3. **Lịch sử Request Thực tế (Real-time Request Log)**:
     - Bảng dữ liệu có phân trang: Thời gian (Asia/Ho_Chi_Minh), Model, Tokens In/Out, Chi phí, Trạng thái (200, 4xx, 5xx), Thời gian phản hồi (ms).
  4. **Lịch sử Nạp Tiền (Topup History)**:
     - Danh sách các đơn nạp qua DaiTruong Store với mã đơn, thời gian nạp, số credit đã cộng.
  5. **Cảnh báo số dư thấp**:
     - Thông báo nổi bật khi số dư khả dụng < 20% kèm nút 1-click **"Nạp thêm credit"** (tự động điền key hiện tại).

---

## 6. Khu Vực Quản Trị (Admin Dashboard Extension)

Bổ sung tab **"Quản lý Codex & API Key"** tại `/admin/codex`:
1. **Source Balance & Obligation Monitor**:
   - Thẻ số dư tài khoản tổng trên `modelapi.vn`.
   - Thẻ tổng nghĩa vụ credit của khách hàng (Tổng `remain_quota` của các key đang phát hành).
   - Chỉ số cảnh báo: Nếu `Source Quota < 1.2 * Total Customer Obligation` -> Cảnh báo vàng. Nếu `< 1.0` -> Cảnh báo đỏ nguy cơ cạn quota nguồn.
2. **Danh Sách Khách & Key Liên Kết**:
   - Bảng hiển thị `maskedKey`, Khách hàng (`email`/`username`), Tổng USD đã nạp, Quota hiện tại trên modelapi, Trạng thái.
   - Nút gán key thủ công cho khách chưa có key.
3. **Đối Soát & Xử Lý Đơn Lỗi**:
   - Danh sách các đơn nạp có trạng thái `RECONCILE_REQUIRED` hoặc có sai lệch delta.
   - Nút **"Kiểm tra lại trạng thái Upstream"** và **"Thử lại nạp quota"** an toàn.

---

## 7. Kế Hoạch Kiểm Thử (Testing Matrix)

1. **Unit Test `ModelApiService`**:
   - Kiểm tra parse quota, quy đổi USD sang quota point.
   - Mocking `PUT /api/token/` và `GET /api/token/{id}` với các kịch bản: nạp bình thường, nạp khi có AI request đồng thời (delta lệch), timeout mạng, response 401/403/500.
2. **Integration Test `Order & Payment Webhook`**:
   - Giả lập thanh toán VietQR đơn Codex Credit -> Kiểm tra transaction DB, bảng `CreditTopupOrder` và sổ cái `CreditLedger`.
   - Kiểm tra chống nạp 2 lần khi webhook gửi trùng lặp (Idempotency).
3. **Regression Test**:
   - Chạy toàn bộ 74 test suites hiện có của dự án (Locket, Dropship, Kho thẻ, Ví điện tử) đảm bảo không bị ảnh hưởng.
