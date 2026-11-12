const fs = require('fs');
const path = require('path');

// 1. Update ProductCard.tsx
const cardPath = path.join(__dirname, '..', 'src', 'components', 'ProductCard.tsx');
let cardContent = fs.readFileSync(cardPath, 'utf8');

// Add Clock import if not present
if (!cardContent.includes('Clock')) {
  cardContent = cardContent.replace('import { ArrowRight, Eye }', 'import { ArrowRight, Eye, Clock }');
}

// Add durationBadge logic
const targetCardLogic = `  const isApiKey =
    product.category?.slug === "ai-api" ||
    product.category?.slug === "ai" ||
    title.toLowerCase().includes("api") ||
    title.toLowerCase().includes("codex") ||
    title.toLowerCase().includes("credit") ||
    title.toLowerCase().includes("token") ||`;

const replacementCardLogic = `  const titleLower = title.toLowerCase();
  const slugLower = slug.toLowerCase();
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

  const isApiKey =
    product.category?.slug === "ai-api" ||
    product.category?.slug === "ai" ||
    title.toLowerCase().includes("api") ||
    title.toLowerCase().includes("codex") ||
    title.toLowerCase().includes("credit") ||
    title.toLowerCase().includes("token") ||`;

if (!cardContent.includes('durationBadge')) {
  cardContent = cardContent.replace(targetCardLogic, replacementCardLogic);
}

// Add duration badge pill in card image
const targetCardImgPill = `          {/* Discount Badge */}`;
const replacementCardImgPill = `          {/* Duration Pill at bottom-left */}
          {durationBadge && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/90 border border-amber-500/40 px-2 py-0.5 text-[11px] font-bold font-mono text-amber-300 shadow-md backdrop-blur-md">
                <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                {durationBadge}
              </span>
            </div>
          )}

          {/* Discount Badge */}`;

if (!cardContent.includes('Clock className="h-3 w-3 text-amber-400')) {
  cardContent = cardContent.replace(targetCardImgPill, replacementCardImgPill);
}
fs.writeFileSync(cardPath, cardContent, 'utf8');
console.log('✓ ProductCard.tsx updated with duration badge');

// 2. Update products/[slug]/page.tsx
const pagePath = path.join(__dirname, '..', 'src', 'app', 'products', '[slug]', 'page.tsx');
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Replace duration block with reordered isGeminiKBH
const targetPageDurationSection = `  const durationLabel = isSMM
    ? "Hoàn thành theo số lượng đặt mua"
    : isCodex
    ? "Bảo lưu vĩnh viễn (Dùng đến khi hết Quota)"
    : isClaude
    ? "Bảo lưu theo hạn mức Credit / Request đã chọn"
    : isChatGPTBHF
    ? "30 ngày bảo hành Full Date (BHF)"
    : isChatGPT
    ? "30 ngày sử dụng (BH đăng nhập 24H)"
    : titleLower.includes("18 tháng")
    ? "18 tháng đầy đủ (Full date)"
    : titleLower.includes("12 tháng") || titleLower.includes("1 năm")
    ? "12 tháng (1 năm) bản quyền"
    : titleLower.includes("30 ngày") || titleLower.includes("1 tháng")
    ? "30 ngày đầy đủ"
    : titleLower.includes("3 tháng")
    ? "90 ngày (3 tháng)"
    : "Theo gói dịch vụ đã chọn";

  const isSuno = slug.includes("suno") || titleLower.includes("suno");
  const isHMA = slug.includes("hma") || titleLower.includes("hma");
  const isGeminiKBH = slug.includes("gemini") && (slug.includes("family") || slug.includes("kbh") || titleLower.includes("kbh"));`;

const replacementPageDurationSection = `  const isSuno = slug.includes("suno") || titleLower.includes("suno");
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

pageContent = pageContent.replace(targetPageDurationSection, replacementPageDurationSection);
fs.writeFileSync(pagePath, pageContent, 'utf8');
console.log('✓ products/[slug]/page.tsx updated with duration');

// 3. Update seed-gemini-argon.js
const seedPath = path.join(__dirname, 'seed-gemini-argon.js');
let seedContent = fs.readFileSync(seedPath, 'utf8');
seedContent = seedContent.replace(
  /title: 'Tài Khoản Gemini Pro 5TB, Argon 4 \(Chủ Family\) - Gói Trải Nghiệm KBH'/g,
  "title: 'Tài Khoản Gemini Pro 5TB, Argon 4 Hạn 2 Năm (Chủ Family) - Gói KBH'"
);
fs.writeFileSync(seedPath, seedContent, 'utf8');
console.log('✓ seed-gemini-argon.js updated with new title');
