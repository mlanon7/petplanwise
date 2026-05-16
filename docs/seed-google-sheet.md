# PetPlanWise.com — Google Sheets seed manifest

Each section below is one tab in the Sheet. Tab name = section title.
Copy the lines under each tab heading into the matching tab in your Sheet.

## Tab: age-multipliers.csv

```csv
species,stage,category,multiplier
dog,puppy,food,1.10
dog,puppy,routine_vet,1.45
dog,puppy,vaccines,2.20
dog,puppy,training,1.80
dog,puppy,supplies,1.60
dog,puppy,default,1.10
dog,adult,default,1.00
dog,senior,food,1.05
dog,senior,routine_vet,1.60
dog,senior,supplies,1.20
dog,senior,default,1.05
cat,kitten,food,1.15
cat,kitten,routine_vet,1.50
cat,kitten,vaccines,2.10
cat,kitten,supplies,1.80
cat,kitten,default,1.15
cat,adult,default,1.00
cat,senior,routine_vet,1.50
cat,senior,supplies,1.15
cat,senior,default,1.05

```

## Tab: base-costs.csv

```csv
species,category,low,typical,high
dog,food,240,480,1200
dog,treats,60,120,300
dog,routine_vet,150,300,600
dog,vaccines,80,150,300
dog,preventatives,120,240,420
dog,grooming,0,240,1200
dog,training,0,150,900
dog,boarding,0,240,900
dog,insurance,300,600,1080
dog,supplies,80,180,420
dog,license,10,20,40
cat,food,180,360,720
cat,treats,40,80,180
cat,litter,120,240,480
cat,routine_vet,120,240,480
cat,vaccines,60,100,220
cat,preventatives,80,160,280
cat,dental,0,100,600
cat,insurance,240,420,720
cat,supplies,60,120,280
cat,grooming,0,60,300

```

## Tab: breed-images.csv

