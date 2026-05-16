#!/usr/bin/env node
/* For each of the 12 newly-added breeds, swap the hero <img> in the
   breed page from hero.svg to hero.jpg, and update the hero <img>
   width/height to reflect the actual JPEG dimensions.
   Also delete the hero.svg placeholder.
   Finally, update breeds/index.html cards (thumbnails) to use hero.jpg. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SLUGS = [
  "basset-hound", "bichon-frise", "cockapoo", "german-shorthaired-pointer",
  "great-pyrenees", "mixed-breed", "pembroke-welsh-corgi",
  "west-highland-white-terrier", "devon-rex", "domestic-shorthair",
  "exotic-shorthair", "siberian-cat"
];

function pngDims(buf) {
  if (buf.length < 24) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
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
function readDims(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] === 0x89 && buf[1] === 0x50) return pngDims(buf);
  if (buf[0] === 0xff && buf[1] === 0xd8) return jpgDims(buf);
  return null;
}

var pagesTouched = 0;
SLUGS.forEach(function (slug) {
  var dir = path.join(ROOT, "breeds", slug + "-cost");
  var jpgPath = path.join(dir, "hero.jpg");
  var svgPath = path.join(dir, "hero.svg");
  var htmlPath = path.join(dir, "index.html");
  if (!fs.existsSync(jpgPath) || !fs.existsSync(htmlPath)) {
    console.error("Skip " + slug + ": missing hero.jpg or index.html");
    return;
  }
  var dims = readDims(jpgPath);
  if (!dims) { console.error("Skip " + slug + ": could not read jpg dims"); return; }

  var html = fs.readFileSync(htmlPath, "utf8");
  /* Replace the <img src="...hero.svg" width="1200" height="630" ...> */
  var re = /<img src="(\/breeds\/[^"]+)\/hero\.svg" width="\d+" height="\d+"/;
  if (!re.test(html)) {
    console.error("No SVG hero <img> found in " + slug);
    return;
  }
  html = html.replace(re, '<img src="$1/hero.jpg" width="' + dims.width + '" height="' + dims.height + '"');
  fs.writeFileSync(htmlPath, html, "utf8");
  pagesTouched++;
  console.log("Updated " + slug + " (" + dims.width + "x" + dims.height + ")");

  /* Delete SVG placeholder */
  if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
});

/* Update breeds/index.html cards: hero.svg -> hero.jpg for these 12 slugs */
var hubPath = path.join(ROOT, "breeds", "index.html");
var hub = fs.readFileSync(hubPath, "utf8");
var hubChanged = 0;
SLUGS.forEach(function (slug) {
  var oldStr = "/breeds/" + slug + "-cost/hero.svg";
  var newStr = "/breeds/" + slug + "-cost/hero.jpg";
  var before = hub.split(oldStr).length - 1;
  hub = hub.split(oldStr).join(newStr);
  hubChanged += before;
});
fs.writeFileSync(hubPath, hub, "utf8");

console.log("\nPages updated: " + pagesTouched);
console.log("Hub references swapped: " + hubChanged);
