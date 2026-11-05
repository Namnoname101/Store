const fs = require("fs");
const path = require("path");

const productsDir = path.join(__dirname, "../public/images/products");
if (!fs.existsSync(productsDir)) {
  fs.mkdirSync(productsDir, { recursive: true });
}

// 1. Netflix Premium 4K
const netflixSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="netBg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#240507"/>
      <stop offset="60%" stop-color="#100203"/>
      <stop offset="100%" stop-color="#050102"/>
    </radialGradient>
    <filter id="netGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="netRed" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff1a2b"/>
      <stop offset="100%" stop-color="#b80611"/>
    </linearGradient>
    <linearGradient id="netCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#netBg)"/>
  <circle cx="600" cy="270" r="260" fill="#E50914" opacity="0.2" filter="url(#netGlow)"/>
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#netCard)" stroke="#E50914" stroke-opacity="0.35" stroke-width="1.5"/>

  <!-- Netflix 'N' Icon -->
  <g transform="translate(600, 260)">
    <circle cx="0" cy="0" r="115" fill="#140203" stroke="url(#netRed)" stroke-width="2.5" filter="url(#netGlow)"/>
    <g transform="translate(-40, -65)">
      <!-- Left pillar -->
      <path d="M0 0 H25 V130 H0 Z" fill="#B81D24"/>
      <!-- Right pillar -->
      <path d="M55 0 H80 V130 H55 Z" fill="#B81D24"/>
      <!-- Diagonal banner ribbon -->
      <path d="M0 0 H25 L80 130 H55 Z" fill="#E50914" filter="drop-shadow(0 0 10px rgba(0,0,0,0.7))"/>
    </g>
  </g>

  <!-- Titles -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      NETFLIX 4K HDR
    </text>
    <g transform="translate(0, 52)">
      <rect x="-240" y="-22" width="480" height="44" rx="22" fill="#E50914" fill-opacity="0.18" stroke="#E50914" stroke-width="1.5"/>
      <text x="0" y="7" fill="#ff4d5a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="1">
        PREMIUM 4K UHD • SLOT RIÊNG 1 THÁNG
      </text>
    </g>
  </g>
</svg>`;

// 2. Wink VIP+
const winkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="winkBg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#2c0926"/>
      <stop offset="60%" stop-color="#130310"/>
      <stop offset="100%" stop-color="#070106"/>
    </radialGradient>
    <filter id="winkGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="winkAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff3388"/>
      <stop offset="50%" stop-color="#ba38f5"/>
      <stop offset="100%" stop-color="#ff66cc"/>
    </linearGradient>
    <linearGradient id="winkCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#winkBg)"/>
  <circle cx="600" cy="270" r="260" fill="#ba38f5" opacity="0.2" filter="url(#winkGlow)"/>
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#winkCard)" stroke="#ba38f5" stroke-opacity="0.35" stroke-width="1.5"/>

  <!-- Magic Sparkle Wand Icon -->
  <g transform="translate(600, 260)">
    <circle cx="0" cy="0" r="115" fill="#180415" stroke="url(#winkAccent)" stroke-width="2.5" filter="url(#winkGlow)"/>
    <g transform="translate(-45, -45) scale(3.8)" stroke="url(#winkAccent)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </g>
  </g>

  <!-- Titles -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      WINK VIP+
    </text>
    <g transform="translate(0, 52)">
      <rect x="-240" y="-22" width="480" height="44" rx="22" fill="#ba38f5" fill-opacity="0.18" stroke="#ba38f5" stroke-width="1.5"/>
      <text x="0" y="7" fill="#ff70e1" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="1">
        LÀM NÉT VIDEO AI • GÓI RIÊNG TƯ 7 NGÀY
      </text>
    </g>
  </g>
</svg>`;

