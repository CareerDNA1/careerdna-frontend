// utils/archetypeWeights.js
// Weights for 24 subdimensions mapping to 7 CareerDNA archetypes
// Weights (0.0–1.0) reflect each trait’s contribution to the archetypes,
// aligned with Big Five, RIASEC, and Self-Determination Theory foundations.

const archetypeWeights = {
  // WHO YOU ARE
  "Curiosity & Openness": {
    Achiever: 0,
    Connector: 0,
    Creator: 0.6,
    Explorer: 1.0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0.8
  },
  "Reliability & Focus": {
    Achiever: 0.8,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 1.0,
    Thinker: 0.5,
    Visionary: 0
  },
  "Emotional Stability": {
    Achiever: 0,
    Connector: 0.5,
    Creator: 0,
    Explorer: 0,
    Organizer: 0.5,
    Thinker: 0,
    Visionary: 0
  },
  "Uncertainty Tolerance": {
    Achiever: 0.5,
    Connector: 0,
    Creator: 0.5,
    Explorer: 1.0,
    Organizer: 0.0,
    Thinker: 0,
    Visionary: 0.5
  },
  "Perseverance": {
    Achiever: 1.0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0.5,
    Thinker: 0,
    Visionary: 0
  },
  "Sociability & Extroversion": {
    Achiever: 0,
    Connector: 1.0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },

  // WHAT YOU LOVE
  "Investigative Curiosity": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0.8,
    Organizer: 0,
    Thinker: 1.0,
    Visionary: 0
  },
  "Creative Expression": {
    Achiever: 0,
    Connector: 0,
    Creator: 1.0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Helping Orientation": {
    Achiever: 0,
    Connector: 1.0,
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
    Visionary: 1.0
  },
  "Hands-On Engagement": {
    Achiever: 0,
    Connector: 0,
    Creator: 1.0,
    Explorer: 0.5,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Novelty & Variety Seeking": {
    Achiever: 0,
    Connector: 0,
    Creator: 0.8,
    Explorer: 1.0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0.5
  },

  // WHAT MATTERS
  "Purpose & Impact": {
    Achiever: 0,
    Connector: 0.5,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 1.0
  },
  "Independence & Autonomy": {
    Achiever: 0.5,
    Connector: 0,
    Creator: 0.8,
    Explorer: 0.5,
    Organizer: 0,
    Thinker: 0.5,
    Visionary: 1.0
  },
  "Stability & Predictability": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 1.0,
    Thinker: 0,
    Visionary: 0
  },
  "Recognition & Visibility": {
    Achiever: 1.0,
    Connector: 0,
    Creator: 0.5,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0.5
  },
  "Financial Ambition": {
    Achiever: 1.0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },
  "Belonging & Connection": {
    Achiever: 0,
    Connector: 1.0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0,
    Thinker: 0,
    Visionary: 0
  },

  // HOW YOU WORK BEST
  "Pace & Intensity Preference": {
    Achiever: 1.0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0.5,
    Thinker: 0,
    Visionary: 0.5
  },
  "Organisation & Systems Orientation": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 1.0,
    Thinker: 0.5,
    Visionary: 0
  },
  "Clarity & Structure Preference": {
    Achiever: 0,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 1.0,
    Thinker: 0.8,
    Visionary: 0
  },
  "Team Collaboration": {
    Achiever: 0,
    Connector: 1.0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0.5,
    Thinker: 0,
    Visionary: 0.5
  },
  "Independent Working Approach": {
    Achiever: 0,
    Connector: 0,
    Creator: 0.5,
    Explorer: 1.0,
    Organizer: 0,
    Thinker: 0.5,
    Visionary: 0.5
  },
  "Attention to Detail": {
    Achiever: 0.5,
    Connector: 0,
    Creator: 0,
    Explorer: 0,
    Organizer: 0.8,
    Thinker: 1.0,
    Visionary: 0
  }
};

export default archetypeWeights;
