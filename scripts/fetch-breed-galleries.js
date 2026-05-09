#!/usr/bin/env node
/* ============================================================
   Fetches a 5-10 image gallery per breed from Wikimedia Commons.

   Usage:
     cd "D:\claude projects\petcost-bill"
     node scripts/fetch-breed-galleries.js

   What it does:
     - Reads breed list from /assets/data/csv/breeds.csv
     - For each breed, queries Wikimedia Commons for relevant images
     - Filters to free-licensed (CC0, CC-BY, CC-BY-SA, Public Domain) photos
     - Downloads up to MAX_PER_BREED images per breed
     - Saves to /breeds/<slug>-cost/gallery/01.jpg, 02.jpg, ...
     - Writes per-image attribution to /breeds/<slug>-cost/gallery/attribution.json
     - Skips breeds that already have a populated gallery folder
     - Polite rate-limit: 1 sec between requests, identifies as a UA

   Zero npm deps — uses Node's built-in https + fs + crypto.
   ============================================================ */

"use strict";

const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BREEDS_CSV = path.join(ROOT, "assets/data/csv/breeds.csv");
const MAX_PER_BREED = 8;             // 5-10 range; 8 is a good middle
const MIN_WIDTH = 800;                // skip tiny thumbnails
const MIN_BYTES = 50 * 1024;          // 50 KB floor — skip placeholder/icon images
const UA = "petcost-bill-image-fetcher/1.0 (https://yourpetbill.com)";
const DELAY_MS = 1100;                // be polite to Wikimedia

/* ---------- CSV parser ---------- */
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

/* ---------- HTTPS helpers ---------- */
function httpsJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": UA, "Accept": "application/json" } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsJson(res.headers.location).then(resolve).catch(reject);
      }
      let chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
        catch (e) { reject(e); }
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
        fs.unlinkSync(dest);
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close(); try { fs.unlinkSync(dest); } catch (_) {}
        return reject(new Error("HTTP " + res.statusCode + " " + url));
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

/* ---------- License helpers ---------- */
const FREE_LICENSES = [
  /^Public Domain/i, /^PD/i, /^CC0/i, /^CC-?BY(-SA)?($|[\s\d.])/i,
  /^Creative Commons Attribution/i,
  /^Wikimedia Commons$/i  // fallback when license text is missing
];
function isFreeLicense(name) {
  if (!name) return false;
  return FREE_LICENSES.some(re => re.test(name));
}

/* ---------- Wikimedia Commons search ---------- */
async function searchCommons(query, limit = 30) {
  // Use the Commons MediaWiki API — list=search namespace=6 (File:)
  const url = "https://commons.wikimedia.org/w/api.php"
    + "?action=query&format=json&list=search&srnamespace=6"
    + "&srlimit=" + limit
    + "&srsearch=" + encodeURIComponent(query + " filetype:bitmap");
  const j = await httpsJson(url);
  return (j.query && j.query.search) || [];
}

async function getImageInfo(filePageTitle) {
  // filePageTitle includes "File:" prefix
  const url = "https://commons.wikimedia.org/w/api.php"
    + "?action=query&format=json"
    + "&titles=" + encodeURIComponent(filePageTitle)
    + "&prop=imageinfo&iiprop=url|size|mime|extmetadata"
    + "&iiurlwidth=1280";
  const j = await httpsJson(url);
  const pages = j.query && j.query.pages;
  if (!pages) return null;
  const page = pages[Object.keys(pages)[0]];
  if (!page || !page.imageinfo || !page.imageinfo[0]) return null;
  return { title: page.title, info: page.imageinfo[0] };
}