```csv
slug,src,alt,credit,credit_url,license,license_url,width,height
australian-cattle-dog,/breeds/australian-cattle-dog-cost/hero.jpg,Australian Cattle Dog dog,Guilbrynski,https://commons.wikimedia.org/wiki/File:%22Bender%22_Australian_Cattle_Dog_Creeping_Legend.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,960
australian-shepherd,/breeds/australian-shepherd-cost/hero.jpg,Australian Shepherd dog,Joselodos,https://commons.wikimedia.org/wiki/File:Wet_Australian_Shepherd_dog%2C_side_view.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,853
beagle,/breeds/beagle-cost/hero.jpg,Beagle dog,Trougnouf (Benoit Brummer),https://commons.wikimedia.org/wiki/File:Beagle_in_Viroinval_(DSC04556).jpg,CC BY 4.0,https://creativecommons.org/licenses/by/4.0,1280,825
bengal,/breeds/bengal-cat-cost/hero.jpg,Bengal cat cat,Heikki Siltala from Finland,https://commons.wikimedia.org/wiki/File:Bengal_(18684760738).jpg,CC BY 2.0,https://creativecommons.org/licenses/by/2.0,1280,719
bernese-mountain-dog,/breeds/bernese-mountain-dog-cost/hero.jpg,Bernese Mountain Dog dog,BunbunYU,https://commons.wikimedia.org/wiki/File:Bernese_Mountain_Dog_eating_grass.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,1707
border-collie,/breeds/border-collie-cost/hero.jpg,Border Collie dog,Michelle Buntin,https://commons.wikimedia.org/wiki/File:Border_collie_dog_in_the_snow.jpg,Public domain,,1280,853
boston-terrier,/breeds/boston-terrier-cost/hero.jpg,Boston Terrier dog,Ed Siasoco,https://commons.wikimedia.org/wiki/File:Boston_Terrier_Dog_002.jpg,CC BY 2.0,https://creativecommons.org/licenses/by/2.0,1280,1792
boxer,/breeds/boxer-cost/hero.jpg,Boxer dog,Mostafameraji,https://commons.wikimedia.org/wiki/File:Boxer_dog_in_iran.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,1920
british-shorthair,/breeds/british-shorthair-cat-cost/hero.jpg,British Shorthair cat cat,Alexas_Fotos,https://commons.wikimedia.org/wiki/File:British_shorthair_cat-3113513.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,599
bulldog,/breeds/bulldog-cost/hero.jpg,English Bulldog dog,https://pixabay.com/pt/users/kaz-19203/,https://commons.wikimedia.org/wiki/File:English_Bulldog_-Dog-220489-1280.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,931
cane-corso,/breeds/cane-corso-cost/hero.jpg,Cane Corso dog,Dmitriy Savin,https://www.pexels.com/photo/photograph-of-a-cane-corso-dog-9470812/,Pexels Content License,https://www.pexels.com/license/,1280,1917
cavalier-king-charles,/breeds/cavalier-king-charles-cost/hero.jpg,Cavalier King Charles Spaniel dog,Karelj,https://commons.wikimedia.org/wiki/File:King_Charles_Spaniel_Mike_1.jpg,Public domain,,1280,1527
chihuahua,/breeds/chihuahua-cost/hero.jpg,Chihuahua dog,Caterinarufo,https://commons.wikimedia.org/wiki/File:Chihuahuas-_Holly%2C_Nina%2C_Doralice.jpg,Public domain,,1280,990
cocker-spaniel,/breeds/cocker-spaniel-cost/hero.jpg,Cocker Spaniel dog,Unknown authorUnknown author,https://commons.wikimedia.org/wiki/File:Cocker_spaniel_dog.jpg,Public domain,,1280,960
dachshund,/breeds/dachshund-cost/hero.jpg,Dachshund dog,Vinicius Cezario,https://www.pexels.com/photo/portrait-of-a-dachshund-11118046/,Pexels Content License,https://www.pexels.com/license/,1280,1920
doberman,/breeds/doberman-cost/hero.jpg,Doberman Pinscher dog,Joaquin Reyes Ramos,https://www.pexels.com/photo/alert-doberman-pinscher-dog-outdoors-37197896/,Pexels Content License,https://www.pexels.com/license/,1280,1707
french-bulldog,/breeds/french-bulldog-cost/hero.jpg,French Bulldog dog,Marina Riijik,https://www.pexels.com/photo/french-bulldog-dog-20080176/,Pexels Content License,https://www.pexels.com/license/,1280,1445
german-shepherd,/breeds/german-shepherd-cost/hero.jpg,German Shepherd Dog dog,Raghu mithinti at English Wikipedia,https://commons.wikimedia.org/wiki/File:1yearOldGermanShepherd.jpg,Public domain,,1280,960
golden-retriever,/breeds/golden-retriever-cost/hero.jpg,Golden Retriever dog,"Ron Armstrong from Helena, MT, USA",https://commons.wikimedia.org/wiki/File%3AGolden%20Retriever%20agility%20jump.jpg,CC BY 2.0,https://creativecommons.org/licenses/by/2.0,1280,857
great-dane,/breeds/great-dane-cost/hero.jpg,Great Dane dog,Karen Arnold,https://commons.wikimedia.org/wiki/File:Great-dane-dog-1365445651zZJ.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,615,507
labrador-retriever,/breeds/labrador-retriever-cost/hero.jpg,Labrador Retriever dog,Dktue,https://commons.wikimedia.org/wiki/File:Portrait_of_a_labrador_retriever.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,853
maine-coon,/breeds/maine-coon-cat-cost/hero.jpg,Maine Coon cat cat,Hollakr,https://commons.wikimedia.org/wiki/File:Maine_Coon_Cat_Atticus.jpg,Public domain,,1280,960
mastiff,/breeds/mastiff-cost/hero.jpg,English Mastiff dog,Sefa,https://www.pexels.com/photo/english-mastiff-on-field-18540351/,Pexels Content License,https://www.pexels.com/license/,1280,1920
miniature-schnauzer,/breeds/miniature-schnauzer-cost/hero.jpg,Miniature Schnauzer dog,Amorim felipe at English Wikipedia,https://commons.wikimedia.org/wiki/File:Lua_schnauzer.jpg,Public domain,,800,600
newfoundland,/breeds/newfoundland-cost/hero.jpg,Newfoundland dog dog,Genadi Yakovlev,https://www.pexels.com/photo/newfoundland-dog-on-grass-21952861/,Pexels Content License,https://www.pexels.com/license/,1280,960
persian,/breeds/persian-cat-cost/hero.jpg,Persian cat cat,User:Klarissae,https://commons.wikimedia.org/wiki/File:Old_Persian_cat_MUCA_2004.jpg,Public domain,,450,285
pitbull,/breeds/pitbull-cost/hero.jpg,American Staffordshire Terrier dog,Nicholas Espinosa,https://www.pexels.com/photo/american-staffordshire-terrier-16164914/,Pexels Content License,https://www.pexels.com/license/,1280,2276
pomeranian,/breeds/pomeranian-cost/hero.jpg,Pomeranian dog,Biswarup Ganguly,https://commons.wikimedia.org/wiki/File:Pomeranian_Dog_-_Kolkata_2011-10-31_6415.JPG,CC BY 3.0,https://creativecommons.org/licenses/by/3.0,1280,850
poodle,/breeds/poodle-cost/hero.jpg,Standard Poodle dog,Rennett Stowe from USA,https://commons.wikimedia.org/wiki/File%3APoodle%20(3143809874).jpg,CC BY 2.0,https://creativecommons.org/licenses/by/2.0,1280,1173
pug,/breeds/pug-cost/hero.jpg,Pug dog,Wikivato at English Wikipedia,https://commons.wikimedia.org/wiki/File:Pug_close_up.jpg,Public domain,,600,450
ragdoll,/breeds/ragdoll-cat-cost/hero.jpg,Ragdoll cat cat,Cgomez766,https://commons.wikimedia.org/wiki/File:Gato_Ragdoll_Breedingcat.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,1214
rottweiler,/breeds/rottweiler-cost/hero.jpg,Rottweiler dog,Karen Arnold,https://www.publicdomainpictures.net/view-image.php?image=34647&picture=dog-rottweiler,CC0 Public Domain,https://creativecommons.org/publicdomain/zero/1.0/,1920,1263
scottish-fold,/breeds/scottish-fold-cat-cost/hero.jpg,Scottish Fold cat cat,Richard Blom,https://www.publicdomainpictures.net/en/view-image.php?image=53423&picture=scottish-fold,CC0 Public Domain,https://creativecommons.org/publicdomain/zero/1.0/,1920,1385
shih-tzu,/breeds/shih-tzu-cost/hero.jpg,Shih Tzu dog,Marcelo RosaMelo,https://commons.wikimedia.org/wiki/File:Shih_tzu_dog.jpg,CC0,http://creativecommons.org/publicdomain/zero/1.0/deed.en,1280,1707
siamese,/breeds/siamese-cat-cost/hero.jpg,Siamese cat cat,Jean Beaufort,https://www.publicdomainpictures.net/en/view-image.php?image=213386&picture=siamese-cat,CC0 Public Domain,https://creativecommons.org/publicdomain/zero/1.0/,1920,1279
siberian-husky,/breeds/siberian-husky-cost/hero.jpg,Siberian Husky dog,Wolf Art,https://www.pexels.com/photo/black-and-white-siberian-husky-8661629/,Pexels Content License,https://www.pexels.com/license/,1280,1600
sphynx,/breeds/sphynx-cat-cost/hero.jpg,Sphynx cat cat,Jakub Hałun,https://commons.wikimedia.org/wiki/File:20170604_Sphynx_cat_7984.jpg,CC BY-SA 4.0,https://creativecommons.org/licenses/by-sa/4.0,1280,1061
yorkshire-terrier,/breeds/yorkshire-terrier-cost/hero.jpg,Yorkshire Terrier dog,photostockeditor,https://www.pexels.com/photo/yorkshire-terrier-dog-pet-yorkie-8018340/,Pexels Content License,https://www.pexels.com/license/,1280,1707

```

