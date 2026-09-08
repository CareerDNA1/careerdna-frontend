// utils/Dimensions.js
// CareerDNA v2 — 25 behavioural dimensions across 4 CIDs.
// Default export MUST be an ARRAY for the chart.

const DIMENSIONS = [
  {
    key: "whoYouAre",
    label: "Who You Are",
    subdimensions: [
      { key: "originality",      label: "Originality",                shortLabel: "Originality"    },
      { key: "reliability",      label: "Reliability",                shortLabel: "Reliability"    },
      { key: "resilience",       label: "Resilience",                 shortLabel: "Resilience"     },
      { key: "adaptability",     label: "Adaptability",               shortLabel: "Adaptability"   },
      { key: "socialConfidence", label: "Social Confidence",          shortLabel: "Social"         },
      { key: "empathy",          label: "Empathy",                    shortLabel: "Empathy"        },
    ],
  },
  {
    key: "whatYouLove",
    label: "What You Love",
    subdimensions: [
      { key: "analyticalCuriosity",      label: "Analytical Curiosity",       shortLabel: "Analytical"    },
      { key: "creativeExpression",       label: "Creative Expression",        shortLabel: "Creativity"    },
      { key: "helpingCaring",            label: "Helping & Caring",           shortLabel: "Helping"       },
      { key: "entrepreneurialDrive",     label: "Entrepreneurial Drive",      shortLabel: "Entrepreneurial" },
      { key: "technicalCuriosity",       label: "Technical Curiosity",        shortLabel: "Technical"     },
      { key: "culturalGlobalCuriosity",  label: "Cultural & Global Curiosity", shortLabel: "Cultural"     },
      { key: "dataCuriosity",            label: "Data Curiosity",             shortLabel: "Data"          },
    ],
  },
  {
    key: "whatMatters",
    label: "What Matters",
    subdimensions: [
      { key: "purposeImpact", label: "Purpose & Impact", shortLabel: "Purpose"     },
      { key: "autonomy",      label: "Autonomy",         shortLabel: "Autonomy"    },
      { key: "belonging",     label: "Belonging",        shortLabel: "Belonging"   },
      { key: "achievement",   label: "Achievement",      shortLabel: "Achievement" },
      { key: "security",      label: "Security",         shortLabel: "Security"    },
      { key: "mastery",       label: "Mastery",          shortLabel: "Mastery"     },
    ],
  },
  {
    key: "howYouWorkBest",
    label: "How You Work Best",
    subdimensions: [
      { key: "structure",      label: "Structure",      shortLabel: "Structure"      },
      { key: "collaboration",  label: "Collaboration",  shortLabel: "Collaboration"  },
      { key: "independence",   label: "Independence",   shortLabel: "Independence"   },
      { key: "precision",      label: "Precision",      shortLabel: "Precision"      },
      { key: "pace",           label: "Pace",           shortLabel: "Pace"           },
      { key: "variety",        label: "Variety",        shortLabel: "Variety"        },
    ],
  },
];

export default DIMENSIONS;
