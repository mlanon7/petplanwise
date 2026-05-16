#!/usr/bin/env node
/* Reads /assets/data/csv/breed-traits.csv and injects a "Traits &
   temperament" section into each base breed page (breeds/<slug>-cost/
   or breeds/<slug>-cat-cost/). Skips pages that already contain the
   marker so re-runs are idempotent.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const TRAITS_CSV = path.join(ROOT, "assets/data/csv/breed-traits.csv");
const BREEDS_CSV = path.join(ROOT, "assets/data/csv/breeds.csv");
const BREEDS_DIR = path.join(ROOT, "breeds");
const MARKER = "<!-- breed-traits-section -->";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field.length || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
      } else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map(function (r) {
    const o = {};
    header.forEach(function (h, i) { o[h] = (r[i] || "").trim(); });
    return o;
  });
}

const traits = parseCSV(fs.readFileSync(TRAITS_CSV, "utf8"));
const breeds = parseCSV(fs.readFileSync(BREEDS_CSV, "utf8"));
const byBase = {};
breeds.forEach(function (b) { byBase[b.slug] = b; });

function dots(n, max) {
  n = Math.max(0, Math.min(max, parseInt(n, 10) || 0));
  return "●".repeat(n) + "○".repeat(max - n);
}

function fmtTopFacts(s) {
  if (!s) return "";
  return s.split("|").map(function (f) { return "<li>" + f.trim() + "</li>"; }).join("");
}

function findBaseFile(slug) {
  const candidates = [
    path.join(BREEDS_DIR, slug + "-cost", "index.html"),
    path.join(BREEDS_DIR, slug + "-cat-cost", "index.html"),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderSection(t, breedRow) {
  const name = breedRow ? breedRow.name : t.slug.replace(/-/g, " ");
  const species = breedRow ? breedRow.species : "dog";
  const weightLine = (t.weight_male_lb === t.weight_female_lb)
    ? t.weight_male_lb + " lb"
    : t.weight_male_lb + " lb (male) · " + t.weight_female_lb + " lb (female)";

  const kidLabel = { high: "Great with kids", medium: "Good with kids (with supervision)", low: "Better suited to adult homes" }[t.kid_friendly] || t.kid_friendly;
  const strangerLabel = { high: "Friendly with strangers", medium: "Reserved with strangers", low: "Wary of strangers" }[t.stranger_friendly] || t.stranger_friendly;

  const aloneNote = (function () {
    const h = (t.alone_hours || "").trim();
    if (!h) return "";
    if (/^([89]|10|11|12)/.test(h)) return "Tolerates being alone reasonably well (about " + h + " hours).";
    if (/^[67]/.test(h)) return "Can be left alone for about " + h + " hours.";
    if (/^[45]/.test(h)) return "Best with company most of the day (about " + h + " hours alone tolerable).";
    return "Does not tolerate being left alone for long (around " + h + " hours max).";
  })();

  const section =
    "\n  " + MARKER + "\n" +
    '  <section class="breed-traits"><div class="container">\n' +
    '    <h2 id="traits">Traits and temperament — ' + escapeHtml(name) + "</h2>\n" +
    '    <p class="lede prose">A quick read on what living with a ' + escapeHtml(name) + ' is actually like. Numbers are typical breed-standard ranges from AKC (dogs) and CFA / TICA (cats); individual ' + escapeHtml(name) + 's vary.</p>\n' +
    '    <div class="trait-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px 18px;margin:18px 0;">\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Weight</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;">' + escapeHtml(weightLine) + "</div>\n" +
    "      </div>\n" +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Height</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;">' + escapeHtml(t.height_in) + " inches</div>\n" +
    "      </div>\n" +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Energy level</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + dots(t.energy_1to5, 5) + "</div>\n" +
    '        <div style="font-size:12px;color:var(--muted,#6B7280);margin-top:2px;">' + (t.exercise_minutes_per_day ? escapeHtml(t.exercise_minutes_per_day) + " min/day of exercise" : "") + "</div>\n" +
    "      </div>\n" +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Trainability</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + dots(t.trainability_1to5, 5) + "</div>\n" +
    "      </div>\n" +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Shedding</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + dots(t.shedding_1to5, 5) + "</div>\n" +
    '        <div style="font-size:12px;color:var(--muted,#6B7280);margin-top:2px;">~' + escapeHtml(t.grooming_minutes_per_week) + " min/week grooming</div>\n" +
    "      </div>\n" +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Time alone</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;">' + escapeHtml((t.alone_hours || "") + (t.alone_hours ? " hrs" : "")) + "</div>\n" +
    '        <div style="font-size:12px;color:var(--muted,#6B7280);margin-top:2px;">' + escapeHtml(aloneNote) + "</div>\n" +
    "      </div>\n" +
    "    </div>\n" +
    '    <p class="prose"><strong>Temperament:</strong> ' + escapeHtml(t.temperament) + ". <strong>" + escapeHtml(kidLabel) + ";</strong> " + escapeHtml(strangerLabel) + ".</p>\n" +
    '    <p class="prose"><strong>What they are good at:</strong> ' + escapeHtml(t.good_at) + ".</p>\n" +
    "    <h3>Things " + escapeHtml(name) + " owners ask about</h3>\n" +
    '    <ul class="prose">' + fmtTopFacts(t.top_facts_pipe) + "</ul>\n" +
    '    <p class="muted text-sm">Sources: AKC breed standards (dogs), CFA / TICA breed standards (cats), Stanley Coren &quot;The Intelligence of Dogs&quot; (trainability ranking), Banfield State of Pet Health (breed-typical conditions). Individual pets vary widely — these are typical, not guaranteed.</p>\n' +
    "  </div></section>\n";

  return section;
}

// Replace ' character in the rendered string with HTML entity (it's used as
// JS string delimiter above so apostrophes in literals need fixing).
// Simpler: post-process to swap unescaped ’ if present (not used here).

let touched = 0, skipped = 0, missing = 0;
for (const t of traits) {
  const file = findBaseFile(t.slug);
  if (!file) { missing++; continue; }
  let html = fs.readFileSync(file, "utf8");
  if (html.indexOf(MARKER) >= 0) { skipped++; continue; }
  const section = renderSection(t, byBase[t.slug]);
  // Insert before the first <h2>...Insurance fit or before the affiliate
  // block, but most safely before </main>.
  if (html.indexOf("</main>") < 0) continue;
  html = html.replace("</main>", section + "</main>");
  fs.writeFileSync(file, html, "utf8");
  touched++;
}
console.log("Injected traits section in " + touched + " base breed pages (skipped: " + skipped + ", no base page: " + missing + ")");
