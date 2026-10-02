# Design Specification: Automated Digital Goods Dropshipping & Arbitrage Engine

**Date:** 2026-10-03  
**Status:** Approved by User  
**Target Platform:** Next.js (App Router), TypeScript, Prisma ORM, VietQR, Supplier API Integrations  

---

## 1. Overview & Objectives

Nâng cấp và tích hợp tính năng **mua đi bán lại sản phẩm số tự động (Digital Goods Dropshipping / Arbitrage Engine)** vào nền tảng cửa hàng trực tuyến hiện tại.

Hệ thống cho phép:
- Chủ shop không cần bỏ vốn ôm hàng hoặc lưu trữ key/tài khoản trước.
- Kết nối API tới các sàn/chợ cung cấp sản phẩm số (Taphoammo, Trumthe, các sàn SMM, API thẻ cào/tài khoản).
- Tự động đồng bộ giá gốc, tính toán giá bán theo % lợi nhuận hoặc số tiền chênh lệch mong muốn.
- Khi khách thanh toán qua VietQR trên website của bạn, hệ thống lập tức tự động gọi API sàn nguồn để mua hàng và bàn giao key/tài khoản về cho khách ngay trên màn hình.
- **Quy tắc trải nghiệm khách hàng (White-Label):** Toàn bộ thông báo, giao diện, và văn phong trên web đều thể hiện là sản phẩm phát hành trực tiếp từ hệ thống của bạn ("Hệ thống đang cấp phát mã bản quyền / tài khoản"), tuyệt đối không để lộ thông tin nguồn bên thứ 3 cho khách hàng.

---

## 2. System Architecture

```
[ Khách hàng ]
      │ (1. Đặt mua sản phẩm dropship & quét mã VietQR)
      ▼
[ Next.js Storefront ] ──(2. Webhook thanh toán thành công)──▶ [ Payment Webhook Handler ]
                                                                       │
                                                       (3. Nhận diện FULFILLMENT_TYPE)
                                                                       │
                         ┌─────────────────────────────────────────────┴────────────────────────────────┐
                         ▼                                                                              ▼
                [ LOCAL_STOCK ]                                                                [ API_DROPSHIP ]
          (Giao từ kho ProductItem có sẵn)                                                              │
                                                                                 (4. Gọi Supplier Adapter)
                                                                                                        │
                                                                                                        ▼
                                                                                   [ Supplier Adapter Engine ]
                                                                                   ├── TaphoammoAdapter
                                                                                   ├── TrumtheAdapter
                                                                                   └── MockSupplierAdapter
                                                                                                        │
                                                                            (5. Đặt hàng qua API sàn đối tác)
                                                                                                        │
                                                                                                        ▼
                                                                                            [ Sàn nguồn ngoài ]
                                                                                                        │
                                                                           (6. Nhận key/tài khoản tức thì)
                                                                                                        │
                                                                                                        ▼
[ Màn hình Hoàn thành (/order-success) ] ◀──(7. Bàn giao secretContent cho khách 1-chạm)───────────────┘
```

---

## 3. Data Models & Schema Extensions

```prisma
enum FulfillmentType {
  LOCAL_STOCK
  API_DROPSHIP
}

enum SupplierType {
  TAPHOAMMO
  TRUMTHE
  CUSTOM_REST
}

enum MarkupType {
  PERCENTAGE
  FIXED_AMOUNT
}

enum UpstreamStatus {
  NOT_APPLICABLE
  PENDING_UPSTREAM
  COMPLETED
  FAILED
  REFUNDED
}

model Supplier {
  id             String                    @id @default(uuid())
  name           String                    // e.g. "Taphoammo.net", "Trumthe.vn"
  code           String                    @unique // e.g. "TAPHOAMMO"
  type           SupplierType              @default(CUSTOM_REST)
  baseUrl        String
  apiKey         String
  apiSecret      String?
  currentBalance Int                       @default(0) // Số dư tài khoản đại lý (VND)
  isActive       Boolean                   @default(true)
  mappings       SupplierProductMapping[]
  createdAt      DateTime                  @default(now())
  updatedAt      DateTime                  @updatedAt
}

model SupplierProductMapping {
  id                  String      @id @default(uuid())
  productId           String      @unique
  product             Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  supplierId          String
  supplier            Supplier    @relation(fields: [supplierId], references: [id], onDelete: Cascade)
  supplierProductCode String      // Mã/ID sản phẩm bên sàn nguồn
  supplierPrice       Int         // Giá vốn (VND) cập nhật lần cuối
  markupType          MarkupType  @default(PERCENTAGE)
  markupValue         Float       // e.g. 20 (cho 20%) hoặc 15000 (cho +15.000đ)
  isAutoSync          Boolean     @default(true)
  lastSyncAt          DateTime?
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
}
```

