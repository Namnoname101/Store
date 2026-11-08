const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/lib/product-guides.ts');
let content = fs.readFileSync(filePath, 'utf8');

const target = `    note: "⚠️ LƯU Ý QUAN TRỌNG: Link chỉ có hiệu lực kích hoạt trong vòng 12 giờ kể từ thời điểm giao đơn. Sau 12 giờ link sẽ tự động hết hạn, shop xin phép từ chối xử lý và không hỗ trợ các trường hợp kích hoạt trễ. Quý khách vui lòng kích hoạt ngay khi nhận link.",
  },
};`;

const addition = `    note: "⚠️ LƯU Ý QUAN TRỌNG: Link chỉ có hiệu lực kích hoạt trong vòng 12 giờ kể từ thời điểm giao đơn. Sau 12 giờ link sẽ tự động hết hạn, shop xin phép từ chối xử lý và không hỗ trợ các trường hợp kích hoạt trễ. Quý khách vui lòng kích hoạt ngay khi nhận link.",
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
};`;

// normalize
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  let newContent = normalizedContent.replace(normalizedTarget, addition);

  // also add resolution check
  const resolveTarget = `  // 3. Fallback theo Product Type mặc định`;
  const resolveAddition = `  // 2.10 Adobe
  if (cleanSlug.includes("adobe") || cleanTitle.includes("adobe")) {
    return PRODUCT_GUIDES["adobe-full-apps-1-thang"];
  }

  // 3. Fallback theo Product Type mặc định`;

  if (newContent.includes(resolveTarget)) {
    newContent = newContent.replace(resolveTarget, resolveAddition);
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Successfully updated product-guides.ts!');
} else {
  console.error('Target not found in product-guides.ts!');
}
