#!/usr/bin/env node
/* Download the 12 hero photos from Pexels and place them at
   breeds/<slug>-cost/hero.jpg. Also writes attribution.json.
   Pexels License — free for commercial use, attribution appreciated. */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const ROOT = path.resolve(__dirname, "..");

/* Chosen heroes: close-up, facing camera, eyes visible. */
const HEROES = [
  { slug: "basset-hound",                 pexelsId: 35206655, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/portrait-of-a-contemplative-basset-hound-dog-35206655/", desc: "Studio portrait of a Basset Hound facing the camera" },
  { slug: "bichon-frise",                 pexelsId: 17589407, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/bichon-frise-in-scarf-17589407/", desc: "Bichon Frise in a scarf, studio portrait" },
  { slug: "cockapoo",                     pexelsId: 16102951, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/close-up-of-cockapoo-dog-16102951/", desc: "Close-up of a Cockapoo dog" },
  { slug: "german-shorthaired-pointer",   pexelsId: 37005943, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/happy-german-shorthaired-pointer-dog-portrait-37005943/", desc: "Happy German Shorthaired Pointer portrait" },
  { slug: "great-pyrenees",               pexelsId: 14281603, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/close-up-shot-of-a-dog-14281603/", desc: "Close-up portrait of a Great Pyrenees" },
  { slug: "mixed-breed",                  pexelsId: 35511893, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/close-up-portrait-of-a-mixed-breed-dog-35511893/", desc: "Close-up portrait of a mixed-breed dog with a warm expression" },
  { slug: "pembroke-welsh-corgi",         pexelsId: 25772143, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/portrait-of-pembroke-welsh-corgi-dog-25772143/", desc: "Portrait of a Pembroke Welsh Corgi" },
  { slug: "west-highland-white-terrier",  pexelsId: 11001374, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/west-highland-white-terrier-close-up-photo-11001374/", desc: "Close-up of a West Highland White Terrier" },
  { slug: "devon-rex",                    pexelsId: 23427643, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/close-up-of-a-big-eyed-devon-rex-cat-23427643/", desc: "Close-up of a big-eyed Devon Rex cat" },
  { slug: "domestic-shorthair",           pexelsId: 35932784, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/close-up-portrait-of-a-domestic-tabby-cat-35932784/", desc: "Close-up portrait of a domestic tabby cat" },
  { slug: "exotic-shorthair",             pexelsId: 35316397, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/adorable-exotic-shorthair-cat-portrait-35316397/", desc: "Close-up portrait of an Exotic Shorthair cat" },
  { slug: "siberian-cat",                 pexelsId: 36697978, artist: "Pexels Creator", pageUrl: "https://www.pexels.com/photo/fluffy-siberian-cat-with-striking-green-eyes-36697978/", desc: "Fluffy Siberian cat with striking green eyes" }
];

function imageUrl(id) {
  /* Pexels CDN — request a reasonable hero size with auto-compression. */
  return "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=1600";
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
          fs.unlinkSync(dest);
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

async function main() {
  var done = 0, failed = [];
  await Promise.all(HEROES.map(async function (h) {
    var dir = path.join(ROOT, "breeds", h.slug + "-cost");
    if (!fs.existsSync(dir)) {
      console.error("Skipping " + h.slug + " — page dir doesn't exist");
      failed.push(h.slug);
      return;
    }
    var dest = path.join(dir, "hero.jpg");
    try {
      await download(imageUrl(h.pexelsId), dest);
      /* Write credit json */
      fs.writeFileSync(path.join(dir, "credit.json"), JSON.stringify({
        slug: h.slug,
        source: "Pexels",
        artist: h.artist,
        license: "Pexels License (free for commercial use, attribution appreciated)",
        source_url: h.pageUrl,
        description: h.desc
      }, null, 2), "utf8");
      done++;
      console.log("✓ " + h.slug + " (" + h.pexelsId + ")");
    } catch (e) {
      failed.push(h.slug + ": " + e.message);
      console.error("✗ " + h.slug + " — " + e.message);
    }
  }));
  console.log("\nDownloaded: " + done + "/" + HEROES.length);
  if (failed.length) console.log("Failed: " + failed.join(", "));
}

main().catch(function (e) { console.error(e); process.exit(1); });
