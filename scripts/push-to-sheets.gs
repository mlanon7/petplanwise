/**
 * push-to-sheets.gs — YourPetBill.com data seeder
 *
 * One-time / on-demand: pushes every CSV in /assets/data/csv/ from the
 * petcost-bill repo into a tab in this Google Sheet.
 *
 * HOW TO USE
 *   1. Open the Google Sheet you want to populate.
 *   2. Extensions → Apps Script.
 *   3. Replace any code in the editor with this entire file.
 *   4. Click Save (floppy icon), then Run → run`pushAllCsvsToTabs`.
 *   5. First run will ask for permission to edit your spreadsheet — Allow.
 *   6. Wait ~10-20 seconds. Every tab will be created or replaced with the
 *      CSV data inlined below.
 *
 * After running this once, every tab is populated. From then on you edit
 * the SHEET (not the local CSVs). The site fetches the latest data live
 * via the gviz endpoint, with the bundled CSVs as offline fallback.
 *
 * Re-run this script whenever you want to reset the sheet to match the
 * version of the CSVs embedded here.
 *
 * Data source: 18 CSV tabs, embedded below as plain text.
 * Generated: 2026-05-09 03:00 UTC
 */

// =============================================================
// CSV DATA — every tab and its full CSV body, inlined.
// =============================================================
const CSV_DATA = {
  "age-multipliers": "species,stage,category,multiplier\ndog,puppy,food,1.10\ndog,puppy,routine_vet,1.45\ndog,puppy,vaccines,2.20\ndog,puppy,training,1.80\ndog,puppy,supplies,1.60\ndog,puppy,default,1.10\ndog,adult,default,1.00\ndog,senior,food,1.05\ndog,senior,routine_vet,1.60\ndog,senior,supplies,1.20\ndog,senior,default,1.05\ncat,kitten,food,1.15\ncat,kitten,routine_vet,1.50\ncat,kitten,vaccines,2.10\ncat,kitten,supplies,1.80\ncat,kitten,default,1.15\ncat,adult,default,1.00\ncat,senior,routine_vet,1.50\ncat,senior,supplies,1.15\ncat,senior,default,1.05\n",
  "base-costs": "species,category,low,typical,high\ndog,food,240,480,1200\ndog,treats,60,120,300\ndog,routine_vet,150,300,600\ndog,vaccines,80,150,300\ndog,preventatives,120,240,420\ndog,grooming,0,240,1200\ndog,training,0,150,900\ndog,boarding,0,240,900\ndog,insurance,300,600,1080\ndog,supplies,80,180,420\ndog,license,10,20,40\ncat,food,180,360,720\ncat,treats,40,80,180\ncat,litter,120,240,480\ncat,routine_vet,120,240,480\ncat,vaccines,60,100,220\ncat,preventatives,80,160,280\ncat,dental,0,100,600\ncat,insurance,240,420,720\ncat,supplies,60,120,280\ncat,grooming,0,60,300\n",
  "breed-images": "slug,src,alt,credit,credit_url,license,license_url,width,height\naustralian-cattle-dog,/breeds/australian-cattle-dog-cost/hero.jpg,Australian Cattle Dog dog,Guilbrynski,https://commons.wikimedia.org/wiki/File:%22Bender%22_Australian_Cattle_Dog_Creeping_Legend.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,960\naustralian-shepherd,/breeds/australian-shepherd-cost/hero.jpg,Australian Shepherd dog,Joselodos,https://commons.wikimedia.org/wiki/File:Wet_Australian_Shepherd_dog%2C_side_view.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,853\nbeagle,/breeds/beagle-cost/hero.jpg,Beagle dog,Trougnouf (Benoit Brummer),https://commons.wikimedia.org/wiki/File:Beagle_in_Viroinval_(DSC04556).jpg,CC BY 4.0,https://creativecommons.org/licenses/by/4.0,1280,825\nbengal,/breeds/bengal-cat-cost/hero.jpg,Bengal cat cat,Heikki Siltala from Finland,https://commons.wikimedia.org/wiki/File:Bengal_(18684760738).jpg,CC BY 2.0,https://creativecommons.org/licenses/by/2.0,1280,719\nbernese-mountain-dog,/breeds/bernese-mountain-dog-cost/hero.jpg,Bernese Mountain Dog dog,BunbunYU,https://commons.wikimedia.org/wiki/File:Bernese_Mountain_Dog_eating_grass.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,1707\nborder-collie,/breeds/border-collie-cost/hero.jpg,Border Collie dog,Michelle Buntin,https://commons.wikimedia.org/wiki/File:Border_collie_dog_in_the_snow.jpg,Public domain,,1280,853\nboston-terrier,/breeds/boston-terrier-cost/hero.jpg,Boston Terrier dog,Ed Siasoco,https://commons.wikimedia.org/wiki/File:Boston_Terrier_Dog_002.jpg,CC BY 2.0,https://creativecommons.org/licenses/by/2.0,1280,1792\nboxer,/breeds/boxer-cost/hero.jpg,Boxer dog,Mostafameraji,https://commons.wikimedia.org/wiki/File:Boxer_dog_in_iran.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,1920\nbritish-shorthair,/breeds/british-shorthair-cat-cost/hero.jpg,British Shorthair cat cat,Alexas_Fotos,https://commons.wikimedia.org/wiki/File:British_shorthair_cat-3113513.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,599\nbulldog,/breeds/bulldog-cost/hero.jpg,English Bulldog dog,https://pixabay.com/pt/users/kaz-19203/,https://commons.wikimedia.org/wiki/File:English_Bulldog_-Dog-220489-1280.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,931\ncane-corso,/breeds/cane-corso-cost/hero.jpg,Cane Corso dog,Dmitriy Savin,https://www.pexels.com/photo/photograph-of-a-cane-corso-dog-9470812/,Pexels Content License,https://www.pexels.com/license/,1280,1917\ncavalier-king-charles,/breeds/cavalier-king-charles-cost/hero.jpg,Cavalier King Charles Spaniel dog,Karelj,https://commons.wikimedia.org/wiki/File:King_Charles_Spaniel_Mike_1.jpg,Public domain,,1280,1527\nchihuahua,/breeds/chihuahua-cost/hero.jpg,Chihuahua dog,Caterinarufo,https://commons.wikimedia.org/wiki/File:Chihuahuas-_Holly%2C_Nina%2C_Doralice.jpg,Public domain,,1280,990\ncocker-spaniel,/breeds/cocker-spaniel-cost/hero.jpg,Cocker Spaniel dog,Unknown authorUnknown author,https://commons.wikimedia.org/wiki/File:Cocker_spaniel_dog.jpg,Public domain,,1280,960\ndachshund,/breeds/dachshund-cost/hero.jpg,Dachshund dog,Vinicius Cezario,https://www.pexels.com/photo/portrait-of-a-dachshund-11118046/,Pexels Content License,https://www.pexels.com/license/,1280,1920\ndoberman,/breeds/doberman-cost/hero.jpg,Doberman Pinscher dog,Joaquin Reyes Ramos,https://www.pexels.com/photo/alert-doberman-pinscher-dog-outdoors-37197896/,Pexels Content License,https://www.pexels.com/license/,1280,1707\nfrench-bulldog,/breeds/french-bulldog-cost/hero.jpg,French Bulldog dog,Marina Riijik,https://www.pexels.com/photo/french-bulldog-dog-20080176/,Pexels Content License,https://www.pexels.com/license/,1280,1445\ngerman-shepherd,/breeds/german-shepherd-cost/hero.jpg,German Shepherd Dog dog,Raghu mithinti at English Wikipedia,https://commons.wikimedia.org/wiki/File:1yearOldGermanShepherd.jpg,Public domain,,1280,960\ngolden-retriever,/breeds/golden-retriever-cost/hero.jpg,Golden Retriever dog,\"Ron Armstrong from Helena, MT, USA\",https://commons.wikimedia.org/wiki/File%3AGolden%20Retriever%20agility%20jump.jpg,CC BY 2.0,https://creativecommons.org/licenses/by/2.0,1280,857\ngreat-dane,/breeds/great-dane-cost/hero.jpg,Great Dane dog,Karen Arnold,https://commons.wikimedia.org/wiki/File:Great-dane-dog-1365445651zZJ.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,615,507\nlabrador-retriever,/breeds/labrador-retriever-cost/hero.jpg,Labrador Retriever dog,Dktue,https://commons.wikimedia.org/wiki/File:Portrait_of_a_labrador_retriever.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,853\nmaine-coon,/breeds/maine-coon-cat-cost/hero.jpg,Maine Coon cat cat,Hollakr,https://commons.wikimedia.org/wiki/File:Maine_Coon_Cat_Atticus.jpg,Public domain,,1280,960\nmastiff,/breeds/mastiff-cost/hero.jpg,English Mastiff dog,Sefa,https://www.pexels.com/photo/english-mastiff-on-field-18540351/,Pexels Content License,https://www.pexels.com/license/,1280,1920\nminiature-schnauzer,/breeds/miniature-schnauzer-cost/hero.jpg,Miniature Schnauzer dog,Amorim felipe at English Wikipedia,https://commons.wikimedia.org/wiki/File:Lua_schnauzer.jpg,Public domain,,800,600\nnewfoundland,/breeds/newfoundland-cost/hero.jpg,Newfoundland dog dog,Genadi Yakovlev,https://www.pexels.com/photo/newfoundland-dog-on-grass-21952861/,Pexels Content License,https://www.pexels.com/license/,1280,960\npersian,/breeds/persian-cat-cost/hero.jpg,Persian cat cat,User:Klarissae,https://commons.wikimedia.org/wiki/File:Old_Persian_cat_MUCA_2004.jpg,Public domain,,450,285\npitbull,/breeds/pitbull-cost/hero.jpg,American Staffordshire Terrier dog,Nicholas Espinosa,https://www.pexels.com/photo/american-staffordshire-terrier-16164914/,Pexels Content License,https://www.pexels.com/license/,1280,2276\npomeranian,/breeds/pomeranian-cost/hero.jpg,Pomeranian dog,Biswarup Ganguly,https://commons.wikimedia.org/wiki/File:Pomeranian_Dog_-_Kolkata_2011-10-31_6415.JPG,CC BY 3.0,https://creativecommons.org/licenses/by/3.0,1280,850\npoodle,/breeds/poodle-cost/hero.jpg,Standard Poodle dog,Rennett Stowe from USA,https://commons.wikimedia.org/wiki/File%3APoodle%20(3143809874).jpg,CC BY 2.0,https://creativecommons.org/licenses/by/2.0,1280,1173\npug,/breeds/pug-cost/hero.jpg,Pug dog,Wikivato at English Wikipedia,https://commons.wikimedia.org/wiki/File:Pug_close_up.jpg,Public domain,,600,450\nragdoll,/breeds/ragdoll-cat-cost/hero.jpg,Ragdoll cat cat,Cgomez766,https://commons.wikimedia.org/wiki/File:Gato_Ragdoll_Breedingcat.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,1214\nrottweiler,/breeds/rottweiler-cost/hero.jpg,Rottweiler dog,Karen Arnold,https://www.publicdomainpictures.net/view-image.php?image=34647&picture=dog-rottweiler,CC0 Public Domain,https://creativecommons.org/publicdomain/zero/1.0/,1920,1263\nscottish-fold,/breeds/scottish-fold-cat-cost/hero.jpg,Scottish Fold cat cat,Richard Blom,https://www.publicdomainpictures.net/en/view-image.php?image=53423&picture=scottish-fold,CC0 Public Domain,https://creativecommons.org/publicdomain/zero/1.0/,1920,1385\nshih-tzu,/breeds/shih-tzu-cost/hero.jpg,Shih Tzu dog,Marcelo RosaMelo,https://commons.wikimedia.org/wiki/File:Shih_tzu_dog.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,1707\nsiamese,/breeds/siamese-cat-cost/hero.jpg,Siamese cat cat,Jean Beaufort,https://www.publicdomainpictures.net/en/view-image.php?image=213386&picture=siamese-cat,CC0 Public Domain,https://creativecommons.org/publicdomain/zero/1.0/,1920,1279\nsiberian-husky,/breeds/siberian-husky-cost/hero.jpg,Siberian Husky dog,Wolf Art,https://www.pexels.com/photo/black-and-white-siberian-husky-8661629/,Pexels Content License,https://www.pexels.com/license/,1280,1600\nsphynx,/breeds/sphynx-cat-cost/hero.jpg,Sphynx cat cat,Jakub Hałun,https://commons.wikimedia.org/wiki/File:20170604_Sphynx_cat_7984.jpg,CC BY-SA 4.0,https://creativecommons.org/licenses/by-sa/4.0,1280,1061\nyorkshire-terrier,/breeds/yorkshire-terrier-cost/hero.jpg,Yorkshire Terrier dog,photostockeditor,https://www.pexels.com/photo/yorkshire-terrier-dog-pet-yorkie-8018340/,Pexels Content License,https://www.pexels.com/license/,1280,1707\n\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000",
  "breeds": "slug,species,name,size,grooming,health_risk,purchase_low,purchase_typical,purchase_high,avg_life,notes\nlabrador-retriever,dog,Labrador Retriever,large,1.00,1.10,800,1500,3500,11,\"Prone to hip/elbow dysplasia and obesity. Healthy weight management saves significant routine-vet cost over a lifetime.\"\nfrench-bulldog,dog,French Bulldog,small,1.10,1.55,1500,3500,8000,9,\"Brachycephalic — higher rates of respiratory issues, allergies, and C-section births. Insurance is often a strong fit for this breed.\"\ngolden-retriever,dog,Golden Retriever,large,1.10,1.20,500,1200,3500,11,\"Coat requires regular grooming. Hip dysplasia common. Generally healthy and responsive to vet care.\"\ngerman-shepherd,dog,German Shepherd,large,1.05,1.25,500,1000,3000,10,\"Hip dysplasia is common. High energy requires good nutrition and preventive care.\"\nbulldog,dog,Bulldog,small,0.90,1.70,1000,3000,8000,8,\"Brachycephalic with frequent respiratory, skin, and joint issues. One of the higher-cost breeds.\"\nmaine-coon,cat,Maine Coon,large,1.60,1.30,800,1500,3000,13,\"Long coat means real grooming costs. Hypertrophic cardiomyopathy (HCM) screening is recommended.\"\npersian,cat,Persian,small,2.00,1.35,500,1200,3500,11,\"Extensive grooming required to prevent matting. Prone to eye issues and respiratory problems.\"\nsiamese,cat,Siamese,small,0.80,1.10,400,800,2000,14,\"Generally healthy. Low grooming needs. Minimal breed-specific health issues.\"\nragdoll,cat,Ragdoll,large,1.40,1.15,600,1200,3000,14,\"Large breed with moderate grooming needs. Generally healthy with good lifespan.\"\nchihuahua,dog,Chihuahua,toy,0.60,1.00,300,800,1500,14,\"Small, generally healthy. Dental disease and patellar luxation are the most common cost drivers. Long lifespan spreads costs across more years.\"\npoodle,dog,Poodle (Standard),large,1.65,1.10,1000,2000,3500,12,\"Hypoallergenic coat needs professional grooming every 4-8 weeks. Generally healthy compared to other large breeds.\"\ndachshund,dog,Dachshund,small,0.80,1.30,500,1200,2500,13,\"Long-bodied breed with elevated risk of intervertebral disc disease (IVDD). Surgery for severe cases can run $4,000-$8,000.\"\nrottweiler,dog,Rottweiler,giant,0.90,1.30,1000,2000,3500,9,\"Large body, deep chest. Hip/elbow dysplasia, bone cancer risk, and bloat (GDV) are documented. Anesthesia and surgical costs scale with size.\"\naustralian-shepherd,dog,Australian Shepherd,medium,1.30,1.15,700,1400,2500,13,\"Heavy double coat needs regular brushing. Watch for MDR1 gene mutation affecting drug sensitivity — ask the vet to flag.\"\npitbull,dog,Pit Bull / American Staffordshire Terrier,large,0.70,1.10,100,500,1500,12,\"Generally healthy; skin allergies and ACL tears are most common. Insurance and rental policies sometimes apply breed-specific rules — check before adopting.\"\nbeagle,dog,Beagle,small,0.70,1.05,300,700,1500,13,\"Generally healthy. Watch obesity (food-driven breed) and ear infections (drop ears).\"\nboxer,dog,Boxer,large,0.70,1.30,800,1500,2500,11,\"Cancer-prone breed. Brachycephalic features and cardiac issues (boxer cardiomyopathy) drive lifetime costs up.\"\nyorkshire-terrier,dog,Yorkshire Terrier,toy,1.30,1.10,800,1500,2500,14,\"Long silky coat needs grooming. Dental disease and tracheal collapse are the most common cost drivers.\"\nsiberian-husky,dog,Siberian Husky,large,1.20,1.10,600,1200,2500,12,\"Heavy double coat (massive shedding). Generally healthy but eye conditions and hip dysplasia documented.\"\ndoberman,dog,Doberman Pinscher,large,0.75,1.30,1000,1800,3000,11,\"Dilated cardiomyopathy and von Willebrand disease (bleeding disorder) are documented. Pre-purchase health screening matters.\"\npug,dog,Pug,small,0.85,1.55,600,1500,3000,12,\"Brachycephalic — BOAS surgery is common. Eye injuries from prominent eyes. Skin fold infections.\"\nshih-tzu,dog,Shih Tzu,small,1.40,1.15,500,1000,2500,13,\"Long coat needs frequent grooming. Eye and dental issues common.\"\ncavalier-king-charles,dog,Cavalier King Charles Spaniel,small,1.10,1.45,1500,2500,4500,11,\"Mitral valve disease (heart) and syringomyelia (neurological) are common breed risks. Insurance is often a strong fit.\"\nboston-terrier,dog,Boston Terrier,small,0.70,1.25,600,1200,2500,13,\"Brachycephalic features. Eye injuries and corneal ulcers common.\"\nmastiff,dog,Mastiff,giant,0.85,1.30,1000,1800,3000,9,\"Hip dysplasia and bloat are documented. Short lifespan due to giant size; large food and anesthesia costs.\"\ngreat-dane,dog,Great Dane,giant,0.85,1.30,800,1800,3000,8,\"Bloat (GDV) is a major risk — preventive gastropexy is common. Cardiac issues and very short lifespan.\"\npomeranian,dog,Pomeranian,toy,1.25,1.10,600,1500,3000,14,\"Patellar luxation, dental disease, and tracheal collapse. Long-lifespan breed.\"\nborder-collie,dog,Border Collie,medium,1.10,1.10,700,1500,3000,13,\"Generally healthy. Hip dysplasia and Collie eye anomaly possible. High-energy lifestyle adds daycare/training costs.\"\nbernese-mountain-dog,dog,Bernese Mountain Dog,giant,1.30,1.45,1500,2500,4500,8,\"Cancer-prone breed (especially histiocytic sarcoma). Hip and elbow dysplasia. Very short lifespan.\"\ncane-corso,dog,Cane Corso,giant,0.80,1.25,1500,2500,4500,10,\"Hip dysplasia and eyelid conditions (entropion/ectropion). Massive food and anesthesia cost lines.\"\nminiature-schnauzer,dog,Miniature Schnauzer,small,1.40,1.10,800,1500,2500,14,\"Pancreatitis-prone (avoid fatty foods). Regular grooming required to maintain coat.\"\ncocker-spaniel,dog,Cocker Spaniel,medium,1.30,1.20,800,1500,2500,13,\"Recurring ear infections (drop ears + heavy fur). Eye conditions. Regular grooming a must.\"\naustralian-cattle-dog,dog,Australian Cattle Dog,medium,0.85,1.05,500,1000,2000,14,\"Healthy breed. Very high energy — many owners use daycare or hire walkers. Deafness can occur.\"\nnewfoundland,dog,Newfoundland,giant,1.40,1.30,1500,2500,4500,9,\"Hip and elbow dysplasia, cardiac issues (subaortic stenosis), drooling. Very large food and anesthesia bills.\"\nbengal,cat,Bengal,medium,0.80,1.15,1000,1800,3500,14,\"Active and playful. HCM screening recommended. Some states regulate ownership of early-generation Bengals.\"\nbritish-shorthair,cat,British Shorthair,medium,0.85,1.10,1000,1800,3000,14,\"Generally healthy. HCM and PKD screening recommended in breeding lines.\"\nsphynx,cat,Sphynx,medium,1.30,1.30,1500,2500,4500,13,\"Hairless cats need weekly bathing, sun protection, and warmth. HCM screening recommended.\"\nscottish-fold,cat,Scottish Fold,medium,0.85,1.45,1000,1800,3500,13,\"Osteochondrodysplasia (joint disease) is intrinsic to the folded-ear gene. Veterinary associations have raised welfare concerns about the breed.\"\n",
  "city-multipliers": "slug,name,state,multiplier\nnew-york-ny,New York City,NY,1.36\nmanhattan-ny,Manhattan,NY,1.45\nbrooklyn-ny,Brooklyn,NY,1.30\nlos-angeles-ca,Los Angeles,CA,1.30\nsan-francisco-ca,San Francisco,CA,1.45\nsan-diego-ca,San Diego,CA,1.20\nmiami-fl,Miami,FL,1.18\ntampa-fl,Tampa,FL,1.04\norlando-fl,Orlando,FL,1.05\naustin-tx,Austin,TX,1.06\ndallas-tx,Dallas-Fort Worth,TX,1.00\nhouston-tx,Houston,TX,0.98\nsan-antonio-tx,San Antonio,TX,0.92\nchicago-il,Chicago,IL,1.10\nboston-ma,Boston,MA,1.28\nseattle-wa,Seattle,WA,1.22\ndenver-co,Denver,CO,1.14\nphoenix-az,Phoenix,AZ,1.04\natlanta-ga,Atlanta,GA,1.02\nwashington-dc,Washington DC,DC,1.34\n",
  "emergency-fund": "species,low,typical,high\ndog,1500,3000,6000\ncat,1000,2000,4500\n",
  "emergency-keys": "key\nemergency_exam\nwound_repair\ntoxin_ingestion\nforeign_object\nurinary_blockage\nbroken_bone\nbloat_gdv\nparvo\nhbc\nseizure_workup\nheatstroke\nacl_surgery\nivdd_surgery\n",
  "first-year-one-time": "species,category,low,typical,high\ndog,adoption,50,300,3500\ndog,spay_neuter,100,300,600\ndog,starter_kit,150,280,500\ndog,crate_bed,60,120,280\ndog,initial_vet,150,280,500\ndog,microchip,25,50,80\ncat,adoption,25,150,600\ncat,spay_neuter,75,200,400\ncat,starter_kit,80,160,320\ncat,initial_vet,120,220,420\ncat,microchip,25,50,80\n",
  "insurance-defaults": "deductible,reimbursement,annual_limit\n500,0.80,10000\n",
  "insurance-monthly-premium": "species,stage,low,typical,high\ndog,puppy,28,50,80\ndog,adult,35,62,100\ndog,senior,70,105,175\ncat,kitten,14,24,42\ncat,adult,18,32,58\ncat,senior,34,60,95\n",
  "insurance-ranges": "species,level,monthly_premium,description\ndog,low,25,\"Younger/mixed breed, accident only\"\ndog,typical,62,\"Healthy adult, accident & illness\"\ndog,high,120,\"Older/high-risk breed, comprehensive\"\ncat,low,12,\"Younger/mixed, accident only\"\ncat,typical,32,\"Healthy adult, accident & illness\"\ncat,high,60,\"Older/high-risk, comprehensive\"\n",
  "life-expectancy": "species,group,years\ndog,toy,14\ndog,small,14\ndog,medium,12\ndog,large,11\ndog,giant,9\ncat,indoor,15\ncat,outdoor,10\n",
  "lifestyle-multipliers": "lifestyle,category,multiplier,note\nbasic,default,0.80,\nbasic,food,0.75,store-brand vs premium kibble\nbasic,treats,0.60,\nbasic,grooming,0.40,mostly DIY\nbasic,training,0.30,YouTube + group class only\nbasic,boarding,0.50,friend/family vs kennel\nbasic,supplies,0.70,basics no luxuries\nbasic,insurance,0.85,accident-only vs accident+illness\nbasic,routine_vet,0.85,\nstandard,default,1.00,U.S. median owner\npremium,default,1.40,\npremium,food,1.65,fresh/raw subscriptions prescription diets\npremium,treats,1.50,\npremium,grooming,2.00,pro grooming every 4-8 weeks\npremium,training,2.20,private trainer board-and-train\npremium,boarding,1.80,luxury suite kennel\npremium,supplies,1.50,premium gear\npremium,insurance,1.30,higher reimbursement % lower deductible\npremium,routine_vet,1.20,specialty clinic more frequent visits\n",
  "procedures": "key,name,low,typical,high,species,emergency_note\nphysical_exam,Wellness physical (annual),80,150,300,any,\nvaccines,Core vaccines (annual),80,200,400,any,\ndental_cleaning,Dental cleaning,200,600,1200,any,\nmicrochip,Microchip insertion,25,60,150,any,\nspay_neuter,Spay / neuter,200,600,1500,any,\nxray,X-ray (single view),80,200,500,any,\nultrasound,Ultrasound,200,500,1000,any,\nblood_work,Blood work / panel,80,250,600,any,\nurinalysis,Urinalysis,50,150,300,any,\nantibiotics,Antibiotic course,30,100,300,any,\npain_relief,Pain management (week),20,80,200,any,\nthyroid_meds,Thyroid medication (month),15,50,150,any,\nemergency_exam,ER exam (after hours),100,200,400,any,\nwound_repair,Wound / laceration repair,400,1100,2800,any,\ntoxin_ingestion,Toxin ingestion treatment,250,1100,4500,any,\"Call ASPCA Poison Control 888-426-4435 or your nearest ER immediately.\"\nforeign_object,Foreign object removal,800,3500,8000,any,\nurinary_blockage,Urinary blockage (cat),1200,2800,5500,cat,\"A blocked male cat is a life-threatening emergency. Go to the ER now.\"\nbroken_bone,Fracture repair,800,3500,7500,any,\nbloat_gdv,Bloat / GDV surgery,1800,5000,10000,dog,\"Bloat is a surgical emergency. Do not delay.\"\nparvo,Parvo treatment (puppy),600,2200,6500,dog,\"Suspected parvo in unvaccinated puppies — call your vet immediately.\"\nhbc,Hit-by-car trauma,1000,4000,12000,any,\nseizure_workup,Seizure diagnostics,500,1400,3500,any,\nheatstroke,Heatstroke treatment,400,1500,4500,any,\"Move to shade, apply cool (not cold) water, drive to ER.\"\nacl_surgery,ACL/CCL surgery (dog),2000,4500,7500,dog,\nivdd_surgery,IVDD spinal surgery,3500,7000,12000,dog,\n",
  "reviewer": "field,value\nname,Dr. Sarah Patel DVM\ntitle,Veterinary reviewer\nlicense,(license number on file with editorial)\nlicense_state,(pending real reviewer)\nphoto_url,/assets/images/reviewer-placeholder.svg\nbio,Reviews quarterly cost data updates against current AVMA NAPHIA and BLS sources. Real DVM placeholder — swap with a paid retained reviewer before public launch.\nreview_date,2026-05\n",
  "size-multipliers": "size,multiplier,note\ntoy,0.70,< 10 lb\nsmall,0.85,10-25 lb\nmedium,1.00,25-60 lb\nlarge,1.25,60-90 lb\ngiant,1.55,90+ lb\n",
  "state-adjusted-categories": "category\nroutine_vet\nvaccines\ngrooming\nboarding\ninsurance\nspay_neuter\n",
  "state-multipliers": "state,multiplier\nAL,0.92\nAK,1.18\nAZ,1.02\nAR,0.90\nCA,1.28\nCO,1.10\nCT,1.18\nDE,1.05\nFL,1.06\nGA,0.96\nHI,1.30\nID,0.96\nIL,1.04\nIN,0.94\nIA,0.92\nKS,0.92\nKY,0.92\nLA,0.94\nME,1.05\nMD,1.12\nMA,1.22\nMI,0.96\nMN,1.02\nMS,0.88\nMO,0.92\nMT,0.98\nNE,0.92\nNV,1.06\nNH,1.10\nNJ,1.18\nNM,0.94\nNY,1.30\nNC,0.98\nND,0.94\nOH,0.94\nOK,0.90\nOR,1.10\nPA,1.02\nRI,1.10\nSC,0.96\nSD,0.92\nTN,0.94\nTX,0.98\nUT,1.00\nVT,1.06\nVA,1.04\nWA,1.16\nWV,0.90\nWI,0.96\nWY,0.96\nDC,1.32\n"
};

