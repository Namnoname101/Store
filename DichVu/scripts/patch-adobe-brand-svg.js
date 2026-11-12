const fs = require('fs');

let adobeSvg = fs.readFileSync('DichVu/public/images/brands/adobe.svg', 'utf8');

// Replace squircle block with authentic Adobe 'A'
const oldBlock = `    <!-- Authentic Official Adobe 'A' Vector in Squircle -->
    <g transform="translate(-48, -48)">
      <rect width="96" height="96" rx="22" fill="#FA0F00" />
      <g transform="translate(12, 12) scale(3)">
        <path d="M13.966 22.624l-1.69-4.281H8.122l3.892-9.144 5.662 13.425zM8.884 1.376H0v21.248zm15.116 0h-8.884L24 22.624Z" fill="#FFFFFF" />
      </g>
    </g>`;

const newBlock = `    <!-- Authentic Official Adobe 'A' Signature Logo -->
    <g transform="translate(-68, -58)">
      <path
        fill="#FA0F00"
        d="M48.787 88.855h19.82c-.09.105 8.617 20.771 8.617 20.967h18.385c.025.055-28.025-63.931-28.151-64.057C67.736 45.55 48.967 88.908 48.787 88.855zM7.71 6.471C7.755 6.398 7.854 109.536 7.854 109.68 7.997 109.814 50.923 6.444 50.798 6.471H7.71zM83.599 6.471c0 0 44.55 103.595 44.522 103.263 0 .144.03-103.003.03-103.263H83.599z"
      />
    </g>`;

const normalize = s => s.replace(/\r\n/g, '\n');
adobeSvg = normalize(adobeSvg);

if (adobeSvg.includes(normalize(oldBlock))) {
  adobeSvg = adobeSvg.replace(normalize(oldBlock), normalize(newBlock));
  fs.writeFileSync('DichVu/public/images/brands/adobe.svg', adobeSvg);
  console.log('Successfully updated DichVu/public/images/brands/adobe.svg!');
} else {
  console.warn('Could not match oldBlock in brands/adobe.svg');
}
