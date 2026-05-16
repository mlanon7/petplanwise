#!/usr/bin/env node
/* Move the reviewer-block ("Fact-checked by PetPlanWise Editorial") from
   its current top-of-page position (under H1, above lede) to the bottom
   of <main>, right before any Sources section. At the top it reads as a
   footnote in the wrong place; at the bottom it reads as a trust signal
   after the content.
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

const MOVED_MARKER = "<!-- reviewer-block-moved -->";

/* Match the entire reviewer-block div, tolerating arbitrary inner content
   and whitespace. The block always starts with class="reviewer-block" and
   contains exactly one outer <div>. */
const RE = /(\s*)<div class="reviewer-block">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(\n|$)/;

function tryMove(html) {
  // Quick reject: no reviewer-block, nothing to do
  const idx = html.indexOf('<div class="reviewer-block">');
  if (idx < 0) return null;
  // Already moved? (we leave the marker behind so re-runs are idempotent)
  if (html.indexOf(MOVED_MARKER) >= 0) return null;

  // Extract the block. We need to match the OUTER div with the proper closing.
  // Block shape:
  //   <div class="reviewer-block">
  //     <span class="avatar" ...>PC</span>
  //     <div>
  //       <div class="who">...</div><div class="who-meta">...</div>
  //       <div class="meta">...</div>
  //     </div>
  //   </div>
  // That's 3 closing </div>s (inner div, wrapper div, reviewer-block div).
  const start = idx;
  // Find the END by counting div tags from `start`.
  let depth = 0;
  let i = start;
  let end = -1;
  while (i < html.length) {
    const openIdx = html.indexOf('<div', i);
    const closeIdx = html.indexOf('</div', i);
    if (closeIdx < 0) break;
    if (openIdx >= 0 && openIdx < closeIdx) {
      depth++;
      i = openIdx + 4;
    } else {
      depth--;
      // Move past the closing '>'
      const gt = html.indexOf('>', closeIdx);
      i = gt + 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return null;

  // Extract the block (trim trailing whitespace/newline up to next non-WS)
  let blockEnd = end;
  // Include any trailing single newline + leading whitespace of the next line
  while (blockEnd < html.length && /[ \t]/.test(html[blockEnd])) blockEnd++;
  if (html[blockEnd] === "\n") blockEnd++;

  // Also pull in any leading indent immediately before the opening tag
  let blockStart = start;
  while (blockStart > 0 && /[ \t]/.test(html[blockStart - 1])) blockStart--;
  // include the leading newline if preceded by one
  if (blockStart > 0 && html[blockStart - 1] === "\n") blockStart--;

  const block = html.slice(blockStart, blockEnd);
  const blockTrim = block.replace(/^\n+/, "").replace(/\n+$/, "");

  // Remove from current position
  const without = html.slice(0, blockStart) + html.slice(blockEnd);

  // Find insertion point: just before the Sources section if present.
  // Sources sections look like: <section><div class="container sources">  OR  <div class="container sources">
  let insertIdx = -1;
  const sourcesRe = /<section>\s*<div class="container sources">|<div class="container sources">/;
  const m = without.match(sourcesRe);
  if (m) {
    insertIdx = m.index;
  } else {
    // Fall back: before </main>
    insertIdx = without.lastIndexOf("</main>");
  }
  if (insertIdx < 0) return null;

  // Wrap the moved block in its own section + container for nice spacing
  // at the bottom of the page. Add the idempotency marker.
  const wrapped =
    "\n  " + MOVED_MARKER + "\n" +
    '  <section><div class="container" style="padding: 12px 0 8px;">\n' +
    "    " + blockTrim.trim() + "\n" +
    "  </div></section>\n\n";

  return without.slice(0, insertIdx) + wrapped + without.slice(insertIdx);
}

const files = walk(ROOT, []);
let touched = 0, skipped = 0, noMatch = 0;
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  if (html.indexOf('<div class="reviewer-block">') < 0) continue;
  if (html.indexOf(MOVED_MARKER) >= 0) { skipped++; continue; }
  const updated = tryMove(html);
  if (!updated) { noMatch++; console.log("  could not move on: " + path.relative(ROOT, f)); continue; }
  fs.writeFileSync(f, updated, "utf8");
  touched++;
}
console.log("\nMoved reviewer-block to bottom on " + touched + " files (skipped: " + skipped + ", no-match: " + noMatch + ")");
