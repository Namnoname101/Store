const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PRODUCTS_TO_ADD = [
  {
    title: "Tài khoản Netflix Premium 4K HDR (Slot Riêng 1 Tháng)",
    slug: "netflix-premium-4k-1-thang",
    price: 89000,
    originalPrice: 120000,
    type: "ACCOUNT",
    categorySlug: "software", // Phần mềm & Bản quyền
    thumbnailUrl: "/images/products/netflix-4k.svg",
    fulfillmentType: "API_DROPSHIP",
    minQuantity: 1,
    maxQuantity: 5,
    supplierCode: "DKEY_TELE",
    supplierProductCode: "6acf7db4452526529250f06e",
    supplierPrice: 60000,
    supplierStock: 31,
    description: `🎬 **Tài Khoản Netflix Premium 4K HDR Ultra (Gói 1 Tháng)**
• **Định dạng bàn giao (Giao liền 100%):** \`Email | Mật khẩu | Tên Profile riêng | Mã PIN riêng\`.
• Mỗi khách sở hữu 1 Profile riêng có cài mã PIN bảo vệ quyền riêng tư, lịch sử xem phim và danh sách yêu thích độc lập.
• Hỗ trợ xem chất lượng cao nhất 4K UHD + HDR, âm thanh không gian Spatial Audio trên mọi thiết bị (Smart TV, Điện thoại, Máy tính, iPad).
• Có sẵn hệ thống web riêng để khách tự động lấy mã xác minh hộ gia đình (Household check) 24/7 tức thì.

📌 **Hướng dẫn đăng nhập:**
1. Sau khi nhập email trên ứng dụng Netflix, chọn mục **"Nhận trợ giúp"** (Need Help) để chuyển sang bước nhập mật khẩu.
2. Đăng nhập đúng Profile và nhập mã PIN đã được cấp để xem phim.

🛡️ **Chính sách bảo hành:**
• **Bảo hành Full 30 ngày (BHF):** Cam kết 1 đổi 1 hoặc cấp tài khoản thay thế trong suốt 30 ngày sử dụng nếu xảy ra lỗi bản quyền.
• **Điều kiện từ chối bảo hành:** Tự ý đổi mật khẩu, đổi email đăng ký, sửa tên Profile hoặc chia sẻ mã PIN cho người ngoài profile.`
  },
  {
    title: "Tài khoản Wink VIP+ Riêng Tư (7 Ngày Full Tính Năng)",
    slug: "wink-vip-plus-7-ngay",
    price: 19000,
    originalPrice: 35000,
    type: "ACCOUNT",
    categorySlug: "hoc-tap-phan-mem", // Học tập & Thiết kế
    thumbnailUrl: "/images/products/wink-vip.svg",
    fulfillmentType: "API_DROPSHIP",
    minQuantity: 1,
    maxQuantity: 10,
    supplierCode: "XOAINON_TELE",
    supplierProductCode: "56",
    supplierPrice: 9600,
    supplierStock: 7,
    description: `🪄 **Tài Khoản Wink VIP+ Riêng Tư (Gói 7 Ngày)**
• **Định dạng bàn giao (Giao liền 100%):** \`Email | Mật khẩu\`.
• Mở khóa trọn bộ tính năng VIP+ đỉnh cao của Wink: Làm nét video AI Ultra HD, phục hồi chân dung sắc nét, chỉnh sửa thon gọn dáng người, xóa vật thể AI và bộ lọc màu điện ảnh.
• Tài khoản riêng tư 1 người dùng độc quyền, không lo bị đẩy ra ngoài khi đang edit video.

📌 **Hướng dẫn sử dụng:**
1. Tải ứng dụng Wink trên App Store (iOS) hoặc Google Play (Android).
2. Đăng nhập bằng tài khoản \`Email | Mật khẩu\` được cấp để kích hoạt ngay quyền lợi VIP+.

🛡️ **Chính sách bảo hành:**
• **Bảo hành Full Date 7 ngày:** Cam kết 1 đổi 1 ngay lập tức nếu tài khoản bị mất quyền lợi VIP+ trong thời gian 7 ngày sử dụng.`
  },
  {
    title: "Tài khoản Kling AI Video (66 Credits Khởi Tạo Sẵn)",
    slug: "kling-ai-video-66-credits",
    price: 35000,
    originalPrice: 60000,
    type: "ACCOUNT",
    categorySlug: "ai-tool", // Tài Khoản AI
    thumbnailUrl: "/images/products/kling-ai.svg",
    fulfillmentType: "API_DROPSHIP",
    minQuantity: 1,
    maxQuantity: 10,
    supplierCode: "DKEY_TELE",
    supplierProductCode: "6a3f1008cc06fe4bc3ab8e27",
    supplierPrice: 15000,
    supplierStock: 28,
    description: `🎬 **Tài Khoản Kling AI Video (66 Credits Khởi Tạo Sẵn)**
• **Định dạng bàn giao (Giao liền 100%):** \`Email | Mật khẩu\`.
• Sở hữu sẵn 66 Credits tạo video AI, đăng nhập trực tiếp tại trang chủ \`klingai.com\` dùng ngay.
• Công cụ AI Text-to-Video & Image-to-Video hàng đầu thế giới: Biến ý tưởng và kịch bản thành video chuyển động mượt mà, chân thực với độ phân giải cao và góc quay điện ảnh.

📌 **Hướng dẫn sử dụng:**
1. Truy cập \`https://klingai.com\` và đăng nhập bằng tài khoản được cấp.
2. Bắt đầu tạo video từ prompt văn bản hoặc hình ảnh có sẵn.

🛡️ **Chính sách bảo hành:**
• **Bảo hành đăng nhập & số dư:** Bảo hành đăng nhập thành công và đảm bảo có đủ 66 credits trong vòng 24 giờ kể từ thời điểm nhận tài khoản.
• Không bảo hành sau khi khách hàng đã sử dụng hết số credits được cấp.`
  },
  {
    title: "Tài khoản Zoom Pro Không Giới Hạn 40 Phút (1 Tháng)",
    slug: "zoom-pro-1-thang-ready",
    price: 119000,
    originalPrice: 199000,
    type: "ACCOUNT",
    categorySlug: "hoc-tap-phan-mem", // Học tập & Thiết kế
    thumbnailUrl: "/images/products/zoom-pro.svg",
    fulfillmentType: "API_DROPSHIP",
    minQuantity: 1,
    maxQuantity: 5,
    supplierCode: "DSHOP_TELE",
    supplierProductCode: "prod:13:2",
    supplierPrice: 70000,
    supplierStock: 22,
    description: `💼 **Tài Khoản Zoom Pro Bản Quyền (1 Tháng - Ready Account)**
• **Định dạng bàn giao (Giao liền 100%):** \`Email | Mật khẩu\` (Tài khoản cấp sẵn dùng ngay, kèm quyền truy cập email).
• Họp / Học trực tuyến không giới hạn thời gian (không bị giới hạn 40 phút).
• Hỗ trợ tối đa 100 người tham gia cùng lúc, chất lượng âm thanh và hình ảnh HD rõ nét, hỗ trợ ghi âm cuộc họp lên đám mây (Cloud Recording) và chia phòng theo nhóm (Breakout Rooms).

📌 **Lưu ý sử dụng & Quy định quan trọng:**
1. **Tuyệt đối không tự ý đổi mật khẩu** tài khoản trong quá trình sử dụng để hệ thống hỗ trợ bảo hành và kiểm tra lỗi nhanh nhất khi cần.
2. Khi đăng nhập vào Zoom nếu xuất hiện thông báo yêu cầu bật bảo mật 2 bước (2FA), vui lòng nhấn **"Bỏ qua / Skip"** để tiếp tục sử dụng bình thường.

🛡️ **Chính sách bảo hành:**
• **Bảo hành 25 ngày (W25D):** Cam kết 1 đổi 1 hoặc hỗ trợ khắc phục nhanh chóng nếu gói Zoom Pro gặp sự cố bản quyền trong suốt 25 ngày.`
  },
  {
    title: "Tài khoản Figma Pro Education Bản Quyền 2 Năm (Full Make / AI)",
    slug: "figma-pro-education-2-nam",
    price: 229000,
    originalPrice: 350000,
    type: "ACCOUNT",
    categorySlug: "hoc-tap-phan-mem", // Học tập & Thiết kế
    thumbnailUrl: "/images/products/figma-pro.svg",
    fulfillmentType: "API_DROPSHIP",
    minQuantity: 1,
    maxQuantity: 3,
    supplierCode: "XOAINON_TELE",
    supplierProductCode: "72",
    supplierPrice: 139000,
    supplierStock: 19,
    description: `🎨 **Tài Khoản Figma Pro Education Bản Quyền 2 Năm (Full Make / AI)**
• **Định dạng bàn giao (Giao liền 100%):** \`Email | Mật khẩu\`.
• Tài khoản riêng tư 100% (1 người dùng độc quyền), không dùng chung với bất kỳ ai.
• Mở khóa trọn bộ tính năng cao cấp: Figma Design chuyên nghiệp, Dev Mode hỗ trợ lập trình viên, FigJam không giới hạn bảng vẽ, tính năng Make (Claude Opus 4.7 & AI Generator).
• Đặc quyền kèm theo: Tặng sẵn 3.000 credits/tháng để trải nghiệm các tính năng tạo giao diện AI.

📌 **Hướng dẫn sử dụng:**
1. Đăng nhập trực tiếp tại \`https://figma.com\` bằng tài khoản được bàn giao.
2. Khách hàng có thể tạo Team riêng, lưu trữ file thiết kế không giới hạn.

🛡️ **Chính sách bảo hành:**
• **Bảo hành dài hạn 24 tháng:** Cam kết hỗ trợ 1 đổi 1 hoặc khôi phục quyền lợi Pro trong suốt 2 năm theo chính sách giáo dục của Figma.`
  },
  {
    title: "Tài khoản MUSE AI (31 Tỷ Token Vĩnh Viễn Không Hết Hạn)",
    slug: "muse-ai-31-ty-token",
    price: 29000,
    originalPrice: 59000,
    type: "ACCOUNT",
    categorySlug: "ai-tool", // Tài Khoản AI
    thumbnailUrl: "/images/products/muse-ai.svg",
    fulfillmentType: "API_DROPSHIP",
    minQuantity: 1,
    maxQuantity: 10,
    supplierCode: "XOAINON_TELE",
    supplierProductCode: "76",
    supplierPrice: 11900,
    supplierStock: 31,
    description: `🌐 **Tài Khoản MUSE AI Bản Quyền (31 Tỷ Token - Never Expires)**
• **Định dạng bàn giao (Giao liền 100%):** \`Email | Mật khẩu\` hoặc \`Token Key\`.
• Tài khoản Muse AI được nạp sẵn 31 TỶ TOKEN không giới hạn thời gian (Never expires).
• Phục vụ sáng tạo nội dung, xử lý video thông minh, lưu trữ và tương tác AI chuyên sâu mà không bao giờ lo cạn kiệt dung lượng token.

📌 **Hướng dẫn sử dụng:**
1. Đăng nhập vào nền tảng Muse AI bằng thông tin bàn giao để kiểm tra số dư 31 tỷ token và bắt đầu làm việc.

🛡️ **Chính sách bảo hành:**
• **Bảo hành số dư ban đầu:** Bảo hành đăng nhập thành công và chuẩn xác số dư 31 tỷ token khi nhận bàn giao trong vòng 24 giờ.
• Không bảo hành sau khi người dùng đã khai thác/sử dụng hết token hoặc các cập nhật chính sách từ nền tảng gốc.`
  }
];

