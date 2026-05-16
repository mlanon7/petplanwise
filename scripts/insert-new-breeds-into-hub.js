#!/usr/bin/env node
/* Insert the 12 new breeds into breeds/index.html.
   Idempotent: skips if a slug is already present.
   Approach: build new card lines, locate each grid-3 closing tag,
   inject sorted in alphabetical order with existing.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const HUB = path.join(ROOT, "breeds", "index.html");
const CACHE_V = "20260516e";

var NEW_BREEDS = [
  /* dogs */
  { slug: "basset-hound", species: "dog", name: "Basset Hound", blurb: "Long back + drop ears; IVDD and chronic ear infections." },
  { slug: "bichon-frise", species: "dog", name: "Bichon Frise", blurb: "Allergic dermatitis common; monthly grooming mandatory." },
  { slug: "cockapoo", species: "dog", name: "Cockapoo", blurb: "Cocker x Poodle cross; ear infections and grooming drive cost." },
  { slug: "german-shorthaired-pointer", species: "dog", name: "German Shorthaired Pointer", blurb: "Very high energy; bloat risk; needs daily intense exercise." },
  { slug: "great-pyrenees", species: "dog", name: "Great Pyrenees", blurb: "Giant breed; bone-cancer risk; everything scales with body size." },
  { slug: "mixed-breed", species: "dog", name: "Mixed Breed Dog", blurb: "Hybrid vigor; lowest lifetime cost; adoption-fee pricing." },
  { slug: "pembroke-welsh-corgi", species: "dog", name: "Pembroke Welsh Corgi", blurb: "Long back; IVDD, degenerative myelopathy, hip dysplasia risks." },
  { slug: "west-highland-white-terrier", species: "dog", name: "West Highland White Terrier", blurb: "Atopic dermatitis famous in the breed; Westie lung disease." },
  /* cats */
  { slug: "devon-rex", species: "cat", name: "Devon Rex", blurb: "Wavy coat, very low shedding; HCM screening recommended." },
  { slug: "domestic-shorthair", species: "cat", name: "Domestic Shorthair", blurb: "Most common U.S. cat; hybrid vigor; cheapest cat to own." },
  { slug: "exotic-shorthair", species: "cat", name: "Exotic Shorthair", blurb: "\"Persian in pajamas\"; PKD + dental + eye care drive costs." },
  { slug: "siberian-cat", species: "cat", name: "Siberian Cat", blurb: "Heavy triple coat; lower Fel d 1; HCM screening recommended." }
];

