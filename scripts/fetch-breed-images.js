#!/usr/bin/env node
/* ============================================================
   Pexels image fetcher for breed pages.
   Usage:
     1. Get a free Pexels API key: https://www.pexels.com/api/
     2. Run:  PEXELS_KEY=your_key node scripts/fetch-breed-images.js
   What it does:
     - Reads breed slugs from assets/data/breeds.js
     - Queries Pexels for "{breed name} dog" or "{breed name} cat"
     - Downloads the first medium-size landscape photo per breed
     - Saves to /assets/images/breeds/{slug}.jpg
     - Writes attribution into /assets/data/breed-images.js
   ============================================================ */
"use strict";

const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const KEY = process.env.PEXELS_KEY;
if (!KEY) {
  console.error("Missing PEXELS_KEY. Get a free one at https://www.pexels.com/api/");
  console.error("Then run:  PEXELS_KEY=your_key node scripts/fetch-breed-images.js");
  process.exit(1);
}

/* Load breed list from the CSV (sole source of truth). */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === '\r') {}
      else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter(r => r.some(v => v !== "" && v != null))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] != null ? r[i] : ""])));
}
const BREEDS_CSV = path.join(ROOT, "assets/data/csv/breeds.csv");
const BREED_ROWS = parseCSV(fs.readFileSync(BREEDS_CSV, "utf8"));
const BREEDS = {};
for (const r of BREED_ROWS) {
  BREEDS[r.slug] = { species: r.species, name: r.name, size: r.size };
}

const IMG_DIR = path.join(ROOT, "assets/images/breeds");
fs.mkdirSync(IMG_DIR, { recursive: true });

const OUT_FILE = path.join(ROOT, "assets/data/csv/breed-images.csv");
const existing = {};   // slug -> entry; pre-load so re-runs don't redownload

/* Tiny CSV cell escaper */
function csvCell(v) {
  if (v == null) return "";
  var s = String(v);
  if (s.indexOf(",") >= 0 || s.indexOf("\"") >= 0 || s.indexOf("\n") >= 0) {
    return "\"" + s.replace(/"/g, "\"\"") + "\"";
  }
  return s;
}

function pexelsSearch(query) {
  return new Promise((resolve, reject) => {
    const url = "https://api.pexels.com/v1/search?per_page=5&orientation=landscape&query=" + encodeURIComponent(query);
    https.get(url, { headers: { Authorization: KEY } }, res => {
      let body = "";
      res.on("data", c => body += c);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", err => { fs.unlinkSync(dest); reject(err); });
  });
}

(async function () {
  const out = {};
  let written = 0, skipped = 0, failed = 0;

  for (const [slug, breed] of Object.entries(BREEDS)) {
    const dest = path.join(IMG_DIR, slug + ".jpg");
    if (fs.existsSync(dest)) {
      console.log("SKIP", slug, "(image already exists)");
      skipped++;
      continue;
    }
    const query = breed.name + " " + (breed.species === "cat" ? "cat" : "dog");
    try {
      const res = await pexelsSearch(query);
      const photo = (res.photos || [])[0];
      if (!photo) { console.warn("MISS", slug, "(no Pexels result)"); failed++; continue; }
      await download(photo.src.large, dest);
      out[slug] = {
        src: "/assets/images/breeds/" + slug + ".jpg",
        alt: breed.name + " — " + (breed.species === "cat" ? "cat breed" : "dog breed") + " photo",
        credit: photo.photographer,
        creditUrl: photo.photographer_url,
        license: "Pexels License",
        licenseUrl: "https://www.pexels.com/license/",
        width: photo.width || "",
        height: photo.height || ""
      };
      console.log("OK  ", slug, "→", photo.photographer);
      written++;
      await new Promise(r => setTimeout(r, 250));   // polite rate-limit
    } catch (e) {
      console.error("FAIL", slug, e.message);
      failed++;
    }
  }

  /* Write the CSV data file (sole source of truth) */
  const headers = ["slug","src","alt","credit","credit_url","license","license_url","width","height"];
  const csvRows = [headers.join(",")];
  for (const slug of Object.keys(out).sort()) {
    const e = out[slug];
    csvRows.push([
      csvCell(slug),
      csvCell(e.src),
      csvCell(e.alt),
      csvCell(e.credit),
      csvCell(e.creditUrl),
      csvCell(e.license),
      csvCell(e.licenseUrl),
      csvCell(e.width),
      csvCell(e.height)
    ].join(","));
  }
  fs.writeFileSync(OUT_FILE, csvRows.join("\n") + "\n", "utf8");

  console.log("\n=== Done ===");
  console.log("Written:", written, "Skipped:", skipped, "Failed:", failed);
  console.log("Data file:", OUT_FILE);
  console.log("Image dir:", IMG_DIR);
})();
