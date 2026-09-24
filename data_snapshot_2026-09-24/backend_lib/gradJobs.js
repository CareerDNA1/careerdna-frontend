// CareerDNA — live graduate jobs (and internship link-outs) for the UNIVERSITY
// flow. Mirrors src/faaVacancies.js (apprenticeships): server-side only, hard
// cached in memory, keys read from the environment, degrades gracefully to a
// null count when keys are absent so the UI simply hides the line.
//
// Sources
//   Reed Jobseeker API  — primary. Has a real `graduate=true` filter, so its
//                          totalResults is a genuine "graduate jobs" count.
//                          Auth: HTTP Basic, API key as the username, blank
//                          password (REED_API_KEY).
//   Adzuna Search API   — secondary. Broad UK aggregator; fills the count when
//                          Reed is empty, and contributes extra live listings
//                          (with contract type + apply links). (ADZUNA_APP_ID +
//                          ADZUNA_APP_KEY)
//
// One lookup returns BOTH a headline count and a merged, source-tagged list of
// live listings (title, employer, salary, location, posted date, apply URL), so
// the UI can show a count line that opens a pop-up of the actual roles.
//
// Internships have no reliable free count API, so we do NOT invent a number —
// we return a link-out to a specialist student-jobs site (Higherin, formerly
// RateMyPlacement) pre-filtered to internships for the role's field.

// Generic role nouns that are too common to anchor a search on their own, so a
// "Strategy Analyst" search isn't satisfied by any advert that merely says
// "analyst". A role must match on a more distinctive word where it has one.
const GENERIC_ROLE_WORDS = new Set([
  "analyst", "manager", "consultant", "associate", "engineer", "officer",
  "assistant", "specialist", "coordinator", "executive", "advisor", "adviser",
  "developer", "lead", "administrator", "technician", "representative", "agent",
  "clerk", "operative", "worker", "practitioner", "professional", "director",
  "head", "supervisor", "controller", "trainee", "graduate", "intern",
]);

// Aggregators whose apply links dead-end (Jobrapido re-redirects to expired
// postings and 404s). Matched against a listing's publisher/source and its URL.
const DEAD_LINK_SOURCE = /jobrapido/i;

// Per-role search variations (curated). Lets the graduate-jobs match anchor on
// the role's known market titles (e.g. Data Scientist, AI Engineer / Machine
// Learning Engineer) instead of one exact phrase, so real adverts aren't missed.
let ROLE_SEARCH_TERMS = {};
try { ROLE_SEARCH_TERMS = require("../data/cdna/role_search_terms.json"); } catch (_) { ROLE_SEARCH_TERMS = {}; }
function variationsFor(title) {
  const t = String(title || "").trim();
  return (ROLE_SEARCH_TERMS[t] && ROLE_SEARCH_TERMS[t].length) ? ROLE_SEARCH_TERMS[t] : [t];
}

// Seniority filter for the graduate-JOBS search. Reed's `graduate=true` flag and
// Adzuna's title search are loose, so clearly senior adverts leak in. Drop them
// by an explicit senior word in the title, or a stated 3+ years' experience.
const SENIOR_TITLE_RE = /\b(senior|snr|sr|lead|staff|principal|head\s+of|director|chief|vp|vice[\s-]?president)\b/i;

// Freelance / one-off gig briefs (common on Adzuna): "10-second YouTube outro",
// "Logo animation", "funny animated videos", "£40/hr" tutoring, etc. Not real
// graduate jobs — drop them.
const GIG_TITLE_RE = /(\byou\s?tube\b|\boutro\b|\bintro animation\b|\blogo animation\b|\bexplainer\b|\bwhiteboard animation\b|\banimated videos?\b|\bshort video\b|\bfunny\b|\bfor clip\b|\bgif\b|\bvoice\s?over\b|\bper hour\b|£\s?\d+\s*\/?\s*(hr|hour)|\d+\s*[-\s]?second|document design|educational purposes)/i;
function isGigAdvert(j) { return GIG_TITLE_RE.test(String(j.title || "")); }
// Highest number in a salary string (handles "£25,000 - £35,000", "Up to £104,000").
function salaryMax(s) {
  const nums = String(s || "").replace(/,/g, "").match(/\d{4,6}/g);
  return nums ? Math.max(...nums.map(Number)) : null;
}
// A graduate advert paying ~£70k+ is almost certainly a senior role mislabelled
// (grad schemes top out around £50–55k), so treat it as senior.
const SALARY_SENIOR = 70000;
function isSeniorJob(j) {
  if (SENIOR_TITLE_RE.test(String(j.title || ""))) return true;
  const sal = salaryMax(j.salary);
  if (sal && sal >= SALARY_SENIOR) return true;
  // Graduate-friendly up to 2 years; only 3+ years is treated as senior. A
  // "<n> years" range like "2-6 years" reads the upper bound (6), so it still drops.
  const m = String(j.experience || "").match(/(\d+)\s*\+?\s*years?/i);
  return !!(m && Number(m[1]) >= 3);
}

// Graduate gate for the jobs box: an advert qualifies as a graduate role if
// EITHER it is described as graduate-level, OR it needs little/no experience.
// Reed adverts already pass Reed's own graduate=true filter, so they count.
const GRAD_MENTION_RE = /\b(graduate|grad scheme|grad programme|graduate programme|graduate scheme|trainee|junior|entry[\s-]?level|early careers?|no experience( required| needed)?)\b/i;
function experienceIsEntry(exp) {
  const s = String(exp || "");
  if (/\b(no experience|entry[\s-]?level|graduate|placement)\b/i.test(s)) return true;
  const m = s.match(/(\d+)\s*\+?\s*years?/i);
  return !!(m && Number(m[1]) <= 2); // 0–2 years counts as graduate-friendly
}
function isGraduateAdvert(j) {
  if (String(j.source || "") === "Reed") return true; // Reed graduate=true filter
  // _gradMention is set during enrichExperience from the advert's FULL text
  // (Reed detail body / Adzuna description), because _desc is stripped by then.
  if (j._gradMention === true || GRAD_MENTION_RE.test(String(j.title || ""))) return true;
  // Loosened gate: an advert with NO stated experience counts as open to early
  // careers (clearly-senior roles are removed separately by isSeniorJob). Only an
  // explicit 3+ years' requirement fails here.
  const exp = String(j.experience || "").trim();
  if (!exp || /\bnot (stated|specified|provided|given|listed)\b/i.test(exp)) return true;
  return experienceIsEntry(exp);
}

