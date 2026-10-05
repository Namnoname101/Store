# Thiết Kế Kỹ Thuật: Hệ Thống Ví & Tài Khoản Thành Viên (User Wallet & Membership System)

- **Ngày tạo:** 2026-10-05
- **Trạng thái:** Chờ phê duyệt (Pending Review)
- **Tác giả:** Antigravity & User

---

## 1. Tổng Quan & Mục Tiêu

Hệ thống cho phép khách hàng đăng ký/đăng nhập tài khoản thành viên, nạp tiền vào ví cá nhân tự động qua VietQR (tối thiểu 20.000đ), và thực hiện thanh toán mọi dịch vụ số (key bản quyền, tài khoản, SMM buff like/sub) tức thì chỉ bằng 1 cú click (1-click checkout) trừ trực tiếp vào số dư ví mà không cần quét mã ngân hàng cho từng đơn lẻ.

### 1.1 Mục Tiêu Chính
1. **Xác thực Thành viên An toàn & Nhẹ nhàng**: Hỗ trợ đăng ký và đăng nhập bằng Tên tài khoản (Username) hoặc Email + Mật khẩu. Quản lý phiên bằng Signed HttpOnly Cookie (`user_session`) chuẩn bảo mật, tương thích Edge runtime và không phụ thuộc thư viện cồng kềnh.
2. **Nạp tiền Tự động qua VietQR (Top-up Engine)**: Khách tạo lệnh nạp tiền (tối thiểu 20.000đ, hạn mức linh hoạt), hệ thống sinh mã nạp `NAP<6 số>` kèm VietQR. Webhook ngân hàng (SePay/PayOS) tự động đối soát nội dung và cộng số dư ví sau 3-5 giây.
3. **Thanh toán 1-Click bằng Số Dư Ví**: Tại màn hình Checkout, khách hàng đã đăng nhập có thể chọn thanh toán bằng số dư ví. Đơn hàng được xử lý tức thì, tự động giải phóng key kho hoặc gửi lệnh dropship tự động.
4. **Sổ Cái Biến Động Số Dư (Ledger Audit Trail)**: Mọi thao tác nạp tiền, thanh toán đơn, hoàn tiền, hoặc điều chỉnh thủ công đều được ghi nhận vào `WalletTransaction` với số dư trước/sau rõ ràng.
5. **An Toàn Tuyệt Đối Trước Race Condition**: Khóa kiểm tra nguyên tử (Atomic transaction) trong Prisma `balance: { gte: totalAmount }` ngăn chặn hoàn toàn nguy cơ click đúp thanh toán vượt số dư.
6. **Không Ảnh Hưởng Khách Vãng Lai**: Khách chưa đăng nhập vẫn có thể mua hàng và thanh toán VietQR trực tiếp như bình thường.
7. **Quản trị Viên Quản Lý Thành Viên (`/admin/users`)**: Xem danh sách thành viên, số dư, lịch sử giao dịch và hỗ trợ điều chỉnh số dư kèm lý do rõ ràng.

---

## 2. Mô Hình Dữ Liệu (Prisma Schema Extensions)

