#!/usr/bin/env node
/* ============================================================
   Wikipedia breed image fetcher — NO API KEY REQUIRED.
   Usage:
     cd "D:\claude projects\petcost-bill"
     node scripts/fetch-images-wikipedia.js

   Downloads the lead image for each breed from Wikipedia's
   public REST API and writes attribution into breed-images.js.
   Wikipedia images are CC-licensed; check each photo's source
   page for the specific license.
   ============================================================ */
"use strict";

const fs = require("fs");
const https = require("https");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const IMG_DIR = path.join(ROOT, "assets/images/breeds");
const OUT_FILE = path.join(ROOT, "assets/data/csv/breed-images.csv");

fs.mkdirSync(IMG_DIR, { recursive: true });

/* Tiny RFC-4180-ish CSV writer for one row at a time */
function csvCell(v) {
  if (v == null) return "";
  var s = String(v);
  if (s.indexOf(",") >= 0 || s.indexOf("\"") >= 0 || s.indexOf("\n") >= 0) {
    return "\"" + s.replace(/"/g, "\"\"") + "\"";
  }
  return s;
}

/* breed slug → Wikipedia article title */
const BREEDS = {
  "labrador-retriever":      "Labrador_Retriever",
  "french-bulldog":          "French_Bulldog",
  "golden-retriever":        "Golden_Retriever",
  "german-shepherd":         "German_Shepherd",
  "chihuahua":               "Chihuahua_(dog_breed)",
  "bulldog":                 "Bulldog",
  "poodle":                  "Poodle",
  "dachshund":               "Dachshund",
  "rottweiler":              "Rottweiler",
  "australian-shepherd":     "Australian_Shepherd",
  "pitbull":                 "American_Pit_Bull_Terrier",
  "beagle":                  "Beagle",
  "boxer":                   "Boxer_(dog)",
  "yorkshire-terrier":       "Yorkshire_Terrier",
  "siberian-husky":          "Siberian_Husky",
  "doberman":                "Dobermann",
  "pug":                     "Pug",
  "shih-tzu":                "Shih_Tzu",
  "cavalier-king-charles":   "Cavalier_King_Charles_Spaniel",
  "boston-terrier":          "Boston_Terrier",
  "mastiff":                 "English_Mastiff",
  "great-dane":              "Great_Dane",
  "pomeranian":              "Pomeranian_dog",
  "border-collie":           "Border_Collie",
  "bernese-mountain-dog":    "Bernese_Mountain_Dog",
  "cane-corso":              "Cane_Corso",
  "miniature-schnauzer":     "Miniature_Schnauzer",
  "cocker-spaniel":          "Cocker_Spaniel",
  "australian-cattle-dog":   "Australian_Cattle_Dog",
  "newfoundland":            "Newfoundland_dog",
  "maine-coon":              "Maine_Coon",
  "ragdoll":                 "Ragdoll",
  "persian":                 "Persian_cat",
  "siamese":                 "Siamese_cat",
  "bengal":                  "Bengal_cat",
  "british-shorthair":       "British_Shorthair",
  "sphynx":                  "Sphynx_cat",
  "scottish-fold":           "Scottish_Fold"
};

/* Friendly display name (for alt text) — derived from slug */
const NICE = (slug) => slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

function fetchBuf(url) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { "User-Agent": "petcostbill-build/1.0 (https://petcostbill.com)" } };
    https.get(url, opts, res => {
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return fetchBuf(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " on " + url));
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

async function getImageUrl(wikiTitle) {
  const url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(wikiTitle);
  const json = JSON.parse((await fetchBuf(url)).toString("utf8"));
  const original = json.originalimage && json.originalimage.source;
  const thumb = json.thumbnail && json.thumbnail.source;
  let imgUrl = original || thumb;
  if (!imgUrl) throw new Error("no image in summary");
  /* If we got a thumbnail URL, upgrade to a 1200px size where the URL pattern allows */
  imgUrl = imgUrl.replace(/\/(\d+)px-/, "/1200px-");
  return {
    imgUrl,
    pageUrl: (json.content_urls && json.content_urls.desktop && json.content_urls.desktop.page) ||
             "https://en.wikipedia.org/wiki/" + wikiTitle,
    title: json.title || wikiTitle.replace(/_/g, " ")
  };
}

(async () => {
  const out = {};
  let ok = 0, fail = 0;
  for (const [slug, title] of Object.entries(BREEDS)) {
    const dest = path.join(IMG_DIR, slug + ".jpg");
    try {
      const meta = await getImageUrl(title);
      const buf = await fetchBuf(meta.imgUrl);
      fs.writeFileSync(dest, buf);
      out[slug] = {
        src: "/assets/images/breeds/" + slug + ".jpg",
        alt: meta.title + " — breed photo",
        credit: "Wikimedia Commons contributors",
        creditUrl: meta.pageUrl,
        license: "Wikimedia Commons (see source page for specific CC license)",
        licenseUrl: meta.pageUrl,
        width: meta.width || "",
        height: meta.height || ""
      };
      console.log("OK   " + slug + "  (" + Math.round(buf.length / 1024) + " KB)");
      ok++;
      await new Promise(r => setTimeout(r, 250));   // polite pacing
    } catch (e) {
      console.error("FAIL " + slug + "  " + e.message);
      fail++;
    }
  }
  /* Write CSV rows — header first, then one row per slug. */
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
  console.log("\n=== Done === OK=" + ok + "  FAIL=" + fail);
  console.log("Wrote " + OUT_FILE);
  console.log("Images in " + IMG_DIR);
})();
