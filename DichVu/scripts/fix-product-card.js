const fs = require('fs');
const path = require('path');

const cardPath = path.join(__dirname, '..', 'src', 'components', 'ProductCard.tsx');
let cardContent = fs.readFileSync(cardPath, 'utf8');

const target = `  const discountPercent =`;
const insertion = `  const titleLower = (title || "").toLowerCase();
  const slugLower = (slug || "").toLowerCase();
  let durationBadge: string | null = null;
  if (titleLower.includes("2 năm") || slugLower.includes("2-nam")) {
    durationBadge = "HẠN 2 NĂM";
  } else if (titleLower.includes("18 tháng") || slugLower.includes("18-thang")) {
    durationBadge = "18 THÁNG";
  } else if (titleLower.includes("1 năm") || titleLower.includes("12 tháng") || slugLower.includes("1-nam") || slugLower.includes("12-thang")) {
    durationBadge = "1 NĂM";
  } else if (titleLower.includes("6 tháng") || slugLower.includes("6-thang")) {
    durationBadge = "6 THÁNG";
  } else if (titleLower.includes("3 tháng") || slugLower.includes("3-thang")) {
    durationBadge = "3 THÁNG";
  } else if (titleLower.includes("30 ngày") || titleLower.includes("1 tháng") || slugLower.includes("1-thang") || slugLower.includes("30-ngay")) {
    durationBadge = "30 NGÀY";
  } else if (titleLower.includes("7 ngày") || slugLower.includes("7-ngay")) {
    durationBadge = "7 NGÀY";
  } else if (titleLower.includes("vĩnh viễn") || slugLower.includes("vinh-vien")) {
    durationBadge = "VĨNH VIỄN";
  }

  const discountPercent =`;

if (!cardContent.includes('let durationBadge: string | null = null;')) {
  cardContent = cardContent.replace(target, insertion);
  fs.writeFileSync(cardPath, cardContent, 'utf8');
  console.log('✓ Successfully inserted durationBadge definition into ProductCard.tsx');
} else {
  console.log('durationBadge already defined');
}
