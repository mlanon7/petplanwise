#!/usr/bin/env node
/* Mirror the published gallery photos from breeds/<slug>-cost/gallery/0N.jpg
   into the project-root source/staging folder /breed_images/<slug>/<prefix>_N.jpg,
   matching the existing two-folder convention. Also append rows to
   breed_images/attribution.csv. Idempotent: skips files already present.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "breed_images");
const ATTRIB_CSV = path.join(SOURCE_DIR, "attribution.csv");

const PREFIXES = {
  "abyssinian": "abyssinian",
  "american-shorthair": "ash",
  "belgian-malinois": "bm",
  "bernedoodle": "bd",
  "cavapoo": "cavapoo",
  "goldendoodle": "gldn",
  "havanese": "havanese",
  "labradoodle": "ld",
  "maltese": "maltese",
  "munchkin": "munchkin",
  "norwegian-forest-cat": "nfc",
  "russian-blue": "rb",
  "saint-bernard": "sb",
  "savannah-cat": "sav",
  "shiba-inu": "si",
  "vizsla": "vizsla",
};

let copied = 0, skipped = 0;
const newCsvRows = [];

for (const slug of Object.keys(PREFIXES)) {
  const prefix = PREFIXES[slug];
  const srcGallery = path.join(ROOT, "breeds", slug + "-cost", "gallery");
  const destDir = path.join(SOURCE_DIR, slug);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  for (let i = 1; i <= 5; i++) {
    const num = String(i).padStart(2, "0");
    // gallery uses 0X.jpg or 0X.png — find whichever exists
    const candidates = [num + ".jpg", num + ".png", num + ".webp"];
    let srcFile = null;
    for (const c of candidates) {
      if (fs.existsSync(path.join(srcGallery, c))) { srcFile = c; break; }
    }
    if (!srcFile) {
      console.log("  " + slug + " #" + i + " — no source found, skipping");
      continue;
    }
    const ext = srcFile.split(".").pop();
    const destName = prefix + "_" + i + "." + ext;
    const dest = path.join(destDir, destName);
    if (fs.existsSync(dest)) {
      skipped++;
    } else {
      fs.copyFileSync(path.join(srcGallery, srcFile), dest);
      copied++;
    }
    newCsvRows.push(slug + "," + destName + ",Free Stock (Pexels)");
  }
}

/* Append to attribution.csv (skip duplicates) */
const existing = fs.readFileSync(ATTRIB_CSV, "utf8");
const existingLines = new Set(existing.split(/\r?\n/).map(function (l) { return l.trim(); }));
const toAppend = newCsvRows.filter(function (r) { return !existingLines.has(r.trim()); });
if (toAppend.length) {
  const sep = existing.endsWith("\n") ? "" : "\n";
  fs.appendFileSync(ATTRIB_CSV, sep + toAppend.join("\n") + "\n", "utf8");
}

console.log("\nCopied: " + copied + " | skipped (already present): " + skipped + " | CSV rows added: " + toAppend.length);
