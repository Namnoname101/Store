const fs = require('fs');

const officialSvg = fs.readFileSync('adobe_express_official.svg', 'utf8');
// Clean up xml declaration and doctype if present
const cleanOfficial = officialSvg
  .replace(/<\?xml[^>]*\?>/g, '')
  .replace(/<!DOCTYPE[^>]*>/g, '')
  .trim();

const productBanner = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="aeBg" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#2a082e"/>
      <stop offset="55%" stop-color="#140417"/>
      <stop offset="100%" stop-color="#060108"/>
    </radialGradient>
    <filter id="aeGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="aeCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="aeGradBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7B2CBF"/>
      <stop offset="32%" stop-color="#C72C81"/>
      <stop offset="68%" stop-color="#FF5400"/>
      <stop offset="100%" stop-color="#FFBD00"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="750" fill="url(#aeBg)"/>
  <circle cx="600" cy="260" r="270" fill="#C72C81" opacity="0.25" filter="url(#aeGlow)"/>
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#aeCard)" stroke="#C72C81" stroke-opacity="0.38" stroke-width="1.5"/>

  <!-- Top Pill Badges -->
  <g transform="translate(256, 115)">
    <rect width="145" height="36" rx="18" fill="#ffffff" fill-opacity="0.07" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
    <circle cx="24" cy="18" r="6" fill="#C72C81"/>
    <text x="38" y="23" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700">Tài khoản</text>
  </g>
  <g transform="translate(865, 115)">
    <rect width="80" height="36" rx="18" fill="#FA0F00" fill-opacity="0.15" stroke="#FA0F00" stroke-opacity="0.35" stroke-width="1"/>
    <text x="40" y="23" fill="#ff6b6b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" text-anchor="middle">-97%</text>
  </g>

  <!-- ================= AUTHENTIC OFFICIAL ADOBE EXPRESS LOGO ================= -->
  <g transform="translate(490, 150)">
    <!-- App Outer Glow & Frame -->
    <rect x="-10" y="-10" width="240" height="234" rx="46" fill="none" stroke="url(#aeGradBorder)" stroke-width="3" filter="url(#aeGlow)"/>
    
    <!-- Official Adobe Express Asset from Wikimedia / Adobe Systems -->
    <svg x="0" y="0" width="220" height="214.5" viewBox="0 0 240 234">
      ${cleanOfficial.replace(/<svg[^>]*>/, '').replace(/<\/svg>$/, '')}
    </svg>

    <!-- Mini Official Adobe 'A' Stamp Badge on Corner -->
    <g transform="translate(180, -12)">
      <rect width="32" height="32" rx="7" fill="#FA0F00" stroke="#ffffff" stroke-width="1.5"/>
      <path d="M48.787,88.855h19.82c-0.09,0.105,8.617,20.771,8.617,20.967h18.385 c0.025,0.055-28.025-63.931-28.151-64.057C67.736,45.55,48.967,88.908,48.787,88.855z M7.71,6.471 C7.755,6.398,7.854,109.536,7.854,109.68C7.997,109.814,50.923,6.444,50.798,6.471H7.71z M83.599,6.471 c0,0,44.55,103.595,44.522,103.263c0,0.144,0.03-103.003,0.03-103.263H83.599z" fill="#FFFFFF" transform="translate(5, 5) scale(0.18)"/>
    </g>
  </g>
  <!-- ================= END ADOBE EXPRESS LOGO ================= -->

  <!-- Duration Badge (Bottom Left) -->
  <g transform="translate(256, 420)">
    <rect width="135" height="40" rx="20" fill="#f59e0b" fill-opacity="0.12" stroke="#f59e0b" stroke-opacity="0.4" stroke-width="1.5"/>
    <circle cx="24" cy="20" r="8" fill="none" stroke="#f59e0b" stroke-width="1.5"/>
    <path d="M24 16 v4 l3 2" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/>
    <text x="42" y="25" fill="#fbbf24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800">1 NĂM</text>
  </g>

  <!-- Titles -->
  <g transform="translate(600, 500)" text-anchor="middle">
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900" letter-spacing="2">
      ADOBE EXPRESS 12 THÁNG
    </text>
    <g transform="translate(0, 52)">
      <rect x="-310" y="-22" width="620" height="44" rx="22" fill="#C72C81" fill-opacity="0.18" stroke="#FF5400" stroke-width="1.5"/>
      <text x="0" y="7" fill="#ffb0d5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="700" letter-spacing="1">
        BẢN QUYỀN 1 NĂM • TẠO ẢNH FIREFLY AI • XÓA PHÔNG 4K
      </text>
    </g>
  </g>
</svg>`;

fs.writeFileSync('DichVu/public/images/products/adobe-express.svg', productBanner);
console.log('Successfully generated authentic DichVu/public/images/products/adobe-express.svg!');
