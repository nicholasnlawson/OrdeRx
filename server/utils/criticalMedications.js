const fs = require('fs');
const path = require('path');

let criticalSets = null;

function loadCritical() {
  const file = path.join(__dirname, '../../data/critical_medications.json');
  try {
    const json = JSON.parse(fs.readFileSync(file, 'utf8'));
    const sets = {};
    for (const [cat, arr] of Object.entries(json.critical || json)) {
      sets[cat] = new Set(arr.map(n => n.toLowerCase()));
    }
    criticalSets = sets;
  } catch (e) {
    console.error('Failed to load critical_medications.json', e);
    criticalSets = {};
  }
}

function ensureLoaded() {
  if (!criticalSets) loadCritical();
}

function isCriticalDrug(drugName) {
  if (!drugName) return false;
  ensureLoaded();
  const nameLc = drugName.toLowerCase();
  return Object.values(criticalSets).some(set => set.has(nameLc));
}

module.exports = { isCriticalDrug, loadCritical };
