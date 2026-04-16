// utils/Dimensions.js
// Default export MUST be an ARRAY for the chart.

const DIMENSIONS = [
  {
    key: "whoYouAre",
    label: "Who You Are",
    subdimensions: [
      { key: "openness", label: "Curiosity & Openness", shortLabel: "Openness" },
      { key: "conscientiousness", label: "Reliability & Focus", shortLabel: "Focus" },
      { key: "emotionalStability", label: "Emotional Stability", shortLabel: "Stability" },
      { key: "riskTolerance", label: "Uncertainty Tolerance", shortLabel: "Tolerance" },
      { key: "gritPersistence", label: "Perseverance", shortLabel: "Perseverance" },
      { key: "extroversionSociability", label: "Sociability & Extroversion", shortLabel: "Sociability" },
    ],
  },
  {
    key: "whatYouLove",
    label: "What You Love",
    subdimensions: [
      { key: "investigativeCuriosity", label: "Investigative Curiosity", shortLabel: "Curiosity" },
      { key: "creativeExpression", label: "Creative Expression", shortLabel: "Creativity" },
      { key: "helpingOrientation", label: "Helping Orientation", shortLabel: "Helping" },
      { key: "entrepreneurialDrive", label: "Entrepreneurial Drive", shortLabel: "Entrepreneurial" },
      { key: "handsOnEngagement", label: "Hands-On Engagement", shortLabel: "Hands-On" },
      { key: "noveltyVarietySeeking", label: "Novelty & Variety Seeking", shortLabel: "Variety" },
    ],
  },
  {
    key: "whatMatters",
    label: "What Matters",
    subdimensions: [
      { key: "purposeImpact", label: "Purpose & Impact", shortLabel: "Purpose" },
      { key: "autonomyControl", label: "Independence & Autonomy", shortLabel: "Autonomy" },
      { key: "securityPredictability", label: "Stability & Predictability", shortLabel: "Stability" },
      { key: "recognitionVisibility", label: "Recognition & Visibility", shortLabel: "Recognition" },
      { key: "financialAmbition", label: "Financial Ambition", shortLabel: "Ambition" },
      { key: "belongingConnection", label: "Belonging & Connection", shortLabel: "Belonging" },
    ],
  },
  {
    key: "howYouWorkBest",
    label: "How You Work Best",
    subdimensions: [
      { key: "paceIntensityPreference", label: "Pace & Intensity Preference", shortLabel: "Pace" },
      { key: "orderSystemsOrientation", label: "Organisation & Systems Orientation", shortLabel: "Systems" },
      { key: "structureClarityPreference", label: "Clarity & Structure Preference", shortLabel: "Clarity" },
      { key: "soloVsCollaborativeWorking", label: "Team Collaboration", shortLabel: "Collaboration" },
      { key: "guidanceVsSelfDirection", label: "Independent Working Approach", shortLabel: "Independence" },
      { key: "taskFocusDetail", label: "Attention to Detail", shortLabel: "Detail" },
    ],
  },
];

export default DIMENSIONS;