## Tab: breeds.csv

```csv
slug,species,name,size,grooming,health_risk,purchase_low,purchase_typical,purchase_high,avg_life,notes
labrador-retriever,dog,Labrador Retriever,large,1.00,1.10,800,1500,3500,11,"Prone to hip/elbow dysplasia and obesity. Healthy weight management saves significant routine-vet cost over a lifetime."
french-bulldog,dog,French Bulldog,small,1.10,1.55,1500,3500,8000,9,"Brachycephalic — higher rates of respiratory issues, allergies, and C-section births. Insurance is often a strong fit for this breed."
golden-retriever,dog,Golden Retriever,large,1.10,1.20,500,1200,3500,11,"Coat requires regular grooming. Hip dysplasia common. Generally healthy and responsive to vet care."
german-shepherd,dog,German Shepherd,large,1.05,1.25,500,1000,3000,10,"Hip dysplasia is common. High energy requires good nutrition and preventive care."
bulldog,dog,Bulldog,small,0.90,1.70,1000,3000,8000,8,"Brachycephalic with frequent respiratory, skin, and joint issues. One of the higher-cost breeds."
maine-coon,cat,Maine Coon,large,1.60,1.30,800,1500,3000,13,"Long coat means real grooming costs. Hypertrophic cardiomyopathy (HCM) screening is recommended."
persian,cat,Persian,small,2.00,1.35,500,1200,3500,11,"Extensive grooming required to prevent matting. Prone to eye issues and respiratory problems."
siamese,cat,Siamese,small,0.80,1.10,400,800,2000,14,"Generally healthy. Low grooming needs. Minimal breed-specific health issues."
ragdoll,cat,Ragdoll,large,1.40,1.15,600,1200,3000,14,"Large breed with moderate grooming needs. Generally healthy with good lifespan."
chihuahua,dog,Chihuahua,toy,0.60,1.00,300,800,1500,14,"Small, generally healthy. Dental disease and patellar luxation are the most common cost drivers. Long lifespan spreads costs across more years."
poodle,dog,Poodle (Standard),large,1.65,1.10,1000,2000,3500,12,"Hypoallergenic coat needs professional grooming every 4-8 weeks. Generally healthy compared to other large breeds."
dachshund,dog,Dachshund,small,0.80,1.30,500,1200,2500,13,"Long-bodied breed with elevated risk of intervertebral disc disease (IVDD). Surgery for severe cases can run $4,000-$8,000."
rottweiler,dog,Rottweiler,giant,0.90,1.30,1000,2000,3500,9,"Large body, deep chest. Hip/elbow dysplasia, bone cancer risk, and bloat (GDV) are documented. Anesthesia and surgical costs scale with size."
australian-shepherd,dog,Australian Shepherd,medium,1.30,1.15,700,1400,2500,13,"Heavy double coat needs regular brushing. Watch for MDR1 gene mutation affecting drug sensitivity — ask the vet to flag."
pitbull,dog,Pit Bull / American Staffordshire Terrier,large,0.70,1.10,100,500,1500,12,"Generally healthy; skin allergies and ACL tears are most common. Insurance and rental policies sometimes apply breed-specific rules — check before adopting."
beagle,dog,Beagle,small,0.70,1.05,300,700,1500,13,"Generally healthy. Watch obesity (food-driven breed) and ear infections (drop ears)."
boxer,dog,Boxer,large,0.70,1.30,800,1500,2500,11,"Cancer-prone breed. Brachycephalic features and cardiac issues (boxer cardiomyopathy) drive lifetime costs up."
yorkshire-terrier,dog,Yorkshire Terrier,toy,1.30,1.10,800,1500,2500,14,"Long silky coat needs grooming. Dental disease and tracheal collapse are the most common cost drivers."
siberian-husky,dog,Siberian Husky,large,1.20,1.10,600,1200,2500,12,"Heavy double coat (massive shedding). Generally healthy but eye conditions and hip dysplasia documented."
doberman,dog,Doberman Pinscher,large,0.75,1.30,1000,1800,3000,11,"Dilated cardiomyopathy and von Willebrand disease (bleeding disorder) are documented. Pre-purchase health screening matters."
pug,dog,Pug,small,0.85,1.55,600,1500,3000,12,"Brachycephalic — BOAS surgery is common. Eye injuries from prominent eyes. Skin fold infections."
shih-tzu,dog,Shih Tzu,small,1.40,1.15,500,1000,2500,13,"Long coat needs frequent grooming. Eye and dental issues common."
cavalier-king-charles,dog,Cavalier King Charles Spaniel,small,1.10,1.45,1500,2500,4500,11,"Mitral valve disease (heart) and syringomyelia (neurological) are common breed risks. Insurance is often a strong fit."
boston-terrier,dog,Boston Terrier,small,0.70,1.25,600,1200,2500,13,"Brachycephalic features. Eye injuries and corneal ulcers common."
mastiff,dog,Mastiff,giant,0.85,1.30,1000,1800,3000,9,"Hip dysplasia and bloat are documented. Short lifespan due to giant size; large food and anesthesia costs."
great-dane,dog,Great Dane,giant,0.85,1.30,800,1800,3000,8,"Bloat (GDV) is a major risk — preventive gastropexy is common. Cardiac issues and very short lifespan."
pomeranian,dog,Pomeranian,toy,1.25,1.10,600,1500,3000,14,"Patellar luxation, dental disease, and tracheal collapse. Long-lifespan breed."
border-collie,dog,Border Collie,medium,1.10,1.10,700,1500,3000,13,"Generally healthy. Hip dysplasia and Collie eye anomaly possible. High-energy lifestyle adds daycare/training costs."
bernese-mountain-dog,dog,Bernese Mountain Dog,giant,1.30,1.45,1500,2500,4500,8,"Cancer-prone breed (especially histiocytic sarcoma). Hip and elbow dysplasia. Very short lifespan."
cane-corso,dog,Cane Corso,giant,0.80,1.25,1500,2500,4500,10,"Hip dysplasia and eyelid conditions (entropion/ectropion). Massive food and anesthesia cost lines."
miniature-schnauzer,dog,Miniature Schnauzer,small,1.40,1.10,800,1500,2500,14,"Pancreatitis-prone (avoid fatty foods). Regular grooming required to maintain coat."
cocker-spaniel,dog,Cocker Spaniel,medium,1.30,1.20,800,1500,2500,13,"Recurring ear infections (drop ears + heavy fur). Eye conditions. Regular grooming a must."
australian-cattle-dog,dog,Australian Cattle Dog,medium,0.85,1.05,500,1000,2000,14,"Healthy breed. Very high energy — many owners use daycare or hire walkers. Deafness can occur."
newfoundland,dog,Newfoundland,giant,1.40,1.30,1500,2500,4500,9,"Hip and elbow dysplasia, cardiac issues (subaortic stenosis), drooling. Very large food and anesthesia bills."
bengal,cat,Bengal,medium,0.80,1.15,1000,1800,3500,14,"Active and playful. HCM screening recommended. Some states regulate ownership of early-generation Bengals."
british-shorthair,cat,British Shorthair,medium,0.85,1.10,1000,1800,3000,14,"Generally healthy. HCM and PKD screening recommended in breeding lines."
sphynx,cat,Sphynx,medium,1.30,1.30,1500,2500,4500,13,"Hairless cats need weekly bathing, sun protection, and warmth. HCM screening recommended."
scottish-fold,cat,Scottish Fold,medium,0.85,1.45,1000,1800,3500,13,"Osteochondrodysplasia (joint disease) is intrinsic to the folded-ear gene. Veterinary associations have raised welfare concerns about the breed."

```

