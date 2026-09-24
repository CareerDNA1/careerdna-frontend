function parseEnvNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const CDNA_SCORE_CONFIG = Object.freeze({
  subdimension: Object.freeze({
    fallbackWeights: Object.freeze([
      parseEnvNumber(process.env.CDNA_SUBDIM_FALLBACK_W1, 1.0),
      parseEnvNumber(process.env.CDNA_SUBDIM_FALLBACK_W2, 0.78),
      parseEnvNumber(process.env.CDNA_SUBDIM_FALLBACK_W3, 0.58),
      parseEnvNumber(process.env.CDNA_SUBDIM_FALLBACK_W4, 0.42),
      parseEnvNumber(process.env.CDNA_SUBDIM_FALLBACK_W5, 0.3),
      parseEnvNumber(process.env.CDNA_SUBDIM_FALLBACK_W6, 0.2),
      parseEnvNumber(process.env.CDNA_SUBDIM_FALLBACK_W7, 0.16),
    ]),
    coreMatchThresholdPct: parseEnvNumber(process.env.CDNA_SUBDIM_CORE_MATCH_THRESHOLD_PCT, 60),
    coreGroupWeight: parseEnvNumber(process.env.CDNA_SUBDIM_CORE_GROUP_WEIGHT, 0.70),
    secondaryGroupWeight: parseEnvNumber(process.env.CDNA_SUBDIM_SECONDARY_GROUP_WEIGHT, 0.30),
    totalScoreScale: parseEnvNumber(process.env.CDNA_SUBDIM_TOTAL_SCORE_SCALE, 3.2),
  }),

  total: Object.freeze({
    // Default archetype share of an item's total score (rest is subdimensions).
    archetypeContributionWeight: parseEnvNumber(process.env.CDNA_TOTAL_ARCHETYPE_CONTRIBUTION_WEIGHT, 0.30),
    // Strengths are measured directly from the user's own answers about what they
    // are good at, so they are scored on subdimensions alone (no archetype dilution).
    archetypeContributionWeightStrengths: parseEnvNumber(process.env.CDNA_TOTAL_ARCHETYPE_CONTRIBUTION_WEIGHT_STRENGTHS, 0),
  }),
});

module.exports = {
  CDNA_SCORE_CONFIG,
  parseEnvNumber,
};
