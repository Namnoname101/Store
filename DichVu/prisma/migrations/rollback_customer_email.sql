-- Script Rollback an toàn cho Order.customerEmail về NOT NULL nếu cần thiết
-- 1. Điền giá trị fallback cho các đơn hàng vãng lai không có email trước khi thêm lại ràng buộc
UPDATE "Order"
SET "customerEmail" = 'guest@daitruong.store'
WHERE "customerEmail" IS NULL;

-- 2. Đổi lại schema trong prisma/schema.prisma:
--    customerEmail String
-- 3. Thực thi đồng bộ schema:
--    npx prisma db push
