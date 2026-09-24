// utils/archetypeWeights.js
// CareerDNA v2 — 25 behavioural dimensions × 7 archetypes weight matrix
// Source of truth: CareerDNA_v3.xlsx → Weight Matrix sheet.
// NOTE: subdim_matrix.js (CommonJS backend) must mirror this file exactly.

const archetypeWeights = {

  // WHO YOU ARE
  "Originality": {
    Achiever: 0,
    Connector: 0,
    Creator: 0.8,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0.8
  },
  "Reliability": {
    Achiever: 0.8,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 1,
    Thinker: 0,
    Visionary: 0
  },
  "Resilience": {
    Achiever: 0.5,
    Connector: 0.5,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0.5
  },
  "Adaptability": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 1,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Social Confidence": {
    Achiever: 0,
    Connector: 1,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Empathy": {
    Achiever: 0,
    Connector: 1,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },

  // WHAT YOU LOVE
  "Analytical Curiosity": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0.4,
    Organizer: 0,
    Thinker: 1,
    Visionary: 0
  },
  "Creative Expression": {
    Achiever: 0,
    Connector: 0,
    Creator: 1,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Helping & Caring": {
    Achiever: 0,
    Connector: 1,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Entrepreneurial Drive": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 1
  },
  "Technical Curiosity": {
    Achiever: 0,
    Connector: 0,
    Creator: 0.6,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0.5,
    Visionary: 0
  },
  "Cultural & Global Curiosity": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 1,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Data Curiosity": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0.3,
    Thinker: 1,
    Visionary: 0
  },

  // WHAT MATTERS TO YOU
  "Purpose & Impact": {
    Achiever: 0,
    Connector: 0.3,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 1
  },
  "Autonomy": {
    Achiever: 0,
    Connector: 0,
    Creator: 0.5,
    Explorer: 0.4,
    Organizer: 0,
    Thinker: 0.5,
    Visionary: 0.5
  },
  "Belonging": {
    Achiever: 0,
    Connector: 1,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Achievement": {
    Achiever: 1,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Security": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 1,
    Thinker: 0,
    Visionary: 0
  },
  "Mastery": {
    Achiever: 0,
    Connector: 0,
    Creator: 0.7,
    Explorer: 0,
    Organizer: 0,
    Thinker: 1,
    Visionary: 0
  },

  // HOW YOU WORK BEST
  "Structure": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 1,
    Thinker: 0,
    Visionary: 0
  },
  "Collaboration": {
    Achiever: 0,
    Connector: 1,
    Creator: 0,
    Explorer: 0,
    Organizer: 0.4,
    Thinker: 0,
    Visionary: 0
  },
  "Independence": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 1,
    Visionary: 0
  },
  "Precision": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 1,
    Thinker: 0.8,
    Visionary: 0
  },
  "Pace": {
    Achiever: 1,
    Connector: 0,
    Creator: 0,
    Explorer: 0.5,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Variety": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 1,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  }

};

export default archetypeWeights;
