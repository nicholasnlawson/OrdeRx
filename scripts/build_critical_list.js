#!/usr/bin/env node
/**
 * Build an exhaustive critical medications list based on:
 * 1. Broad classes (antibiotics, antifungals, antivirals/antiretrovirals) recognised by name patterns
 * 2. Explicit drug names/brands provided in user spec
 * 3. Any future additions can be fed via --extra argument JSON array
 *
 * It reads drug_aliases.json and outputs data/critical_medications.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const aliasesPath = path.join(ROOT, 'data', 'drug_aliases.json');
const outputPath = path.join(ROOT, 'data', 'critical_medications.json');

// -------------- Helper sets ------------------
// Patterns (lowercase) indicating antibiotic drugs
const antibioticPatterns = [
  /cillin$/, /cycline$/, /mycin$/, /floxacin$/, /cef/, /ceph/, /penem$/, /thromycin$/, /cillin /,
  /pime$/, /bactam$/, /oxacin$/
];

// Antifungal patterns
const antifungalPatterns = [
  /azole$/, /fungin$/, /terbinafine/, /amphotericin/,
];

// Antiviral/antiretroviral patterns
const antiviralPatterns = [
  /vir$/ , /vir /, /avir$/, /navir$/ , /vudine$/, /covir$/
];

// Explicit critical drug names/brands from user list (all lower case)
const explicitCriticals = new Set([
  // Anticoagulants
  'enoxaparin','clexane','inhixa','tinzaparin','innohep','dalteparin','fragmin',
  'apixaban','eliquis','rivaroxaban','xarelto','dabigatran','pradaxa','edoxaban','lixiana',
  'heparin', 'warfarin','coumadin','acenocoumarol','sinthrome',
  // Parkinsons
  'co-beneldopa','madopar','co-careldopa','sinemet','rotigotine','stalevo','sastravi','pramipexole','ropinirole',
  // Antiepileptics
  'sodium valproate','epilim','phenytoin','epanutin','levetiracetam','keppra','lamotrigine','lamictal','carbamazepine','tegretol','topiramate','topamax',
  // Psych drugs
  'clozapine','clozaril','lithium','priadel','camcolit','liskonum','quetiapine','sorequel','olanzapine','zyprexa','risperidone','risperdal',
  // Insulins (representative generic/brands)
  'insulin','humulin i','insulatard','insuman basal','actrapid','humulin s','insuman rapid','humulin m3','insuman comb 15','insuman comb 25','lantus','levemir','tresiba','toujeo','abasaglar','detemir','novorapid','humalog','apidra','fiasp','novomix 30','humalog mix 25','humalog mix 50',
  // Immunosuppressants / steroids
  'tacrolimus','prograf','advagraf','mycophenolic acid','ceptava','myfortic','mycophenolate mofetil','cellcept','mycofenax','cyclosporin','neoral','azathioprine','azasan',
  'prednisolone','deltasone','hydrocortisone','colifoam','budesonide','budenofalk','endocort','pulmicort',
  // Opioids catch-all handled later
  'methadone','buprenorphine','suboxone','subutex'
]);

function loadAliases() {
  const raw = fs.readFileSync(aliasesPath, 'utf8');
  return JSON.parse(raw);
}

function isPatternMatch(name, patterns) {
  return patterns.some(re => re.test(name));
}

function buildCriticalList() {
  const categories = {
    antibiotics: new Set(),
    antifungals: new Set(),
    antivirals: new Set(),
    anticoagulants: new Set(),
    parkinsons: new Set(),
    antiepileptics: new Set(),
    antipsychotics: new Set(),
    insulins: new Set(),
    immunosuppressants: new Set(),
    corticosteroids: new Set(),
    opioids: new Set(),
    substance_misuse: new Set()
  };
  const aliasesJson = loadAliases();
  // helper: find canonical by any alias string
  function canonicalFor(alias) {
    const lower = alias.toLowerCase();
    const entry = aliasesJson.find(e => e.aliases.map(a=>a.toLowerCase()).includes(lower) || e.name.toLowerCase()===lower);
    return entry ? entry.name.toLowerCase() : null;
  }

  // fill explicit lists into category sets
  const addToCat = (cat, arr) => arr.forEach(n=>{const canonical=canonicalFor(n)||n; categories[cat].add(canonical);});

  addToCat('anticoagulants', ['enoxaparin','clexane','inhixa','tinzaparin','innohep','dalteparin','fragmin','apixaban','eliquis','rivaroxaban','xarelto','dabigatran','pradaxa','edoxaban','lixiana','heparin','warfarin','coumadin','acenocoumarol','sinthrome']);
  addToCat('parkinsons', ['co-beneldopa','madopar','co-careldopa','sinemet','rotigotine','stalevo','sastravi','pramipexole','ropinirole']);
  addToCat('antiepileptics', ['sodium valproate','epilim','phenytoin','epanutin','levetiracetam','keppra','lamotrigine','lamictal','carbamazepine','tegretol','topiramate','topamax']);
  addToCat('antipsychotics', ['clozapine','clozaril','lithium','priadel','camcolit','liskonum','quetiapine','sorequel','olanzapine','zyprexa','risperidone','risperdal']);
  addToCat('insulins', ['humulin i','insulatard','insuman basal','actrapid','humulin s','insuman rapid','humulin m3','insuman comb 15','insuman comb 25','lantus','levemir','tresiba','toujeo','abasaglar','detemir','novorapid','humalog','apidra','fiasp','novomix 30','humalog mix 25','humalog mix 50']);
  addToCat('immunosuppressants', ['tacrolimus','prograf','advagraf','mycophenolic acid','ceptava','myfortic','mycophenolate mofetil','cellcept','mycofenax','cyclosporin','neoral','azathioprine','azasan']);
  addToCat('corticosteroids', ['prednisolone','deltasone','hydrocortisone','colifoam','budesonide','budenofalk','endocort','pulmicort']);
  addToCat('opioids', []); // generic opioids catch-all, no list yet
  addToCat('substance_misuse', ['methadone','buprenorphine + naloxone','suboxone','buprenorphine','subutex']);

  // iterate aliasesJson for antimicrobial classes
  aliasesJson.forEach(entry=>{
    const lc = entry.name.toLowerCase();
    if(isPatternMatch(lc, antibioticPatterns)) categories.antibiotics.add(entry.name);
    if(isPatternMatch(lc, antifungalPatterns)) categories.antifungals.add(entry.name);
    if(isPatternMatch(lc, antiviralPatterns)) categories.antivirals.add(entry.name);
  });

  // convert sets to sorted arrays
  const result = {};
  Object.keys(categories).forEach(cat=>{
    result[cat] = Array.from(categories[cat]).sort((a,b)=>a.localeCompare(b));
  });
  return result;

  aliasesJson.forEach(entry => {
    const canonical = entry.name.toLowerCase();
    const allNames = [canonical, ...entry.aliases.map(a => a.toLowerCase())];

    const antibiotic = isPatternMatch(canonical, antibioticPatterns);
    const antifungal = isPatternMatch(canonical, antifungalPatterns);
    const antiviral = isPatternMatch(canonical, antiviralPatterns);

    if (antibiotic || antifungal || antiviral) {
      allNames.forEach(n => criticalSet.add(n));
    }

    // include any from explicit list anyway
    allNames.forEach(n => {
      if (explicitCriticals.has(n)) criticalSet.add(n);
    });
  });

  // Add generic term 'opioid' catch-all
  criticalSet.add('opioid');

  // Sort alphabetically
  const criticalArray = Array.from(criticalSet).sort();
  return criticalArray;
}

function main() {
  const criticalArray = buildCriticalList();
  const result = buildCriticalList();
  let total = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Wrote ${total} canonical critical medication entries across ${Object.keys(result).length} categories to ${outputPath}`);
}

if (require.main === module) {
  main();
}
