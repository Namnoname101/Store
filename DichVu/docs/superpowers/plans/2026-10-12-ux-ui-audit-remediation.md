# Kế hoạch Xử lý Báo cáo Kiểm định UX/UI - Daitruong Store

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Mục tiêu:** Khắc phục triệt để toàn bộ 15 điểm trừ trong Báo cáo kiểm định UX/UI ngày 12/10/2026, nâng cao độ tin cậy, tính nhất quán thông tin, chuẩn hóa điều hướng và trải nghiệm mua hàng cho khách mới.

---

## Danh sách công việc (Tasks)

### Task 1: Đồng bộ dữ liệu giá, thứ tự gói và thông tin bảo hành (P1)
- [ ] **1.1. Khắc phục mâu thuẫn giá Claude API:**
  - Cập nhật mô tả gói API Claude trong database và code để khớp 100% với đơn giá bán thực tế (18.000đ cho gói 10$ Credit).
  - Loại bỏ các mức giá cũ mâu thuẫn trong mô tả (15.000đ).
- [ ] **1.2. Chuẩn hóa thông tin bảo hành & thời hạn (Gemini Pro & các sản phẩm AI):**
  - Tách bạch rõ ràng giữa:
    - **Thời hạn sử dụng:** 18 tháng (hoặc theo thời hạn gói).
    - **Thời gian bảo hành kích hoạt:** 12 giờ kể từ khi xuất link/tài khoản (hỗ trợ đổi mới ngay nếu link lỗi).
    - **Hỗ trợ kỹ thuật:** 24/7 trong suốt quá trình sử dụng.
  - Thêm component chuẩn hóa `ProductSpecBadge` hiển thị ngay trên đầu trang chi tiết:
    - `Hình thức nhận hàng:` Tài khoản riêng / Link kích hoạt / Key bản quyền / Tự động qua API.
    - `Thời hạn sử dụng:` Ghi rõ số ngày/tháng/năm.
    - `Chính sách bảo hành:` Ghi rõ thời gian bảo hành và phạm vi hỗ trợ.
- [ ] **1.3. Sắp xếp thứ tự các gói lựa chọn (Variant Pills):**
  - Sắp xếp variant pills theo thứ tự giá tăng dần (10$, 20$, 30$, 50$, 100$, 450$...) thay vì thứ tự ngẫu nhiên.

### Task 2: Chuẩn hóa điều hướng Menu, Tìm kiếm và Footer (P1)
- [ ] **2.1. Thống nhất chuyển hướng danh mục:**
  - Trong `Navbar.tsx` và `CatalogExplorer.tsx`:
    - Menu `AI & API` chuyển tới section `ai-api` (hoặc `?category=ai-api`), không ép sang query `?search=ai` làm lộn xộn kết quả.
    - Đổi các category tabs trên thanh điều hướng để khớp với danh mục thực tế đang có sản phẩm: `AI & API`, `Tài khoản AI`, `Bản quyền & Phần mềm`, `Mạng xã hội`, `Tất cả`.
    - Ẩn hoặc nhóm các menu chưa có sản phẩm (Instagram, YouTube, Cloud) vào mục `Khác` hoặc chỉ hiển thị khi có sản phẩm.
- [ ] **2.2. Đồng bộ gợi ý tìm kiếm (Search Suggestions):**
  - Gợi ý tìm kiếm (`Gợi ý: Claude, Cursor, ChatGPT, CapCut, TikTok...`) tìm đúng từ khóa có sản phẩm thật.

### Task 3: Chuẩn hóa nhãn phân loại (Product Types) & Form đặt hàng (P1/P2)
- [ ] **3.1. Sửa nhãn "Khóa học" của dịch vụ MXH:**
  - Trong `src/components/ProductCard.tsx` và `src/app/products/[slug]/page.tsx`:
    - Thay thế nhãn `COURSE_LINK` hiển thị chữ "Khóa học" thành nhãn phù hợp:
      - Nếu sản phẩm thuộc danh mục MXH hoặc có `fulfillmentType: API_DROPSHIP` / SMM: hiển thị nhãn **"Dịch vụ MXH"** (icon Share2 hoặc Sparkles).
      - Nếu sản phẩm là tài khoản: hiển thị **"Tài khoản"** (icon UserCheck).
      - Nếu sản phẩm là key: hiển thị **"Mã kích hoạt / Key"** (icon KeyRound).