```prisma
// Cập nhật bảng User
model User {
  id                 String              @id @default(uuid())
  username           String              @unique
  email              String?             @unique
  passwordHash       String
  role               String              @default("CUSTOMER") // CUSTOMER | ADMIN
  balance            Int                 @default(0)          // Số dư VND khả dụng (>= 0)
  totalDeposited     Int                 @default(0)          // Tổng tiền đã nạp lũy kế
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt
  orders             Order[]
  depositOrders      DepositOrder[]
  walletTransactions WalletTransaction[]
}

// Lệnh nạp tiền vào ví
model DepositOrder {
  id            String              @id @default(uuid())
  depositCode   String              @unique // Ví dụ: NAP582914
  userId        String
  user          User                @relation(fields: [userId], references: [id])
  amount        Int                 // Số tiền nạp VND (tối thiểu 20.000 VND)
  status        String              @default("PENDING") // PENDING | COMPLETED | EXPIRED | CANCELLED
  expiresAt     DateTime            // Hết hạn sau 30 phút
  paidAt        DateTime?
  transactions  PaymentTransaction[]
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([depositCode])
  @@index([userId])
}

// Sổ cái lịch sử biến động số dư ví (Ledger)
model WalletTransaction {
  id            String   @id @default(uuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  type          String   // TOPUP | ORDER_PAYMENT | REFUND | ADMIN_ADJUST
  amount        Int      // Số tiền thay đổi (+nạp, -thanh toán)
  balanceBefore Int      // Số dư trước biến động
  balanceAfter  Int      // Số dư sau biến động
  referenceId   String?  // Mã đơn hàng (ORD...) hoặc mã nạp (NAP...) liên quan
  description   String   // Diễn giải giao dịch
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([referenceId])
}
```

---

## 3. Kiến Trúc Chi Tiết Từng Phân Hệ

### 3.1 Phân Hệ 1: Xác Thực Thành Viên (Customer Auth Engine)
- **Thư viện mã hóa mật khẩu**: Sử dụng hàm băm bảo mật tiêu chuẩn (PBKDF2 thông qua Web Crypto API hoặc `bcryptjs`).
- **Quản lý Session**:
  - Tên cookie: `user_session`.
  - Thuộc tính: `HttpOnly`, `SameSite=Lax`, `Path=/`, `MaxAge=30 ngày`.
  - Token payload chứa: `{ userId, username, role, exp }`. Ký bằng `crypto.subtle.sign` với `USER_AUTH_SECRET` (hoặc fallback `ADMIN_SECRET`).
- **Các API Endpoints**:
  - `POST /api/auth/register`: Đăng ký tài khoản (kiểm tra username hợp lệ [a-zA-Z0-9_]{3,20}, mật khẩu tối thiểu 6 ký tự, email tùy chọn).
  - `POST /api/auth/login`: Đăng nhập bằng username hoặc email + password. Trả về thông tin user và gán cookie `user_session`.
  - `POST /api/auth/logout`: Xóa cookie `user_session`.
  - `GET /api/auth/me`: Lấy thông tin user hiện tại kèm số dư `balance` mới nhất.

### 3.2 Phân Hệ 2: Nạp Tiền & Đối Soát Webhook (Top-up Engine)
- **Ràng buộc số tiền**:
  - `MIN_DEPOSIT_AMOUNT = 20000` (20.000 VNĐ).
  - Tự động làm tròn số nguyên không âm.
- **Quy trình nạp tiền**:
  1. Khách truy cập `/topup`, chọn gói nhanh (20k, 50k, 100k, 200k, 500k) hoặc nhập số tiền tùy chọn.
  2. Bấm "Tạo lệnh nạp tiền" -> gọi `POST /api/wallet/deposit`.
  3. Hệ thống sinh mã `depositCode = "NAP" + random6Digits()`.
  4. Trả về thông tin lệnh nạp kèm URL VietQR chuẩn định dạng ngân hàng:
     `https://img.vietqr.io/image/<BANK_ID>-<ACC_NO>-compact.png?amount=<AMOUNT>&addInfo=<DEPOSIT_CODE>&accountName=<ACC_NAME>`
  5. Màn hình `/topup/[depositCode]` hiển thị mã QR, hướng dẫn chuyển khoản và tự động poll `/api/wallet/deposit/[depositCode]/status` mỗi 3 giây.
