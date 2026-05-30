// Notify Bing IndexNow of the latest sitemap so newly-updated pages get
// indexed within hours instead of days.
//
// Setup:
//   1. Generate an 8-128 char hex key (e.g. node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
//   2. Save it as <key>.txt at the SITE ROOT (the file must contain only the key string)
//   3. Set environment variable INDEXNOW_KEY=<key> when running this script
//      (locally or in Vercel build env)
//   4. Run from project root:  node scripts/ping-indexnow.js
//
// Vercel deploys static, so you'd wire this into a GitHub Action that runs
// AFTER the Vercel deploy succeeds. For now, manual invocation after each ship.
//
// Docs: https://www.bing.com/indexnow
//       https://yandex.com/support/webmaster/indexnow/

const https = require('https');
const fs = require('fs');

const KEY = process.env.INDEXNOW_KEY;
const HOST = 'petplanwise.com';
const SITEMAP_URL = `https://${HOST}/sitemap.xml`;

if (!KEY) {
  console.error('ERROR: set INDEXNOW_KEY environment variable before running.');
  console.error('Generate a key:  node -e "console.log(require(\'crypto\').randomBytes(16).toString(\'hex\'))"');
  console.error('Save it as <key>.txt at project root, then commit and deploy.');
  process.exit(1);
}

// IndexNow accepts up to 10,000 URLs per request. We'll pull a fresh URL list
// from all child sitemaps so search engines re-crawl recently-changed pages.
function extractUrls(xmlText) {
  const matches = xmlText.match(/<loc>([^<]+)<\/loc>/g) || [];
  return matches.map(m => m.replace(/<\/?loc>/g, ''));
}

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

(async () => {
  console.log(`Fetching ${SITEMAP_URL}`);
  const index = await getJSON(SITEMAP_URL);
  if (index.status !== 200) {
    console.error('Failed to fetch sitemap index:', index.status);
    process.exit(1);
  }

  // Sitemap index points to child sitemaps; fetch each, collect URLs
  const childUrls = extractUrls(index.body);
  console.log(`Found ${childUrls.length} child sitemaps`);

  const allUrls = [];
  for (const childUrl of childUrls) {
    const child = await getJSON(childUrl);
    if (child.status === 200) allUrls.push(...extractUrls(child.body));
  }

  console.log(`Total URLs to submit: ${allUrls.length}`);
  if (!allUrls.length) { console.error('No URLs to submit'); process.exit(1); }

  // POST to IndexNow
  const payload = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: allUrls
  });

  const req = https.request({
    hostname: 'api.indexnow.org',
    path: '/IndexNow',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log(`IndexNow response: HTTP ${res.statusCode}`);
      if (body) console.log(`Body: ${body}`);
      // 200=OK, 202=Accepted, 422=URLs which don't belong to host or key
      process.exit(res.statusCode === 200 || res.statusCode === 202 ? 0 : 1);
    });
  });
  req.on('error', err => { console.error('Request failed:', err); process.exit(1); });
  req.write(payload);
  req.end();
})();
