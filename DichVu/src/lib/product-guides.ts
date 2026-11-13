export type GuideStep =
  | string
  | {
      text: string;
      image?: string; // Link ảnh minh họa (link web hoặc /images/...)
      caption?: string; // Chú thích ảnh
    };

export interface InstructionGuide {
  title: string;
  steps: GuideStep[];
  note?: string;
  codeSnippet?: string;
  docsUrl?: string;
  images?: { url: string; title?: string }[];
}

/**
 * Từ điển hướng dẫn sử dụng riêng cho từng gói / sản phẩm.
 * Bạn có thể thêm bất kỳ slug hoặc mã sản phẩm nào vào đây.
 */
export const PRODUCT_GUIDES: Record<string, InstructionGuide> = {
  // ==========================================
  // 1. CÁC GÓI TELEGRAM
  // ==========================================
  telegram: {
    title: "Hướng dẫn nhận & kích hoạt dịch vụ Telegram",
    steps: [
      "Kiểm tra định dạng thông tin bàn giao ở trên (Link mời / Session / Tdata / Bot Token).",
      "Với link mời hoặc bot: Bấm vào link và bấm 'Start' hoặc 'Join Channel/Group'.",
      {
        text: "Với tài khoản Tdata: Tải Telegram Portable trên máy tính, giải nén và chép thư mục tdata vào thư mục Telegram.",
        image: "https://images.unsplash.com/photo-1618401471353-b98aedd04e11?auto=format&fit=crop&w=1200&q=80",
        caption: "Minh họa: Mở thư mục Telegram Desktop và dán thư mục tdata",
      },
      "Với tài khoản Session: Đăng nhập qua công cụ hoặc trình duyệt theo hướng dẫn riêng đính kèm.",
      "Nếu cần nhận mã OTP hoặc hỗ trợ kích hoạt, liên hệ hỗ trợ để được xử lý ngay trong 5 phút.",
    ],
    note: "Khuyến nghị không đăng xuất đột ngột trên nhiều thiết bị trong 24 giờ đầu để tránh checkpoint của Telegram.",
  },

  // ==========================================
  // 2. CÁC GÓI CODEX API
  // ==========================================
    "codex-credit-10usd": {
    title: "Hướng dẫn kích hoạt Codex API & ChatGPT bằng DaiTruong-helper (1-Click)",
    steps: [
      {
        text: "Bước 1 (Dành cho người mới): Cài đặt ứng dụng ChatGPT Desktop hoặc OpenAI Codex từ website chính thức của OpenAI (https://openai.com/chatgpt/download/) nếu máy bạn chưa cài.",
        caption: "Bước 1: Tải và cài đặt phần mềm chính thức từ OpenAI",
      },
      {
        text: "Bước 2: Tải công cụ cấu hình 1-Click DaiTruong-helper.zip (59 KB) tại trang cửa hàng. Giải nén và mở DaiTruong-helper.exe (không cần cài đặt).",
        image: "/images/guides/codex/step-1-open.png",
        caption: "Bước 2: Khởi chạy DaiTruong-helper.exe trên máy tính",
      },
      {
        text: "Bước 3: Dán mã API Key (sk-...) được bàn giao ở trên vào ô nhập. Hệ thống tự động xác thực và hiển thị số dư Quota khả dụng.",
        image: "/images/guides/codex/step-2-key.png",
        caption: "Bước 3: Dán mã API Key, hệ thống tự động xác thực số dư Quota",
      },
      {
        text: "Bước 4: Bấm nút 'Kích hoạt Codex'. Tool sẽ tự động thiết lập 100% tệp cấu hình config.toml và auth.json chuẩn xác vào thư mục %USERPROFILE%\\.codex trong 1 giây.",
        image: "/images/guides/codex/step-3-activate.png",
        caption: "Bước 4: Bấm 'Kích hoạt Codex' để tự động cấu hình toàn bộ hệ thống",
      },
      {
        text: "Bước 5: Bấm nút 'Mở ứng dụng' để khởi chạy ngay ChatGPT Desktop / Codex và bắt đầu lập trình AI tốc độ cao.",
        image: "/images/guides/codex/step-4-chatgpt.png",
        caption: "Bước 5: Bấm 'Mở ứng dụng' để bắt đầu sử dụng ngay lập tức",
      },
      "Tùy chọn cấu hình thủ công cho Cursor / VS Code / Cline: Chọn OpenAI Compatible > Điền Base URL: https://daitruongstore.fly.dev/v1 và dán API Key.",
      "Tra cứu hạn mức & lịch sử request thực tế thời gian thực tại: /developer/usage",
    ],
    note: "Hạn mức 5.000.000 quota points bảo lưu vĩnh viễn, tối ưu cho lập trình và ứng dụng ChatGPT qua các mô hình GPT-6 series (Astra, Sol, Luna), OpenAI o3 & o3-mini, o1 & o1-pro, GPT-4.5 High-EQ.",
    docsUrl: "/huong-dan/codex",
  },
    "codex-credit-50usd": {
    title: "Hướng dẫn kích hoạt Codex API & ChatGPT bằng DaiTruong-helper (1-Click)",
    steps: [
      {
        text: "Bước 1 (Dành cho người mới): Cài đặt ứng dụng ChatGPT Desktop hoặc OpenAI Codex từ website chính thức của OpenAI (https://openai.com/chatgpt/download/) nếu máy bạn chưa cài.",
        caption: "Bước 1: Tải và cài đặt phần mềm chính thức từ OpenAI",
      },
      {
        text: "Bước 2: Tải công cụ cấu hình 1-Click DaiTruong-helper.zip (59 KB) tại trang cửa hàng. Giải nén và mở DaiTruong-helper.exe (không cần cài đặt).",
        image: "/images/guides/codex/step-1-open.png",
        caption: "Bước 2: Khởi chạy DaiTruong-helper.exe trên máy tính",
      },
      {
        text: "Bước 3: Dán mã API Key (sk-...) được bàn giao ở trên vào ô nhập. Hệ thống tự động xác thực và hiển thị số dư Quota khả dụng.",
        image: "/images/guides/codex/step-2-key.png",
        caption: "Bước 3: Dán mã API Key, hệ thống tự động xác thực số dư Quota",
      },
      {
        text: "Bước 4: Bấm nút 'Kích hoạt Codex'. Tool sẽ tự động thiết lập 100% tệp cấu hình config.toml và auth.json chuẩn xác vào thư mục %USERPROFILE%\\.codex trong 1 giây.",
        image: "/images/guides/codex/step-3-activate.png",
        caption: "Bước 4: Bấm 'Kích hoạt Codex' để tự động cấu hình toàn bộ hệ thống",
      },
      {
        text: "Bước 5: Bấm nút 'Mở ứng dụng' để khởi chạy ngay ChatGPT Desktop / Codex và bắt đầu lập trình AI tốc độ cao.",
        image: "/images/guides/codex/step-4-chatgpt.png",
        caption: "Bước 5: Bấm 'Mở ứng dụng' để bắt đầu sử dụng ngay lập tức",
      },
      "Tùy chọn cấu hình thủ công cho Cursor / VS Code / Cline: Chọn OpenAI Compatible > Điền Base URL: https://daitruongstore.fly.dev/v1 và dán API Key.",
      "Tra cứu hạn mức & lịch sử request thực tế thời gian thực tại: /developer/usage",
    ],
    note: "Hạn mức 25.000.000 quota points bảo lưu vĩnh viễn, tối ưu cho lập trình và ứng dụng ChatGPT qua các mô hình GPT-6 series (Astra, Sol, Luna), OpenAI o3 & o3-mini, o1 & o1-pro, GPT-4.5 High-EQ.",
    docsUrl: "/huong-dan/codex",
  },

  // ==========================================
  // 3. CÁC GÓI CLAUDE API & CLAUDE CODE
  // ==========================================
  "claude-api": {
    title: "Hướng dẫn cấu hình API Claude (Hỗ trợ cả 5 nền tảng)",
    steps: [
      "Sao chép Claude API Key / Token ở trên (bắt đầu bằng 'sk-...'). Mã này dùng chung được cho cả 5 công cụ bên dưới.",
      {
        text: "1. VS Code & Claude Code CLI: Cài npm install -g @anthropic-ai/claude-code, cấu hình file settings.json với Base URL https://1gw.gwai.cloud.",
        caption: "Tự động hóa lập trình trực tiếp trong Terminal của VS Code",
      },
      {
        text: "2. Claude AI Desktop (1-Click DaiTruong Gateway): Tải DaiTruongGateway.exe (Google Drive) > Dán API Key > Bấm START. Tool tự động kiểm tra hạn mức, cấu hình và tự mở khóa tính năng Import chat từ Claude.ai. Xem hướng dẫn tại /huong-dan/api-claude.",
        caption: "Ứng dụng desktop chính thức của Claude trên PC/Mac",
      },
      {
        text: "3. OpenClaw Agent: Khởi tạo openclaw onboard --install-daemon, dán cấu hình vào ~/.openclaw/openclaw.json để chạy Claude Opus 5.5 & Sonnet 5.5 (Thế hệ Claude 5.5 & 5.6).",
        caption: "Framework AI Agent chạy ngầm đa nhiệm",
      },
      {
        text: "4. Open Design Gateway (Thiết kế Web): Truy cập design.gwai.cloud > Nhập Username, Password và dán API Key để tạo giao diện website trực tiếp trên trình duyệt.",
        caption: "Sinh code và thiết kế giao diện bằng Claude trên web",
      },
      {
        text: "5. Cursor & Windsurf: Settings > Models > Override Base URL theo đường dẫn được cấp trong đơn hàng > Dán API Key.",
        caption: "Soạn thảo code AI với Composer và Autocomplete mượt mà",
      },
    ],
    note: "Xem trung tâm hướng dẫn trực quan đầy đủ với bộ cấu hình tự động 1-Click tại đường dẫn /huong-dan/api-claude. Tuyệt đối không chia sẻ hoặc commit API Key lên GitHub công khai.",
    docsUrl: "/huong-dan/api-claude",
  },

  // ==========================================
  // 4. CÁC GÓI CURSOR PRO
  // ==========================================
  "cursor-pro": {
    title: "Hướng dẫn kích hoạt & Đăng nhập Cursor Pro",
    steps: [
      "Mở phần mềm Cursor trên máy tính (cursor.com).",
      "Bấm vào biểu tượng Cài đặt bánh răng (Settings) góc trên bên phải.",
      "Đăng nhập tài khoản được cấp hoặc dán API Key vào mục Models tương ứng.",
      "Tận hưởng tính năng Cursor Composer và Tab Autocomplete không giới hạn.",
    ],
    note: "Không chia sẻ tài khoản cho người khác để tránh bị khóa giới hạn thiết bị.",
  },

  // ==========================================
  // 5. CÁC GÓI KEY WINDOWS / OFFICE
  // ==========================================
  "windows-11-pro": {
    title: "Hướng dẫn kích hoạt Key Windows 11 Pro",
    steps: [
      "Bấm phím Windows, mở Cài đặt (Settings) > Chọn System > Activation.",
      "Chọn 'Change product key' (Thay đổi khóa sản phẩm).",
      "Dán mã bản quyền 25 ký tự được cấp ở trên vào ô và bấm 'Next' > 'Activate'.",
      "Khởi động lại máy tính nếu được yêu cầu để hoàn tất cập nhật tính năng Pro.",
    ],
    note: "Key bản quyền kỹ thuật số chính hãng vĩnh viễn gắn liền với mainboard máy tính.",
  },
  "office-365": {
    title: "Hướng dẫn đăng nhập & Cài đặt Office 365",
    steps: [
      "Truy cập trang chủ chính thức: https://portal.office.com",
      "Đăng nhập bằng tài khoản và mật khẩu được cung cấp ở trên.",
      "Đổi mật khẩu mới ở lần đăng nhập đầu tiên theo yêu cầu của Microsoft.",
      "Bấm nút 'Cài đặt ứng dụng' (Install apps) để tải bộ Office đầy đủ về máy tính.",
    ],
    note: "Lưu kỹ mật khẩu mới đã đổi để sử dụng cho các lần đăng nhập sau.",
  },

  // ==========================================
  // 6. CÁC GÓI CAPCUT PRO
  // ==========================================
  capcut: {
    title: "Hướng dẫn đăng nhập & Sử dụng CapCut Pro",
    steps: [
      "Mở ứng dụng CapCut trên máy tính (PC/Mac), điện thoại (iOS/Android) hoặc truy cập https://www.capcut.com",
      "Bấm 'Đăng nhập' (Sign In) > Chọn phương thức 'Đăng nhập bằng Email' (Sign in with Email / Tiếp tục với Email).",
      "Nhập Email và Mật khẩu được cung cấp ở trên để vào tài khoản.",
      "Kiểm tra biểu tượng 'Pro' trên hồ sơ tài khoản: bạn đã có thể xuất video 4K, dùng hiệu ứng Pro, xóa phông nền AI, tạo phụ đề tự động và lưu trữ đám mây.",
    ],
    note: "Tài khoản bảo hành Full thời hạn (BHF). Tuyệt đối không thay đổi email, mật khẩu hoặc liên kết tài khoản để đảm bảo quyền lợi bảo hành.",
  },

  // ==========================================
  // 7. CÁC GÓI MEITU VIP
  // ==========================================
  meitu: {
    title: "Hướng dẫn đăng nhập & Sử dụng Meitu VIP",
    steps: [
      "Mở ứng dụng Meitu trên điện thoại (iOS / Android) hoặc máy tính.",
      "Vào mục 'Tôi' (Me / Hồ sơ) > Chọn 'Đăng nhập' (Log In) bằng Tài khoản & Mật khẩu được cấp.",
      "Đây là tài khoản riêng tư, bạn có thể chủ động đổi mật khẩu tùy ý để bảo mật cá nhân.",
      "Tận hưởng trọn bộ tính năng Meitu VIP: làm nét ảnh AI, xóa vật thể AI, chỉnh sửa video HD và bộ lọc độc quyền.",
    ],
    note: "Tài khoản riêng tư 100%, bảo hành Full thời hạn (BHF). Quý khách thoải mái đổi mật khẩu sau khi nhận tài khoản.",
  },

  // ==========================================
  // 8. CÁC GÓI GEMINI PRO & GOOGLE DRIVE 5TB 18 THÁNG
  // ==========================================
  "gemini-advanced-18-thang": {
    title: "Hướng dẫn kích hoạt Gói Gemini Pro & Google Drive 5TB 18 Tháng",
    steps: [
      "Sao chép (copy) đường link kích hoạt nhận được sau khi thanh toán thành công (link có dạng https://gemini.serviceactivation.in/... hoặc geminiactivation.com).",
      "Mở trình duyệt trên máy tính hoặc điện thoại, đảm bảo đang đăng nhập sẵn tài khoản Google (Gmail) chính chủ bạn muốn nâng cấp.",
      "Dán (paste) đường link vào thanh địa chỉ của trình duyệt rồi nhấn Enter / Truy cập.",
      "Tại giao diện kích hoạt Google One, nhấn nút 'Chấp nhận ưu đãi' (Claim Offer) để hoàn tất nhận gói 18 tháng trực tiếp vào tài khoản.",
      "Kiểm tra dung lượng 5TB tại one.google.com và truy cập gemini.google.com để sử dụng mô hình Gemini 4 Argon & Gemini 3.8 Flash (2M Context) với đầy đủ tính năng AI tiên tiến nhất.",
      "Tùy chọn: Vào Google One bật tính năng 'Chia sẻ với gia đình' (Family Sharing) để mời thêm tối đa 5 thành viên khác cùng dùng chung bộ nhớ 5TB.",
    ],
    note: "⚠️ LƯU Ý QUAN TRỌNG: Link chỉ có hiệu lực kích hoạt trong vòng 12 giờ kể từ thời điểm giao đơn. Sau 12 giờ link sẽ tự động hết hạn, shop xin phép từ chối xử lý và không hỗ trợ các trường hợp kích hoạt trễ. Quý khách vui lòng kích hoạt ngay khi nhận link.",
  },

  // ==========================================
  // 10. XINGTU (TỈNH TÚ) VIP
  // ==========================================
  "xingtu-vip-30-ngay": {
    title: "Hướng dẫn đăng nhập & kích hoạt Xingtu (醒图) VIP",
    steps: [
      "Tải ứng dụng Xingtu (醒图) trên App Store (cần chuyển vùng Trung Quốc nếu dùng iOS) hoặc cài file APK / CH Play trên Android.",
      "Mở app Xingtu > Chọn màn hình đăng nhập > Chạm vào mã vùng +86 rồi đổi sang +1 (Hoa Kỳ / US).",
      "Mở link OTP nhận được tại đơn hàng > Bấm sao chép số điện thoại (+1...) rồi dán vào ô đăng nhập của app.",
      "Tích chọn đồng ý điều khoản dịch vụ > Bấm 'Gửi mã xác minh' (Get Code).",
      "Quay lại trang link OTP, bấm làm mới (F5) trình duyệt để lấy mã 4-6 số > Nhập mã vào app để đăng nhập thành công VIP.",
    ],
    note: "Tài khoản bảo hành Full thời hạn (1 đổi 1 nếu mất VIP). QUY ĐỊNH BẮT BUỘC: Chỉ dùng trên 1 máy duy nhất. Tuyệt đối không đăng nhập máy thứ 2, không đăng xuất, không xóa app để duy trì quyền lợi bảo hành.",
  },

  // ==========================================
  // 11. QUIZLET PLUS TEACHER
  // ==========================================
  "quizlet-plus-1-thang": {
    title: "Hướng dẫn đăng nhập & sử dụng Quizlet Plus (Gói Teacher)",
    steps: [
      "Truy cập website chính thức https://quizlet.com/ hoặc mở ứng dụng Quizlet trên iOS / Android.",
      "Đăng nhập bằng thông tin Email và Mật khẩu được cung cấp ở trên.",
      "Kiểm tra huy hiệu Plus/Teacher: Tận hưởng học tập 100% không quảng cáo, mở khóa toàn bộ chế độ Learn, Test thông minh.",
      "Thoải mái tạo bộ thẻ ghi nhớ (Flashcard) không giới hạn, tạo lớp học và giao bài ôn tập cho học viên.",
    ],
    note: "Bảo hành Full 30 ngày 1 đổi 1. Vui lòng không chia sẻ tài khoản cho người khác để tránh checkpoint bảo mật.",
  },

  // ==========================================
  // 12. PHOTOROOM MAX 7 NGÀY
  // ==========================================
  "photoroom-max-7-ngay": {
    title: "Hướng dẫn đăng nhập & kích hoạt Photoroom Max",
    steps: [
      "Truy cập https://www.photoroom.com/ hoặc tải ứng dụng Photoroom trên điện thoại.",
      "Đăng nhập bằng Email và Mật khẩu được cung cấp ở trên.",
      "Trải nghiệm full tính năng gói Max: Tự động xóa phông nền AI siêu nét chuẩn từng sợi tóc, tạo nền studio sản phẩm chuyên nghiệp cho Shopee, TikTok Shop, Lazada.",
      "Xuất ảnh chất lượng cao 4K không dính watermark (logo).",
    ],
    note: "Bảo hành Full 7 ngày 1 đổi 1 nếu phát sinh lỗi trong quá trình sử dụng.",
  },

  // ==========================================
  // 9. CÁC GÓI ADOBE CREATIVE CLOUD ALL APPS
  // ==========================================
  "adobe-full-apps-1-thang": {
    title: "Hướng dẫn đăng nhập & kích hoạt Adobe Full Apps 1 Tháng",
    steps: [
      "Truy cập ứng dụng Adobe Creative Cloud Desktop trên máy tính hoặc vào https://creativecloud.adobe.com/.",
      "Đăng nhập bằng thông tin Email và Mật khẩu được cung cấp ở trên.",
      "Tài khoản sử dụng được đồng thời trên 2 thiết bị (Windows, macOS, iPad).",
      "Tải và cài đặt thoải mái hơn 20+ ứng dụng chính hãng: Photoshop, Illustrator, Premiere Pro, After Effects, Acrobat Pro, Lightroom...",
      "Sử dụng đầy đủ tính năng AI (Generative Fill, Firefly) và cập nhật phiên bản mới nhất từ Adobe.",
    ],
    note: "Tài khoản cấp sẵn bảo hành Full 30 ngày (1 đổi 1 nếu lỗi). Vui lòng KHÔNG thay đổi email đăng nhập của tài khoản để duy trì chế độ bảo hành.",
  },

  // ==========================================
  // 14. CHATGPT PLUS 1 THÁNG (TIẾT KIỆM - BH 24H)
  // ==========================================
  "chatgpt-plus-1-thang": {
    title: "Hướng dẫn đăng nhập & Quy định sử dụng ChatGPT Plus (Gói Tiết Kiệm - BH 24H)",
    steps: [
      {
        text: "Bước 1: Truy cập website chính thức https://chatgpt.com hoặc mở ứng dụng ChatGPT chính thức trên iOS / Android / macOS / Windows.",
        caption: "Bước 1: Mở trình duyệt và truy cập trang chính thức của OpenAI",
      },
      {
        text: "Bước 2: Bấm nút 'Log in' và nhập thông tin Email | Mật khẩu được cung cấp ở bảng bàn giao phía trên.",
        caption: "Bước 2: Đăng nhập với tài khoản được bàn giao",
      },
      {
        text: "Bước 3: Sau khi đăng nhập, kiểm tra huy hiệu 'ChatGPT Plus' ở góc trái hoặc vào Settings > Subscription để xác nhận gói hoạt động.",
        caption: "Bước 3: Xác nhận trạng thái Plus bản quyền",
      },
      {
        text: "Bước 4: Trải nghiệm toàn bộ mô hình Frontier AI: GPT-6 series (Astra, Sol, Luna), OpenAI o3, o1, GPT-4.5 High-EQ, tạo ảnh DALL·E 3, Canvas và Advanced Voice.",
        caption: "Bước 4: Sử dụng đầy đủ tính năng cao cấp của OpenAI",
      },
    ],
    note: "QUY ĐỊNH BẢO HÀNH (GÓI TIẾT KIỆM): Bảo hành đăng nhập & kiểm tra Plus chuẩn trong 24H đầu (1 đổi 1 ngay nếu sai pass hoặc không có Plus). Sau 24H hết thời hạn bảo hành đăng nhập (không bảo hành tụt Plus hoặc đợt quét tài khoản từ OpenAI sau 24h). Quý khách cần bảo hành trọn vẹn 30 ngày vui lòng chọn gói Full 30 Ngày.",
    docsUrl: "https://help.openai.com",
  },

  // ==========================================
  // 15. CHATGPT PLUS 1 THÁNG BHF (BẢO HÀNH FULL 30 NGÀY)
  // ==========================================
  "chatgpt-plus-1-thang-bhf": {
    title: "Hướng dẫn đăng nhập & Quy định sử dụng ChatGPT Plus (Bảo Hành Full 30 Ngày - BHF)",
    steps: [
      {
        text: "Bước 1: Truy cập website chính thức https://chatgpt.com hoặc mở ứng dụng ChatGPT chính thức trên iOS / Android / macOS / Windows.",
        caption: "Bước 1: Mở trình duyệt và truy cập trang chính thức của OpenAI",
      },
      {
        text: "Bước 2: Bấm nút 'Log in' và nhập thông tin Email | Mật khẩu được cung cấp ở bảng bàn giao phía trên.",
        caption: "Bước 2: Đăng nhập với tài khoản được bàn giao",
      },
      {
        text: "Bước 3: Sau khi đăng nhập, kiểm tra huy hiệu 'ChatGPT Plus' ở góc trái hoặc vào Settings > Subscription để xác nhận gói hoạt động.",
        caption: "Bước 3: Xác nhận trạng thái Plus bản quyền",
      },
      {
        text: "Bước 4: Trải nghiệm toàn bộ mô hình Frontier AI: GPT-6 series (Astra, Sol, Luna), OpenAI o3, o1, GPT-4.5 High-EQ, tạo ảnh DALL·E 3, Canvas và Advanced Voice.",
        caption: "Bước 4: Sử dụng đầy đủ tính năng cao cấp của OpenAI",
      },
    ],
    note: "ĐIỀU KIỆN BẢO HÀNH CAO CẤP (BHF 30 NGÀY): Bảo hành 1 ĐỔI 1 trọn vẹn 30 ngày nếu tài khoản mất gói Plus hoặc lỗi trong suốt thời gian sử dụng. TỪ CHỐI BẢO HÀNH nếu: tự ý đổi Email tài khoản; tự ý bấm hủy gói (Cancel Subscription) trong phần Billing; vi phạm chính sách OpenAI (spam bot, tạo nội dung NSFW/18+, bạo lực khiến OpenAI đình chỉ/khóa nick); hoặc chia sẻ đăng nhập tràn lan nhiều IP/thiết bị bất thường cùng lúc.",
    docsUrl: "https://help.openai.com",
  },

  // ==========================================
  // 16. KEY HMA VPN BẢN QUYỀN 1 THÁNG
  // ==========================================
  "key-hma-vpn-1-thang": {
    title: "Hướng dẫn kích hoạt License Key HMA VPN (HideMyAss)",
    steps: [
      {
        text: "Bước 1: Tải và cài đặt ứng dụng HMA VPN chính thức tại https://www.hidemyass.com/installation-files (hỗ trợ Windows, Android, macOS).",
        caption: "Bước 1: Tải ứng dụng HMA VPN chính hãng",
      },
      {
        text: "Bước 2: Mở ứng dụng HMA VPN > Chọn biểu tượng Cài đặt / Tài khoản (Account) > Chọn 'Enter License Key' (Nhập khóa bản quyền).",
        caption: "Bước 2: Chọn mục nhập License Key trong phần mềm",
      },
      {
        text: "Bước 3: Sao chép mã Key được cấp ở trên và dán vào ô kích hoạt > Bấm 'Activate' để hoàn tất.",
        caption: "Bước 3: Kích hoạt thành công bản quyền 5 thiết bị",
      },
      {
        text: "Bước 4: Chọn máy chủ tại hơn 190+ quốc gia và bấm 'Connect' để fake IP tốc độ cao 20Gbps, vượt tường lửa và bảo mật tuyệt đối.",
        caption: "Bước 4: Kết nối máy chủ và trải nghiệm",
      },
    ],
    note: "BẢN QUYỀN CHÍNH HÃNG: Hỗ trợ tối đa 5 thiết bị đồng thời. Bảo hành 1 đổi 1 trong suốt thời hạn sử dụng nếu key phát sinh lỗi kích hoạt.",
    docsUrl: "https://support.hidemyass.com",
  },

  // ==========================================
  // 17. ADOBE EXPRESS PREMIUM 12 THÁNG
  // ==========================================
  "adobe-express-12-thang": {
    title: "Hướng dẫn kích hoạt & sử dụng Adobe Express Premium 12 Tháng",
    steps: [
      {
        text: "Bước 1: Truy cập trang chủ Adobe Express tại https://new.express.adobe.com/ hoặc tải app Adobe Express trên iOS / Android.",
        caption: "Bước 1: Mở trình duyệt truy cập Adobe Express",
      },
      {
        text: "Bước 2: Đăng nhập bằng tài khoản Adobe cá nhân của bạn (hoặc tạo tài khoản Adobe mới miễn phí nếu chưa có).",
        caption: "Bước 2: Đăng nhập tài khoản Adobe",
      },
      {
        text: "Bước 3: Mở đường link kích hoạt / nhập mã ưu đãi được bàn giao ở trên để nhận trọn vẹn 12 tháng Adobe Express Premium.",
        caption: "Bước 3: Nhận gói thành viên Premium 12 tháng",
      },
      {
        text: "Bước 4: Trải nghiệm full tính năng: Tạo ảnh Adobe Firefly Generative AI, xóa phông 1-click chuẩn 4K, 200M+ ảnh stock không bản quyền và 20.000+ Adobe Fonts.",
        caption: "Bước 4: Thiết kế đồ họa và sáng tạo nội dung",
      },
    ],
    note: "LƯU Ý KÍCH HOẠT: Nếu gặp thông báo hạn chế quốc gia, hãy bật VPN sang khu vực Ấn Độ (India) và bấm nhận ưu đãi. Sau khi gói kích hoạt thành công, bạn tắt VPN và sử dụng bình thường bằng IP Việt Nam.",
    docsUrl: "https://helpx.adobe.com/express.html",
  },

  // ==========================================
  // 18. SUNO AI PRO 1 THÁNG (2.500 CREDITS)
  // ==========================================
  "suno-ai-pro-1-thang": {
    title: "Hướng dẫn đăng nhập & sử dụng Suno AI Pro 1 Tháng (2.500 Credits)",
    steps: [
      {
        text: "Bước 1: Truy cập trang tạo nhạc chính thức tại https://suno.com và bấm nút 'Sign In' ở góc trái.",
        caption: "Bước 1: Truy cập Suno AI chính hãng",
      },
      {
        text: "Bước 2: Đăng nhập bằng thông tin Email | Mật khẩu được cung cấp ở trên.",
        caption: "Bước 2: Đăng nhập tài khoản được cấp",
      },
      {
        text: "Bước 3: Kiểm tra số dư 2.500 Credits ở góc trái màn hình (được tạo ~500 bài hát chất lượng phòng thu).",
        caption: "Bước 3: Xác nhận gói Pro bản quyền & 2.500 credits",
      },
      {
        text: "Bước 4: Vào mục 'Create' để soạn lời bài hát, chọn phong cách âm nhạc (Pop, Ballad, Rap, Rock, EDM, Lo-fi...) và tạo bài hát AI hoàn chỉnh với đầy đủ quyền sở hữu thương mại (Commercial rights).",
        caption: "Bước 4: Bắt đầu sáng tạo nhạc bản quyền",
      },
    ],
    note: "QUY ĐỊNH BẢO HÀNH: Bảo hành đăng nhập thành công và chuẩn xác số dư 2.500 credits ban đầu trong 24 giờ. Vui lòng không thay đổi email gốc của tài khoản.",
    docsUrl: "https://suno.com",
  },
  // ==========================================
  // 19. TÀI KHOẢN GEMINI PRO 5TB ARGON 4 (CHỦ FAMILY)
  // ==========================================
  "gemini-pro-argon-4-family-5tb": {
    title: "Hướng dẫn đăng nhập & sử dụng Tài khoản Gemini Pro 5TB (Chủ Family)",
    steps: [
      {
        text: "Bước 1: Mở trình duyệt ẩn danh (Incognito) hoặc hồ sơ Chrome mới, truy cập https://accounts.google.com",
        caption: "Bước 1: Mở trang đăng nhập tài khoản Google",
      },
      {
        text: "Bước 2: Nhập thông tin Email và Mật khẩu được cấp ở trên để tiến hành đăng nhập.",
        caption: "Bước 2: Điền Email và Password được bàn giao",
      },
      {
        text: "Bước 3: Tại màn hình xác thực 2 bước (2FA), sao chép chuỗi mã 2FA Secret Key được cấp, dán vào trang web https://2fa.live (hoặc ứng dụng Google Authenticator) để lấy mã số 6 chữ số và xác nhận đăng nhập.",
        caption: "Bước 3: Xác thực 2FA nhanh chóng qua 2fa.live",
      },
      {
        text: "Bước 4: Truy cập https://gemini.google.com để bắt đầu sử dụng Gemini Pro và trải nghiệm mô hình Gemini 4 Argon trong Google Antigravity & AI Studio.",
        caption: "Bước 4: Trải nghiệm Gemini 4 Argon & Gemini 3.8 Flash",
      },
      {
        text: "Bước 5 (Chia sẻ Family): Truy cập https://myaccount.google.com/family/details. Bạn là Chủ nhóm (Family Manager), hãy bấm 'Mời thành viên' và nhập Gmail cá nhân của bạn (tối đa 5 người) để cùng hưởng 5TB lưu trữ Google One.",
        caption: "Bước 5: Mời tối đa 5 tài khoản Gmail vào Family dùng chung 5TB",
      },
    ],
    note: "QUY ĐỊNH BẢO HÀNH (GÓI TRẢI NGHIỆM - KBH): Bảo hành đăng nhập thành công và chuẩn xác thông tin tài khoản trong 2 giờ đầu (1 đổi 1 ngay nếu sai mật khẩu hoặc lỗi 2FA lúc nhận). Sau khi đăng nhập thành công: KHÔNG BẢO HÀNH THỜI GIAN SỬ DỤNG theo đúng cam kết gói trải nghiệm. LƯU Ý: Gmail này bị khóa hộp thư đến (không nhận được email/OTP bên ngoài) và chỉ dùng cho các dịch vụ Google (Gemini, Drive 5TB, Antigravity, NotebookLM). Khuyến cáo không lưu trữ tài liệu kinh doanh quan trọng duy nhất.",
    docsUrl: "https://gemini.google.com",
  },
};