## Tab: city-multipliers.csv

```csv
slug,name,state,multiplier
new-york-ny,New York City,NY,1.36
manhattan-ny,Manhattan,NY,1.45
brooklyn-ny,Brooklyn,NY,1.30
los-angeles-ca,Los Angeles,CA,1.30
san-francisco-ca,San Francisco,CA,1.45
san-diego-ca,San Diego,CA,1.20
miami-fl,Miami,FL,1.18
tampa-fl,Tampa,FL,1.04
orlando-fl,Orlando,FL,1.05
austin-tx,Austin,TX,1.06
dallas-tx,Dallas-Fort Worth,TX,1.00
houston-tx,Houston,TX,0.98
san-antonio-tx,San Antonio,TX,0.92
chicago-il,Chicago,IL,1.10
boston-ma,Boston,MA,1.28
seattle-wa,Seattle,WA,1.22
denver-co,Denver,CO,1.14
phoenix-az,Phoenix,AZ,1.04
atlanta-ga,Atlanta,GA,1.02
washington-dc,Washington DC,DC,1.34

```

## Tab: emergency-fund.csv

```csv
species,low,typical,high
dog,1500,3000,6000
cat,1000,2000,4500

```

## Tab: emergency-keys.csv

```csv
key
emergency_exam
wound_repair
toxin_ingestion
foreign_object
urinary_blockage
broken_bone
bloat_gdv
parvo
hbc
seizure_workup
heatstroke
acl_surgery
ivdd_surgery

```

