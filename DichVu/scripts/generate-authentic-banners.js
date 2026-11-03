const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, '../public/images/raw_logos');
const OUT_DIR = path.join(__dirname, '../public/images/products');
const ARTIFACT_DIR = 'C:\\Users\\dai99\\.gemini\\antigravity\\brain\\0fc4b675-d39d-40cc-99b8-0cb019ca6009';

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function getBase64Png(filename) {
  const file = path.join(RAW_DIR, filename);
  const data = fs.readFileSync(file);
  return `data:image/png;base64,${data.toString('base64')}`;
}

// 1. ChatGPT Plus Banner (Minimal & Punchy)
function createChatGptBanner() {
  const imgData = getBase64Png('chatgpt.png');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="gptBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#0d261e"/>
      <stop offset="60%" stop-color="#06130e"/>
      <stop offset="100%" stop-color="#020705"/>
    </radialGradient>
    <filter id="gptGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="gptAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10a37f"/>
      <stop offset="100%" stop-color="#2dd4bf"/>
    </linearGradient>
    <linearGradient id="gptCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Dark Background -->
  <rect width="1200" height="750" fill="url(#gptBg)"/>

  <!-- Ambient Glow Aura -->
  <circle cx="600" cy="280" r="260" fill="#10a37f" opacity="0.2" filter="url(#gptGlow)"/>

  <!-- Card Frame -->
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#gptCard)" stroke="#10a37f" stroke-opacity="0.3" stroke-width="1.5"/>

  <!-- Hero Logo Container -->
  <g transform="translate(600, 270)">
    <circle cx="0" cy="0" r="115" fill="#041410" stroke="url(#gptAccent)" stroke-width="2.5" filter="url(#gptGlow)"/>
    <image href="${imgData}" x="-85" y="-85" width="170" height="170" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <!-- Product Title & Key Badge Only -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <!-- Main Title -->
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      CHATGPT PLUS
    </text>

    <!-- Key Spec Pill -->
    <g transform="translate(0, 52)">
      <rect x="-190" y="-22" width="380" height="44" rx="22" fill="#10a37f" fill-opacity="0.15" stroke="#10a37f" stroke-width="1.5"/>
      <text x="0" y="7" fill="#5eead4" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="2">
        1 THÁNG • GPT-4o &amp; o1 MODEL
      </text>
    </g>
  </g>
</svg>`;
}

// 2. Microsoft 365 Banner (Minimal & Punchy)
function createOfficeBanner() {
  const imgData = getBase64Png('microsoft-365.png');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="msBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#0a1f3d"/>
      <stop offset="60%" stop-color="#050e1c"/>
      <stop offset="100%" stop-color="#02060d"/>
    </radialGradient>
    <filter id="msGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="msAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0078d4"/>
      <stop offset="100%" stop-color="#2b88d8"/>
    </linearGradient>
    <linearGradient id="msCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Dark Background -->
  <rect width="1200" height="750" fill="url(#msBg)"/>

  <!-- Ambient Glow Aura -->
  <circle cx="600" cy="280" r="260" fill="#0078d4" opacity="0.22" filter="url(#msGlow)"/>

  <!-- Card Frame -->
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#msCard)" stroke="#0078d4" stroke-opacity="0.3" stroke-width="1.5"/>

  <!-- Hero Logo Container -->
  <g transform="translate(600, 270)">
    <circle cx="0" cy="0" r="115" fill="#031124" stroke="url(#msAccent)" stroke-width="2.5" filter="url(#msGlow)"/>
    <image href="${imgData}" x="-85" y="-85" width="170" height="170" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <!-- Product Title & Key Badge Only -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <!-- Main Title -->
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      MICROSOFT 365
    </text>

    <!-- Key Spec Pill -->
    <g transform="translate(0, 52)">
      <rect x="-210" y="-22" width="420" height="44" rx="22" fill="#0078d4" fill-opacity="0.15" stroke="#0078d4" stroke-width="1.5"/>
      <text x="0" y="7" fill="#93c5fd" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="2">
        1 NĂM • 5 THIẾT BỊ • 1000GB CLOUD
      </text>
    </g>
  </g>
</svg>`;
}

