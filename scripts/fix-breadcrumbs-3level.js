#!/usr/bin/env node
/* fix-breadcrumbs-3level.js (one-shot, idempotent)
   Upgrades breed/guide/state pages from a 2-level breadcrumb (Home > Page) to
   3-level (Home > Hub > Page) in BOTH the visible <nav class="breadcrumbs"> and
   the BreadcrumbList JSON-LD. Gives ~300 deep pages a static contextual link to
   their section hub + a 3-level breadcrumb rich result. Idempotent: pages
   already 3-level are left unchanged. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const BASE = "https://petplanwise.com";

const HUBS = {
  breeds: { label: "Breeds", href: "/breeds/" },
  guides: { label: "Guides", href: "/guides/" },
  states: { label: "States", href: "/states/" },
};

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) walk(path.join(dir, e.name), out);
    else if (e.name === "index.html") out.push(path.join(dir, e.name));
  }
  return out;
}

let visFixed = 0, ldFixed = 0, unchanged = 0, files = 0;
for (const top of Object.keys(HUBS)) {
  const hub = HUBS[top];
  const dir = path.join(ROOT, top);
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir, [])) {
    if (path.dirname(f) === dir) continue; // skip the hub's own index.html
    files++;
    const before = fs.readFileSync(f, "utf8");
    let html = before;

    // 1) Visible breadcrumb — insert the hub link after "Home >" (skip if present).
    html = html.replace(/<nav class="breadcrumbs"[^>]*>[\s\S]*?<\/nav>/, (nav) => {
      if (nav.indexOf('href="' + hub.href + '"') !== -1) return nav; // already 3-level
      const inserted = nav.replace(
        '<a href="/">Home</a><span>›</span>',
        '<a href="/">Home</a><span>›</span><a href="' + hub.href + '">' + hub.label + '</a><span>›</span>'
      );
      if (inserted !== nav) visFixed++;
      return inserted;
    });

    // 2) BreadcrumbList JSON-LD — insert hub ListItem at position 2, renumber page to 3.
    html = html.replace(
      /<script type="application\/ld\+json">([\s\S]*?"@type":"BreadcrumbList"[\s\S]*?)<\/script>/g,
      (blockText, inner) => {
        let obj;
        try { obj = JSON.parse(inner.trim()); } catch (e) { return blockText; }
        const list = obj.itemListElement;
        if (!Array.isArray(list) || list.length !== 2) return blockText; // only upgrade clean 2-level
        if (list.some((it) => it.item === BASE + hub.href)) return blockText;
        const hubItem = { "@type": "ListItem", position: 2, name: hub.label, item: BASE + hub.href };
        list[1].position = 3;
        obj.itemListElement = [list[0], hubItem, list[1]];
        ldFixed++;
        return '<script type="application/ld+json">' + JSON.stringify(obj) + "</script>";
      }
    );

    if (html !== before) fs.writeFileSync(f, html, "utf8");
    else unchanged++;
  }
}
console.log("files scanned: " + files);
console.log("visible breadcrumbs upgraded: " + visFixed);
console.log("BreadcrumbList JSON-LD upgraded: " + ldFixed);
console.log("unchanged (already 3-level): " + unchanged);
