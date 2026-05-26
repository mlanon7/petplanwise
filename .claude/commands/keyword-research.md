# /keyword-research — Free keyword harvest → gap analysis

The Ahrefs MCP returns `Insufficient plan` on the current account, so in-session keyword research uses **free Google Autocomplete** (real "what people type" data) + GSC. This is how the May-2026 14-guide batch was scoped.

## 1. Harvest Google Autocomplete

Endpoint (public, no key): `https://suggestqueries.google.com/complete/search?client=firefox&q=<query>` → JSON `["q",[suggestions...]]`.

Write a small Node harvester (template — adapt seeds to the niche):

```js
const https=require("https"),os=require("os"),fs=require("fs"),path=require("path");
const OUT=path.join(os.tmpdir(),"kw-raw.txt");
function suggest(q){return new Promise(r=>{https.get("https://suggestqueries.google.com/complete/search?client=firefox&q="+encodeURIComponent(q),res=>{let d="";res.on("data",c=>d+=c);res.on("end",()=>{try{r(JSON.parse(d)[1]||[])}catch(e){r([])}})}).on("error",()=>r([]))})}
const seeds=[/* cost/insurance/condition seeds */];
const alpha="abcdefghijklmnopqrstuvwxyz".split("").map(c=>"how much does it cost to "+c); // discovers procedures
(async()=>{const set=new Map();for(const s of seeds.concat(alpha)){for(const x of await suggest(s))set.set(x.toLowerCase().trim(),1);await new Promise(r=>setTimeout(r,40));}fs.writeFileSync(OUT,[...set.keys()].sort().join("\n"));console.log("unique:",set.size,"->",OUT)})();
```

Good seeds for this niche: `how much does it cost to treat a dog/cat`, `<procedure> cost`, `<breed> price`, `pet insurance worth it`, `how much does a dog/cat cost`. Alphabet-expanding `how much does it cost to ___` surfaces procedures you don't cover yet.

## 2. Filter + cluster

- Keep cost/commercial intent (`cost|price|how much|insurance|worth it|cheap|afford`).
- **Drop international tails** (uk/australia/canada/philippines/india) — we target the US. Keep `near me`, `at banfield/petsmart/humane society`, US states.
- Cluster by topic (condition, procedure, breed, insurance).

## 3. Gap analysis

Cross-reference clusters against existing pages:
```bash
ls guides/ | sort        # what we already cover
ls breeds/ | grep -v cost-in- | sort
```
Flag clusters with **no** matching page = genuine gaps.

## 4. Prioritize

- **Tier 1:** gaps where a sibling page already ranks (easy wins).
- **Tier 2:** high-intent condition costs (strong insurance-affiliate fit).
- **Tier 3:** specific surgeries (specific = lower competition).
- **Defer:** broad/competitive head terms; reputationally fraught topics.

Validate the top picks' competition with a quick web search (who ranks, what price ranges).

## 5. Record + act

Append the prioritized list to `docs/CONTENT-PLAN.md` with date + source. Then build with `/add-guide`. **Re-pull GSC every ~2 weeks** and let real data re-steer — don't dump pages on spec.
