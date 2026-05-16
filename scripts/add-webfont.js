#!/usr/bin/env node
/* Inject Google Fonts preconnect + Inter stylesheet link into every
   HTML <head>, immediately before the site stylesheet link. Idempotent.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const MARKER = "data-ppw-inter";
const FONT_BLOCK =
  '\n  <link rel="preconnect" href="https://fonts.googleapis.com" ' + MARKER + '>' +
  '\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin ' + MARKER + '>' +
  '\n  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" ' + MARKER + '>';

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
for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  if (html.indexOf(MARKER) >= 0) continue; // already injected

  // Insert just before the site stylesheet link if present
  const styleRe = /<link\s+rel=["']stylesheet["']\s+href=["']\/assets\/css\/site\.css[^"']*["']\s*\/?>/i;
  if (styleRe.test(html)) {
    html = html.replace(styleRe, function (m) { return FONT_BLOCK + "\n  " + m; });
  } else if (html.indexOf("</head>") >= 0) {
    html = html.replace("</head>", FONT_BLOCK + "\n</head>");
  } else {
    continue;
  }
  fs.writeFileSync(f, html, "utf8");
  touched++;
}
console.log("Injected Inter webfont in " + touched + " HTML files");
