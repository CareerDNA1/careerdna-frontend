// Auto-generated from strengths2.json: each strength -> the core subdimensions
// that power it. Keyed by normalised title.
export const STRENGTH_CORE_SUBDIMS = {
  'communicatingclearly': ["Social Confidence", "Empathy", "Precision"],
  'workingwellwithothers': ["Collaboration", "Empathy", "Social Confidence"],
  'influencingandleadingothers': ["Social Confidence", "Purpose & Impact", "Entrepreneurial Drive", "Achievement"],
  'understandingpeopleanduserneeds': ["Empathy", "Analytical Curiosity", "Helping & Caring"],
  'buildingrelationships': ["Social Confidence", "Empathy", "Adaptability"],
  'thinkinggloballyandacrosscultures': ["Cultural & Global Curiosity", "Adaptability", "Empathy", "Analytical Curiosity"],
  'planningandorganisingwork': ["Structure", "Precision", "Reliability"],
  'takingownershipanddeliveringresults': ["Achievement", "Reliability", "Purpose & Impact"],
  'showinginitiative': ["Entrepreneurial Drive", "Autonomy", "Achievement"],
  'stayingresilientunderpressure': ["Achievement", "Resilience", "Purpose & Impact"],
  'learningquicklyandadaptingtochange': ["Adaptability", "Mastery", "Variety"],
  'beingcuriousandresearchingeffectively': ["Analytical Curiosity", "Mastery", "Independence"],
  'analysinginformation': ["Analytical Curiosity", "Data Curiosity", "Precision"],
  'solvingproblems': ["Analytical Curiosity", "Originality", "Technical Curiosity"],
  'workingconfidentlywithnumbers': ["Data Curiosity", "Precision", "Analytical Curiosity"],
  'payingattentiontodetail': ["Precision", "Reliability", "Structure"],
  'makingdecisionsandusingsoundjudgement': ["Analytical Curiosity", "Precision", "Autonomy"],
  'thinkingcreativelyandinnovating': ["Originality", "Creative Expression", "Entrepreneurial Drive", "Autonomy"],
  'thinkingstrategicallyandseeingthebiggersystem': ["Entrepreneurial Drive", "Analytical Curiosity", "Originality", "Autonomy"],
  'understandingthecommercialpicture': ["Achievement", "Data Curiosity", "Entrepreneurial Drive"],
  'usingtoolsandsystemsconfidently': ["Technical Curiosity", "Structure", "Mastery"],
};

export function normStrengthTitle(s = "") {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}
