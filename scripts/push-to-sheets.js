#!/usr/bin/env node
/* ============================================================
   Push every /assets/data/csv/*.csv to a tab in the configured
   Google Sheet. Uses a service account credential — same pattern
   as the construction-calculator project.

   Run:
     GOOGLE_SERVICE_ACCOUNT_JSON='{...}' node scripts/push-to-sheets.js
       OR
     GOOGLE_SERVICE_ACCOUNT_FILE=path/to/key.json node scripts/push-to-sheets.js

   Env:
     GOOGLE_SERVICE_ACCOUNT_JSON   inline JSON string of the SA key
     GOOGLE_SERVICE_ACCOUNT_FILE   path to a .json key file
     PETCOST_SHEET_ID              override the default sheet id
     DRY_RUN=1                     log actions without writing

   Zero npm deps — uses node built-ins (crypto, https, fs).
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const SHEET_ID = process.env.PETCOST_SHEET_ID
  || "1phcplKG7wqlSR9Pnkj2v672oBiDGtcZSbBncSEUvsFQ";
const CSV_DIR = path.join(__dirname, "..", "assets", "data", "csv");
const DRY = process.env.DRY_RUN === "1";

function loadCreds() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_FILE) {
    return JSON.parse(fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_FILE, "utf8"));
  }
  // Fallback — local dev convenience
  const candidate = path.join(__dirname, "..", ".secrets", "service-account.json");
  if (fs.existsSync(candidate)) return JSON.parse(fs.readFileSync(candidate, "utf8"));
  throw new Error("No service-account credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_FILE.");
}

// ---------- JWT for OAuth 2.0 service-account flow ----------
function b64url(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getAccessToken(creds) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", kid: creds.private_key_id };
  const claim = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };
  const unsigned = b64url(JSON.stringify(header)) + "." + b64url(JSON.stringify(claim));
  const sig = crypto.sign("RSA-SHA256", Buffer.from(unsigned), creds.private_key);
  const jwt = unsigned + "." + b64url(sig);

  const body = "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + encodeURIComponent(jwt);
  const res = await httpsRequest({
    method: "POST",
    hostname: "oauth2.googleapis.com",
    path: "/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body)
    }
  }, body);
  if (res.status !== 200) throw new Error("Token exchange failed " + res.status + ": " + res.body);
  return JSON.parse(res.body).access_token;
}

function httpsRequest(opts, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(opts, (r) => {
      let chunks = [];
      r.on("data", (c) => chunks.push(c));
      r.on("end", () => resolve({ status: r.statusCode, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function api(token, method, p, body) {
  const opts = {
    method,
    hostname: "sheets.googleapis.com",
    path: "/v4" + p,
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/json"
    }
  };
  let payload;
  if (body) {
    payload = JSON.stringify(body);
    opts.headers["Content-Type"] = "application/json";
    opts.headers["Content-Length"] = Buffer.byteLength(payload);
  }
  const r = await httpsRequest(opts, payload);
  if (r.status >= 400) throw new Error(method + " " + p + " → " + r.status + " " + r.body);
  return r.body ? JSON.parse(r.body) : null;
}

// ---------- CSV parsing (same RFC-4180-ish parser as runtime) ----------
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  while (rows.length && rows[rows.length - 1].every(v => v === "")) rows.pop();
  return rows;
}

function colLetter(n) {
  let s = "";
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ---------- Main ----------
(async () => {
  const creds = loadCreds();
  console.log("Service account: " + creds.client_email);
  console.log("Sheet ID:        " + SHEET_ID);
  if (DRY) console.log("DRY_RUN — no writes will be performed");

  const token = await getAccessToken(creds);
  const meta = await api(token, "GET", "/spreadsheets/" + SHEET_ID + "?fields=sheets.properties");
  const existing = {}; // tabName -> sheetId
  meta.sheets.forEach(s => existing[s.properties.title] = s.properties.sheetId);
  console.log("Existing tabs:   " + Object.keys(existing).length);

  const csvFiles = fs.readdirSync(CSV_DIR).filter(f => f.endsWith(".csv")).sort();
  console.log("Local CSVs:      " + csvFiles.length);

  // 1) Create any missing tabs in one batchUpdate
  const toCreate = csvFiles
    .map(f => f.replace(/\.csv$/, ""))
    .filter(name => !(name in existing));
  if (toCreate.length) {
    console.log("Creating tabs:   " + toCreate.join(", "));
    if (!DRY) {
      const reqs = toCreate.map(name => ({ addSheet: { properties: { title: name } } }));
      const out = await api(token, "POST", "/spreadsheets/" + SHEET_ID + ":batchUpdate", { requests: reqs });
      out.replies.forEach((rep, i) => {
        existing[toCreate[i]] = rep.addSheet.properties.sheetId;
      });
    }
  }

  // 2) For each local CSV: clear the matching tab, write rows
  let okCount = 0, skipped = 0;
  for (const f of csvFiles) {
    const tabName = f.replace(/\.csv$/, "");
    const text = fs.readFileSync(path.join(CSV_DIR, f), "utf8");
    const rows = parseCsv(text);
    if (!rows.length) { console.log("[skip empty] " + tabName); skipped++; continue; }

    const maxCols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    const range = "'" + tabName.replace(/'/g, "''") + "'!A1:" + colLetter(maxCols) + rows.length;

    if (DRY) {
      console.log("[dry] " + tabName + ": " + rows.length + " rows × " + maxCols + " cols");
      okCount++;
      continue;
    }

    // Clear, then write
    await api(token, "POST", "/spreadsheets/" + SHEET_ID + "/values/" + encodeURIComponent("'" + tabName.replace(/'/g, "''") + "'") + ":clear", {});
    await api(token, "PUT",
      "/spreadsheets/" + SHEET_ID + "/values/" + encodeURIComponent(range) + "?valueInputOption=USER_ENTERED",
      { values: rows.map(r => { const out = r.slice(); while (out.length < maxCols) out.push(""); return out; }) });

    console.log("[ok]  " + tabName + ": " + rows.length + " rows × " + maxCols + " cols");
    okCount++;
  }

  // 3) Make header row bold + freeze header on every tab we just wrote
  if (!DRY) {
    const reqs = [];
    for (const f of csvFiles) {
      const tabName = f.replace(/\.csv$/, "");
      const sheetId = existing[tabName];
      if (sheetId == null) continue;
      reqs.push({
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: { red: 0.945, green: 0.918, blue: 0.827 } } },
          fields: "userEnteredFormat(textFormat,backgroundColor)"
        }
      });
      reqs.push({
        updateSheetProperties: {
          properties: { sheetId, gridProperties: { frozenRowCount: 1 } },
          fields: "gridProperties.frozenRowCount"
        }
      });
    }
    if (reqs.length) {
      await api(token, "POST", "/spreadsheets/" + SHEET_ID + ":batchUpdate", { requests: reqs });
    }
  }

  console.log();
  console.log("Done. Pushed: " + okCount + ", skipped: " + skipped);
})().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
