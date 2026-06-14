#!/usr/bin/env node
/**
 * add-cost-charts.js
 *
 * Turns a guide page's <table class="cost-table"> (Component / Low / Typical /
 * High) into an inline-SVG horizontal range plot inserted right after the
 * table: a faint teal band shows the low–high range per component, a solid
 * teal marker shows the typical cost. Pure inline HTML+SVG — no CSS file
 * dependency, so NO cache-bust is needed for the chart itself.
 *
 * Idempotent: re-running replaces the existing chart (markers
 * <!-- cost-chart --> ... <!-- /cost-chart -->).
 *
 * Usage:
 *   node scripts/add-cost-charts.js                       # all guides with a 3-col cost-table
 *   node scripts/add-cost-charts.js dog-dental-cleaning-cost   # one or more slugs
 */
const fs = require('fs');
const path = require('path');

const GUIDES_DIR = path.join(__dirname, '..', 'guides');

// ---- palette (matches site.css tokens; literal hex so SVG renders identically) ----
const TEAL = '#0F766E';
const TEAL_DARK = '#115E59';
const TRACK = '#F1EAD3';
const BAND = 'rgba(15,118,110,0.16)';
const GRID = '#E8DFC7';
const INK = '#1F2937';
const MUTED = '#6B7280';

const W = 720;

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

// Round an axis maximum up to a clean value giving <= 5 intervals.
function niceAxis(maxVal) {
  const steps = [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 5000, 10000];
  for (const s of steps) {
    if (maxVal / s <= 5) return { max: Math.ceil(maxVal / s) * s, step: s };
  }
  const s = Math.ceil(maxVal / 5 / 1000) * 1000;
  return { max: Math.ceil(maxVal / s) * s, step: s };
}

