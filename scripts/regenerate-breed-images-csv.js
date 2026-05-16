#!/usr/bin/env node
/* Rebuild assets/data/csv/breed-images.csv cleanly. The old file had
   NUL bytes and was missing rows for the 12 breeds added today plus
   the 16 newer breeds added earlier this month. This script:

   - Walks every breeds/<slug>-cost/ directory
   - Reads hero.jpg dimensions for each breed
   - Reads credit.json (Pexels/Unsplash metadata) where available
   - Falls back to "Free Stock" for legacy breeds without credit.json
   - Emits exactly one row per breed, no blank/NUL rows */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const BREEDS_DIR = path.join(ROOT, "breeds");

function csvEscape(s) {
  s = String(s == null ? "" : s);
  if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function jpgDims(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    if (m >= 0xd0 && m <= 0xd9) { i += 2; continue; }
    const segLen = buf.readUInt16BE(i + 2);
    if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) ||
        (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + segLen;
  }
  return null;
}

const dirs = fs.readdirSync(BREEDS_DIR).filter(function (n) {
  if (n.indexOf("-cost-in-") >= 0) return false;
  if (!n.endsWith("-cost")) return false;
  return fs.statSync(path.join(BREEDS_DIR, n)).isDirectory();
}).sort();

/* Map dir -> slug. Legacy 8 cat dirs use "<slug>-cat-cost"; everything
   else is "<slug>-cost". Slug == dir minus the suffix. */
function dirToSlug(dir) {
  if (dir.endsWith("-cat-cost")) return dir.replace(/-cat-cost$/, "");
  return dir.replace(/-cost$/, "");
}

const rows = [
  ["slug","src","alt","credit","credit_url","license","license_url","width","height"]
];

let withCredit = 0, fallback = 0, missing = 0;

dirs.forEach(function (dir) {
  const slug = dirToSlug(dir);
  const heroPath = path.join(BREEDS_DIR, dir, "hero.jpg");
  const creditPath = path.join(BREEDS_DIR, dir, "credit.json");
  const src = "/breeds/" + dir + "/hero.jpg";
  const alt = slug.replace(/-/g, " ") + (dir.endsWith("-cat-cost") || /^(abyssinian|american-shorthair|bengal|british-shorthair|devon-rex|domestic-shorthair|exotic-shorthair|maine-coon|munchkin|norwegian-forest-cat|persian|ragdoll|russian-blue|savannah-cat|scottish-fold|siamese|siberian-cat|sphynx)$/.test(slug) ? " cat" : " dog");

  let dims = null;
  if (fs.existsSync(heroPath)) {
    try { dims = jpgDims(fs.readFileSync(heroPath)); } catch (e) {}
  } else {
    missing++;
  }

  let credit = "", credit_url = "", license = "", license_url = "";
  if (fs.existsSync(creditPath)) {
    try {
      const c = JSON.parse(fs.readFileSync(creditPath, "utf8"));
      const source = c.source || "";  // "Pexels" or "Unsplash"
      const artist = c.artist || "";
      credit = source + (artist && artist !== source + " Creator" ? " — " + artist : "");
      credit_url = c.source_url || "";
      license = c.license || "";
      if (source === "Pexels") license_url = "https://www.pexels.com/license/";
      else if (source === "Unsplash") license_url = "https://unsplash.com/license";
      withCredit++;
    } catch (e) {}
  } else {
    credit = "Free Stock (Pexels/Unsplash/Pixabay/Rawpixel)";
    license = "User-provided (free stock per attribution.csv)";
    fallback++;
  }

  rows.push([
    slug, src, alt, credit, credit_url, license, license_url,
    dims ? String(dims.width) : "",
    dims ? String(dims.height) : ""
  ]);
});

const out = rows.map(function (r) { return r.map(csvEscape).join(","); }).join("\n") + "\n";
fs.writeFileSync(path.join(ROOT, "assets/data/csv/breed-images.csv"), out, "utf8");

console.log("Rebuilt breed-images.csv");
console.log("  Total rows: " + (rows.length - 1));
console.log("  With Pexels/Unsplash credit: " + withCredit);
console.log("  Legacy free-stock fallback: " + fallback);
console.log("  Missing hero.jpg: " + missing);