// =============================================================
// Main entry point — run this from the Apps Script editor.
// =============================================================
function pushAllCsvsToTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabs = Object.keys(CSV_DATA);
  const log = [];
  let created = 0, replaced = 0;

  for (const tabName of tabs) {
    const csvText = CSV_DATA[tabName];
    const rows = parseCsv_(csvText);
    if (rows.length === 0) {
      log.push("[skip] " + tabName + " — empty CSV");
      continue;
    }

    let sheet = ss.getSheetByName(tabName);
    if (sheet) {
      sheet.clear();
      replaced++;
    } else {
      sheet = ss.insertSheet(tabName);
      created++;
    }

    // Determine maximum column count (headers may have more than some rows)
    let maxCols = 0;
    for (const r of rows) maxCols = Math.max(maxCols, r.length);
    // Pad each row to maxCols (Sheets requires uniform 2D arrays)
    const padded = rows.map(r => {
      const out = r.slice();
      while (out.length < maxCols) out.push("");
      return out;
    });

    sheet.getRange(1, 1, padded.length, maxCols).setValues(padded);

    // Bold header row
    sheet.getRange(1, 1, 1, maxCols).setFontWeight("bold").setBackground("#F1EAD3");
    sheet.setFrozenRows(1);
    // Auto-size columns (best-effort)
    for (let c = 1; c <= maxCols; c++) sheet.autoResizeColumn(c);

    log.push("[ok]  " + tabName + " — " + rows.length + " rows, " + maxCols + " cols");
  }

  // Show a summary in the Apps Script execution log AND a UI alert
  const summary =
    "Done. Tabs created: " + created + ", replaced: " + replaced +
    "\n\n" + log.join("\n");
  Logger.log(summary);
  try { SpreadsheetApp.getUi().alert("YourPetBill seeder", summary, SpreadsheetApp.getUi().ButtonSet.OK); }
  catch (e) { /* no UI in scheduled runs */ }
}

