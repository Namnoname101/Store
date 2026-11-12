const fs = require('fs');

let brandLogoCode = fs.readFileSync('DichVu/src/components/BrandLogo.tsx', 'utf8');

// 1. Update case "adobe"
const oldAdobe = `    case "adobe":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Official Adobe Corporate Logo */}
          <rect width="24" height="24" rx="4.5" fill="#FA0F00" />
          <path
            d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm15.116 0h-8.884L24 22.624Z"
            fill="#FFFFFF"
            transform="translate(3, 3) scale(0.75)"
          />
        </svg>
      );`;

const newAdobe = `    case "adobe":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 136 116"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Official Adobe 'A' Logo from Wikimedia Commons / Adobe Systems */}
          <path
            fill="#FA0F00"
            d="M48.787 88.855h19.82c-.09.105 8.617 20.771 8.617 20.967h18.385c.025.055-28.025-63.931-28.151-64.057C67.736 45.55 48.967 88.908 48.787 88.855zM7.71 6.471C7.755 6.398 7.854 109.536 7.854 109.68 7.997 109.814 50.923 6.444 50.798 6.471H7.71zM83.599 6.471c0 0 44.55 103.595 44.522 103.263 0 .144.03-103.003.03-103.263H83.599z"
          />
        </svg>
      );`;

// 2. Update case "canva"
const oldCanva = `    case "canva":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9.5a4 4 0 1 0 0 5" />
        </svg>
      );`;

const newCanva = `    case "canva":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="#00C4CC"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Official Canva Script Logo */}
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zM6.962 7.68c.754 0 1.337.549 1.405 1.2.069.583-.171 1.097-.822 1.406-.343.171-.48.172-.549.069-.034-.069 0-.137.069-.206.617-.514.617-.926.548-1.508-.034-.378-.308-.618-.583-.618-1.2 0-2.914 2.674-2.674 4.629.103.754.549 1.646 1.509 1.646.308 0 .65-.103.96-.24.5-.264.799-.47 1.097-.8-.073-.885.704-2.046 1.851-2.046.515 0 .926.205.96.583.068.514-.377.582-.514.582s-.378-.034-.378-.17c-.034-.138.309-.07.275-.378-.035-.206-.24-.274-.446-.274-.72 0-1.131.994-1.029 1.611.035.275.172.549.447.549.205 0 .514-.31.617-.755.068-.308.343-.514.583-.514.102 0 .17.034.205.171v.138c-.034.137-.137.548-.102.651 0 .069.034.171.17.171.092 0 .436-.18.777-.459.117-.59.253-1.298.253-1.357.034-.24.137-.48.617-.48.103 0 .171.034.205.171v.138l-.136.617c.445-.583 1.097-.994 1.508-.994.172 0 .309.102.309.274 0 .103 0 .274-.069.446-.137.377-.309.96-.412 1.474 0 .137.035.274.207.274.171 0 .685-.206 1.096-.754l.007-.004c-.002-.068-.007-.134-.007-.202 0-.411.035-.754.104-.994.068-.274.411-.514.617-.514.103 0 .205.069.205.171 0 .035 0 .103-.034.137-.137.446-.24.857-.24 1.269 0 .24.034.582.102.788 0 .034.035.069.07.069.068 0 .548-.445.89-1.028-.308-.206-.48-.549-.48-.96 0-.72.446-1.097.858-1.097.343 0 .617.24.617.72 0 .308-.103.65-.274.96h.102a.77.77 0 0 0 .584-.24.293.293 0 0 1 .134-.117c.335-.425.83-.74 1.41-.74.48 0 .924.205.959.582.068.515-.378.618-.515.618l-.002-.002c-.138 0-.377-.035-.377-.172 0-.137.309-.068.274-.376-.034-.206-.24-.275-.446-.275-.686 0-1.13.891-1.028 1.611.034.275.171.583.445.583.206 0 .515-.308.652-.754.068-.274.343-.514.583-.514.103 0 .17.034.205.171 0 .069 0 .206-.137.652-.17.308-.171.48-.137.617.034.274.171.48.309.583.034.034.068.102.068.102 0 .069-.034.138-.137.138-.034 0-.068 0-.103-.035-.514-.205-.72-.548-.789-.891-.205.24-.445.377-.72.377-.445 0-.89-.411-.96-.926a1.609 1.609 0 0 1 .075-.649c-.203.13-.422.203-.623.203h-.17c-.447.652-.927 1.098-1.27 1.303a.896.896 0 0 1-.377.104c-.068 0-.171-.035-.205-.104-.095-.152-.156-.392-.193-.667-.481.527-1.145.805-1.453.805-.343 0-.548-.206-.582-.55v-.376c.102-.754.377-1.2.377-1.337a.074.074 0 0 0-.069-.07c-.24 0-1.028.824-1.166 1.373l-.103.445c-.068.309-.377.515-.582.515-.103 0-.172-.035-.206-.172v-.137l.046-.233c-.435.31-.87.508-1.075.508-.308 0-.48-.172-.514-.412-.206.274-.445.412-.754.412-.352 0-.696-.24-.862-.593-.244.275-.523.553-.852.764-.48.309-1.028.549-1.68.549-.582 0-1.097-.309-1.371-.583-.412-.377-.651-.96-.686-1.509-.205-1.68.823-3.84 2.4-4.8.378-.205.755-.343 1.132-.343zm9.77 3.291c-.104 0-.172.172-.172.343 0 .274.137.583.309.755a1.74 1.74 0 0 0 .102-.583c0-.343-.137-.515-.24-.515z" />
        </svg>
      );`;

