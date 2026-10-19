// The one band rule for everything a student sees as a level or a match:
// archetype bars, trait cards and pills, world/pathway/role/degree match badges.
// Absolute, inclusive cuts, identical to the backend (cdnaScoreConfig.bands):
// 80 and above Standout, 70 and above Strong, 60 and above Good, else Lower.

export const BAND_CUTS = Object.freeze({ standout: 80, strong: 70, good: 60 });

export const BANDS = Object.freeze(['Standout', 'Strong', 'Good', 'Lower']);

export function bandForScore(score) {
  const s = Number(score);
  if (!Number.isFinite(s)) return 'Lower';
  if (s >= BAND_CUTS.standout) return 'Standout';
  if (s >= BAND_CUTS.strong) return 'Strong';
  if (s >= BAND_CUTS.good) return 'Good';
  return 'Lower';
}

// Normalise any band string the backend or older data may carry to a band name.
export function normalizeBand(value) {
  const s = String(value || '').trim().toLowerCase();
  if (s.startsWith('standout')) return 'Standout';
  if (s.startsWith('strong')) return 'Strong';
  if (s.startsWith('good')) return 'Good';
  return 'Lower';
}

export function bandBlocks(band) {
  switch (normalizeBand(band)) {
    case 'Standout': return 4;
    case 'Strong': return 3;
    case 'Good': return 2;
    default: return 1;
  }
}

// Lower-case tier key used by CSS class names and pill tints.
export function bandTier(band) {
  return normalizeBand(band).toLowerCase();
}

// Student-facing wording.
export function bandMatchLabel(band) {
  return `${normalizeBand(band)} match`;
}

// Pill visual state: full for Standout and Strong, mid for Good, grey otherwise.
export function bandVisualState(band) {
  const b = normalizeBand(band);
  if (b === 'Standout' || b === 'Strong') return 'full';
  if (b === 'Good') return 'mid';
  return 'grey';
}
