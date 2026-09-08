// Route-mix banner shown under each career world.
// Keyed by the current (25-world) taxonomy titles.
// Two messages: "no degree needed" worlds, and "both routes" worlds.

const BOTH =
  'You can get into this world with or without a university degree, through an apprenticeship, college or training as well as with a degree.';
const NO_DEGREE =
  'You get into this world without a university degree, through work, training or an apprenticeship.';

const WORLD_ROUTE_MIX = {
  // Both routes (degree or apprenticeship / college / training)
  'Healthcare & Medicine': BOTH,
  'Care & Support Work': BOTH,
  'Science & Research': BOTH,
  'Technology & Digital': BOTH,
  'Engineering & Manufacturing': BOTH,
  'Construction & the Built Environment': BOTH,
  'Business & Management': BOTH,
  'Media, Marketing, Content & Communication': BOTH,
  'Money, Finance & Accounting': BOTH,
  'Law, Justice & Public Services': BOTH,
  'Creative Arts & Design': BOTH,
  'Education & Early Years': BOTH,
  'Animals, Land & the Outdoors': BOTH,
  'Environment & Sustainability': BOTH,
  'Hospitality, Food & Events': BOTH,
  'Sport, Fitness & Leisure': BOTH,
  'Psychology & Human Behaviour': BOTH,
  'Languages, Cultures & Global Affairs': BOTH,
  'Performing Arts & Music': BOTH,
  'Entrepreneurship, Innovation & Venture Building': BOTH,

  // No degree needed — work, training and apprenticeships
  'Admin & Office Support': NO_DEGREE,
  'Retail, Sales & Customer Service': NO_DEGREE,
  'Protective & Emergency Services': NO_DEGREE,
  'Transport, Travel & Logistics': NO_DEGREE,
  'Hair, Beauty & Personal Care': NO_DEGREE,
};

export function worldRouteMix(title) {
  return WORLD_ROUTE_MIX[title] || '';
}

export default WORLD_ROUTE_MIX;
