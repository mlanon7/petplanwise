#!/usr/bin/env node
/* Strip leading 🐕 / 🐈 emoji from <span class="eyebrow"> on breed pages.
   Keeps the breed name as the eyebrow text.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === ".git" || e.name === "node_modules" || e.name === ".vercel") continue;
      walk(path.join(dir, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

const files = walk(ROOT, []);
let touched = 0;
const EYEBROW_RE = /(<span\s+class=["']eyebrow["']>)\s*[\u{1F400}-\u{1F9FF}\u{1F300}-\u{1F5FF}]+\s+/gu;

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  const orig = html;
  html = html.replace(EYEBROW_RE, "$1");
  if (html !== orig) {
    fs.writeFileSync(f, html, "utf8");
    touched++;
  }
}
console.log("Stripped emoji from eyebrow on " + touched + " files");
