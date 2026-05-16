#!/usr/bin/env node
/* 1) Replace breadcrumb separator <span>/</span> with <span>›</span>.
   2) Add aria-label="Breadcrumb" to any <nav class="breadcrumbs"> missing it.
   Scope: HTML breadcrumb nav blocks only (not random / characters elsewhere).
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
let touched = 0, sepFixed = 0, ariaFixed = 0;

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  const orig = html;

  // 1) Inside any <nav class="breadcrumbs">...</nav>, swap <span>/</span> for <span>›</span>.
  html = html.replace(
    /<nav\b[^>]*\bclass=["'][^"']*\bbreadcrumbs\b[^"']*["'][^>]*>([\s\S]*?)<\/nav>/gi,
    function (match, inner) {
      const fixed = inner.replace(/<span>\s*\/\s*<\/span>/g, "<span>›</span>");
      if (fixed !== inner) sepFixed++;
      return match.replace(inner, fixed);
    }
  );

  // 2) Add aria-label="Breadcrumb" to <nav class="breadcrumbs"> tags lacking it.
  html = html.replace(
    /<nav\b([^>]*\bclass=["'][^"']*\bbreadcrumbs\b[^"']*["'][^>]*)>/gi,
    function (match, attrs) {
      if (/\baria-label\s*=/i.test(attrs)) return match;
      ariaFixed++;
      return "<nav" + attrs + ' aria-label="Breadcrumb">';
    }
  );

  if (html !== orig) {
    fs.writeFileSync(f, html, "utf8");
    touched++;
  }
}
console.log("Files touched: " + touched + " | separator swaps: " + sepFixed + " | aria-label added: " + ariaFixed);
