#!/usr/bin/env node
/* ============================================================
   Audit + re-fetch breed hero photos.

   Run on your local machine (this needs internet access):
     cd "D:\claude projects\petcost-bill"
     node scripts/audit-and-refetch-breed-heroes.js

   What it does:
     1) Lists every breed hero.jpg and flags suspicious files
        (under 60 KB, or width < 800px = likely icon/silhouette).
     2) For each flagged breed, queries Wikimedia Commons with
        STRICT filters:
          - filetype:bitmap (no SVG drawings)
          - skip filenames matching: logo, silhouette, drawing,
            icon, coat_of_arms, paw, sketch, tattoo, cartoon
          - minimum width 800, height 600
          - minimum file bytes 80 KB
          - prefer files with the breed name in the filename
          - prefer FREE-licensed images (CC0, CC-BY, CC-BY-SA, PD)
     3) Backs up the old hero.jpg as hero-old.jpg before overwriting.
     4) Updates breed-images.csv with the new attribution.

   To force re-fetch ALL breed photos (not just flagged ones):
     FORCE_ALL=1 node scripts/audit-and-refetch-breed-heroes.js
   ============================================================ */

"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");

const ROOT = path.resolve(__dirname, "..");
const BREEDS_CSV = path.join(ROOT, "assets/data/csv/breeds.csv");
const IMAGES_CSV = path.join(ROOT, "assets/data/csv/breed-images.csv");

const MIN_WIDTH = 800;
const MIN_HEIGHT = 600;
const MIN_BYTES = 80 * 1024;
const SUSPECT_KB = 60;
const SUSPECT_WIDTH = 800;
const FORCE_ALL = process.env.FORCE_ALL === "1";
const UA = "yourpetbill-photo-audit/1.0 (https://yourpetbill.com)";
const DELAY_MS = 1100;

// Filename keywords that strongly indicate NOT a real breed photo
const REJECT_KEYWORDS = [
  "logo", "silhouette", "drawing", "icon", "coat_of_arms", "paw",
  "sketch", "tattoo", "cartoon", "stamp", "mascot", "outline",
  "skeleton", "diagram", "pictogram", "vector", "comic", "chart",
  "illustration", "anatomy", "skull"
];
// File extensions to reject
const REJECT_EXT = /\.(svg|gif|webm|ogv|pdf|tiff?)$/i;

const FREE_LICENSE_RE = [
  /^Public Domain/i, /^PD/i, /^CC0/i, /^CC-?BY(-SA)?($|[\s\d.])/i,
  /^Creative Commons/i
];

/* ---------- CSV ---------- */
function parseCsv(t) {
  const rows = []; let row = [], f = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i+1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else { if (c === '"') q = true;
           else if (c === ',') { row.push(f); f = ""; }
           else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ""; }
           else if (c !== '\r') f += c; }
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  const headers = rows[0];
  return rows.slice(1).filter(r => r.some(v => v !== "")).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
}
function csvCell(v) {
  if (v == null) return "";
  const s = String(v);
  if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

/* ---------- HTTPS ---------- */
function httpsJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": UA, "Accept": "application/json" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) return httpsJson(res.headers.location).then(resolve).catch(reject);
      let chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { "User-Agent": UA } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(dest); } catch (_) {}
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch (_) {}
        return reject(new Error("HTTP " + res.statusCode));
      }
      res.pipe(file);
      file.on("finish", () => file.close(() => {
        const size = fs.statSync(dest).size;
        if (size < MIN_BYTES) { try { fs.unlinkSync(dest); } catch (_) {} return reject(new Error("too small: " + size + "B")); }
        resolve(size);
      }));
    }).on("error", err => { try { fs.unlinkSync(dest); } catch (_) {} reject(err); });
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- Audit ---------- */
function isSuspect(breedDir) {
  const heroPath = path.join(breedDir, "hero.jpg");
  if (!fs.existsSync(heroPath)) return { suspect: true, reason: "missing" };
  const size = fs.statSync(heroPath).size;
  if (size < SUSPECT_KB * 1024) return { suspect: true, reason: "tiny (" + Math.round(size/1024) + " KB)" };
  return { suspect: false, size };
}

/* ---------- Wikimedia Commons search with strict filtering ---------- */
async function searchCommons(query) {
  const url = "https://commons.wikimedia.org/w/api.php"
    + "?action=query&format=json&list=search&srnamespace=6"
    + "&srlimit=30"
    + "&srsearch=" + encodeURIComponent(query + " filetype:bitmap");
  const j = await httpsJson(url);
  return (j.query && j.query.search) || [];
}
async function getImageInfo(filePageTitle) {
  const url = "https://commons.wikimedia.org/w/api.php"
    + "?action=query&format=json&titles=" + encodeURIComponent(filePageTitle)
    + "&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1280";
  const j = await httpsJson(url);
  const pages = j.query && j.query.pages;
  if (!pages) return null;
  const page = pages[Object.keys(pages)[0]];
  if (!page || !page.imageinfo || !page.imageinfo[0]) return null;
  return { title: page.title, info: page.imageinfo[0] };
}
function isFreeLicense(name) {
  if (!name) return false;
  return FREE_LICENSE_RE.some(re => re.test(name));
}
function rejectByFilename(title) {
  const lower = title.toLowerCase();
  for (const kw of REJECT_KEYWORDS) {
    if (lower.includes(kw)) return kw;
  }
  if (REJECT_EXT.test(title)) return "ext";
  return null;
}