// 3. Kling AI
const klingSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="klingBg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#051f2b"/>
      <stop offset="60%" stop-color="#020e14"/>
      <stop offset="100%" stop-color="#010408"/>
    </radialGradient>
    <filter id="klingGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="klingAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="100%" stop-color="#4facfe"/>
    </linearGradient>
    <linearGradient id="klingCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#klingBg)"/>
  <circle cx="600" cy="270" r="260" fill="#00f2fe" opacity="0.18" filter="url(#klingGlow)"/>
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#klingCard)" stroke="#00f2fe" stroke-opacity="0.35" stroke-width="1.5"/>

  <!-- Video Clapper / AI Film Icon -->
  <g transform="translate(600, 260)">
    <circle cx="0" cy="0" r="115" fill="#03121a" stroke="url(#klingAccent)" stroke-width="2.5" filter="url(#klingGlow)"/>
    <g transform="translate(-48, -48) scale(4)" stroke="url(#klingAccent)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect width="20" height="15" x="2" y="7" rx="2"/>
      <polygon points="10 11 15 14.5 10 18 10 11" fill="url(#klingAccent)" stroke="none"/>
      <path d="m4 7 3-4h10l3 4"/>
      <path d="m9 3 2 4"/>
      <path d="m14 3 2 4"/>
    </g>
  </g>

  <!-- Titles -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      KLING AI VIDEO
    </text>
    <g transform="translate(0, 52)">
      <rect x="-240" y="-22" width="480" height="44" rx="22" fill="#00f2fe" fill-opacity="0.15" stroke="url(#klingAccent)" stroke-width="1.5"/>
      <text x="0" y="7" fill="#38efff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="1">
        66 CREDITS • AI TEXT-TO-VIDEO ĐỈNH CAO
      </text>
    </g>
  </g>
</svg>`;

// 4. Zoom Pro
const zoomSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="zoomBg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#061838"/>
      <stop offset="60%" stop-color="#020b1c"/>
      <stop offset="100%" stop-color="#01040a"/>
    </radialGradient>
    <filter id="zoomGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="zoomAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D8CFF"/>
      <stop offset="100%" stop-color="#0B5CFF"/>
    </linearGradient>
    <linearGradient id="zoomCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#zoomBg)"/>
  <circle cx="600" cy="270" r="260" fill="#2D8CFF" opacity="0.2" filter="url(#zoomGlow)"/>
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#zoomCard)" stroke="#2D8CFF" stroke-opacity="0.35" stroke-width="1.5"/>

  <!-- Zoom Camera Icon -->
  <g transform="translate(600, 260)">
    <circle cx="0" cy="0" r="115" fill="#030d21" stroke="url(#zoomAccent)" stroke-width="2.5" filter="url(#zoomGlow)"/>
    <g transform="translate(-50, -35)">
      <rect x="0" y="0" width="65" height="68" rx="16" fill="#2D8CFF"/>
      <polygon points="65 18 100 0 100 68 65 50" fill="#2D8CFF"/>
    </g>
  </g>

  <!-- Titles -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      ZOOM PRO
    </text>
    <g transform="translate(0, 52)">
      <rect x="-240" y="-22" width="480" height="44" rx="22" fill="#2D8CFF" fill-opacity="0.18" stroke="#2D8CFF" stroke-width="1.5"/>
      <text x="0" y="7" fill="#66aaff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="1">
        HỌP KHÔNG GIỚI HẠN • GÓI 1 THÁNG
      </text>
    </g>
  </g>
</svg>`;

