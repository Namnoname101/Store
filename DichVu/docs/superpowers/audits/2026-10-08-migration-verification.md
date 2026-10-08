# Báo Cáo Kiểm Toán Migration Dữ Liệu Phase 3B.1

## 1. Mục Tiêu & Phạm Vi
Báo cáo kiểm toán này đánh giá tính an toàn dữ liệu, tính tương thích ngược và rủi ro gián đoạn của bản cập nhật schema trong Phase 3B.1 (Payment Safety Hardening).

- **Môi trường cơ sở dữ liệu:** SQLite / PostgreSQL (Prisma ORM)
- **Migration Tag:** `20261008_phase3b_safety_hardening`
- **Tập tin liên quan:**
  - `prisma/migrations/20261008_phase3b_safety_hardening/migration.sql`
  - `prisma/migrations/20261008_phase3b_safety_hardening/rollback.sql`
  - `prisma/schema.prisma`

---

## 2. Các Thay Đổi Schema Trong Phase 3B.1

### A. Bảng `Order`
- Thêm trường `refundStatus` (Kiểu `String?` / `TEXT`, mặc định `NULL`)
  - Giá trị hợp lệ: `REFUND_REQUESTED`, `REFUND_PENDING`, `REFUNDED`
- Thêm trường `refundProof` (Kiểu `String?` / `TEXT`, mặc định `NULL`)
  - Lưu mã tham chiếu / mã giao dịch ngân hàng chuyển tiền hoàn trả thủ công
- Thêm trường `refundedAt` (Kiểu `DateTime?` / `DATETIME`, mặc định `NULL`)
  - Thời điểm Chủ sở hữu ghi nhận hoàn tiền thành công

### B. Bảng `PaymentTransaction`
- Thêm trường `refundStatus` (Kiểu `String?` / `TEXT`, mặc định `NULL`)
  - Giá trị hợp lệ: `REFUND_PENDING`, `REFUNDED`
- Thêm trường `refundProof` (Kiểu `String?` / `TEXT`, mặc định `NULL`)
  - Lưu bằng chứng chuyển khoản hoàn trả gắn với giao dịch ngân hàng cụ thể
- Thêm trường `refundedAt` (Kiểu `DateTime?` / `DATETIME`, mặc định `NULL`)

---

## 3. Đánh Giá An Toàn Dữ Liệu (Zero Data Loss)

1. **Tính Không Phá Hủy (Non-destructive):**
   - Tất cả 6 trường mới đều là **Nullable (`NULL`)**, không có ràng buộc `NOT NULL` và không có giá trị mặc định bắt buộc phá vỡ dữ liệu cũ.
   - Thao tác thực thi sử dụng `ALTER TABLE ... ADD COLUMN`, không tạo lại bảng, không xóa chỉ mục (indexes), không ảnh hưởng đến khóa chính (`id`) hoặc khóa ngoại (`orderId`, `userId`, v.v.).

2. **Bảo Toàn Lịch Sử Giao Dịch & Đơn Hàng:**
   - 100% các đơn hàng cũ, giao dịch ngân hàng cũ được giữ nguyên trạng thái (`status`, `paidAt`, `deliveredItems`, `reconciliationStatus`).
   - Các bản ghi cũ sẽ tự động nhận giá trị `NULL` cho các trường hoàn tiền mới, hoàn toàn tương thích với logic hệ thống.

3. **Phương Án Rollback An Toàn:**
   - Kịch bản rollback đã được chuẩn bị tại `rollback.sql`.
   - Nếu cần quay về phiên bản trước, việc xóa bỏ các cột mới (`DROP COLUMN`) không làm thay đổi các cột cốt lõi của đơn hàng và thanh toán.

---

## 4. Kết Quả Kiểm Thử Thực Tế
- `npx prisma db push` hoàn tất thành công mà không có bất kỳ cảnh báo mất mát dữ liệu nào.
- Toàn bộ các test suite nghiệp vụ cũ và mới (bao gồm `tests/services/admin-reconciliation.test.ts`, `tests/services/webhook-hardening.test.ts`, `tests/services/qr-intent-safety.test.ts`, `tests/ui/guest-token-security.test.ts`) đều vượt qua 100%.
