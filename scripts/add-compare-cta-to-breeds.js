#!/usr/bin/env node
/* Inject a small "Compare this breed to..." link just before the
   <!-- breed-traits-section --> marker on every base breed page.
   Idempotent: skips pages that already have the marker.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const BREEDS_DIR = path.join(ROOT, "breeds");
const MARKER = "<!-- compare-cta -->";

function listBaseBreedDirs() {
  return fs.readdirSync(BREEDS_DIR)
    .filter(function (n) {
      if (n.indexOf("-cost-in-") >= 0) return false;
      if (!n.endsWith("-cost")) return false;
      const p = path.join(BREEDS_DIR, n);
      return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, "index.html"));
    });
}

let touched = 0, skipped = 0;
for (const dirName of listBaseBreedDirs()) {
  const slug = dirName.replace(/-cost$/, "");
  const file = path.join(BREEDS_DIR, dirName, "index.html");
  let html = fs.readFileSync(file, "utf8");
  if (html.indexOf(MARKER) >= 0) { skipped++; continue; }

  const block =
    "\n  " + MARKER + "\n" +
    '  <section style="padding: 12px 0 4px;"><div class="container">\n' +
    '    <a href="/compare/?a=' + slug + '" class="cmp-deep-link" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.25);border-radius:999px;color:var(--primary-700,#115E59);text-decoration:none;font-size:14px;font-weight:600;transition:all 150ms;" onmouseover="this.style.background=\'rgba(15,118,110,0.15)\';this.style.transform=\'translateY(-1px)\';" onmouseout="this.style.background=\'rgba(15,118,110,0.08)\';this.style.transform=\'translateY(0)\';">\n' +
    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>\n' +
    '      Compare this breed to another →\n' +
    '    </a>\n' +
    '  </div></section>\n';

  // Insert just before the breed-traits-section marker (so it sits naturally
  // between calculator and traits). Fall back to before </main>.
  if (html.indexOf("<!-- breed-traits-section -->") >= 0) {
    html = html.replace("<!-- breed-traits-section -->", block.trim() + "\n\n  <!-- breed-traits-section -->");
  } else if (html.indexOf("</main>") >= 0) {
    html = html.replace("</main>", block + "</main>");
  } else {
    continue;
  }
  fs.writeFileSync(file, html, "utf8");
  touched++;
}
console.log("Compare CTA injected on " + touched + " base breed pages (skipped: " + skipped + ")");
