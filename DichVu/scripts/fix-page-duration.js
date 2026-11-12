const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'src', 'app', 'products', '[slug]', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Regex replace with CRLF awareness
const durationRegex = /const durationLabel = isSMM[\s\S]*?const isGeminiKBH = slug\.includes\("gemini"\)[\s\S]*?\);/;

const replacement = `const isSuno = slug.includes("suno") || titleLower.includes("suno");
  const isHMA = slug.includes("hma") || titleLower.includes("hma");
  const isGeminiKBH = slug.includes("gemini") && (slug.includes("family") || slug.includes("kbh") || titleLower.includes("kbh") || titleLower.includes("2 năm"));

  const durationLabel = isSMM
    ? "Hoàn thành theo số lượng đặt mua"
    : isCodex
    ? "Bảo lưu vĩnh viễn (Dùng đến khi hết Quota)"
    : isClaude
    ? "Bảo lưu theo hạn mức Credit / Request đã chọn"
    : isChatGPTBHF
    ? "30 ngày bảo hành Full Date (BHF)"
    : isChatGPT
    ? "30 ngày sử dụng (BH đăng nhập 24H)"
    : isGeminiKBH || titleLower.includes("2 năm") || slug.includes("2-nam")
    ? "24 tháng (Hạn 2 năm) - Gói KBH"
    : isSuno
    ? "30 ngày sử dụng (2.500 Credits)"
    : titleLower.includes("18 tháng")
    ? "18 tháng đầy đủ (Full date)"
    : titleLower.includes("12 tháng") || titleLower.includes("1 năm")
    ? "12 tháng (1 năm) bản quyền"
    : titleLower.includes("30 ngày") || titleLower.includes("1 tháng")
    ? "30 ngày đầy đủ"
    : titleLower.includes("3 tháng")
    ? "90 ngày (3 tháng)"
    : "Theo gói dịch vụ đã chọn";`;

pageContent = pageContent.replace(durationRegex, replacement);
fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('products/[slug]/page.tsx regex replace done');
