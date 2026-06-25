#!/usr/bin/env node
/* add-theme-init.js (one-shot, idempotent)
   Inserts a tiny synchronous <head> script that resolves the effective theme
   (stored choice, else system preference) and sets <html data-theme> BEFORE
   first paint — so dark mode never flashes light. Runs once per page; the
   data-theme-init marker keeps re-runs from double-inserting. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set([".git", "node_modules", ".vercel", ".claude"]);

/* Defaults to LIGHT (the original look). Dark only when the visitor has
   explicitly chosen it via the header toggle — we no longer auto-switch to
   dark from the OS preference, since the light theme is the brand default. */
const SNIPPET =
  '<script data-theme-init>(function(){try{' +
  'document.documentElement.setAttribute("data-theme",localStorage.getItem("ppw-theme")==="dark"?"dark":"light");' +
  '}catch(e){}})();</script>';

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (SKIP.has(e.name)) continue; walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

let updated = 0, added = 0, nohead = 0;
for (const f of walk(ROOT, [])) {
  let html = fs.readFileSync(f, "utf8");
  const had = html.indexOf("data-theme-init") !== -1;
  if (had) html = html.replace(/\n?<script data-theme-init>[\s\S]*?<\/script>/, "");
  const idx = html.indexOf("<head>");
  if (idx === -1) { nohead++; continue; }
  const at = idx + "<head>".length;
  html = html.slice(0, at) + "\n" + SNIPPET + html.slice(at);
  fs.writeFileSync(f, html, "utf8");
  if (had) updated++; else added++;
}
console.log("theme-init updated: " + updated + ", newly added: " + added + ", no <head>: " + nohead);
