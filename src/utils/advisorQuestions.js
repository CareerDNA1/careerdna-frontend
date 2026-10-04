// Suggested questions for Your Advisor, in one place.
//
// Each context (a report tab, the rankings table, the Profile page) has a
// title and a question set for school students and one for university
// students. Questions can carry a condition so we never suggest something the
// advisor cannot answer: 'grades' needs predicted grades entered, 'saved' needs
// favourites, 'applied' needs at least one application. When a condition is not
// met and the question has a `nudge`, the nudge is shown instead, pointing the
// student at the thing worth doing next.
//
// Keep every question free of dashes and under about 60 characters so it fits
// on one line in the drawer.

const CONTEXTS = {
  yourtype: {
    title: 'your career profiles',
    school: [
      'What does my top Career Profile say about the work I would enjoy?',
      'How do my two main Career Profiles work together?',
      'What careers tend to suit people with my profile mix?',
      'Does it matter that some of my profile scores are close together?',
    ],
    university: [
      'What does my top Career Profile say about the work I would enjoy?',
      'How do my two main Career Profiles work together?',
      'What graduate roles tend to suit people with my profile mix?',
      'How do I describe my profile in an interview?',
    ],
  },
  traits: {
    title: 'your traits',
    school: [
      'Which of my traits should I build on now?',
      'What does a low score on a trait actually mean?',
      'Which traits matter most for the careers I am considering?',
      'How could I show these traits in a personal statement?',
    ],
    university: [
      'Which of my traits should I build on now?',
      'What does a low score on a trait actually mean?',
      'Which traits matter most for the roles I am considering?',
      'How can I evidence these traits on my CV?',
    ],
  },
  selfawareness: {
    title: 'your self-awareness',
    school: [
      'How can I use this to make better decisions about my future?',
      'Which of these insights should I take most seriously?',
      'How do I explain my profile to my parents or a teacher?',
      'What should I be careful of, given my profile?',
    ],
    university: [
      'How can I use this to make better career decisions?',
      'Which of these insights should I take most seriously?',
      'What should I watch out for in my first job?',
      'How do I explain my profile to an employer?',
    ],
  },
  summary: {
    title: 'your results',
    school: [
      'Give me a short summary of what my results say.',
      'What are the three most important things to take from my results?',
      'What should I look at first in this report?',
      'How much weight should I put on these results?',
    ],
    university: [
      'Give me a short summary of what my results say.',
      'What are the three most important things to take from my results?',
      'What should I look at first in this report?',
      'How much weight should I put on these results?',
    ],
  },
  strengths: {
    title: 'your strengths',
    school: [
      'Which careers make the most of my top strengths?',
      'Which of my strengths should I mention in a personal statement?',
      'How can I develop my strengths further while I am still at school?',
      'Which of my strengths do employers value most?',
    ],
    university: [
      'Which of my strengths should I lead with in interviews?',
      'Which graduate roles make the most of my top strengths?',
      'How can I develop my strengths further before I graduate?',
      'Which of my strengths are most in demand for graduate roles?',
    ],
  },
  environments: {
    title: 'your work styles',
    school: [
      'What work settings would suit me best?',
      'Which careers match my work styles?',
      'Which of my work styles should count most when I choose a path?',
      'How do I find out whether a job really offers these conditions?',
    ],
    university: [
      'What kind of employer would suit my work styles?',
      'Which roles match my work styles?',
      'How do I ask about these conditions in an interview?',
      'Which of my work styles should count most when I choose a role?',
    ],
  },
  careerworlds: {
    title: 'your career worlds',
    school: [
      'Why do these career worlds fit me?',
      'Compare my top two career worlds.',
      'What would a first job look like in my top career world?',
      'Which of these worlds has the best prospects in the UK?',
    ],
    university: [
      'Why do these career worlds fit me?',
      'Compare my top two career worlds.',
      'Which of these worlds has the strongest graduate market right now?',
      'Can I move between my top worlds later in my career?',
    ],
  },
  pathways: {
    title: 'your career pathways',
    school: [
      'How do I know which pathway fits me best?',
      'Which of my pathways can I enter without a degree?',
      'What is the difference between a pathway and the roles inside it?',
      'What can I do now, at school, to prepare for my top pathway?',
    ],
    university: [
      'How do I know which pathway fits me best?',
      'Which of these pathways can I enter with my degree?',
      'What experience do I need for my top pathway?',
      'What should I do this term to move towards my top pathway?',
    ],
  },
  roles: {
    title: 'your roles',
    school: [
      'What is a typical day in these roles?',
      'How do I get into these roles?',
      'What skills do these roles need, and how do I build them?',
      'Which of these roles is most in demand?',
    ],
    university: [
      'What is a typical day in these roles?',
      'How do I get my first role here?',
      'What skills do these roles need, and how do I build them?',
      'What do these roles pay at entry level?',
    ],
  },
  furtherstudy: {
    title: 'university options',
    school: [
      'Which of these degrees fits me best?',
      'Which A-levels should I take for these degrees?',
      { text: 'Do my predicted grades match these degrees?', needs: 'grades', nudge: 'What grades do these degrees usually ask for?' },
      'How do I choose between these degrees?',
    ],
    university: [
      'Which of these courses fits my degree and profile best?',
      'Is a master’s worth it for my pathways?',
      'How do I choose between these courses?',
      'What careers do these courses lead to?',
    ],
  },
  nonuni: {
    title: 'training and work',
    school: [
      'Which of these apprenticeships suits me best?',
      'How does an apprenticeship compare with university for me?',
      'What grades do I need for these routes?',
      'How do I find and apply for these openings?',
    ],
    university: [
      'Are graduate schemes or degree apprenticeships better for me?',
      'Which of these routes suits me best?',
      'How do I find and apply for these openings?',
      'Which of these routes has the best prospects?',
    ],
  },
  rankings: {
    title: 'these universities',
    school: [
      'How should I compare these universities?',
      'What does the CareerDNA Ranking measure?',
      { text: 'Which of these are realistic with my predicted grades?', needs: 'grades', nudge: 'How do I see which universities are realistic for me?' },
      'Does the university matter more than the subject?',
    ],
    university: [
      'How should I compare these universities for further study?',
      'What does the CareerDNA Ranking measure?',
      'Does the university matter more than the course for employers?',
      'Which of these are realistic for me?',
    ],
  },
  profile: {
    title: 'your next steps',
    school: [
      'What should my next step be?',
      { text: 'Help me compare the things I have saved in Favourites.', needs: 'saved', nudge: 'What should I be saving to my Favourites?' },
      { text: 'Which of my applications should I focus on?', needs: 'applied', nudge: 'When should I start applying, and to what?' },
      { text: 'Are my predicted grades enough for the degrees I have saved?', needs: 'grades', nudge: 'Why should I enter my predicted grades?' },
    ],
    university: [
      'What should my next step be?',
      { text: 'Which of my saved jobs should I prioritise?', needs: 'saved', nudge: 'What should I be saving to my Favourites?' },
      { text: 'Help me plan my applications for this term.', needs: 'applied', nudge: 'When should I start applying, and to what?' },
      { text: 'What is missing from my CV for the roles I have saved?', needs: 'saved', nudge: 'What should I have on my CV at this stage?' },
    ],
  },
};

