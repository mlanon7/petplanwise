# Google Sheets ↔ Site data pipeline

This site loads its cost data from Google Sheets at runtime, with a bundled
CSV fallback. Edit a cell in the Sheet → page picks it up on the next refresh.
No deploy needed for content changes.

## The two layers

1. **Live runtime** — every browser visit hits the Google Sheets gviz CSV
   endpoint per tab. Latest data, every load. Falls back to bundled CSV if
   the Sheet is unreachable.
2. **Build-time bundle** — Vercel/Netlify runs `npm run sync` before deploy,
   pulls every tab into `/assets/data/csv/`, ships them in the static site.
   This is the fallback the runtime layer falls back to.

A scheduled GitHub Action also runs the sync every 6 hours and commits any
changes — so even browsers that fail the live fetch get sub-day-fresh data
from the bundled copies.

## Automated push from git (service account)

Same pattern as the construction-calculator pipeline: a service-account
credential pushes every CSV to its tab on every commit that touches
`assets/data/csv/`. No manual paste.

### One-time setup

1. **Create the service account** (or reuse the one from construction-calculator):
   - Google Cloud Console → IAM & Admin → Service Accounts → Create
   - Grant role: `roles/sheets.editor` (or just leave the default; the share in step 2 is what matters)
   - Keys tab → Add key → JSON → download.

2. **Share the sheet** with the service account's email
   (`name@project.iam.gserviceaccount.com`) as **Editor**.

3. **Add GitHub Secrets** in your repo settings:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — paste the entire JSON contents of the
     downloaded key.
   - `PETCOST_SHEET_ID` (optional) — overrides the hardcoded sheet ID.

4. **Push** any change under `assets/data/csv/`.
   The workflow at `.github/workflows/push-to-sheets.yml` runs and pushes
   every CSV to the matching tab in your sheet.

### Run it locally

```bash
# Either inline JSON…
export GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
npm run push

# …or point at a file
export GOOGLE_SERVICE_ACCOUNT_FILE=./.secrets/service-account.json
npm run push

# Dry-run (no writes, just logs what would happen)
DRY_RUN=1 npm run push
```

The script:
- Authenticates via JWT (RSA-SHA256), exchanges for an OAuth2 access token, no third-party libraries
- Lists existing tabs, creates any missing ones in one batchUpdate
- For each local CSV: clears the matching tab and writes the parsed rows via `USER_ENTERED` value input
- Bolds + freezes the header row on every tab it writes
- Exits non-zero on any auth or API error so CI fails loudly


## One-time setup

## One-shot auto-seed (recommended)

Instead of copy-pasting 18 tabs by hand, paste a single Apps Script and run it.

