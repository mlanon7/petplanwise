#!/usr/bin/env node
/* Catches the variant breed-title pattern that shorten-long-titles.js
   missed: "<Breed> Cost — Annual, First Year & Lifetime (2026)".
   Same target shape: "<Breed> Cost (2026) | PetPlanWise". */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function walk(d, out) {
  for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    if (e.isDirectory()) {
      if ([".git","node_modules",".vercel",".claude"].includes(e.name)) continue;
      walk(path.join(d, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) out.push(path.join(d, e.name));
  }
  return out;
}

const re = /<title>([^<]+?) Cost — Annual, First Year (?:&amp;|&) Lifetime \(2026\)<\/title>/;

const files = walk(ROOT, []);
let touched = 0;
for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  const m = html.match(re);
  if (!m) continue;
  const oldPlain = m[0].replace(/^<title>/, "").replace(/<\/title>$/, "");
  const newPlain = m[1] + " Cost (2026) | PetPlanWise";
  const newTitle = "<title>" + newPlain + "</title>";
  html = html.replace(re, newTitle);
  /* Also any matching og:title / twitter:title with the same content */
  const escOld = oldPlain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  html = html.replace(new RegExp('content="' + escOld + '"', "g"), 'content="' + newPlain + '"');
  fs.writeFileSync(f, html, "utf8");
  touched++;
}
console.log("Touched " + touched + " pages");
