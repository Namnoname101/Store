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
  // 2. CÁC GÓI CODEX API / MODELAPI
  // ==========================================
  "codex-credit-10usd": {
    title: "Hướng dẫn cấu hình Codex API (Gói 10$ - 5.000.000 Quota)",
    steps: [
      "Sao chép API Key ở trên (bắt đầu bằng 'sk-...').",
      {
        text: "Trong Cursor: Settings > Models > OpenAI API Key > Đổi Base URL thành https://modelapi.vn/v1 và dán API Key.",
        image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
        caption: "Minh họa: Cài đặt Base URL và API Key trong Cursor Settings",
      },
      "Trong VS Code / Cline / Roo Code: Chọn OpenAI Compatible > Điền Base URL và API Key.",
      "Kiểm tra hạn mức & lịch sử request thực tế tại: https://daitruong-store.fly.dev/developer/usage",
    ],
    note: "Hạn mức 5.000.000 quota points bảo lưu vĩnh viễn, sử dụng chung được cho Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro.",
  },
  "codex-credit-50usd": {
    title: "Hướng dẫn cấu hình Codex API (Gói 50$ - 25.000.000 Quota)",
    steps: [
      "Sao chép API Key ở trên (bắt đầu bằng 'sk-...').",
      "Trong Cursor: Settings > Models > OpenAI API Key > Đổi Base URL thành https://modelapi.vn/v1 và dán API Key.",
      "Trong VS Code / Cline / Roo Code: Chọn OpenAI Compatible > Điền Base URL và API Key.",
      "Kiểm tra hạn mức & lịch sử request thực tế tại: https://daitruong-store.fly.dev/developer/usage",
    ],
    note: "Gói 25.000.000 quota points tối ưu cho lập trình viên làm việc chuyên nghiệp hàng ngày với Cursor & Claude Code.",
  },

  // ==========================================
  // 3. CÁC GÓI CLAUDE API & CLAUDE CODE
  // ==========================================
  "claude-api": {
    title: "Hướng dẫn cấu hình Claude API & Claude Code CLI",
    steps: [
      "Sao chép Claude API Key / Token ở trên.",
      "Cấu hình Claude Code CLI: Mở Terminal gõ `export ANTHROPIC_API_KEY=sk-...` (hoặc dán vào file .env).",
      "Cấu hình trong Cursor / Cline: Chọn Provider là Anthropic Compatible hoặc dán Base URL được cấp.",
      "Kiểm tra kết nối bằng cách gửi 1 prompt thử nghiệm với model claude-3-5-sonnet-20241022.",
    ],
    note: "Không commit API Key lên GitHub công khai để tránh bị bot quét khóa tài khoản.",
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
