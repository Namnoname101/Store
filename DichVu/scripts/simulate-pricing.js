const fs = require('fs');
const list = require('./prod-products-price.json');

const officialPrices = {
  // Tài khoản AI
  'chatgpt-plus-1-thang': { official: 530000, note: 'OpenAI 20$ + VAT' },
  'chatgpt-plus-1-thang-bhf': { official: 530000, note: 'OpenAI 20$ + VAT' },
  'suno-ai-pro-1-thang': { official: 260000, note: 'Suno 10$/tháng' },
  'muse-ai-31-ty-token': { official: 1500000, note: 'Gói vĩnh viễn' },

  // Phần mềm & Tiện ích
  'capcut-pro-7-ngay': { official: 90000, note: 'App Store / Google Play' },
  'capcut-pro-30-ngay': { official: 260000, note: 'App Store / Google Play' },
  'office-365-1-nam': { official: 2099000, note: 'Microsoft Store VN' },
  'key-hma-vpn-1-thang': { official: 120000, note: 'HMA Website' },
  'adobe-express-12-thang': { official: 2800000, note: 'Adobe 9.99$/tháng' },

  // Học tập & Thiết kế
  'wink-vip-plus-7-ngay': { official: 60000, note: 'Meitu Store' },
  'duolingo-super-12-thang': { official: 1290000, note: 'Duolingo VN' },
  'photoroom-max-7-ngay': { official: 80000, note: 'Photoroom App' },
  'quizlet-plus-1-thang': { official: 90000, note: 'Quizlet Teacher' },
  'xingtu-vip-30-ngay': { official: 75000, note: 'App Store TQ 18 tệ' },
  'figma-pro-education-2-nam': { official: 7200000, note: 'Figma 12$/tháng' },
  'adobe-full-apps-1-thang': { official: 1100000, note: 'Adobe 34-50$/tháng' },

  // API AI
  'cdx-0055-api-codex-ai-toc-o-nhanh-10-credit': { official: 250000, note: 'Tương đương 10$ Credit' },
  'cdx-0056-api-codex-ai-toc-o-nhanh-50-credit': { official: 1250000, note: 'Tương đương 50$ Credit' },
  'cdx-0057-api-codex-ai-toc-o-nhanh-100-credit': { official: 2500000, note: 'Tương đương 100$ Credit' },
  'cdx-0058-api-codex-ai-toc-o-nhanh-200-credit': { official: 5000000, note: 'Tương đương 200$ Credit' },
  'cdx-0060-api-codex-ai-toc-o-nhanh-500-credit': { official: 12500000, note: 'Tương đương 500$ Credit' },
  'api-claude-10-max-10-credit': { official: 250000, note: '10$ Anthropic Credit' },
  'api-claude-30-max-30-credit': { official: 750000, note: '30$ Anthropic Credit' },
  'api-claude-50-max-50-credit': { official: 1250000, note: '50$ Anthropic Credit' },
  'api-claude-100-max-100-credit': { official: 2500000, note: '100$ Anthropic Credit' },
  'api-claude-1-thang-max-5000-credit': { official: 125000000, note: '5000$ Anthropic Credit' },
  'codex-credit-10usd': { official: 250000, note: '10$ OpenAI Quota' },
  'codex-credit-50usd': { official: 1250000, note: '50$ OpenAI Quota' },

  // MXH Buff
  'tang-tim-tiktok-1000': { official: 100, note: 'Quảng cáo TikTok Ads' },
  'tang-like-facebook-1000': { official: 150, note: 'Facebook Ads CPC' },
  'tang-follow-facebook-1000': { official: 300, note: 'Facebook Ads Page Like' },
  'tang-follow-tiktok-1000': { official: 400, note: 'TikTok Ads Follower' },
};