/* ---------- Per-breed pipeline ---------- */
async function fetchOneBreed(breedRow) {
  const slug = breedRow.slug;
  const name = breedRow.name;
  const species = breedRow.species;
  const isCat = species === "cat";
  const breedDir = path.join(ROOT, "breeds", slug + (isCat ? "-cat-cost" : "-cost"));
  // Some legacy slugs differ — fall back to whichever folder exists
  const candidateDirs = [
    breedDir,
    path.join(ROOT, "breeds", slug + "-cost"),
    path.join(ROOT, "breeds", slug + "-cat-cost"),
  ];
  const finalDir = candidateDirs.find(d => fs.existsSync(d));
  if (!finalDir) {
    console.log("  ! no breed folder for " + slug + " — skipping");
    return { slug, status: "no-folder" };
  }
  const galleryDir = path.join(finalDir, "gallery");
  if (fs.existsSync(galleryDir)) {
    const existing = fs.readdirSync(galleryDir).filter(f => f.match(/\d+\.(jpg|jpeg|png)$/));
    if (existing.length >= MAX_PER_BREED) {
      console.log("  · " + slug + " already has " + existing.length + " images — skipping");
      return { slug, status: "already-populated" };
    }
  }
  fs.mkdirSync(galleryDir, { recursive: true });

  const query = name + " " + (isCat ? "cat" : "dog");
  console.log("· " + slug + " — searching: " + query);
  let candidates;
  try { candidates = await searchCommons(query, 40); }
  catch (e) { console.log("  search error: " + e.message); return { slug, status: "search-error" }; }

  const downloaded = [];
  const attribution = [];
  let n = 1;

  for (const cand of candidates) {
    if (downloaded.length >= MAX_PER_BREED) break;
    if (cand.title.toLowerCase().match(/\.(svg|gif|webm|ogv|pdf)$/)) continue;
    await sleep(DELAY_MS);
    let info;
    try { info = await getImageInfo(cand.title); } catch (e) { continue; }
    if (!info || !info.info) continue;
    const ii = info.info;
    if ((ii.thumbwidth || ii.width || 0) < MIN_WIDTH) continue;

    const meta = ii.extmetadata || {};
    const license = (meta.LicenseShortName && meta.LicenseShortName.value) || "";
    const licenseUrl = (meta.LicenseUrl && meta.LicenseUrl.value) || "";
    const artist = ((meta.Artist && meta.Artist.value) || "").replace(/<[^>]+>/g, "").trim();
    const description = ((meta.ImageDescription && meta.ImageDescription.value) || "").replace(/<[^>]+>/g, "").trim();
    if (!isFreeLicense(license)) continue;

    const fileNum = String(n).padStart(2, "0");
    const ext = (cand.title.match(/\.(jpe?g|png)$/i) || ["", "jpg"])[1].toLowerCase();
    const dest = path.join(galleryDir, fileNum + "." + ext);
    const downloadUrl = ii.thumburl || ii.url;
    try {
      const size = await downloadFile(downloadUrl, dest);
      downloaded.push(dest);
      attribution.push({
        file: fileNum + "." + ext,
        title: info.title,
        breed: name,
        source: "Wikimedia Commons",
        sourcePage: ii.descriptionurl || ("https://commons.wikimedia.org/wiki/" + encodeURIComponent(info.title)),
        sourceUrl: downloadUrl,
        license: license || "Wikimedia Commons (see source page)",
        licenseUrl: licenseUrl || "",
        artist: artist,
        description: description,
        width: ii.thumbwidth || ii.width || 0,
        height: ii.thumbheight || ii.height || 0,
        bytes: size
      });
      console.log("  ✓ " + fileNum + "  " + (size/1024).toFixed(0) + "KB  " + license + "  " + (artist || "—"));
      n++;
    } catch (e) {
      console.log("  ✗ " + cand.title + " (" + e.message + ")");
    }
  }

  // Write attribution.json for the gallery
  if (attribution.length) {
    fs.writeFileSync(path.join(galleryDir, "attribution.json"),
      JSON.stringify({ slug, breed: name, files: attribution }, null, 2));
  }

  return { slug, status: "ok", downloaded: downloaded.length };
}

/* ---------- Main ---------- */
(async () => {
  const breeds = parseCsv(fs.readFileSync(BREEDS_CSV, "utf8"));
  console.log("Found " + breeds.length + " breeds. Fetching up to " + MAX_PER_BREED + " images each.");
  console.log("");

  const summary = [];
  for (const b of breeds) {
    const r = await fetchOneBreed(b);
    summary.push(r);
    await sleep(500);
  }

  console.log("");
  console.log("=== Summary ===");
  const ok = summary.filter(s => s.status === "ok");
  const skipped = summary.filter(s => s.status === "already-populated");
  const errors = summary.filter(s => !["ok", "already-populated"].includes(s.status));
  let totalImgs = 0;
  ok.forEach(s => { totalImgs += s.downloaded || 0; });
  console.log("Breeds processed: " + summary.length);
  console.log("Newly downloaded: " + ok.length + " breeds (" + totalImgs + " images)");
  console.log("Already populated: " + skipped.length);
  console.log("Errors / no-folder: " + errors.length);
  if (errors.length) errors.forEach(e => console.log("  ! " + e.slug + " — " + e.status));
})().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
