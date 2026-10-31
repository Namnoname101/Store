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
    title: "Hướng dẫn kích hoạt Codex API & ChatGPT bằng KhoDee-helper (1-Click)",
    steps: [
      {
        text: "Tải công cụ hỗ trợ cấu hình tự động KhoDee-helper.exe (dành cho Windows). Giải nén và mở file trực tiếp mà không cần cài đặt.",
        image: "/images/guides/codex/step-1-open.png",
        caption: "Bước 1: Khởi chạy KhoDee-helper.exe trên máy tính",
      },
      {
        text: "Sao chép mã API Key (sk-...) được bàn giao ở trên và dán vào ô nhập. Phần mềm tự động kiểm tra tên Token và số dư Quota khả dụng trực tiếp từ hệ thống.",
        image: "/images/guides/codex/step-2-key.png",
        caption: "Bước 2: Dán mã API Key, hệ thống tự động xác thực số dư Quota",
      },
      {
        text: "Bấm nút 'Kích hoạt Codex'. Công cụ sẽ tự động thiết lập 100% tệp cấu hình config.toml và auth.json chuẩn xác vào thư mục %USERPROFILE%\\.codex chỉ trong 1 giây.",
        image: "/images/guides/codex/step-3-activate.png",
        caption: "Bước 3: Bấm 'Kích hoạt Codex' để tự động cấu hình toàn bộ hệ thống",
      },
      {
        text: "Bấm nút 'Mở ứng dụng ChatGPT' để khởi chạy ngay ứng dụng ChatGPT Windows App và bắt đầu lập trình cùng mô hình AI đỉnh cao gpt-6.1-sol.",
        image: "/images/guides/codex/step-4-chatgpt.png",
        caption: "Bước 4: Bấm 'Mở ứng dụng ChatGPT' để bắt đầu sử dụng ngay lập tức",
      },
      "Tùy chọn cấu hình thủ công cho Cursor / VS Code / Cline: Chọn OpenAI Compatible > Dán mã API Key này theo hướng dẫn tại /huong-dan/codex.",
      "Kiểm tra hạn mức & lịch sử request thực tế thời gian thực tại: /developer/usage",
    ],
    note: "Hạn mức 5.000.000 quota points bảo lưu vĩnh viễn, sử dụng chung được cho Claude 3.5 Sonnet, Claude Opus 4.7, GPT-6 Astra, Gemini 4 Argon.",
    docsUrl: "/huong-dan/codex",
  },
  "codex-credit-50usd": {
    title: "Hướng dẫn kích hoạt Codex API & ChatGPT bằng KhoDee-helper (1-Click)",
    steps: [
      {
        text: "Tải công cụ hỗ trợ cấu hình tự động KhoDee-helper.exe (dành cho Windows). Giải nén và mở file trực tiếp mà không cần cài đặt.",
        image: "/images/guides/codex/step-1-open.png",
        caption: "Bước 1: Khởi chạy KhoDee-helper.exe trên máy tính",
      },
      {
        text: "Sao chép mã API Key (sk-...) được bàn giao ở trên và dán vào ô nhập. Phần mềm tự động kiểm tra tên Token và số dư Quota khả dụng trực tiếp từ hệ thống.",
        image: "/images/guides/codex/step-2-key.png",
        caption: "Bước 2: Dán mã API Key, hệ thống tự động xác thực số dư Quota",
      },
      {
        text: "Bấm nút 'Kích hoạt Codex'. Công cụ sẽ tự động thiết lập 100% tệp cấu hình config.toml và auth.json chuẩn xác vào thư mục %USERPROFILE%\\.codex chỉ trong 1 giây.",
        image: "/images/guides/codex/step-3-activate.png",
        caption: "Bước 3: Bấm 'Kích hoạt Codex' để tự động cấu hình toàn bộ hệ thống",
      },
      {
        text: "Bấm nút 'Mở ứng dụng ChatGPT' để khởi chạy ngay ứng dụng ChatGPT Windows App và bắt đầu lập trình cùng mô hình AI đỉnh cao gpt-6.1-sol.",
        image: "/images/guides/codex/step-4-chatgpt.png",
        caption: "Bước 4: Bấm 'Mở ứng dụng ChatGPT' để bắt đầu sử dụng ngay lập tức",
      },
      "Tùy chọn cấu hình thủ công cho Cursor / VS Code / Cline: Chọn OpenAI Compatible > Dán mã API Key này theo hướng dẫn tại /huong-dan/codex.",
      "Kiểm tra hạn mức & lịch sử request thực tế thời gian thực tại: /developer/usage",
    ],
    note: "Gói 25.000.000 quota points tối ưu cho lập trình viên làm việc chuyên nghiệp hàng ngày với Cursor & Claude Code.",
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
        text: "2. Claude AI Desktop (Cowork): Tải app tại claude.com/download > Bật Developer Mode > Configure Third-Party Inference > Chọn Gateway với Base URL https://1gw.gwai.cloud và Auth schema x-api-key.",
        caption: "Ứng dụng desktop chính thức của Claude trên PC/Mac",
      },
      {
        text: "3. OpenClaw Agent: Khởi tạo openclaw onboard --install-daemon, dán cấu hình vào ~/.openclaw/openclaw.json để chạy Claude Opus 4.7 & Sonnet 4.6.",
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
      "Kiểm tra dung lượng 5TB tại one.google.com và truy cập gemini.google.com để sử dụng mô hình Gemini Advanced với đầy đủ tính năng AI.",
      "Tùy chọn: Vào Google One bật tính năng 'Chia sẻ với gia đình' (Family Sharing) để mời thêm tối đa 5 thành viên khác cùng dùng chung bộ nhớ 5TB.",
    ],
    note: "⚠️ LƯU Ý QUAN TRỌNG: Link chỉ có hiệu lực kích hoạt trong vòng 12 giờ kể từ thời điểm giao đơn. Sau 12 giờ link sẽ tự động hết hạn, shop xin phép từ chối xử lý và không hỗ trợ các trường hợp kích hoạt trễ. Quý khách vui lòng kích hoạt ngay khi nhận link.",
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