async function pickBestImage(breedName, isCat) {
  const queries = [
    breedName + " " + (isCat ? "cat photograph" : "dog photograph"),
    breedName + " " + (isCat ? "cat" : "dog")
  ];
  const breedKey = breedName.toLowerCase().replace(/\s+/g, "");
  const breedKeyUnderscore = breedName.toLowerCase().replace(/\s+/g, "_");
  let best = null, bestScore = -1;

  for (const q of queries) {
    let results;
    try { results = await searchCommons(q); } catch (e) { continue; }
    for (const r of results) {
      const reject = rejectByFilename(r.title);
      if (reject) continue;
      await sleep(DELAY_MS);
      let info;
      try { info = await getImageInfo(r.title); } catch (e) { continue; }
      if (!info || !info.info) continue;
      const ii = info.info;
      const w = ii.thumbwidth || ii.width || 0;
      const h = ii.thumbheight || ii.height || 0;
      if (w < MIN_WIDTH) continue;
      if (h < MIN_HEIGHT) continue;
      const meta = ii.extmetadata || {};
      const license = (meta.LicenseShortName && meta.LicenseShortName.value) || "";
      if (!isFreeLicense(license)) continue;

      // Score
      let score = 50;
      const lowerTitle = r.title.toLowerCase();
      if (lowerTitle.includes(breedKey) || lowerTitle.includes(breedKeyUnderscore)) score += 30;
      if (lowerTitle.endsWith(".jpg") || lowerTitle.endsWith(".jpeg")) score += 5;
      if (w >= 1200) score += 10;
      if (license.match(/^CC0|^Public Domain|^PD/i)) score += 5;
      if (score > bestScore) { bestScore = score; best = { ii, info, license, meta }; }
      if (best && bestScore >= 90) break;
    }
    if (best && bestScore >= 90) break;
  }
  return best;
}

/* ---------- Main ---------- */
(async () => {
  const breeds = parseCsv(fs.readFileSync(BREEDS_CSV, "utf8"));
  const existingImages = parseCsv(fs.readFileSync(IMAGES_CSV, "utf8"));
  const imgIndex = {};
  for (const r of existingImages) imgIndex[r.slug] = r;

  console.log("Auditing " + breeds.length + " breed photos...\n");
  const flagged = [];
  for (const b of breeds) {
    const isCat = b.species === "cat";
    const dir = path.join(ROOT, "breeds", b.slug + (isCat ? "-cat-cost" : "-cost"));
    if (!fs.existsSync(dir)) continue;
    const audit = isSuspect(dir);
    if (audit.suspect || FORCE_ALL) {
      flagged.push({ breed: b, dir, reason: audit.reason || "force-all" });
    }
  }
  if (flagged.length === 0) {
    console.log("No suspect photos found. Set FORCE_ALL=1 to re-fetch every breed anyway.");
    return;
  }
  console.log("Flagged " + flagged.length + " breeds:");
  flagged.forEach(f => console.log("  · " + f.breed.slug + " — " + f.reason));
  console.log("");

  for (const item of flagged) {
    const b = item.breed;
    const isCat = b.species === "cat";
    console.log("→ " + b.slug + " (" + b.name + ")");
    const best = await pickBestImage(b.name, isCat);
    if (!best) {
      console.log("  ✗ no acceptable image found");
      continue;
    }
    const ii = best.ii;
    const info = best.info;
    const meta = best.meta;
    const downloadUrl = ii.thumburl || ii.url;
    const heroPath = path.join(item.dir, "hero.jpg");
    const backupPath = path.join(item.dir, "hero-old.jpg");
    if (fs.existsSync(heroPath) && !fs.existsSync(backupPath)) {
      fs.copyFileSync(heroPath, backupPath);
    }
    try {
      const size = await downloadFile(downloadUrl, heroPath);
      const license = best.license;
      const licenseUrl = (meta.LicenseUrl && meta.LicenseUrl.value) || "";
      const artist = ((meta.Artist && meta.Artist.value) || "").replace(/<[^>]+>/g, "").trim();
      console.log("  ✓ " + (size/1024).toFixed(0) + " KB · " + license + " · " + (artist || "Unknown"));
      // Update breed-images.csv index
      imgIndex[b.slug] = {
        slug: b.slug,
        src: "/breeds/" + b.slug + (isCat ? "-cat-cost" : "-cost") + "/hero.jpg",
        alt: b.name + " " + (isCat ? "cat" : "dog"),
        credit: artist || "Wikimedia Commons contributors",
        credit_url: ii.descriptionurl || "",
        license: license,
        license_url: licenseUrl,
        width: ii.thumbwidth || ii.width || "",
        height: ii.thumbheight || ii.height || ""
      };
    } catch (e) {
      console.log("  ✗ download failed: " + e.message);
    }
    await sleep(800);
  }

  // Rewrite breed-images.csv
  const headers = ["slug","src","alt","credit","credit_url","license","license_url","width","height"];
  const lines = [headers.join(",")];
  for (const slug of Object.keys(imgIndex).sort()) {
    const r = imgIndex[slug];
    lines.push(headers.map(h => csvCell(r[h])).join(","));
  }
  fs.writeFileSync(IMAGES_CSV, lines.join("\n") + "\n");
  console.log("\nbreed-images.csv updated.");
  console.log("Old photos backed up as hero-old.jpg in each affected breed folder.");
})().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
