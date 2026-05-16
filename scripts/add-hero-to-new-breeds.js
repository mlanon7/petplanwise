#!/usr/bin/env node
/* Add hero image to the 16 new breed pages matching the existing template:
   1. Copy gallery/01.jpg → hero.jpg (or hero.png if the source was PNG)
   2. Inject <figure class="breed-hero-static"> markup between H1 and the
      reviewer block.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const NEW_BREEDS = [
  "abyssinian", "american-shorthair", "belgian-malinois", "bernedoodle",
  "cavapoo", "goldendoodle", "havanese", "labradoodle", "maltese",
  "munchkin", "norwegian-forest-cat", "russian-blue", "saint-bernard",
  "savannah-cat", "shiba-inu", "vizsla",
];

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field.length || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
      } else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map(function (r) {
    const o = {};
    header.forEach(function (h, i) { o[h] = (r[i] || "").trim(); });
    return o;
  });
}

const breeds = parseCSV(fs.readFileSync(path.join(ROOT, "assets/data/csv/breeds.csv"), "utf8"));
const bySlug = {};
breeds.forEach(function (b) { bySlug[b.slug] = b; });

const MARKER = "<!-- breed-hero-static -->";
const CACHE_BUST = "20260515c";
let touched = 0;

for (const slug of NEW_BREEDS) {
  const pageDir = path.join(ROOT, "breeds", slug + "-cost");
  const galleryDir = path.join(pageDir, "gallery");
  if (!fs.existsSync(pageDir)) { console.log("missing page dir: " + slug); continue; }

  // 1) Copy gallery/01.{jpg|png} → hero.{jpg|png}
  let heroExt = null;
  for (const ext of ["jpg", "png", "webp"]) {
    const src = path.join(galleryDir, "01." + ext);
    if (fs.existsSync(src)) { heroExt = ext; break; }
  }
  if (!heroExt) { console.log("no gallery/01.* for " + slug); continue; }
  const heroSrc = path.join(galleryDir, "01." + heroExt);
  const heroDest = path.join(pageDir, "hero." + heroExt);
  fs.copyFileSync(heroSrc, heroDest);

  // 2) Inject hero figure into the HTML
  const file = path.join(pageDir, "index.html");
  let html = fs.readFileSync(file, "utf8");
  if (html.indexOf(MARKER) >= 0) {
    console.log("  already has hero: " + slug);
    continue;
  }
  const breed = bySlug[slug];
  const displayName = breed ? breed.name : slug.replace(/-/g, " ");
  const species = breed ? breed.species : "dog";
  const alt = displayName + " " + species + " — sample photo";

  const heroBlock =
    "\n  " + MARKER + "\n" +
    '  <figure class="breed-hero-static" style="margin:0 0 16px;border-radius:14px;overflow:hidden;">\n' +
    '    <img src="/breeds/' + slug + "-cost/hero." + heroExt + "?v=" + CACHE_BUST + '" alt="' + alt + '" loading="eager" fetchpriority="high" decoding="async">\n' +
    "  </figure>\n";

  // Insert between </h1> and the next sibling.
  const re = /(<h1>[^<]*<\/h1>)\s*\n/;
  if (!re.test(html)) { console.log("no <h1> match: " + slug); continue; }
  html = html.replace(re, function (m, h1) { return h1 + heroBlock; });
  fs.writeFileSync(file, html, "utf8");
  touched++;
  console.log("  " + slug + " → hero." + heroExt);
}
console.log("\nAdded hero image to " + touched + " of " + NEW_BREEDS.length + " new breed pages");
