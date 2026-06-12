// Generate ready-to-upload Pinterest pins (1000x1500, 2:3) for top content.
// Each pin = pet photo + bottom gradient scrim + headline + sub + wordmark.
// Output: D:/claude projects/Websites/petcost-bill/pins/  (local; user uploads them)
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT = 'D:/claude projects/Websites/petcost-bill/pins';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const TEAL = '#5EEAD4', CREAMY = '#F7F1E1';
const W = 1000, H = 1500;

// Each: photo, 1-2 headline lines, sub line, destination (for your reference when pinning), output file
const PINS = [
  { photo: 'breeds/golden-retriever-cost/hero.jpg', h: ['How much does it', 'cost to sedate a dog?'], sub: 'Sedation $50–$400 · anesthesia explained', dest: '/guides/dog-sedation-anesthesia-cost/', file: 'pin-dog-sedation.png' },
  { photo: 'breeds/ragdoll-cat-cost/hero.jpg', h: ['How much does', 'cat sedation cost?'], sub: 'Light sedation $40–$200 · what to expect', dest: '/guides/cat-sedation-cost/', file: 'pin-cat-sedation.png' },
  { photo: 'breeds/labrador-retriever-cost/hero.jpg', h: ['What a vet visit', 'really costs'], sub: 'With & without insurance · 2026', dest: '/guides/vet-visit-cost-without-insurance/', file: 'pin-vet-visit.png' },
  { photo: 'breeds/beagle-cost/hero.jpg', h: ['Free dog cost', 'calculator'], sub: 'Monthly · annual · lifetime estimate', dest: '/dog-cost-calculator/', file: 'pin-dog-calculator.png' },
  { photo: 'breeds/persian-cat-cost/hero.jpg', h: ['What does a', 'cat really cost?'], sub: 'First year to lifetime · real numbers', dest: '/cat-cost-calculator/', file: 'pin-cat-cost.png' },
  // Puppy photo: "Golden Retriever Puppy" by Terricks Noah, pexels.com/photo/840326 (Pexels license).
  // v2 filename: Pinterest pins are image-immutable, so the replacement pin needs a fresh URL.
  { photo: 'pins/src-puppy-pexels-840326.jpg', h: ['How much does', 'a puppy cost?'], sub: 'First-year costs, broken down', dest: '/guides/puppy-first-year-cost/', file: 'pin-puppy-cost-v2.png' },
];

function overlaySvg(lines, sub) {
  const headTspans = lines.map((ln, i) =>
    `<text x="70" y="${1180 + i * 78}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="68" letter-spacing="-1" fill="#ffffff">${ln.replace(/&/g, '&amp;')}</text>`
  ).join('');
  const subY = 1180 + lines.length * 78 + 30;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.45" stop-color="#0F172A" stop-opacity="0"/>
        <stop offset="0.78" stop-color="#0F172A" stop-opacity="0.72"/>
        <stop offset="1" stop-color="#0F172A" stop-opacity="0.92"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#scrim)"/>
    <rect x="70" y="1095" width="64" height="6" rx="3" fill="${TEAL}"/>
    ${headTspans}
    <text x="70" y="${subY}" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="34" fill="${TEAL}">${sub.replace(/&/g, '&amp;')}</text>
    <text x="70" y="1448" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="30" fill="#ffffff" opacity="0.92">PetPlanWise.com</text>
  </svg>`);
}

(async () => {
  for (const p of PINS) {
    const photo = await sharp(path.join(ROOT, p.photo))
      .resize(W, H, { fit: 'cover', position: 'top' }).toBuffer();
    await sharp(photo)
      .composite([{ input: overlaySvg(p.h, p.sub), left: 0, top: 0 }])
      .png().toFile(path.join(OUT, p.file));
    console.log(`  ${p.file}  ->  pin to a board, link: https://petplanwise.com${p.dest}`);
  }
  console.log(`\n${PINS.length} pins written to ${OUT}`);
})();