// 3. Duolingo Super Banner (Minimal & Punchy)
function createDuolingoBanner() {
  const imgData = getBase64Png('duolingo.png');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="duoBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#142e08"/>
      <stop offset="60%" stop-color="#091404"/>
      <stop offset="100%" stop-color="#030801"/>
    </radialGradient>
    <filter id="duoGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="duoAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#58cc02"/>
      <stop offset="100%" stop-color="#78e61a"/>
    </linearGradient>
    <linearGradient id="duoCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Dark Background -->
  <rect width="1200" height="750" fill="url(#duoBg)"/>

  <!-- Ambient Glow Aura -->
  <circle cx="600" cy="280" r="260" fill="#58cc02" opacity="0.2" filter="url(#duoGlow)"/>

  <!-- Card Frame -->
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#duoCard)" stroke="#58cc02" stroke-opacity="0.3" stroke-width="1.5"/>

  <!-- Hero Logo Container -->
  <g transform="translate(600, 270)">
    <circle cx="0" cy="0" r="115" fill="#071703" stroke="url(#duoAccent)" stroke-width="2.5" filter="url(#duoGlow)"/>
    <image href="${imgData}" x="-90" y="-90" width="180" height="180" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <!-- Product Title & Key Badge Only -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <!-- Main Title -->
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      DUOLINGO SUPER
    </text>

    <!-- Key Spec Pill -->
    <g transform="translate(0, 52)">
      <rect x="-210" y="-22" width="420" height="44" rx="22" fill="#58cc02" fill-opacity="0.15" stroke="#58cc02" stroke-width="1.5"/>
      <text x="0" y="7" fill="#86efac" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="2">
        12 THÁNG • VÔ HẠN TRÁI TIM &amp; STREAK
      </text>
    </g>
  </g>
</svg>`;
}

// 4. CapCut Pro Banner (Minimal & Punchy)
function createCapCutBanner() {
  const imgData = getBase64Png('capcut.png');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="ccBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#12182b"/>
      <stop offset="60%" stop-color="#060914"/>
      <stop offset="100%" stop-color="#020308"/>
    </radialGradient>
    <filter id="ccGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="ccAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="100%" stop-color="#4facfe"/>
    </linearGradient>
    <linearGradient id="ccCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Dark Background -->
  <rect width="1200" height="750" fill="url(#ccBg)"/>

  <!-- Ambient Glow Aura -->
  <circle cx="600" cy="280" r="260" fill="#00f2fe" opacity="0.18" filter="url(#ccGlow)"/>

  <!-- Card Frame -->
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#ccCard)" stroke="#00f2fe" stroke-opacity="0.3" stroke-width="1.5"/>

  <!-- Hero Logo Container -->
  <g transform="translate(600, 270)">
    <circle cx="0" cy="0" r="115" fill="#040b17" stroke="url(#ccAccent)" stroke-width="2.5" filter="url(#ccGlow)"/>
    <image href="${imgData}" x="-85" y="-85" width="170" height="170" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <!-- Product Title & Key Badge Only -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <!-- Main Title -->
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      CAPCUT PRO
    </text>

    <!-- Key Spec Pill -->
    <g transform="translate(0, 52)">
      <rect x="-200" y="-22" width="400" height="44" rx="22" fill="#00f2fe" fill-opacity="0.15" stroke="#00f2fe" stroke-width="1.5"/>
      <text x="0" y="7" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="2">
        BẢN QUYỀN • XUẤT 4K 60FPS • AI VIP
      </text>
    </g>
  </g>
</svg>`;
}