### Các trường bổ sung vào model hiện có:
- **`Product`**:
  - `fulfillmentType: FulfillmentType @default(LOCAL_STOCK)`
  - `supplierMapping: SupplierProductMapping?`
- **`Order`**:
  - `upstreamStatus: UpstreamStatus @default(NOT_APPLICABLE)`
  - `upstreamOrderId: String?`
  - `upstreamError: String?`
  - `refundInfo: String?` // Thông tin số tài khoản / ngân hàng khách cung cấp nếu cần hoàn tiền

---

## 4. Supplier Adapter Interface & Implementations

```typescript
export interface SupplierProductInfo {
  supplierProductCode: string;
  name?: string;
  price: number; // Giá vốn VND
  inStock: number; // Số lượng tồn kho bên sàn
}

export interface SupplierOrderResult {
  success: boolean;
  upstreamOrderId?: string;
  deliveredKeys: string[];
  rawResponse?: any;
  error?: string;
}

export interface ISupplierAdapter {
  checkBalance(config: { baseUrl: string; apiKey: string }): Promise<number>;
  fetchProductInfo(config: { baseUrl: string; apiKey: string }, supplierProductCode: string): Promise<SupplierProductInfo>;
  buyProduct(config: { baseUrl: string; apiKey: string }, supplierProductCode: string, quantity: number, orderCode: string): Promise<SupplierOrderResult>;
}
```

### Các Adapter cụ thể:
1. **`TaphoammoAdapter`**:
   - Tích hợp endpoint API của Taphoammo (API Key truyền qua query hoặc header).
   - Tự động bóc tách danh sách tài khoản / key trả về dạng mảng chuỗi.
2. **`TrumtheAdapter`**:
   - Tích hợp chuẩn API sàn dịch vụ / clone / mail.
3. **`MockSupplierAdapter`**:
   - Dùng cho unit tests và môi trường phát triển cục bộ mà không cần nạp tiền thật vào sàn đối tác.
   - Hỗ trợ mô phỏng: Mua thành công trả key tức thì, mua thất bại do hết số dư, mua thất bại do hết hàng.

---

## 5. Dynamic Pricing & Loss Prevention Guard

### 5.1 Công thức tính giá bán lẻ
- **Theo phần trăm (`PERCENTAGE`):**  
  `retailPrice = Math.round(supplierPrice * (1 + markupValue / 100) / 1000) * 1000` (làm tròn đến hàng nghìn).
- **Theo số tiền cố định (`FIXED_AMOUNT`):**  
  `retailPrice = supplierPrice + markupValue`.

### 5.2 Cơ chế chống bán lỗ (Loss Prevention Guard)
- Khi đồng bộ giá từ sàn nguồn:
  - Nếu `supplierPrice` mới tăng vượt mức khiến `retailPrice < supplierPrice`:
    - Tự động điều chỉnh nâng `retailPrice`.
    - Hoặc gắn cờ cảnh báo và tạm ngừng bán (`Product.isActive = false`) để bảo toàn vốn cho chủ shop.
  - Nếu số lượng tồn kho trên sàn nguồn `= 0`: Tự động cập nhật hiển thị "Tạm hết hàng" trên website.

---

## 6. Real-time Fulfillment Pipeline & White-Label Experience

