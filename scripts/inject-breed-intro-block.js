#!/usr/bin/env node
/* Add a "Breed snapshot" block to every breed page, positioned between
   the hero photo and the cost lede paragraph.

   The block contains:
     - A one-sentence breed intro (built from temperament + first top_fact)
     - Four quick-trait chips: weight, energy, kid-friendliness, time-alone

   Source: assets/data/csv/breed-traits.csv (already loaded for compare /
   find-my-breed). One-shot edit; idempotent — skips pages that already
   contain the marker comment.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const TRAITS_CSV = path.join(ROOT, "assets/data/csv/breed-traits.csv");
const BREEDS_CSV = path.join(ROOT, "assets/data/csv/breeds.csv");

/* Tiny CSV parser */
function parseCSV(text) {
  var rows = [], row = [], field = "", inQ = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inQ) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field.length || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
      } else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  var header = rows[0];
  return rows.slice(1).map(function (r) {
    var o = {};
    header.forEach(function (h, i) { o[h] = (r[i] || "").trim(); });
    return o;
  });
}
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

var traitsRows = parseCSV(fs.readFileSync(TRAITS_CSV, "utf8"));
var traitsBySlug = {};
traitsRows.forEach(function (r) { traitsBySlug[r.slug] = r; });

var breedsRows = parseCSV(fs.readFileSync(BREEDS_CSV, "utf8"));
var breedsBySlug = {};
breedsRows.forEach(function (r) { breedsBySlug[r.slug] = r; });

/* Legacy cat slugs use -cat-cost; everything else -cost */
var CAT_LEGACY = { "bengal":1, "british-shorthair":1, "maine-coon":1, "persian":1, "ragdoll":1, "scottish-fold":1, "siamese":1, "sphynx":1 };
function pageDir(slug) {
  var suffix = CAT_LEGACY[slug] ? "-cat-cost" : "-cost";
  return path.join(ROOT, "breeds", slug + suffix);
}

function energyDots(n) {
  n = parseInt(n, 10);
  if (!n || n < 1) n = 3;
  return "●".repeat(Math.min(n, 5)) + "○".repeat(Math.max(0, 5 - n));
}
function kidLabel(v) {
  if (v === "high") return { text: "Great with kids", emoji: "👶" };
  if (v === "medium") return { text: "Best with respectful kids", emoji: "🧒" };
  return { text: "Adult-only home best", emoji: "👤" };
}
function sizeLabel(b) {
  var sz = (b && b.size) || "";
  var name = b && b.name ? b.name : "";
  /* Use the breeds.csv `size` field. */
  var map = {
    "small": "Small breed",
    "medium": "Medium breed",
    "large": "Large breed",
    "giant": "Giant breed"
  };
  return map[sz] || "Mixed size";
}
function buildIntro(b, t) {
  if (!t) return "";
  /* Build a single sentence from temperament + first top_fact. */
  var temperament = (t.temperament || "").trim();
  var firstFact = (t.top_facts_pipe || "").split("|")[0].trim();
  var species = b && b.species === "cat" ? "cat" : "dog";
  /* If we have temperament, lead with that. Otherwise lead with the fact. */
  var sentence;
  if (temperament && firstFact) {
    /* temperament e.g. "Friendly outgoing eager-to-please" — lowercase, finish sentence */
    var temp = temperament.charAt(0).toLowerCase() + temperament.slice(1);
    sentence = "The " + b.name + " is a " + temp + " " + species + ". " + firstFact + ".";
  } else if (firstFact) {
    sentence = firstFact + ".";
  } else if (temperament) {
    sentence = "The " + b.name + " is known for being " + temperament.toLowerCase() + ".";
  } else {
    sentence = "";
  }
  /* Clean up double periods, etc. */
  sentence = sentence.replace(/\.\.+/g, ".").replace(/ +/g, " ");
  return sentence;
}

function buildBlockHtml(slug) {
  var t = traitsBySlug[slug];
  var b = breedsBySlug[slug];
  if (!t || !b) return null;
  var intro = buildIntro(b, t);
  var size = sizeLabel(b);
  var dots = energyDots(t.energy_1to5);
  var kid = kidLabel(t.kid_friendly);
  var alone = (t.alone_hours || "").trim() || "—";
  var weight = (t.weight_male_lb || "").trim();
  var weightLabel = weight ? weight + " lb" : size;
  return '\n  <section class="breed-snapshot" style="padding: 6px 0 18px;"><div class="container">\n' +
    '    <p class="breed-snapshot-intro" style="margin: 0 0 14px; color: var(--ink-2, #4B5563); font-size: 1.02rem; line-height: 1.55; max-width: 720px;">' + escapeHtml(intro) + '</p>\n' +
    '    <div class="breed-snapshot-chips" style="display:flex;flex-wrap:wrap;gap:8px;">\n' +
    '      <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">⚖️ ' + escapeHtml(weightLabel) + '</span>\n' +
    '      <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">⚡ Energy <span style="font-family:monospace;letter-spacing:1px;">' + dots + '</span></span>\n' +
    '      <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">' + kid.emoji + ' ' + escapeHtml(kid.text) + '</span>\n' +
    '      <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">🕒 Alone ' + escapeHtml(alone) + ' hrs</span>\n' +
    '    </div>\n' +
    '  </div></section>\n';
}

var touched = 0, skipped = 0, missing = 0;
var allSlugs = Object.keys(traitsBySlug);
allSlugs.forEach(function (slug) {
  var dir = pageDir(slug);
  var htmlPath = path.join(dir, "index.html");
  if (!fs.existsSync(htmlPath)) { missing++; return; }
  var html = fs.readFileSync(htmlPath, "utf8");

  /* Idempotent: skip if marker already present */
  if (html.indexOf('class="breed-snapshot"') >= 0) { skipped++; return; }

  /* Insert AFTER the </section> that wraps the hero figure + cost lede.
     Pattern of existing breed pages: hero <figure> -> cost lede <p> ->
     </div></section>. The next section opens the calculator. We want to
     insert the snapshot block BEFORE the calculator section (which
     contains data-calculator="dog" or "cat"). */
  var block = buildBlockHtml(slug);
  if (!block) { missing++; return; }

  var calcMatch = /<section[^>]*><div class="container"><div\s+data-calculator=/i.exec(html);
  if (!calcMatch) { skipped++; return; }
  var insertAt = calcMatch.index;
  var newHtml = html.substring(0, insertAt) + block + html.substring(insertAt);
  fs.writeFileSync(htmlPath, newHtml, "utf8");
  touched++;
});

console.log("Breed-snapshot injected: " + touched);
console.log("Skipped (already had block or no calculator marker): " + skipped);
console.log("Missing trait/breed/html: " + missing);