/**
 * Hàm phân giải thông minh: Tìm hướng dẫn phù hợp nhất cho sản phẩm
 */
export function resolveProductInstruction(params: {
  slug?: string;
  title?: string;
  type?: string;
  rawSecret?: string;
}): InstructionGuide {
  const cleanSlug = (params.slug || "").toLowerCase().trim();
  const cleanTitle = (params.title || "").toLowerCase().trim();
  const rawSecret = (params.rawSecret || "").trim();
  const type = params.type || "LICENSE_KEY";

  // 1. Kiểm tra khớp chính xác slug trong bảng PRODUCT_GUIDES
  if (cleanSlug && PRODUCT_GUIDES[cleanSlug]) {
    return PRODUCT_GUIDES[cleanSlug];
  }

  // 2. Kiểm tra từ khóa trong slug hoặc title
  // 2.1 Telegram
  if (cleanSlug.includes("tele") || cleanTitle.includes("tele") || cleanTitle.includes("telegram")) {
    return PRODUCT_GUIDES["telegram"];
  }

  // 2.2 Codex / ModelAPI
  if (
    cleanSlug.includes("codex") ||
    cleanTitle.includes("codex") ||
    cleanTitle.includes("modelapi") ||
    (rawSecret.startsWith("sk-") && !cleanTitle.includes("claude"))
  ) {
    return PRODUCT_GUIDES["codex-credit-10usd"];
  }

  // 2.3 Claude API
  if (cleanSlug.includes("claude") || cleanTitle.includes("claude")) {
    return PRODUCT_GUIDES["claude-api"];
  }

  // 2.4 Cursor
  if (cleanSlug.includes("cursor") || cleanTitle.includes("cursor")) {
    return PRODUCT_GUIDES["cursor-pro"];
  }

  // 2.5 Windows
  if (cleanSlug.includes("win") || cleanTitle.includes("win")) {
    return PRODUCT_GUIDES["windows-11-pro"];
  }

  // 2.6 Office
  if (cleanSlug.includes("office") || cleanTitle.includes("office")) {
    return PRODUCT_GUIDES["office-365"];
  }

  // 2.7 Capcut Pro
  if (cleanSlug.includes("capcut") || cleanTitle.includes("capcut")) {
    return PRODUCT_GUIDES["capcut"];
  }

  // 2.8 Meitu VIP
  if (cleanSlug.includes("meitu") || cleanTitle.includes("meitu")) {
    return PRODUCT_GUIDES["meitu"];
  }

  // 2.9 Gemini Pro & Google Drive 18 Tháng
  if (
    cleanSlug.includes("gemini") ||
    cleanTitle.includes("gemini") ||
    cleanSlug.includes("google-one") ||
    cleanTitle.includes("google one") ||
    rawSecret.includes("gemini") ||
    rawSecret.includes("serviceactivation") ||
    rawSecret.includes("geminiactivation")
  ) {
    return PRODUCT_GUIDES["gemini-advanced-18-thang"];
  }

  // 2.10 Adobe
  if (cleanSlug.includes("adobe") || cleanTitle.includes("adobe")) {
    return PRODUCT_GUIDES["adobe-full-apps-1-thang"];
  }

  // 2.11 Xingtu
  if (cleanSlug.includes("xingtu") || cleanTitle.includes("xingtu") || cleanTitle.includes("tinh tu")) {
    return PRODUCT_GUIDES["xingtu-vip-30-ngay"];
  }

  // 2.12 Quizlet
  if (cleanSlug.includes("quizlet") || cleanTitle.includes("quizlet")) {
    return PRODUCT_GUIDES["quizlet-plus-1-thang"];
  }

  // 2.13 Photoroom
  if (cleanSlug.includes("photoroom") || cleanTitle.includes("photoroom")) {
    return PRODUCT_GUIDES["photoroom-max-7-ngay"];
  }

  // 2.14 ChatGPT Plus BHF (Full 30 Ngày)
  if (
    cleanSlug.includes("bhf") ||
    cleanTitle.includes("bhf") ||
    cleanTitle.includes("bảo hành full")
  ) {
    return PRODUCT_GUIDES["chatgpt-plus-1-thang-bhf"];
  }

  // 2.15 ChatGPT Plus Tiết Kiệm (BH 24H)
  if (
    cleanSlug.includes("chatgpt") ||
    cleanTitle.includes("chatgpt") ||
    cleanSlug.includes("openai") ||
    cleanTitle.includes("openai") ||
    cleanTitle.includes("gpt-4")
  ) {
    return PRODUCT_GUIDES["chatgpt-plus-1-thang"];
  }

  // 2.16 HMA VPN
  if (cleanSlug.includes("hma") || cleanTitle.includes("hma")) {
    return PRODUCT_GUIDES["key-hma-vpn-1-thang"];
  }

  // 2.17 Adobe Express
  if (cleanSlug.includes("express") || cleanTitle.includes("express")) {
    return PRODUCT_GUIDES["adobe-express-12-thang"];
  }

  // 2.18 Suno AI
  if (cleanSlug.includes("suno") || cleanTitle.includes("suno")) {
    return PRODUCT_GUIDES["suno-ai-pro-1-thang"];
  }

  // 3. Fallback theo Product Type mặc định
  switch (type) {
    case "ACCOUNT":
      return {
        title: "Hướng dẫn đăng nhập Tài khoản",
        steps: [
          "Truy cập ứng dụng hoặc trang chủ của dịch vụ.",
          "Đăng nhập bằng tài khoản và mật khẩu được cung cấp ở trên.",
          "Nếu có chỉ định Profile, vui lòng chọn đúng Profile được bàn giao.",
        ],
        note: "Không tự ý thay đổi thông tin tài khoản để đảm bảo quyền lợi bảo hành.",
      };
    case "COURSE_LINK":
      return {
        title: "Thông tin liên kết dịch vụ & Khóa học",
        steps: [
          "Bấm vào liên kết được cấp ở trên hoặc dán vào trình duyệt web.",
          "Hệ thống sẽ tự động kích hoạt dịch vụ hoặc điều hướng đến tài nguyên của bạn.",
        ],
        note: "Nếu gặp sự cố về liên kết, vui lòng liên hệ đội ngũ hỗ trợ.",
      };
    case "LICENSE_KEY":
    default:
      return {
        title: "Hướng dẫn kích hoạt Key bản quyền",
        steps: [
          "Mở ứng dụng hoặc phần Cài đặt của phần mềm / dịch vụ.",
          "Chọn 'Nhập khóa sản phẩm' hoặc dán mã kích hoạt được cung cấp ở trên.",
          "Làm theo hướng dẫn trên màn hình để hoàn tất kích hoạt.",
        ],
        note: "Mã bản quyền chỉ sử dụng cho số lượng thiết bị theo gói đã mua.",
      };
  }
}