// 5. Google Gemini Pro & Drive 5TB Banner (Minimal & Punchy)
function createGeminiBanner() {
  const geminiData = getBase64Png('gemini.png');
  const driveData = getBase64Png('google-drive.png');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="gemBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#150e2e"/>
      <stop offset="60%" stop-color="#080514"/>
      <stop offset="100%" stop-color="#020108"/>
    </radialGradient>
    <filter id="gemGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4285f4"/>
      <stop offset="35%" stop-color="#9b72cb"/>
      <stop offset="70%" stop-color="#d96570"/>
      <stop offset="100%" stop-color="#f2994a"/>
    </linearGradient>
    <linearGradient id="gemCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Dark Background -->
  <rect width="1200" height="750" fill="url(#gemBg)"/>

  <!-- Ambient Glow Aura -->
  <circle cx="600" cy="280" r="260" fill="#9b72cb" opacity="0.22" filter="url(#gemGlow)"/>

  <!-- Card Frame -->
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#gemCard)" stroke="#9b72cb" stroke-opacity="0.3" stroke-width="1.5"/>

  <!-- Hero Logo Container -->
  <g transform="translate(600, 270)">
    <circle cx="0" cy="0" r="115" fill="#090517" stroke="url(#gemGrad)" stroke-width="2.5" filter="url(#gemGlow)"/>
    <image href="${geminiData}" x="-85" y="-85" width="170" height="170" preserveAspectRatio="xMidYMid meet"/>
    <!-- Drive Satellite Icon -->
    <g transform="translate(100, 48)">
      <circle cx="0" cy="0" r="34" fill="#090517" stroke="#ffffff" stroke-width="2"/>
      <image href="${driveData}" x="-23" y="-23" width="46" height="46" preserveAspectRatio="xMidYMid meet"/>
    </g>
  </g>

  <!-- Product Title & Key Badge Only -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <!-- Main Title -->
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="900" letter-spacing="1.5">
      GEMINI PRO &amp; DRIVE 5TB
    </text>

    <!-- Key Spec Pill -->
    <g transform="translate(0, 52)">
      <rect x="-220" y="-22" width="440" height="44" rx="22" fill="#9b72cb" fill-opacity="0.18" stroke="url(#gemGrad)" stroke-width="1.5"/>
      <text x="0" y="7" fill="#e9d5ff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="2">
        18 THÁNG CHÍNH CHỦ • 5000GB CLOUD
      </text>
    </g>
  </g>
</svg>`;
}

// 6. Canva Pro Banner (Minimal & Punchy)
function createCanvaBanner() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="canvaBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#091b2c"/>
      <stop offset="60%" stop-color="#040b14"/>
      <stop offset="100%" stop-color="#010408"/>
    </radialGradient>
    <filter id="canvaGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="canvaAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00c4cc"/>
      <stop offset="50%" stop-color="#7d2ae8"/>
      <stop offset="100%" stop-color="#ff007a"/>
    </linearGradient>
    <linearGradient id="canvaCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Dark Background -->
  <rect width="1200" height="750" fill="url(#canvaBg)"/>

  <!-- Ambient Glow Aura -->
  <circle cx="600" cy="280" r="260" fill="#00c4cc" opacity="0.18" filter="url(#canvaGlow)"/>

  <!-- Card Frame -->
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#canvaCard)" stroke="#00c4cc" stroke-opacity="0.3" stroke-width="1.5"/>

  <!-- Hero Logo Container -->
  <g transform="translate(600, 270)">
    <circle cx="0" cy="0" r="115" fill="#040c17" stroke="url(#canvaAccent)" stroke-width="2.5" filter="url(#canvaGlow)"/>
    <circle cx="0" cy="0" r="82" fill="#ffffff"/>
    <g transform="translate(-82, -82) scale(6.83)">
      <path fill="url(#canvaAccent)" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM6.962 7.68c.754 0 1.337.549 1.405 1.2.069.583-.171 1.097-.822 1.406-.343.171-.48.172-.549.069-.034-.069 0-.137.069-.206.617-.514.617-.926.548-1.508-.034-.378-.308-.618-.583-.618-1.2 0-2.914 2.674-2.674 4.629.103.754.549 1.646 1.509 1.646.308 0 .65-.103.96-.24.5-.264.799-.47 1.097-.8-.073-.885.704-2.046 1.851-2.046.515 0 .926.205.96.583.068.514-.377.582-.514.582s-.378-.034-.378-.17c-.034-.138.309-.07.275-.378-.035-.206-.24-.274-.446-.274-.72 0-1.131.994-1.029 1.611.035.275.172.549.447.549.205 0 .514-.31.617-.755.068-.308.343-.514.583-.514.102 0 .17.034.205.171v.138c-.034.137-.137.548-.102.651 0 .069.034.171.17.171.092 0 .436-.18.777-.459.117-.59.253-1.298.253-1.357.034-.24.137-.48.617-.48.103 0 .171.034.205.171v.138l-.136.617c.445-.583 1.097-.994 1.508-.994.172 0 .309.102.309.274 0 .103 0 .274-.069.446-.137.377-.309.96-.412 1.474 0 .137.035.274.207.274.171 0 .685-.206 1.096-.754l.007-.004c-.002-.068-.007-.134-.007-.202 0-.411.035-.754.104-.994.068-.274.411-.514.617-.514.103 0 .205.069.205.171 0 .035 0 .103-.034.137-.137.446-.24.857-.24 1.269 0 .24.034.582.102.788 0 .034.035.069.07.069.068 0 .548-.445.89-1.028-.308-.206-.48-.549-.48-.96 0-.72.446-1.097.858-1.097.343 0 .617.24.617.72 0 .308-.103.65-.274.96h.102a.77.77 0 0 0 .584-.24.293.293 0 0 1 .134-.117c.335-.425.83-.74 1.41-.74.48 0 .924.205.959.582.068.515-.378.618-.515.618l-.002-.002c-.138 0-.377-.035-.377-.172 0-.137.309-.068.274-.376-.034-.206-.24-.275-.446-.275-.686 0-1.13.891-1.028 1.611.034.275.171.583.445.583.206 0 .515-.308.652-.754.068-.274.343-.514.583-.514.103 0 .17.034.205.171 0 .069 0 .206-.137.652-.17.308-.171.48-.137.617.034.274.171.48.309.583.034.034.068.102.068.102 0 .069-.034.138-.137.138-.034 0-.068 0-.103-.035-.514-.205-.72-.548-.789-.891-.205.24-.445.377-.72.377-.445 0-.89-.411-.96-.926a1.609 1.609 0 0 1 .075-.649c-.203.13-.422.203-.623.203h-.17c-.447.652-.927 1.098-1.27 1.303a.896.896 0 0 1-.377.104c-.068 0-.171-.035-.205-.104-.095-.152-.156-.392-.193-.667-.481.527-1.145.805-1.453.805-.343 0-.548-.206-.582-.55v-.376c.102-.754.377-1.2.377-1.337a.074.074 0 0 0-.069-.07c-.24 0-1.028.824-1.166 1.373l-.103.445c-.068.309-.377.515-.582.515-.103 0-.172-.035-.206-.172v-.137l.046-.233c-.435.31-.87.508-1.075.508-.308 0-.48-.172-.514-.412-.206.274-.445.412-.754.412-.352 0-.696-.24-.862-.593-.244.275-.523.553-.852.764-.48.309-1.028.549-1.68.549-.582 0-1.097-.309-1.371-.583-.412-.377-.651-.96-.686-1.509-.205-1.68.823-3.84 2.4-4.8.378-.205.755-.343 1.132-.343zm9.77 3.291c-.104 0-.172.172-.172.343 0 .274.137.583.309.755a1.74 1.74 0 0 0 .102-.583c0-.343-.137-.515-.24-.515z"/>
    </g>
  </g>

  <!-- Product Title & Key Badge Only -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <!-- Main Title -->
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      CANVA PRO
    </text>

    <!-- Key Spec Pill -->
    <g transform="translate(0, 52)">
      <rect x="-210" y="-22" width="420" height="44" rx="22" fill="#00c4cc" fill-opacity="0.15" stroke="url(#canvaAccent)" stroke-width="1.5"/>
      <text x="0" y="7" fill="#38bdf8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="2">
        BẢN QUYỀN • KHÔNG GIỚI HẠN • 1TB
      </text>
    </g>
  </g>
</svg>`;
}

