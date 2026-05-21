#!/usr/bin/env node
/* Data-driven SEO fix from GSC: people search "[breed] price" far more
   than "[breed] cost", and our breed pages rank ~10-11 for price queries
   while being titled around "cost". This sweep adds the "price" keyword:

   1. Title -> "{Breed} Cost & Price (2026) | PetPlanWise" (uniform,
      targets both keywords; replaces inconsistent editorial titles)
   2. og:title + twitter:title synced
   3. meta description: ensure it contains "price" (append a clause if not)
   4. breed-snapshot block: add a 💵 purchase-price chip with real
      $low-$high from breeds.csv (genuinely useful + adds keyword to body)

   Idempotent: skips a page that already has "Cost & Price" in its title. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function parseCSV(text) {
  var rows = [], row = [], field = "", inQ = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inQ) { if (c === '"' && text[i+1] === '"') { field += '"'; i++; } else if (c === '"') inQ = false; else field += c; }
    else { if (c === '"') inQ = true; else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") { if (field.length || row.length) { row.push(field); rows.push(row); row=[]; field=""; } }
      else field += c; }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  var header = rows[0];
  return rows.slice(1).filter(function(r){return r[0];}).map(function(r){var o={};header.forEach(function(h,i){o[h]=r[i]||"";});return o;});
}
function fmtMoney(n) { n = parseInt(n, 10); return isFinite(n) ? "$" + n.toLocaleString("en-US") : ""; }

var CAT_LEGACY = { "bengal":1,"british-shorthair":1,"maine-coon":1,"persian":1,"ragdoll":1,"scottish-fold":1,"siamese":1,"sphynx":1 };
function pageDir(slug) {
  var s1 = path.join(ROOT, "breeds", slug + (CAT_LEGACY[slug] ? "-cat-cost" : "-cost"));
  if (fs.existsSync(s1)) return s1;
  var s2 = path.join(ROOT, "breeds", slug + "-cost");
  if (fs.existsSync(s2)) return s2;
  return null;
}

var breeds = parseCSV(fs.readFileSync(path.join(ROOT, "assets/data/csv/breeds.csv"), "utf8"));

var titleUpdated = 0, chipAdded = 0, descUpdated = 0, skipped = 0;

breeds.forEach(function (b) {
  var dir = pageDir(b.slug);
  if (!dir) { return; }
  var htmlPath = path.join(dir, "index.html");
  if (!fs.existsSync(htmlPath)) return;
  var html = fs.readFileSync(htmlPath, "utf8");
  var orig = html;

  /* 1+2. Title (and og/twitter) -> "{Name} Cost & Price (2026) | PetPlanWise" */
  var newTitle = b.name + " Cost & Price (2026) | PetPlanWise";
  if (html.indexOf("Cost & Price") === -1 && html.indexOf("Cost &amp; Price") === -1) {
    /* Replace <title>...</title> */
    html = html.replace(/<title>[^<]*<\/title>/, "<title>" + newTitle.replace(/&/g, "&amp;") + "</title>");
    /* og:title + twitter:title */
    html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, "$1" + newTitle.replace(/&/g, "&amp;") + "$2");
    html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, "$1" + newTitle + "$2");
    titleUpdated++;
  } else {
    skipped++;
  }

  /* 3. meta description: ensure it contains the word "price" */
  var dm = html.match(/<meta name="description" content="([^"]*)"/);
  if (dm && dm[1].toLowerCase().indexOf("price") === -1) {
    var purchaseClause = "";
    if (b.purchase_low && b.purchase_high) {
      purchaseClause = " Typical " + b.name + " price: " + fmtMoney(b.purchase_low) + "–" + fmtMoney(b.purchase_high) + ".";
    } else {
      purchaseClause = " See typical " + b.name + " price + lifetime cost.";
    }
    var newDesc = dm[1].replace(/\s+$/, "") + purchaseClause;
    /* keep under ~165 chars */
    if (newDesc.length > 165) newDesc = newDesc.slice(0, 162).replace(/\s+\S*$/, "") + "…";
    html = html.split('content="' + dm[1] + '"').join('content="' + newDesc + '"');
    descUpdated++;
  }

  /* 4. Add a price chip to the snapshot block (first chip) */
  if (html.indexOf("breed-snapshot-chips") >= 0 && html.indexOf("💵 ") === -1) {
    var priceLabel;
    if (parseInt(b.purchase_low, 10) === 0) {
      priceLabel = "💵 Price: " + fmtMoney(b.purchase_typical) + " (adopt)";
    } else {
      priceLabel = "💵 Price: " + fmtMoney(b.purchase_low) + "–" + fmtMoney(b.purchase_high);
    }
    var chip = '<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">' + priceLabel + '</span>';
    /* insert right after the opening chips div. Use a replacement FUNCTION
       so the "$" in dollar amounts isn't interpreted as a regex backreference. */
    html = html.replace(/(<div class="breed-snapshot-chips"[^>]*>\s*)/, function (m) {
      return m + chip + "\n      ";
    });
    chipAdded++;
  }

  if (html !== orig) fs.writeFileSync(htmlPath, html, "utf8");
});

console.log("Titles updated to 'Cost & Price': " + titleUpdated);
console.log("Price chips added to snapshot: " + chipAdded);
console.log("Meta descriptions augmented with price: " + descUpdated);
console.log("Skipped (already had Cost & Price): " + skipped);
