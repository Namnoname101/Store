const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8');
const token = env.match(/^\s*FLY_API_TOKEN\s*=\s*['"]?(.*?)['"]?\s*$/m)?.[1]?.trim();

const code = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('=== FIXING CANVA ORDER ORD225283 ===');

  const order = await prisma.order.findUnique({
    where: { orderCode: 'ORD225283' },
    include: { deliveredItems: true }
  });

  if (!order) {
    console.log('Order ORD225283 not found!');
    return;
  }

  console.log('Current delivered items:', order.deliveredItems.length);
  const oldSecret = order.deliveredItems[0]?.secretContent;
  console.log('Old secret:', oldSecret);

  const newSecret = "MintzRexford79@hotmail.com|canvapro@|Full Mail: MintzRexford79@hotmail.com|SFIsup9ZOx|M.C515_SN1.0.U.MsaArtifacts.-CpeyHKo*VoYOO*UDFLKf0VqyhPz8yDN8TVcDuYjFz6uiUFz7YwX0kHP6v2IhZdeq!ZqEJdkgX36yoZc9A4brPJB3CTMX0mwHiE31M8Gjxfs6uVc2Y00NEpZmO8QxcdPmHL6YZW3zmjsVgyd8Ylg2x2BU8!RAqALDz8q2mHs6IrxcuDm18n0kr678IFpbFJ9Vlds0xR5BeHXB41QZUkTqcbsQFvfOe1qF0TJVaQXBzVjMDezAMI!xn*HLxW4xg4Tv3VN8HVRlQ6WPAwLAr1LemWn2Nsm0E5oTFtjis3vZQs2!O83M3pobrb1JT6CXJ9IZtgSyTxUhSoT16KLVc2nNgzUsSW6PUecoF5D0kwUNL0lFXDu8kvZN92kFpyF9xxjmhFzhmuxxmhkk80amZBgLYc0WLZa8m9Y7z5mGDwgl5AcA|9e5f94bc-e8a4-4e73-b8be-63364c29d753|mintzrexford79lkn@fviainboxes.com";

  if (order.deliveredItems.length > 0) {
    const updatedItem = await prisma.productItem.update({
      where: { id: order.deliveredItems[0].id },
      data: { secretContent: newSecret }
    });
    console.log('Updated DeliveredItem id:', updatedItem.id);
  } else {
    console.log('No delivered item to update!');
  }

  // Update product title and description for canva-pro-1-thang
  console.log('=== UPDATING CANVA PRODUCT INFO TO MATCH SUPPLIER ===');
  const updatedProduct = await prisma.product.update({
    where: { slug: 'canva-pro-1-thang' },
    data: {
      title: 'Tài khoản Canva Pro 1 Tháng (Dùng Riêng - Full Mail)',
      description: '**TÀI KHOẢN CANVA PRO 1 THÁNG (DÙNG RIÊNG TƯ - FULL TÍNH NĂNG PRO)**\\n\\nTài khoản Canva Pro bản quyền dùng riêng tư cá nhân, không chung đụng, mở khóa trọn bộ tính năng thiết kế đồ họa cao cấp và công cụ trí tuệ nhân tạo Magic Studio.\\n\\n**Quyền lợi & Tính năng Canva Pro:**\\n- Mở khóa không giới hạn hơn 100+ triệu hình ảnh, video, âm thanh và mẫu thiết kế premium độc quyền.\\n- Công cụ AI Magic Studio: Xóa vật thể, xóa phông nền 1 chạm, Magic Expand mở rộng ảnh thông minh.\\n- Magic Switch: Đổi kích cỡ thiết kế nhanh chóng theo chuẩn Facebook, TikTok, Instagram, YouTube...\\n- Xuất file chất lượng cao (PNG trong suốt, SVG, PDF in ấn độ phân giải cao, MP4 4K).\\n- Bộ nhận diện thương hiệu (Brand Kit): Lưu bảng màu, font chữ và logo thương hiệu.\\n\\n**Chính sách bàn giao & Bảo hành:**\\n- **Hình thức nhận hàng:** Cấp tài khoản dùng riêng định dạng Email | Mật khẩu (kèm Full Mail Hotmail để chủ động nhận mã/khôi phục khi cần).\\n- **Thời hạn sử dụng:** 30 ngày đầy đủ (Full Date).\\n- **Chính sách bảo hành:** Bảo hành 1 đổi 1 trong suốt 30 ngày nếu tài khoản gặp sự cố kỹ thuật hoặc mất gói Pro.'
    }
  });

  console.log('Product updated successfully:', updatedProduct.slug, updatedProduct.title);

  await prisma.$disconnect();
}

run().catch(console.error);
`;

const b64 = Buffer.from(code).toString('base64');
const cmd = `node -e "eval(Buffer.from('${b64}','base64').toString())"`;
const res = spawnSync('fly.exe', ['ssh', 'console', '-a', 'daitruongstore', '-C', cmd], {
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env, FLY_API_TOKEN: token, FLY_ACCESS_TOKEN: token },
  encoding: 'utf8'
});

console.log(res.stdout);
if (res.stderr) console.error('STDERR:', res.stderr);