## Tab: first-year-one-time.csv

```csv
species,category,low,typical,high
dog,adoption,50,300,3500
dog,spay_neuter,100,300,600
dog,starter_kit,150,280,500
dog,crate_bed,60,120,280
dog,initial_vet,150,280,500
dog,microchip,25,50,80
cat,adoption,25,150,600
cat,spay_neuter,75,200,400
cat,starter_kit,80,160,320
cat,initial_vet,120,220,420
cat,microchip,25,50,80

```

## Tab: insurance-defaults.csv

```csv
deductible,reimbursement,annual_limit
500,0.80,10000

```

## Tab: insurance-monthly-premium.csv

```csv
species,stage,low,typical,high
dog,puppy,28,50,80
dog,adult,35,62,100
dog,senior,70,105,175
cat,kitten,14,24,42
cat,adult,18,32,58
cat,senior,34,60,95

```

## Tab: insurance-ranges.csv

```csv
species,level,monthly_premium,description
dog,low,25,"Younger/mixed breed, accident only"
dog,typical,62,"Healthy adult, accident & illness"
dog,high,120,"Older/high-risk breed, comprehensive"
cat,low,12,"Younger/mixed, accident only"
cat,typical,32,"Healthy adult, accident & illness"
cat,high,60,"Older/high-risk, comprehensive"

```

