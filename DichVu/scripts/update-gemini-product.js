const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const description = `Gói Gemini Pro & Google Drive 5TB 18 Tháng Chính Chủ (Kích hoạt trực tiếp qua link nhận ưu đãi):

💾 Dung lượng: 5TB lưu trữ Google Drive, Google Photos và Gmail tốc độ cao.
🤖 Trí tuệ nhân tạo: Sử dụng Gemini Pro / Gemini Advanced trọn vẹn 18 tháng (mô hình Gemini 2.0 Flash 2M Context, viết code, phân tích tài liệu dài siêu tốc).
👥 Chia sẻ gia đình: Thêm tối đa 5 thành viên dùng chung kho dung lượng 5TB.
🔒 Bảo mật: Nâng cấp trên tài khoản chính chủ của bạn, riêng tư dữ liệu 100%.
💳 Tiện lợi: Kích hoạt trực tiếp qua link nhận ưu đãi, không cần thêm thẻ thanh toán (Visa/Mastercard).
⚡ Bàn giao tự động: Link kích hoạt được cấp ngay lập tức 24/7 sau khi thanh toán.

📌 HƯỚNG DẪN KÍCH HOẠT:
1. Sao chép (copy) đường link nhận được sau khi thanh toán thành công (link có dạng https://gemini.serviceactivation.in/... hoặc geminiactivation.com).
2. Dán (paste) link vào trình duyệt trên thiết bị đang đăng nhập sẵn tài khoản Google (Gmail) cần nâng cấp.
3. Nhấn "Chấp nhận ưu đãi" (Claim Offer) để hoàn tất nhận gói 18 tháng trực tiếp vào tài khoản.
4. (Tùy chọn): Vào Google One bật tính năng "Chia sẻ với gia đình" để mời tối đa 5 thành viên dùng chung bộ nhớ 5TB.

⚠️ LƯU Ý QUAN TRỌNG:
• Thời hạn kích hoạt: Link chỉ có hiệu lực trong vòng 12 giờ kể từ thời điểm giao đơn. Sau 12 giờ link sẽ tự động hết hạn, shop xin phép từ chối xử lý và không hỗ trợ các trường hợp kích hoạt trễ.
• Vui lòng kích hoạt link ngay sau khi nhận hàng để đảm bảo quyền lợi.`;

  const updatedProduct = await prisma.product.upsert({
    where: { slug: 'gemini-advanced-18-thang' },
    update: {
      title: 'Gói Gemini Pro & Google Drive 5TB 18 Tháng Chính Chủ',
      description: description,
      price: 21000,
      originalPrice: 150000,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      isActive: true,
      thumbnailUrl: '/images/brands/gemini.svg'
    },
    create: {
      title: 'Gói Gemini Pro & Google Drive 5TB 18 Tháng Chính Chủ',
      slug: 'gemini-advanced-18-thang',
      description: description,
      price: 21000,
      originalPrice: 150000,
      type: 'ACCOUNT',
      fulfillmentType: 'API_DROPSHIP',
      isActive: true,
      thumbnailUrl: '/images/brands/gemini.svg',
      categoryId: '506d6f68-cb5b-4098-8cb4-ebcafd8bb8b9'
    }
  });

  console.log("Updated Product in DB:");
  console.log(JSON.stringify(updatedProduct, null, 2));

  // Also verify supplier mapping
  const supplier = await prisma.supplier.findUnique({
    where: { code: 'XOAINON_TELE' }
  });

  if (supplier) {
    const mapping = await prisma.supplierProductMapping.upsert({
      where: { productId: updatedProduct.id },
      update: {
        supplierId: supplier.id,
        supplierProductCode: '51',
        supplierPrice: 14800,
        supplierStock: 52,
        markupType: 'PERCENTAGE',
        markupValue: 42,
        isAutoSync: true,
        customConfig: JSON.stringify({
          alternativeSuppliers: [
            {
              supplierCode: 'NGHIENTRICK_TELE',
              supplierProductCode: '19',
              supplierPrice: 14567
            }
          ]
        })
      },
      create: {
        productId: updatedProduct.id,
        supplierId: supplier.id,
        supplierProductCode: '51',
        supplierPrice: 14800,
        supplierStock: 52,
        markupType: 'PERCENTAGE',
        markupValue: 42,
        isAutoSync: true,
        customConfig: JSON.stringify({
          alternativeSuppliers: [
            {
              supplierCode: 'NGHIENTRICK_TELE',
              supplierProductCode: '19',
              supplierPrice: 14567
            }
          ]
        })
      }
    });
    console.log("Updated Supplier Mapping:");
    console.log(JSON.stringify(mapping, null, 2));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
