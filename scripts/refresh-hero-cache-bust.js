#!/usr/bin/env node
/* Update all `hero.jpg?v=...` (and hero.svg?v=...) cache-bust query
   strings to the current site version. Hero img refs were never
   covered by bump-cache-bust.js, so they stayed pinned to v=20260510d
   from May 10 — browsers and Vercel CDN cached the old images by URL
   and never refetched after we swapped photos. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const NEW_V = "20260516h";

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === ".git" || e.name === "node_modules" || e.name === ".vercel" || e.name === ".claude") continue;
      walk(path.join(dir, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

const files = walk(ROOT, []);
let changed = 0;
const re = /(hero\.(jpg|svg|png|webp))\?v=[a-z0-9]+/g;

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  if (!re.test(html)) { re.lastIndex = 0; continue; }
  re.lastIndex = 0;
  const fixed = html.replace(re, '$1?v=' + NEW_V);
  if (fixed !== html) {
    fs.writeFileSync(f, fixed, "utf8");
    changed++;
  }
}
console.log("Updated " + changed + " of " + files.length + " HTML files to hero v=" + NEW_V);
