#!/usr/bin/env node
/* ============================================================
   add-og-and-sponsored.js
   Sweeps every *.html under the repo root and:
   1. Adds <meta property="og:description"> if missing,
      mirroring <meta name="description">.
   2. Adds <meta property="og:url"> if missing,
      mirroring <link rel="canonical">.
   3. Ensures any external link to a known affiliate domain
      carries rel="sponsored nofollow" (preserving any existing
      rel tokens like "noopener").
   4. Strips trailing NUL-byte padding from each file.

   Run: node scripts/add-og-and-sponsored.js
   ============================================================ */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const NUL = String.fromCharCode(0);

const AFFILIATE_HOSTS = [
  "carecredit.com",
  "lemonade.com",
  "embracepetinsurance.com",
  "fetchpet.com",
  "spotpetins.com",
  "pawlicy.com",
  "petsbest.com",
  "trupanion.com",
  "metlifepetinsurance.com",
];

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === ".vercel") continue;
      walk(path.join(dir, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

function extract(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

/* Match a single meta tag and pull a named attribute. Handles arbitrary attribute order. */
function findMetaWithAttr(html, attrName, attrValue) {
  const re = /<meta\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const got = readAttr(tag, attrName);
    if (got != null && got.toLowerCase() === attrValue.toLowerCase()) {
      return { match: tag, index: m.index, length: tag.length };
    }
  }
  return null;
}

function readAttr(tag, name) {
  const re = new RegExp("\\b" + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', "i");
  const m = tag.match(re);
  if (!m) return null;
  return m[1] != null ? m[1] : m[2];
}

function htmlEscape(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function ensureOgDescription(html) {
  if (/<meta[^>]*\bproperty\s*=\s*["']og:description["']/i.test(html)) return html;
  const meta = findMetaWithAttr(html, "name", "description");
  if (!meta) return html;
  const desc = readAttr(meta.match, "content");
  if (!desc) return html;
  const inject = '\n  <meta property="og:description" content="' + htmlEscape(desc) + '" />';
  return html.slice(0, meta.index + meta.length) + inject + html.slice(meta.index + meta.length);
}

function ensureOgUrl(html) {
  if (/<meta[^>]*\bproperty\s*=\s*["']og:url["']/i.test(html)) return html;
  const re = /<link\b[^>]*>/gi;
  let m, found = null;
  while ((m = re.exec(html)) !== null) {
    const rel = readAttr(m[0], "rel");
    if (rel && rel.toLowerCase() === "canonical") {
      const href = readAttr(m[0], "href");
      if (href) { found = { tag: m[0], index: m.index, length: m[0].length, href: href }; break; }
    }
  }
  if (!found) return html;
  const inject = '\n  <meta property="og:url" content="' + htmlEscape(found.href) + '" />';
  return html.slice(0, found.index + found.length) + inject + html.slice(found.index + found.length);
}

function isAffiliateHref(href) {
  try {
    if (!/^https?:\/\//i.test(href)) return false;
    const url = new URL(href);
    const host = url.host.toLowerCase();
    return AFFILIATE_HOSTS.some(function (h) { return host === h || host.endsWith("." + h); });
  } catch (e) {
    return false;
  }
}

function ensureSponsored(html) {
  return html.replace(/<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi, function (match, before, href, after) {
    if (!isAffiliateHref(href)) return match;
    const attrs = before + " " + after;
    const relMatch = attrs.match(/\brel=["']([^"']*)["']/i);
    if (relMatch) {
      const tokens = relMatch[1].split(/\s+/).filter(Boolean);
      const needed = ["sponsored", "nofollow"];
      let changed = false;
      for (const t of needed) {
        if (tokens.indexOf(t) < 0) {
          tokens.push(t);
          changed = true;
        }
      }
      if (!changed) return match;
      return match.replace(/\brel=["'][^"']*["']/i, "rel=\"" + tokens.join(" ") + "\"");
    } else {
      return match.replace(/<a\s+/i, "<a rel=\"sponsored nofollow noopener\" ");
    }
  });
}

function stripNulls(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) !== 0) out += s[i];
  }
  return out;
}

function fixFile(file) {
  let html = fs.readFileSync(file, "utf8");
  const orig = html;
  html = stripNulls(html);
  html = ensureOgDescription(html);
  html = ensureOgUrl(html);
  html = ensureSponsored(html);
  if (html !== orig) {
    fs.writeFileSync(file, html, "utf8");
    return true;
  }
  return false;
}

const files = walk(ROOT, []);
let changed = 0;
for (const f of files) {
  if (fixFile(f)) changed++;
}
console.log("Updated " + changed + " of " + files.length + " HTML files");
