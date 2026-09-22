import { ALEVEL_TARIFF } from './academicProfile';

// Personalised reach / match / safe band for a course, computed client-side from
// the student's predicted A-levels vs a university's typical offer. We compare on
// the typicalGrades string (e.g. "AAB") — a 3-grade offer — NOT tariffPoints,
// which is the average tariff of ALL entrants (includes EPQ/4th subjects) and so
// is not comparable to a 3-A-level prediction.

const norm = (s) => String(s || '').trim().toLowerCase();

// Sum the tariff of the student's best three predicted A-levels.
export function studentTop3Tariff(predicted = []) {
  const pts = (Array.isArray(predicted) ? predicted : [])
    .map((r) => ALEVEL_TARIFF[String(r?.grade || '').toUpperCase()] || 0)
    .filter((n) => n > 0)
    .sort((a, b) => b - a)
    .slice(0, 3);
  return pts.reduce((a, b) => a + b, 0);
}

// How many graded predicted A-levels the student has entered.
export function gradedAlevelCount(predicted = []) {
  return (Array.isArray(predicted) ? predicted : []).filter(
    (r) => r && r.subject && ALEVEL_TARIFF[String(r.grade || '').toUpperCase()]
  ).length;
}

// Convert a typical-offer grade string ("A*AA", "AAB", "BBC") into a top-3 tariff.
export function offerTariff(typicalGrades) {
  const grades = String(typicalGrades || '').match(/A\*|[A-E]/g) || [];
  return grades.slice(0, 3).reduce((sum, g) => sum + (ALEVEL_TARIFF[g] || 0), 0);
}

// Band the gap between the student's top-3 and the course's typical offer.
// One A-level grade is ~8 tariff points. Four student-facing bands:
//   Safe      (>= +1 grade above the offer)
//   Match     (within a grade either way)
//   Stretch   (1 to 3 grades below: ambitious but realistic)
//   Aspirational (more than 3 grades below: a big ask)
// The Stretch/Aspirational split stops a huge gap (e.g. BBB -> Cambridge)
// reading the same as a near miss (e.g. AAB -> an A*AA course).
export function gradeBand(studentTariff, typicalGrades) {
  const course = offerTariff(typicalGrades);
  if (!studentTariff || !course) return null;
  const diff = studentTariff - course;
  if (diff >= 8) return { key: 'safe', label: 'Safe' };
  if (diff >= -8) return { key: 'match', label: 'Match' };
  if (diff >= -24) return { key: 'reach', label: 'Stretch' };
  return { key: 'longshot', label: 'Ambitious' };
}

// Subject-level prerequisite check. Lenient: a GCSE the student has not entered is
// never treated as a failure (incomplete data is not a barrier). Returns the
// required A-levels and GCSE minimums the student is clearly missing.
const SCIENCES = ['biology', 'chemistry', 'physics'];
function gcseKey(subject) {
  const s = norm(subject);
  if (s.includes('math')) return 'maths';
  if (s.includes('english')) return 'english';
  if (s.includes('science') || SCIENCES.some((x) => s.includes(x))) return 'science';
  return null;
}
export function checkPrerequisites(ap, requirements) {
  if (!requirements) return { met: true, missingAlevels: [], missingGcse: [] };
  const has = new Set((ap?.predicted_alevels || []).map((r) => norm(r.subject)).filter(Boolean));

  const missingAlevels = (requirements.required_alevels || []).filter((req) => {
    const r = norm(req);
    if (r === 'a science') return !SCIENCES.some((s) => has.has(s));
    // Soft/ambiguous requirements we can't reliably detect from free text: don't gate.
    if (['a modern language', 'a classical language', 'an essay-based subject'].includes(r)) return false;
    return !has.has(r);
  });

  const gmap = {};
  (ap?.gcses || []).forEach((r) => {
    const k = gcseKey(r.subject);
    if (k) gmap[k] = Math.max(gmap[k] || 0, Number(r.grade) || 0);
  });
  const label = { maths: 'Maths', english: 'English', science: 'Science' };
  const missingGcse = [];
  // The rankings warning is based on the MINIMUM a university will accept
  // (gcse_min), not the typical grade — a grade 4 in GCSE Maths with a strong
  // A-level is fine for most courses, so we only flag below the true floor.
  const gr = requirements.gcse_min || requirements.gcse || {};
  Object.keys(gr).forEach((k) => {
    const need = Number(gr[k]) || 0;
    const have = gmap[k];
    if (have != null && have < need) missingGcse.push({ subject: label[k] || k, need, have });
  });

  return { met: missingAlevels.length === 0 && missingGcse.length === 0, missingAlevels, missingGcse };
}