// =============================================================
// Custom menu so non-engineers can re-seed without opening
// the Apps Script editor.
// =============================================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("YourPetBill")
    .addItem("Seed all tabs from latest data", "pushAllCsvsToTabs")
    .addItem("Validate tab names match site", "validateTabNames_")
    .addToUi();
}

function validateTabNames_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const expected = Object.keys(CSV_DATA);
  const present = ss.getSheets().map(s => s.getName());
  const missing = expected.filter(t => present.indexOf(t) < 0);
  const extra   = present.filter(t => expected.indexOf(t) < 0);
  let msg = "Expected " + expected.length + " tabs, found " + present.length + ".";
  if (missing.length) msg += "\n\nMissing tabs (will be created on next seed):\n  " + missing.join("\n  ");
  if (extra.length)   msg += "\n\nExtra tabs (ignored by site):\n  " + extra.join("\n  ");
  if (!missing.length && !extra.length) msg += " All names match.";
  SpreadsheetApp.getUi().alert("Validate tab names", msg, SpreadsheetApp.getUi().ButtonSet.OK);
}

// =============================================================
// Tiny CSV parser — handles quoted fields with commas and "" escaping.
// =============================================================
function parseCsv_(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    if (inQ) {
      if (c === '"') {
        if (text.charAt(i + 1) === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ""; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === '\r') {} // ignore
      else field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  // Drop trailing all-empty rows
  while (rows.length && rows[rows.length - 1].every(v => v === "")) rows.pop();
  return rows;
}
