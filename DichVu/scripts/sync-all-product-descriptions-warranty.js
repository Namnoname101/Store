const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- SYNCING PRODUCT DESCRIPTIONS & WARRANTY ON DATABASE ---');

  const updates = [
    {
      slug: 'chatgpt-free-verify-phone',
      description: `Tài khoản ChatGPT Free sạch tạo sẵn, đã kích hoạt xác minh số điện thoại (Phone SMS Verified) quốc tế chính hãng.

• Định dạng bàn giao: Email | Mật khẩu (Có sẵn mã xác minh)
• Phù hợp: Người dùng cần tài khoản sạch để chat hoặc lấy Token/Session dùng tool mà không có số điện thoại quốc tế để verify.
• Hỗ trợ mô hình: GPT-4o mini, GPT-3.5 và các tính năng Free từ OpenAI.
• Chính sách bảo hành (Chuẩn NCC D-Shop): Bảo hành đăng nhập thành công lần đầu và có sẵn SMS verify (1 đổi 1 trong 24H nếu sai mật khẩu hoặc tài khoản chưa kích hoạt SMS). Sau khi đăng nhập thành công, bạn tự bảo quản tài khoản.`
    },
    {
      slug: 'slot-chatgpt-business-1-thang',
      description: `Gói Slot ChatGPT Business bản quyền 30 ngày dùng chung trong Workspace Business doanh nghiệp cao cấp.

• Định dạng bàn giao: Tài khoản cấp sẵn (Email | Mật khẩu) đã add sẵn vào nhóm Business.
• Tính năng: Truy cập đầy đủ các mô hình cao cấp như GPT-4o, OpenAI o3-mini, o1 Reasoning, tải file, phân tích dữ liệu, tạo ảnh DALL-E 3 không giới hạn số tin nhắn gắt gao như Plus cá nhân.
• Chính sách bảo hành (Chuẩn NCC DKeyShop): Bảo hành Full Date 30 ngày (BHF 30D). 1 đổi 1 tài khoản mới nếu workspace bị lỗi hoặc mất quyền.
• Điều kiện bắt buộc: Tuyệt đối không can thiệp phần Cài đặt Workspace / Billing, không bấm Tự ý rời nhóm (Leave Workspace).`
    },
    {
      slug: 'chatgpt-plus-1-thang',
      description: `Tài khoản ChatGPT Plus 1 Tháng cấp riêng tư (Gói Tiết Kiệm - Chuẩn Nhà Cung Cấp Xoài Non).

• Định dạng bàn giao: Email | Mật khẩu (Tài khoản cấp sẵn).
• Tính năng: Trải nghiệm toàn bộ sức mạnh của GPT-4o, OpenAI o3-mini, o1 Reasoning, Advanced Voice Mode, tạo Custom GPTs.
• Chính sách bảo hành: Bảo hành đăng nhập 24H kể từ lúc hệ thống bàn giao đơn hàng. Đổi mới ngay nếu tài khoản sai mật khẩu hoặc không có Plus lúc nhận.
• QUY ĐỊNH BẮT BUỘC TỪ NCC:
  1. TUYỆT ĐỐI KHÔNG XÓA 2FA (Mã xác thực 2 bước) do hệ thống thiết lập.
  2. Không thay đổi email tài khoản.
  3. Vi phạm xóa 2FA sẽ bị NCC từ chối bảo hành ngay lập tức.`
    },
    {
      slug: 'chatgpt-plus-1-thang-bhf',
      description: `Tài khoản ChatGPT Plus 1 Tháng Bản Quyền Riêng Tư (Gói BHF Cao Cấp - Bảo Hành Full 30 Ngày - Chuẩn NCC DKeyShop).

• Định dạng bàn giao: Email | Mật khẩu (Tài khoản cấp sẵn riêng biệt 100%).
• Tính năng: Sử dụng toàn bộ mô hình cao cấp của OpenAI (GPT-4o, o3-mini, o1, Canvas, Web Browsing, DALL-E 3, Voice Mode).
• Chính sách bảo hành: Bảo hành 1 đổi 1 trọn vẹn 30 ngày sử dụng (BHF 30D). Nếu tài khoản mất Plus trong 30 ngày, hệ thống đổi tài khoản mới ngay lập tức.
• QUY ĐỊNH SỬ DỤNG:
  1. Khách hàng được phép đổi mật khẩu để bảo mật riêng tư.
  2. TUYỆT ĐỐI KHÔNG TẮT / XÓA BẢO MẬT 2FA do hệ thống cài đặt.
  3. Không thay đổi email tài khoản.`
    },
    {
      slug: 'capcut-pro-7-ngay',
      description: `Tài khoản CapCut Pro 7 Ngày bản quyền cao cấp (Chuẩn NCC Shop Xoài Non).

• Định dạng bàn giao: Email | Mật khẩu (Tài khoản cấp sẵn).
• Tính năng: Mở khóa toàn bộ tính năng Pro trên PC & Điện thoại: Xuất video 4K 60fps, Xóa phông thông minh, Hiệu ứng VIP, Âm thanh bản quyền, Tự động tạo phụ đề.
• Chính sách bảo hành: Bảo hành trọn vẹn 7 ngày (1 đổi 1).
• QUY ĐỊNH BẮT BUỘC 100% TỪ NCC:
  1. BẮT BUỘC CHỈ ĐĂNG NHẬP TRÊN 1 THIẾT BỊ DUY NHẤT.
  2. TUYỆT ĐỐI KHÔNG ĐĂNG XUẤT (LOGOUT) trong suốt 7 ngày sử dụng.
  3. TUYỆT ĐỐI KHÔNG GỠ / CÀI LẠI APP trên máy.
  (Vi phạm đăng xuất, đổi máy hoặc xóa app sẽ khiến tài khoản bị khóa và NCC từ chối bảo hành).`
    },
    {
      slug: 'capcut-pro-30-ngay',
      description: `Tài khoản CapCut Pro 30 Ngày (1 Tháng) bản quyền cao cấp (Chuẩn NCC Shop Xoài Non).

• Định dạng bàn giao: Email | Mật khẩu (Tài khoản cấp sẵn).
• Tính năng: Xuất video 4K 60fps mượt mà, chống rung video, xóa phông AI, thư viện template và kho nhạc VIP không giới hạn.
• Chính sách bảo hành: Bảo hành trọn vẹn 30 ngày (1 đổi 1 BHF 30D).
• QUY ĐỊNH BẮT BUỘC 100% TỪ NCC:
  1. CHỈ ĐĂNG NHẬP VÀ SỬ DỤNG TRÊN 1 THIẾT BỊ DUY NHẤT.
  2. TUYỆT ĐỐI KHÔNG BẤM ĐĂNG XUẤT (LOGOUT) TRÊN THIẾT BỊ.
  3. TUYỆT ĐỐI KHÔNG XÓA HOẶC CÀI LẠI ỨNG DỤNG.
  (NCC tự động kiểm tra phiên đăng nhập; nếu đổi thiết bị hoặc logout sẽ mất bảo hành ngay lập tức).`
    },
    {
      slug: 'meitu-vip-7-ngay',
      description: `Tài khoản Meitu VIP 7 Ngày chỉnh sửa ảnh & video nghệ thuật chuẩn Trung (Chuẩn NCC Shop Xoài Non).

• Định dạng bàn giao: Email | Mật khẩu (Tài khoản cấp sẵn).
• Tính năng: Mở khóa trọn bộ công cụ làm đẹp chân dung AI, bóp eo, kéo chân, trang điểm tự động, bộ lọc màu điện ảnh VIP.
• Chính sách bảo hành: Bảo hành 1 đổi 1 trong 7 ngày.
• Quy định NCC: Chỉ dùng trên 1 điện thoại duy nhất, cấm đăng xuất.`
    },
    {
      slug: 'wink-vip-plus-7-ngay',
      description: `Tài khoản Wink VIP Plus 7 Ngày làm nét video 4K bằng trí tuệ nhân tạo (Chuẩn NCC Shop Xoài Non).

• Định dạng bàn giao: Email | Mật khẩu (Tài khoản cấp sẵn).
• Tính năng: Khử mờ video, nâng cấp chất lượng hình ảnh lên Ultra HD 4K, chỉnh sửa khuôn mặt và vóc dáng trong video chuyên nghiệp.
• Chính sách bảo hành: Bảo hành 1 đổi 1 trong 7 ngày.
• Quy định NCC: Dùng trên 1 thiết bị duy nhất, không logout.`
    },
    {
      slug: 'muse-ai-31-ty-token',
      description: `Tài khoản Muse AI số dư 31 Tỷ Token (Gói KBH Trải Nghiệm - Chuẩn NCC Shop Xoài Non).

• Định dạng bàn giao: Email | Mật khẩu (Tài khoản cấp sẵn).
• Tính năng: Hạn mức khổng lồ 31 tỷ token để dịch thuật, tạo nội dung, hỗ trợ viết code và nghiên cứu tài liệu.
• Chính sách bảo hành: Bảo hành đăng nhập thành công và đúng số dư token 31 tỷ lúc nhận đơn. Gói không bảo hành thời gian duy trì (KBH) theo chính sách của nhà cung cấp.`
    }
  ];

  for (const item of updates) {
    try {
      const p = await prisma.product.findUnique({ where: { slug: item.slug } });
      if (p) {
        await prisma.product.update({
          where: { slug: item.slug },
          data: { description: item.description }
        });
        console.log(`✓ Updated product description: ${item.slug}`);
      } else {
        console.log(`- Product not found on DB: ${item.slug}`);
      }
    } catch (err) {
      console.error(`✗ Error updating ${item.slug}:`, err.message);
    }
  }

  await prisma.$disconnect();
  console.log('--- ALL DESCRIPTIONS SYNCED SUCCESSFULLY ---');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
