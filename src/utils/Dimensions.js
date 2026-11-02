// utils/Dimensions.js
// CareerDNA v5 (question bank v2): 27 traits across 4 groups. Labels must match
// the trait names in questions_v2.js; bank v1 names are mapped to these by
// utils/traitNames.js before anything is shown.
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
      { key: "leadingEnterprising",      label: "Leading & Starting Things",     shortLabel: "Leading"       },
      { key: "handsOnTechnical",         label: "Hands-On & Technical",       shortLabel: "Hands-On"      },
      { key: "societyWorldCuriosity",    label: "Society & World Curiosity",  shortLabel: "Society"       },
      { key: "numbersDataCuriosity",     label: "Numbers & Data Curiosity",   shortLabel: "Numbers"       },
    ],
  },
  {
    key: "whatMatters",
    label: "What Matters",
    subdimensions: [
      { key: "purposeImpact", label: "Purpose & Impact", shortLabel: "Purpose"     },
      { key: "autonomy",      label: "Autonomy",         shortLabel: "Autonomy"    },
      { key: "belonging",     label: "Belonging",        shortLabel: "Belonging"   },
      { key: "recognitionReward", label: "Recognition & Reward", shortLabel: "Recognition" },
      { key: "security",      label: "Security",         shortLabel: "Security"    },
      { key: "mastery",       label: "Mastery",          shortLabel: "Mastery"     },
      { key: "workLifeBalance", label: "Work-Life Balance", shortLabel: "Balance"   },
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
      { key: "activeOutdoors", label: "Active & Outdoors", shortLabel: "Active"     },
    ],
  },
];

export default DIMENSIONS;