- **Xử lý Webhook (Mở rộng `payment.service.ts`)**:
  - Nhận webhook giao dịch ngân hàng từ SePay/PayOS.
  - Phân tích nội dung chuyển khoản:
    - Nếu chứa mã `ORDxxxxxx` -> Xử lý thanh toán đơn hàng (giữ nguyên).
    - Nếu chứa mã `NAPxxxxxx` -> Xử lý hoàn tất lệnh nạp tiền `DepositOrder`.
  - Quy trình xử lý nguyên tử cho `NAP`:
    ```typescript
    await prisma.$transaction(async (tx) => {
      const deposit = await tx.depositOrder.findUnique({
        where: { depositCode },
        include: { user: true }
      });
      if (!deposit || deposit.status !== 'PENDING') return;

      // Đánh dấu hoàn tất
      await tx.depositOrder.update({
        where: { id: deposit.id },
        data: { status: 'COMPLETED', paidAt: new Date() }
      });

      // Cộng số dư ví và tổng nạp
      const updatedUser = await tx.user.update({
        where: { id: deposit.userId },
        data: {
          balance: { increment: deposit.amount },
          totalDeposited: { increment: deposit.amount }
        }
      });

      // Ghi sổ cái
      await tx.walletTransaction.create({
        data: {
          userId: deposit.userId,
          type: 'TOPUP',
          amount: deposit.amount,
          balanceBefore: deposit.user.balance,
          balanceAfter: updatedUser.balance,
          referenceId: deposit.depositCode,
          description: `Nạp tiền tự động qua VietQR (${deposit.depositCode})`
        }
      });
    });
    ```

### 3.3 Phân Hệ 3: Thanh Toán 1-Click Bằng Số Dư Ví
- **API `POST /api/orders/[orderCode]/pay-with-wallet`**:
  - Yêu cầu xác thực `user_session`.
  - Kiểm tra đơn hàng có trạng thái `PENDING` và chưa hết hạn.
  - Chạy Prisma `$transaction`:
    ```typescript
    // 1. Kiểm tra và trừ số dư nguyên tử
    const updatedUser = await tx.user.update({
      where: {
        id: session.userId,
        balance: { gte: order.totalAmount }
      },
      data: {
        balance: { decrement: order.totalAmount }
      }
    });

    // 2. Cập nhật Order sang PAID
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        userId: session.userId,
        paymentMethod: 'WALLET'
      }
    });

    // 3. Ghi sổ cái WalletTransaction
    await tx.walletTransaction.create({
      data: {
        userId: session.userId,
        type: 'ORDER_PAYMENT',
        amount: -order.totalAmount,
        balanceBefore: updatedUser.balance + order.totalAmount,
        balanceAfter: updatedUser.balance,
        referenceId: order.orderCode,
        description: `Thanh toán đơn hàng ${order.orderCode}`
      }
    });
    ```
  - Sau khi trừ tiền thành công, gọi `fulfillOrderItems` (kho key nội bộ) và `fulfillOrderViaUpstream` (nếu có sản phẩm API dropship).
  - Trả về kết quả thành công và chuyển hướng ngay sang trang `/order-success/[orderCode]`.

### 3.4 Phân Hệ 4: Giao Diện Người Dùng (UI / UX)
1. **Header / Navbar (`src/components/Navbar.tsx`)**:
   - Nếu chưa đăng nhập: Nút "Đăng nhập / Đăng ký" dẫn tới modal hoặc `/login`.
   - Nếu đã đăng nhập: Hiển thị badge số dư nổi bật `💳 150.000đ` cạnh avatar/tên khách. Dropdown menu:
     - Nạp tiền vào ví (`/topup`)
     - Lịch sử tài khoản & Ví (`/profile`)
     - Đăng xuất
2. **Trang Nạp Tiền (`src/app/topup/page.tsx` & `/topup/[depositCode]/page.tsx`)**:
   - Giao diện chọn nhanh số tiền và hiển thị VietQR tự động.
   - Phát âm thanh chuông "Ting ting" khi nạp tiền thành công.
3. **Trang Thông Tin Cá Nhân & Lịch Sử Ví (`src/app/profile/page.tsx`)**:
   - Tổng quan số dư, tổng nạp, số đơn đã mua.
   - Tab "Lịch sử biến động số dư": Bảng chi tiết ngày giờ, loại giao dịch (Nạp/Mua/Hoàn tiền), số tiền (+ xanh / - đỏ), số dư sau giao dịch.
   - Tab "Đơn hàng của bạn": Danh sách đơn hàng đã mua để xem lại key bất cứ lúc nào.
