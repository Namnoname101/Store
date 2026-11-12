const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/product-guides.ts');
let content = fs.readFileSync(filePath, 'utf8');

const targetGuidesEnd = `    docsUrl: "https://help.openai.com",
  },
};`;

const newGuides = `    docsUrl: "https://help.openai.com",
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
};`;

// Also check resolver
const targetResolver = `  // 2.15 ChatGPT Plus Tiết Kiệm (BH 24H)
  if (
    cleanSlug.includes("chatgpt") ||
    cleanTitle.includes("chatgpt") ||
    cleanSlug.includes("openai") ||
    cleanTitle.includes("openai") ||
    cleanTitle.includes("gpt-4")
  ) {
    return PRODUCT_GUIDES["chatgpt-plus-1-thang"];
  }`;

const newResolver = `  // 2.15 ChatGPT Plus Tiết Kiệm (BH 24H)
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
  }`;

// Normalize line endings for replacement
const normalize = str => str.replace(/\r\n/g, '\n');
content = normalize(content);

if (content.includes(normalize(targetGuidesEnd))) {
  content = content.replace(normalize(targetGuidesEnd), normalize(newGuides));
  console.log('Replaced PRODUCT_GUIDES end successfully.');
} else {
  console.error('Failed to find targetGuidesEnd');
}

if (content.includes(normalize(targetResolver))) {
  content = content.replace(normalize(targetResolver), normalize(newResolver));
  console.log('Replaced resolver successfully.');
} else {
  console.error('Failed to find targetResolver');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated product-guides.ts successfully.');
