// src/utils/archetypeDefinitions.js
// Shared CareerDNA archetype definitions used by both BarChart and SelectionInsightExplorer.

export const ARCHETYPE_DEFINITIONS = {
  Achiever:
    "An Achiever is ambitious, driven, and focused on results. They set high standards, work hard to meet goals, and take pride in pushing their limits. Achievers thrive in fast-paced environments where performance is recognised and rewarded.",
  Connector:
    "A Connector is people-focused, empathetic, and great at building relationships. They feel energised by collaboration, love supporting others, and are often the glue that holds a team or community together.",
  Creator:
    "A Creator is imaginative, hands-on, and expressive. They enjoy turning ideas into reality through art, design, technology, or storytelling. Creators thrive when given freedom to innovate and explore new forms.",
  Explorer:
    "An Explorer is curious, adventurous, and driven by discovery. They love trying new things, asking big questions, and learning through real-world experiences. Explorers get bored with routine and crave variety and challenge.",
  Organizer:
    "An Organizer is structured, dependable, and detail-oriented. They bring order to chaos, love planning and systems, and thrive in environments where reliability and accuracy are essential.",
  Thinker:
    "A Thinker is analytical, logical, and reflective. They enjoy solving complex problems, diving deep into topics, and making sense of patterns. Thinkers are most comfortable in roles that reward independence and intellectual depth.",
  Visionary:
    "A Visionary is future-focused, bold, and full of ideas. They’re passionate about making a difference and inspired by big-picture thinking. Visionaries thrive in spaces where they can lead change, innovate, and inspire others.",
};

function compactKey(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

export function getArchetypeDefinition(label = '') {
  const wanted = compactKey(label);
  return Object.entries(ARCHETYPE_DEFINITIONS).find(([key]) => compactKey(key) === wanted)?.[1] || '';
}

export default ARCHETYPE_DEFINITIONS;