4. **Tích hợp Checkout 1-Click (`src/components/CheckoutClient.tsx`)**:
   - Box chọn phương thức: "Chuyển khoản VietQR" hoặc "Ví thành viên (Số dư: xxx đ)".
   - Nếu chọn Ví thành viên và đủ số dư: Nút "Thanh toán ngay bằng Ví (1-click)".

### 3.5 Phân Hệ 5: Quản Lý Khách Hàng Admin (`src/app/admin/users/page.tsx`)
- Quản lý danh sách thành viên: Tên, Email, Số dư, Tổng nạp, Số đơn hàng, Ngày tạo.
- Modal "Điều chỉnh số dư ví":
  - Cho phép Admin Cộng (+) hoặc Trừ (-) số tiền bất kỳ.
  - Bắt buộc nhập lý do điều chỉnh.
  - Tự động ghi nhận vào `WalletTransaction` (type: `ADMIN_ADJUST`).

---

## 4. Kiểm Thử & Đảm Bảo Chất Lượng (Test Plan)

1. **Unit & Service Tests**:
   - `tests/services/user-auth.service.test.ts`: Đăng ký, băm mật khẩu, đăng nhập sai/đúng, sinh & giải mã session token.
   - `tests/services/deposit.service.test.ts`: Tạo lệnh nạp tiền, kiểm tra hạn mức tối thiểu 20.000đ, webhook nạp tiền thành công, kiểm tra idempotency (không cộng trùng tiền khi webhook bắn lại).
   - `tests/services/wallet-checkout.service.test.ts`: Thanh toán đơn bằng ví khi đủ tiền, chặn khi thiếu tiền, chặn race condition (click 2 lần khi số dư chỉ đủ 1 lần).
2. **API Integration Tests**:
   - `tests/api/auth.test.ts`: POST `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, GET `/api/auth/me`.
   - `tests/api/wallet.test.ts`: POST `/api/wallet/deposit`, POST `/api/orders/[orderCode]/pay-with-wallet`.
   - `tests/api/admin-users.test.ts`: GET `/api/admin/users`, POST `/api/admin/users/[id]/adjust-balance`.
3. **Regression Tests**:
   - Toàn bộ 26 test suite / 202 test hiện có phải tiếp tục vượt qua 100%.
   - Chạy `npx tsc --noEmit` và `npm run build` không có lỗi.

---

## 5. Kế Hoạch Triển Khai

Sau khi tài liệu thiết kế này được duyệt, quá trình thi công sẽ tuân theo TDD (Test-Driven Development) và chia thành các nhiệm vụ rõ ràng:
1. **Task 1**: Mở rộng Prisma Schema (`User`, `DepositOrder`, `WalletTransaction`), chạy `prisma db push`.
2. **Task 2**: Xây dựng Customer Auth Engine (`user-auth.ts`, APIs `/api/auth/*`).
3. **Task 3**: Xây dựng Deposit Engine & Webhook Nạp Tiền tự động (`deposit.service.ts`, mở rộng webhook SePay/PayOS).
4. **Task 4**: Xây dựng Wallet Checkout Engine (Thanh toán 1-click & chống race-condition).
5. **Task 5**: UI Giao diện Khách hàng (Navbar User Widget, Trang Đăng nhập/Đăng ký, Trang Nạp tiền `/topup`, Trang Profile `/profile`).
6. **Task 6**: Tích hợp UI Thanh toán 1-Click tại Checkout (`CheckoutClient.tsx`).
7. **Task 7**: Trang Quản trị Thành viên & Điều chỉnh số dư Admin (`/admin/users`).
8. **Task 8**: Chạy toàn bộ kiểm thử hệ thống, build production và deploy lên Fly.io.
