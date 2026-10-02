# Design Specification: Automated Digital Products & Accounts Store

**Date:** 2026-10-03  
**Status:** Approved by User  
**Target Platform:** Next.js (App Router), TypeScript, Tailwind CSS, Prisma, SQLite/PostgreSQL  

---

## 1. Overview & Objectives

Xây dựng hệ thống web thương mại điện tử chuyên kinh doanh sản phẩm số (mã bản quyền phần mềm, tài khoản dịch vụ, liên kết/tài liệu khóa học) với quy trình thanh toán và giao nhận hoàn toàn tự động 100% qua chuẩn VietQR ngân hàng.

### Core Goals:
- **Tự động hóa 100%:** Khách chuyển khoản đúng cú pháp -> Hệ thống khớp lệnh và trả sản phẩm ngay lập tức trên màn hình.
- **Chống bán trùng tuyệt đối (Zero Race Conditions):** Tạm giữ kho (reserved items) trong thời gian thanh toán.
- **Trải nghiệm mua hàng siêu tốc:** Không bắt buộc đăng ký tài khoản rườm rà (hỗ trợ Guest Checkout qua Email).
- **Quản trị tiện lợi:** Bảng điều khiển Admin cho phép nhập hàng nghìn key/tài khoản hàng loạt trong vài giây.

---

## 2. System Architecture

```
[ Khách hàng / Trình duyệt ]
       │
       ▼
[ Next.js 14+ App Router (Storefront & Admin) ]
  ├── Client Components (VietQR Checkout, Countdown, Realtime Polling)
  ├── Server Actions & API Routes (/api/orders, /api/webhooks/payment)
  └── Auth (NextAuth / JWT session)
       │
       ├── Prisma ORM ──▶ [ Database: SQLite (Dev) / PostgreSQL (Prod) ]
       │
       └── Payment Integration ◀── [ VietQR Webhook: PayOS / SePay / Casso ]
```

---

## 3. Data Models (Prisma Schema)

```prisma
enum Role {
  USER
  ADMIN
}

enum ProductType {
  LICENSE_KEY
  ACCOUNT
  COURSE_LINK
}

enum ItemStatus {
  AVAILABLE
  RESERVED
  SOLD
}

enum OrderStatus {
  PENDING
  PAID
  CANCELLED
  EXPIRED
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String?
  name         String?
  role         Role      @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  orders       Order[]
}

model Category {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  products    Product[]
  createdAt   DateTime  @default(now())
}

model Product {
  id            String        @id @default(uuid())
  title         String
  slug          String        @unique
  description   String
  price         Int           // VND
  originalPrice Int?          // VND
  type          ProductType   @default(LICENSE_KEY)
  thumbnailUrl  String?
  isActive      Boolean       @default(true)
  categoryId    String
  category      Category      @relation(fields: [categoryId], references: [id])
  items         ProductItem[]
  orderItems    OrderItem[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
}

model ProductItem {
  id            String      @id @default(uuid())
  productId     String
  product       Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  secretContent String      // Key, credentials (email|pass), or link
  status        ItemStatus  @default(AVAILABLE)
  orderId       String?
  order         Order?      @relation(fields: [orderId], references: [id])
  reservedUntil DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Order {
  id            String               @id @default(uuid())
  orderCode     String               @unique // e.g. ORD849201
  customerEmail String
  userId        String?
  user          User?                @relation(fields: [userId], references: [id])
  totalAmount   Int                  // VND
  status        OrderStatus          @default(PENDING)
  paymentMethod String               @default("VIETQR")
  expiresAt     DateTime
  paidAt        DateTime?
  orderItems    OrderItem[]
  deliveredItems ProductItem[]
  transactions  PaymentTransaction[]
  createdAt     DateTime             @default(now())
  updatedAt     DateTime             @updatedAt
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  price     Int
  quantity  Int
}

model PaymentTransaction {
  id            String   @id @default(uuid())
  orderId       String?
  order         Order?   @relation(fields: [orderId], references: [id])
  transactionId String   @unique // Mã giao dịch ngân hàng / gateway
  amount        Int
  bankCode      String?
  content       String?
  rawPayload    String?
  createdAt     DateTime @default(now())
}
```

---

## 4. Payment & Delivery Workflow

### 4.1 Order Creation & Reservation
1. Khách hàng bấm **Mua ngay** trên sản phẩm hoặc giỏ hàng.
2. Hệ thống kiểm tra số lượng `ProductItem` có trạng thái `AVAILABLE`.
3. Bắt đầu `prisma.$transaction`:
   - Tạo bản ghi `Order` với mã đơn dạng `ORD` + 6 số ngẫu nhiên.
   - Cập nhật số lượng `ProductItem` tương ứng thành `RESERVED` và đặt `reservedUntil = now() + 15 minutes`, gán `orderId`.
