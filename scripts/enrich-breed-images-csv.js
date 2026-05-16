#!/usr/bin/env node
/* Rebuild breed_images/attribution.csv with full source metadata.

   Pulls per-image attribution from breeds/<slug>-cost/gallery/attribution.json
   (the live-served gallery has rich source data — author, license, source URL).
   Maps gallery filename (01.jpg) to source-staging filename (prefix_1.jpg).
   For breeds whose gallery/attribution.json predates the rich-format migration
   ("sourceFile" entries with only generic source), retain whatever info is there.

   Output columns:
     breed_slug, file, source, source_url, author, license, license_url, width, height, downloaded_at
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "breed_images");
const OUTPUT_CSV = path.join(SOURCE_DIR, "attribution.csv");

/* Shortcode-prefix map (mirror of scripts/mirror-galleries-to-source.js). */
const PREFIXES = {
  "australian-cattle-dog": "acd", "australian-shepherd": "as", "beagle": "beagle",
  "bengal": "bengal", "bernese-mountain-dog": "bmd", "border-collie": "bc",
  "boston-terrier": "bt", "boxer": "boxer", "british-shorthair": "bs",
  "bulldog": "bulldog", "cane-corso": "cc", "cavalier-king-charles": "ckc",
  "chihuahua": "chihuahua", "cocker-spaniel": "cs", "dachshund": "dachshund",
  "doberman": "doberman", "french-bulldog": "fb", "german-shepherd": "gs",
  "golden-retriever": "gr", "great-dane": "gd", "labrador-retriever": "lr",
  "maine-coon": "mc", "mastiff": "mastiff", "miniature-schnauzer": "ms",
  "newfoundland": "newfoundland", "persian": "persian", "pitbull": "pitbull",
  "pomeranian": "pomeranian", "poodle": "poodle", "pug": "pug",
  "ragdoll": "ragdoll", "rottweiler": "rottweiler", "scottish-fold": "sf",
  "shih-tzu": "st", "siamese": "siamese", "siberian-husky": "sh",
  "sphynx": "sphynx", "yorkshire-terrier": "yt",
  // 16 newer breeds
  "abyssinian": "abyssinian", "american-shorthair": "ash", "belgian-malinois": "bm",
  "bernedoodle": "bd", "cavapoo": "cavapoo", "goldendoodle": "gldn",
  "havanese": "havanese", "labradoodle": "ld", "maltese": "maltese",
  "munchkin": "munchkin", "norwegian-forest-cat": "nfc", "russian-blue": "rb",
  "saint-bernard": "sb", "savannah-cat": "sav", "shiba-inu": "si", "vizsla": "vizsla",
};

function csvEscape(s) {
  s = String(s == null ? "" : s);
  if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function findGalleryDir(slug) {
  // Older 8 cat breeds use <slug>-cat-cost/, everything else uses <slug>-cost/
  const candidates = [
    path.join(ROOT, "breeds", slug + "-cost", "gallery"),
    path.join(ROOT, "breeds", slug + "-cat-cost", "gallery"),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

const rows = [
  ["breed_slug", "file", "source", "source_url", "author", "license", "license_url", "width", "height", "downloaded_at"]
];

const slugs = fs.readdirSync(SOURCE_DIR)
  .filter(function (n) { return fs.statSync(path.join(SOURCE_DIR, n)).isDirectory(); })
  .sort();

for (const slug of slugs) {
  const prefix = PREFIXES[slug] || slug;
  const galleryDir = findGalleryDir(slug);
  let attr = null;
  if (galleryDir && fs.existsSync(path.join(galleryDir, "attribution.json"))) {
    try { attr = JSON.parse(fs.readFileSync(path.join(galleryDir, "attribution.json"), "utf8")); } catch (e) {}
  }

  // List actual files in /breed_images/<slug>/ in N order
  const files = fs.readdirSync(path.join(SOURCE_DIR, slug))
    .filter(function (f) { return /\.(jpe?g|png|webp)$/i.test(f); })
    .sort();

  for (const file of files) {
    // Extract sequence number, e.g. "lr_3.jpg" -> 3
    const seqMatch = file.match(/_(\d+)\./);
    const seq = seqMatch ? parseInt(seqMatch[1], 10) : null;
    // Map to gallery 0N.* attribution entry
    let entry = null;
    if (attr && Array.isArray(attr.files) && seq != null) {
      const padded = String(seq).padStart(2, "0");
      entry = attr.files.find(function (x) {
        return x.file && x.file.indexOf(padded + ".") === 0;
      });
    }

    let source = "", source_url = "", author = "", license = "", license_url = "";
    if (entry) {
      // Rich format (16 new breeds + manually-enriched legacy)
      author = entry.artist || "";
      source_url = entry.source_url || "";
      license = entry.license || "";
      // Try to derive platform from source field ("Pexels — Photographer")
      if (entry.source && entry.source.indexOf("—") >= 0) {
        source = entry.source.split("—")[0].trim();
      } else if (entry.source) {
        source = entry.source;
      }
      // Pexels has a single license URL
      if (source.toLowerCase() === "pexels") license_url = "https://www.pexels.com/license/";
    } else {
      // Legacy generic format: no source data available
      source = "Free Stock (Pexels/Unsplash/Pixabay/Rawpixel)";
    }

    rows.push([
      slug, file, source, source_url, author, license, license_url, "", "", ""
    ]);
  }
}

const out = rows.map(function (r) { return r.map(csvEscape).join(","); }).join("\n") + "\n";
fs.writeFileSync(OUTPUT_CSV, out, "utf8");
console.log("Wrote " + (rows.length - 1) + " image rows across " + slugs.length + " breeds to " + OUTPUT_CSV);
