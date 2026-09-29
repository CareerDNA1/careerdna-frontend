import { supabase } from './supabaseClient';

// Applications tracker (public.applications). A student marks a favourite ad or
// course as "Applied", then moves it through a simple pipeline on the profile
// page. Applications belong to the student, not to one assessment run.

export const APPLICATION_STATUSES = [
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview / assessment' },
  { value: 'offer', label: 'Offer received' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined the offer' },
  { value: 'unsuccessful', label: 'Unsuccessful' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export const APPLICATION_STATUS_LABEL = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s.value, s.label]));
// Pill colour per status, shared by every surface that shows one.
export const APPLICATION_STATUS_TONE = {
  applied: 'blue', interview: 'amber', offer: 'green', accepted: 'green', declined: 'grey', unsuccessful: 'grey', withdrawn: 'grey',
};

// Statuses that still need the student's attention (the "live" ones).
export const OPEN_STATUSES = new Set(['applied', 'interview', 'offer']);

export const APPLICATION_KINDS = [
  { value: 'job', label: 'Job' },
  { value: 'internship', label: 'Internship / placement' },
  { value: 'scheme', label: 'Graduate scheme' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
  { value: 'college', label: 'College course or T Level' },
  { value: 'course', label: 'University course' },
  { value: 'other', label: 'Other' },
];
export const APPLICATION_KIND_LABEL = Object.fromEntries(APPLICATION_KINDS.map((k) => [k.value, k.label]));
// Kinds offered on the "Add an external application" form, per stage.
export const MANUAL_KINDS_FOR_STAGE = {
  school: ['apprenticeship', 'college', 'course', 'job', 'other'],
  university: ['job', 'internship', 'scheme', 'course', 'other'],
};

const today = () => new Date().toISOString().slice(0, 10);
// A closing date arrives as an ISO timestamp (often 23:59 or midnight in
// another zone); keep the calendar day the student sees in the ad, not the UTC
// day, so the application never shows a day earlier than the favourite.
function localDateOf(iso) {
  if (!iso) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Which pipeline kind a favourite belongs to.
export function applicationKindForFavourite(item) {
  if (!item) return 'other';
  if (item.type === 'course') return 'course';
  if (item.type === 'job') {
    const m = item.meta || {};
    if (m.kind === 'apprenticeship' || /apprentice/i.test(String(m.source || ''))) return 'apprenticeship';
    if (m.kind === 'internship' || m.kind === 'scheme') return m.kind;
    return 'job';
  }
  return 'other';
}

// Only ads and courses can be applied for.
export function canApplyFor(item) {
  return Boolean(item && (item.type === 'job' || item.type === 'course'));
}

async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You need to be logged in.');
  return user;
}

const SELECT = 'id, assessment_run_id, kind, item_type, item_id, title, organisation, url, closing_date, item_meta, status, applied_at, note, history, created_at, updated_at';

export async function listApplications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  // Stable order: newest application first, unaffected by later status edits.
  const { data, error } = await supabase
    .from('applications')
    .select(SELECT)
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// Set of `${item_type}|${item_id}` for quick "already applied" checks. Build it
// from ALL of the student's applications, not just the current stage's, so the
// same ad can never be logged twice.
export function appliedKeySet(apps = []) {
  return new Set((apps || []).filter((a) => a.item_id && a.item_type !== 'manual').map((a) => `${a.item_type}|${a.item_id}`));
}
export const favouriteAppKey = (item) => `${item?.type || ''}|${item?.id || ''}`;

// Mark a favourite (job ad / course) as applied. If the student already has an
// application for this item (from any run or stage) it is returned untouched:
// status, notes and history are never overwritten.
export async function applyFromFavourite(item, { runId = null, stage = '' } = {}) {
  const user = await currentUser();
  const itemType = item.type;
  const itemId = String(item.id || '');
  const { data: existing, error: findError } = await supabase
    .from('applications')
    .select(SELECT)
    .eq('user_id', user.id)
    .eq('item_type', itemType)
    .eq('item_id', itemId)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const meta = { ...(item.meta || {}), ...(stage ? { stage } : {}) };
  // A school student's course application starts as a UCAS choice.
  if (stage === 'school' && item.type === 'course') meta.ucas = 'chosen';
  const row = {
    user_id: user.id,
    assessment_run_id: runId,
    kind: applicationKindForFavourite(item),
    item_type: itemType,
    item_id: itemId,
    title: item.title || 'Application',
    organisation: item.subtitle || meta.employer || meta.university || '',
    url: item.url || meta.url || '',
    closing_date: localDateOf(meta.closingDate),
    item_meta: meta,
    status: 'applied',
    applied_at: today(),
    history: [{ status: 'applied', at: today() }],
  };
  const { data, error } = await supabase.from('applications').insert(row).select().single();
  if (error) throw error;
  return data;
}

// Manually added application (something found outside CareerDNA). Manual rows
// never join the UCAS application: a university course added here is tracked
// as a plain application.
export async function addManualApplication({ kind = 'other', title, organisation = '', url = '', closingDate = null, appliedAt = null, note = '', runId = null, stage = '' }) {
  const user = await currentUser();
  const at = appliedAt || today();
  const item_meta = { ...(stage ? { stage } : {}) };
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      assessment_run_id: runId,
      kind,
      item_type: 'manual',
      item_id: `manual:${(typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
      title: String(title || '').trim() || 'Application',
      organisation: String(organisation || '').trim(),
      url: String(url || '').trim(),
      closing_date: closingDate || null,
      item_meta,
      status: 'applied',
      applied_at: at,
      note: String(note || ''),
      history: [{ status: 'applied', at }],
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateApplicationStatus(id, status, current) {
  const user = await currentUser();
  const history = Array.isArray(current?.history) ? current.history : [];
  const { data, error } = await supabase
    .from('applications')
    .update({ status, history: [...history, { status, at: today() }] })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateApplicationNote(id, note) {
  const user = await currentUser();
  const { error } = await supabase.from('applications').update({ note: String(note || '') }).eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}

export async function removeApplication(id) {
  const user = await currentUser();
  const { error } = await supabase.from('applications').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}

// Whole days between today (local) and a YYYY-MM-DD date. Both sides are
// compared at UTC midnight so British Summer Time cannot shift the answer.
function daysFromToday(isoDate) {
  if (!isoDate) return null;
  const d = new Date(String(isoDate).slice(0, 10));
  if (Number.isNaN(d.getTime())) return null;
  const n = new Date();
  const t = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
  return Math.round((d.getTime() - t) / 86400000);
}

// Closing date has passed while the application is still just "applied" and
// nothing has been heard for two weeks: worth a nudge.
export function isStale(app) {
  if (!app || app.status !== 'applied' || !app.closing_date) return false;
  const days = daysFromToday(app.closing_date);
  return days != null && days <= -14;
}
// Days until an open application's closing date (null when none or past).
export function daysUntilClosing(app) {
  if (!app || !OPEN_STATUSES.has(app.status) || !app.closing_date) return null;
  const days = daysFromToday(app.closing_date);
  return days == null || days < 0 ? null : days;
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function pluralDays(n) {
  return `${n} ${n === 1 ? 'day' : 'days'}`;
}

// Interview / assessment date and time, kept in item_meta.eventAt (ISO string,
// local time). No schema change needed.
export async function updateApplicationEvent(id, eventAt, current) {
  const user = await currentUser();
  const meta = (current?.item_meta && typeof current.item_meta === 'object') ? current.item_meta : {};
  const item_meta = { ...meta, eventAt: eventAt || null };
  const { data, error } = await supabase
    .from('applications')
    .update({ item_meta })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

// Calendar links for an interview: Google Calendar URL and a downloadable .ics.
function icsStamp(d) {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
// RFC 5545 text: escape backslash, semicolon, comma and newlines.
function icsText(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
// Fold lines longer than 75 octets (continuation lines start with a space).
function icsFold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ` ${rest.slice(74)}`; }
  out.push(rest);
  return out.join('\r\n');
}
export function calendarLinks(app) {
  const iso = app?.item_meta?.eventAt;
  if (!iso) return null;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const title = `Interview: ${app.title}${app.organisation ? ` (${app.organisation})` : ''}`;
  const details = [app.note, app.url].filter(Boolean).join('\n');
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${icsStamp(start)}/${icsStamp(end)}&details=${encodeURIComponent(details)}`;
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CareerDNA//Applications//EN', 'BEGIN:VEVENT',
    `UID:careerdna-${app.id}@careerdna`, `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`, `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsText(title)}`, `DESCRIPTION:${icsText(details)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].map(icsFold).join('\r\n');
  const icsHref = `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
  return { google, icsHref, icsName: 'careerdna-interview.ics' };
}

// ---------------------------------------------------------------------------
// Stage scoping. An application is tagged with the stage of the report it was
// made under ('school' | 'university') in item_meta.stage, and the profile only
// shows the ones matching the current report's stage. Older rows without a tag
// show everywhere.

// One place decides whether a report belongs to a school student or a
// university student / graduate. Anything that is not a school report (including
// "other") takes the university flow, because that is the one without UCAS.
export function stageForStatus(status) {
  return String(status || '').toLowerCase() === 'school' ? 'school' : 'university';
}
export function stageOf(app) {
  const tagged = app?.item_meta?.stage;
  if (tagged) return tagged;
  // Rows saved before stages were tagged: infer from what they are. Graduate
  // jobs, internships and schemes are a university student's; apprenticeships
  // a school student's; courses and "other" could be either, so show in both.
  if (['job', 'internship', 'scheme'].includes(app?.kind)) return 'university';
  if (['apprenticeship', 'college'].includes(app?.kind)) return 'school';
  return '';
}
export function forStage(apps = [], stage) {
  return (apps || []).filter((a) => !stageOf(a) || stageOf(a) === stage);
}

// ---------------------------------------------------------------------------
// UCAS (school students applying to university).
//
// A student makes ONE UCAS application per cycle with up to five choices (a
// course at a university). It is sent once, all choices together. Each
// university then replies separately; once every reply is in, the student picks
// a firm and an insurance choice and the rest are declined; results day places
// them. So the lifecycle belongs to the application, and a choice's state only
// makes sense inside the current phase:
//
//   phase 'shortlisting'  choice: 'chosen'
//   phase 'sent'          choice: 'awaiting' | 'interview' | 'offer_conditional' | 'offer_unconditional' | 'unsuccessful'
//   phase 'replied'       choice: 'firm' | 'insurance' | 'declined' | 'unsuccessful'
//   phase 'placed'        choice as above, plus item_meta.ucasPlaced on the winner,
//                         or item_meta.ucasClearing on every choice when placed through Clearing
//   any phase after sent  choice: 'withdrawn' (student pulled out of that choice)
//
// Everything lives in item_meta on the choice rows (no extra table):
//   ucas            the choice state above
//   ucasSentAt      ISO date the application was sent (same value on every choice)
//   ucasAddedAt     the date the choice was shortlisted (restored if "sent" is undone)
//   ucasConditions  offer conditions text, e.g. "ABB"
//   ucasPlaced      true on the choice the student was placed at
//   ucasClearing    { organisation, title } when placed through Clearing
export const UCAS_MAX_CHOICES = 5;

// Cycle dates. UCAS publishes these each year: update here, nowhere else.
// Entry year -> early (Oxbridge, medicine, dentistry, vet), main (equal
// consideration), extraFrom, final, and the reply-by rule: if the last decision
// arrives by `decisionsBy` the student must reply by `replyBy`.
export const UCAS_CYCLES = {
  2027: {
    early: '2026-10-15', main: '2027-01-14', extraFrom: '2027-02-25', final: '2027-06-30',
    replyBy: [{ decisionsBy: '2027-05-14', replyBy: '2027-06-04' }, { decisionsBy: '2027-07-14', replyBy: '2027-07-22' }],
  },
  2028: {
    early: '2027-10-15', main: '2028-01-13', extraFrom: '2028-02-24', final: '2028-06-30',
    replyBy: [{ decisionsBy: '2028-05-12', replyBy: '2028-06-02' }, { decisionsBy: '2028-07-13', replyBy: '2028-07-21' }],
  },
};
function cycleFor(year) {
  const years = Object.keys(UCAS_CYCLES).map(Number).sort();
  const y = years.includes(year) ? year : years[years.length - 1];
  return { year: y, ...UCAS_CYCLES[y] };
}
// The cycle whose final deadline has not yet passed (fallback when the year
// group is unknown).
export function currentUcasCycle(now = new Date()) {
  const years = Object.keys(UCAS_CYCLES).map(Number).sort();
  for (const y of years) { if (now <= new Date(UCAS_CYCLES[y].final)) return cycleFor(y); }
  return cycleFor(years[years.length - 1]);
}
// The cycle a student is applying in, from their year group: a Year 13 applies
// this academic year for entry next September; a Year 12 the year after. The
// academic year turns over in September.
export function ucasCycleFor(schoolYear, now = new Date()) {
  const y = String(schoolYear || '').toLowerCase();
  const academicStart = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  if (y === 'year13') return cycleFor(academicStart + 1);
  if (y === 'year12') return cycleFor(academicStart + 2);
  return currentUcasCycle(now);
}
// Reply-by date once every university has replied, given the date of the last decision.
export function ucasReplyBy(cycle, lastDecisionDate) {
  if (!cycle?.replyBy || !lastDecisionDate) return null;
  const d = String(lastDecisionDate).slice(0, 10);
  const rule = cycle.replyBy.find((r) => d <= r.decisionsBy) || cycle.replyBy[cycle.replyBy.length - 1];
  return rule ? rule.replyBy : null;
}

export const UCAS_CHOICE_STATES = {
  chosen: { label: 'Chosen', tone: 'grey' },
  awaiting: { label: 'Awaiting decision', tone: 'blue' },
  interview: { label: 'Interview / assessment', tone: 'amber' },
  offer_conditional: { label: 'Conditional offer', tone: 'green' },
  offer_unconditional: { label: 'Unconditional offer', tone: 'green' },
  unsuccessful: { label: 'Unsuccessful', tone: 'grey' },
  firm: { label: 'Firm choice', tone: 'green' },
  insurance: { label: 'Insurance choice', tone: 'green' },
  declined: { label: 'Declined', tone: 'grey' },
  withdrawn: { label: 'Withdrawn', tone: 'grey' },
};
// What the student can set a choice to while the application is sent.
export const UCAS_DECISION_OPTIONS = ['awaiting', 'interview', 'offer_conditional', 'offer_unconditional', 'unsuccessful']
  .map((v) => ({ value: v, label: UCAS_CHOICE_STATES[v].label }));
export const UCAS_LABEL = Object.fromEntries(Object.entries(UCAS_CHOICE_STATES).map(([k, v]) => [k, v.label]));
export const UCAS_TONE = Object.fromEntries(Object.entries(UCAS_CHOICE_STATES).map(([k, v]) => [k, v.tone]));
// Phase wording, shared by the list row and the panel header.
export const UCAS_PHASE_TEXT = { shortlisting: 'Building your choices', sent: 'Sent, awaiting decisions', replied: 'Firm and insurance chosen', placed: 'Placed' };
export const UCAS_PHASE_TONE = { shortlisting: 'grey', sent: 'blue', replied: 'green', placed: 'green' };

const DECIDED = new Set(['offer_conditional', 'offer_unconditional', 'unsuccessful']);
const FINAL = new Set(['offer_conditional', 'offer_unconditional', 'unsuccessful', 'firm', 'insurance', 'declined']);
const isOffer = (v) => v === 'offer_conditional' || v === 'offer_unconditional';

// A UCAS choice is a course favourite applied for by a school student. Courses
// added by hand are ordinary applications.
export function isUcasChoice(app, stage) {
  return stage === 'school' && app?.kind === 'course' && app?.item_type !== 'manual';
}
export function ucasOf(app) {
  const v = app?.item_meta?.ucas;
  if (v && UCAS_CHOICE_STATES[v]) return v;
  return app?.item_meta?.ucasSentAt ? 'awaiting' : 'chosen';
}
export const ucasLive = (choices = []) => choices.filter((c) => ucasOf(c) !== 'withdrawn');

// The application's phase, derived from its choices.
export function ucasPhase(choices = []) {
  const live = ucasLive(choices);
  if (!live.length) return 'shortlisting';
  if (choices.some((c) => c.item_meta?.ucasPlaced || c.item_meta?.ucasClearing)) return 'placed';
  if (live.some((c) => ['firm', 'insurance', 'declined'].includes(ucasOf(c)))) return 'replied';
  if (choices.some((c) => c.item_meta?.ucasSentAt)) return 'sent';
  return 'shortlisting';
}
export function ucasSentAt(choices = []) {
  const c = choices.find((x) => x.item_meta?.ucasSentAt);
  return c ? c.item_meta.ucasSentAt : null;
}
export function ucasClearingOf(choices = []) {
  const c = choices.find((x) => x.item_meta?.ucasClearing);
  return c ? c.item_meta.ucasClearing : null;
}
export function ucasDecidedCount(choices = []) {
  return ucasLive(choices).filter((c) => DECIDED.has(ucasOf(c)) || ['firm', 'insurance', 'declined'].includes(ucasOf(c))).length;
}
export function ucasAllDecided(choices = []) {
  const live = ucasLive(choices);
  return live.length > 0 && live.every((c) => FINAL.has(ucasOf(c)));
}
export function ucasOffers(choices = []) {
  return ucasLive(choices).filter((c) => isOffer(ucasOf(c)) || ['firm', 'insurance'].includes(ucasOf(c)));
}
// Date of the most recent university decision, from the choice histories.
export function ucasLastDecisionAt(choices = []) {
  let last = null;
  for (const c of ucasLive(choices)) {
    for (const h of (Array.isArray(c.history) ? c.history : [])) {
      if (h && DECIDED.has(h.ucas) && (!last || h.at > last)) last = h.at;
    }
  }
  return last;
}

// Choices with the 15 October deadline: Oxford, Cambridge, medicine, dentistry,
// veterinary. One rule, used by the warnings and the deadline line.
export function isEarlyDeadlineChoice(c) {
  const org = String(c?.organisation || '').toLowerCase();
  const oxbridge = /oxford|cambridge/.test(org) && !/brookes|anglia/.test(org);
  const clinical = /\b(medicine|dentistry|veterinary)\b/i.test(`${c?.title || ''} ${c?.item_meta?.subject || ''}`);
  return oxbridge || clinical;
}

// UCAS rules, checked against the current choices. Returns warning strings.
export function ucasRuleWarnings(choices = []) {
  const out = [];
  const live = ucasLive(choices);
  const n = live.length;
  if (n > UCAS_MAX_CHOICES) out.push(`UCAS allows five choices. You have ${n}, so ${n - UCAS_MAX_CHOICES === 1 ? 'one needs' : `${n - UCAS_MAX_CHOICES} need`} to come out before you send.`);
  const org = (c) => String(c.organisation || '').toLowerCase();
  const oxbridge = live.filter((c) => /oxford|cambridge/.test(org(c)) && !/brookes|anglia/.test(org(c)));
  if (new Set(oxbridge.map((c) => (/cambridge/.test(org(c)) ? 'cam' : 'ox'))).size > 1) out.push('You can apply to Oxford or Cambridge, not both.');
  const clinical = live.filter((c) => /\b(medicine|dentistry|veterinary)\b/i.test(`${c.title} ${c.item_meta?.subject || ''}`));
  if (clinical.length > 4) out.push('Medicine, dentistry and veterinary science are limited to four choices; the fifth must be a different subject.');
  const subjects = new Set(live.map((c) => String(c.item_meta?.subject || '').toLowerCase()).filter(Boolean));
  if (subjects.size > 2) out.push('Your choices cover several different subjects. One personal statement covers all five, so closely related subjects read better to admissions tutors.');
  return out;
}

async function updateMeta(id, patch, current, extra = {}) {
  const user = await currentUser();
  const meta = (current?.item_meta && typeof current.item_meta === 'object') ? current.item_meta : {};
  const { data, error } = await supabase
    .from('applications')
    .update({ item_meta: { ...meta, ...patch }, ...extra })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
const STATUS_FOR = { chosen: 'applied', awaiting: 'applied', interview: 'interview', offer_conditional: 'offer', offer_unconditional: 'offer', unsuccessful: 'unsuccessful', firm: 'accepted', insurance: 'accepted', declined: 'declined', withdrawn: 'withdrawn' };
const withHistory = (c, entry) => [...(Array.isArray(c?.history) ? c.history : []), { ...entry, at: today() }];

// Apply one change to several choices at once. All rows are written in
// parallel; if any write fails, the ones that succeeded are put back so the
// application never ends up half-updated. `plan(choice)` returns
// { patch, extra } or null to leave that choice alone.
async function updateChoices(choices, plan) {
  const jobs = choices.map((c) => ({ c, p: plan(c) }));
  const results = await Promise.allSettled(jobs.map(({ c, p }) => (p ? updateMeta(c.id, p.patch, c, p.extra || {}) : Promise.resolve(c))));
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) {
    await Promise.allSettled(jobs.map(({ c, p }, i) => {
      if (!p || results[i].status !== 'fulfilled') return Promise.resolve();
      const back = { status: c.status, applied_at: c.applied_at, history: c.history };
      return supabase.from('applications').update({ item_meta: c.item_meta, ...back }).eq('id', c.id);
    }));
    throw failed[0].reason || new Error('Could not update your UCAS application.');
  }
  return results.map((r) => r.value);
}

// Mark the whole application as sent: every choice becomes 'awaiting'.
export async function ucasMarkSent(choices = [], sentAt = today()) {
  return updateChoices(choices, (c) => ({
    patch: { ucas: 'awaiting', ucasSentAt: sentAt, ucasAddedAt: c.item_meta?.ucasAddedAt || c.applied_at || null },
    extra: { status: 'applied', applied_at: sentAt, history: withHistory(c, { status: 'applied', ucas: 'awaiting', event: 'sent' }) },
  }));
}
// Undo "sent" (sent by mistake): back to shortlisting, decisions cleared.
export async function ucasUnsend(choices = []) {
  return updateChoices(choices, (c) => ({
    patch: { ucas: 'chosen', ucasSentAt: null, ucasConditions: null, ucasPlaced: null, ucasClearing: null },
    extra: { status: 'applied', applied_at: c.item_meta?.ucasAddedAt || c.applied_at, history: withHistory(c, { status: 'applied', ucas: 'chosen', event: 'unsent' }) },
  }));
}
// A university's reply on one choice (phase 'sent').
export async function ucasSetDecision(choice, value, conditions) {
  const patch = { ucas: value, ucasConditions: value === 'offer_conditional' ? String(conditions || '').trim() : null };
  const status = STATUS_FOR[value] || 'applied';
  return updateMeta(choice.id, patch, choice, { status, history: withHistory(choice, { status, ucas: value }) });
}
// The student pulls out of one choice after sending. The row stays so the
// application's history is intact.
export async function ucasWithdraw(choice) {
  return updateMeta(choice.id, { ucas: 'withdrawn', ucasPlaced: null }, choice, { status: 'withdrawn', history: withHistory(choice, { status: 'withdrawn', ucas: 'withdrawn' }) });
}
// Withdrawn by mistake: back to awaiting a decision.
export async function ucasUnwithdraw(choice) {
  return updateMeta(choice.id, { ucas: 'awaiting' }, choice, { status: 'applied', history: withHistory(choice, { status: 'applied', ucas: 'awaiting', event: 'unwithdrawn' }) });
}
// Reply: firm + optional insurance; every other offer is declined.
export async function ucasReply(choices = [], firmId, insuranceId = null) {
  return updateChoices(choices, (c) => {
    const v = ucasOf(c);
    let next = v;
    if (c.id === firmId) next = 'firm';
    else if (insuranceId && c.id === insuranceId) next = 'insurance';
    else if (isOffer(v) || v === 'firm' || v === 'insurance') next = 'declined';
    if (next === v) return null;
    return { patch: { ucas: next, ucasPrev: c.item_meta?.ucasPrev || v }, extra: { status: STATUS_FOR[next], history: withHistory(c, { status: STATUS_FOR[next], ucas: next }) } };
  });
}
// Results day: placed at one of the choices (firm or insurance), or through
// Clearing at a course that was not one of the choices.
export async function ucasPlace(choices = [], placedId, clearing = null) {
  return updateChoices(choices, (c) => {
    const placed = Boolean(placedId) && c.id === placedId;
    const wasPlaced = Boolean(c.item_meta?.ucasPlaced);
    const hadClearing = Boolean(c.item_meta?.ucasClearing);
    if (wasPlaced === placed && !hadClearing && !clearing) return null;
    return {
      patch: { ucasPlaced: placed, ucasClearing: clearing || null },
      extra: placed ? { status: 'accepted', history: withHistory(c, { status: 'accepted', ucas: ucasOf(c), event: 'placed' }) } : {},
    };
  });
}
// Back from firm/insurance to the offers as they were, so they can be chosen again.
export async function ucasUnreply(choices = []) {
  return updateChoices(choices, (c) => {
    const v = ucasOf(c);
    if (!['firm', 'insurance', 'declined'].includes(v)) return null;
    const back = c.item_meta?.ucasPrev && isOffer(c.item_meta.ucasPrev)
      ? c.item_meta.ucasPrev
      : (c.item_meta?.ucasConditions ? 'offer_conditional' : 'offer_unconditional');
    return { patch: { ucas: back, ucasPrev: null, ucasPlaced: null, ucasClearing: null }, extra: { status: 'offer', history: withHistory(c, { status: 'offer', ucas: back, event: 'unreplied' }) } };
  });
}

// Choice order (1 = first): by the date each was shortlisted.
export function sortUcasChoices(choices = []) {
  return [...choices].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
}

// ---------------------------------------------------------------------------
// Counting. A UCAS application is one application however many choices it
// has, and only counts once it has been sent; choices still being shortlisted
// are not applications yet.
export function ucasChoicesIn(apps = [], stage) {
  return (apps || []).filter((a) => isUcasChoice(a, stage));
}
export function applicationCount(apps = [], stage) {
  const list = apps || [];
  const others = list.filter((a) => !isUcasChoice(a, stage)).length;
  const choices = ucasChoicesIn(list, stage);
  return others + (choices.length && ucasPhase(choices) !== 'shortlisting' ? 1 : 0);
}
// Number of rows shown in the list (UCAS choices collapse to one row).
export function applicationRowCount(apps = [], stage) {
  const list = apps || [];
  return list.filter((a) => !isUcasChoice(a, stage)).length + (ucasChoicesIn(list, stage).length ? 1 : 0);
}