async function main() {
  console.log("=== STARTING PRODUCT SEEDING ===");

  for (const item of PRODUCTS_TO_ADD) {
    // 1. Resolve Category
    const category = await prisma.category.findUnique({
      where: { slug: item.categorySlug }
    });
    if (!category) {
      console.error(`Category not found for slug: ${item.categorySlug}`);
      continue;
    }

    // 2. Resolve Supplier
    const supplier = await prisma.supplier.findUnique({
      where: { code: item.supplierCode }
    });
    if (!supplier) {
      console.error(`Supplier not found for code: ${item.supplierCode}`);
      continue;
    }

    // 3. Upsert Product
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        type: item.type,
        thumbnailUrl: item.thumbnailUrl,
        fulfillmentType: item.fulfillmentType,
        categoryId: category.id,
        isActive: true,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity
      },
      create: {
        title: item.title,
        slug: item.slug,
        description: item.description,
        price: item.price,
        originalPrice: item.originalPrice,
        type: item.type,
        thumbnailUrl: item.thumbnailUrl,
        fulfillmentType: item.fulfillmentType,
        categoryId: category.id,
        isActive: true,
        minQuantity: item.minQuantity,
        maxQuantity: item.maxQuantity
      }
    });

    console.log(`Upserted Product: ${product.title} (ID: ${product.id})`);

    // 4. Upsert SupplierProductMapping
    await prisma.supplierProductMapping.upsert({
      where: { productId: product.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: item.supplierProductCode,
        supplierPrice: item.supplierPrice,
        supplierStock: item.supplierStock,
        markupType: "FIXED_AMOUNT",
        markupValue: item.price - item.supplierPrice,
        isAutoSync: true,
        lastSyncAt: new Date()
      },
      create: {
        productId: product.id,
        supplierId: supplier.id,
        supplierProductCode: item.supplierProductCode,
        supplierPrice: item.supplierPrice,
        supplierStock: item.supplierStock,
        markupType: "FIXED_AMOUNT",
        markupValue: item.price - item.supplierPrice,
        isAutoSync: true,
        lastSyncAt: new Date()
      }
    });

    console.log(`  -> Mapped to ${supplier.name} (${item.supplierProductCode})`);
  }

  console.log("=== ALL 6 PRODUCTS SUCCESSFULLY SEEDED & MAPPED ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