// 5. Figma Pro Edu
const figmaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="figBg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#180f26"/>
      <stop offset="60%" stop-color="#0a0512"/>
      <stop offset="100%" stop-color="#030105"/>
    </radialGradient>
    <filter id="figGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="figCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#figBg)"/>
  <circle cx="600" cy="270" r="260" fill="#A259FF" opacity="0.2" filter="url(#figGlow)"/>
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#figCard)" stroke="#A259FF" stroke-opacity="0.35" stroke-width="1.5"/>

  <!-- Figma 5-Piece Official Logo -->
  <g transform="translate(600, 260)">
    <circle cx="0" cy="0" r="115" fill="#0d0617" stroke="#A259FF" stroke-width="2.5" filter="url(#figGlow)"/>
    <g transform="translate(-36, -55) scale(0.9)">
      <!-- Row 1: Orange Left, Red Right -->
      <path d="M0 0 H40 V40 H20 A20 20 0 0 1 0 20 Z" fill="#F24E1E"/>
      <path d="M40 0 H60 A20 20 0 0 1 80 20 A20 20 0 0 1 60 40 H40 Z" fill="#FF7262"/>
      <!-- Row 2: Purple Left, Cyan Right -->
      <path d="M0 40 H40 V80 H20 A20 20 0 0 1 0 60 Z" fill="#A259FF"/>
      <circle cx="60" cy="60" r="20" fill="#1ABCFE"/>
      <!-- Row 3: Green Teardrop -->
      <path d="M0 80 H40 V100 A20 20 0 0 1 20 120 A20 20 0 0 1 0 100 Z" fill="#0ACF83"/>
    </g>
  </g>

  <!-- Titles -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      FIGMA PRO EDU
    </text>
    <g transform="translate(0, 52)">
      <rect x="-240" y="-22" width="480" height="44" rx="22" fill="#A259FF" fill-opacity="0.18" stroke="#A259FF" stroke-width="1.5"/>
      <text x="0" y="7" fill="#d29eff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="1">
        FULL MAKE &amp; AI • BẢN QUYỀN 2 NĂM
      </text>
    </g>
  </g>
</svg>`;

// 6. Muse AI
const museSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="museBg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#14082e"/>
      <stop offset="60%" stop-color="#090317"/>
      <stop offset="100%" stop-color="#020007"/>
    </radialGradient>
    <filter id="museGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="museAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8a2be2"/>
      <stop offset="50%" stop-color="#00e5ff"/>
      <stop offset="100%" stop-color="#7928ca"/>
    </linearGradient>
    <linearGradient id="museCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <rect width="1200" height="750" fill="url(#museBg)"/>
  <circle cx="600" cy="270" r="260" fill="#00e5ff" opacity="0.18" filter="url(#museGlow)"/>
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#museCard)" stroke="#00e5ff" stroke-opacity="0.35" stroke-width="1.5"/>

  <!-- Neural Orbit / Muse Token Icon -->
  <g transform="translate(600, 260)">
    <circle cx="0" cy="0" r="115" fill="#080314" stroke="url(#museAccent)" stroke-width="2.5" filter="url(#museGlow)"/>
    <g transform="translate(-48, -48) scale(4)" stroke="url(#museAccent)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 3a9 9 0 0 1 9 9"/>
      <circle cx="12" cy="12" r="3" fill="url(#museAccent)"/>
      <path d="m4.93 4.93 4.24 4.24"/>
      <path d="m14.83 14.83 4.24 4.24"/>
    </g>
  </g>

  <!-- Titles -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      MUSE AI TOKEN
    </text>
    <g transform="translate(0, 52)">
      <rect x="-240" y="-22" width="480" height="44" rx="22" fill="#00e5ff" fill-opacity="0.15" stroke="url(#museAccent)" stroke-width="1.5"/>
      <text x="0" y="7" fill="#6bf0ff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="700" letter-spacing="1">
        31 TỶ TOKEN • VĨNH VIỄN KHÔNG HẾT HẠN
      </text>
    </g>
  </g>
</svg>`;

const files = [
  { name: "netflix-4k.svg", content: netflixSvg },
  { name: "wink-vip.svg", content: winkSvg },
  { name: "kling-ai.svg", content: klingSvg },
  { name: "zoom-pro.svg", content: zoomSvg },
  { name: "figma-pro.svg", content: figmaSvg },
  { name: "muse-ai.svg", content: museSvg }
];

for (const file of files) {
  const target = path.join(productsDir, file.name);
  fs.writeFileSync(target, file.content, "utf-8");
  console.log(`Created SVG: ${file.name}`);
}

console.log("All 6 product SVGs generated successfully!");