// Recruitment / search agencies flood graduate-scheme searches with their own
// "graduate programme - trainee recruitment consultant" adverts, which are not
// the sector the student picked. Drop by title or hiring-employer name.
const RECRUITMENT_RE = /\b(recruitment consultant|trainee recruiter|executive search|search (&|and) selection|resourcer|360 (recruitment|recruiter)|recruitment agency|talent (acquisition )?(consultant|partner) at a recruit)\b/i;
function isRecruitmentAgencyJob(j) {
  return RECRUITMENT_RE.test(String(j.title || "")) ||
    /\b(recruitment|search (&|and) selection|recruiters?|resourcing)\b/i.test(String(j.employer || ""));
}

const REED_API_KEY = process.env.REED_API_KEY || "";
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || "";
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY || "";
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || ""; // RapidAPI key (optional)
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY || ""; // SerpApi key (Google for Jobs)

const REED_SEARCH = "https://www.reed.co.uk/api/1.0/search";
const ADZUNA_SEARCH = "https://api.adzuna.com/v1/api/jobs/gb/search/1";
const JSEARCH_BASE = "https://jsearch.p.rapidapi.com";
const JSEARCH_PATHS = ["/search", "/search-v2"]; // try both; API version varies
const JSEARCH_HOST = "jsearch.p.rapidapi.com";
const SERPAPI_BASE = "https://serpapi.com/search.json"; // engine=google_jobs

const TTL_MS = Number(process.env.GRADJOBS_CACHE_TTL_MS || 24 * 60 * 60 * 1000); // 24h
const NEG_TTL_MS = 30 * 60 * 1000; // cache failures/empties briefly (30m)
const REQ_TIMEOUT_MS = 8000;
const REED_PAGE = 100;  // Reed listings to pull (filtered down on our side)
const ADZUNA_PAGE = 50; // Adzuna listings to pull (title-only, filtered down)
const MAX_JOBS = 30;    // listings returned (pop-up shows 15, expands to all of these)
const DETAIL_CONCURRENCY = 6; // parallel Reed detail lookups at a time (be gentle)

// Words ignored when deciding whether a job title matches the role.
const STOPWORDS = new Set([
  "and", "the", "of", "for", "with", "in", "to", "a", "an", "or", "at", "on",
  "graduate", "junior", "trainee", "entry", "level", "assistant", "senior",
]);

// Reduce a word to a rough singular so "analysts"/"analyst" and
// "investments"/"investment" match. Deliberately simple.
function singular(w) {
  if (w.length > 4 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

// Significant, singularised terms of the role title (used to test job titles).
function keyTerms(phrase) {
  return cleanKeyword(phrase)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w))
    .map(singular);
}

