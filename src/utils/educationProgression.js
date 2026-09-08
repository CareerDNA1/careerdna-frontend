// Education progression helpers.
//
// The whole point: we record a small amount of locked/identity data once
// (date of birth, education level, and for university a course start year)
// and then DERIVE the person's current stage on every visit. That gives us
// automatic year-on-year progression (Year 10 this year becomes Year 11 next
// September) without ever re-asking, and it is the basis for the yearly
// check-in / re-engagement flow.

// Age in whole years as of a reference date (defaults to now).
export function ageFromDOB(dob, asOf = new Date()) {
  if (!dob) return null;
  const d = new Date(dob);
  const a = new Date(asOf);
  if (Number.isNaN(d.getTime())) return null;
  let age = a.getFullYear() - d.getFullYear();
  const beforeBirthday =
    a.getMonth() < d.getMonth() ||
    (a.getMonth() === d.getMonth() && a.getDate() < d.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

// The academic year "start year" for a date. UK academic years run 1 Sept to
// 31 Aug, so a date in Sept-Dec belongs to that calendar year's academic year,
// and Jan-Aug belongs to the previous calendar year's academic year.
export function academicStartYear(asOf = new Date()) {
  const a = new Date(asOf);
  return a.getMonth() + 1 >= 9 ? a.getFullYear() : a.getFullYear() - 1;
}

// England National Curriculum year group from DOB, using the standard
// "age on 31 August" rule. Reception = turns 5 in the academic year, Year N =
// turns (N + 5) in the academic year.
//   returns e.g. 11 (Year 11 / GCSE year), 12-13 (sixth form / A-levels),
//   <= 0 (below school age), > 13 (has left compulsory schooling).
// NOTE: Scotland/Wales/NI differ slightly; this is the England rule and can be
// refined per nation later using the stored country.
export function ukSchoolYearGroup(dob, asOf = new Date()) {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const aStart = academicStartYear(asOf);
  const bornSepToDec = d.getMonth() + 1 >= 9;
  const ageTurnedDuringYear = bornSepToDec
    ? aStart - d.getFullYear()
    : aStart + 1 - d.getFullYear();
  return ageTurnedDuringYear - 5;
}

// Current university year (1-based) from the academic year the course started.
// e.g. started 2025, now in 2026/27 -> year 2.
export function universityYear(courseStartYear, asOf = new Date()) {
  if (!courseStartYear) return null;
  return academicStartYear(asOf) - Number(courseStartYear) + 1;
}

// Normalise everything into a single stage descriptor the outputs branch on.
// phase is one of:
//   'pre_gcse' | 'choosing_gcse' | 'gcse' | 'sixth_form'
//   | 'undergraduate' | 'postgraduate' | 'left_education'
export function deriveEducationStage(
  { educationLevel, dob, courseStartYear } = {},
  asOf = new Date()
) {
  if (educationLevel === 'undergraduate') {
    return { level: 'undergraduate', uniYear: universityYear(courseStartYear, asOf), phase: 'undergraduate' };
  }
  if (educationLevel === 'postgraduate') {
    return { level: 'postgraduate', uniYear: universityYear(courseStartYear, asOf), phase: 'postgraduate' };
  }

  // school (or unset -> infer from DOB)
  const yr = ukSchoolYearGroup(dob, asOf);
  let phase = 'pre_gcse';
  if (yr === null) phase = 'pre_gcse';
  else if (yr > 13) phase = 'left_education';
  else if (yr >= 12) phase = 'sixth_form';
  else if (yr >= 10) phase = 'gcse';
  else if (yr === 9) phase = 'choosing_gcse';
  else phase = 'pre_gcse';

  return { level: 'school', schoolYear: yr, phase };
}