## Tab: life-expectancy.csv

```csv
species,group,years
dog,toy,14
dog,small,14
dog,medium,12
dog,large,11
dog,giant,9
cat,indoor,15
cat,outdoor,10

```

## Tab: lifestyle-multipliers.csv

```csv
lifestyle,category,multiplier,note
basic,default,0.80,
basic,food,0.75,store-brand vs premium kibble
basic,treats,0.60,
basic,grooming,0.40,mostly DIY
basic,training,0.30,YouTube + group class only
basic,boarding,0.50,friend/family vs kennel
basic,supplies,0.70,basics no luxuries
basic,insurance,0.85,accident-only vs accident+illness
basic,routine_vet,0.85,
standard,default,1.00,U.S. median owner
premium,default,1.40,
premium,food,1.65,fresh/raw subscriptions prescription diets
premium,treats,1.50,
premium,grooming,2.00,pro grooming every 4-8 weeks
premium,training,2.20,private trainer board-and-train
premium,boarding,1.80,luxury suite kennel
premium,supplies,1.50,premium gear
premium,insurance,1.30,higher reimbursement % lower deductible
premium,routine_vet,1.20,specialty clinic more frequent visits

```

## Tab: procedures.csv

```csv
key,name,low,typical,high,species,emergency_note
physical_exam,Wellness physical (annual),80,150,300,any,
vaccines,Core vaccines (annual),80,200,400,any,
dental_cleaning,Dental cleaning,200,600,1200,any,
microchip,Microchip insertion,25,60,150,any,
spay_neuter,Spay / neuter,200,600,1500,any,
xray,X-ray (single view),80,200,500,any,
ultrasound,Ultrasound,200,500,1000,any,
blood_work,Blood work / panel,80,250,600,any,
urinalysis,Urinalysis,50,150,300,any,
antibiotics,Antibiotic course,30,100,300,any,
pain_relief,Pain management (week),20,80,200,any,
thyroid_meds,Thyroid medication (month),15,50,150,any,
emergency_exam,ER exam (after hours),100,200,400,any,
wound_repair,Wound / laceration repair,400,1100,2800,any,
toxin_ingestion,Toxin ingestion treatment,250,1100,4500,any,"Call ASPCA Poison Control 888-426-4435 or your nearest ER immediately."
foreign_object,Foreign object removal,800,3500,8000,any,
urinary_blockage,Urinary blockage (cat),1200,2800,5500,cat,"A blocked male cat is a life-threatening emergency. Go to the ER now."
broken_bone,Fracture repair,800,3500,7500,any,
bloat_gdv,Bloat / GDV surgery,1800,5000,10000,dog,"Bloat is a surgical emergency. Do not delay."
parvo,Parvo treatment (puppy),600,2200,6500,dog,"Suspected parvo in unvaccinated puppies — call your vet immediately."
hbc,Hit-by-car trauma,1000,4000,12000,any,
seizure_workup,Seizure diagnostics,500,1400,3500,any,
heatstroke,Heatstroke treatment,400,1500,4500,any,"Move to shade, apply cool (not cold) water, drive to ER."
acl_surgery,ACL/CCL surgery (dog),2000,4500,7500,dog,
ivdd_surgery,IVDD spinal surgery,3500,7000,12000,dog,

```

