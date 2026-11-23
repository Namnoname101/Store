const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

/**
 * STANDARDIZE ALL 39 ACTIVE PRODUCTS (DESCRIPTIONS & REALISTIC ORIGINAL PRICES)
 * - Clean, human-written Vietnamese 4-5 bullet points per product
 * - Zero raw markdown (** or `), zero Emoji spam, zero "(chuẩn hệ thống tự động)", zero "o1, o1" or legacy models
 * - Frontier AI Models enforced: Gemini 4 Argon & 3.8 Flash, Claude 5.5 & 5.6 (Opus 5.5, Sonnet 5.5), GPT-6 series, GPT-5 Reasoning, OpenAI o3 & o1, GPT-4.5 High-EQ
 * - Believable originalPrice (~1.4x - 2x retail price)
 */

const PRODUCT_CONTENT_STANDARDS = [
  // ==========================================
  // 1. API CODEX (5 gói)
  // ==========================================
  {
    slug: 'cdx-0055-api-codex-ai-toc-o-nhanh-10-credit',
    originalPrice: 35000,
    description: `• Hạn mức: 10$ Credit (5.000.000 Quota Points) bảo lưu vĩnh viễn, không giới hạn ngày dùng.
• Hình thức nhận: Tự động cấp API Key mới (sk-...) hoặc nạp cộng dồn vào Key cũ ngay sau khi thanh toán.
• Tương thích: Chuẩn OpenAI Compatible 100% — dùng ngay trên Cursor IDE, VS Code (Cline / Roo Code), ChatGPT Desktop và OpenAI Codex.
• Mô hình hỗ trợ: Mở khóa trọn bộ GPT-6 series (Astra, Sol, Luna), GPT-5 Reasoning, OpenAI o3 & o3-mini, o1 & o1-pro và GPT-4.5 High-EQ.
• Bảo hành: Cam kết chuẩn 100% hạn mức Credit và tốc độ phản hồi ổn định 24/7.`,
  },
  {
    slug: 'cdx-0056-api-codex-ai-toc-o-nhanh-50-credit',
    originalPrice: 150000,
    description: `• Hạn mức: 50$ Credit (25.000.000 Quota Points) bảo lưu vĩnh viễn, tiết kiệm hơn so với mua lẻ từng gói 10$.
• Hình thức nhận: Tự động cấp API Key mới (sk-...) hoặc nạp cộng dồn vào Key cũ ngay sau khi thanh toán.
• Tương thích: Chuẩn OpenAI Compatible 100% — dùng ngay trên Cursor IDE, VS Code (Cline / Roo Code), ChatGPT Desktop và OpenAI Codex.
• Mô hình hỗ trợ: Mở khóa trọn bộ GPT-6 series (Astra, Sol, Luna), GPT-5 Reasoning, OpenAI o3 & o3-mini, o1 & o1-pro và GPT-4.5 High-EQ.
• Bảo hành: Cam kết chuẩn 100% hạn mức Credit và tốc độ phản hồi ổn định 24/7.`,
  },
  {
    slug: 'cdx-0057-api-codex-ai-toc-o-nhanh-100-credit',
    originalPrice: 290000,
    description: `• Hạn mức: 100$ Credit (50.000.000 Quota Points) bảo lưu vĩnh viễn — gói chủ lực tối ưu chi phí cho lập trình viên.
• Hình thức nhận: Tự động cấp API Key mới (sk-...) hoặc nạp cộng dồn vào Key cũ ngay sau khi thanh toán.
• Tương thích: Chuẩn OpenAI Compatible 100% — dùng ngay trên Cursor IDE, VS Code (Cline / Roo Code), ChatGPT Desktop và OpenAI Codex.
• Mô hình hỗ trợ: Mở khóa trọn bộ GPT-6 series (Astra, Sol, Luna), GPT-5 Reasoning, OpenAI o3 & o3-mini, o1 & o1-pro và GPT-4.5 High-EQ.
• Bảo hành: Cam kết chuẩn 100% hạn mức Credit và tốc độ phản hồi ổn định 24/7.`,
  },
  {
    slug: 'cdx-0058-api-codex-ai-toc-o-nhanh-200-credit',
    originalPrice: 550000,
    description: `• Hạn mức: 200$ Credit (100.000.000 Quota Points) bảo lưu vĩnh viễn, dành cho nhu cầu code dự án liên tục.
• Hình thức nhận: Tự động cấp API Key mới (sk-...) hoặc nạp cộng dồn vào Key cũ ngay sau khi thanh toán.
• Tương thích: Chuẩn OpenAI Compatible 100% — dùng ngay trên Cursor IDE, VS Code (Cline / Roo Code), ChatGPT Desktop và OpenAI Codex.
• Mô hình hỗ trợ: Mở khóa trọn bộ GPT-6 series (Astra, Sol, Luna), GPT-5 Reasoning, OpenAI o3 & o3-mini, o1 & o1-pro và GPT-4.5 High-EQ.
• Bảo hành: Cam kết chuẩn 100% hạn mức Credit và tốc độ phản hồi ổn định 24/7.`,
  },
  {
    slug: 'cdx-0060-api-codex-ai-toc-o-nhanh-500-credit',
    originalPrice: 1250000,
    description: `• Hạn mức: 500$ Credit (250.000.000 Quota Points) bảo lưu vĩnh viễn — mức chiết khấu tốt nhất cho nhóm phát triển & hệ thống lớn.
• Hình thức nhận: Tự động cấp API Key mới (sk-...) hoặc nạp cộng dồn vào Key cũ ngay sau khi thanh toán.
• Tương thích: Chuẩn OpenAI Compatible 100% — dùng ngay trên Cursor IDE, VS Code (Cline / Roo Code), ChatGPT Desktop và OpenAI Codex.
• Mô hình hỗ trợ: Mở khóa trọn bộ GPT-6 series (Astra, Sol, Luna), GPT-5 Reasoning, OpenAI o3 & o3-mini, o1 & o1-pro và GPT-4.5 High-EQ.
• Bảo hành: Cam kết chuẩn 100% hạn mức Credit và tốc độ phản hồi ổn định 24/7.`,
  },

  // ==========================================
  // 2. API CLAUDE (5 gói)
  // ==========================================
  {
    slug: 'api-claude-10-max-10-credit',
    originalPrice: 50000,
    description: `• Hạn mức: 10$ Credit API Anthropic Claude tốc độ cao, tính theo đúng lượng token sử dụng thực tế.
• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.
• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).
• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.
• Bảo hành: Bảo hành trọn vẹn số dư 10$ Credit và đường truyền kết nối ổn định.`,
  },
  {
    slug: 'api-claude-30-max-30-credit',
    originalPrice: 135000,
    description: `• Hạn mức: 30$ Credit API Anthropic Claude tốc độ cao, phù hợp cho lập trình viên làm việc hàng ngày.
• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.
• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).
• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.
• Bảo hành: Bảo hành trọn vẹn số dư 30$ Credit và đường truyền kết nối ổn định.`,
  },
  {
    slug: 'api-claude-50-max-50-credit',
    originalPrice: 220000,
    description: `• Hạn mức: 50$ Credit API Anthropic Claude tốc độ cao — gói phổ biến nhất cho kỹ sư phần mềm chuyên nghiệp.
• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.
• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).
• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.
• Bảo hành: Bảo hành trọn vẹn số dư 50$ Credit và đường truyền kết nối ổn định.`,
  },
  {
    slug: 'api-claude-100-max-100-credit',
    originalPrice: 420000,
    description: `• Hạn mức: 100$ Credit API Anthropic Claude tốc độ cao, tối ưu cho dự án lớn và sử dụng Claude Code CLI cường độ cao.
• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.
• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).
• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.
• Bảo hành: Bảo hành trọn vẹn số dư 100$ Credit và đường truyền kết nối ổn định.`,
  },
  {
    slug: 'api-claude-1-thang-max-5000-credit',
    originalPrice: 4200000,
    description: `• Hạn mức: 5.000$ Credit API Anthropic Claude Max thời hạn 1 tháng, phục vụ team phát triển hoặc hệ thống Production tải lớn.
• Hình thức nhận: Hệ thống cấp mã API Key (sk-...) tự động ngay trên màn hình đơn hàng sau khi thanh toán.
• Mô hình hỗ trợ: Đầy đủ thế hệ Claude 5.5 & 5.6 mới nhất (Claude Opus 5.5, Claude Sonnet 5.5 và Haiku 5.5).
• Tương thích: Tích hợp mượt mà vào Claude Code CLI, Cursor IDE, VS Code (Cline / Roo Code), Claude Desktop và OpenClaw.
• Bảo hành: Bảo hành kết nối và hạn mức 5.000$ Credit suốt 30 ngày sử dụng.`,
  },

  // ==========================================
  // 3. TÀI KHOẢN AI (10 sản phẩm)
  // ==========================================
  {
    slug: 'chatgpt-free-verify-phone',
    originalPrice: 39000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản sạch (Email | Mật khẩu) đã xác minh số điện thoại quốc tế (SMS Verified).
• Công dụng: Đăng nhập chat ngay tại chatgpt.com hoặc lấy Session Token / API dùng trên Cursor, VS Code, Codex mà không bị chặn đòi xác minh SĐT.
• Lưu ý gói: Đây là tài khoản Free đã verify phone (không phải gói trả phí Plus). Bạn được phép đổi mật khẩu sau khi nhận.
• Bảo hành: Bảo hành 1 đổi 1 trong 24 giờ đầu nếu sai mật khẩu hoặc tài khoản chưa kích hoạt SĐT.`,
  },
  {
    slug: 'up-gemini-pro-5tb-12-thang-chinh-chu-kbh',
    originalPrice: 59000,
    description: `• Hình thức nâng cấp: Bạn nhập Gmail | Mật khẩu | 2FA ở khung đặt hàng, quản trị viên sẽ đăng nhập và nâng trực tiếp gói 5TB thời hạn 12 tháng vào tài khoản đó.
• Quyền lợi: Nhận 5.000GB (5TB) bộ nhớ Google One (Drive, Gmail, Photos) và mở khóa Gemini 4 Argon & Gemini 3.8 Flash trong Google Antigravity, AI Studio, NotebookLM.
• Mẹo bảo mật: Bạn có thể đưa một Gmail phụ để shop nâng 5TB, sau đó dùng tài khoản đó tạo nhóm Google Family và mời Gmail chính vào dùng chung.
• Chính sách gói KBH: Gói xả kho giá rẻ 19.000đ chỉ bảo hành kích hoạt lên đủ 5TB lúc bàn giao, không bảo hành thời gian duy trì về sau.`,
  },
  {
    slug: 'muse-ai-31-ty-token',
    originalPrice: 79000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản riêng (Email | Mật khẩu) ngay sau khi thanh toán.
• Quyền lợi: Tài khoản có sẵn số dư 31 Tỷ Token không giới hạn ngày hết hạn để xử lý nội dung, phân tích tài liệu và lưu trữ video AI.
• Chính sách gói KBH: Bảo hành 1 đổi 1 trong 24 giờ đầu nếu sai mật khẩu hoặc thiếu số dư 31 tỷ token lúc nhận (không bảo hành thời gian duy trì về sau).`,
  },
  {
    slug: 'nordvpn-premium-3-thang',
    originalPrice: 139000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản hoặc mã kích hoạt NordVPN Premium 3 tháng tự động ngay sau khi thanh toán.
• Quyền lợi: Mở khóa hơn 6.000+ máy chủ VPN siêu tốc tại 111 quốc gia, đổi IP an toàn, vượt tường lửa và chặn quảng cáo độc hại.
• Quy định sử dụng: Kích hoạt và đăng nhập sử dụng ngay sau khi nhận đơn, không tự ý đổi mật khẩu hoặc thông tin tài khoản.
• Bảo hành: Bảo hành kích hoạt và đăng nhập thành công trong 24 giờ đầu kể từ khi nhận đơn (không bảo hành lưu trữ code).`,
  },
  {
    slug: 'gemini-pro-5tb-1-nam-slot-chinh-chu',
    originalPrice: 249000,
    description: `• Hình thức nhận: Hệ thống cấp link kích hoạt tự động 24/7. Bạn chỉ cần mở link và điền địa chỉ Gmail chính chủ của mình (không cần đưa mật khẩu).
• Thời gian hoàn tất: Lời mời tham gia nhóm Google Family 5TB sẽ được gửi về hộp thư Gmail của bạn trong khoảng 15 – 60 phút.
• Quyền lợi 1 năm: Sở hữu 5.000GB (5TB) Google One, mở khóa mô hình Gemini 4 Argon & Gemini 3.8 Flash trong Google Antigravity, AI Studio, NotebookLM và 1.000 Credit Google Veo 3.
• Bảo hành: Bảo hành 3 tháng 1 đổi 1 (hỗ trợ mời lại nhóm mới nhanh chóng nếu nhóm Family gặp sự cố).`,
  },
  {
    slug: 'gemini-pro-argon-4-family-5tb',
    originalPrice: 280000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Google riêng biệt (Gmail | Mật khẩu | Mã 2FA | Mail khôi phục) giữ vai trò Chủ nhóm Family.
• Quyền lợi Chủ Family: Sở hữu 5TB Google One, kích hoạt sẵn Gemini 4 Argon & Gemini 3.8 Flash trong Google Antigravity & AI Studio. Toàn quyền mời thêm tối đa 5 Gmail cá nhân khác vào dùng chung.
• Lưu ý kỹ thuật: Gmail cấp sẵn này bị khóa nhận thư bên ngoài, chỉ chuyên dùng cho hệ sinh thái Google (Gemini, Drive 5TB, Antigravity, AI Studio).
• Chính sách gói KBH: Bảo hành đăng nhập thành công trong 2 giờ đầu (1 đổi 1 nếu sai pass/2FA lúc nhận, không bảo hành thời gian duy trì).`,
  },
  {
    slug: 'tai-khoan-gemini-pro-argon-4-chu-family-3-thang',
    originalPrice: 290000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Google riêng biệt (Gmail | Mật khẩu | Mã 2FA | Mail khôi phục) giữ vai trò Chủ nhóm Family thời hạn 3 tháng.
• Quyền lợi Chủ Family: Sở hữu 5TB Google One, sử dụng mượt mà Gemini 4 Argon, Gemini 3.8 Flash, Claude Opus 5.5 & Sonnet 5.5 trong Google Antigravity & AI Studio. Mời được thêm tối đa 5 Gmail khác dùng chung.
• Lưu ý kỹ thuật: Gmail cấp sẵn bị hạn chế nhận thư từ bên ngoài, chỉ chuyên dùng cho các dịch vụ Google (không dùng để nhận OTP dịch vụ ngoài).
• Bảo hành: Bảo hành 1 đổi 1 trong 7 ngày (1 tuần) đầu nếu phát sinh lỗi đăng nhập hoặc mất quyền lợi gói Pro.`,
  },
  {
    slug: 'chatgpt-plus-1-thang',
    originalPrice: 320000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản ChatGPT Plus riêng (Email | Mật khẩu | Mã 2FA) ngay sau khi thanh toán.
• Tính năng mở khóa: Sử dụng trọn bộ mô hình GPT-6 series (Astra, Sol, Luna), GPT-5 Reasoning, OpenAI o3 & o3-mini, o1, GPT-4.5 High-EQ, vẽ ảnh DALL·E 3, Canvas và Advanced Voice.
• Quy định: Tuyệt đối không xóa bảo mật 2FA và không đổi email gốc của tài khoản.
• Bảo hành (Gói Tiết Kiệm): Bảo hành đăng nhập và có sẵn Plus chuẩn trong 24 giờ đầu (cần bảo hành trọn 30 ngày vui lòng chọn gói Bảo Hành Full).`,
  },
  {
    slug: 'slot-chatgpt-business-1-thang',
    originalPrice: 320000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản (Email | Mật khẩu) đã được thêm vào không gian làm việc ChatGPT Business bản quyền.
• Tính năng mở khóa: Truy cập không giới hạn tốc độ cao các mô hình GPT-6 series, GPT-5 Reasoning, OpenAI o3 & o3-mini, o1, GPT-4.5 High-EQ, phân tích file và vẽ ảnh DALL·E 3 với hạn mức tin nhắn gấp đôi gói Plus thường.
• Quyền riêng tư: Lịch sử đoạn chat của bạn là riêng tư trong tài khoản được cấp. Không tự ý bấm rời nhóm (Leave Workspace) hoặc can thiệp mục Billing.
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn suốt 30 ngày sử dụng.`,
  },
  {
    slug: 'chatgpt-plus-1-thang-bhf',
    originalPrice: 450000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản ChatGPT Plus riêng tư 100% (Email | Mật khẩu | Mã 2FA) dành cho 1 người dùng độc quyền.
• Tính năng mở khóa: Trọn bộ mô hình cao cấp nhất của OpenAI gồm GPT-6 series (Astra, Sol, Luna), GPT-5 Reasoning, OpenAI o3 & o3-mini, o1 & o1-pro, GPT-4.5 High-EQ, Canvas, DALL·E 3 và giọng nói thời gian thực.
• Quyền hạn & Lưu ý: Bạn được phép đổi mật khẩu riêng tư, nhưng tuyệt đối không tắt/xóa bảo mật 2FA và không đổi email tài khoản.
• Bảo hành (Gói Cao Cấp BHF): Cam kết bảo hành 1 đổi 1 trong suốt 30 ngày nếu tài khoản mất Plus hoặc gặp lỗi hệ thống.`,
  },
  {
    slug: 'suno-ai-pro-1-thang',
    originalPrice: 350000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Suno AI Pro riêng (Email | Mật khẩu) ngay sau khi thanh toán.
• Quyền lợi gói Pro: Có sẵn 2.500 Credits (sáng tác khoảng 500 bài hát AI chất lượng phòng thu), kèm bản quyền thương mại (Commercial Rights) để đăng YouTube, TikTok, Spotify.
• Bảo hành: Bảo hành 1 đổi 1 trong 24 giờ đầu đảm bảo đăng nhập thành công và đủ 2.500 Credits ban đầu.`,
  },

  // ==========================================
  // 4. HỌC TẬP & THIẾT KẾ (7 sản phẩm)
  // ==========================================
  {
    slug: 'wink-vip-plus-7-ngay',
    originalPrice: 45000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Wink VIP+ riêng tư (Email | Mật khẩu) ngay sau khi thanh toán.
• Tính năng mở khóa: Làm nét video AI lên chuẩn 4K Ultra HD, khử mờ, chống rung, làm đẹp chân dung video và mở khóa toàn bộ hiệu ứng VIP+.
• Quy định bắt buộc: Chỉ đăng nhập trên 1 thiết bị duy nhất và không bấm đăng xuất (Logout) trong quá trình dùng.
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn 7 ngày sử dụng.`,
  },
  {
    slug: 'duolingo-super-12-thang',
    originalPrice: 99000,
    description: `• Hình thức nhận: Hệ thống cấp link redeem kích hoạt Duolingo Super 12 tháng trực tiếp trên tài khoản chính chủ của bạn (không cần mật khẩu, không cần thêm thẻ thanh toán).
• Quyền lợi gói Super: Trái tim vô hạn (học không lo bị gián đoạn khi làm sai), 100% không quảng cáo, mở khóa luyện phát âm, ôn tập lỗi sai và kiểm tra tiến độ không giới hạn.
• Bảo hành: Bảo hành link kích hoạt 1 đổi 1 trong 24 giờ kể từ khi nhận đơn nếu link lỗi (vui lòng kích hoạt ngay sau khi nhận; kích hoạt lên Super thành công là hoàn tất đơn).`,
  },
  {
    slug: 'photoroom-max-7-ngay',
    originalPrice: 80000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Photoroom gói Max cao cấp nhất (Email | Mật khẩu) dùng ngay sau khi thanh toán.
• Tính năng mở khóa: Tách nền AI siêu sạch đến từng sợi tóc, tạo phông nền Studio bán hàng chuyên nghiệp cho Shopee / TikTok Shop, xử lý hàng loạt ảnh và xuất ảnh 4K không dính logo.
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn suốt 7 ngày sử dụng.`,
  },
  {
    slug: 'quizlet-plus-1-thang',
    originalPrice: 95000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Quizlet Plus gói Teacher bản quyền (Email | Mật khẩu) ngay sau khi thanh toán.
• Quyền lợi: Học ngoại ngữ và ôn thi 100% không quảng cáo, mở khóa toàn bộ chế độ Học (Learn), Kiểm tra (Test), tạo thẻ ghi nhớ Flashcard không giới hạn và quản lý lớp học.
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn suốt 30 ngày sử dụng.`,
  },
  {
    slug: 'xingtu-vip-30-ngay',
    originalPrice: 180000,
    description: `• Hình thức nhận: Hệ thống bàn giao số điện thoại kèm đường link lấy mã OTP tự động để bạn đăng nhập trực tiếp vào app Xingtu (醒图).
• Tính năng mở khóa: Toàn bộ kho bộ lọc màu Douyin VIP, chỉnh dáng & làm đẹp chân dung bằng AI, xóa vật thể thừa và xuất ảnh độ phân giải cao không dính watermark.
• Quy định bắt buộc: Chỉ đăng nhập trên 1 điện thoại duy nhất, không đăng xuất và không xóa app trong suốt 30 ngày.
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn 30 ngày nếu tài khoản mất quyền VIP.`,
  },
  {
    slug: 'figma-pro-education-2-nam',
    originalPrice: 390000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Figma Pro Education riêng tư 100% (Email | Mật khẩu, 1 người dùng độc quyền) ngay sau khi thanh toán.
• Quyền lợi gói 2 năm: Tạo dự án và file thiết kế không giới hạn, mở khóa đầy đủ Dev Mode cho lập trình viên, bảng vẽ FigJam, tặng 3.000 credits/tháng và bộ công cụ thiết kế AI (Figma Make & Claude Sonnet 5.5 / Opus 5.5).
• Bảo hành: Bảo hành đăng nhập thành công và tài khoản có sẵn chuẩn gói Figma Pro Education 2 năm trong 24 giờ đầu kể từ khi nhận đơn.`,
  },
  {
    slug: 'adobe-full-apps-1-thang',
    originalPrice: 890000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Adobe Creative Cloud All Apps bản quyền (Email | Mật khẩu) dùng ngay sau khi thanh toán.
• Quyền lợi: Tải và sử dụng trọn bộ hơn 20+ phần mềm Adobe mới nhất (Photoshop, Illustrator, Premiere Pro, After Effects, Lightroom, Acrobat Pro...) kèm tính năng AI Generative Fill (Firefly).
• Thiết bị hỗ trợ: Cho phép đăng nhập sử dụng đồng thời trên tối đa 2 thiết bị (Windows, macOS, iPad).
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn suốt 30 ngày sử dụng (không tự ý đổi email tài khoản).`,
  },

  // ==========================================
  // 5. PHẦN MỀM & BẢN QUYỀN (7 sản phẩm)
  // ==========================================
  {
    slug: 'capcut-pro-7-ngay',
    originalPrice: 39000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản CapCut Pro (Email | Mật khẩu) ngay trên màn hình đơn hàng sau khi thanh toán.
• Tính năng mở khóa: Xuất video 4K 60fps không logo, xóa phông nền AI, tự động tạo phụ đề tiếng Việt, chống rung và dùng toàn bộ kho hiệu ứng / âm thanh Pro.
• Quy định bắt buộc: Chỉ đăng nhập trên 1 thiết bị duy nhất (điện thoại hoặc máy tính), không bấm đăng xuất (Logout) và không gỡ cài lại app.
• Bảo hành: Bảo hành 1 đổi 1 suốt 7 ngày sử dụng.`,
  },
  {
    slug: 'canva-pro-1-thang',
    originalPrice: 45000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Canva Pro dùng riêng tư (Email | Mật khẩu, kèm quyền truy cập hộp thư) ngay sau khi thanh toán.
• Tính năng mở khóa: Hơn 100+ triệu mẫu thiết kế và hình ảnh Premium, trọn bộ công cụ AI Magic Studio (tách nền 1 chạm, xóa vật thể, mở rộng ảnh) và xuất file PNG trong suốt / PDF in ấn / video 4K.
• Bảo hành: Bảo hành đăng nhập và kích hoạt đầy đủ tính năng Canva Pro trong 24 giờ đầu kể từ khi nhận đơn.`,
  },
  {
    slug: 'meitu-vip-7-ngay',
    originalPrice: 39000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Meitu VIP (Email | Mật khẩu) ngay sau khi thanh toán.
• Tính năng mở khóa: Mở khóa toàn bộ công cụ chỉnh ảnh & video AI cao cấp (làm nét ảnh cũ, retouch da tự nhiên, chỉnh dáng, xóa vật thể và bộ lọc màu VIP).
• Quy định bắt buộc: Chỉ đăng nhập trên 1 thiết bị duy nhất, không bấm đăng xuất (Logout) và không xóa app trong thời gian dùng.
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn suốt 7 ngày sử dụng.`,
  },
  {
    slug: 'key-hma-vpn-1-thang',
    originalPrice: 59000,
    description: `• Hình thức nhận: Hệ thống cấp mã License Key bản quyền HMA VPN tự động ngay sau khi thanh toán.
• Quyền lợi: Kích hoạt trực tiếp trên ứng dụng HMA VPN, đổi IP siêu tốc 20Gbps tại hơn 190+ quốc gia (290+ vị trí máy chủ) và có chế độ tự động xoay IP (IP Shuffle).
• Thiết bị hỗ trợ: Sử dụng đồng thời cho tối đa 5 thiết bị (Windows, macOS, Android).
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn suốt 30 ngày sử dụng.`,
  },
  {
    slug: 'office-365-1-nam',
    originalPrice: 89000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản Microsoft Office 365 Plus riêng tư (Email | Mật khẩu khởi tạo) ngay sau khi thanh toán. Bạn được tự đổi mật khẩu riêng ở lần đăng nhập đầu tiên.
• Quyền lợi: Cài đặt và kích hoạt bản quyền trọn bộ Word, Excel, PowerPoint, Outlook bản mới nhất cho tối đa 5 thiết bị (Windows, Mac, iPad, iPhone, Android).
• Lưu ý sử dụng: Khuyến nghị lưu file quan trọng trên ổ cứng máy tính cá nhân để chủ động bảo toàn dữ liệu.
• Bảo hành: Bảo hành đăng nhập và kích hoạt bản quyền Office 365 thành công trong 24 giờ đầu kể từ khi nhận đơn.`,
  },
  {
    slug: 'capcut-pro-30-ngay',
    originalPrice: 139000,
    description: `• Hình thức nhận: Cấp sẵn tài khoản CapCut Pro 1 tháng (Email | Mật khẩu) ngay trên màn hình đơn hàng sau khi thanh toán.
• Tính năng mở khóa: Sử dụng liên tục 30 ngày không cần đổi nick — xuất video 4K 60fps, xóa phông AI, phụ đề tự động, làm mịn da và kho tài nguyên VIP không giới hạn.
• Quy định bắt buộc: Chỉ đăng nhập trên 1 thiết bị duy nhất (điện thoại hoặc máy tính), không bấm đăng xuất (Logout) và không gỡ cài lại app.
• Bảo hành: Bảo hành 1 đổi 1 trọn vẹn suốt 30 ngày sử dụng.`,
  },
  {
    slug: 'adobe-express-12-thang',
    originalPrice: 159000,
    description: `• Hình thức nhận: Cấp đường link / mã kích hoạt bản quyền 12 tháng nâng cấp trực tiếp lên tài khoản Adobe chính chủ của bạn.
• Tính năng mở khóa: Thiết kế đồ họa nhanh trên Web & Điện thoại, tạo ảnh AI bằng Adobe Firefly, xóa phông ảnh/video 1 chạm, kho 200 triệu ảnh Adobe Stock và 20.000+ phông chữ bản quyền.
• Lưu ý kích hoạt: Khi bấm nhận ưu đãi nếu báo giới hạn quốc gia, bạn chỉ cần bật VPN sang Ấn Độ (India) để kích hoạt, sau đó tắt VPN dùng bình thường tại Việt Nam.
• Bảo hành: Bảo hành kích hoạt thành công lên gói 12 tháng Premium trong 24 giờ kể từ khi nhận đơn.`,
  },

  // ==========================================
  // 6. GIẢI TRÍ & PHIM ẢNH (1 sản phẩm)
  // ==========================================
  {
    slug: 'youtube-premium-1-thang',
    originalPrice: 55000,
    description: `• Hình thức nâng cấp: Không cần mật khẩu. Bạn chỉ cần nhập địa chỉ Gmail ở khung đặt hàng, hệ thống sẽ gửi thư mời tham gia nhóm Google Family.
• Cách kích hoạt: Mở hộp thư Gmail của bạn và bấm nút "Chấp nhận lời mời" (Accept Invitation) là tài khoản lên ngay YouTube Premium.
• Quyền lợi: Xem YouTube 100% không quảng cáo trên TV, điện thoại, máy tính; phát nhạc/video chạy nền khi tắt màn hình; tải video xem offline và tặng kèm trọn gói YouTube Music Premium.
• Điều kiện & Bảo hành: Gmail của bạn chưa đổi nhóm gia đình Google quá 1 lần trong 12 tháng qua. Bảo hành 1 đổi 1 trọn vẹn suốt 30 ngày.`,
  },

  // ==========================================
  // 7. DỊCH VỤ MẠNG XÃ HỘI (4 sản phẩm)
  // ==========================================
  {
    slug: 'tang-tim-tiktok-1000',
    originalPrice: 50,
    description: `• Hình thức chạy: Chỉ cần dán đường link video TikTok công khai và chọn số lượng tim muốn tăng, hệ thống tự động chạy ngay sau khi thanh toán.
• Chất lượng: Tương tác từ người dùng Việt Nam tự nhiên, lên nhanh, an toàn tuyệt đối cho kênh và hỗ trợ đẩy video lên xu hướng.
• Lưu ý: Hãy để video ở chế độ Công khai (Public) và không đổi username kênh trong lúc đơn đang chạy.`,
  },
  {
    slug: 'tang-like-facebook-1000',
    originalPrice: 60,
    description: `• Hình thức chạy: Chỉ cần dán đường link bài viết hoặc ảnh Facebook công khai và chọn số lượng like, hệ thống tự động lên đơn tức thì 24/7.
• Chất lượng: Like người dùng Việt Nam thật, lên đều tự nhiên, giúp tăng độ uy tín cho bài đăng bán hàng và trang cá nhân / Fanpage.
• Lưu ý: Đảm bảo bài viết đã bật chế độ Công khai (Mọi người đều có thể xem và like) trước khi đặt đơn.`,
  },
  {
    slug: 'tang-follow-facebook-1000',
    originalPrice: 80,
    description: `• Hình thức chạy: Dán đường link trang cá nhân (Profile) hoặc Fanpage Facebook của bạn và nhập số lượng người theo dõi cần tăng.
• Chất lượng: Lượt theo dõi từ tài khoản Việt Nam, tăng độ tin cậy cho nick bán hàng, có bảo hành bù tụt theo chính sách server.
• Lưu ý: Hãy bật tính năng Cho phép người lạ theo dõi (Công khai người theo dõi) trong cài đặt Facebook trước khi đặt đơn.`,
  },
  {
    slug: 'tang-follow-tiktok-1000',
    originalPrice: 110,
    description: `• Hình thức chạy: Dán đường link kênh TikTok của bạn (https://www.tiktok.com/@username) và chọn số lượng Follower muốn tăng.
• Chất lượng: Follower tài khoản Việt Nam chất lượng cao, hỗ trợ kênh nhanh đủ điều kiện mở TikTok Shop, gắn giỏ hàng và phát Livestream.
• Lưu ý: Để tài khoản TikTok ở chế độ Công khai (không để Riêng tư) và không đổi ID kênh trong quá trình chạy.`,
  },
];

