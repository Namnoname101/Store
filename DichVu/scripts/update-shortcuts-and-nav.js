const fs = require('fs');
const path = require('path');

// 1. Update BrandFilterNavigator.tsx
const navPath = path.join(__dirname, '../src/components/BrandFilterNavigator.tsx');
let navContent = fs.readFileSync(navPath, 'utf8');

const targetNavEnd = `  { id: "youtube", name: "YouTube", query: "youtube", iconKey: "youtube", badge: "PREMIUM", hoverBorder: "hover:border-red-600" },
];`;

const newNavItems = `  { id: "youtube", name: "YouTube", query: "youtube", iconKey: "youtube", badge: "PREMIUM", hoverBorder: "hover:border-red-600" },
  { id: "suno", name: "Suno AI", query: "suno", iconKey: "suno", badge: "2500 CRE", hoverBorder: "hover:border-pink-500" },
  { id: "hma", name: "HMA VPN", query: "hma", iconKey: "hma", badge: "5 THIẾT BỊ", hoverBorder: "hover:border-sky-400" },
  { id: "kling", name: "Kling AI", query: "kling", iconKey: "kling", badge: "VIDEO AI", hoverBorder: "hover:border-amber-400" },
  { id: "muse", name: "MUSE AI", query: "muse", iconKey: "muse", badge: "31 TỶ", hoverBorder: "hover:border-purple-400" },
];`;

navContent = navContent.replace(/\r\n/g, '\n');
if (navContent.includes(targetNavEnd.replace(/\r\n/g, '\n'))) {
  navContent = navContent.replace(targetNavEnd.replace(/\r\n/g, '\n'), newNavItems.replace(/\r\n/g, '\n'));
  // Update Adobe badge to ALL / EXP
  navContent = navContent.replace('{ id: "adobe", name: "Adobe", query: "adobe", iconKey: "adobe", badge: "ALL"', '{ id: "adobe", name: "Adobe", query: "adobe", iconKey: "adobe", badge: "ALL/EXP"');
  fs.writeFileSync(navPath, navContent, 'utf8');
  console.log('✓ Updated BrandFilterNavigator.tsx');
} else {
  console.error('Failed to find target in BrandFilterNavigator.tsx');
}

// 2. Update CatalogExplorer.tsx matchProductBrand
const catPath = path.join(__dirname, '../src/components/CatalogExplorer.tsx');
let catContent = fs.readFileSync(catPath, 'utf8');

const targetMatch = `    case "nordvpn":
      return titleLower.includes("nordvpn") || (titleLower.includes("vpn") && !titleLower.includes("vps"));
    case "netflix":
      return titleLower.includes("netflix");
    case "youtube":
      return titleLower.includes("youtube");
    case "vps":
      return titleLower.includes("vps") || catSlug.includes("vps") || catName.includes("vps") || titleLower.includes("máy chủ");
    default:`;

const newMatch = `    case "nordvpn":
      return titleLower.includes("nordvpn") || slugLower.includes("nordvpn");
    case "hma":
      return titleLower.includes("hma") || slugLower.includes("hma");
    case "suno":
      return titleLower.includes("suno") || slugLower.includes("suno");
    case "kling":
      return titleLower.includes("kling") || slugLower.includes("kling");
    case "muse":
      return titleLower.includes("muse") || slugLower.includes("muse");
    case "netflix":
      return titleLower.includes("netflix");
    case "youtube":
      return titleLower.includes("youtube");
    case "vps":
      return titleLower.includes("vps") || catSlug.includes("vps") || catName.includes("vps") || titleLower.includes("máy chủ");
    default:`;

catContent = catContent.replace(/\r\n/g, '\n');
if (catContent.includes(targetMatch.replace(/\r\n/g, '\n'))) {
  catContent = catContent.replace(targetMatch.replace(/\r\n/g, '\n'), newMatch.replace(/\r\n/g, '\n'));
  fs.writeFileSync(catPath, catContent, 'utf8');
  console.log('✓ Updated CatalogExplorer.tsx');
} else {
  console.error('Failed to find targetMatch in CatalogExplorer.tsx');
}

// 3. Update BrandLogo.tsx
const logoPath = path.join(__dirname, '../src/components/BrandLogo.tsx');
let logoContent = fs.readFileSync(logoPath, 'utf8');

const targetNormalize = `  if (lower.includes("photoroom")) return "photoroom";
  if (lower.includes("nordvpn") || lower.includes("vpn")) return "nordvpn";
  return "default";`;