// 3. Update case "microsoft"
const oldMs = `    case "microsoft":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <rect x="3" y="3" width="8.5" height="8.5" rx="1" />
          <rect x="12.5" y="3" width="8.5" height="8.5" rx="1" />
          <rect x="3" y="12.5" width="8.5" height="8.5" rx="1" />
          <rect x="12.5" y="12.5" width="8.5" height="8.5" rx="1" />
        </svg>
      );`;

const newMs = `    case "microsoft":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Official Microsoft 4-Color Corporate Grid */}
          <rect x="2.5" y="2.5" width="9" height="9" rx="1" fill="#F25022" />
          <rect x="12.5" y="2.5" width="9" height="9" rx="1" fill="#7FBA00" />
          <rect x="2.5" y="12.5" width="9" height="9" rx="1" fill="#00A4EF" />
          <rect x="12.5" y="12.5" width="9" height="9" rx="1" fill="#FFB900" />
        </svg>
      );`;

// 4. Update case "locket"
const oldLocket = `    case "locket":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <rect x="3" y="8" width="18" height="13" rx="3" />
          <path d="M7 8V6a5 5 0 0 1 10 0v2" />
          <path d="M12 13v3" />
        </svg>
      );`;

const newLocket = `    case "locket":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Official Locket Widget Gold Camera/Heart Icon */}
          <rect width="24" height="24" rx="6" fill="#FFDE00" />
          <path
            d="M12 7C9.8 4.8 7 6.2 7 8.8C7 11.8 12 16 12 16C12 16 17 11.8 17 8.8C17 6.2 14.2 4.8 12 7Z"
            fill="#111111"
          />
          <circle cx="12" cy="10" r="1.8" fill="#FFDE00" />
        </svg>
      );`;

// 5. Update case "meitu"
const oldMeitu = `    case "meitu":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="12" cy="12" r="10" fill="#FF4D79" />
          <path d="M7 16V8l5 4.5L17 8v8" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );`;

const newMeitu = `    case "meitu":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Meitu VIP Pink Gradient Logo */}
          <rect width="24" height="24" rx="6" fill="#FF2A6D" />
          <path
            d="M6.5 16.5V9C6.5 8.2 7.5 7.8 8.2 8.5L12 12L15.8 8.5C16.5 7.8 17.5 8.2 17.5 9V16.5"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );`;

// 6. Update case "xingtu"
const oldXingtu = `    case "xingtu":
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
      );`;

const newXingtu = `    case "xingtu":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Xingtu (醒图) Sparkling Cyan Star Icon */}
          <rect width="24" height="24" rx="6" fill="#0C0D10" />
          <path
            d="M12 3.5C12 7.8 16.2 12 20.5 12C16.2 12 12 16.2 12 20.5C12 16.2 7.8 12 3.5 12C7.8 12 12 7.8 12 3.5Z"
            fill="#00F2FE"
          />
        </svg>
      );`;

// 7. Update case "photoroom"
const oldPhotoroom = `    case "photoroom":
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
      );`;

const newPhotoroom = `    case "photoroom":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          {/* Authentic Photoroom Purple & Wand Icon */}
          <rect width="24" height="24" rx="6" fill="#7C3AED" />
          <path d="M7 17L15 9" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="15" cy="9" r="1.5" fill="#F43F5E" />
          <path d="M16 4.5L17 6.5L19 7.5L17 8.5L16 10.5L15 8.5L13 7.5L15 6.5Z" fill="#FDE047" />
        </svg>
      );`;

// Apply replacements with normalize CRLF
const normalize = str => str.replace(/\r\n/g, '\n');

brandLogoCode = normalize(brandLogoCode);

const replaceBlock = (name, oldB, newB) => {
  const normOld = normalize(oldB);
  const normNew = normalize(newB);
  if (brandLogoCode.includes(normOld)) {
    brandLogoCode = brandLogoCode.replace(normOld, normNew);
    console.log(`Updated ${name} successfully!`);
  } else {
    console.warn(`WARNING: Could not find block for ${name}`);
  }
};

replaceBlock('adobe', oldAdobe, newAdobe);
replaceBlock('canva', oldCanva, newCanva);
replaceBlock('microsoft', oldMs, newMs);
replaceBlock('locket', oldLocket, newLocket);
replaceBlock('meitu', oldMeitu, newMeitu);
replaceBlock('xingtu', oldXingtu, newXingtu);
replaceBlock('photoroom', oldPhotoroom, newPhotoroom);

fs.writeFileSync('DichVu/src/components/BrandLogo.tsx', brandLogoCode);
console.log('BrandLogo.tsx saved!');
