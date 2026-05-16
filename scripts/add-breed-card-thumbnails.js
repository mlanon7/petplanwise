#!/usr/bin/env node
/* Inject a thumbnail <img> into each breed-card on breeds/index.html.
   Pattern:
     <a class="card card-link breed-card" ... href="/breeds/SLUG-cost/">
       <h3>NAME</h3>
       <p class="muted">BLURB</p>
     </a>
   becomes:
     <a class="card card-link breed-card" ... href="/breeds/SLUG-cost/">
       <div class="breed-card-body">
         <h3>NAME</h3>
         <p class="muted">BLURB</p>
       </div>
       <span class="breed-card-thumb">
         <img src="/breeds/SLUG-cost/hero.jpg?v=20260515c" alt="" loading="lazy"
              width="84" height="84" decoding="async">
       </span>
     </a>
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "breeds/index.html");
const CACHE_BUST = "20260515c";

let html = fs.readFileSync(FILE, "utf8");

let changed = 0;
let skipped = 0;
let missing = 0;

// Match each breed-card anchor, capture slug + inner content
const re = /<a\s+class="card card-link breed-card"([^>]*?)href="\/breeds\/([^"\/]+)\/"([^>]*)>([\s\S]*?)<\/a>/g;

html = html.replace(re, function (match, preHref, slugWithCost, postHref, inner) {
  // If we already injected, skip
  if (inner.indexOf("breed-card-thumb") >= 0) {
    skipped++;
    return match;
  }
  // Find the hero file extension (jpg/png/webp) on disk
  const breedDir = path.join(ROOT, "breeds", slugWithCost);
  let heroFile = null;
  for (const ext of ["jpg", "png", "webp"]) {
    if (fs.existsSync(path.join(breedDir, "hero." + ext))) { heroFile = "hero." + ext; break; }
  }
  if (!heroFile) {
    console.log("  no hero for " + slugWithCost + " — leaving card alone");
    missing++;
    return match;
  }
  // Extract breed display name for alt text
  const nameMatch = inner.match(/<h3>([^<]+)<\/h3>/);
  const displayName = nameMatch ? nameMatch[1].trim() : slugWithCost.replace(/-cost$/, "").replace(/-/g, " ");

  const newInner =
    '<div class="breed-card-body">' + inner.trim() + '</div>' +
    '<span class="breed-card-thumb" aria-hidden="true">' +
    '<img src="/breeds/' + slugWithCost + '/' + heroFile + '?v=' + CACHE_BUST + '" alt="" loading="lazy" width="84" height="84" decoding="async">' +
    '</span>';

  changed++;
  return '<a class="card card-link breed-card"' + preHref + 'href="/breeds/' + slugWithCost + '/"' + postHref + '>' + newInner + '</a>';
});

fs.writeFileSync(FILE, html, "utf8");
console.log("\nThumbnails injected: " + changed + " | skipped (already done): " + skipped + " | no hero: " + missing);