// 7. NordVPN Banner (Minimal & Punchy)
function createNordVpnBanner() {
  const imgData = getBase64Png('nordvpn.png');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 750" width="1200" height="750">
  <defs>
    <radialGradient id="nordBg" cx="50%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#0a1d36"/>
      <stop offset="60%" stop-color="#040d1a"/>
      <stop offset="100%" stop-color="#01050a"/>
    </radialGradient>
    <filter id="nordGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="40" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <linearGradient id="nordAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4687ff"/>
      <stop offset="100%" stop-color="#60a5fa"/>
    </linearGradient>
    <linearGradient id="nordCard" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
  </defs>

  <!-- Dark Background -->
  <rect width="1200" height="750" fill="url(#nordBg)"/>

  <!-- Ambient Glow Aura -->
  <circle cx="600" cy="280" r="260" fill="#4687ff" opacity="0.2" filter="url(#nordGlow)"/>

  <!-- Card Frame -->
  <rect x="220" y="75" width="760" height="600" rx="36" fill="url(#nordCard)" stroke="#4687ff" stroke-opacity="0.3" stroke-width="1.5"/>

  <!-- Hero Logo Container -->
  <g transform="translate(600, 270)">
    <circle cx="0" cy="0" r="115" fill="#030e1c" stroke="url(#nordAccent)" stroke-width="2.5" filter="url(#nordGlow)"/>
    <image href="${imgData}" x="-85" y="-85" width="170" height="170" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <!-- Product Title & Key Badge Only -->
  <g transform="translate(600, 480)" text-anchor="middle">
    <!-- Main Title -->
    <text x="0" y="0" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="2">
      NORDVPN
    </text>

    <!-- Key Spec Pill -->
    <g transform="translate(0, 52)">
      <rect x="-210" y="-22" width="420" height="44" rx="22" fill="#4687ff" fill-opacity="0.15" stroke="#4687ff" stroke-width="1.5"/>
      <text x="0" y="7" fill="#93c5fd" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="800" letter-spacing="2">
        BẢN QUYỀN 1 NĂM • BẢO VỆ 6 THIẾT BỊ
      </text>
    </g>
  </g>
</svg>`;
}

const banners = [
  { file: 'chatgpt-plus.svg', generate: createChatGptBanner },
  { file: 'microsoft-365.svg', generate: createOfficeBanner },
  { file: 'duolingo-super.svg', generate: createDuolingoBanner },
  { file: 'capcut-pro.svg', generate: createCapCutBanner },
  { file: 'gemini-pro.svg', generate: createGeminiBanner },
  { file: 'canva-pro.svg', generate: createCanvaBanner },
  { file: 'nordvpn.svg', generate: createNordVpnBanner }
];

banners.forEach(b => {
  const content = b.generate();
  const outPath = path.join(OUT_DIR, b.file);
  const artifactPath = path.join(ARTIFACT_DIR, b.file);
  fs.writeFileSync(outPath, content, 'utf8');
  fs.writeFileSync(artifactPath, content, 'utf8');
  console.log(`Generated minimal banner: ${b.file} (${content.length} chars)`);
});