- [ ] **3.2. Chuẩn hóa trường nhập Form dịch vụ MXH (TikTok, Facebook):**
  - Kiểm tra slug và tiêu đề dịch vụ:
    - Nếu là dịch vụ TikTok: đổi nhãn thành `Link video TikTok cần tăng tim/view` hoặc `Link kênh TikTok cần tăng follow`, placeholder `https://www.tiktok.com/@user/video/...`.
    - Nếu là dịch vụ Facebook: đổi nhãn thành `Link bài viết / trang Facebook`, placeholder `https://www.facebook.com/...`.
  - Validate định dạng URL trước khi bấm Mua ngay / Thêm giỏ hàng.
- [ ] **3.3. Biên tập lại hướng dẫn kích hoạt Duolingo & các sản phẩm học tập:**
  - Viết lại quy trình kích hoạt Duolingo thành 3 bước tiếng Việt chuyên nghiệp, lịch sự, dễ hiểu cho người mới, loại bỏ tiếng lóng kỹ thuật ("Fake vpn india", "link die").

### Task 4: Sửa trang Nạp tiền (/topup) & Bảo mật tra cứu đơn hàng (P1/P2)
- [ ] **4.1. Sửa metadata & trải nghiệm trang Nạp tiền (/topup):**
  - Sửa `title` trong `src/app/topup/page.tsx` và `layout.tsx` thành `Nạp tiền vào tài khoản - Daitruong Store`.
  - Nếu người dùng chưa đăng nhập, hiển thị giao diện thân thiện:
    - Nút `Đăng nhập để xem số dư ví và lịch sử nạp`.
    - Hoặc form `Nạp tiền nhanh qua VietQR tự động` (chỉ cần nhập số tiền và nội dung chuyển khoản).
- [ ] **4.2. Bảo mật tra cứu đơn hàng bằng Email (`/api/orders/lookup`):**
  - Khi tra cứu bằng email đơn thuần, chỉ trả về danh sách tóm tắt (Mã đơn, Tên sản phẩm, Tổng tiền, Trạng thái, Ngày mua), **KHÔNG** để lộ `secretContent` (mật khẩu/key) trừ khi người dùng mở bằng đường link có kèm `accessToken` gửi về email hoặc xác thực bảo mật.

### Task 5: Chuẩn hóa ảnh sản phẩm & Cam kết tin cậy Footer (P2)
- [ ] **5.1. Tách ảnh riêng biệt cho NordVPN và Facebook:**
  - Cập nhật ảnh đại diện chuẩn, độc lập cho `NordVPN Premium` và `Tăng Like / Follow Facebook`.
- [ ] **5.2. Chuẩn hóa cam kết tin cậy tại Footer và Banner:**
  - Thay thế các từ ngữ tuyệt đối ("bảo mật 100%", "lưu trữ vĩnh viễn") bằng cam kết thực tế:
    - "Bảo hành 1 đổi 1 trong thời gian cam kết".
    - "Tự động cấp phát tức thì 24/7 qua VietQR".
    - "Hỗ trợ kỹ thuật tận tâm qua Zalo & Telegram".

### Task 6: Kiểm thử tự động, Chụp ảnh kiểm định và Triển khai Fly.io
- [ ] Chạy kiểm thử tự động toàn bộ test suite (`npx vitest run`).
- [ ] Chạy kiểm tra TypeScript (`npx tsc --noEmit`).
- [ ] Chụp ảnh kiểm định Playwright trên Desktop & Mobile.
- [ ] Triển khai lên Fly.io và cập nhật dữ liệu database production.
