#!/usr/bin/env node
/* Add the May-16 batch of 12 high-value breeds.

   For each breed:
     - Write /breeds/<slug>-cost/index.html (from template)
     - Write /breeds/<slug>-cost/hero.svg (placeholder until real photo)
     - Append row to assets/data/csv/breeds.csv
     - Append row to assets/data/csv/breed-traits.csv

   Then:
     - Splice new cards into breeds/index.html (dog group + cat group), sorted
     - Update visible-count spans (40 -> 48 dogs, 14 -> 18 cats)
     - Update ItemList JSON-LD with 12 new entries

   Idempotent: skips breeds whose directory already exists.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const CACHE_V = "20260516e";

/* ---------------- Breed data ----------------
   Numbers reflect mainstream U.S. retail / vet ranges. Sources: AKC standards,
   CFA / TICA for cats, NAPHIA 2024, Banfield State of Pet Health, OFA.
   Temperaments are AKC/CFA descriptors with C-BARQ context.
*/
const BREEDS = [
  /* ============ DOGS (8) ============ */
  {
    slug: "basset-hound", species: "dog", name: "Basset Hound", aka: "Basset",
    size: "medium", grooming: 1.05, healthRisk: 1.10,
    purchase: { low: 800, typical: 1500, high: 2500 },
    avgLife: 12,
    notes: "Long back + drop ears drive IVDD and chronic ear-infection cost. Obesity-prone.",
    yearRange: "$1,400–$3,400", yearOne: "$2,000–$4,800", lifetime: "$18,000–$36,000",
    costRows: {
      food: { low: 350, typ: 600, high: 1100 },
      vet: { low: 250, typ: 500, high: 1100 },
      prevention: { low: 140, typ: 280, high: 480 },
      grooming: { low: 0, typ: 100, high: 300 },
      insurance: { low: 380, typ: 660, high: 1100 }
    },
    drivers: [
      { name: "Chronic ear infections.", text: "Long drop ears trap moisture — most Bassets see a vet for ear infections at least once a year ($100–$300/visit)." },
      { name: "Intervertebral disc disease (IVDD).", text: "The long-spine + short-leg build predisposes to disc herniation. Surgery for severe cases runs $4,000–$8,000." },
      { name: "Obesity drives everything.", text: "Bassets gain weight easily and joint disease compounds with extra pounds. Strict portion control is the single biggest cost lever." },
      { name: "Bloat / GDV.", text: "Deep-chested breed — feed two smaller meals and avoid heavy exercise around feeding; GDV surgery is $5,000+." }
    ],
    insurance: "Basset premiums run $35–$60/month. Mid-tier risk — orthopedic and ear coverage matter more than cancer. Enroll before any back or ear issues become pre-existing.",
    saveTips: [
      "Weekly ear cleans with a vet-recommended solution prevent ~80% of infections.",
      "Strict food measurement — Bassets will eat themselves into obesity.",
      "Use a low-rise ramp for car/couch to reduce IVDD risk.",
      "Adopt from breed-specific rescue — Basset Hound Club of America rescue lists pups regularly."
    ],
    faq: [
      { q: "How much does a Basset Hound cost per year?", a: "$1,400–$3,400 per year for most owners. Ear care and weight management are the biggest cost variables." },
      { q: "Are Basset Hounds expensive to insure?", a: "Mid-tier. Joint/back risk pushes premiums higher than a generic small breed but lower than a Frenchie." },
      { q: "What's the most common big Basset vet bill?", a: "IVDD spinal surgery ($4,000–$8,000) — or repeated ear-infection visits that add up over a lifetime." }
    ],
    sources: ["NAPHIA 2024 State of the Industry", "OFA registry — Basset Hound IVDD data", "AKC breed standard"],
    /* Traits CSV */
    traits: {
      weightM: "50-65", weightF: "45-60", height: "13-15",
      energy: 2, alone: "4-6", kid: "high", stranger: "medium", train: 2, shed: 3,
      grm: 15, exMin: "30-45",
      temperament: "Easy-going patient devoted",
      goodAt: "scent tracking family pet companion",
      topFacts: "One of the most powerful noses in dogkind — second only to the Bloodhound|Long spine and short legs make jumping off furniture genuinely risky|Famously stubborn — food motivation beats correction every time|Originally bred in 16th-century France for hunting rabbits and hare",
      affection: 8, child: 9, protective: 3, vocal: 6
    }
  },
  {
    slug: "bichon-frise", species: "dog", name: "Bichon Frise",
    size: "small", grooming: 1.30, healthRisk: 1.15,
    purchase: { low: 1500, typical: 2200, high: 3500 },
    avgLife: 14,
    notes: "Allergic dermatitis is extremely common. Monthly professional grooming is non-negotiable.",
    yearRange: "$1,800–$3,800", yearOne: "$2,400–$5,200", lifetime: "$25,000–$48,000",
    costRows: {
      food: { low: 250, typ: 450, high: 800 },
      vet: { low: 300, typ: 600, high: 1300 },
      prevention: { low: 140, typ: 260, high: 440 },
      grooming: { low: 480, typ: 780, high: 1200 },
      insurance: { low: 360, typ: 600, high: 1000 }
    },
    drivers: [
      { name: "Allergic skin disease.", text: "Atopic dermatitis affects a high share of Bichons — chronic itch, ear infections, hot spots. Annual cost can hit $800–$2,000 between visits, meds, and prescription diets." },
      { name: "Monthly grooming is mandatory.", text: "The hypoallergenic coat mats fast. Skipping a groom session leads to painful matting + clipping fees. Budget $60–$90 every 4–6 weeks." },
      { name: "Dental disease.", text: "Small jaw + crowded teeth = professional cleanings every 1–2 years ($400–$900 under anesthesia)." },
      { name: "Patellar luxation.", text: "Common in small breeds — surgery for severe grade III–IV cases runs $1,500–$3,500 per knee." }
    ],
    insurance: "Bichon premiums average $30–$55/month. The strong fit here is dermatology coverage — confirm the policy doesn't sublimit allergy diagnostics, which can run hundreds.",
    saveTips: [
      "Learn to brush every other day at home — prevents the matting that drives extra grooming fees.",
      "Use a vet-recommended skin shampoo at bath time to head off flare-ups.",
      "Dental brushing 3x/week meaningfully delays the first professional cleaning.",
      "Adopt — Bichon Frise Rescue Brigade and similar groups regularly have surrendered adults."
    ],
    faq: [
      { q: "How much does a Bichon Frise cost per year?", a: "$1,800–$3,800 per year. Grooming + allergy management are the two big swing factors." },
      { q: "Are Bichons hypoallergenic?", a: "They shed minimally and many allergic humans tolerate them better — but no dog is truly hypoallergenic. Spend time around the breed before committing." },
      { q: "How often do Bichons need grooming?", a: "Every 4–6 weeks professionally, plus brushing 3–4 times a week at home to prevent matting." }
    ],
    sources: ["NAPHIA 2024 — small-breed claims data", "AAHA dermatology guidelines", "AKC breed standard"],
    traits: {
      weightM: "12-18", weightF: "11-16", height: "9.5-11.5",
      energy: 3, alone: "4-6", kid: "high", stranger: "high", train: 4, shed: 1,
      grm: 70, exMin: "30-45",
      temperament: "Cheerful gentle playful",
      goodAt: "companion therapy work apartment living",
      topFacts: "Coat is hair not fur — minimal shedding but professional grooming every 4-6 weeks is essential|Allergic skin disease is extremely common in the breed|Among the most patient small breeds with children|Lineage traces to 13th-century Mediterranean sailor companions",
      affection: 9, child: 8, protective: 2, vocal: 4
    }
  },
  {
    slug: "cockapoo", species: "dog", name: "Cockapoo",
    size: "small", grooming: 1.30, healthRisk: 1.10,
    purchase: { low: 1500, typical: 2500, high: 4000 },
    avgLife: 14,
    notes: "Cocker × Poodle cross. Low-shedding but high grooming. Ear-infection risk inherited from Cocker side.",
    yearRange: "$1,600–$3,800", yearOne: "$2,400–$5,400", lifetime: "$22,000–$45,000",
    costRows: {
      food: { low: 250, typ: 450, high: 800 },
      vet: { low: 250, typ: 500, high: 1100 },
      prevention: { low: 140, typ: 260, high: 440 },
      grooming: { low: 360, typ: 720, high: 1100 },
      insurance: { low: 320, typ: 580, high: 950 }
    },
    drivers: [
      { name: "Grooming is the line item, not health.", text: "Coat type varies (curly/wavy/straight) — most Cockapoos need a professional groom every 6–8 weeks ($60–$90)." },
      { name: "Ear infections (Cocker inheritance).", text: "Drop ears + curly hair in the ear canal trap moisture. Expect ear cleanings 2–4x/year; chronic cases cost $200–$500/yr in meds." },
      { name: "Patellar luxation + hip dysplasia.", text: "Both parent breeds carry small joint risk. Severe surgery $1,500–$3,500." },
      { name: "Eye conditions.", text: "Cockapoos can inherit cataracts and PRA from the Cocker side — schedule an OFA CAER eye exam at adoption." }
    ],
    insurance: "Cockapoo premiums average $30–$55/month. Ear and dermatology cover earn their keep here. Insurance also tends to be a fit because designer-cross health-history records are often thin.",
    saveTips: [
      "Learn to do at-home maintenance trimming around face/paws between professional grooms.",
      "Weekly ear cleans dramatically cut down on vet visits.",
      "Buy heartworm + flea prevention in 12-month packs from a vet-network online pharmacy.",
      "Adopt — \"doodle\" surrenders are increasingly common; Poo Mix Rescue and IDOG Rescue are good places to look."
    ],
    faq: [
      { q: "How much does a Cockapoo cost per year?", a: "$1,600–$3,800 — most of the variance is grooming frequency and ear-infection treatment." },
      { q: "Are Cockapoos hypoallergenic?", a: "Lower-shedding than most breeds — many allergic humans tolerate them, but it varies by individual coat type." },
      { q: "Cockapoo or Cavapoo — which is cheaper?", a: "Cockapoo is typically $300–$800 less to purchase. Lifetime costs are similar; Cavapoo skews slightly higher due to inherited cardiac risk from the Cavalier line." }
    ],
    sources: ["NAPHIA 2024 — doodle-cross claims data", "AAHA grooming + ear care guidelines", "OFA CAER registry for Cocker Spaniel"],
    traits: {
      weightM: "13-25", weightF: "11-22", height: "10-15",
      energy: 3, alone: "4-6", kid: "high", stranger: "high", train: 4, shed: 2,
      grm: 60, exMin: "30-60",
      temperament: "Affectionate sociable cheerful",
      goodAt: "family pet companion therapy work apartment living",
      topFacts: "First intentional poodle-cross — bred in the U.S. in the 1950s|Coat type varies wildly between siblings — curly, wavy, or straight|Drop ears + curly hair = ear infections are the single most common vet visit|Not AKC-recognized (designer cross) but registered with the Cockapoo Club of America",
      affection: 10, child: 9, protective: 3, vocal: 4
    }
  },
  {
    slug: "german-shorthaired-pointer", species: "dog", name: "German Shorthaired Pointer", aka: "GSP",
    size: "large", grooming: 1.00, healthRisk: 1.05,
    purchase: { low: 800, typical: 1500, high: 3000 },
    avgLife: 13,
    notes: "Very high-energy sporting breed. Bloat risk and orthopedic costs drive the bill if exercised inadequately.",
    yearRange: "$1,700–$3,800", yearOne: "$2,100–$5,200", lifetime: "$22,000–$45,000",
    costRows: {
      food: { low: 400, typ: 700, high: 1300 },
      vet: { low: 250, typ: 500, high: 1100 },
      prevention: { low: 160, typ: 320, high: 540 },
      grooming: { low: 0, typ: 80, high: 250 },
      insurance: { low: 380, typ: 660, high: 1100 }
    },
    drivers: [
      { name: "Exercise is the budget line.", text: "GSPs need 90+ minutes of real exercise daily. Without it, vet visits for anxiety-driven destruction, gastric issues, and weight gain spike. Many owners pay for daycare ($25–$45/day) or dog walkers." },
      { name: "Gastric dilatation-volvulus (bloat).", text: "Deep-chested breed — bloat is a top-3 lifetime risk. Emergency surgery runs $5,000–$8,000. Many owners do a prophylactic gastropexy at spay/neuter for $300–$700." },
      { name: "Hip and elbow dysplasia.", text: "Lower rate than Labs but still meaningful. Severe surgery $4,000–$8,000." },
      { name: "Lipomas and skin masses.", text: "Common in middle age — aspiration biopsies $100–$200 each, occasional removals $400–$1,200." }
    ],
    insurance: "GSP premiums average $40–$65/month. A genuine fit because of bloat + orthopedic risk. Confirm the policy covers bloat surgery without a per-incident cap.",
    saveTips: [
      "Discuss prophylactic gastropexy with your vet at spay/neuter — pays for itself many times over if bloat ever happens.",
      "Feed two smaller meals 6+ hours apart instead of one large meal.",
      "Channel energy into structured activities (lure coursing, dock diving, agility) — saves on furniture-and-shoe replacement costs.",
      "Adopt — GSP Rescue groups (like NorCal GSP Rescue) regularly have young dogs needing active homes."
    ],
    faq: [
      { q: "How much does a German Shorthaired Pointer cost per year?", a: "$1,700–$3,800 for active owners. Food and exercise-related expenses (daycare, gear) are the biggest swing items." },
      { q: "Is a GSP good for apartments?", a: "Honestly — no, unless you commit to 2+ hours of daily off-leash running. GSPs are working sporting dogs first." },
      { q: "Are GSPs prone to bloat?", a: "Yes. Deep chests put them in a high-risk group. Discuss prophylactic gastropexy with your vet." }
    ],
    sources: ["NAPHIA 2024 State of the Industry", "Glickman et al. — bloat risk factors in dogs (Purdue)", "AKC breed standard"],
    traits: {
      weightM: "55-70", weightF: "45-60", height: "21-25",
      energy: 5, alone: "3-5", kid: "high", stranger: "high", train: 5, shed: 3,
      grm: 15, exMin: "90-120",
      temperament: "Energetic intelligent willing",
      goodAt: "bird hunting field trials family pet retrieving running partner",
      topFacts: "Pointer + retriever + tracker in one body — used in upland bird hunting, waterfowl, and tracking|One of the highest-energy mainstream breeds — 2 hours of vigorous exercise daily is the minimum|Bloat (GDV) is a top lifetime risk — many owners do prophylactic gastropexy|Distinctive ticked liver-and-white coat is breed-specific",
      affection: 8, child: 8, protective: 5, vocal: 4
    }
  },
  {
    slug: "great-pyrenees", species: "dog", name: "Great Pyrenees", aka: "Pyr",
    size: "giant", grooming: 1.15, healthRisk: 1.15,
    purchase: { low: 800, typical: 1500, high: 3000 },
    avgLife: 11,
    notes: "Giant breed — anesthesia, surgery, and medication doses all scale with body weight. Bone-cancer risk meaningful.",
    yearRange: "$1,900–$4,500", yearOne: "$2,400–$5,800", lifetime: "$22,000–$46,000",
    costRows: {
      food: { low: 600, typ: 1000, high: 1800 },
      vet: { low: 300, typ: 600, high: 1300 },
      prevention: { low: 220, typ: 440, high: 720 },
      grooming: { low: 0, typ: 200, high: 600 },
      insurance: { low: 460, typ: 780, high: 1300 }
    },
    drivers: [
      { name: "Giant-body cost premium.", text: "Everything scales — food, flea/heartworm prevention, anesthesia for any surgery, even boarding. Budget 30–50% more than a 50 lb dog for the same care." },
      { name: "Hip and elbow dysplasia.", text: "Common in giant breeds. Severe surgery $5,000–$10,000 due to body size and implant cost." },
      { name: "Osteosarcoma (bone cancer).", text: "Pyrs are in the top-10 at-risk breeds. Treatment ranges from $5,000 (amputation only) to $15,000+ (with chemo)." },
      { name: "Bloat (GDV).", text: "Deep-chested giant breed — among the highest bloat-risk groups. Prophylactic gastropexy at spay/neuter is widely recommended." }
    ],
    insurance: "Pyr premiums run $55–$90/month. The math is hard to argue with for giant breeds — one orthopedic surgery or cancer treatment exceeds 10 years of premiums.",
    saveTips: [
      "Prophylactic gastropexy at spay/neuter ($300–$700) — far cheaper than emergency bloat surgery.",
      "Maintain lean body condition — single biggest factor in joint longevity for giants.",
      "Brush 2–3x/week during shedding seasons (April + October) to dramatically reduce professional groom needs.",
      "Adopt — Great Pyrenees Rescue Society and similar groups often have farm/working surrenders."
    ],
    faq: [
      { q: "How much does a Great Pyrenees cost per year?", a: "$1,900–$4,500. Food and prevention alone are 50% higher than a medium breed." },
      { q: "Do Great Pyrenees shed a lot?", a: "Yes — heavy seasonal coat blow twice a year. Daily brushing during those windows is required if you want to keep the carpet." },
      { q: "Is a Great Pyrenees good for apartments?", a: "Not ideal. They're livestock-guardian breed bred to roam — need fenced space and meaningful job/activity." }
    ],
    sources: ["NAPHIA 2024 — giant-breed claims data", "Morris Animal Foundation osteosarcoma data", "AKC breed standard"],
    traits: {
      weightM: "100-115", weightF: "85-100", height: "25-32",
      energy: 3, alone: "6-8", kid: "high", stranger: "medium", train: 3, shed: 5,
      grm: 60, exMin: "45-75",
      temperament: "Calm protective independent",
      goodAt: "livestock guarding property protection family companion",
      topFacts: "Bred to live with sheep on the Pyrenees Mountains for centuries — independent decision-makers, not biddable obedience dogs|Heavy double coat blows twice a year — expect tumbleweeds of white hair|Naturally nocturnal barkers (they're guarding) — apartment living is rough on neighbors|Double dewclaws on the hind legs are a breed characteristic, not a defect",
      affection: 8, child: 9, protective: 9, vocal: 7
    }
  },
  {
    slug: "mixed-breed", species: "dog", name: "Mixed Breed Dog", aka: "Mutt / Mongrel",
    size: "medium", grooming: 1.00, healthRisk: 0.90,
    purchase: { low: 0, typical: 250, high: 600 },
    avgLife: 13,
    notes: "Hybrid vigor + adoption-fee pricing make mixed-breed dogs the most cost-effective option for most households.",
    yearRange: "$1,200–$2,800", yearOne: "$1,600–$4,000", lifetime: "$16,000–$32,000",
    costRows: {
      food: { low: 300, typ: 500, high: 900 },
      vet: { low: 200, typ: 400, high: 900 },
      prevention: { low: 140, typ: 260, high: 440 },
      grooming: { low: 0, typ: 100, high: 400 },
      insurance: { low: 280, typ: 480, high: 800 }
    },
    drivers: [
      { name: "Hybrid vigor lowers baseline vet cost.", text: "Multiple peer-reviewed studies (UC Davis, Bellumori et al. 2013) show mixed-breed dogs have lower rates of 10 of 24 commonly-screened genetic disorders. Lifetime vet costs typically run 15–25% below comparable purebreds." },
      { name: "Adoption fees vs. breeder prices.", text: "Most shelters charge $100–$500 including initial vaccines, spay/neuter, and microchip — often $1,500+ of bundled value vs. paying a breeder." },
      { name: "Pet-insurance compatibility.", text: "Mixed breeds are accepted by every major insurer; premiums are typically 10–20% below comparable purebreds because actuarial risk is lower." },
      { name: "Trade-off: unknown family history.", text: "You don't get parent health screening results. A DNA test ($80–$130 from Embark or Wisdom Panel) reveals breed mix and any actionable genetic flags." }
    ],
    insurance: "Mixed-breed premiums average $25–$50/month. Insurance still makes mathematical sense for accidents — a single emergency vet visit can hit $3,000–$8,000 regardless of breed.",
    saveTips: [
      "Adopt from a municipal shelter — typically $50–$150 with vaccines, spay/neuter, and microchip included.",
      "DNA test ($80–$130) once, early — informs which breed-specific health checks make sense.",
      "Standard accident + illness insurance, not a breed-priced premium product.",
      "Most mixed breeds are robust — invest the savings in lean-body-weight maintenance and dental care."
    ],
    faq: [
      { q: "How much cheaper is a mixed-breed dog than a purebred?", a: "Acquisition: typically $1,000–$3,000 cheaper. Annual cost: 10–25% lower on average — hybrid vigor reduces breed-specific surgery and chronic-disease cost." },
      { q: "Are mixed-breed dogs healthier?", a: "On the metrics that have been studied, yes — Bellumori et al. (2013, JAVMA) found mixed-breeds have lower rates of 10 of 24 genetic disorders. But individual dogs vary; hybrid vigor is a statistical edge, not a guarantee." },
      { q: "Can I still get insurance for a mixed-breed dog?", a: "Yes — every major insurer covers mixed breeds. Premiums typically run lower than purebred equivalents." }
    ],
    sources: ["Bellumori et al. — JAVMA 2013, prevalence of inherited disorders in purebred vs mixed dogs", "ASPCA shelter intake statistics", "NAPHIA 2024 State of the Industry"],
    traits: {
      weightM: "30-70", weightF: "25-60", height: "15-25",
      energy: 3, alone: "5-7", kid: "high", stranger: "high", train: 4, shed: 3,
      grm: 20, exMin: "45-75",
      temperament: "Variable — depends on parentage and individual",
      goodAt: "family companion adaptable to most lifestyles",
      topFacts: "Per Rover's 2025 breed report mixed-breed dogs are the single most common dog type in U.S. households|Bellumori et al. (2013 JAVMA) found mixed-breeds have lower rates of 10 of 24 commonly-screened genetic disorders|A $80-130 DNA test reveals breed mix and useful health flags|Adoption fees of $100-500 typically bundle $1,500+ of vet services (vaccines spay/neuter microchip)",
      affection: 8, child: 9, protective: 5, vocal: 4
    }
  },
  {
    slug: "pembroke-welsh-corgi", species: "dog", name: "Pembroke Welsh Corgi", aka: "Corgi",
    size: "small", grooming: 1.05, healthRisk: 1.10,
    purchase: { low: 1500, typical: 2200, high: 3500 },
    avgLife: 13,
    notes: "Long back + heavy shedding. IVDD, hip dysplasia, and degenerative myelopathy are breed-specific risks.",
    yearRange: "$1,500–$3,400", yearOne: "$2,100–$5,000", lifetime: "$20,000–$40,000",
    costRows: {
      food: { low: 280, typ: 500, high: 900 },
      vet: { low: 280, typ: 550, high: 1200 },
      prevention: { low: 140, typ: 260, high: 440 },
      grooming: { low: 0, typ: 100, high: 350 },
      insurance: { low: 340, typ: 600, high: 1000 }
    },
    drivers: [
      { name: "Intervertebral disc disease (IVDD).", text: "The long-spine + short-leg build predisposes to disc problems. Surgery for severe cases runs $4,000–$8,000." },
      { name: "Degenerative myelopathy (DM).", text: "Pembrokes are the #1 breed for DM — a progressive spinal-cord disease. DNA test ($100) at adoption identifies risk; affected dogs need mobility support and eventually carts ($300–$1,000)." },
      { name: "Obesity drives joint disease.", text: "Corgis gain weight easily and the extra pounds amplify back/hip strain. Lean body condition is the single biggest cost lever." },
      { name: "Hip dysplasia.", text: "Higher rate than the small-breed average. Severe surgery $3,000–$6,000." }
    ],
    insurance: "Corgi premiums average $30–$55/month. Reasonable fit because of orthopedic + neurologic risk. Pick a policy that covers spinal surgery without a per-condition cap.",
    saveTips: [
      "Run the DM DNA test at adoption — informs long-term planning.",
      "Use ramps for car/couch from day one — reduces IVDD risk meaningfully.",
      "Strict food measurement; treats included in daily calories.",
      "Adopt — Corgi rescue groups (Mayflower Pembroke Welsh Corgi Club rescue, East Coast Corgi Rescue) often have young dogs."
    ],
    faq: [
      { q: "How much does a Pembroke Welsh Corgi cost per year?", a: "$1,500–$3,400. Joint health and weight management drive most of the variance." },
      { q: "Do Pembroke Corgis shed a lot?", a: "Yes — heavy double coat blows twice a year. Daily brushing during seasonal coat blow is non-negotiable." },
      { q: "Pembroke vs Cardigan — what's cheaper?", a: "Pembroke is more popular and generally $300–$800 less to purchase. Lifetime costs are similar." }
    ],
    sources: ["NAPHIA 2024 State of the Industry", "OFA registry — Pembroke Welsh Corgi DM data", "AKC breed standard"],
    traits: {
      weightM: "24-30", weightF: "23-28", height: "10-12",
      energy: 4, alone: "4-6", kid: "high", stranger: "medium", train: 5, shed: 4,
      grm: 30, exMin: "45-60",
      temperament: "Smart bold playful",
      goodAt: "herding family pet companion agility",
      topFacts: "Originally bred to herd cattle by nipping at heels — short stature was an advantage to dodge kicks|The breed is the #1 risk group for degenerative myelopathy (DM) — a $100 DNA test at adoption is worthwhile|Long-back build means jumping off couches is genuinely risky for the spine|Queen Elizabeth II famously owned 30+ Pembrokes over her reign",
      affection: 8, child: 8, protective: 6, vocal: 6
    }
  },
  {
    slug: "west-highland-white-terrier", species: "dog", name: "West Highland White Terrier", aka: "Westie",
    size: "small", grooming: 1.15, healthRisk: 1.15,
    purchase: { low: 1200, typical: 2000, high: 3000 },
    avgLife: 13,
    notes: "Atopic dermatitis is the famous Westie issue. Westie lung disease (idiopathic pulmonary fibrosis) is a documented breed-specific risk.",
    yearRange: "$1,600–$3,600", yearOne: "$2,200–$5,000", lifetime: "$22,000–$42,000",
    costRows: {
      food: { low: 240, typ: 420, high: 750 },
      vet: { low: 300, typ: 600, high: 1300 },
      prevention: { low: 130, typ: 240, high: 410 },
      grooming: { low: 240, typ: 480, high: 800 },
      insurance: { low: 340, typ: 600, high: 1000 }
    },
    drivers: [
      { name: "Atopic dermatitis is famous in Westies.", text: "Allergy-driven itch, ear infections, hot spots. Annual cost $800–$2,400 for chronic cases (Apoquel, Cytopoint, prescription diets, derm visits)." },
      { name: "Westie lung disease.", text: "Idiopathic pulmonary fibrosis is breed-specific. Onset typically age 8+; diagnostics + management run $1,500–$3,000/year for affected dogs." },
      { name: "Hand-stripping vs clipping.", text: "Traditional Westie coat is hand-stripped (not clipped) every 6–8 weeks. Hand-stripping costs $60–$100; many groomers no longer offer it." },
      { name: "Patellar luxation.", text: "Common small-breed orthopedic issue. Surgery $1,500–$3,500." }
    ],
    insurance: "Westie premiums average $30–$55/month. Strong fit because dermatology accounts for a high share of lifetime vet visits — confirm allergy diagnostics + meds are covered without sublimits.",
    saveTips: [
      "Establish a vet-derm relationship early — controlled allergy management is far cheaper than reactive treatment.",
      "Bathe with a vet-recommended chlorhexidine shampoo every 1–2 weeks to manage skin baseline.",
      "Find a groomer who hand-strips — keeps the coat correct and reduces skin issues.",
      "Adopt — Westie Rescue USA and regional Westie rescue groups have surrenders regularly."
    ],
    faq: [
      { q: "How much does a Westie cost per year?", a: "$1,600–$3,600. Allergic skin disease is the biggest cost variable; about a third of Westies need ongoing derm care." },
      { q: "Do Westies shed?", a: "Minimal shedding — but the wiry coat needs hand-stripping every 6–8 weeks to maintain texture and skin health." },
      { q: "Are Westies good with kids?", a: "Generally yes with respectful older kids. They're terriers — won't tolerate rough handling from toddlers." }
    ],
    sources: ["AAHA dermatology guidelines", "Veterinary respiratory journals — Westie pulmonary fibrosis", "AKC breed standard"],
    traits: {
      weightM: "15-22", weightF: "13-20", height: "10-11",
      energy: 3, alone: "4-6", kid: "medium", stranger: "medium", train: 3, shed: 1,
      grm: 50, exMin: "30-45",
      temperament: "Confident plucky devoted",
      goodAt: "vermin hunting companion apartment living",
      topFacts: "Originally bred in Scotland to hunt rats badgers and foxes — white coat made them visible from working terriers underground|Atopic dermatitis affects roughly 30-50% of the breed per derm-clinic data|Westie lung disease (idiopathic pulmonary fibrosis) is breed-specific — onset typically age 8+|Coat is traditionally hand-stripped not clipped — preserves texture and reduces skin issues",
      affection: 8, child: 7, protective: 5, vocal: 6
    }
  },

  /* ============ CATS (4) ============ */
  {
    slug: "devon-rex", species: "cat", name: "Devon Rex",
    size: "small", grooming: 1.05, healthRisk: 1.15,
    purchase: { low: 1500, typical: 2500, high: 4000 },
    avgLife: 14,
    notes: "Wavy short coat, very low shedding, intensely social. HCM and congenital myasthenia gravis are breed-specific risks.",
    yearRange: "$900–$2,100", yearOne: "$2,800–$5,800", lifetime: "$13,000–$28,000",
    costRows: {
      food: { low: 200, typ: 350, high: 600 },
      vet: { low: 200, typ: 400, high: 900 },
      prevention: { low: 80, typ: 140, high: 240 },
      grooming: { low: 0, typ: 60, high: 200 },
      insurance: { low: 280, typ: 480, high: 800 }
    },
    drivers: [
      { name: "Hypertrophic cardiomyopathy (HCM).", text: "Documented in the breed. Annual cardiology screening at age 3+ ($300–$500/visit including echo) catches early disease; treatment for affected cats $40–$100/month for life." },
      { name: "Congenital myasthenia gravis.", text: "Rare but breed-specific — muscle weakness from puppyhood. DNA test ($100) at purchase identifies carriers." },
      { name: "Hereditary baldness / coat issues.", text: "Coat genetics make some Devons partly bald in patches; not painful but cosmetic." },
      { name: "Social-needs cost.", text: "Devons hate being alone — leaving for a full workday without another pet is unkind. Companion cat or daily middle-of-day check-ins ($15–$25/visit) often needed." }
    ],
    insurance: "Devon Rex premiums average $25–$45/month. HCM coverage is the math here — early cardiac diagnostics and meds are covered by most policies.",
    saveTips: [
      "Confirm the breeder has done HCM echo screening on both parents.",
      "Get a second cat as a companion — far cheaper than mid-day pet-sitter visits.",
      "Skip grooming services — Devons need almost no professional grooming; just wipe ears + clip nails at home.",
      "Adopt — Devon Rex Rescue is small but active; surrenders happen due to the breed's high social needs."
    ],
    faq: [
      { q: "How much does a Devon Rex cost per year?", a: "$900–$2,100 — typical low-grooming cat cost, with HCM diagnostics adding $300–$500/year from age 3+." },
      { q: "Are Devon Rex hypoallergenic?", a: "Lower-shedding than most cats and many allergic humans tolerate them — but they still produce Fel d 1 allergen. Spend time around one before committing." },
      { q: "Devon Rex vs Cornish Rex — what's the difference?", a: "Both have curly coats from separate genetic mutations. Devon is larger-eared, more impish; Cornish has a finer build and tighter waves." }
    ],
    sources: ["Winn Feline Foundation — Devon Rex HCM data", "TICA breed standard", "AAFP feline cardiac guidelines"],
    traits: {
      weightM: "8-10", weightF: "6-8", height: "10-12",
      energy: 4, alone: "4-6", kid: "high", stranger: "high", train: 4, shed: 1,
      grm: 10, exMin: "30-45",
      temperament: "Affectionate mischievous people-oriented",
      goodAt: "companion lap warmer apartment living",
      topFacts: "Coat mutation is separate from the Cornish Rex — Devons have shorter and wavier coat|Famously dog-like — fetches greets at the door follows owners room to room|HCM (heart disease) is breed-specific — annual echo screening from age 3+ is standard|Among the most social cat breeds — leaving alone full workdays is genuinely unkind",
      affection: 10, child: 9, protective: 1, vocal: 5
    }
  },
  {
    slug: "domestic-shorthair", species: "cat", name: "Domestic Shorthair", aka: "DSH / Mixed-Breed Cat / Moggy",
    size: "small", grooming: 1.00, healthRisk: 0.90,
    purchase: { low: 0, typical: 100, high: 300 },
    avgLife: 15,
    notes: "Mixed-genetics non-pedigree cat — the most common cat type in U.S. households. Hybrid vigor + adoption pricing make this the most cost-effective cat option.",
    yearRange: "$700–$1,600", yearOne: "$1,000–$2,400", lifetime: "$11,000–$22,000",
    costRows: {
      food: { low: 180, typ: 320, high: 550 },
      vet: { low: 150, typ: 300, high: 700 },
      prevention: { low: 60, typ: 120, high: 200 },
      grooming: { low: 0, typ: 0, high: 100 },
      insurance: { low: 200, typ: 360, high: 600 }
    },
    drivers: [
      { name: "Adoption fee bundles real value.", text: "Most shelters charge $50–$200 including initial vaccines, spay/neuter, microchip, and FeLV/FIV testing — $400+ of bundled vet services." },
      { name: "Hybrid vigor lowers baseline risk.", text: "Non-pedigree cats avoid breed-concentrated conditions like Persian PKD, Maine Coon HCM, Sphynx skin issues. Lifetime vet cost is typically 20–30% below pedigreed cats." },
      { name: "Insurance is still worth it.", text: "Routine cost is low, but a single urinary blockage ER visit can hit $3,000–$5,000. Premiums for DSHs are the cheapest cat tier ($15–$30/mo)." },
      { name: "Indoor lifestyle dramatically lowers cost.", text: "Indoor DSHs live 12–18 years vs 3–6 outdoor — entirely from injury/disease avoidance." }
    ],
    insurance: "DSH premiums are the cheapest cat tier — $15–$30/month. Worth carrying for the catastrophic-event protection (urinary blockage, hit-by-car, foreign body ingestion).",
    saveTips: [
      "Adopt from a municipal shelter — typically $50–$100 fully vetted.",
      "Indoor lifestyle is the single biggest cost reducer.",
      "Buy litter and food in bulk through subscription services (10–15% discount).",
      "Annual wellness exam + dental brushing at home — heads off the most common expensive issues."
    ],
    faq: [
      { q: "How much does a Domestic Shorthair cost per year?", a: "$700–$1,600 — the cheapest cat tier. Most variance is litter type and whether you carry insurance." },
      { q: "Are mixed-breed cats healthier than pedigreed cats?", a: "On average, yes. Hybrid vigor reduces breed-concentrated conditions. Individual cats still vary." },
      { q: "Can I get insurance for a DSH?", a: "Yes — every major pet insurer covers DSHs. Premiums are the lowest tier across cat breeds." }
    ],
    sources: ["ASPCA shelter intake statistics", "Cornell Feline Health Center — indoor vs outdoor cat lifespan data", "NAPHIA 2024 — feline claims data"],
    traits: {
      weightM: "9-12", weightF: "7-10", height: "9-10",
      energy: 3, alone: "8-12", kid: "high", stranger: "medium", train: 3, shed: 3,
      grm: 5, exMin: "30-45",
      temperament: "Variable — depends on individual",
      goodAt: "companion apartment living indoor lifestyle",
      topFacts: "Most common cat type in U.S. households — roughly 90-95% of pet cats are non-pedigree|Indoor lifespan averages 15+ years vs 3-6 for outdoor cats|Genetic diversity reduces concentration of breed-specific diseases like Persian PKD and Maine Coon HCM|Adoption fees typically bundle $400+ of vet services (vaccines spay/neuter microchip FeLV/FIV test)",
      affection: 8, child: 8, protective: 2, vocal: 4
    }
  },
  {
    slug: "exotic-shorthair", species: "cat", name: "Exotic Shorthair", aka: "Persian in pajamas",
    size: "small", grooming: 1.10, healthRisk: 1.25,
    purchase: { low: 1500, typical: 2500, high: 4000 },
    avgLife: 14,
    notes: "Brachycephalic Persian-derivative with a short coat. Eye discharge, dental crowding, PKD risk inherited from Persian line.",
    yearRange: "$1,000–$2,400", yearOne: "$3,000–$6,200", lifetime: "$14,000–$32,000",
    costRows: {
      food: { low: 200, typ: 360, high: 600 },
      vet: { low: 250, typ: 500, high: 1100 },
      prevention: { low: 80, typ: 140, high: 240 },
      grooming: { low: 0, typ: 80, high: 240 },
      insurance: { low: 300, typ: 540, high: 900 }
    },
    drivers: [
      { name: "Brachycephalic face = eye + breathing care.", text: "Daily eye-tear wipes are part of the routine. Some Exotics need surgical correction of entropion or stenotic nares — $1,500–$3,500." },
      { name: "Polycystic kidney disease (PKD).", text: "Inherited from Persian line. DNA test ($100) confirms carrier/affected status. Affected cats develop progressive renal failure — management costs $50–$150/month from diagnosis." },
      { name: "Dental crowding.", text: "Flat face = crowded teeth = professional cleanings every 1–2 years ($400–$800)." },
      { name: "Hypertrophic cardiomyopathy (HCM).", text: "Documented in the breed at lower rates than Persian. Annual cardiac screening at age 3+ recommended." }
    ],
    insurance: "Exotic Shorthair premiums average $30–$55/month. Strong fit — kidney disease, dental, and eye care all add up over a lifetime. Confirm the policy covers chronic kidney management without sub-limits.",
    saveTips: [
      "Confirm breeder has done PKD DNA test on both parents — affected cats can still be lovely but you'll plan for renal care.",
      "Daily 30-second eye-wipe routine prevents staining-related infections.",
      "Dental brushing 3x/week genuinely delays the first professional cleaning by years.",
      "Adopt — Persian and Himalayan Cat Rescue (PHCR) takes surrendered Exotics regularly."
    ],
    faq: [
      { q: "How much does an Exotic Shorthair cost per year?", a: "$1,000–$2,400. Dental care and senior renal management are the swing items." },
      { q: "Is an Exotic Shorthair just a short-haired Persian?", a: "Functionally yes — same body, face, and temperament as a Persian, with a plush short coat. Grooming is far easier; breed-specific health risks are the same." },
      { q: "Do Exotic Shorthairs need grooming?", a: "Minimal — weekly brushing keeps the coat soft. The bigger routine is daily eye/face wipes due to brachycephalic tear drainage." }
    ],
    sources: ["CFA breed standard", "International Cat Care — PKD data for Persian/Exotic", "AAFP feline cardiac guidelines"],
    traits: {
      weightM: "9-12", weightF: "7-10", height: "10-12",
      energy: 2, alone: "6-10", kid: "high", stranger: "medium", train: 2, shed: 3,
      grm: 15, exMin: "20-30",
      temperament: "Calm gentle affectionate",
      goodAt: "companion lap warmer apartment living",
      topFacts: "Created in the 1960s by crossing Persian with American Shorthair to get Persian temperament with a low-maintenance coat|Brachycephalic face means daily eye wipes are part of the routine|PKD (polycystic kidney disease) is inherited from the Persian line — DNA test at purchase is essential|Calmer than the average cat — earned the nickname \"Persian in pajamas\"",
      affection: 9, child: 8, protective: 1, vocal: 2
    }
  },
  {
    slug: "siberian-cat", species: "cat", name: "Siberian Cat", aka: "Siberian Forest Cat",
    size: "medium", grooming: 1.15, healthRisk: 1.05,
    purchase: { low: 1200, typical: 2000, high: 3500 },
    avgLife: 14,
    notes: "Heavy triple coat, generally robust, marketed as lower-allergen due to reduced Fel d 1 production in many individuals.",
    yearRange: "$1,000–$2,200", yearOne: "$2,300–$5,200", lifetime: "$14,000–$30,000",
    costRows: {
      food: { low: 220, typ: 380, high: 650 },
      vet: { low: 200, typ: 400, high: 900 },
      prevention: { low: 80, typ: 140, high: 240 },
      grooming: { low: 0, typ: 100, high: 300 },
      insurance: { low: 240, typ: 420, high: 720 }
    },
    drivers: [
      { name: "Seasonal coat blow.", text: "Heavy triple coat sheds dramatically twice a year (spring/fall). Daily brushing during those weeks; otherwise weekly is plenty." },
      { name: "Hypertrophic cardiomyopathy (HCM).", text: "Documented in the breed at moderate rates. Annual cardiac screening at age 3+ ($300–$500/visit including echo)." },
      { name: "Lower-allergen marketing — verify before buying.", text: "Many Siberians produce less Fel d 1 protein than the average cat — but not all. If allergies matter, spend 30+ minutes with the specific cat (or its parents) before committing." },
      { name: "Robust outside of HCM.", text: "Beyond cardiac, Siberians are among the healthier pedigreed cat breeds — fewer breed-specific issues than Persian/Maine Coon." }
    ],
    insurance: "Siberian premiums average $25–$45/month. Reasonable fit given HCM risk, but lower than many pedigreed cats — premiums are toward the lower end of cat tiers.",
    saveTips: [
      "Confirm HCM echo screening on both parents from your breeder.",
      "Brush 2–3x/week year-round, daily during seasonal coat blow — avoids matting and limits hairballs.",
      "Allergy-prone humans: test compatibility before paying — Fel d 1 levels vary cat to cat.",
      "Adopt — Siberian rescue networks exist (Siberian Cat Rescue, regional groups) but supply is limited."
    ],
    faq: [
      { q: "How much does a Siberian Cat cost per year?", a: "$1,000–$2,200. Grooming and HCM monitoring drive most of the variance." },
      { q: "Are Siberian Cats hypoallergenic?", a: "Reduced Fel d 1 levels in many individuals — but not all. The breed is lower-allergen on average, not allergen-free." },
      { q: "Do Siberians need a lot of grooming?", a: "Weekly brushing year-round; daily during the spring/fall coat blow. They don't typically need professional grooming." }
    ],
    sources: ["Winn Feline Foundation — Siberian HCM data", "TICA breed standard", "Studies on Fel d 1 variability across cat breeds"],
    traits: {
      weightM: "11-17", weightF: "8-12", height: "11-13",
      energy: 3, alone: "8-12", kid: "high", stranger: "high", train: 3, shed: 4,
      grm: 30, exMin: "30-45",
      temperament: "Affectionate adaptable playful",
      goodAt: "companion family apartment living indoor lifestyle",
      topFacts: "National cat of Russia — appears in Russian folklore for over a thousand years|Many individuals produce less Fel d 1 protein than average — basis of lower-allergen reputation|Heavy triple coat sheds dramatically in spring and fall but is largely self-maintaining otherwise|Among the more dog-like cat breeds — follows owners and welcomes strangers",
      affection: 9, child: 9, protective: 2, vocal: 4
    }
  }
];