## Tab: reviewer.csv

```csv
field,value
name,PetPlanWise Editorial
title,Editorial team (no individual veterinarian endorsement)
license,n/a
license_state,n/a
photo_url,
bio,Methodology and cost data are fact-checked in-house against published AVMA NAPHIA BLS AAHA and Banfield sources. We do not currently have a retained veterinarian on staff and we do not represent any individual DVM endorsement of this content. See /editorial-standards/ for our review process.
review_date,2026-05

```

## Tab: size-multipliers.csv

```csv
size,multiplier,note
toy,0.70,< 10 lb
small,0.85,10-25 lb
medium,1.00,25-60 lb
large,1.25,60-90 lb
giant,1.55,90+ lb

```

## Tab: state-adjusted-categories.csv

```csv
category
routine_vet
vaccines
grooming
boarding
insurance
spay_neuter

```

## Tab: state-multipliers.csv

```csv
state,multiplier
AL,0.92
AK,1.18
AZ,1.02
AR,0.90
CA,1.28
CO,1.10
CT,1.18
DE,1.05
FL,1.06
GA,0.96
HI,1.30
ID,0.96
IL,1.04
IN,0.94
IA,0.92
KS,0.92
KY,0.92
LA,0.94
ME,1.05
MD,1.12
MA,1.22
MI,0.96
MN,1.02
MS,0.88
MO,0.92
MT,0.98
NE,0.92
NV,1.06
NH,1.10
NJ,1.18
NM,0.94
NY,1.30
NC,0.98
ND,0.94
OH,0.94
OK,0.90
OR,1.10
PA,1.02
RI,1.10
SC,0.96
SD,0.92
TN,0.94
TX,0.98
UT,1.00
VT,1.06
VA,1.04
WA,1.16
WV,0.90
WI,0.96
WY,0.96
DC,1.32

```

