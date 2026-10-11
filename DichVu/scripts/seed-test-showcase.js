const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test showcase products & inventory...');

  // 1. Categories
  const catGiaiTri = await prisma.category.upsert({
    where: { slug: 'giai-tri' },
    update: { name: 'Giải Trí & Phim Ảnh' },
    create: {
      name: 'Giải Trí & Phim Ảnh',
      slug: 'giai-tri',
      description: 'Tài khoản Netflix, Spotify, YouTube Premium chất lượng cao',
    },
  });

  const catAI = await prisma.category.upsert({
    where: { slug: 'ai-cong-nghe' },
    update: { name: 'Tài Khoản AI & Tiện Ích' },
    create: {
      name: 'Tài Khoản AI & Tiện Ích',
      slug: 'ai-cong-nghe',
      description: 'ChatGPT Plus, Claude Pro, Cursor AI, Gemini Advanced',
    },
  });

  const catPhanMem = await prisma.category.upsert({
    where: { slug: 'phan-mem-ban-quyen' },
    update: { name: 'Phần Mềm Bản Quyền' },
    create: {
      name: 'Phần Mềm Bản Quyền',
      slug: 'phan-mem-ban-quyen',
      description: 'Canva Pro, Windows, Office 365, VPN bản quyền',
    },
  });

  // 2. Products
  const netflix = await prisma.product.upsert({
    where: { slug: 'netflix-1-month' },
    update: {
      title: 'Tài Khoản Netflix Premium 1 Tháng (4K Ultra HD)',
      price: 69000,
      originalPrice: 85000,
      type: 'ACCOUNT',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80',
      description: 'Tài khoản Netflix Premium gói 4K Ultra HD xem riêng 1 profile, ổn định không out, bảo hành 30 ngày.',
      categoryId: catGiaiTri.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
    create: {
      slug: 'netflix-1-month',
      title: 'Tài Khoản Netflix Premium 1 Tháng (4K Ultra HD)',
      price: 69000,
      originalPrice: 85000,
      type: 'ACCOUNT',
      thumbnailUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80',
      description: 'Tài khoản Netflix Premium gói 4K Ultra HD xem riêng 1 profile, ổn định không out, bảo hành 30 ngày.',
      categoryId: catGiaiTri.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
  });

  const chatgpt = await prisma.product.upsert({
    where: { slug: 'chatgpt-plus-1-thang' },
    update: {
      title: 'Nâng Cấp ChatGPT Plus 1 Tháng Chính Chủ',
      price: 199000,
      originalPrice: 250000,
      type: 'ACCOUNT',
      thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
      description: 'Tài khoản ChatGPT Plus sử dụng GPT-4o, DALL-E 3, tốc độ siêu nhanh, không giới hạn.',
      categoryId: catAI.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
    create: {
      slug: 'chatgpt-plus-1-thang',
      title: 'Nâng Cấp ChatGPT Plus 1 Tháng Chính Chủ',
      price: 199000,
      originalPrice: 250000,
      type: 'ACCOUNT',
      thumbnailUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&auto=format&fit=crop&q=80',
      description: 'Tài khoản ChatGPT Plus sử dụng GPT-4o, DALL-E 3, tốc độ siêu nhanh, không giới hạn.',
      categoryId: catAI.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
  });

  const youtube = await prisma.product.upsert({
    where: { slug: 'youtube-premium-1-nam' },
    update: {
      title: 'Gói Gia Hạn YouTube Premium 1 Năm (Email Chính Chủ)',
      price: 280000,
      originalPrice: 360000,
      type: 'ACCOUNT',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&auto=format&fit=crop&q=80',
      description: 'Xem video không quảng cáo, nghe nhạc tắt màn hình YouTube Music trọn gói 1 năm bảo hành đầy đủ.',
      categoryId: catGiaiTri.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
    create: {
      slug: 'youtube-premium-1-nam',
      title: 'Gói Gia Hạn YouTube Premium 1 Năm (Email Chính Chủ)',
      price: 280000,
      originalPrice: 360000,
      type: 'ACCOUNT',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&auto=format&fit=crop&q=80',
      description: 'Xem video không quảng cáo, nghe nhạc tắt màn hình YouTube Music trọn gói 1 năm bảo hành đầy đủ.',
      categoryId: catGiaiTri.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
  });

  const canva = await prisma.product.upsert({
    where: { slug: 'canva-pro-vinh-vien' },
    update: {
      title: 'Tài Khoản Canva Pro Bản Quyền (Gia Nhập Team Edu vĩnh viễn)',
      price: 79000,
      originalPrice: 120000,
      type: 'LICENSE_KEY',
      thumbnailUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
      description: 'Kích hoạt Canva Pro không giới hạn mẫu thiết kế, hình ảnh premium, bộ font chữ thương hiệu chuyên nghiệp.',
      categoryId: catPhanMem.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
    create: {
      slug: 'canva-pro-vinh-vien',
      title: 'Tài Khoản Canva Pro Bản Quyền (Gia Nhập Team Edu vĩnh viễn)',
      price: 79000,
      originalPrice: 120000,
      type: 'LICENSE_KEY',
      thumbnailUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
      description: 'Kích hoạt Canva Pro không giới hạn mẫu thiết kế, hình ảnh premium, bộ font chữ thương hiệu chuyên nghiệp.',
      categoryId: catPhanMem.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
  });

  const catCloud = await prisma.category.upsert({
    where: { slug: 'cloud-vps' },
    update: { name: 'Cloud VPS & Máy Chủ' },
    create: {
      name: 'Cloud VPS & Máy Chủ',
      slug: 'cloud-vps',
      description: 'Cloud Server, VPS NVMe tốc độ cao 1Gbps',
    },
  });

  const vps = await prisma.product.upsert({
    where: { slug: 'vps-cloud-2core-4gb' },
    update: {
      title: 'VPS Cloud NVMe 2 Core / 4GB RAM / 50GB SSD',
      price: 149000,
      originalPrice: 200000,
      type: 'ACCOUNT',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      description: 'Máy chủ ảo Cloud VPS tốc độ cao, băng thông không giới hạn, IP riêng Việt Nam.',
      categoryId: catCloud.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
    create: {
      slug: 'vps-cloud-2core-4gb',
      title: 'VPS Cloud NVMe 2 Core / 4GB RAM / 50GB SSD',
      price: 149000,
      originalPrice: 200000,
      type: 'ACCOUNT',
      thumbnailUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      description: 'Máy chủ ảo Cloud VPS tốc độ cao, băng thông không giới hạn, IP riêng Việt Nam.',
      categoryId: catCloud.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
  });

  const catMXH = await prisma.category.upsert({
    where: { slug: 'mang-xa-hoi' },
    update: { name: 'Dịch Vụ Mạng Xã Hội' },
    create: {
      name: 'Dịch Vụ Mạng Xã Hội',
      slug: 'mang-xa-hoi',
      description: 'Tương tác TikTok, Facebook, Instagram',
    },
  });

  const tiktok = await prisma.product.upsert({
    where: { slug: 'tiktok-1000-follow' },
    update: {
      title: 'Gói 1.000 Follower TikTok Việt Nam Thật (Bảo hành 30 ngày)',
      price: 49000,
      originalPrice: 80000,
      type: 'SERVICE',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&auto=format&fit=crop&q=80',
      description: 'Tăng tương tác follow kênh TikTok an toàn 100%, bảo hành tụt trong 30 ngày.',
      categoryId: catMXH.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
    create: {
      slug: 'tiktok-1000-follow',
      title: 'Gói 1.000 Follower TikTok Việt Nam Thật (Bảo hành 30 ngày)',
      price: 49000,
      originalPrice: 80000,
      type: 'SERVICE',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&auto=format&fit=crop&q=80',
      description: 'Tăng tương tác follow kênh TikTok an toàn 100%, bảo hành tụt trong 30 ngày.',
      categoryId: catMXH.id,
      fulfillmentType: 'LOCAL_STOCK',
      isActive: true,
    },
  });


  // 3. Populate Inventory for LOCAL_STOCK products
  const stockToAdd = [
    { product: netflix, secrets: ['netflix_user_01@daitruong.com|Pass123456', 'netflix_user_02@daitruong.com|Pass654321', 'netflix_user_03@daitruong.com|PassSecure88'] },
    { product: chatgpt, secrets: ['chatgpt_plus_01@daitruong.com|Gpt@2026', 'chatgpt_plus_02@daitruong.com|Gpt@2026Secure'] },
    { product: youtube, secrets: ['https://support.google.com/youtube/family_invite_code_yt01', 'https://support.google.com/youtube/family_invite_code_yt02'] },
    { product: canva, secrets: ['CANVA-PRO-INVITE-LINK-VIP-01', 'CANVA-PRO-INVITE-LINK-VIP-02', 'CANVA-PRO-INVITE-LINK-VIP-03'] },
  ];

  for (const { product, secrets } of stockToAdd) {
    const existing = await prisma.productItem.count({
      where: { productId: product.id, status: 'AVAILABLE' }
    });
    if (existing < 3) {
      for (const secret of secrets) {
        await prisma.productItem.create({
          data: {
            productId: product.id,
            secretContent: secret,
            status: 'AVAILABLE',
          }
        });
      }
    }
  }

  // 4. Sample Coupon
  await prisma.coupon.upsert({
    where: { code: 'DAITRUONG10K' },
    update: {
      type: 'FIXED',
      value: 10000,
      minOrderValue: 50000,
      isActive: true,
      usageLimit: 100,
    },
    create: {
      code: 'DAITRUONG10K',
      type: 'FIXED',
      value: 10000,
      minOrderValue: 50000,
      isActive: true,
      usageLimit: 100,
    },
  });

  console.log('Test showcase seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
