# Báo cáo Kiểm toán Kỹ thuật Phase 3A (Daitruong Store)

**Ngày thực hiện:** 08/10/2026  
**Nhánh:** `feat/phase3a-cart-guest-checkout` (commit `b281242`)  
**Người kiểm toán:** Antigravity Engineering Agent  

---

## 1. Kết quả kiểm tra 6 hạng mục trọng yếu

### 1.1. Chuyển đổi `Order.customerEmail` sang nullable
- **Cách thức thực hiện:** Tại file `prisma/schema.prisma`, trường `customerEmail` được đổi từ `String` thành `String?`. Lệnh áp dụng được thực thi bằng `npx prisma db push`.
- **Thực trạng versioning & rollback:**
  - Dự án hiện dùng SQLite (`prisma/dev.db`) và cơ chế `prisma db push` đồng bộ trực tiếp schema, **chưa có thư mục `prisma/migrations` version hóa chính thức**.
  - **Phương án Rollback an toàn:**
    1. Backup file database `prisma/dev.db` trước khi thực hiện.
    2. Nếu cần khôi phục lại ràng buộc `NOT NULL`, chạy câu lệnh cập nhật các đơn có `customerEmail IS NULL` thành giá trị mặc định (ví dụ: `guest@daitruong.store` hoặc email hệ thống) trước khi khôi phục schema:
       ```sql
       UPDATE "Order" SET customerEmail = 'guest@daitruong.store' WHERE customerEmail IS NULL;
       ```
    3. Đổi lại `customerEmail String` trong `prisma/schema.prisma` và chạy `npx prisma db push`.
    4. Chi tiết script đã được lưu tại: `prisma/migrations/rollback_customer_email.sql`.

### 1.2. Khả năng bảo toàn dữ liệu đơn hàng cũ
- **Kết quả kiểm tra:** Cơ chế `npx prisma db push` trên SQLite khi nới lỏng ràng buộc từ `NOT NULL` sang `NULL` hoàn toàn không làm mất hay xóa dữ liệu các cột hiện có. Mọi dữ liệu về `totalAmount`, `status`, `expiresAt`, `paidAt`, mã đơn `orderCode` của các đơn hàng cũ đều được bảo toàn nguyên vẹn 100%.

### 1.3. Lưu và chuyển thông tin giao hàng cho giỏ hàng đa sản phẩm
- **Thực trạng phát hiện (Điểm cần xử lý):**
  - Tại Phase 3A, model `OrderItem` trong `prisma/schema.prisma` chỉ có các trường: `id`, `orderId`, `productId`, `price`, `quantity`.
  - Khi khách đặt nhiều sản phẩm tương tác MXH (SMM / Dropship), các link kênh/bài viết đang được ghép chuỗi chung vào trường `Order.customerNote` (`[Tên sản phẩm]: [Link] | ...`).
  - Khi `upstream-fulfillment.service.ts` gọi `adapter.buyProduct`, nó truyền nguyên `order.customerNote` cho mọi sản phẩm dropship.
  - **Giải pháp Phase 3B:** Bổ sung trường `targetLink String?` và `customerNote String?` trực tiếp vào model `OrderItem`. Khi tạo đơn, lưu link riêng cho từng `OrderItem`, và khi thực hiện fulfillment, trích xuất chính xác `item.targetLink` riêng cho từng nhà cung cấp.

### 1.4. Phương thức truy cập lại đơn hàng cho khách vãng lai (không email, không đăng nhập)
- **Thực trạng phát hiện (Rủi ro bảo mật cần xử lý):**
  - Khách vãng lai sau khi đặt hàng hiện dựa vào việc lưu lịch sử ở `localStorage` qua `src/lib/order-storage.ts` và truy cập qua đường dẫn `/checkout/[orderCode]` hoặc `/order-success/[orderCode]`.
  - Mã đơn hàng `orderCode` có định dạng `ORDxxxxxx` (6 ký tự ngẫu nhiên). Nếu một người dùng lạ đoán hoặc brute-force được `orderCode`, họ có thể mở trang để xem thông tin đơn hàng và mã key đã phát.
  - **Giải pháp Phase 3B:** Bổ sung trường `Order.accessToken String @unique @default(uuid())`. Khi tạo đơn, khách nhận được URL an toàn có chứa token bí mật: `/checkout/[orderCode]?token=[accessToken]`. Hệ thống tra cứu sẽ xác thực token này đối với các đơn hàng không có email và chưa đăng nhập, ngăn chặn hoàn toàn việc đoán mã đơn.

### 1.5. Kiểm tra giá, voucher, tồn kho, trạng thái bán phía server
- **Kết quả kiểm tra:** API tạo đơn (`POST /api/orders` gọi `createOrder`) đã thực hiện kiểm tra đầy đủ và độc lập với client:
  - **Giá:** Truy vấn trực tiếp từ cơ sở dữ liệu `productMap.get(item.productId).price`, bỏ qua hoàn toàn giá do client gửi.
  - **Voucher:** Gọi `validateCoupon(couponCode, subtotalAmount)` kiểm tra hạn dùng, lượt dùng, giá trị đơn tối thiểu `minOrderValue`, trần giảm giá `maxDiscount`, và sàn giá tối thiểu 1.000đ.
  - **Trạng thái bán:** Kiểm tra `product.isActive === true`.
  - **Tồn kho:** Kiểm tra `ProductItem` khả dụng và thực hiện `reserveItemsForOrder` nguyên tử trong transaction.
  - **Giới hạn số lượng:** Kiểm tra `minQuantity` và `maxQuantity` của từng sản phẩm.

### 1.6. Cơ chế chống tạo đơn trùng do request lặp
- **Thực trạng phát hiện (Điểm cần xử lý):**
  - Hiện tại, frontend có vô hiệu hóa nút bấm (`disabled={isLoading}`) khi đang gửi request, nhưng phía backend `createOrder` **chưa có idempotency key**.
  - Nếu mạng chập chờn hoặc có 2 request song song lọt qua, backend sẽ tạo ra 2 đơn hàng khác nhau và tạm giữ gấp đôi số lượng tồn kho.
  - **Giải pháp Phase 3B:** Bổ sung trường `Order.idempotencyKey String? @unique`. Client gửi `idempotencyKey` ngẫu nhiên khi submit giỏ hàng. Nếu backend nhận request trùng `idempotencyKey`, nó sẽ trả về ngay đơn hàng đã tạo trước đó thay vì tạo đơn mới.

---

## 2. Kế hoạch hành động kỹ thuật cho Phase 3B
1. Thêm `PaymentIntent` để quản lý vòng đời QR đúng 10 phút.
2. Thêm `Order.accessToken`, `Order.idempotencyKey`, `OrderItem.targetLink`.
3. Bổ sung các trạng thái đối soát: `UNDERPAID`, `OVERPAID`, `EXPIRED_PAYMENT`, `UNMATCHED_ORDER`.
4. Cung cấp màn hình đối soát thủ công riêng cho Chủ sở hữu.