4. Điều hướng khách hàng đến trang `/checkout/[orderCode]`.

### 4.2 VietQR & Verification
1. Trang thanh toán sinh mã QR theo chuẩn VietQR NAPAS247:
   - Số tài khoản & Ngân hàng người nhận.
   - Số tiền cần thanh toán chính xác.
   - Nội dung chuyển khoản duy nhất: `ORDxxxxxx`.
2. Đồng hồ đếm ngược 15 phút.
3. Khi khách quét mã và chuyển khoản:
   - Gateway/Webhook (PayOS/SePay) gửi tín hiệu POST về `/api/webhooks/payment`.
   - Webhook handler đối soát: `transactionId` chưa từng xử lý, nội dung chứa `ORDxxxxxx`, số tiền `>= order.totalAmount`.
   - Cập nhật trong transaction:
     - `Order.status = PAID`, `paidAt = now()`.
     - `ProductItem.status = SOLD`.
     - Tạo bản ghi `PaymentTransaction`.
4. Client polling (3s) hoặc Server-Sent Event nhận diện trạng thái `PAID` và tự động chuyển sang trang `/order-success/[orderCode]`.

### 4.3 Order Expiration
- Nếu sau 15 phút chưa thanh toán:
  - Khi người dùng kiểm tra hoặc khi cron job chạy:
  - Cập nhật `Order.status = EXPIRED`.
  - Các `ProductItem` chuyển từ `RESERVED` về `AVAILABLE`, xóa liên kết `orderId`.

---

## 5. User Interface & Routes

### 5.1 Storefront (Khách hàng)
- `/`: Trang chủ với danh mục, tìm kiếm, sản phẩm bán chạy, sản phẩm mới.
- `/products/[slug]`: Chi tiết sản phẩm, số lượng khả dụng trong kho, mô tả, nút "Mua ngay".
- `/checkout/[orderCode]`: Hiển thị VietQR, sao chép nhanh STK/Nội dung, đồng hồ đếm ngược, kiểm tra trạng thái thanh toán tự động.
- `/order-success/[orderCode]`: Trang bàn giao hàng, hiển thị danh sách secret keys/tài khoản, nút copy 1-chạm, hướng dẫn sử dụng.
- `/account/orders`: Tra cứu danh sách đơn hàng đã mua.

### 5.2 Admin Dashboard (`/admin`)
- `/admin`: Dashboard thống kê doanh thu, đơn hàng, mặt hàng sắp hết kho.
- `/admin/categories`: Quản lý danh mục sản phẩm.
- `/admin/products`: Danh sách sản phẩm, thêm/sửa sản phẩm, đặt giá.
- `/admin/inventory`: Quản lý kho hàng số. Hỗ trợ tính năng **Bulk Import** (dán danh sách nhiều key/tài khoản, mỗi dòng 1 mục).
- `/admin/orders`: Quản lý danh sách đơn hàng, xem trạng thái thanh toán, xử lý thủ công (gửi bù key, hủy đơn, hoàn tiền).

---

## 6. Error Handling & Edge Cases

| Tình huống | Cách xử lý |
|---|---|
| Hết hàng khi khách bấm mua | Báo lỗi ngay lập tức, không tạo đơn rỗng |
| Khách chuyển thiếu tiền / sai nội dung | Ghi log vào `PaymentTransaction`, không giao key, hiển thị hướng dẫn khách liên hệ Admin |
| Webhook gửi lại nhiều lần (Retry) | Dùng khóa duy nhất `transactionId`, xử lý idempotent (bỏ qua nếu đã xong) |
| Webhook bị trễ / Khách bị rớt mạng | Nút "Kiểm tra thanh toán" trên trang checkout cho phép truy vấn thủ công tức thì |
| Đơn hết hạn (sau 15p) | Giải phóng kho hàng tự động, không để đọng key |

---

## 7. Testing Strategy (TDD)

- **Unit Tests:** Kiểm tra định dạng mã QR, tính toán giá trị đơn, validation dữ liệu.
- **Integration Tests:**
  - Quy trình khóa kho và tạo đơn (Reservation test).
  - Quy trình webhook xử lý giao dịch hợp lệ -> chuyển `PAID` và `SOLD`.
  - Quy trình hết hạn đơn hàng -> hoàn kho `AVAILABLE`.
  - Quy trình chống race-condition (2 request mua đồng thời sản phẩm chỉ còn 1 key).
