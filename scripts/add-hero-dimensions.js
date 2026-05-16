#!/usr/bin/env node
/* For every base breed page, read the actual width/height from the
   breed's hero.jpg/png and inject them into the <img> tag. Prevents
   layout shift (CLS).

   Reads PNG IHDR header (bytes 16-23) and JPEG SOF marker for dims.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const BREEDS_DIR = path.join(ROOT, "breeds");

function pngDims(buf) {
  // PNG: 8-byte signature + IHDR chunk starting at byte 8
  if (buf.length < 24) return null;
  // IHDR width at byte 16, height at byte 20 (both big-endian)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function jpgDims(buf) {
  // Walk JPEG segments; SOF0/1/2/3/5/6/7/9/10/11/13/14/15 carry dims
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    // Skip restart markers (FFD0-FFD7) and standalone markers (FFD8, FFD9)
    if (marker >= 0xd0 && marker <= 0xd9) { i += 2; continue; }
    const segLen = buf.readUInt16BE(i + 2);
    // SOF markers (skip differential SOFs that we don't need to decode)
    if ((marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)) {
      // SOF: [marker][len:2][precision:1][height:2][width:2]
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + segLen;
  }
  return null;
}

function readDims(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0x89 && buf[1] === 0x50) return pngDims(buf);
  if (buf[0] === 0xff && buf[1] === 0xd8) return jpgDims(buf);
  return null;
}

function listBaseBreedDirs() {
  return fs.readdirSync(BREEDS_DIR).filter(function (n) {
    if (n.indexOf("-cost-in-") >= 0) return false;
    if (!n.endsWith("-cost")) return false;
    return fs.statSync(path.join(BREEDS_DIR, n)).isDirectory();
  });
}

let touched = 0, skipped = 0, missing = 0;
for (const d of listBaseBreedDirs()) {
  const breedDir = path.join(BREEDS_DIR, d);
  // Find hero.* (jpg, png, webp)
  let heroFile = null;
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const p = path.join(breedDir, "hero." + ext);
    if (fs.existsSync(p)) { heroFile = "hero." + ext; break; }
  }
  if (!heroFile) { missing++; continue; }
  const dims = readDims(path.join(breedDir, heroFile));
  if (!dims) { missing++; continue; }

  const htmlPath = path.join(breedDir, "index.html");
  if (!fs.existsSync(htmlPath)) { missing++; continue; }
  let html = fs.readFileSync(htmlPath, "utf8");

  // Find the hero <img> tag — anchored to the breed-hero-static figure.
  // Match the <img> inside that figure, capture and rewrite it.
  const re = /(<figure class="breed-hero-static"[^>]*>\s*<img\s+)([^>]*?)(\s*\/?\s*>)/;
  const m = html.match(re);
  if (!m) { skipped++; continue; }
  let attrs = m[2];
  // Already has explicit width AND height? skip.
  if (/\bwidth\s*=/i.test(attrs) && /\bheight\s*=/i.test(attrs)) {
    skipped++;
    continue;
  }
  // Remove any existing width/height first (in case only one is present)
  attrs = attrs
    .replace(/\s*\bwidth\s*=\s*"[^"]*"/i, "")
    .replace(/\s*\bheight\s*=\s*"[^"]*"/i, "");
  // Inject after src=
  attrs = attrs.replace(/(src\s*=\s*"[^"]+")/i,
    '$1 width="' + dims.width + '" height="' + dims.height + '"');
  html = html.replace(re, m[1] + attrs + m[3]);
  fs.writeFileSync(htmlPath, html, "utf8");
  touched++;
}
console.log("Added dimensions on " + touched + " breed hero images (skipped: " + skipped + ", missing: " + missing + ")");