### 6.1 Quy trình thực thi đơn hàng
1. Khách hàng hoàn tất chuyển khoản VietQR -> Webhook kích hoạt.
2. `payment.service.ts` chuyển đơn sang `PAID`.
3. Kiểm tra sản phẩm trong đơn:
   - Nếu `LOCAL_STOCK`: giữ nguyên luồng cấp phát key từ kho nội bộ `ProductItem`.
   - Nếu `API_DROPSHIP`:
     - Chuyển `Order.upstreamStatus = PENDING_UPSTREAM`.
     - Tìm Adapter của sàn nguồn tương ứng với sản phẩm.
     - Gọi `adapter.buyProduct(...)`.
     - **Thành công:** Tạo các bản ghi `ProductItem` với các key nhận được từ sàn, gán `status = SOLD`, gán `orderId = order.id`, cập nhật `Order.upstreamStatus = COMPLETED`.
     - **Thất bại:** Cập nhật `Order.upstreamStatus = FAILED`, lưu `upstreamError`.
4. Client polling trên màn hình khách (`/checkout/[orderCode]`):
   - Ngay khi phát hiện `PAID` và có `deliveredItems`, tự động chuyển trang `/order-success/[orderCode]`.
   - Màn hình bàn giao hiển thị ngay key và hướng dẫn sử dụng.

### 6.2 Quy chuẩn White-Label (Bảo mật thương hiệu cho chủ web)
- **Tuyệt đối không hiển thị tên sàn đối tác, API bên thứ 3 hoặc nguồn nhập trên màn hình khách hàng.**
- Thông báo trạng thái được chuẩn hóa:
  - *Đang xử lý:* "Hệ thống đang cấp phát mã bản quyền / tài khoản tự động cho bạn, vui lòng đợi trong giây lát (khoảng 5-15 giây)..."
  - *Nếu xảy ra lỗi phát sinh:* "Máy chủ cấp phát mã đang bị quá tải hoặc tạm thời gián đoạn. Chúng tôi cam kết xử lý hoàn tiền hoặc gửi mã thủ công cho bạn trong vòng 5 phút."
  - Có form 1-chạm cho khách nhập Số tài khoản nhận tiền hoàn và nút liên hệ Zalo/Telegram hỗ trợ trực tiếp.

---

## 7. Admin Management Capabilities

1. **Quản lý nhà cung cấp (`/admin/suppliers`):**
   - Thêm/sửa cấu hình API sàn (Tên sàn, Base URL, API Key, Token).
   - Kiểm tra nhanh số dư tài khoản đại lý (Check Balance).
2. **Liên kết sản phẩm với mã sàn đối tác (`/admin/suppliers/mapping`):**
   - Chọn sản phẩm trên web -> Chọn sàn nguồn -> Điền mã sản phẩm bên sàn đối tác.
   - Cài đặt quy tắc định giá (% lợi nhuận hoặc số tiền cộng thêm).
   - Nút "Đồng bộ giá & tồn kho ngay" (Sync Price & Stock).
3. **Giám sát & Xử lý đơn hàng đối tác (`/admin/orders`):**
   - Xem mã đơn hàng đối tác (`upstreamOrderId`).
   - Cảnh báo trực quan các đơn hàng bị lỗi (ví dụ: tài khoản đại lý hết số dư).
   - Nút 1-click "Thử đặt lại qua API" (Retry Upstream Order).
   - Nút 1-click "Giao key thủ công" hoặc "Xác nhận hoàn tiền".

---

## 8. Testing Strategy (TDD)

- **Unit Tests:**
  - Logic tính toán giá bán theo Markup (% và số tiền cố định).
  - Adapter parsing và error handling (Taphoammo, Trumthe, MockAdapter).
- **Integration Tests:**
  - Quy trình hoàn tất đơn hàng dropship: Webhook ngân hàng nhận tiền -> Gọi MockAdapter mua hàng -> Lưu key vào DB -> Bàn giao thành công.
  - Quy trình xử lý lỗi: MockAdapter báo hết số dư / hết hàng -> Đơn hàng chuyển sang `FAILED` an toàn mà không làm crash hệ thống, lưu log lỗi.
  - Quy trình thử đặt lại qua API (Retry endpoint).
