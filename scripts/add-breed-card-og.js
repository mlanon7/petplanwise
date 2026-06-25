#!/usr/bin/env node
/* add-breed-card-og.js (one-shot, idempotent)
   Points each breed page's og:image + twitter:image at its own breed cost card
   (breeds/<dir>/card.png) instead of the generic /assets/og-image.png, so link
   previews on social and Pinterest show the breed-specific cost card. Only the
   two image META tags are touched (JSON-LD/logo references are left alone). The
   width/height (1200x630) already match the card. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const GENERIC = "https://petplanwise.com/assets/og-image.png";

const dirs = fs.readdirSync(path.join(ROOT, "breeds"))
  .filter((n) => /-cost$/.test(n) && n.indexOf("-cost-in-") === -1)
  .filter((n) => fs.existsSync(path.join(ROOT, "breeds", n, "card.png")));

let wired = 0, already = 0;
for (const dir of dirs) {
  const file = path.join(ROOT, "breeds", dir, "index.html");
  let html = fs.readFileSync(file, "utf8");
  const card = "https://petplanwise.com/breeds/" + dir + "/card.png";
  if (html.indexOf(card) !== -1) { already++; continue; }
  const before = html;
  html = html.replace(
    new RegExp('(<meta property="og:image" content=")' + GENERIC.replace(/[.\/]/g, "\\$&") + '(")'),
    "$1" + card + "$2");
  html = html.replace(
    new RegExp('(<meta name="twitter:image" content=")' + GENERIC.replace(/[.\/]/g, "\\$&") + '(")'),
    "$1" + card + "$2");
  if (html !== before) { fs.writeFileSync(file, html, "utf8"); wired++; }
}
console.log("breed card og wired: " + wired + ", already wired: " + already + " (of " + dirs.length + " cards)");