function cardLine(b) {
  return '      <a class="card card-link breed-card" data-species="' + b.species +
    '" data-name="' + b.name.toLowerCase() +
    '" data-blurb="' + b.blurb.toLowerCase().replace(/"/g, '&quot;') +
    '" href="/breeds/' + b.slug + '-cost/"><div class="breed-card-body"><h3>' +
    b.name + '</h3><p class="muted">' + b.blurb.replace(/"/g, '&quot;') +
    '</p></div><span class="breed-card-thumb" aria-hidden="true"><img src="/breeds/' +
    b.slug + '-cost/hero.svg?v=' + CACHE_V +
    '" alt="" loading="lazy" width="84" height="84" decoding="async"></span></a>';
}

var html = fs.readFileSync(HUB, "utf8");

function injectIntoGroup(html, species, breeds) {
  /* Find the group's opening grid-3 div. */
  var groupAnchor = 'id="breed-group-' + species + '"';
  var anchorIdx = html.indexOf(groupAnchor);
  if (anchorIdx < 0) throw new Error("Group anchor not found: " + species);
  var gridOpen = html.indexOf('<div class="grid grid-3">', anchorIdx);
  if (gridOpen < 0) throw new Error("Grid open not found: " + species);
  /* The grid-3 close is the next "      </div>" line (cards are indented one level deeper). */
  /* Find the close: scan forward, count <a tags vs </a>, then find the </div> after the last </a>. */
  var afterGrid = html.indexOf('>', gridOpen) + 1;
  /* All cards are single-line <a ...>...</a>. Find them. */
  var cardRe = /<a class="card card-link breed-card"[^>]*>[\s\S]*?<\/a>/g;
  cardRe.lastIndex = afterGrid;
  var existing = [];
  var lastEnd = afterGrid;
  var m;
  while ((m = cardRe.exec(html)) !== null) {
    /* Stop scanning if we hit the closing </div> of grid-3 */
    var closingDivIdx = html.indexOf('</div>', lastEnd);
    if (m.index > closingDivIdx && closingDivIdx > 0) break;
    existing.push({
      name: (m[0].match(/data-name="([^"]+)"/) || [, ""])[1],
      raw: m[0],
      href: (m[0].match(/href="([^"]+)"/) || [, ""])[1]
    });
    lastEnd = cardRe.lastIndex;
  }
  /* Find the grid close (the </div> that ends the grid-3 container). */
  var gridClose = html.indexOf('      </div>', lastEnd);
  if (gridClose < 0) throw new Error("Grid close not found: " + species);

  /* Build merged sorted list, dedupe by href */
  var seen = {};
  var merged = [];
  existing.forEach(function (e) {
    if (seen[e.href]) return;
    seen[e.href] = 1;
    merged.push({ name: e.name, line: "      " + e.raw });
  });
  breeds.forEach(function (b) {
    var href = "/breeds/" + b.slug + "-cost/";
    if (seen[href]) return;
    seen[href] = 1;
    merged.push({ name: b.name.toLowerCase(), line: cardLine(b) });
  });
  merged.sort(function (a, b) { return a.name.localeCompare(b.name); });

  var newGridBody = merged.map(function (x) { return x.line; }).join("\n") + "\n      ";
  /* Replace from afterGrid to gridClose */
  return html.substring(0, afterGrid) + "\n" + newGridBody + html.substring(gridClose);
}

html = injectIntoGroup(html, "dog", NEW_BREEDS.filter(function (b) { return b.species === "dog"; }));
html = injectIntoGroup(html, "cat", NEW_BREEDS.filter(function (b) { return b.species === "cat"; }));

/* Update visible-count spans */
html = html.replace('<span class="visible-count" id="visible-count-dog">40 breeds</span>',
                    '<span class="visible-count" id="visible-count-dog">48 breeds</span>');
html = html.replace('<span class="visible-count" id="visible-count-cat">14 breeds</span>',
                    '<span class="visible-count" id="visible-count-cat">18 breeds</span>');

/* Append new entries to ItemList JSON-LD */
var ilMatch = html.match(/"@type":"ItemList","itemListElement":\[(.*?)\]\}/);
if (ilMatch) {
  var posMatches = ilMatch[1].match(/"position":(\d+)/g) || [];
  var maxPos = 0;
  posMatches.forEach(function (m) {
    var n = parseInt(m.match(/\d+/)[0], 10);
    if (n > maxPos) maxPos = n;
  });
  /* Check if already added */
  var alreadyHas = NEW_BREEDS.every(function (b) {
    return ilMatch[1].indexOf("/breeds/" + b.slug + "-cost/") >= 0;
  });
  if (!alreadyHas) {
    var newItemsJson = NEW_BREEDS.map(function (b, i) {
      return ',{"@type":"ListItem","position":' + (maxPos + 1 + i) +
        ',"name":' + JSON.stringify(b.name) +
        ',"url":' + JSON.stringify("https://petplanwise.com/breeds/" + b.slug + "-cost/") + '}';
    }).join("");
    html = html.replace('"@type":"ItemList","itemListElement":[' + ilMatch[1] + ']}',
                        '"@type":"ItemList","itemListElement":[' + ilMatch[1] + newItemsJson + ']}');
  }
}

fs.writeFileSync(HUB, html, "utf8");

/* Verify */
var dogCount = (html.match(/data-species="dog"/g) || []).length;
var catCount = (html.match(/data-species="cat"/g) || []).length;
console.log("Dog cards in hub: " + dogCount + " (expected 48)");
console.log("Cat cards in hub: " + catCount + " (expected 18)");