const newNormalize = `  if (lower.includes("photoroom")) return "photoroom";
  if (lower.includes("suno")) return "suno";
  if (lower.includes("hma")) return "hma";
  if (lower.includes("kling")) return "kling";
  if (lower.includes("muse")) return "muse";
  if (lower.includes("nordvpn") || lower.includes("vpn")) return "nordvpn";
  return "default";`;

const targetSwitchEnd = `    case "nordvpn":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={\`text-blue-500 \${className}\`}
        >
          <path d="M12 2L2 22h20L12 2zm0 5l6.5 13h-13L12 7z" />
        </svg>
      );

    default:`;

const newSwitchItems = `    case "nordvpn":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={\`text-blue-500 \${className}\`}
        >
          <path d="M12 2L2 22h20L12 2zm0 5l6.5 13h-13L12 7z" />
        </svg>
      );

    case "suno":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="2" y="10" width="3" height="4" rx="1.5" fill="#FF007A" />
          <rect x="7" y="6" width="3" height="12" rx="1.5" fill="#FF5400" />
          <rect x="12" y="3" width="3" height="18" rx="1.5" fill="#FF007A" />
          <rect x="17" y="7" width="3" height="10" rx="1.5" fill="#FFBD00" />
          <rect x="22" y="10" width="3" height="4" rx="1.5" fill="#FF5400" />
        </svg>
      );

    case "hma":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" fill="#00D2FF" fillOpacity="0.2" stroke="#00D2FF" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" fill="#00D2FF" />
          <path d="M12 12.5v4" stroke="#00D2FF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case "kling":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="2" y="4" width="20" height="16" rx="4" stroke="#F59E0B" strokeWidth="2" />
          <polygon points="10,8 16,12 10,16" fill="#F59E0B" />
        </svg>
      );

    case "muse":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="12" cy="12" r="9" stroke="#A855F7" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill="#A855F7" />
        </svg>
      );

    default:`;

logoContent = logoContent.replace(/\r\n/g, '\n');
if (logoContent.includes(targetNormalize.replace(/\r\n/g, '\n'))) {
  logoContent = logoContent.replace(targetNormalize.replace(/\r\n/g, '\n'), newNormalize.replace(/\r\n/g, '\n'));
  console.log('✓ Updated normalizeBrandName in BrandLogo.tsx');
} else {
  console.error('Failed to find targetNormalize in BrandLogo.tsx');
}

if (logoContent.includes(targetSwitchEnd.replace(/\r\n/g, '\n'))) {
  logoContent = logoContent.replace(targetSwitchEnd.replace(/\r\n/g, '\n'), newSwitchItems.replace(/\r\n/g, '\n'));
  fs.writeFileSync(logoPath, logoContent, 'utf8');
  console.log('✓ Updated BrandLogo.tsx switch cases');
} else {
  console.error('Failed to find targetSwitchEnd in BrandLogo.tsx');
}

// 4. Update catalog-grouping.ts
const groupPath = path.join(__dirname, '../src/lib/catalog-grouping.ts');
let groupContent = fs.readFileSync(groupPath, 'utf8');

const targetBrandDefs = `  { key: "facebook", name: "Facebook", keywords: ["facebook", "fb"] },
  { key: "meitu", name: "Meitu VIP", keywords: ["meitu"] },
];`;

const newBrandDefs = `  { key: "facebook", name: "Facebook", keywords: ["facebook", "fb"] },
  { key: "meitu", name: "Meitu VIP", keywords: ["meitu"] },
  { key: "suno", name: "Suno AI", keywords: ["suno"] },
  { key: "hma", name: "HMA VPN", keywords: ["hma"] },
  { key: "kling", name: "Kling AI Video", keywords: ["kling"] },
  { key: "muse", name: "MUSE AI", keywords: ["muse"] },
];`;

groupContent = groupContent.replace(/\r\n/g, '\n');
if (groupContent.includes(targetBrandDefs.replace(/\r\n/g, '\n'))) {
  groupContent = groupContent.replace(targetBrandDefs.replace(/\r\n/g, '\n'), newBrandDefs.replace(/\r\n/g, '\n'));
  fs.writeFileSync(groupPath, groupContent, 'utf8');
  console.log('✓ Updated catalog-grouping.ts BRAND_DEFINITIONS');
} else {
  console.error('Failed to find targetBrandDefs in catalog-grouping.ts');
}

console.log('--- ALL SHORTCUTS AND QUICK-VIEW NAVIGATORS UPDATED! ---');
