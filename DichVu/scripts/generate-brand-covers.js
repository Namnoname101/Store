const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../public/images/brands');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function createSvg(bgGrad, glowColor, iconSvg, title, subtitle) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGrad[0]}" />
      <stop offset="100%" stop-color="${bgGrad[1]}" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="45%" r="45%">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1" stroke-opacity="0.03" />
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="800" height="500" fill="url(#bg)" />
  <rect width="800" height="500" fill="url(#grid)" />
  <circle cx="400" cy="220" r="280" fill="url(#glow)" />

  <!-- Center Emblem Container -->
  <g transform="translate(400, 210)">
    <!-- Ambient Ring -->
    <circle cx="0" cy="0" r="85" fill="#18181b" fill-opacity="0.7" stroke="#27272a" stroke-width="1.5" />
    <circle cx="0" cy="0" r="75" fill="#09090b" fill-opacity="0.9" stroke="${glowColor}" stroke-width="1" stroke-opacity="0.4" />
    
    <!-- Icon -->
    <g transform="translate(-40, -40) scale(3.33)">
      ${iconSvg}
    </g>
  </g>

  <!-- Text Badges -->
  <g transform="translate(400, 385)" text-anchor="middle">
    <!-- Brand Title -->
    <text font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#ffffff" letter-spacing="1">${title}</text>
    
    <!-- Subtitle Pill -->
    <g transform="translate(0, 32)">
      <text font-family="'JetBrains Mono', monospace, sans-serif" font-size="12" font-weight="600" fill="${glowColor}" letter-spacing="1.5">${subtitle}</text>
    </g>
  </g>