function buildRunner() {
  return `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const STANDARDS = ${JSON.stringify(PRODUCT_CONTENT_STANDARDS)};

async function run(label) {
  console.log('=== [' + label + '] UPDATING PRODUCT DESCRIPTIONS & ORIGINAL PRICES ===');
  let count = 0;
  for (const item of STANDARDS) {
    const res = await prisma.product.updateMany({
      where: { slug: item.slug },
      data: {
        description: item.description,
        originalPrice: item.originalPrice,
      }
    });
    if (res.count > 0) {
      count++;
      console.log('[' + label + ' OK] ' + item.slug + ' (originalPrice=' + item.originalPrice + ')');
    }
  }
  console.log('=== [' + label + '] UPDATED ' + count + ' PRODUCTS ===');
  await prisma.$disconnect();
}

run(process.env.SYNC_LABEL || 'LOCAL').catch(e => { console.error(e); process.exit(1); });
`;
}

async function main() {
  const code = buildRunner();
  const tmp = path.join(__dirname, '.tmp-content-sync.js');
  fs.writeFileSync(tmp, code, 'utf8');
  const localRes = spawnSync('node', [tmp], { stdio: 'inherit', encoding: 'utf8' });
  fs.unlinkSync(tmp);
  if (localRes.status !== 0) throw new Error('Local content sync failed');

  if (process.argv.includes('--fly')) {
    console.log('\n>>> Pushing standardized descriptions to Fly.io...');
    const env = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8');
    const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();
    const b64 = Buffer.from(code.replace("process.env.SYNC_LABEL || 'LOCAL'", "'FLY_PROD'")).toString('base64');
    const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
    const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
    });
    console.log(res.stdout);
    if (res.stderr) console.error(res.stderr);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
