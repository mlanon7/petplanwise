#!/usr/bin/env node
/* Replace 14 hero photos with close-up Pexels portraits.
   Four targeted fixes (watermark / far-away / off-angle) + ten popular
   breeds proactively refreshed.
   Backs existing hero.jpg up to hero-prev.jpg before overwriting. */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const ROOT = path.resolve(__dirname, "..");

/* Legacy cat slugs have a -cat-cost directory suffix; everything else is -cost */
var CAT_LEGACY = { "maine-coon":1, "ragdoll":1, "persian":1, "bengal":1, "british-shorthair":1, "scottish-fold":1, "siamese":1, "sphynx":1 };

const HEROES = [
  /* The 4 user-flagged issues */
  { slug: "boston-terrier",        pexelsId: 29910987, pageUrl: "https://www.pexels.com/photo/charming-boston-terrier-dog-portrait-29910987/", desc: "Charming Boston Terrier studio portrait" },
  { slug: "labradoodle",           pexelsId: 31734358, pageUrl: "https://www.pexels.com/photo/close-up-portrait-of-a-curious-labradoodle-31734358/", desc: "Close-up portrait of a curious white Labradoodle" },
  { slug: "newfoundland",          pexelsId: 10784163, pageUrl: "https://www.pexels.com/photo/close-up-photo-of-a-cute-black-dog-10784163/", desc: "Close-up of a black Newfoundland (Landseer) with tongue out" },
  { slug: "miniature-schnauzer",   pexelsId: 35102553, pageUrl: "https://www.pexels.com/photo/portrait-of-a-schnauzer-dog-with-distinctive-beard-35102553/", desc: "Close-up portrait of a Schnauzer with distinctive beard" },
  /* Top-10 popular breeds proactively refreshed with verified close-ups */
  { slug: "labrador-retriever",    pexelsId: 33844764, pageUrl: "https://www.pexels.com/photo/close-up-portrait-of-a-sad-labrador-retriever-33844764/", desc: "Close-up portrait of a Labrador Retriever" },
  { slug: "french-bulldog",        pexelsId: 32612263, pageUrl: "https://www.pexels.com/photo/charming-french-bulldog-portrait-with-expressive-eyes-32612263/", desc: "Charming French Bulldog portrait with expressive eyes" },
  { slug: "golden-retriever",      pexelsId: 35439661, pageUrl: "https://www.pexels.com/photo/golden-retriever-portrait-against-blue-background-35439661/", desc: "Golden Retriever portrait against blue background" },
  { slug: "german-shepherd",       pexelsId: 36625194, pageUrl: "https://www.pexels.com/photo/portrait-of-an-alert-german-shepherd-dog-36625194/", desc: "Portrait of an alert German Shepherd" },
  { slug: "bulldog",               pexelsId: 12251710, pageUrl: "https://www.pexels.com/photo/close-up-photo-of-a-dog-12251710/", desc: "Close-up portrait of an English Bulldog" },
  { slug: "poodle",                pexelsId: 33390714, pageUrl: "https://www.pexels.com/photo/chocolate-brown-poodle-portrait-outdoors-33390714/", desc: "Chocolate brown Standard Poodle portrait" },
  { slug: "beagle",                pexelsId: 31086486, pageUrl: "https://www.pexels.com/photo/close-up-portrait-of-a-beagle-dog-face-31086486/", desc: "Close-up portrait of a Beagle face" },
  { slug: "maine-coon",            pexelsId: 32126012, pageUrl: "https://www.pexels.com/photo/close-up-of-a-maine-coon-cat-s-face-32126012/", desc: "Close-up of a Maine Coon cat's face" },
  { slug: "ragdoll",               pexelsId: 37252502, pageUrl: "https://www.pexels.com/photo/blue-eyed-ragdoll-cat-portrait-in-soft-light-37252502/", desc: "Blue-eyed Ragdoll cat portrait in soft light" },
  { slug: "persian",               pexelsId: 31322541, pageUrl: "https://www.pexels.com/photo/charming-persian-cat-with-striking-yellow-eyes-31322541/", desc: "Charming Persian cat with striking yellow eyes" }
];

function imageUrl(id) {
  return "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=1600";
}
function dirFor(slug) {
  var suffix = CAT_LEGACY[slug] ? "-cat-cost" : "-cost";
  return path.join(ROOT, "breeds", slug + suffix);
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
          reject(new Error("HTTP " + res.statusCode));
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

/* Parse JPEG SOF marker for width/height */
function jpgDims(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 8) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    if (marker >= 0xd0 && marker <= 0xd9) { i += 2; continue; }
    const segLen = buf.readUInt16BE(i + 2);
    if ((marker >= 0xc0 && marker <= 0xc3) ||
        (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) ||
        (marker >= 0xcd && marker <= 0xcf)) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + segLen;
  }
  return null;
}

async function main() {
  var done = 0, failed = [];
  await Promise.all(HEROES.map(async function (h) {
    var dir = dirFor(h.slug);
    if (!fs.existsSync(dir)) {
      failed.push(h.slug + " (no dir)");
      return;
    }
    var heroPath = path.join(dir, "hero.jpg");
    var prevPath = path.join(dir, "hero-prev.jpg");
    /* Back up existing */
    if (fs.existsSync(heroPath) && !fs.existsSync(prevPath)) {
      fs.copyFileSync(heroPath, prevPath);
    }
    try {
      await download(imageUrl(h.pexelsId), heroPath);
      /* Update credit.json */
      fs.writeFileSync(path.join(dir, "credit.json"), JSON.stringify({
        slug: h.slug,
        source: "Pexels",
        artist: "Pexels Creator",
        license: "Pexels License (free for commercial use, attribution appreciated)",
        source_url: h.pageUrl,
        description: h.desc
      }, null, 2), "utf8");

      /* Update breed page index.html with new width/height */
      var buf = fs.readFileSync(heroPath);
      var dims = jpgDims(buf);
      if (dims) {
        var htmlPath = path.join(dir, "index.html");
        if (fs.existsSync(htmlPath)) {
          var html = fs.readFileSync(htmlPath, "utf8");
          /* Match the hero <img> regardless of current dimensions; allow optional ?v= query */
          var re = /(<figure class="breed-hero-static"[^>]*>\s*<img\s+src="\/breeds\/[^"]+\/hero\.jpg[^"]*")\s+width="\d+"\s+height="\d+"/;
          if (re.test(html)) {
            html = html.replace(re, '$1 width="' + dims.width + '" height="' + dims.height + '"');
            fs.writeFileSync(htmlPath, html, "utf8");
          }
        }
      }
      done++;
      console.log("✓ " + h.slug + " (" + h.pexelsId + ") " + (dims ? dims.width + "x" + dims.height : "??"));
    } catch (e) {
      failed.push(h.slug + ": " + e.message);
      console.error("✗ " + h.slug + " — " + e.message);
    }
  }));
  console.log("\nReplaced: " + done + "/" + HEROES.length);
  if (failed.length) console.log("Failed: " + failed.join(", "));
}

main().catch(function (e) { console.error(e); process.exit(1); });
