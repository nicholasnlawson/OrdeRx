const fs = require('fs');
const path = require('path');
const logger = require('./logger');

let aliasMap = null;
let lastLoaded = 0;

function loadAliases() {
  try {
    const filePath = path.join(__dirname, '../../data/formulation_aliases.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);

    const map = {};
    for (const [, aliases] of Object.entries(json)) {
      if (!Array.isArray(aliases) || aliases.length === 0) continue;
      const canonical = aliases[0]; // first alias is canonical term
      const canonicalLower = canonical.toLowerCase();
      // ensure canonical maps to itself
      map[canonicalLower] = canonicalLower;
      aliases.forEach(alias => {
        map[alias.toLowerCase()] = canonicalLower;
      });
    }
    aliasMap = map;
    lastLoaded = Date.now();
    logger.info(`Formulation aliases loaded: ${Object.keys(aliasMap).length} entries`);
  } catch (err) {
    console.error('Failed to load formulation_aliases.json', err);
    aliasMap = {};
  }
}

function ensureLoaded() {
  if (!aliasMap) loadAliases();
}

function canonicalize(formulation) {
  if (!formulation) return '';
  ensureLoaded();
  const lower = String(formulation).toLowerCase();
  return aliasMap[lower] || lower; // fall back to itself
}

function getAliasesForCanonical(canonical) {
  ensureLoaded();
  const canonicalLower = canonical.toLowerCase();
  return Object.entries(aliasMap)
    .filter(([alias, canon]) => canon === canonicalLower)
    .map(([alias]) => alias);
}

function reload() {
  loadAliases();
}

function normalizeMedicationString(text) {
  if (!text) return '';
  ensureLoaded();
  let tokens = String(text).split(/\s+/);
  tokens = tokens.map(tok => {
    const lower = tok.toLowerCase();
    return aliasMap[lower] ? aliasMap[lower] : lower;
  });
  return tokens.join(' ');
}

module.exports = { canonicalize, getAliasesForCanonical, normalizeMedicationString, reload };
