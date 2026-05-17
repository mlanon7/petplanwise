#!/usr/bin/env node
/* Swap the Corgi + Boston Terrier hero photos again. Critical fix:
   this script writes BOTH hero.jpg AND hero-original.jpg so the next
   run of optimize-breed-heroes.js (which uses hero-original.jpg as
   its source of truth) won't silently revert these.

   New picks:
   - Pembroke Welsh Corgi: Pexels 7524671 (studio shot, dog fills
     frame, full face + body visible — replaces the forest photo
     where the dog was tiny in the bottom-third of the frame)
   - Boston Terrier: Pexels 19849719 (head + chest, blue background,
     dog looking at camera, landscape orientation that fits the
     compare-page 4:3 crop cleanly) */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const sharp = require("sharp");
const ROOT = path.resolve(__dirname, "..");

const SWAPS = [
  {
    slug: "pembroke-welsh-corgi",
    pexelsId: 7524671,
    pageUrl: "https://www.pexels.com/photo/close-up-shot-of-a-corgi-dog-sitting-7524671/",
    desc: "Pembroke Welsh Corgi studio shot, full face + body, sitting"
  },
  {
    slug: "boston-terrier",
    pexelsId: 19849719,
    pageUrl: "https://www.pexels.com/photo/head-of-boston-terrier-19849719/",
    desc: "Boston Terrier head + chest, blue background, looking at camera"
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const f = fs.createWriteStream(dest);
    function req(u) {
      https.get(u, r => {
        if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) { f.close(); req(r.headers.location); return; }
        if (r.statusCode !== 200) { f.close(); try { fs.unlinkSync(dest); } catch (e) {} reject(new Error("HTTP " + r.statusCode)); return; }
        r.pipe(f); f.on("finish", () => f.close(resolve));
      }).on("error", reject);
    }
    req(url);
  });
}

async function main() {
  for (const s of SWAPS) {
    const dir = path.join(ROOT, "breeds", s.slug + "-cost");
    const heroOriginal = path.join(dir, "hero-original.jpg");
    const heroJpg = path.join(dir, "hero.jpg");
    const heroWebp = path.join(dir, "hero.webp");
    const url = "https://images.pexels.com/photos/" + s.pexelsId +
                "/pexels-photo-" + s.pexelsId + ".jpeg?auto=compress&cs=tinysrgb&w=1600";

    /* Download into hero-original.jpg first (the source of truth) */
    await download(url, heroOriginal);

    /* Re-encode optimized JPG + WebP from the original */
    const meta = await sharp(heroOriginal).metadata();
    const targetWidth = Math.min(1600, meta.width || 1600);
    await sharp(heroOriginal).resize(targetWidth, null, { withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(heroJpg + ".tmp");
    fs.renameSync(heroJpg + ".tmp", heroJpg);
    await sharp(heroOriginal).resize(targetWidth, null, { withoutEnlargement: true })
      .webp({ quality: 78 }).toFile(heroWebp + ".tmp");
    fs.renameSync(heroWebp + ".tmp", heroWebp);

    /* Update credit.json */
    fs.writeFileSync(path.join(dir, "credit.json"), JSON.stringify({
      slug: s.slug, source: "Pexels", artist: "Pexels Creator",
      license: "Pexels License (free for commercial use, attribution appreciated)",
      source_url: s.pageUrl, description: s.desc
    }, null, 2), "utf8");

    /* Update breed page <img> width/height */
    const finalMeta = await sharp(heroJpg).metadata();
    const htmlPath = path.join(dir, "index.html");
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, "utf8");
      const re = /(<img src="\/breeds\/[^"]+\/hero\.jpg[^"]*")\s+width="\d+"\s+height="\d+"/;
      if (re.test(html)) {
        html = html.replace(re, '$1 width="' + finalMeta.width + '" height="' + finalMeta.height + '"');
        fs.writeFileSync(htmlPath, html, "utf8");
      }
    }
    console.log("✓ " + s.slug + " — " + finalMeta.width + "x" + finalMeta.height + " from Pexels " + s.pexelsId);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