1. Open your Google Sheet.
2. **Extensions → Apps Script.**
3. In the editor, **Select All → Delete** any boilerplate code.
4. Open `scripts/push-to-sheets.gs` from this repo. Copy its entire contents.
5. Paste into the Apps Script editor. **Save** (floppy icon, or Ctrl+S).
6. From the function dropdown at the top, choose `pushAllCsvsToTabs`. **Click Run.**
7. The first run prompts for permission — **Review permissions → Advanced → Go to (your script) → Allow.** This grants the script edit access to **only this one spreadsheet** (it's restricted to ActiveSpreadsheet).
8. Wait ~10–20 seconds. A success dialog confirms how many tabs were created.

After this runs once, every tab is populated, named correctly, and ready for the live site to fetch.

The script also adds a "YourPetBill" menu to the Sheet so non-engineers can:
- Re-seed all tabs (resets to the version embedded in the script)
- Validate that tab names match what the site expects

To re-seed when the local CSVs in this repo change: regenerate `push-to-sheets.gs` (re-run the build that produced it), paste the new version into the Apps Script editor, run `pushAllCsvsToTabs` again. The script always replaces the existing tabs.



### Sheet ID

The Sheet ID is hardcoded in two places:

- `assets/data/csv-loader-20260509.js` — `SHEET_ID` constant (runtime fetch)
- `scripts/sync-from-sheets.js` — `SHEET_ID` default (build-time fetch)

Current default: `1phcplKG7wqlSR9Pnkj2v672oBiDGtcZSbBncSEUvsFQ`

Override via `window.PETCOST_SHEET_ID` (browser) or `PETCOST_SHEET_ID=...` env (build).

### Sheet permissions

The Sheet must be either:

- **"Anyone with the link can view"** (Google Drive sharing setting), OR
- **Published to the web** (File → Share → Publish to web).

The first option is enough for the gviz endpoint to work.

### Tabs (one tab per CSV file)

Each local CSV under `/assets/data/csv/` corresponds to a tab in the Sheet
with the **same name as the file** (without the `.csv` extension):

- `age-multipliers.csv` (from `age-multipliers.csv`)
- `base-costs.csv` (from `base-costs.csv`)
- `breed-images.csv` (from `breed-images.csv`)
- `breeds.csv` (from `breeds.csv`)
- `city-multipliers.csv` (from `city-multipliers.csv`)
- `emergency-fund.csv` (from `emergency-fund.csv`)
- `emergency-keys.csv` (from `emergency-keys.csv`)
- `first-year-one-time.csv` (from `first-year-one-time.csv`)
- `insurance-defaults.csv` (from `insurance-defaults.csv`)
- `insurance-monthly-premium.csv` (from `insurance-monthly-premium.csv`)
- `insurance-ranges.csv` (from `insurance-ranges.csv`)
- `life-expectancy.csv` (from `life-expectancy.csv`)
- `lifestyle-multipliers.csv` (from `lifestyle-multipliers.csv`)
- `procedures.csv` (from `procedures.csv`)
- `reviewer.csv` (from `reviewer.csv`)
- `size-multipliers.csv` (from `size-multipliers.csv`)
- `state-adjusted-categories.csv` (from `state-adjusted-categories.csv`)
- `state-multipliers.csv` (from `state-multipliers.csv`)

The first row of every tab is the header row.
The runtime fetch finds tabs by name — case-sensitive.

### Populating the tabs from local CSVs (first time)

For each local CSV:

1. Open `/assets/data/csv/<file>.csv` in any spreadsheet editor.
2. Select all cells, copy.
3. In the Google Sheet, create a new tab named `<file>` (without `.csv`).
4. Paste into A1.

Or use **File → Import → Upload** in Google Sheets and select "Replace
spreadsheet". Repeat per tab.

## Daily workflow (after setup)

### A. Edit data

Edit the relevant tab in Google Sheets. Save (Sheets autosaves).
Browsers will pick up the change on next page load (gviz cache TTL is ~5
minutes).

### B. Pull bundled CSVs to Git

If you want the bundled fallback to be fresh too:

```bash
npm run sync
git add assets/data/csv/
git commit -m "data: refresh CSVs from Sheet"
git push
```

This is also done automatically every 6 hours by the GitHub Action at
`.github/workflows/sync-from-sheets.yml`.

### C. Add a new tab (e.g. new state, new breed)

1. Add a row in the appropriate tab in the Sheet.
2. `npm run sync` locally to pull and verify.
3. `git add && git commit && git push` to ship the bundled fallback.

If the new column requires a code change (a new field on `window.PETCOST_DATA`),
also update `assets/data/csv-loader.js` to map the new column.

## Vercel / Netlify deploy

The build script in `package.json`:

```json
"prebuild": "node scripts/sync-from-sheets.js || true",
"build": "echo 'No build step. Fully static.'"
```

`prebuild` runs the sync before each deploy. The `|| true` keeps deploys
working even if the sheet is temporarily unreachable (the bundled CSVs from
git are still shipped).

To override the sheet ID per environment, set `PETCOST_SHEET_ID` in the
Vercel/Netlify environment variables UI.

## Test the pipeline

```bash
# Pull latest from sheet
npm run sync

# Run unit tests against the new bundled CSVs
npm test

# Run the local server and confirm the calculator still works
node local-server.js
# Open http://localhost:4173/
```

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| Sync skips every tab with "auth" error | Sheet not shared publicly | File → Share → Anyone with link → Viewer |
| Wrong tab data loaded | Tab name doesn't match file name | Rename the Sheet tab to exactly match the CSV filename minus `.csv` |
| New field added to Sheet but missing on site | csv-loader.js doesn't know about the new column | Add a mapping in the loader's reshape function |
| Build fails on Vercel | gviz unreachable from build env | The `|| true` in prebuild swallows the error; bundled CSVs from git are used instead |
