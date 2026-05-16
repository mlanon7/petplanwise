#!/usr/bin/env node
/* Download 5 photos per breed from scripts/_breed-photo-manifest.json into
   breeds/<slug>-cost/gallery/01.jpg ... 05.jpg, and write an attribution.json
   that matches the existing gallery render format used by layout JS.

   Idempotent: skips files that already exist (delete + re-run to force).
*/
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "scripts/_breed-photo-manifest.json");

function downloadOnce(url, dest) {
  return new Promise(function (resolve, reject) {
    const mod = url.startsWith("https:") ? https : http;
    const req = mod.get(url, { headers: { "User-Agent": "Mozilla/5.0 (petplanwise-image-fetch)" } }, function (res) {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).toString();
        return downloadOnce(next, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error("HTTP " + res.statusCode + " for " + url));
      }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      out.on("finish", function () { out.close(function () { resolve(); }); });
      out.on("error", function (e) { fs.unlink(dest, function () { reject(e); }); });
    });
    req.on("error", reject);
    req.setTimeout(30000, function () { req.destroy(new Error("timeout")); });
  });
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  const slugs = Object.keys(manifest);
  let downloaded = 0, skipped = 0, failed = 0;

  for (const slug of slugs) {
    const breed = manifest[slug];
    const galleryDir = path.join(ROOT, "breeds", slug + "-cost", "gallery");
    if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });

    const files = [];
    for (let i = 0; i < breed.photos.length; i++) {
      const photo = breed.photos[i];
      const num = String(i + 1).padStart(2, "0");
      const ext = photo.url.match(/\.(jpe?g|png|webp)/i) ? photo.url.match(/\.(jpe?g|png|webp)/i)[1].replace(/^jpeg$/i, "jpg").toLowerCase() : "jpg";
      const filename = num + "." + ext;
      const dest = path.join(galleryDir, filename);

      if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
        skipped++;
      } else {
        try {
          await downloadOnce(photo.url, dest);
          downloaded++;
          process.stdout.write("  " + slug + "/" + filename + " ✓\n");
        } catch (e) {
          failed++;
          process.stdout.write("  " + slug + "/" + filename + " ✗ " + e.message + "\n");
          continue;
        }
      }

      files.push({
        file: filename,
        description: photo.alt,
        source: photo.source + " — " + photo.photographer,
        artist: photo.photographer,
        license: "Pexels License (free for commercial use, attribution appreciated)",
        source_url: photo.source_page,
        breed: slug,
      });
    }

    const attribution = {
      slug: slug,
      breed: slug.replace(/-/g, " "),
      species: breed.species,
      note: breed.note || undefined,
      files: files,
    };
    fs.writeFileSync(path.join(galleryDir, "attribution.json"), JSON.stringify(attribution, null, 2), "utf8");
  }

  console.log("\nDone. Downloaded: " + downloaded + ", skipped (already present): " + skipped + ", failed: " + failed);
}

main().catch(function (e) { console.error(e); process.exit(1); });
