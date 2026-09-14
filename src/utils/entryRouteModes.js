// Entry-route classification for the live-jobs boxes (university flow).
//
// Context: these users are already at university studying a subject. Their
// degree surfaces pathways, and roles/jobs hang off those pathways. For most
// roles "live graduate jobs" is the right thing to show. But a class of
// destinations are NOT reached through the open graduate job market:
//   • postgrad: the honest next step is a Master's or PhD (academia/research)
//   • qualifying: entry is a regulated route (Foundation Programme, training
//                 contract, QTS, HCPC/NMC/GPhC registration, ARB Parts, ...)
// For those we replace the jobs box with a short, forward-looking advisory note
// phrased as the NEXT step from the student's current degree, not a
// prerequisite they are missing.
//
// Anything not listed here returns { mode: 'jobs' } and behaves exactly as now.

// Normalise a title for matching: lower-case, straighten curly apostrophes,
// collapse punctuation/whitespace so "Children’s Nurse" == "childrens nurse".
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// route = the sentence shown in the advisory panel (phrased as the next step).
const QUALIFYING_GROUPS = [
  {
    route: 'Entry is through the UK Foundation Programme after your medical degree, then specialty training. Posts here are filled through that route rather than the open graduate job market.',
    items: [
      'Academic Doctor', 'Acute Medicine Doctor', 'Anaesthetist', 'Child & Adolescent Psychiatrist',
      'Clinical Geneticist', 'Clinical Leadership Fellow', 'Clinical Radiologist', 'Clinical Research Fellow',
      'Clinical Trials Doctor', 'Consultant Physician', 'Consultant Surgeon', 'Digital Health Doctor',
      'Emergency Medicine Doctor', 'Forensic Psychiatrist', 'Foundation Doctor', 'General Practitioner',
      'Health Policy Doctor', 'Hospital Doctor', 'Intensive Care Doctor', 'Medical Educator', 'Oral Surgeon',
      'Pathologist', 'Psychiatrist', 'Public Health Doctor', 'Surgeon', 'Surgical Trainee',
      'Clinical Medicine / Doctor', 'Surgery & Procedural Medicine', 'Acute, Emergency & Critical Care',
      'Diagnostic & Investigative Medicine', 'Mental Health & Behavioural Medicine',
      'Academic Medicine & Clinical Research', 'Public Health Medicine, Epidemiology & Health Policy',
    ],
  },
  {
    route: 'Entry is through a nursing or midwifery degree and NMC registration, then applying for structured NHS posts. Posts here are filled through that route rather than the open graduate job market.',
    items: [
      'Adult Nurse', "Children's Nurse", 'Learning Disability Nurse', 'Mental Health Nurse', 'Midwife',
      'Health Visitor', 'Nurse Educator', 'Nurse Manager', 'Clinical Research Nurse / Research Nurse',
      'Advanced Clinical Practitioner',
      'Nursing', 'Midwifery', 'Public Health Nursing & Health Visiting', 'Nurse Education & Leadership',
      'Clinical Research Nursing',
    ],
  },
  {
    route: 'Entry is through an MPharm degree, the foundation training year and GPhC registration. Posts here are filled through that route rather than the open graduate job market.',
    items: [
      'Clinical Pharmacist', 'Community Pharmacist', 'Hospital Pharmacist', 'Pharmacist',
      'Public Health Pharmacist', 'Pharmacy Manager',
      'Clinical Pharmacy', 'Community Pharmacy', 'Medicines Policy & Public Health Pharmacy',
    ],
  },
  {
    route: 'Entry is through a dental degree, foundation training and GDC registration. Posts here are filled through that route rather than the open graduate job market.',
    items: [
      'Dentist', 'Academic Dentist', 'Orthodontist', 'Dental Public Health Specialist', 'Dental Researcher',
      'Dentistry / Dentist', 'Specialist Dentistry', 'Dental Research & Academic Dentistry',
      'Oral Health Policy & Dental Public Health',
    ],
  },
  {
    route: 'Entry is through a professional degree and HCPC registration, or the NHS Scientist Training Programme. This is a structured route rather than the open graduate job market.',
    items: [
      'Physiotherapist', 'Occupational Therapist', 'Diagnostic Radiographer', 'Paramedic', 'Clinical Physiologist',
      'Healthcare Scientist', 'Clinical Scientist', 'Clinical Diagnostic Scientist', 'Biomedical Scientist',
      'Medical Laboratory Scientist', 'Medical Microbiologist',
      'Diagnostics, Imaging & Clinical Support', 'Clinical Science & Laboratory Diagnostics',
      'Paramedic Practice & Emergency Care',
    ],
  },
  {
    route: 'Entry is through a postgraduate doctorate or accredited training and professional registration. Posts here are filled through that route rather than the open graduate job market.',
    items: [
      'Clinical Psychologist', 'Counselling Psychologist', 'Psychotherapist', 'Counsellor', 'CBT Therapist',
      'Clinical Psychology & Mental Health Support', 'Counselling, Psychotherapy & Therapeutic Practice',
    ],
  },
  {
    route: 'Entry is through the SQE or Bar course and a training contract or pupillage after your degree. Posts here are filled through that route rather than the open graduate job market.',
    items: ['Barrister', 'Solicitor', 'Barrister & Advocacy', 'Solicitor Practice'],
  },
  {
    route: 'Entry is through a BPS-accredited Master’s and Stage 2 qualification with HCPC registration. This is a structured route rather than the open graduate job market.',
    items: ['Occupational Psychologist'],
  },
  {
    route: 'Entry is through initial teacher training and Qualified Teacher Status, for example a PGCE. Posts here are filled through that route rather than the open graduate job market.',
    items: [
      'Primary School Teacher', 'Secondary School Teacher', 'SEN Teacher', 'Early Years Teacher',
      'Primary Teaching & Classroom Practice', 'Secondary Teaching',
    ],
  },
  {
    route: 'Entry is through a social work degree and Social Work England registration. Posts here are filled through that route rather than the open graduate job market.',
    items: ['Social Worker', 'Social Work & Safeguarding'],
  },
  {
    route: 'Entry is through ARB Parts 1, 2 and 3, which takes around seven years including work in practice, rather than the open graduate job market.',
    items: ['Architect', 'Architecture'],
  },
  {
    route: 'Entry is through a veterinary degree and RCVS registration. Posts here are filled through that route rather than the open graduate job market.',
    items: ['Veterinary Surgeon'],
  },
];

