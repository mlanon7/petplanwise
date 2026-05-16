#!/usr/bin/env node
/* Audit fix: breed hero.jpg files were too large (up to 3+ MB), hurting
   LCP and mobile UX. This sweep:

   1. Backs up the original hero.jpg to hero-original.jpg (only if not
      already backed up)
   2. Re-encodes hero.jpg at max 1600px wide, 82% quality (mozjpeg)
   3. Generates hero.webp at the same resolution, 78% quality
   4. Updates the breed page index.html <img> to a <picture> element
      with a WebP source + JPG fallback

   Idempotent: if a breed already has hero-original.jpg, we keep that as
   the source of truth and re-encode the displayed hero.jpg + hero.webp
   from it (so re-runs don't degrade quality further). */
"use strict";
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");

function listBreedDirs() {
  return fs.readdirSync(path.join(ROOT, "breeds"))
    .filter(function (n) {
      if (n.indexOf("-cost-in-") >= 0) return false;
      if (!n.endsWith("-cost")) return false;
      return fs.statSync(path.join(ROOT, "breeds", n)).isDirectory();
    });
}

async function optimizeOne(dir) {
  const breedDir = path.join(ROOT, "breeds", dir);
  const heroJpg = path.join(breedDir, "hero.jpg");
  if (!fs.existsSync(heroJpg)) return null;
  const heroOriginal = path.join(breedDir, "hero-original.jpg");
  const heroWebp = path.join(breedDir, "hero.webp");

  /* Step 1: source-of-truth — copy original on first run only */
  if (!fs.existsSync(heroOriginal)) {
    fs.copyFileSync(heroJpg, heroOriginal);
  }
  /* Re-encode displayed JPG + WebP from the original each run (idempotent) */
  const meta = await sharp(heroOriginal).metadata();
  const targetWidth = Math.min(1600, meta.width || 1600);

  /* Optimized JPG (overwrites hero.jpg) */
  await sharp(heroOriginal)
    .resize(targetWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toFile(heroJpg + ".tmp");
  fs.renameSync(heroJpg + ".tmp", heroJpg);

  /* WebP at same resolution */
  await sharp(heroOriginal)
    .resize(targetWidth, null, { withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(heroWebp + ".tmp");
  fs.renameSync(heroWebp + ".tmp", heroWebp);

  /* Read final dims for the <img> tag */
  const finalMeta = await sharp(heroJpg).metadata();
  const jpgBytes = fs.statSync(heroJpg).size;
  const webpBytes = fs.statSync(heroWebp).size;

  /* Step 2: update breed page <img> to <picture> with WebP source */
  const htmlPath = path.join(breedDir, "index.html");
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, "utf8");
    /* Match the hero <img> inside <figure class="breed-hero-static">. We
       wrap it in <picture>...</picture> if not already wrapped. */
    const imgRe = /(<figure class="breed-hero-static"[^>]*>\s*)(<img\s+src="(\/breeds\/[^"]+)\/hero\.jpg[^"]*"[^>]+>)(\s*<\/figure>)/;
    const m = html.match(imgRe);
    if (m && html.indexOf("<picture") === -1) {
      const cleanBase = m[3]; // "/breeds/abc-cost"
      const webpUrl = cleanBase + "/hero.webp";
      const picture = m[1] +
        '<picture>' +
        '<source type="image/webp" srcset="' + webpUrl + '">' +
        m[2] +
        '</picture>' +
        m[4];
      html = html.replace(imgRe, picture);
      fs.writeFileSync(htmlPath, html, "utf8");
    }
  }

  return { dir: dir, jpgKb: Math.round(jpgBytes / 1024), webpKb: Math.round(webpBytes / 1024), w: finalMeta.width, h: finalMeta.height };
}

async function main() {
  const dirs = listBreedDirs();
  console.log("Optimizing " + dirs.length + " breed heroes…\n");
  let totalJpg = 0, totalWebp = 0, processed = 0, failed = [];
  for (const d of dirs) {
    try {
      const r = await optimizeOne(d);
      if (!r) continue;
      processed++;
      totalJpg += r.jpgKb;
      totalWebp += r.webpKb;
      console.log("  " + d.padEnd(40) + " " + (r.w + "x" + r.h).padEnd(11) + "  jpg " + r.jpgKb + " KB / webp " + r.webpKb + " KB");
    } catch (e) {
      failed.push(d + ": " + e.message);
      console.error("  ✗ " + d + " — " + e.message);
    }
  }
  console.log("\nProcessed: " + processed + " breeds");
  console.log("Total JPG weight after optimization: " + totalJpg + " KB  (avg " + Math.round(totalJpg / Math.max(processed, 1)) + " KB)");
  console.log("Total WebP weight: " + totalWebp + " KB  (avg " + Math.round(totalWebp / Math.max(processed, 1)) + " KB)");
  if (failed.length) console.log("Failed: " + failed.join(", "));
}

main().catch(function (e) { console.error(e); process.exit(1); });
