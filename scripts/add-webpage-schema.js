#!/usr/bin/env node
/* Audit P1 #19: add WebPage / CollectionPage JSON-LD to the 5 legal /
   meta pages that currently have none. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const PAGES = [
  { dir: "affiliate-disclosure", type: "WebPage", name: "Affiliate Disclosure", desc: "How PetPlanWise handles affiliate links, editorial recommendations, and paid placements." },
  { dir: "privacy",              type: "WebPage", name: "Privacy Policy",       desc: "How PetPlanWise collects, uses, and protects visitor data." },
  { dir: "sources",              type: "CollectionPage", name: "Sources & Bibliography", desc: "Full bibliography for PetPlanWise pet cost calculators and breed pages — AVMA, NAPHIA, BLS CPI, AAHA, OFA, C-BARQ, and more." },
  { dir: "terms",                type: "WebPage", name: "Terms of Use",         desc: "Terms governing use of PetPlanWise pet cost calculators, content, and embeds." },
  { dir: "embed",                type: "CollectionPage", name: "PetPlanWise Embeds", desc: "Iframe-embeddable PetPlanWise pet cost calculators for partner sites." }
];

function escapeJson(s) { return JSON.stringify(String(s)); }

PAGES.forEach(function (p) {
  var file = path.join(ROOT, p.dir, "index.html");
  if (!fs.existsSync(file)) { console.log("Skipping " + p.dir + " — index.html not found"); return; }
  var html = fs.readFileSync(file, "utf8");
  if (html.indexOf("application/ld+json") >= 0) { console.log(p.dir + " — already has JSON-LD, skipping"); return; }

  var url = "https://petplanwise.com/" + p.dir + "/";
  var schema = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"' + p.type +
    '","name":' + escapeJson(p.name) +
    ',"url":' + escapeJson(url) +
    ',"description":' + escapeJson(p.desc) +
    ',"inLanguage":"en-US","isPartOf":{"@type":"WebSite","name":"PetPlanWise","url":"https://petplanwise.com/"}}</script>';

  /* Insert just before </head> */
  var idx = html.indexOf("</head>");
  if (idx < 0) { console.log(p.dir + " — no </head>, skipping"); return; }
  html = html.substring(0, idx) + "  " + schema + "\n" + html.substring(idx);
  fs.writeFileSync(file, html, "utf8");
  console.log("Added " + p.type + " schema to /" + p.dir + "/");
});
