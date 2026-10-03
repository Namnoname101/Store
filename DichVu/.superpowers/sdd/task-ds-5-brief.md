# Task 5: White-Label Customer Status & Refund Request UI

**Files:**
- Create: `src/app/api/orders/[orderCode]/refund-request/route.ts`
- Modify: `src/components/CheckoutClient.tsx`
- Modify: `src/components/SecretDisplay.tsx`
- Test: `tests/ui/dropship-customer-flow.test.ts`

**Interfaces:**
- Consumes:
  - `prisma`, `UpstreamStatus`, `OrderStatus` from `@/lib/prisma`
- Produces:
  - `POST /api/orders/[orderCode]/refund-request`
  - `GET /api/orders/[orderCode]/refund-request`
  - White-label customer progress banner during `PENDING_UPSTREAM`
  - Self-service refund form & emergency support buttons during `FAILED`
  - Zero leakage of upstream supplier identities or technical dropship jargon

## Requirements:
1. `src/app/api/orders/[orderCode]/refund-request/route.ts`:
   - `POST`:
     - Payload: `{ bankName: string, accountNumber: string, accountName: string, note?: string }`
     - Validates order exists via `orderCode`.
     - Validates `bankName`, `accountNumber`, `accountName` are non-empty.
     - Saves JSON string to `order.refundInfo`:
       ```json
       {
         "bankName": "...",
         "accountNumber": "...",
         "accountName": "...",
         "note": "...",
         "requestedAt": "2026-10-03T..."
       }
       ```
     - Returns `{ success: true, message: "Yêu cầu hoàn tiền đã được ghi nhận. Hệ thống sẽ xử lý và chuyển khoản cho bạn trong vòng 5-15 phút." }`
   - `GET`:
     - Returns `{ hasRefundRequest: boolean, refundInfo: object | null }`
2. `src/components/CheckoutClient.tsx`:
   - While order is `PAID` but `upstreamStatus === 'PENDING_UPSTREAM'`:
     - Render animated white-label banner: "Hệ thống đang cấp phát mã bản quyền / tài khoản tự động cho bạn, vui lòng đợi trong giây lát (khoảng 5-15 giây)..."
     - Keep polling status every 2-3 seconds until `upstreamStatus` is `COMPLETED` or `FAILED`.
     - When `upstreamStatus === 'COMPLETED'`, auto-redirects to `/order-success/[orderCode]`.
   - When order is `PAID` but `upstreamStatus === 'FAILED'`:
     - Render white-label issue notification: "Máy chủ cấp phát mã đang bị quá tải hoặc tạm thời gián đoạn. Chúng tôi cam kết xử lý hoàn tiền tự động hoặc gửi mã qua email cho bạn trong vòng 5-15 phút."
     - Render inline self-service refund form (Bank Name, Account Number, Account Owner Name, optional Note).
     - When submitted, posts to `/api/orders/[orderCode]/refund-request` and transitions to a success message: "Yêu cầu hoàn tiền của bạn đã được ghi nhận. Nhân viên CSKH sẽ chuyển khoản lại theo thông tin đã cung cấp."
     - Direct support buttons (Zalo / Hotline / Telegram).
3. `src/components/SecretDisplay.tsx`:
   - If order is `PAID` but `upstreamStatus === 'PENDING_UPSTREAM'`:
     - Display progress alert with spinning loader: "Hệ thống đang cấp phát mã tự động cho đơn hàng của bạn. Trang sẽ tự động tải lại sau vài giây."
   - If order is `PAID` but `upstreamStatus === 'FAILED'`:
     - Display notification that fulfillment is delayed.
     - Render refund form if `order.refundInfo` is empty, or show existing refund request status if already submitted.
4. STRICT WHITE-LABEL ENFORCEMENT:
   - In all customer-facing text, notifications, modals, placeholders, and error strings:
     - DO NOT EVER use words: "Taphoammo", "Trumthe", "nhà cung cấp", "sàn ngoài", "đối tác", "upstream", "dropship", or "mua lại".
     - Always use proprietary brand wording: "Hệ thống cấp phát mã tự động", "Máy chủ cấp phát mã", "Đội ngũ kỹ thuật", "Ban quản trị".
5. TDD:
   - Create tests in `tests/ui/dropship-customer-flow.test.ts`:
     - Verify `POST /api/orders/[orderCode]/refund-request` saves `refundInfo` and returns 200.
     - Verify validation failure on missing bank/account fields (400).
     - Verify 404 on invalid `orderCode`.
     - Text scanner test: reads `CheckoutClient.tsx`, `SecretDisplay.tsx`, and `route.ts` to ensure blacklist words ("taphoammo", "trumthe", "sàn ngoài", "đối tác", "upstream") are NOT present in customer-facing strings.
6. Commit: `feat: add white-labeled customer status and refund request flow`.