// A job is "on target" when the role terms appear as a CONSECUTIVE run, in
// order, within the job title (after dropping filler words and singularising).
// This means an actual "investment analyst" phrase — not "investment" from a
// company name ("Fisher Investments") plus "analyst" from elsewhere in the title.
function titleMatches(title, terms) {
  if (!title || !terms.length) return false;
  const seq = String(title)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singular)
    .filter((w) => !STOPWORDS.has(w));
  if (terms.length > seq.length) return false;
  for (let i = 0; i + terms.length <= seq.length; i += 1) {
    let ok = true;
    for (let j = 0; j < terms.length; j += 1) {
      if (seq[i + j] !== terms[j]) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

const cache = new Map();    // keyword -> { at, data }
const inflight = new Map();  // keyword -> Promise (dedupe concurrent identical lookups)

function hasReed() { return !!REED_API_KEY; }
function hasAdzuna() { return !!(ADZUNA_APP_ID && ADZUNA_APP_KEY); }
function hasJSearch() { return !!JSEARCH_API_KEY; }
// SerpApi is OFF unless explicitly enabled: it times out on some networks (e.g.
// behind a corporate proxy) and would otherwise add a long hang to every request.
// Set SERPAPI_ENABLE=1 once you've confirmed it responds from your server.
function hasSerp() { return !!SERPAPI_API_KEY && process.env.SERPAPI_ENABLE === "1"; }
function hasGradJobsKeys() { return hasReed() || hasAdzuna() || hasJSearch() || hasSerp(); }

// Turn a role title into a clean search keyword: drop parenthetical qualifiers
// and level tags, collapse whitespace.
function cleanKeyword(title) {
  return String(title || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Public "see all" links (no API key needed — safe to hand to the browser).
function reedSearchUrl(keyword) {
  const q = encodeURIComponent(cleanKeyword(keyword));
  return `https://www.reed.co.uk/jobs?keywords=${q}&graduate=true`;
}
function adzunaSearchUrl(keyword) {
  const q = encodeURIComponent(cleanKeyword(keyword));
  return `https://www.adzuna.co.uk/search?q=${q}`;
}
function internshipSearchUrl(keyword) {
  const q = encodeURIComponent(cleanKeyword(keyword));
  return `https://higherin.com/search-jobs/internships?query=${q}`;
}
function reedInternUrl(keyword) {
  const q = encodeURIComponent(`${cleanKeyword(keyword)} internship`);
  return `https://www.reed.co.uk/jobs?keywords=${q}`;
}
function adzunaInternUrl(keyword) {
  const q = encodeURIComponent(`${cleanKeyword(keyword)} internship`);
  return `https://www.adzuna.co.uk/search?q=${q}`;
}

// Does a job title look like an internship / placement (vs a permanent role)?
const INTERNSHIP_RE = /\b(intern|internship|placement|summer analyst|vacation scheme|insight (week|day|programme|program)|industrial placement|work placement|year in industry|sandwich|spring week|work experience)\b/i;
function isInternshipTitle(title) {
  return !!title && INTERNSHIP_RE.test(String(title));
}

// Broad sector keyword for PATHWAY-level scheme/internship searches. Grad schemes
// and internships are recruited by broad discipline, so searching the full narrow
// pathway phrase ("Consulting & Strategic Improvement internship") returns almost
// nothing. We map each pathway to a short, high-yield sector term instead. Order
// matters: the most specific rule that matches wins, so a genuinely specialist
// field keeps its own term while generalist business pathways fall back to broad
// business/finance terms. Anything unmatched defaults to "graduate" (widest net).
const SECTOR_RULES = [
  [/real estate|property|survey|valuation/, "real estate"],
  [/actuar/, "actuarial"],
  [/account|audit|assurance/, "accounting"],
  [/\btax\b/, "tax"],
  [/insuranc|underwrit/, "insurance"],
  [/invest|equity|asset|wealth|fund|hedge|private equity|capital market|trading|\bbank/, "investment"],
  [/fintech/, "fintech"],
  [/financ|treasury|\bfp&a\b/, "finance"],
  [/consult/, "consulting"],
  [/cyber|information security/, "cyber security"],
  [/data scien|machine learning|\bai\b|artificial intelligence|analytics|data engineer/, "data"],
  [/software|developer|programming|backend|front.?end|web develop|cloud|devops|platform engineer/, "software"],
  [/civil|structural|mechanical|electrical|aerospace|chemical|process eng|manufactur|engineer/, "engineering"],
  [/architect/, "architecture"],
  [/construction|built environment|quantity survey/, "construction"],
  [/market|brand|advertis|content|social media|\bpr\b|public relations|communications/, "marketing"],
  [/\blaw\b|legal|solicitor|barrister|paralegal|conveyanc/, "law"],
  [/human resource|\bhr\b|people|talent acquisition|recruit|reward/, "human resources"],
  [/supply chain|logistic|procurement|operations/, "operations"],
  [/sales|business development|commercial partner/, "sales"],
  [/project|programme management|\bpmo\b/, "project management"],
  [/environment|sustainab|climate|net zero|conservation|ecolog|renewable/, "sustainability"],
  [/pharma|life scien|biotech|chemist|biolog|physic|research scien|laborator/, "science"],
  [/health|clinical|medic|nurs|\bcare\b|pharmac/, "healthcare"],
  [/teach|education|early years|learning/, "education"],
  [/hospitality|event|tourism|travel|leisure|hotel/, "hospitality"],
  [/retail|merchand|buying/, "retail"],
  [/media|film|television|game|animation|journalis|publish|broadcast/, "media"],
  [/design|creative|\bart\b|fashion|architecture/, "design"],
  [/charit|non.?profit|third sector|policy|government|public affair|civil service/, "public sector"],
  // Generalist business bucket last: strategy/management/business/operations grads
  // are best served by a broad business search rather than a narrow phrase.
  [/business|management|strategy|generalist|corporate|governance|risk|compliance|enterprise|analyst/, "business"],
];
function sectorKeywordFor(title) {
  const t = String(title || "").toLowerCase();
  for (const [re, kw] of SECTOR_RULES) if (re.test(t)) return kw;
  return "graduate"; // widest net if nothing else matched
}


// Looser topic check for internships: every significant role term appears
// somewhere in the title (not necessarily as a consecutive phrase), so a
// "Journalist" search keeps "Editorial / Journalism Intern"-type titles but
// drops unrelated "Studio Intern", "Entrepreneur in Residence Internship", etc.
function titleHasAllTerms(title, terms) {
  if (!title || !terms.length) return false;
  const tokens = String(title).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(singular);
  // A term matches a title token if identical, or they share a 5-char stem
  // (journalist↔journalism, engineer↔engineering) — catches word variants
  // without matching unrelated words.
  const matches = (term) => tokens.some((tok) =>
    tok === term ||
    (term.length >= 5 && tok.length >= 5 &&
     (tok.startsWith(term.slice(0, 5)) || term.startsWith(tok.slice(0, 5)))));
  return terms.every(matches);
}

// --- Pathway-level (sector) sourcing: graduate SCHEMES and INTERNSHIPS -------
// Schemes and internships are recruited by broad discipline, not a single job
// title, so they hang off the PATHWAY and are searched with the pathway's sector
// terms + an "intent" filter (below), with relaxed topic matching.

// A posting is a graduate SCHEME/PROGRAMME (structured multi-year entry route).
const SCHEME_RE = /\b(graduate (scheme|programme|program|trainee|traineeship|development programme)|grad scheme|rotational (graduate )?(scheme|programme)|fast stream|(leadership|management) (development )?(programme|scheme)|early careers? (scheme|programme|programme)|graduate development)\b/i;
function isSchemeTitle(t) { return !!t && SCHEME_RE.test(String(t)); }

// Tokenise a string into rough singular tokens (shared shape with keyTerms).
function tokensOf(s) {
  return String(s || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(singular);
}
// A sector term "hits" a token list if identical or sharing a 5-char stem.
function stemHit(tokens, term) {
  return tokens.some((tok) =>
    tok === term ||
    (term.length >= 5 && tok.length >= 5 &&
     (tok.startsWith(term.slice(0, 5)) || term.startsWith(tok.slice(0, 5)))));
}
// Sector relevance for pathway-level results: on-topic if ANY sector term is in
// the TITLE, or (weaker) ALL sector terms appear across title + description.
// Keeps "<sector> Graduate Scheme" while dropping a scheme that merely mentions
// one generic word deep in its description.
function sectorRelevant(job, terms) {
  if (!terms.length) return false;
  const titleTokens = tokensOf(job.title);
  if (terms.some((t) => stemHit(titleTokens, t))) return true;
  const allTokens = tokensOf(`${job.title || ""} ${job._desc || ""}`);
  return terms.every((t) => stemHit(allTokens, t));
}

// Named specialist providers, chosen so there's always a credible source even
// when the live API count is thin. Prospects is the broad UK graduate site;
// Higherin specialises in internships/placements.
function schemeProvider(keyword) {
  const q = encodeURIComponent(cleanKeyword(keyword));
  return { name: "Prospects", url: `https://www.prospects.ac.uk/graduate-jobs?keywords=${q}` };
}
function internProvider(keyword) {
  const q = encodeURIComponent(cleanKeyword(keyword));
  return { name: "Prospects", url: `https://www.prospects.ac.uk/graduate-jobs?jobtypes=internship&keywords=${q}` };
}

// Tidy a company name: if it's ALL CAPS (e.g. "REGAL BROOKE LIMITED") convert to
// Title Case; leave already-mixed-case names (eFinancialCareers, CMC Consulting)
// untouched.
function tidyCompany(name) {
  if (!name) return null;
  const s = String(name).trim();
  const letters = s.replace(/[^A-Za-z]/g, "");
  const allCaps = letters.length > 0 && letters === letters.toUpperCase();
  if (!allCaps) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

// UK postcode areas -> principal post town, used only when the location is
// *just* a postcode (some employers type a postcode instead of a town).
const POSTCODE_CITY = {
  AB: "Aberdeen", AL: "St Albans", B: "Birmingham", BA: "Bath", BB: "Blackburn",
  BD: "Bradford", BH: "Bournemouth", BL: "Bolton", BN: "Brighton", BR: "Bromley",
  BS: "Bristol", BT: "Belfast", CA: "Carlisle", CB: "Cambridge", CF: "Cardiff",
  CH: "Chester", CM: "Chelmsford", CO: "Colchester", CR: "Croydon", CT: "Canterbury",
  CV: "Coventry", CW: "Crewe", DA: "Dartford", DD: "Dundee", DE: "Derby",
  DG: "Dumfries", DH: "Durham", DL: "Darlington", DN: "Doncaster", DT: "Dorchester",
  DY: "Dudley", E: "London", EC: "London", EH: "Edinburgh", EN: "Enfield",
  EX: "Exeter", FK: "Falkirk", FY: "Blackpool", G: "Glasgow", GL: "Gloucester",
  GU: "Guildford", GY: "Guernsey", HA: "Harrow", HD: "Huddersfield", HG: "Harrogate",
  HP: "Hemel Hempstead", HR: "Hereford", HS: "Western Isles", HU: "Hull", HX: "Halifax",
  IG: "Ilford", IP: "Ipswich", IV: "Inverness", JE: "Jersey", KA: "Kilmarnock",
  KT: "Kingston upon Thames", KW: "Kirkwall", KY: "Kirkcaldy", L: "Liverpool",
  LA: "Lancaster", LD: "Llandrindod Wells", LE: "Leicester", LL: "Llandudno",
  LN: "Lincoln", LS: "Leeds", LU: "Luton", M: "Manchester", ME: "Medway",
  MK: "Milton Keynes", ML: "Motherwell", N: "London", NE: "Newcastle upon Tyne",
  NG: "Nottingham", NN: "Northampton", NP: "Newport", NR: "Norwich", NW: "London",
  OL: "Oldham", OX: "Oxford", PA: "Paisley", PE: "Peterborough", PH: "Perth",
  PL: "Plymouth", PO: "Portsmouth", PR: "Preston", RG: "Reading", RH: "Redhill",
  RM: "Romford", S: "Sheffield", SA: "Swansea", SE: "London", SG: "Stevenage",
  SK: "Stockport", SL: "Slough", SM: "Sutton", SN: "Swindon", SO: "Southampton",
  SP: "Salisbury", SR: "Sunderland", SS: "Southend-on-Sea", ST: "Stoke-on-Trent",
  SW: "London", SY: "Shrewsbury", TA: "Taunton", TD: "Galashiels", TF: "Telford",
  TN: "Tunbridge Wells", TQ: "Torquay", TR: "Truro", TS: "Middlesbrough",
  TW: "Twickenham", UB: "Southall", W: "London", WA: "Warrington", WC: "London",
  WD: "Watford", WF: "Wakefield", WN: "Wigan", WR: "Worcester", WS: "Walsall",
  WV: "Wolverhampton", YO: "York", ZE: "Lerwick",
};

// Job boards / aggregators that post under their OWN name rather than the real
// employer's. When we see one, we try to recover the employer from the title.
const AGGREGATOR_POSTERS = new Set([
  "efinancialcareers", "cvlibrary", "reed", "reedcouk", "totaljobs",
  "jobsite", "indeed", "adzuna", "confidential", "recruiter",
]);

function isAggregatorPoster(name) {
  if (!name) return false;
  return AGGREGATOR_POSTERS.has(String(name).toLowerCase().replace(/[^a-z0-9]/g, ""));
}

// Many aggregator adverts append the real employer to the title, e.g.
// "Senior Investment Analyst - Real Estate Investor - Macdonald & Company".
// Take the last dash-separated segment as the employer.
function employerFromTitle(title) {
  if (!title) return null;
  const parts = String(title).split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1];
  return last.length >= 2 ? last : null;
}

// Resolve the employer to show: real name normally; for aggregator posts, the
// employer recovered from the title (or nothing rather than the job board).
function resolveEmployer(rawName, title) {
  if (isAggregatorPoster(rawName)) return tidyCompany(employerFromTitle(title));
  return tidyCompany(rawName);
}

const UK_POSTCODE = /\b([A-Z]{1,2})\d[A-Z\d]?\s*\d[A-Z]{2}\b/i;      // full, e.g. EC1A 1BB
const UK_POSTCODE_OUT = /^\s*([A-Z]{1,2})\d[A-Z\d]?\s*$/i;            // outward only, e.g. EC1A

// Turn a raw location into a city name. Strips postcodes and country suffixes;
// if only a postcode is left, maps its area to the nearest city.
function cityFromLocation(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  const withoutPc = s
    .replace(new RegExp(UK_POSTCODE.source, "ig"), " ")
    .replace(/\s+/g, " ")
    .replace(/(^[,\s]+)|([,\s]+$)/g, "")
    .trim();
  if (withoutPc && !/^(uk|united kingdom|england|scotland|wales|northern ireland)$/i.test(withoutPc)) {
    return withoutPc.split(",")[0].trim(); // first segment, e.g. "London, UK" -> "London"
  }
  const m = s.match(UK_POSTCODE) || s.match(UK_POSTCODE_OUT);
  const area = m && m[1] ? m[1].toUpperCase() : "";
  if (area && POSTCODE_CITY[area]) return POSTCODE_CITY[area];
  return withoutPc || s;
}

// Format a £ salary range from two optional numbers.
function salaryText(min, max) {
  const n = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
  const lo = n(min);
  const hi = n(max);
  const fmt = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
  if (lo && hi && lo !== hi) return `${fmt(lo)} - ${fmt(hi)}`;
  if (lo) return `From ${fmt(lo)}`;
  if (hi) return `Up to ${fmt(hi)}`;
  return null;
}

// Friendly "5 Aug 2026" from a Reed "dd/MM/yyyy" or an Adzuna ISO date.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function postedDisplay(raw, kind) {
  if (!raw) return null;
  let d = null;
  if (kind === "reed") {
    const m = String(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  } else {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }
  if (!d || Number.isNaN(d.getTime())) return null;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Raw closing date as an ISO day (YYYY-MM-DD), for saved-job expiry checks on the
// client. Only some sources give a real closing date; returns null otherwise.
function isoDate(raw, kind) {
  if (!raw) return null;
  let d = null;
  if (kind === "reed") {
    const m = String(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  } else {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function titleCase(s) {
  return String(s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function contractLabel(time, type) {
  const parts = [];
  if (type) parts.push(titleCase(type));            // permanent / contract
  if (time) parts.push(titleCase(time).toLowerCase()); // full-time / part-time
  return parts.length ? parts.join(", ").replace(/^(\w)/, (c) => c.toUpperCase()) : null;
}

async function fetchJson(url, { headers = {}, timeout = REQ_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json", ...headers },
      signal: controller.signal,
    });
    if (!resp.ok) return { ok: false, status: resp.status };
    const json = await resp.json();
    return { ok: true, json };
  } catch (err) {
    return { ok: false, status: err.name === "AbortError" ? "TIMEOUT" : "FETCH_FAILED" };
  } finally {
    clearTimeout(timer);
  }
}

// Reed: one call returns totalResults + a page of listings. In internship mode
// we search "<role> internship/placement" instead of the graduate filter.
async function reedFetch(keyword, { mode = "grad" } = {}) {
  if (!hasReed()) return { count: null, jobs: [], capped: false };
  const base = cleanKeyword(keyword);
  // Schemes: search the sector with the graduate filter (below) and let the
  // SCHEME_RE filter pick the schemes out, rather than forcing the exact words
  // "graduate scheme" into the query — that surfaces far more real schemes.
  const kw = mode === "intern" ? `${base} internship` : base;
  const q = encodeURIComponent(kw);
  // Reed's graduate flag is ONE of our graduate signals: for the jobs search we
  // keep it on, so Reed returns graduate-tagged roles (and those auto-pass the
  // graduate gate downstream). Internships don't use it.
  const grad = mode === "intern" ? "" : "&graduate=true";
  const url = `${REED_SEARCH}?keywords=${q}${grad}&resultsToTake=${REED_PAGE}`;
  const auth = Buffer.from(`${REED_API_KEY}:`).toString("base64");
  const r = await fetchJson(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!r.ok || !r.json) return { count: null, jobs: [], capped: false };
  const count = Number.isFinite(Number(r.json.totalResults)) ? Number(r.json.totalResults) : null;
  const results = Array.isArray(r.json.results) ? r.json.results : [];
  const jobs = results.map((j) => ({
    title: j.jobTitle || null,
    employer: resolveEmployer(j.employerName, j.jobTitle),
    location: cityFromLocation(j.locationName),
    salary: salaryText(j.minimumSalary, j.maximumSalary),
    deadline: postedDisplay(j.expirationDate, "reed"),
    closingDate: isoDate(j.expirationDate, "reed"),
    url: j.jobUrl || null,
    source: "Reed",
    _id: j.jobId || null,        // for the detail lookup (experience)
    _desc: j.jobDescription || "", // short preview (fallback if detail fails)
  }));
  return { count, jobs, capped: results.length >= REED_PAGE };
}

// Adzuna: one call returns count + a page of listings (with contract info).
// We search TITLE ONLY so results are tightly on-topic rather than any advert
// that merely mentions the words.
async function adzunaFetch(keyword, { mode = "grad" } = {}) {
  if (!hasAdzuna()) return { count: null, jobs: [], capped: false };
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: String(ADZUNA_PAGE),
    max_days_old: mode === "grad" ? "30" : "60",
    "content-type": "application/json",
  });
  // Jobs: tight title-only search. Schemes/internships: broad keyword search
  // (the sector terms sit alongside the intent phrase), filtered on our side.
  const base = cleanKeyword(keyword);
  // Schemes: broad "<sector> graduate" search, then filtered to real schemes by
  // SCHEME_RE on our side (more candidates than forcing "graduate scheme").
  if (mode === "intern") params.set("what", `${base} internship`);
  else if (mode === "scheme") params.set("what", `${base} graduate`);
  else params.set("title_only", base);
  const r = await fetchJson(`${ADZUNA_SEARCH}?${params.toString()}`);
  if (!r.ok || !r.json) return { count: null, jobs: [], capped: false };
  const count = Number.isFinite(Number(r.json.count)) ? Number(r.json.count) : null;
  const results = Array.isArray(r.json.results) ? r.json.results : [];
  const jobs = results.map((j) => ({
    title: j.title || null,
    employer: resolveEmployer(j.company && j.company.display_name, j.title),
    location: cityFromLocation(j.location && j.location.display_name),
    salary: salaryText(j.salary_min, j.salary_max),
    deadline: null, // Adzuna does not provide a closing date
    url: j.redirect_url || null,
    source: "Adzuna",
    _id: null,
    _desc: j.description || "", // Adzuna's description (used to read experience)
  }));
  return { count, jobs, capped: results.length >= ADZUNA_PAGE };
}

// Build an experience label from JSearch's structured field (no text parsing).
function jsearchExperience(req) {
  if (!req || typeof req !== "object") return undefined;
  if (req.no_experience_required === true) return "No experience required";
  const months = Number(req.required_experience_in_months);
  if (Number.isFinite(months) && months > 0) {
    if (months < 12) return "Under 1 year’s experience";
    const yrs = Math.round(months / 12);
    return `${yrs}+ ${yrs === 1 ? "year" : "years"}’ experience`;
  }
  if (req.experience_mentioned === false) return "No experience required";
  return undefined; // fall back to reading the description
}

// JSearch (RapidAPI): aggregates Indeed / LinkedIn / Glassdoor / Google for Jobs
// and returns experience as a structured field. One call, one page (10 results)
// to keep quota use low. Optional — only runs when a key is configured.
async function jsearchFetch(keyword, { mode = "grad" } = {}) {
  if (!hasJSearch()) return { jobs: [] };
  const base = cleanKeyword(keyword);
  // Search the plain role (not "graduate <role>") so this Google-for-Jobs feed
  // returns the FULL breadth of matching adverts; the loosened graduate gate +
  // senior/gig filters then keep the early-career ones. Prepending "graduate"
  // was starving roles that rarely use the word (e.g. creative/animation).
  const query = mode === "intern" ? `${base} internship in United Kingdom`
    : mode === "scheme" ? `${base} graduate scheme in United Kingdom`
    : `${base} in United Kingdom`;
  const params = new URLSearchParams({
    query,
    country: "gb",
    date_posted: "month",
    page: "1",
    // Pull several pages (10 results each) so we see the real breadth, not just the
    // first 10. Tunable via env; default 3 balances coverage against RapidAPI quota.
    num_pages: String(Number(process.env.JSEARCH_PAGES || 3)),
  });
  if (mode === "intern") params.set("employment_types", "INTERN");
  const headers = { "X-RapidAPI-Key": JSEARCH_API_KEY, "X-RapidAPI-Host": JSEARCH_HOST };
  // The results array sits in different places across versions/endpoints.
  const extractArray = (json) => {
    if (!json || typeof json !== "object") return null;
    if (Array.isArray(json.data)) return json.data;
    if (Array.isArray(json.jobs)) return json.jobs;
    if (Array.isArray(json.results)) return json.results;
    if (json.data && Array.isArray(json.data.jobs)) return json.data.jobs;
    if (json.data && Array.isArray(json.data.results)) return json.data.results;
    return null;
  };
  // Try each known path; the search endpoint moved to /search-v2 on newer versions.
  let arr = null;
  let lastStatus = null;
  for (const path of JSEARCH_PATHS) {
    const r = await fetchJson(`${JSEARCH_BASE}${path}?${params.toString()}`, { headers });
    if (r.ok) {
      arr = extractArray(r.json);
      if (arr) break;
      lastStatus = `BAD_SHAPE(${r.json && typeof r.json === "object" ? Object.keys(r.json).join("|") : typeof r.json})`;
    } else {
      lastStatus = `HTTP_${r.status}`;
    }
  }
  if (!arr) return { jobs: [], status: lastStatus || "FAILED" };
  const jobs = arr.map((j) => {
    const annual = String(j.job_salary_period || "").toUpperCase() === "YEAR";
    return {
      title: j.job_title || null,
      employer: tidyCompany(j.employer_name),
      location: j.job_city || j.job_state || cityFromLocation(j.job_location) || null,
      salary: annual ? salaryText(j.job_min_salary, j.job_max_salary) : null,
      deadline: postedDisplay(j.job_offer_expiration_datetime_utc, "adzuna"),
      closingDate: isoDate(j.job_offer_expiration_datetime_utc, "other"),
      url: j.job_apply_link || null,
      source: j.job_publisher || "JSearch",
      experience: jsearchExperience(j.job_required_experience), // string or undefined
      _id: null,
      _desc: j.job_description || "", // fallback if experience is undefined
    };
  // Drop dead-link aggregators (Jobrapido re-redirects to expired postings and
  // 404s) and any listing with no apply link at all.
  }).filter((j) => j.url && !DEAD_LINK_SOURCE.test(j.source || "") && !DEAD_LINK_SOURCE.test(j.url || ""));
  return { jobs };
}

// SerpApi (engine=google_jobs): returns Google for Jobs results directly — the same
// listings a student sees in Google's "Jobs" panel (Barclays via Barclays Careers,
// HR Graduate via Target Jobs, ...). This is our richest source when a key is set.
// Optional — only runs when SERPAPI_API_KEY is configured.
async function serpJobsFetch(keyword, { mode = "grad" } = {}) {
  if (!hasSerp()) return { jobs: [] };
  const base = cleanKeyword(keyword);
  const q = mode === "intern" ? `${base} internship`
    : mode === "scheme" ? `${base} graduate scheme`
    : `graduate ${base}`;
  const pages = Math.max(1, Number(process.env.SERPAPI_PAGES || 1)); // ~10 results/page
  const out = [];
  let nextToken = null;
  let status = "ok";
  for (let p = 0; p < pages; p += 1) {
    const params = new URLSearchParams({
      engine: "google_jobs",
      q,
      // No `location` — it triggers a slow location-resolution step. gl/hl geo-targets
      // the UK and responds far faster.
      hl: "en",
      gl: "uk",
      api_key: SERPAPI_API_KEY,
    });
    if (nextToken) params.set("next_page_token", nextToken);
    // On a later-page timeout we keep the pages already collected rather than discarding.
    const r = await fetchJson(`${SERPAPI_BASE}?${params.toString()}`, { timeout: 15000 });
    if (!r.ok) { status = out.length ? "ok" : `HTTP_${r.status}`; break; }
    const arr = r.json && Array.isArray(r.json.jobs_results) ? r.json.jobs_results : [];
    for (const j of arr) {
      const ext = j.detected_extensions || {};
      const apply = Array.isArray(j.apply_options) && j.apply_options.length ? j.apply_options[0] : null;
      out.push({
        title: j.title || null,
        employer: tidyCompany(j.company_name),
        location: cityFromLocation(j.location) || j.location || null,
        salary: ext.salary || null,
        deadline: ext.posted_at ? `Posted ${ext.posted_at}` : null,
        url: (apply && apply.link) || j.share_link || null,
        // "via LinkedIn" / "via Barclays Careers" — show the real board.
        source: j.via ? String(j.via).replace(/^via\s+/i, "").trim() : "Google Jobs",
        experience: undefined, // parsed from description in enrichExperience
        _id: null,
        _desc: j.description || "",
      });
    }
    nextToken = r.json && r.json.serpapi_pagination && r.json.serpapi_pagination.next_page_token;
    if (!nextToken) break;
  }
  // Drop dead-link aggregators and anything with no apply link.
  const jobs = out.filter((j) => j.url && !DEAD_LINK_SOURCE.test(j.source || "") && !DEAD_LINK_SOURCE.test(j.url || ""));
  return { jobs, status };
}

// Merge source lists: Reed first (graduate-filtered), then Adzuna, then JSearch, dropping
// near-duplicates (same title + employer) and anything with no title.
// Words that don't distinguish two postings by the same employer (location/format
// qualifiers), stripped before the near-duplicate comparison.
const DUP_QUALIFIER = new Set([
  "international", "global", "uk", "london", "england", "britain", "national",
  "remote", "hybrid", "onsite", "office", "based", "fulltime", "parttime",
  "permanent", "contract", "new", "programme", "program", "scheme",
]);
function coreTokenSet(title) {
  return new Set(
    String(title || "").toLowerCase().split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w) && !DUP_QUALIFIER.has(w))
      .map(singular),
  );
}
const isSubset = (a, b) => a.size > 0 && [...a].every((w) => b.has(w));

function mergeJobs(...lists) {
  const seen = new Set();
  const byEmployer = new Map(); // employer -> [coreTokenSet] of kept jobs
  const out = [];
  const src = lists.filter((l) => Array.isArray(l) && l.length);
  // Round-robin across the sources so each (incl. JSearch/LinkedIn) is represented
  // near the top, rather than one source filling every slot before the next.
  const maxLen = Math.max(0, ...src.map((l) => l.length));
  for (let i = 0; i < maxLen; i += 1) {
    for (const list of src) {
      const j = list[i];
      if (!j || !j.title) continue;
      // Dedup key ignores a trailing ", <location>", " - <qualifier>", "(...)" and
      // a leading year, so the same advert posted once per city collapses to one.
      const normTitle = String(j.title).toLowerCase()
        .replace(/^\s*20\d{2}\s+/, "")
        .replace(/\s*[,(].*$/, "")
        .replace(/\s+-\s+.*$/, "")
        .replace(/\s+/g, " ").trim();
      const emp = (j.employer || "").toLowerCase().trim();
      const key = `${normTitle}|${emp}`;
      if (seen.has(key)) continue;
      // Near-duplicate: same employer where one title's core words are a subset of
      // another's — e.g. "Financial Advisory Graduate Programme" vs the same with
      // "International" in front. Keep the first (usually the shorter/cleaner one).
      const core = coreTokenSet(j.title);
      const priorSets = emp ? byEmployer.get(emp) : null;
      if (priorSets && priorSets.some((s) => isSubset(core, s) || isSubset(s, core))) continue;
      seen.add(key);
      if (emp) { if (!priorSets) byEmployer.set(emp, [core]); else priorSets.push(core); }
      out.push(j);
    }
  }
  return out;
}

// Fetch the FULL description for one Reed job (search only returns a preview).
async function reedJobDetail(id) {
  if (!hasReed() || !id) return null;
  const auth = Buffer.from(`${REED_API_KEY}:`).toString("base64");
  const r = await fetchJson(`https://www.reed.co.uk/api/1.0/jobs/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!r.ok || !r.json) return null;
  return r.json.jobDescription || null;
}

// Read the "prior experience" requirement straight from the advert text (the
// employer's own Qualifications wording), rather than guessing from the title.
// Returns a short label, or null when the ad doesn't say.
function parseExperience(text) {
  if (!text) return null;
  const t = String(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();

  if (/\bno (prior |previous )?experience\b/.test(t) ||
      /\bexperience (is )?not (required|necessary|needed)\b/.test(t)) {
    return "No experience required";
  }
  // "2-4 years' experience", "2 to 4 years experience"
  let m = t.match(/(\d+)\s*(?:\+|-|–|—|to)\s*(\d+)\s*(?:years?|yrs?)['’]?\s*(?:of\s*)?experience/);
  if (m) return `${m[1]}–${m[2]} years’ experience`;
  // "3+ years experience", "3 years' experience"
  m = t.match(/(\d+)\s*\+?\s*(?:years?|yrs?)['’]?\s*(?:of\s*)?experience/);
  if (m) return `${m[1]}+ years’ experience`;
  // "minimum/at least 3 years"
  m = t.match(/(?:minimum|at least)\s*(?:of\s*)?(\d+)\s*(?:years?|yrs?)/);
  if (m) return `${m[1]}+ years’ experience`;
  if (/\bno experience\b/.test(t)) return "No experience required";
  if (/\bgraduate\b/.test(t) || /\bentry.?level\b/.test(t)) return "Graduate / entry-level";
  return null; // not stated
}

// Enrich the jobs we're about to show with a "prior experience" label read from
// the full advert. Reed needs a per-job detail call; Adzuna uses its own
// description. Bounded and run in parallel so it stays quick, and always
// degrades to null on any failure. Strips the private _id/_desc fields.
async function enrichExperience(list) {
  const enrichOne = async (j) => {
    let text = j._desc || "";
    try {
      if (typeof j.experience === "string" && j.experience) { // already known (JSearch)
        // experience already set, but still read the description below for grad wording
      } else {
        if (j.source === "Reed" && j._id) {
          const full = await reedJobDetail(j._id);
          if (full) text = full; // Reed's full body is richer than the preview
        }
        j.experience = parseExperience(text);
      }
    } catch (_) {
      if (!j.experience) j.experience = null;
    } finally {
      // Capture the graduate signal from title + full text NOW, before _desc is
      // dropped, so the graduate gate can use "description says graduate/trainee/
      // entry-level" as you asked (this used to be lost).
      j._gradMention = GRAD_MENTION_RE.test(String(j.title || "")) || GRAD_MENTION_RE.test(text);
      delete j._id;
      delete j._desc;
    }
  };
  // Process in small parallel batches so we don't hammer Reed's detail endpoint.
  for (let i = 0; i < list.length; i += DETAIL_CONCURRENCY) {
    await Promise.all(list.slice(i, i + DETAIL_CONCURRENCY).map(enrichOne));
  }
  return list;
}

// Combined live jobs for one role/keyword. Reed (graduate-filtered) is the
// headline count; Adzuna fills in when Reed is empty. Listings from both are
// merged and tagged with their source.
async function getGradJobsForRole(title, { keyword = "", fresh = false, kind = "grad" } = {}) {
  // Three kinds: role-level graduate JOBS (searched by the exact role title), and
  // pathway-level graduate SCHEMES and INTERNSHIPS (searched by a BROAD sector
  // keyword, since schemes/internships recruit by discipline not job title).
  const mode = kind === "internship" ? "intern" : kind === "scheme" ? "scheme" : "grad";
  // Jobs AND internships are anchored to the exact role. Graduate SCHEMES are
  // recruited by discipline, so the frontend passes the PATHWAY (e.g. "Animation
  // & Motion Design") as the keyword and we search on that directly — its terms
  // are what a real "<discipline> Graduate Scheme" advert actually contains.
  const kw = cleanKeyword(keyword || title);

  const links = mode === "intern"
    ? {
        gradSearchUrl: reedInternUrl(kw),
        adzunaSearchUrl: adzunaInternUrl(kw),
        internshipUrl: internshipSearchUrl(kw),
        provider: internProvider(kw),
      }
    : mode === "scheme"
    ? {
        gradSearchUrl: reedSearchUrl(kw),
        adzunaSearchUrl: adzunaSearchUrl(kw),
        internshipUrl: internshipSearchUrl(kw),
        provider: schemeProvider(kw),
      }
    : {
        gradSearchUrl: reedSearchUrl(kw),
        adzunaSearchUrl: adzunaSearchUrl(kw),
        internshipUrl: internshipSearchUrl(kw),
      };

  if (!kw) return { count: null, jobs: [], ...links, error: "NO_KEYWORD" };
  if (!hasGradJobsKeys()) return { count: null, jobs: [], ...links, error: "NO_API_KEY" };

  const cacheKey = `${mode}:${kw}`;
  const now = Date.now();
  const hit = cache.get(cacheKey);
  if (!fresh && hit && now - hit.at < (hit.data.error ? NEG_TTL_MS : TTL_MS)) {
    return { ...hit.data, cached: true };
  }
  if (!fresh && inflight.has(cacheKey)) return inflight.get(cacheKey);

  const run = (async () => {
    try {
      const opts = { mode };
      const [serp, reed, adz, jsearch] = await Promise.all([
        serpJobsFetch(kw, opts), reedFetch(kw, opts), adzunaFetch(kw, opts), jsearchFetch(kw, opts),
      ]);

      // Every source failed outright (network / bad key) -> serve stale if we can.
      if (reed.count === null && adz.count === null &&
          !serp.jobs.length && !reed.jobs.length && !adz.jobs.length && !jsearch.jobs.length) {
        if (hit && !hit.data.error) return { ...hit.data, cached: true, stale: true };
        const data = { count: null, jobs: [], ...links, error: "LOOKUP_FAILED" };
        cache.set(cacheKey, { at: now, data });
        return data;
      }

      // Merge all sources, then keep on-topic listings. Google Jobs (SerpApi) goes
      // FIRST so its (richest) listings lead the round-robin.
      //  - grad:   the role phrase must appear as a consecutive run in the title.
      //  - intern: an internship/placement advert that is on-sector.
      //  - scheme: a graduate-scheme advert that is on-sector.
      const merged = mergeJobs(serp.jobs, jsearch.jobs, reed.jobs, adz.jobs);
      const terms = keyTerms(kw);
      // Graduate jobs match on ANY significant term from the role's variations,
      // so "Strategy Analyst" also keeps "Graduate Corporate Strategy Associate"
      // and "Graduate Analyst Consultant" that Reed returns but a strict phrase
      // match would drop. Filler words (analyst/manager alone) are handled by the
      // graduate-flag + seniority/intern/recruitment filters downstream.
      // The advert TITLE must contain the role phrase (or one of its variation
      // phrases) as a consecutive run: a "Strategy Analyst" search keeps
      // "Junior Strategy Analyst" but not "Data and AI Analyst" or "Strategy
      // Associate". Variations let "AI Engineer" also match "Machine Learning
      // Engineer", etc.
      const roleTermSets = (mode === "grad" || mode === "intern")
        ? variationsFor(title).map((v) => keyTerms(v)).filter((a) => a.length)
        : [];
      const matchesRole = (t) => roleTermSets.some((vt) => titleMatches(t, vt));

      // FIELD-LEVEL broadening for graduate jobs: also keep adverts that share the
      // role's distinctive word (its title minus generic role words), so "HR Officer"
      // keeps every "HR ..." grad advert and "Strategy Analyst" keeps every
      // "Strategy ..." advert (but not "Data Analyst"). Roles whose distinctive word
      // is itself a broad field (data, investment, finance, product, ...) stay on the
      // TIGHT exact-title match, so e.g. Data Scientist doesn't pull every Data Analyst.
      const BROAD_FIELD = new Set([
        "data", "investment", "equity", "banking", "bank", "quant", "quantitative",
        "actuarial", "actuary", "risk", "finance", "financial", "product", "research",
        "science", "scientific", "tax", "audit", "insurance", "fund", "asset", "wealth",
        "trading", "treasury", "economic", "economics", "compliance",
      ]);
      // Abbreviation field words also match their spelled-out form, so "HR Officer"
      // (field "hr") keeps "Human Resources Analyst Graduate Programme".
      const FIELD_SYNONYMS = {
        hr: [["human", "resource"]],
        pr: [["public", "relation"]],
        ux: [["user", "experience"]],
        ui: [["user", "interface"]],
      };
      const distinctive = keyTerms(title).filter((w) => !GENERIC_ROLE_WORDS.has(w));
      const fieldTight = distinctive.length === 0 || distinctive.some((w) => BROAD_FIELD.has(w));
      const fieldSets = [];
      if ((mode === "grad" || mode === "intern") && !fieldTight) {
        fieldSets.push(distinctive);
        if (distinctive.length === 1 && FIELD_SYNONYMS[distinctive[0]]) {
          for (const alt of FIELD_SYNONYMS[distinctive[0]]) fieldSets.push(alt);
        }
      }
      const matchesField = (t) => {
        if (!fieldSets.length) return false;
        const toks = tokensOf(t);
        return fieldSets.some((set) => set.every((w) => stemHit(toks, w)));
      };
      let tight;
      if (mode === "intern") {
        // Internships: role phrase in the title, says intern/internship/placement,
        // not senior, not a recruitment-agency advert, not a freelance gig.
        tight = merged.filter((j) => isInternshipTitle(j.title) && (matchesRole(j.title) || matchesField(j.title)) && !isSeniorJob(j) && !isRecruitmentAgencyJob(j) && !isGigAdvert(j));
      } else if (mode === "scheme") {
        // Graduate schemes: the advert must be CALLED a graduate scheme/programme
        // in its TITLE, on-sector, not senior, not a recruitment agency.
        tight = merged.filter((j) => sectorRelevant(j, terms) && isSchemeTitle(j.title) && !isSeniorJob(j) && !isRecruitmentAgencyJob(j));
      } else {
        // Graduate jobs: the role phrase OR the role's field word in the title,
        // and not a freelance/one-off gig brief.
        tight = merged.filter((j) => (matchesRole(j.title) || matchesField(j.title)) && !isGigAdvert(j));
      }

      // No fallback: if nothing matches the role phrase, show nothing (with a
      // search link) rather than dumping unrelated jobs.
      const tightMode = tight.length > 0;
      let pool = tight;
      // Graduate jobs: also strip seniors and internships/placements (internships
      // belong in the internships box).
      if (mode === "grad") {
        pool = pool.filter((j) => !isSeniorJob(j) && !isInternshipTitle(j.title));
        // Keep the adverts most likely to pass the graduate gate at the front, so
        // slicing to MAX_JOBS (and only enriching those) never truncates the
        // genuine graduate roles when a generic title returns hundreds of matches.
        const gradLikely = (j) =>
          (String(j.source || "") === "Reed" || GRAD_MENTION_RE.test(String(j.title || ""))) ? 0 : 1;
        pool = pool.slice().sort((a, b) => gradLikely(a) - gradLikely(b));
      }
      const useList = pool.slice(0, MAX_JOBS);

      // Read the stated prior-experience from each shown advert.
      await enrichExperience(useList);

      // Second pass, now that experience is known:
      //  - all modes: drop anything that turns out to be senior (2+ / "2-6 years").
      //  - grad: apply the GRADUATE GATE — keep only adverts that read as graduate
      //    (graduate/trainee/entry-level wording, Reed graduate flag) OR that need
      //    little/no experience (0–2 years). Either signal is enough.
      const shown = useList.filter((j) =>
        !isSeniorJob(j) && (mode !== "grad" || isGraduateAdvert(j)));
      shown.forEach((j) => { delete j._gradMention; }); // strip private field before returning

      // Precise count: exactly the number of matching jobs we're returning.
      const data = {
        count: shown.length,
        tight: tightMode,
        reedCount: Number.isFinite(reed.count) ? reed.count : null,
        adzunaCount: Number.isFinite(adz.count) ? adz.count : null,
        sources: {
          googleJobs: serp.jobs.length,
          googleJobsStatus: serp.status || (hasSerp() ? "ok" : "no-key"),
          reed: reed.jobs.length,
          adzuna: adz.jobs.length,
          jsearch: jsearch.jobs.length,
          jsearchStatus: jsearch.status || (hasJSearch() ? "ok" : "no-key"),
        },
        jobs: shown,
        ...links,
      };
      // If we found nothing AND Google (our richest source) failed/timed out, this
      // is very likely a transient miss — mark it so it's cached briefly (30m) and
      // retried, instead of being frozen empty for 24h.
      const googleFailed = hasSerp() && serp.status && serp.status !== "ok";
      if (shown.length === 0 && googleFailed) data.error = "SOURCE_RETRY";
      cache.set(cacheKey, { at: now, data });
      return data;
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, run);
  return run;
}

module.exports = {
  getGradJobsForRole,
  reedSearchUrl,
  adzunaSearchUrl,
  internshipSearchUrl,
  hasGradJobsKeys,
  // exported for testing
  keyTerms,
  titleMatches,
  titleHasAllTerms,
  isInternshipTitle,
  isSchemeTitle,
  sectorRelevant,
  parseExperience,
  POSTCODE_CITY,
  tidyCompany,
};