function parseMoney(str) {
  const n = Number(String(str).replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : null;
}

// Pull rows out of the first <table class="cost-table">. Returns null if the
// table isn't the standard 4-column Component/Low/Typical/High shape.
function parseCostTable(html) {
  const tblMatch = html.match(/<table class="cost-table">([\s\S]*?)<\/table>/);
  if (!tblMatch) return null;
  const tbl = tblMatch[0];

  const head = tbl.match(/<thead>([\s\S]*?)<\/thead>/);
  if (!head) return null;
  const headCells = [...head[1].matchAll(/<th[^>]*>(.*?)<\/th>/g)].map(m => m[1].toLowerCase());
  // Need exactly: label col + low + typical + high
  if (headCells.length !== 4) return null;
  if (!/low/.test(headCells[1]) || !/typ/.test(headCells[2]) || !/high/.test(headCells[3])) return null;

  const body = tbl.match(/<tbody>([\s\S]*?)<\/tbody>/);
  if (!body) return null;
  const rows = [];
  const trRe = /<tr>([\s\S]*?)<\/tr>/g;
  let tr;
  while ((tr = trRe.exec(body[1])) !== null) {
    const cells = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    if (cells.length !== 4) continue;
    const name = cells[0].replace(/<[^>]+>/g, '').trim();
    const low = parseMoney(cells[1]);
    const typ = parseMoney(cells[2]);
    const high = parseMoney(cells[3]);
    if (low === null || typ === null || high === null) continue;
    rows.push({ name, low, typ, high });
  }
  return rows.length ? rows : null;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const pct = (v, max) => +(v / max * 100).toFixed(2);

// Build the chart as responsive HTML/CSS (not SVG): real text that reflows
// and stays crisp at any width, with percentage-positioned band + marker.
function buildFigure(rows, subject) {
  // sort biggest typical first — answers "where does the money go?" at a glance
  const sorted = rows.slice().sort((a, b) => b.typ - a.typ);
  const maxHigh = Math.max(...sorted.map(r => r.high));
  const axis = niceAxis(maxHigh);

  const rowHtml = sorted.map(r => {
    const left = pct(r.low, axis.max);
    const width = Math.max(1.5, pct(r.high, axis.max) - left);
    const mk = pct(r.typ, axis.max);
    return [
      '      <div style="margin:0 0 13px;">',
      '        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin:0 0 5px;">',
      `          <span style="font-size:13.5px;font-weight:600;color:${INK};line-height:1.25;">${esc(r.name)}</span>`,
      `          <span style="font-size:13.5px;font-weight:700;color:${TEAL_DARK};white-space:nowrap;">${money(r.typ)}</span>`,
      '        </div>',
      `        <div style="position:relative;height:14px;background:${TRACK};border-radius:7px;">`,
      `          <div style="position:absolute;left:${left}%;width:${width}%;top:0;bottom:0;background:${BAND};border-radius:7px;"></div>`,
      `          <div style="position:absolute;left:${mk}%;top:-3px;bottom:-3px;width:4px;margin-left:-2px;background:${TEAL};border-radius:2px;"></div>`,
      '        </div>',
      '      </div>'
    ].join('\n');
  }).join('\n');

  const ticks = [];
  for (let g = 0; g <= axis.max + 1; g += axis.step) {
    const p = pct(g, axis.max);
    const align = g === 0
      ? 'left:0;'
      : (g >= axis.max ? 'right:0;' : `left:${p}%;transform:translateX(-50%);`);
    ticks.push(`        <span style="position:absolute;${align}font-size:11px;color:${MUTED};">${money(g)}</span>`);
  }
  const axisHtml = [
    '      <div style="position:relative;height:15px;margin-top:6px;">',
    ticks.join('\n'),
    '      </div>'
  ].join('\n');

  return [
    '<!-- cost-chart -->',
    '    <figure class="cost-chart" aria-label="' + esc('Cost range by component for ' + subject) + '" style="margin:20px 0 4px;background:#FFFFFF;border:1px solid #E8DFC7;border-radius:16px;padding:20px 20px 16px;box-shadow:0 1px 2px rgba(15,23,42,0.06),0 1px 3px rgba(15,23,42,0.05);">',
    '      <figcaption style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1F2937;">Where the money goes</figcaption>',
    '      <p style="margin:0 0 16px;font-size:13px;color:#6B7280;line-height:1.5;">Teal marker = typical cost &middot; shaded band = low&ndash;high range. Biggest cost drivers first.</p>',
    rowHtml,
    axisHtml,
    '    </figure>',
    '<!-- /cost-chart -->'
  ].join('\n');
}

function processFile(file, slug) {
  let html = fs.readFileSync(file, 'utf8');
  const rows = parseCostTable(html);
  if (!rows) return { slug, status: 'skip', reason: 'no standard 4-col cost-table' };

  // derive a subject from the <h1>
  const h1 = (html.match(/<h1>(.*?)<\/h1>/) || [, slug])[1].replace(/<[^>]+>/g, '').trim();
  const figure = buildFigure(rows, h1);

  // remove any prior chart (idempotent)
  html = html.replace(/\n?\s*<!-- cost-chart -->[\s\S]*?<!-- \/cost-chart -->/g, '');

  // insert right after the cost-table closes, inside the same container
  const close = '</table>';
  const idx = html.indexOf(close);
  if (idx === -1) return { slug, status: 'skip', reason: 'no </table>' };
  const insertAt = idx + close.length;
  html = html.slice(0, insertAt) + '\n' + figure + html.slice(insertAt);

  fs.writeFileSync(file, html);
  return { slug, status: 'ok', rows: rows.length };
}

function main() {
  const args = process.argv.slice(2);
  let slugs;
  if (args.length) {
    slugs = args;
  } else {
    slugs = fs.readdirSync(GUIDES_DIR).filter(d =>
      fs.existsSync(path.join(GUIDES_DIR, d, 'index.html'))
    );
  }
  const results = slugs.map(slug => {
    const file = path.join(GUIDES_DIR, slug, 'index.html');
    if (!fs.existsSync(file)) return { slug, status: 'skip', reason: 'no file' };
    return processFile(file, slug);
  });
  const ok = results.filter(r => r.status === 'ok');
  const skip = results.filter(r => r.status === 'skip');
  ok.forEach(r => console.log(`  chart added: ${r.slug} (${r.rows} rows)`));
  if (skip.length) {
    console.log(`\n  skipped ${skip.length}:`);
    skip.forEach(r => console.log(`    ${r.slug} — ${r.reason}`));
  }
  console.log(`\nDone. ${ok.length} chart(s) added/updated.`);
}

main();