/* ---------------- Page template ---------------- */
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtMoney(n) { return "$" + Number(n).toLocaleString("en-US"); }

function renderHero(b) {
  // SVG placeholder until real photo is sourced
  return '/breeds/' + b.slug + '-cost/hero.svg';
}

function renderPage(b) {
  var title = b.name + " Cost — Annual, First-Year &amp; Lifetime Estimates";
  var pageUrl = "https://petplanwise.com/breeds/" + b.slug + "-cost/";
  var lcLede = "Most " + b.name + " owners spend <strong>" + b.yearRange + " per year</strong>. Year-one cost runs <strong>" + b.yearOne + "</strong>. Lifetime cost is typically <strong>" + b.lifetime + "</strong> over " + Math.max(1, b.avgLife - 2) + "–" + (b.avgLife + 2) + " years.";

  var driversHtml = b.drivers.map(function (d) {
    return '      <li><strong>' + escapeHtml(d.name) + '</strong> ' + escapeHtml(d.text) + '</li>';
  }).join("\n");
  var savesHtml = b.saveTips.map(function (s) { return '      <li>' + escapeHtml(s) + '</li>'; }).join("\n");
  var faqHtml = b.faq.map(function (f) {
    return '      <details><summary>' + escapeHtml(f.q) + '</summary><p>' + escapeHtml(f.a) + '</p></details>';
  }).join("\n");
  var sourcesHtml = b.sources.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join("");
  var faqJsonLd = JSON.stringify(b.faq.map(function (f) {
    return { "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } };
  }));

  var calculatorData = b.species === "cat" ? 'data-calculator="cat"' : 'data-calculator="dog"';
  var dataBreed = 'data-breed="' + b.slug + '"';
  var dataStage = b.species === "cat" ? 'data-stage="adult"' : 'data-stage="adult"';

  var traitsCard = renderTraitsCard(b);

  return '<!doctype html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="utf-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '  <title>' + title + '</title>\n' +
    '  <meta name="description" content="What does a ' + b.name + ' really cost? Adoption, food, vet, lifetime — full breakdown plus prefilled calculator." />\n' +
    '  <meta property="og:description" content="What does a ' + b.name + ' really cost? Adoption, food, vet, lifetime — full breakdown plus prefilled calculator." />\n' +
    '  <meta property="og:title" content="' + title + '" />\n' +
    '  <link rel="canonical" href="' + pageUrl + '" />\n' +
    '  <meta property="og:url" content="' + pageUrl + '" />\n' +
    '  <meta property="og:image" content="https://petplanwise.com/assets/og-image.png" />\n' +
    '  <meta property="og:image:width" content="1200" />\n' +
    '  <meta property="og:image:height" content="630" />\n' +
    '  <meta property="og:type" content="website" />\n' +
    '  <meta name="twitter:card" content="summary_large_image" />\n' +
    '  <meta name="twitter:image" content="https://petplanwise.com/assets/og-image.png" />\n' +
    '  <meta name="twitter:title" content="' + b.name + ' Cost — Annual, First-Year & Lifetime Estimates" />\n' +
    '  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' rx=\'20\' fill=\'%230F766E\'/%3E%3Ctext x=\'50\' y=\'66\' font-family=\'system-ui,sans-serif\' font-weight=\'700\' font-size=\'58\' fill=\'white\' text-anchor=\'middle\'%3E%24%3C/text%3E%3C/svg%3E" />\n' +
    '\n' +
    '  <link rel="preconnect" href="https://fonts.googleapis.com" data-ppw-inter>\n' +
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin data-ppw-inter>\n' +
    '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" data-ppw-inter>\n' +
    '  <link rel="stylesheet" href="/assets/css/site.css?v=' + CACHE_V + '" />\n' +
    '  <script src="/assets/data/csv-loader-' + CACHE_V + '.js" defer></script>\n' +
    '  <script src="/assets/data/base-costs.js" defer></script>\n' +
    '  <script src="/assets/data/multipliers.js" defer></script>\n' +
    '  <script src="/assets/data/breeds.js" defer></script>\n' +
    '  <script src="/assets/data/procedures.js" defer></script>\n' +
    '  <script src="/assets/data/insurance.js" defer></script>\n' +
    '  <script src="/assets/data/cities.js" defer></script>\n' +
    '  <script src="/assets/data/breed-images.js" defer></script>\n' +
    '  <script src="/assets/js/layout-' + CACHE_V + '.js" defer></script>\n' +
    '  <script src="/assets/js/calculator-' + CACHE_V + '.js" defer></script>\n' +
    '  <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://petplanwise.com/"},{"@type":"ListItem","position":2,"name":"' + b.name + ' cost","item":"' + pageUrl + '"}]}</script>\n' +
    '  <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":' + faqJsonLd + '}</script>\n' +
    '</head>\n' +
    '<body>\n' +
    '<div id="site-header"></div>\n' +
    '<main>\n' +
    '  <div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span>' + b.name + ' cost</nav></div>\n' +
    '  <section style="padding: 24px 0 12px;"><div class="container">\n' +
    '    <span class="eyebrow">' + b.name + '</span>\n' +
    '    <h1>' + b.name + ' cost calculator</h1>\n' +
    '    <figure class="breed-hero-static" style="margin:0 0 16px;border-radius:14px;overflow:hidden;">\n' +
    '      <img src="' + renderHero(b) + '" width="1200" height="630" alt="' + b.name + '" loading="eager" fetchpriority="high" decoding="async">\n' +
    '    </figure>\n' +
    '    <p class="lede prose">' + lcLede + '</p>\n' +
    '  </div></section>\n' +
    '  <section style="padding-top: 0;"><div class="container"><div ' + calculatorData + ' ' + dataBreed + ' ' + dataStage + '></div></div></section>\n' +
    '\n' +
    '  <section><div class="container prose">\n' +
    '    <h2>Cost summary</h2>\n' +
    '    <table class="cost-table">\n' +
    '      <thead><tr><th>Category</th><th class="num">Low</th><th class="num">Typical</th><th class="num">High</th></tr></thead>\n' +
    '      <tbody>\n' +
    '        <tr><td>Purchase / adoption</td><td class="num">' + fmtMoney(b.purchase.low) + '</td><td class="num">' + fmtMoney(b.purchase.typical) + '</td><td class="num">' + fmtMoney(b.purchase.high) + '</td></tr>\n' +
    '        <tr><td>Annual food</td><td class="num">' + fmtMoney(b.costRows.food.low) + '</td><td class="num">' + fmtMoney(b.costRows.food.typ) + '</td><td class="num">' + fmtMoney(b.costRows.food.high) + '</td></tr>\n' +
    '        <tr><td>Annual vet care</td><td class="num">' + fmtMoney(b.costRows.vet.low) + '</td><td class="num">' + fmtMoney(b.costRows.vet.typ) + '</td><td class="num">' + fmtMoney(b.costRows.vet.high) + '</td></tr>\n' +
    '        <tr><td>Annual prevention</td><td class="num">' + fmtMoney(b.costRows.prevention.low) + '</td><td class="num">' + fmtMoney(b.costRows.prevention.typ) + '</td><td class="num">' + fmtMoney(b.costRows.prevention.high) + '</td></tr>\n' +
    '        <tr><td>Annual grooming</td><td class="num">' + fmtMoney(b.costRows.grooming.low) + '</td><td class="num">' + fmtMoney(b.costRows.grooming.typ) + '</td><td class="num">' + fmtMoney(b.costRows.grooming.high) + '</td></tr>\n' +
    '        <tr><td>Insurance (optional)</td><td class="num">' + fmtMoney(b.costRows.insurance.low) + '</td><td class="num">' + fmtMoney(b.costRows.insurance.typ) + '</td><td class="num">' + fmtMoney(b.costRows.insurance.high) + '</td></tr>\n' +
    '      </tbody>\n' +
    '    </table>\n' +
    '\n' +
    '    <h2>' + b.name + '-specific cost drivers</h2>\n' +
    '    <ul>\n' +
    driversHtml + '\n' +
    '    </ul>\n' +
    '\n' +
    '    <h2>Insurance for ' + (b.aka || b.name) + 's</h2>\n' +
    '    <p>' + escapeHtml(b.insurance) + '</p>\n' +
    '\n' +
    '    <h2>Ways to save</h2>\n' +
    '    <ul>\n' +
    savesHtml + '\n' +
    '    </ul>\n' +
    '  </div></section>\n' +
    '\n' +
    '  <section><div class="container"><p class="affiliate-disclosure-above"><strong>Disclosure:</strong> The link below is an affiliate partner. We may earn a commission at no extra cost to you. This does not affect our cost estimates. <a href="/affiliate-disclosure/">Learn more.</a></p><div class="affiliate">\n' +
    '    <div><span class="affiliate-tag">Sponsored</span><h3>Compare insurance for ' + b.name + 's</h3><p>See real quotes from top-rated U.S. pet insurers.</p></div>\n' +
    '    <a class="btn" href="/pet-insurance-vs-savings/">Run the math</a>\n' +
    '  </div></div></section>\n' +
    '\n' +
    '  <section><div class="container">\n' +
    '    <h2>FAQ</h2>\n' +
    '    <div class="faq" style="max-width: var(--readw)">\n' +
    faqHtml + '\n' +
    '    </div>\n' +
    '  </div></section>\n' +
    '\n' +
    '  <section><div class="container" style="padding: 12px 0 8px;">\n' +
    '    <div class="reviewer-block">\n' +
    '      <span class="avatar" aria-hidden="true">PC</span>\n' +
    '      <div>\n' +
    '        <div class="who">Fact-checked by PetPlanWise Editorial</div><div class="who-meta" style="font-size:12px;color:var(--muted, #6B7280);font-weight:400;margin-top:2px;">Cost methodology cross-referenced with published AAHA, AVDC, AVMA, NAPHIA, and Banfield data. <a href="/editorial-standards/">Read our editorial standards</a> — no individual veterinarian endorsement.</div>\n' +
    '        <div class="meta">Cost data reviewed May 2026 · methodology audited quarterly</div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div></section>\n' +
    '\n' +
    '  <section><div class="container sources">\n' +
    '    <h2>Sources</h2>\n' +
    '    <ul>' + sourcesHtml + '</ul>\n' +
    '  </div></section>\n' +
    '\n' +
    '  <section style="padding: 12px 0 4px;"><div class="container">\n' +
    '    <a href="/compare/?a=' + b.slug + '" class="cmp-deep-link" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.25);border-radius:999px;color:var(--primary-700,#115E59);text-decoration:none;font-size:14px;font-weight:600;">\n' +
    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>\n' +
    '      Compare this breed to another →\n' +
    '    </a>\n' +
    '  </div></section>\n' +
    '\n' +
    traitsCard +
    '</main>\n' +
    '<div id="site-footer"></div>\n' +
    '</body>\n' +
    '</html>\n';
}

function renderTraitsCard(b) {
  var t = b.traits;
  var energyDots = "●".repeat(t.energy) + "○".repeat(5 - t.energy);
  var trainDots = "●".repeat(t.train) + "○".repeat(5 - t.train);
  var shedDots = "●".repeat(t.shed) + "○".repeat(5 - t.shed);
  var goodKidsLine = t.kid === "high" ? "<strong>Great with kids;</strong>" : t.kid === "medium" ? "<strong>Generally OK with respectful kids;</strong>" : "<strong>Best in adult-only homes;</strong>";
  var strangerLine = t.stranger === "high" ? "Friendly with strangers." : t.stranger === "medium" ? "Reserved with strangers." : "Wary of strangers.";
  var topFactsList = t.topFacts.split("|").map(function (f) { return '<li>' + escapeHtml(f) + '</li>'; }).join("");
  return '  <section class="breed-traits"><div class="container">\n' +
    '    <h2 id="traits">Traits and temperament — ' + b.name + '</h2>\n' +
    '    <p class="lede prose">A quick read on what living with a ' + b.name + ' is actually like. Numbers are typical breed-standard ranges from AKC (dogs) and CFA / TICA (cats); individual ' + b.name + 's vary.</p>\n' +
    '    <div class="trait-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px 18px;margin:18px 0;">\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Weight</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;">' + t.weightM + ' lb (male) · ' + t.weightF + ' lb (female)</div>\n' +
    '      </div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Height</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;">' + t.height + ' inches</div>\n' +
    '      </div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Energy level</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + energyDots + '</div>\n' +
    '        <div style="font-size:12px;color:var(--muted,#6B7280);margin-top:2px;">' + t.exMin + ' min/day of exercise</div>\n' +
    '      </div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Trainability</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + trainDots + '</div>\n' +
    '      </div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Shedding</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + shedDots + '</div>\n' +
    '        <div style="font-size:12px;color:var(--muted,#6B7280);margin-top:2px;">~' + t.grm + ' min/week grooming</div>\n' +
    '      </div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;">\n' +
    '        <div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Time alone</div>\n' +
    '        <div style="font-weight:600;margin-top:4px;">' + t.alone + ' hrs</div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '    <p class="prose"><strong>Temperament:</strong> ' + t.temperament + '. ' + goodKidsLine + ' ' + strangerLine + '</p>\n' +
    '    <p class="prose"><strong>What they are good at:</strong> ' + t.goodAt + '.</p>\n' +
    '    <h3>Things ' + b.name + ' owners ask about</h3>\n' +
    '    <ul class="prose">' + topFactsList + '</ul>\n' +
    '    <p class="muted text-sm">Sources: AKC breed standards (dogs), CFA / TICA breed standards (cats), Stanley Coren &quot;The Intelligence of Dogs&quot; (trainability ranking), Banfield State of Pet Health (breed-typical conditions). Individual pets vary widely — these are typical, not guaranteed.</p>\n' +
    '  </div></section>\n';
}

function renderHeroSVG(b) {
  var color = b.species === "cat" ? "#0F766E" : "#0F766E";
  var emoji = b.species === "cat" ? "🐱" : "🐶";
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">\n' +
    '  <defs>\n' +
    '    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">\n' +
    '      <stop offset="0" stop-color="#115E59"/>\n' +
    '      <stop offset="1" stop-color="#0F766E"/>\n' +
    '    </linearGradient>\n' +
    '    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">\n' +
    '      <circle cx="20" cy="20" r="1.5" fill="rgba(255,255,255,0.08)"/>\n' +
    '    </pattern>\n' +
    '  </defs>\n' +
    '  <rect width="1200" height="630" fill="url(#bg)"/>\n' +
    '  <rect width="1200" height="630" fill="url(#dots)"/>\n' +
    '  <text x="600" y="290" font-family="system-ui,sans-serif" font-size="120" text-anchor="middle" fill="rgba(255,255,255,0.95)">' + emoji + '</text>\n' +
    '  <text x="600" y="400" font-family="system-ui,sans-serif" font-weight="700" font-size="58" text-anchor="middle" fill="#fff">' + escapeHtml(b.name) + '</text>\n' +
    '  <text x="600" y="445" font-family="system-ui,sans-serif" font-size="22" text-anchor="middle" fill="rgba(255,255,255,0.75)">PetPlanWise</text>\n' +
    '</svg>\n';
}

/* ---------------- CSV row formatters ---------------- */
function csvEscape(s) {
  s = String(s == null ? "" : s);
  if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function breedsCsvRow(b) {
  return [b.slug, b.species, b.name, b.size, b.grooming.toFixed(2), b.healthRisk.toFixed(2),
    b.purchase.low, b.purchase.typical, b.purchase.high, b.avgLife, b.notes].map(csvEscape).join(",");
}
function traitsCsvRow(b) {
  var t = b.traits;
  return [b.slug, t.weightM, t.weightF, t.height, t.energy, t.alone, t.kid, t.stranger,
    t.train, t.shed, t.grm, t.exMin, t.temperament, t.goodAt, t.topFacts,
    t.affection, t.child, t.protective, t.vocal].map(csvEscape).join(",");
}

/* ---------------- Hub-page card insertion ---------------- */
function renderHubCard(b) {
  var blurbShort = b.notes.split(".")[0] + ".";
  var blurbDisplay = blurbShort.replace(/^./, function (c) { return c.toUpperCase(); });
  return '      <a class="card card-link breed-card" data-species="' + b.species + '" data-name="' + b.name.toLowerCase() + '" data-blurb="' + escapeHtml(blurbShort.toLowerCase()) + '" href="/breeds/' + b.slug + '-cost/"><div class="breed-card-body"><h3>' + b.name + '</h3><p class="muted">' + escapeHtml(blurbDisplay) + '</p></div><span class="breed-card-thumb" aria-hidden="true"><img src="/breeds/' + b.slug + '-cost/hero.svg?v=' + CACHE_V + '" alt="" loading="lazy" width="84" height="84" decoding="async"></span></a>\n';
}

function updateHub(allNew) {
  var hubPath = path.join(ROOT, "breeds", "index.html");
  var html = fs.readFileSync(hubPath, "utf8");

  /* Update visible-count spans */
  html = html.replace('<span class="visible-count" id="visible-count-dog">40 breeds</span>',
                      '<span class="visible-count" id="visible-count-dog">48 breeds</span>');
  html = html.replace('<span class="visible-count" id="visible-count-cat">14 breeds</span>',
                      '<span class="visible-count" id="visible-count-cat">18 breeds</span>');

  /* For each species: extract the cards, splice in new, alphabetize, re-emit */
  function spliceGroup(html, species, newBreeds) {
    var marker = '<div class="breed-group" id="breed-group-' + species + '">';
    var startIdx = html.indexOf(marker);
    if (startIdx < 0) return html;
    var openGrid = html.indexOf('<div class="grid grid-3">', startIdx);
    var afterOpen = html.indexOf('\n', openGrid) + 1;
    var closeGrid = html.indexOf('      </div>\n    </div>', afterOpen);
    var existingCards = html.substring(afterOpen, closeGrid);
    var existingLines = existingCards.split("\n").filter(function (l) { return l.indexOf('<a class="card card-link breed-card"') >= 0; });
    var newLines = newBreeds.map(function (b) { return renderHubCard(b).trimEnd(); });
    var allLines = existingLines.concat(newLines);
    allLines.sort(function (a, b) {
      var na = (a.match(/data-name="([^"]+)"/) || [, ""])[1];
      var nb = (b.match(/data-name="([^"]+)"/) || [, ""])[1];
      return na.localeCompare(nb);
    });
    var newGridBody = allLines.join("\n") + "\n";
    return html.substring(0, afterOpen) + newGridBody + html.substring(closeGrid);
  }

  html = spliceGroup(html, "dog", allNew.filter(function (b) { return b.species === "dog"; }));
  html = spliceGroup(html, "cat", allNew.filter(function (b) { return b.species === "cat"; }));

  /* Update ItemList JSON-LD — just append new entries at the end */
  var ilStart = html.indexOf('"@type":"ItemList","itemListElement":[');
  if (ilStart >= 0) {
    var ilEnd = html.indexOf(']}</script>', ilStart);
    var lastItemEnd = ilEnd; // points at ']}'
    var newItems = allNew.map(function (b, i) {
      // get the highest existing position then append
      return "";
    });
    // Parse existing array to find max position
    var posMatches = html.substring(ilStart, ilEnd).match(/"position":(\d+)/g) || [];
    var maxPos = 0;
    posMatches.forEach(function (m) {
      var n = parseInt(m.match(/\d+/)[0], 10);
      if (n > maxPos) maxPos = n;
    });
    var newItemsJson = allNew.map(function (b, i) {
      return ',{"@type":"ListItem","position":' + (maxPos + 1 + i) + ',"name":' + JSON.stringify(b.name) + ',"url":' + JSON.stringify("https://petplanwise.com/breeds/" + b.slug + "-cost/") + '}';
    }).join("");
    html = html.substring(0, ilEnd) + newItemsJson + html.substring(ilEnd);
  }

  fs.writeFileSync(hubPath, html, "utf8");
}

/* ---------------- Main ---------------- */
function main() {
  var pagesWritten = 0, skipped = 0;
  var newRowsBreeds = [], newRowsTraits = [];

  for (var i = 0; i < BREEDS.length; i++) {
    var b = BREEDS[i];
    var dir = path.join(ROOT, "breeds", b.slug + "-cost");
    if (fs.existsSync(dir)) {
      console.log("Skipping " + b.slug + " — directory already exists");
      skipped++;
      continue;
    }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), renderPage(b), "utf8");
    fs.writeFileSync(path.join(dir, "hero.svg"), renderHeroSVG(b), "utf8");
    newRowsBreeds.push(breedsCsvRow(b));
    newRowsTraits.push(traitsCsvRow(b));
    pagesWritten++;
    console.log("Wrote " + b.slug);
  }

  /* Append rows to CSVs */
  if (newRowsBreeds.length) {
    var breedsPath = path.join(ROOT, "assets/data/csv/breeds.csv");
    var existing = fs.readFileSync(breedsPath, "utf8");
    if (!existing.endsWith("\n")) existing += "\n";
    fs.writeFileSync(breedsPath, existing + newRowsBreeds.join("\n") + "\n", "utf8");

    var traitsPath = path.join(ROOT, "assets/data/csv/breed-traits.csv");
    var existingT = fs.readFileSync(traitsPath, "utf8");
    if (!existingT.endsWith("\n")) existingT += "\n";
    fs.writeFileSync(traitsPath, existingT + newRowsTraits.join("\n") + "\n", "utf8");

    /* Update hub */
    var allNew = BREEDS.filter(function (b) {
      return fs.existsSync(path.join(ROOT, "breeds", b.slug + "-cost", "index.html"));
    });
    updateHub(allNew);
  }

  console.log("\nDone. Pages written: " + pagesWritten + ", skipped: " + skipped);
}

main();