const POSTGRAD_ROUTE =
  'This path usually means further study. The typical next step from your degree is a Master’s or PhD, rather than applying for graduate jobs now.';
const POSTGRAD_ITEMS = [
  'Higher Education & Academic Research',
  'Research Scientist', 'R&D Scientist', 'Postdoctoral Researcher', 'University Lecturer',
];

// Founder roles are not applied for on the job market — you start the venture.
const VENTURE_ROUTE =
  'You don’t apply for this. You start it. The usual path is building experience in an early stage company, testing your own idea, and joining an accelerator or raising early funding when you’re ready. There is no graduate job route into it.';
const VENTURE_ITEMS = [
  'Founder', 'Healthtech Founder', 'Venture Building & Founder',
];

// Build a normalised lookup: title -> { mode, route }.
const MAP = new Map();
for (const g of QUALIFYING_GROUPS) {
  for (const t of g.items) MAP.set(norm(t), { mode: 'qualifying', route: g.route });
}
for (const t of POSTGRAD_ITEMS) MAP.set(norm(t), { mode: 'postgrad', route: POSTGRAD_ROUTE });
for (const t of VENTURE_ITEMS) MAP.set(norm(t), { mode: 'venture', route: VENTURE_ROUTE });

// Public: classify a single title.
export function entryRouteFor(title) {
  return MAP.get(norm(title)) || { mode: 'jobs' };
}

// Public: mode for a role card, considering both its role title and its pathway.
// A non-"jobs" verdict from either wins (the whole box becomes advisory).
export function entryRouteForCard(roleTitle, pathwayTitle) {
  const r = entryRouteFor(roleTitle);
  if (r.mode !== 'jobs') return r;
  const p = entryRouteFor(pathwayTitle);
  return p.mode !== 'jobs' ? p : r;
}

export default entryRouteFor;