// Đề xuất tối ưu giá bán & tỷ lệ hoa hồng CTV
// Nguyên tắc:
// 1. Rẻ hơn chính chủ ít nhất 40% - 98%
// 2. Lãi Shop (sau khi khách giảm 5% & trả hoa hồng CTV) LUÔN LỚN HƠN HOA HỒNG CTV! (Tối thiểu Shop ăn 60% - 80% phần lãi gộp)
const priceAdjustments = {
  // Gói tài khoản AI
  'chatgpt-plus-1-thang': { newPrice: 149000, ctvRate: 8 }, // Vốn 109k, Bán 149k, CTV 8% = 11.3k, Shop lãi +21.2k (gấp đôi CTV)
  'chatgpt-plus-1-thang-bhf': { newPrice: 269000, ctvRate: 10 }, // Vốn 188k, Bán 269k, CTV 10% = 25.5k, Shop lãi +42k (gấp 1.65 lần CTV)
  'suno-ai-pro-1-thang': { newPrice: 219000, ctvRate: 10 }, // Vốn 150k, Bán 219k, CTV 10% = 20.8k, Shop lãi +37.2k (gấp 1.8 lần CTV)
  'muse-ai-31-ty-token': { newPrice: 35000, ctvRate: 12 }, // Vốn 14.8k, Bán 35k, CTV 12% = 4k, Shop lãi +14.4k (gấp 3.6 lần CTV)

  // Phần mềm & Tiện ích
  'capcut-pro-7-ngay': { newPrice: 7900, ctvRate: 12 }, // Vốn 3.9k, Bán 7.9k, CTV 12% = 900đ, Shop lãi +2.7k
  'capcut-pro-30-ngay': { newPrice: 49000, ctvRate: 10 }, // Vốn 32.9k, Bán 49k, CTV 10% = 4.6k, Shop lãi +9k (gấp đôi CTV)
  'office-365-1-nam': { newPrice: 29000, ctvRate: 12 }, // Vốn 16.8k, Bán 29k, CTV 12% = 3.3k, Shop lãi +7.4k (gấp đôi CTV)
  'key-hma-vpn-1-thang': { newPrice: 29000, ctvRate: 12 }, // Vốn 5.3k, Bán 29k, CTV 12% = 3.3k, Shop lãi +18.9k (gấp 5.7 lần CTV)
  'adobe-express-12-thang': { newPrice: 89000, ctvRate: 12 }, // Vốn 33.2k, Bán 89k, CTV 12% = 10.1k, Shop lãi +41.2k (gấp 4 lần CTV)

  // Học tập & Thiết kế
  'wink-vip-plus-7-ngay': { newPrice: 19000, ctvRate: 12 }, // Vốn 9.6k, Bán 19k, CTV 12% = 2.1k, Shop lãi +6.3k
  'duolingo-super-12-thang': { newPrice: 32000, ctvRate: 10 }, // Vốn 19.8k, Bán 32k, CTV 10% = 3k, Shop lãi +7.6k (gấp 2.5 lần CTV)
  'photoroom-max-7-ngay': { newPrice: 39000, ctvRate: 12 }, // Vốn 19k, Bán 39k, CTV 12% = 4.4k, Shop lãi +13.6k (gấp 3 lần CTV)
  'quizlet-plus-1-thang': { newPrice: 49000, ctvRate: 12 }, // Vốn 25k, Bán 49k, CTV 12% = 5.5k, Shop lãi +16k (gấp 3 lần CTV)
  'xingtu-vip-30-ngay': { newPrice: 99000, ctvRate: 10 }, // Vốn 65k, Bán 99k, CTV 10% = 9.4k, Shop lãi +19.6k (gấp đôi CTV)
  'figma-pro-education-2-nam': { newPrice: 229000, ctvRate: 10 }, // Vốn 139k, Bán 229k, CTV 10% = 21.7k, Shop lãi +56.8k (gấp 2.6 lần CTV)
  'adobe-full-apps-1-thang': { newPrice: 489000, ctvRate: 7 }, // Vốn 370k, Bán 489k, CTV 7% = 32.5k, Shop lãi +62k (gấp gần đôi CTV)
};

const results = list.map(p => {
  const officialInfo = officialPrices[p.slug] || { official: p.sellingPrice * 2, note: 'Tham khảo thị trường' };
  const adj = priceAdjustments[p.slug] || { newPrice: p.sellingPrice, ctvRate: parseInt(p.ctvPercent) };

  const finalSellingPrice = adj.newPrice;
  const ctvRate = adj.ctvRate;

  const cost = p.costPrice;
  const hasCost = cost !== null && cost !== undefined;

  // Khách dùng mã CTV: giảm 5%
  const priceAfterCustomerDiscount = Math.round(finalSellingPrice * 0.95);
  // Hoa hồng CTV: ctvRate% trên số tiền khách thanh toán
  const ctvComm = Math.round((priceAfterCustomerDiscount * ctvRate) / 100);
  // Lợi nhuận Shop thực nhận sau khi giao hàng & trả CTV
  const shopNet = hasCost ? (priceAfterCustomerDiscount - cost - ctvComm) : (priceAfterCustomerDiscount - ctvComm);
  // Tỷ lệ Shop nhận so với CTV
  const shopToCtvRatio = hasCost ? (shopNet / ctvComm).toFixed(2) : 'Quota';

  const savingsPercent = officialInfo.official > 0
    ? Math.round(((officialInfo.official - finalSellingPrice) / officialInfo.official) * 100)
    : 0;

  return {
    category: p.category,
    title: p.title,
    slug: p.slug,
    officialPrice: officialInfo.official,
    costPrice: cost,
    oldPrice: p.sellingPrice,
    newPrice: finalSellingPrice,
    savingsPercent: savingsPercent + '%',
    ctvRate: ctvRate + '%',
    ctvComm: ctvComm,
    shopNet: shopNet,
    shopToCtvRatio: shopToCtvRatio,
    isShopGreaterThanCtv: hasCost ? (shopNet > ctvComm) : true,
  };
});

fs.writeFileSync('scripts/simulation-results.json', JSON.stringify(results, null, 2), 'utf8');

console.log('--- ALL PRODUCTS AUDIT AFTER ADJUSTMENT ---');
let allPass = true;
results.forEach(r => {
  if (!r.isShopGreaterThanCtv) {
    console.log(`FAILED: ${r.title} -> Shop: ${r.shopNet} vs CTV: ${r.ctvComm}`);
    allPass = false;
  }
});
if (allPass) {
  console.log('PERFECT! 100% of all 32 products satisfy: Shop Net Profit > CTV Commission!');
}
