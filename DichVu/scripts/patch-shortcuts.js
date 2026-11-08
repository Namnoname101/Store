const fs = require('fs');

// 1. Patch BrandLogo.tsx
const brandLogoPath = 'DichVu/src/components/BrandLogo.tsx';
let brandLogo = fs.readFileSync(brandLogoPath, 'utf8');

const normTarget = '  if (lower.includes("duolingo")) return "duolingo";';
const normReplace = `  if (lower.includes("duolingo")) return "duolingo";
  if (lower.includes("xingtu") || lower.includes("醒图") || lower.includes("tinh tu")) return "xingtu";
  if (lower.includes("quizlet")) return "quizlet";
  if (lower.includes("photoroom")) return "photoroom";`;

brandLogo = brandLogo.replace(normTarget, normReplace);

const caseTarget = '    case "nordvpn":';
const caseReplace = `    case "xingtu":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="2" y="5" width="20" height="15" rx="4" stroke="#FF2A85" strokeWidth="2" />
          <circle cx="12" cy="12.5" r="4.5" stroke="#FF6584" strokeWidth="2" />
          <circle cx="17.5" cy="8" r="1.2" fill="#FFB199" />
          <path d="M19 3 Q19 5 21 5 Q19 5 19 7 Q19 5 17 5 Q19 5 19 3 Z" fill="#FFE082" />
        </svg>
      );

    case "quizlet":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="11" cy="11" r="7.5" stroke="#3CCFCF" strokeWidth="2.5" />
          <path d="M15.5 15.5 L20.5 20.5" stroke="#4257B2" strokeWidth="3" strokeLinecap="round" />
          <circle cx="20.5" cy="20.5" r="1.2" fill="#00E5FF" />
        </svg>
      );

    case "photoroom":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <rect x="3" y="3" width="11" height="15" rx="3" stroke="#9333EA" strokeWidth="2" />
          <rect x="9.5" y="6.5" width="11.5" height="14.5" rx="3" fill="#9333EA" fillOpacity="0.25" stroke="#EC4899" strokeWidth="1.8" />
          <path d="M19 2 Q19 4 21 4 Q19 4 19 6 Q19 4 17 4 Q19 4 19 2 Z" fill="#F472B6" />
        </svg>
      );

    case "nordvpn":`;

brandLogo = brandLogo.replace(caseTarget, caseReplace);
fs.writeFileSync(brandLogoPath, brandLogo, 'utf8');
console.log('BrandLogo.tsx patched successfully');

// 2. Patch BrandFilterNavigator.tsx
const navPath = 'DichVu/src/components/BrandFilterNavigator.tsx';
let nav = fs.readFileSync(navPath, 'utf8');

const navTarget = '  { id: "canva", name: "Canva Pro", query: "canva", iconKey: "canva", badge: "PRO", hoverBorder: "hover:border-teal-500" },';
const navReplace = `  { id: "canva", name: "Canva Pro", query: "canva", iconKey: "canva", badge: "PRO", hoverBorder: "hover:border-teal-500" },
  { id: "figma", name: "Figma Pro", query: "figma", iconKey: "figma", badge: "2 NĂM", hoverBorder: "hover:border-purple-400" },
  { id: "xingtu", name: "Xingtu VIP", query: "xingtu", iconKey: "xingtu", badge: "30D", hoverBorder: "hover:border-pink-500" },
  { id: "photoroom", name: "Photoroom", query: "photoroom", iconKey: "photoroom", badge: "MAX", hoverBorder: "hover:border-purple-500" },
  { id: "quizlet", name: "Quizlet Plus", query: "quizlet", iconKey: "quizlet", badge: "TEACHER", hoverBorder: "hover:border-cyan-400" },`;

nav = nav.replace(navTarget, navReplace);
fs.writeFileSync(navPath, nav, 'utf8');
console.log('BrandFilterNavigator.tsx patched successfully');

// 3. Patch CatalogExplorer.tsx
const catPath = 'DichVu/src/components/CatalogExplorer.tsx';
let cat = fs.readFileSync(catPath, 'utf8');

// Add to section keywords
const kwTarget = '      "adobe",\n      "duolingo",';
const kwReplace = `      "adobe",
      "duolingo",
      "xingtu",
      "quizlet",
      "photoroom",
      "figma",`;

cat = cat.replace(kwTarget, kwReplace);

// Add to matchProductBrand
const matchTarget = '    case "canva":\n      return titleLower.includes("canva");';
const matchReplace = `    case "canva":
      return titleLower.includes("canva");
    case "figma":
      return titleLower.includes("figma") || slugLower.includes("figma");
    case "xingtu":
      return titleLower.includes("xingtu") || slugLower.includes("xingtu") || titleLower.includes("醒图");
    case "photoroom":
      return titleLower.includes("photoroom") || slugLower.includes("photoroom");
    case "quizlet":
      return titleLower.includes("quizlet") || slugLower.includes("quizlet");`;

cat = cat.replace(matchTarget, matchReplace);
fs.writeFileSync(catPath, cat, 'utf8');
console.log('CatalogExplorer.tsx patched successfully');
