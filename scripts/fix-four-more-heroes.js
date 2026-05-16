#!/usr/bin/env node
/* Second pass on 4 breeds whose previous re-source still didn't land:
   - Newfoundland: Unsplash photo (face-forward, happy expression)
   - Boston Terrier: different Pexels — close-up portrait
   - Pembroke Welsh Corgi: pulled back from extreme close-up
   - West Highland White Terrier: outdoor in nature (was indoors) */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const ROOT = path.resolve(__dirname, "..");

const HEROES = [
  {
    slug: "newfoundland",
    url: "https://images.unsplash.com/photo-1742007019876-1de27c7d70a6?w=1600&q=80&fm=jpg",
    source: "Unsplash",
    pageUrl: "https://unsplash.com/photos/a-large-black-dog-looks-happy-Bz6nPi4N_Cg",
    desc: "Large black Newfoundland dog looking happy, face forward"
  },
  {
    slug: "boston-terrier",
    url: "https://images.pexels.com/photos/28541201/pexels-photo-28541201.jpeg?auto=compress&cs=tinysrgb&w=1600",
    source: "Pexels",
    pageUrl: "https://www.pexels.com/photo/cheerful-boston-terrier-dog-close-up-portrait-28541201/",
    desc: "Cheerful Boston Terrier dog close-up portrait"
  },
  {
    slug: "pembroke-welsh-corgi",
    url: "https://images.pexels.com/photos/14730841/pexels-photo-14730841.jpeg?auto=compress&cs=tinysrgb&w=1600",
    source: "Pexels",
    pageUrl: "https://www.pexels.com/photo/head-of-corgi-14730841/",
    desc: "Pembroke Welsh Corgi studio portrait with perked ears"
  },
  {
    slug: "west-highland-white-terrier",
    url: "https://images.pexels.com/photos/31943772/pexels-photo-31943772.jpeg?auto=compress&cs=tinysrgb&w=1600",
    source: "Pexels",
    pageUrl: "https://www.pexels.com/photo/cute-west-highland-white-terrier-in-spring-flowers-31943772/",
    desc: "West Highland White Terrier outdoors in spring meadow"
  }
];

function dirFor(slug) {
  return path.join(ROOT, "breeds", slug + "-cost");
}
function download(url, dest) {
  return new Promise(function (resolve, reject) {
    var file = fs.createWriteStream(dest);
    function req(u) {
      https.get(u, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          req(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          try { fs.unlinkSync(dest); } catch (e) {}
          reject(new Error("HTTP " + res.statusCode + " for " + u));
          return;
        }
        res.pipe(file);
        file.on("finish", function () { file.close(resolve); });
      }).on("error", function (err) {
        file.close();
        try { fs.unlinkSync(dest); } catch (e) {}
        reject(err);
      });
    }
    req(url);
  });
}
function jpgDims(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) return null;
    const m = buf[i + 1];
    if (m >= 0xd0 && m <= 0xd9) { i += 2; continue; }
    const segLen = buf.readUInt16BE(i + 2);
    if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xc7) ||
        (m >= 0xc9 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + segLen;
  }
  return null;
}

async function main() {
  for (const h of HEROES) {
    const dir = dirFor(h.slug);
    const heroPath = path.join(dir, "hero.jpg");
    /* Don't overwrite hero-prev.jpg if it exists — keeps the very-first
       original around for ultimate rollback. */
    try {
      await download(h.url, heroPath);
      const dims = jpgDims(fs.readFileSync(heroPath));
      /* Update credit.json */
      fs.writeFileSync(path.join(dir, "credit.json"), JSON.stringify({
        slug: h.slug,
        source: h.source,
        artist: h.source + " Creator",
        license: h.source === "Unsplash"
          ? "Unsplash License (free for commercial use, attribution appreciated)"
          : "Pexels License (free for commercial use, attribution appreciated)",
        source_url: h.pageUrl,
        description: h.desc
      }, null, 2), "utf8");
      /* Update breed page img dims */
      if (dims) {
        const htmlPath = path.join(dir, "index.html");
        if (fs.existsSync(htmlPath)) {
          let html = fs.readFileSync(htmlPath, "utf8");
          const re = /(<figure class="breed-hero-static"[^>]*>\s*<img\s+src="\/breeds\/[^"]+\/hero\.jpg[^"]*")\s+width="\d+"\s+height="\d+"/;
          if (re.test(html)) {
            html = html.replace(re, '$1 width="' + dims.width + '" height="' + dims.height + '"');
            fs.writeFileSync(htmlPath, html, "utf8");
          }
        }
      }
      console.log("✓ " + h.slug + " — " + (dims ? dims.width + "x" + dims.height : "??") + " (" + h.source + ")");
    } catch (e) {
      console.error("✗ " + h.slug + " — " + e.message);
    }
  }
}

main().catch(function (e) { console.error(e); process.exit(1); });