// Shown when there is no section context, and after the context questions.
const GENERAL = {
  school: [
    'How did you decide which career worlds match me best?',
    'Which A-level subjects fit my profile?',
    'How can I use this profile in university applications?',
    'What skills should I develop for my top pathways?',
  ],
  university: [
    'How did you decide which pathways match me best?',
    'How can I use this profile in my personal statement and CV?',
    'What skills should I develop for my top roles?',
    'What practical next steps should I take this month?',
  ],
};

// Map the keys the pages use to the contexts above.
const ALIASES = {
  profile_type: 'yourtype',
  yourtype: 'yourtype',
  traits: 'traits',
  selfawareness: 'selfawareness',
  summary: 'summary',
  strengths: 'strengths',
  environments: 'environments',
  careerworlds: 'careerworlds',
  pathways: 'pathways',
  discovermore: 'pathways',
  roleexplorer: 'roles',
  roles: 'roles',
  furtherstudy: 'furtherstudy',
  nonuni: 'nonuni',
  rankings: 'rankings',
  profilepage: 'profile',
  profile: 'profile',
};

export const ADVISOR_CONTEXT_KEYS = Object.keys(ALIASES);

export function normaliseStage(stage) {
  const s = String(stage || '').toLowerCase();
  if (['school', 'gcse', 'a-level', 'alevel', 'sixth form', 'sixth-form'].includes(s)) return 'school';
  if (!s) return 'school';
  return 'university';
}

function resolve(items, facts) {
  const out = [];
  for (const q of items || []) {
    if (typeof q === 'string') { out.push(q); continue; }
    if (!q || !q.text) continue;
    const ok = !q.needs || Boolean(facts[q.needs]);
    if (ok) out.push(q.text);
    else if (q.nudge) out.push(q.nudge);
  }
  return out;
}

// facts: { grades, saved, applied } booleans
export function advisorContextFor(sectionKey, stage, facts = {}) {
  const key = ALIASES[String(sectionKey || '')];
  if (!key) return null;
  const ctx = CONTEXTS[key];
  const st = normaliseStage(stage);
  return {
    section: key,
    title: ctx.title,
    questions: resolve(ctx[st] || ctx.school, facts),
  };
}

export function advisorGeneralQuestions(stage) {
  return GENERAL[normaliseStage(stage)] || GENERAL.school;
}