</svg>`;
}

const BRANDS = {
  netflix: {
    bg: ['#0f0d10', '#050505'],
    glow: '#e50914',
    icon: `<path d="M4 2h4.5l5.5 14.5V2H18v20h-4.5L8 7.5V22H4V2z" fill="#e50914" />`,
    title: 'NETFLIX',
    subtitle: 'PREMIUM 4K UHD • CHÍNH CHỦ'
  },
  claude: {
    bg: ['#1c140e', '#0a0806'],
    glow: '#f97316',
    icon: `<path d="M13.8 2.5h-3.6l-6 19h4.3l1.4-4.5h4.2l1.4 4.5h4.3l-6-19zm-3.1 11.2l1.3-4.4 1.3 4.4h-2.6z" fill="#f97316" />`,
    title: 'CLAUDE AI',
    subtitle: 'ANTHROPIC 3.5 SONNET • API'
  },
  cursor: {
    bg: ['#08121e', '#03070d'],
    glow: '#06b6d4',
    icon: `<g stroke="#06b6d4" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="12 2 2 8 12 14 22 8 12 2" fill="#06b6d4" fill-opacity="0.25" />
      <polyline points="2 8 2 16 12 22 22 16 22 8" />
      <line x1="12" y1="14" x2="12" y2="22" />
    </g>`,
    title: 'CURSOR AI',
    subtitle: 'PRO & BUSINESS • AUTO-COMPLETE'
  },
  codex: {
    bg: ['#061510', '#020906'],
    glow: '#10b981',
    icon: `<g stroke="#10b981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14" y1="4" x2="10" y2="20" />
    </g>`,
    title: 'CODEX CREDIT',
    subtitle: 'API USAGE & REAL-TIME LOGS'
  },
  chatgpt: {
    bg: ['#081714', '#020a08'],
    glow: '#10a37f',
    icon: `<path d="M20.5 12.3c-.2-1.3-.9-2.4-2-3.1.2-.8.1-1.7-.3-2.4-.6-1.1-1.7-1.7-2.9-1.7-.5 0-1 .1-1.5.4C13 4.6 11.8 4 10.5 4c-1.8 0-3.3 1.2-3.8 2.9-.8.2-1.6.7-2.1 1.4-.8 1.1-.9 2.5-.4 3.7-1 .6-1.7 1.7-1.7 2.9 0 1.5.9 2.8 2.2 3.4-.1.8 0 1.7.5 2.4.6 1.1 1.7 1.7 2.9 1.7.5 0 1-.1 1.5-.4.8.9 2 1.5 3.3 1.5 1.8 0 3.3-1.2 3.8-2.9.8-.2 1.6-.7 2.1-1.4.8-1.1.9-2.5.4-3.7 1-.6 1.8-1.7 1.8-2.9 0-.1 0-.3-.1-.6z" stroke="#10a37f" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" stroke="#10a37f" stroke-width="1.8" fill="none" />`,
    title: 'CHATGPT PLUS',
    subtitle: 'OPENAI GPT-4O • CANVAS & DALLE-3'
  },
  deepseek: {
    bg: ['#081024', '#020612'],
    glow: '#3b82f6',
    icon: `<path d="M4 14.5c2-4 7-8.5 14-8.5-1 4.5-4 9-9 11-3 1.2-5.5-.5-5-2.5z" fill="#3b82f6" />
    <circle cx="16" cy="8" r="1.5" fill="#60a5fa" />`,
    title: 'DEEPSEEK',
    subtitle: 'V3 & R1 REASONING • HIGH SPEED'
  },
  gemini: {
    bg: ['#130e24', '#05030d'],
    glow: '#a855f7',
    icon: `<path d="M12 2c.2 4.6 2.6 7 7.2 7.2-4.6.2-7 2.6-7.2 7.2-.2-4.6-2.6-7-7.2-7.2 4.6-.2 7-2.6 7.2-7.2z" fill="#a855f7" />
    <path d="M18.5 15.5c.1 2 .9 2.8 2.9 2.9-2 .1-2.8.9-2.9 2.9-.1-2-.9-2.8-2.9-2.9 2-.1 2.8-.9 2.9-2.9z" fill="#c084fc" />`,
    title: 'GEMINI ADVANCED',
    subtitle: 'GOOGLE 2.0 FLASH • 2M CONTEXT'
  },
  capcut: {
    bg: ['#141416', '#08080a'],
    glow: '#00f2fe',
    icon: `<path d="M4 6.5L12 11 20 6.5 12 2 4 6.5zm0 11L12 22l8-4.5-8-4.5-8 4.5z" fill="#00f2fe" />`,
    title: 'CAPCUT PRO',
    subtitle: '4K EXPORT • AI SUBTITLES & FILTERS'
  },
  canva: {
    bg: ['#0d1424', '#040710'],
    glow: '#00c4cc',
    icon: `<circle cx="12" cy="12" r="9" stroke="#00c4cc" stroke-width="2.2" fill="none" stroke-linecap="round" />
    <path d="M15 9.5a4 4 0 1 0 0 5" stroke="#00c4cc" stroke-width="2.2" fill="none" stroke-linecap="round" />`,
    title: 'CANVA PRO',
    subtitle: 'THIẾT KẾ ĐỒ HỌA • KHÔNG GIỚI HẠN'
  },
  microsoft: {
    bg: ['#141416', '#060608'],
    glow: '#00a4ef',
    icon: `<g>
      <rect x="3" y="3" width="8.5" height="8.5" rx="1" fill="#f25022" />
      <rect x="12.5" y="3" width="8.5" height="8.5" rx="1" fill="#7fba00" />
      <rect x="3" y="12.5" width="8.5" height="8.5" rx="1" fill="#00a4ef" />
      <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="1" fill="#ffb900" />
    </g>`,
    title: 'MICROSOFT 365',
    subtitle: 'OFFICE APPS • 1TB ONEDRIVE CLOUD'
  },
  locket: {
    bg: ['#1a1408', '#080502'],
    glow: '#f59e0b',
    icon: `<g stroke="#f59e0b" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="8" width="18" height="13" rx="3" fill="#f59e0b" fill-opacity="0.2" />
      <path d="M7 8V6a5 5 0 0 1 10 0v2" />
      <path d="M12 13v3" />
    </g>`,
    title: 'LOCKET GOLD',
    subtitle: 'FULL HUY HIỆU • MỞ KHÓA TÍNH NĂNG'
  },
  spotify: {
    bg: ['#06180e', '#020804'],
    glow: '#1ed760',
    icon: `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.6 14.4c-.2.3-.5.4-.8.2-2.3-1.4-5.2-1.7-8.6-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.7-.8 6.9-.5 9.5 1.1.3.2.4.5.3.8zm1.2-2.7c-.2.4-.7.5-1.1.2-2.6-1.6-6.6-2.1-9.7-1.1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.5-1.1 7.9-.5 10.9 1.3.4.3.5.7.4 1.1zm.1-2.8C14.7 9 8.7 8.8 5.3 9.8c-.5.2-1.1-.1-1.2-.7-.2-.5.1-1.1.7-1.2 4-1.2 10.6-1 14.4 1.3.5.3.6.9.3 1.4-.3.5-.9.6-1.6.3z" fill="#1ed760" />`,
    title: 'SPOTIFY PREMIUM',
    subtitle: 'LOSSLESS • KHÔNG QUẢNG CÁO'
  },
  youtube: {
    bg: ['#1c0c0e', '#080304'],
    glow: '#ff0000',
    icon: `<path d="M23.5 6.2c-.3-1-.9-1.8-1.9-2.1C19.9 3.5 12 3.5 12 3.5s-7.9 0-9.6.6c-1 .3-1.6 1.1-1.9 2.1C0 7.9 0 12 0 12s0 4.1.5 5.8c.3 1 .9 1.8 1.9 2.1 1.7.6 9.6.6 9.6.6s7.9 0 9.6-.6c1-.3 1.6-1.1 1.9-2.1.5-1.7.5-5.8.5-5.8s0-4.1-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z" fill="#ff0000" />`,
    title: 'YOUTUBE PREMIUM',
    subtitle: 'NGHE NHẠC TẮT MÀN HÌNH • 4K'
  },
  tiktok: {
    bg: ['#121016', '#050408'],
    glow: '#00f2fe',
    icon: `<path d="M19.5 7.4c-1.4-.1-2.6-.7-3.5-1.7V15c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.3 0 .7 0 1 .1v3.2c-.3-.1-.7-.1-1-.1-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3V2h3.3c.3 2 1.8 3.6 3.8 3.9v1.5z" fill="#00f2fe" />`,
    title: 'TIKTOK',
    subtitle: 'FOLLOW • LIKE • VIEW TỰ ĐỘNG'
  },
  facebook: {
    bg: ['#0a1224', '#030610'],
    glow: '#1877f2',
    icon: `<path d="M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.3c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.8V12h3.4l-.5 3.5h-2.9v8.4C19.6 23 24 18 24 12z" fill="#1877f2" />`,
    title: 'FACEBOOK',
    subtitle: 'SUB VIP • TĂNG TƯƠNG TÁC PROFILE'
  },
  duolingo: {
    bg: ['#0f1c08', '#040902'],
    glow: '#58cc02',
    icon: `<path d="M12 2C7 2 3 6 3 11c0 3.5 2 6.5 5 8v3h8v-3c3-1.5 5-4.5 5-8 0-5-4-9-9-9zm-3 10c-.8 0-1.5-.7-1.5-1.5S8.2 9 9 9s1.5.7 1.5 1.5S9.8 12 9 12zm6 0c-.8 0-1.5-.7-1.5-1.5S14.2 9 15 9s1.5.7 1.5 1.5S15.8 12 15 12z" fill="#58cc02" />`,
    title: 'DUOLINGO SUPER',
    subtitle: 'VÔ HẠN TRÁI TIM • LUYỆN NÓI AI'
  },
  nordvpn: {
    bg: ['#09152b', '#020712'],
    glow: '#4687ff',
    icon: `<path d="M12 2L2 22h20L12 2zm0 5l6.5 13h-13L12 7z" fill="#4687ff" />`,
    title: 'NORDVPN',
    subtitle: 'BẢO MẬT TỐC ĐỘ CAO • FAKE IP'
  },
  default: {
    bg: ['#18181b', '#09090b'],
    glow: '#71717a',
    icon: `<rect x="2" y="3" width="20" height="14" rx="2" stroke="#a1a1aa" stroke-width="2" fill="none" />
    <line x1="8" y1="21" x2="16" y2="21" stroke="#a1a1aa" stroke-width="2" />
    <line x1="12" y1="17" x2="12" y2="21" stroke="#a1a1aa" stroke-width="2" />`,
    title: 'BẢN QUYỀN SỐ',
    subtitle: 'CẤP PHÁT TỰ ĐỘNG 24/7'
  }
};

for (const [name, config] of Object.entries(BRANDS)) {
  const filePath = path.join(outDir, `${name}.svg`);
  const content = createSvg(config.bg, config.glow, config.icon, config.title, config.subtitle);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Generated: ${filePath}`);
}
console.log('✓ All 18 brand vector covers created successfully!');
