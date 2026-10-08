import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BrainCircuit, Send } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountNavbar from '../Components/Common/AccountNavbar';
import { useAuth } from '../context/AuthContext';
import { resumableProgress } from '../Hooks/useProgress';
import { takeProfileStale } from '../utils/profileCache';
import { supabase } from '../utils/supabaseClient';
import {
  deleteAssessmentRun,
  getAssessmentRunCount,
  getCurrentAssessmentRun,
  setCurrentRunId,
  listAssessmentRuns,
  getDistinctSurveyCount,
  rerunAssessmentWithOutputParameters,
} from '../utils/assessmentRuns';
import { getMyProfile, updateMyProfileDetails } from '../utils/profile';
import { apiFetch, ApiError } from '../utils/apiFetch';
import IntroQuestions from '../Components/Survey/IntroQuestions';
import PricingModal from '../Components/Common/PricingModal';
import SatisfactionCard from '../Components/Common/SatisfactionCard';
import { getSatisfactionPrompt, dismissSatisfactionPulse } from '../utils/satisfaction';
import { normaliseFavouriteType, getFavouritesByCategory } from '../utils/favourites';
import { FAVOURITES_CHANGED_EVENT } from '../utils/savedItems';
import AcademicProfileCard from '../Components/Common/AcademicProfileCard';
import FavouritesCard from '../Components/Common/FavouritesCard';
import ApplicationsCard from '../Components/Common/ApplicationsCard';
import { listApplications, applyFromFavourite, appliedKeySet, forStage, stageForStatus, applicationCount, applicationRowCount } from '../utils/applications';
import { getMyAcademicProfile, hasAcademicData } from '../utils/academicProfile';
import { cancelScheduledDowngrade, setCancelAtPeriodEnd } from '../utils/stripeCheckout';
import './ProfilePage.css';
import { ageFromDOB, ukSchoolYearGroup } from '../utils/educationProgression';
import AdvisorDrawer from '../Components/Advisor/AdvisorDrawer';
import InlineError from '../Components/Common/InlineError';
import { friendlyError } from '../utils/friendlyError';
import { setAdvisorContext, openAdvisor } from '../utils/advisorPanel';
import PlanWelcomeModal from '../Components/Common/PlanWelcomeModal';
import PlanBadge from '../Components/Common/PlanBadge';

const defaultIntroResponses = {
  name: '',
  country: '',
  age: '',
  status: '',
  institution: '',
  schoolSubjects: [],
  uniSubject: '',
  schoolScope: '',
  uniNeed: '',
  planUniversity: '',
  currentActivity: '',
};

function buildInitialIntro(run) {
  const intro = run?.intro_answers_json || {};
  const merged = {
    ...defaultIntroResponses,
    ...intro,
    schoolSubjects: Array.isArray(intro.schoolSubjects) ? intro.schoolSubjects : [],
  };

  // Older reports were saved before the "What year group are you in?" question
  // existed, so they have no schoolYear. That leaves the re-run form's required
  // field empty and disables the button. Derive a sensible year group from the
  // saved date of birth so legacy runs can be re-run without the user having to
  // guess. Any value here is still editable in the form.
  const isSchool = merged.status === 'school' || !merged.status;
  if (isSchool && !merged.schoolYear && intro.dateOfBirth) {
    const yr = ukSchoolYearGroup(intro.dateOfBirth);
    if (yr != null) {
      const clamped = Math.min(13, Math.max(10, yr));
      merged.schoolYear = `year${clamped}`;
    }
  }

  return merged;
}

function statusLabel(value) {
  if (value === 'school') return 'At school';
  if (value === 'undergraduate') return 'At university';
  if (value === 'postgraduate') return 'Postgraduate student';
  if (value === 'other') return 'Other';
  return '—';
}

// One-line description of who the student is, from the current report:
// "At school, Year 12" or "Undergraduate, Year 2, Economics".
function studentStatusLine(run) {
  const intro = run?.intro_answers_json || {};
  const status = String(intro.status || '').toLowerCase();
  const parts = [];
  if (status === 'school') {
    parts.push('At school');
    const yr = String(intro.schoolYear || '').match(/(\d+)/);
    if (yr) parts.push(`Year ${yr[1]}`);
  } else if (status === 'undergraduate' || status === 'postgraduate') {
    parts.push(status === 'undergraduate' ? 'Undergraduate' : 'Postgraduate');
    if (intro.courseYear) parts.push(`Year ${intro.courseYear}`);
    if (intro.uniSubject) parts.push(String(intro.uniSubject));
  } else if (status === 'other') {
    parts.push('Exploring options');
  }
  return parts.join(', ');
}

function nextStepLabel(run) {
  const intro = run?.intro_answers_json || {};
  const status = intro.status;

  const schoolMap = {
    choose_gcse: 'Choose GCSE options',
    study_gcse: 'Work towards GCSEs',
    choose_alevels: 'Decide what to do after GCSEs',
    study_alevels: 'Study A-levels, T-levels or college',
    decide_route: 'Decide between university, apprenticeship or work',
    apply_uni: 'Prepare applications',
    decide_uni: 'Choose between offers',
    apprenticeship: 'Find an apprenticeship or job',
    not_sure: 'Not sure yet',
  };

  const uniMap = {
    explore_pathways: 'Explore career pathways and roles',
    apply_postgrad: 'Explore postgraduate study',
    apply_further_postgrad: 'Explore further postgraduate study',
    explore_internships: 'Explore internships or placements',
    explore_full_time: 'Explore graduate roles',
    explore_specialisms: 'Explore other specialisms or subjects',
    not_sure: 'Not sure yet',
  };

  if (status === 'school' || status === 'other') return schoolMap[intro.schoolScope] || '—';
  if (status === 'undergraduate' || status === 'postgraduate') return uniMap[intro.uniNeed] || '—';
  return '—';
}

function subjectLabel(run) {
  const intro = run?.intro_answers_json || {};
  const status = intro.status;

  if (status === 'school') {
    const vals = Array.isArray(intro.schoolSubjects) ? intro.schoolSubjects : [];
    return vals.length ? vals.join(', ') : '—';
  }

  if (status === 'undergraduate' || status === 'postgraduate') {
    return intro.uniSubject || '—';
  }

  return '—';
}

// Actual age from date of birth, falling back to the legacy age band.
function ageValue(run) {
  const intro = run?.intro_answers_json || {};
  const yrs = ageFromDOB(intro.dateOfBirth);
  if (yrs !== null && !Number.isNaN(yrs)) return String(yrs);
  return intro.age || '—';
}

function compactDate(value) {
  try {
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function formatPlanName(profile = {}) {
  const plan = String(profile?.plan || 'free').toLowerCase();

  if (['premium_school', 'premium_university'].includes(plan)) return 'Unlimited access';
  if (plan === 'dev') return 'Developer access';
  if (plan === 'explore') return 'CareerDNA Explorer';
  if (plan === 'premium') return 'CareerDNA Premium';
  if (plan === 'starter') return 'CareerDNA Starter';
  return 'Free profile';
}


function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getUsageValues(used, limit, extra = 0, unlimited = false) {
  if (unlimited) return { unlimited: true, used: 0, total: 0, remaining: null };
  const safeUsed = toNumber(used);
  const safeTotal = toNumber(limit) + toNumber(extra);
  return { unlimited: false, used: safeUsed, total: safeTotal, remaining: Math.max(0, safeTotal - safeUsed) };
}

function isUnlimitedPlan(profile = {}) {
  const plan = String(profile?.plan || '').toLowerCase();
  // "dev" is NOT unlimited — the developer code grants a fixed 200 reports / 200
  // advisor questions via report_limit / advisor_questions_limit (must match the
  // backend's isUnlimitedPlan so the numbers display and are enforced).
  return ['premium_school', 'premium_university'].includes(plan);
}

function getReportUsage(profile = {}) {
  return getUsageValues(profile?.reports_used, profile?.report_limit, 0, isUnlimitedPlan(profile));
}

function getAdvisorUsage(profile = {}) {
  return getUsageValues(
    profile?.advisor_questions_used,
    profile?.advisor_questions_limit,
    profile?.advisor_extra_questions,
    isUnlimitedPlan(profile)
  );
}

function getAccountEntitlementNote(profile = {}, reportUsage, advisorUsage) {
  const plan = String(profile?.plan || 'free').toLowerCase();

  if (plan === 'dev') return 'Developer access active';

  // Access codes/coupons are now credit events, not active plan identities.
  // Do not show an “Access code active” banner for paid subscribers.
  if (['explore', 'premium', 'premium_school', 'premium_university'].includes(plan)) {
    return '';
  }

  return '';
}


function formatRenewalDate(profile = {}) {
  const raw = profile?.subscription_current_period_end || profile?.advisor_period_end || profile?.report_period_end;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPendingPlanDate(profile = {}) {
  const raw = profile?.pending_plan_change_at || profile?.subscription_current_period_end;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPlanNameFromKey(plan = '') {
  const key = String(plan || '').toLowerCase();
  if (key === 'explore') return 'CareerDNA Explorer';
  if (key === 'premium') return 'CareerDNA Premium';
  return 'your selected plan';
}

const AccountMiniIcon = ({ type }) => {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  if (type === 'mail') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  if (type === 'calendar') return <svg {...common}><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>;
  if (type === 'shield') return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (type === 'sparkles') return <svg {...common}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/><path d="M5 16l.7 1.6L7.3 18l-1.6.7L5 20.3l-.7-1.6L2.7 18l1.6-.4L5 16z"/></svg>;
  if (type === 'crown') return <svg {...common}><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z"/><path d="M5 19h14"/></svg>;
  if (type === 'file') return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></svg>;
  if (type === 'chat') return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z"/></svg>;
  if (type === 'check') return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>;
  if (type === 'chevron') return <svg {...common}><path d="m9 18 6-6-6-6"/></svg>;
  if (type === 'help') return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.3-3 4"/><path d="M12 17h.01"/></svg>;
  return <svg {...common}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
};

/* =============================================
   Inline Button Styles - Pill Shaped (999px)
   ============================================= */

const btnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontWeight: 600,
  cursor: 'pointer',
  border: 'none',
  transition: 'transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
};

const btnPrimary = {
  ...btnBase,
  padding: '7px 16px',
  minHeight: '34px',
  borderRadius: '999px',
  fontSize: '0.8rem',
  background: '#2f6fed',
  color: '#fff',
  boxShadow: '0 2px 8px rgba(47, 111, 237, 0.15)',
};

const btnPrimarySm = {
  ...btnBase,
  padding: '4px 12px',
  minHeight: '26px',
  borderRadius: '999px',
  fontSize: '0.72rem',
  background: '#2f6fed',
  color: '#fff',
  boxShadow: '0 2px 8px rgba(47, 111, 237, 0.15)',
};

const btnAccent = {
  ...btnBase,
  padding: '5px 14px',
  minHeight: '30px',
  borderRadius: '999px',
  fontSize: '0.75rem',
  background: '#eef5ff',
  color: '#2f6fed',
};

const btnOutlineSm = {
  ...btnBase,
  padding: '4px 12px',
  minHeight: '26px',
  borderRadius: '999px',
  fontSize: '0.72rem',
  background: '#fff',
  color: '#54657b',
  border: '1px solid #d1d5db',
};

const btnDanger = {
  ...btnBase,
  padding: '0',
  minHeight: 'auto',
  borderRadius: '0',
  fontSize: '0.82rem',
  background: 'transparent',
  color: '#64748b',
  border: 'none',
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  boxShadow: 'none',
};

const btnDangerSolid = {
  ...btnBase,
  padding: '7px 16px',
  minHeight: '34px',
  borderRadius: '999px',
  fontSize: '0.8rem',
  background: '#dc2626',
  color: '#fff',
  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.18)',
};

const btnGhost = {
  ...btnBase,
  padding: '7px 16px',
  minHeight: '34px',
  borderRadius: '999px',
  fontSize: '0.8rem',
  background: '#fff',
  color: '#54657b',
  border: '1px solid #e5e7eb',
};

const btnDelete = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '28px',
  height: '28px',
  border: 'none',
  background: 'transparent',
  color: '#d1d5db',
  borderRadius: '999px',
  cursor: 'pointer',
  transition: 'background 0.15s, color 0.15s',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
};

const btnModalClose = {
  width: '32px',
  height: '32px',
  border: 'none',
  background: '#f3f4f6',
  color: '#6b7788',
  fontSize: '1.2rem',
  borderRadius: '999px',
  cursor: 'pointer',
  transition: 'background 0.15s',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1px solid #e5e7eb',
  borderRadius: '999px',
  padding: '10px 16px',
  fontSize: '0.9rem',
  color: '#1f2a37',
  background: '#fff',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
};

/* Settings gear icon */
const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

/* Play icon */
const PlayIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);

/* Trash icon */
const RerunIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" />
  </svg>
);
const PinIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 17v5"/>
    <path d="M9 3h6l-1 7 3 3H7l3-3z"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

/* Overflow (three dots) icon */
const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.7"/>
    <circle cx="12" cy="12" r="1.7"/>
    <circle cx="19" cy="12" r="1.7"/>
  </svg>
);

// In-memory cache of the last-loaded profile bundle, so returning to the profile
// shows your saved runs instantly instead of "Loading saved runs…" every time.
// It still re-fetches in the background to stay current (stale-while-revalidate).
let profileBundleCache = null;

function takeProfileCache() {
  if (takeProfileStale()) profileBundleCache = null;
  return profileBundleCache;
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [initialCache] = useState(() => takeProfileCache());
  const [profile, setProfile] = useState(() => initialCache?.profileData || null);
  const [runs, setRuns] = useState(() => initialCache?.runData || []);
  const [currentRun, setCurrentRun] = useState(() => initialCache?.currentRun || null);
  const [settingCurrentId, setSettingCurrentId] = useState(null);
  const [totalRuns, setTotalRuns] = useState(() => Number(initialCache?.runCount) || 0);
  const [totalSurveys, setTotalSurveys] = useState(() => Number(initialCache?.surveyCount) || 0);
  const [loadingRuns, setLoadingRuns] = useState(() => !initialCache);
  // Which item types the user has reacted to (liked/disliked) on the latest run.
  // Drives the journey timeline: a step counts as done only once the user has
  // actually interacted with that section.
  const [engagedTypes, setEngagedTypes] = useState(() => new Set());
  // "Loaded" flags for the overview: we only render the stats/journey/cards once
  // ALL their data is in, so the numbers never flash a wrong partial value.
  // Which run each dataset reflects, so the overview only shows once the CURRENT
  // run's data is in (not an empty result from before the user/run was ready).
  const [engagedForRun, setEngagedForRun] = useState(null);
  const [favForRun, setFavForRun] = useState(null);
  const [academicLoaded, setAcademicLoaded] = useState(false);
  const [academicProfileData, setAcademicProfileData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  // What "Try again" should do for the current error (null: no retry offered).
  const [errorRetry, setErrorRetry] = useState(null);
  const failWith = (err, context, retry = null) => {
    setErrorMsg(friendlyError(err, context).message);
    setErrorRetry(retry ? () => retry : null);
  };
  // Phone flag — used to shorten the run action label so the buttons fit on one
  // line beside the run number.
  const [isPhone, setIsPhone] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 600
  );

  // Load which sections the user has interacted with (liked/disliked) on their
  // latest run, so the journey timeline can mark those steps complete.
  useEffect(() => {
    const runId = currentRun?.id;
    const uid = user?.id;
    if (!uid) return undefined; // wait for the user before deciding
    if (!runId) {
      // User is known and has no runs: nothing engaged, ready.
      setEngagedTypes(new Set());
      setEngagedForRun('none');
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('result_feedback')
          .select('item_type, item_id, item_title, reaction')
          .eq('user_id', uid)
          .eq('assessment_run_id', runId)
          .eq('feedback_scope', 'item_reaction');
        if (error) throw error;
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : [];
        // Canonical types: a pathway family the university flow stored as
        // 'role' is a pathway for the journey steps.
        const typeOf = (r) => normaliseFavouriteType(String(r?.item_type || '').trim().toLowerCase(), r?.item_id, r?.item_title);
        const set = new Set(rows.map(typeOf).filter(Boolean));
        // Types the student has actually SAVED (liked), for steps whose point is
        // a shortlist rather than a judgement either way.
        rows.forEach((r) => {
          if (String(r?.reaction || '').toLowerCase() === 'like') {
            const t = typeOf(r);
            if (t) set.add(`liked:${t}`);
          }
        });
        setEngagedTypes(set);
      } catch (_) {
        if (!cancelled) setEngagedTypes(new Set());
      } finally {
        if (!cancelled) setEngagedForRun(runId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentRun?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recurring "How useful is CareerDNA?" prompt: record this visit and work out
  // whether a satisfaction pulse is due for this visit number (schedule lives in
  // utils/satisfaction). Runs once per profile mount, when a run + user exist.
  const [satWave, setSatWave] = useState(null);
  // Full favourites data, loaded once at the profile level and passed into the
  // favourites card so it renders together with everything else (no late pop-in).
  const [favGroups, setFavGroups] = useState(null);
  const satPromptRef = useRef(false);

  useEffect(() => {
    const runId = currentRun?.id;
    if (!user?.id) return undefined; // wait for the user
    if (!runId) { setFavGroups([]); setFavForRun('none'); return undefined; }
    let cancelled = false;
    getFavouritesByCategory(runId)
      .then((groups) => { if (!cancelled) { setFavGroups(groups || []); setFavForRun(runId); } })
      .catch(() => { if (!cancelled) { setFavGroups([]); setFavForRun(runId); } });
    return () => { cancelled = true; };
  }, [currentRun?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Saves made inside a popup (a live ad saved from an opened role card, say)
  // announce themselves; reload so the favourites card and count stay current.
  useEffect(() => {
    const runId = currentRun?.id;
    if (!runId || !user?.id) return undefined;
    let timer = null;
    const onChanged = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        getFavouritesByCategory(runId).then((groups) => setFavGroups(groups || [])).catch(() => {});
      }, 300);
    };
    window.addEventListener(FAVOURITES_CHANGED_EVENT, onChanged);
    return () => { clearTimeout(timer); window.removeEventListener(FAVOURITES_CHANGED_EVENT, onChanged); };
  }, [currentRun?.id, user?.id]);
  const favCount = favGroups ? favGroups.reduce((a, g) => a + g.items.length, 0) : null;
  // Applications tracker (per student, not per run). Loaded once with the profile.
  const [applications, setApplications] = useState(null);
  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    listApplications()
      .then((rows) => { if (!cancelled) setApplications(rows || []); })
      .catch(() => { if (!cancelled) setApplications([]); });
    return () => { cancelled = true; };
  }, [user?.id]);
  // Applications follow the stage of the current report: a school report shows
  // UCAS choices, apprenticeship and college applications; a university report
  // shows graduate roles. The other set is kept and shows when that report is current.
  const applicationStage = stageForStatus((currentRun || runs?.[0])?.intro_answers_json?.status);
  const stageApplications = useMemo(() => (applications == null ? null : forStage(applications, applicationStage)), [applications, applicationStage]);
  // "Already applied" is checked against every application the student has,
  // whichever stage it was made under, so the same ad is never logged twice.
  const appliedKeys = useMemo(() => appliedKeySet(applications || []), [applications]);
  // One UCAS application counts once, and only after it has been sent.
  const applicationTotal = useMemo(() => (stageApplications == null ? null : applicationCount(stageApplications, applicationStage)), [stageApplications, applicationStage]);
  // The tile and the card header count what is tracked (a UCAS application is
  // one item even while it is being built); the journey's Apply step is stricter.
  const applicationTracked = useMemo(() => (stageApplications == null ? null : applicationRowCount(stageApplications, applicationStage)), [stageApplications, applicationStage]);
  const handleApplyFromFavourite = async (item) => {
    const created = await applyFromFavourite(item, { runId: currentRun?.id || null, stage: applicationStage });
    setApplications((prev) => [created, ...(prev || []).filter((a) => a.id !== created.id)]);
  };
  useEffect(() => {
    const runId = currentRun?.id;
    const uid = user?.id;
    if (!runId || !uid || satPromptRef.current) return undefined;
    satPromptRef.current = true;
    let cancelled = false;
    (async () => {
      try {
        const { dueVisit } = await getSatisfactionPrompt(uid, runId);
        if (!cancelled) setSatWave(dueVisit);
      } catch (_) {
        if (!cancelled) setSatWave(null);
      }
    })();
    return () => { cancelled = true; };
  }, [currentRun?.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [editingRun, setEditingRun] = useState(null);
  const [editIntroResponses, setEditIntroResponses] = useState(defaultIntroResponses);
  const [rerunning, setRerunning] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState(null);
  const [deleteConfirmRunId, setDeleteConfirmRunId] = useState(null);
  // Which run's "..." action menu (holds Delete) is currently open.
  const [openRunMenuId, setOpenRunMenuId] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' });
  const [profileNotice, setProfileNotice] = useState('');
  // Welcome dialog after a successful checkout: { kind: 'explore' | 'premium' | 'pack' }
  const [planWelcome, setPlanWelcome] = useState(null);
  const [runMenuUp, setRunMenuUp] = useState(false);
  const checkoutReturnStartedRef = useRef(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountFinalConfirm, setDeleteAccountFinalConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [cancelDowngradeOpen, setCancelDowngradeOpen] = useState(false);
  const [cancellingDowngrade, setCancellingDowngrade] = useState(false);
  const [retakeConfirmOpen, setRetakeConfirmOpen] = useState(false);
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [satDismissed, setSatDismissed] = useState(false);
  const [academicHasData, setAcademicHasData] = useState(false);
  const [gradesOpenSignal, setGradesOpenSignal] = useState(0);
  const [appsOpenSignal, setAppsOpenSignal] = useState(0);

  // Load whether the student has entered grades (drives the "Enter your grades"
  // roadmap step). Updated directly from the grades popup's onSaved callback.
  useEffect(() => {
    if (!user?.id) return undefined; // wait for the user
    let cancelled = false;
    getMyAcademicProfile()
      .then((ap) => { if (!cancelled) { setAcademicHasData(hasAcademicData(ap)); setAcademicProfileData(ap || null); } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAcademicLoaded(true); });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Click-to-toggle info popover for locked account fields (date of birth, email).
  const [openLockedField, setOpenLockedField] = useState('');

  // Lock background page scroll while any modal is open, so there is only the
  // modal's own scrollbar (not a second one on the page behind it).
  useEffect(() => {
    const anyModalOpen = Boolean(
      editingRun || editingProfile || deleteAccountOpen || retakeConfirmOpen ||
      deleteConfirmRunId || pricingModalOpen || cancelDowngradeOpen
    );
    if (!anyModalOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [editingRun, editingProfile, deleteAccountOpen, retakeConfirmOpen, deleteConfirmRunId, pricingModalOpen, cancelDowngradeOpen]);

  // Close the run "..." menu on any outside click or Escape.
  useEffect(() => {
    if (!openRunMenuId) return undefined;
    const close = () => setOpenRunMenuId(null);
    const onKey = (e) => { if (e.key === 'Escape') setOpenRunMenuId(null); };
    document.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [openRunMenuId]);

  const billingReturnSyncStartedRef = useRef(false);

  function isDeletedUserSessionError(err) {
    const message = String(err?.message || err || '').toLowerCase();
    return (
      message.includes('user from sub claim in jwt does not exist') ||
      message.includes('invalid jwt') ||
      message.includes('jwt expired') ||
      message.includes('invalid or expired session') ||
      message.includes('auth session missing')
    );
  }

  async function handleInvalidSession(err) {
    if (!isDeletedUserSessionError(err)) return false;

    try {
      await supabase.auth.signOut();
    } catch (_) {
      // Ignore. We still redirect the user out of the protected profile area.
    }

    navigate('/login', {
      replace: true,
      state: { message: 'Your session has expired. Please log in again.' },
    });

    return true;
  }


  // Supabase's auth library uses a browser lock to serialise token refreshes.
  // When two requests race for it (React dev double-mount, multiple tabs, slow
  // network) the losing one throws "...was released because another request
  // stole it". It's harmless — the winning request still loads the data — so we
  // never surface it as an error, and we retry the bundle once to be safe.
  function isAuthLockNoise(err) {
    const msg = String(err?.message || err || '').toLowerCase();
    return (
      msg.includes('another request stole it') ||
      msg.includes('was released because') ||
      msg.includes('lock broken') ||          // Web Locks: "Lock broken by another request with the 'steal' option."
      msg.includes("'steal'") ||
      msg.includes('steal option') ||
      msg.includes('navigatorlockacquiretimeout') ||
      (msg.includes('lock') && msg.includes('auth-token'))
    );
  }

  // Transient database hiccups (e.g. a query hitting Postgres statement_timeout
  // under load). Worth one retry, and never shown to the user as raw SQL text.
  function isTransientDbError(err) {
    const msg = String(err?.message || err || '').toLowerCase();
    return (
      msg.includes('statement timeout') ||
      msg.includes('canceling statement') ||
      msg.includes('57014') ||
      msg.includes('timeout') ||
      msg.includes('fetch failed') ||
      msg.includes('failed to fetch')
    );
  }

  async function fetchProfileBundle() {
    // The run list only needs light fields (date + status). We fetch the heavy
    // results_json for the LATEST run alone (one row), then attach it, so the
    // page no longer downloads megabytes of report JSON/markdown for 20 runs.
    // The page follows one "current" report: the run pinned on the profile
    // (profiles.current_run_id) or, when nothing is pinned, the newest run.
    const profileData = await getMyProfile();
    const [runData, runCount, currentFull, surveyCount] = await Promise.all([
      listAssessmentRuns(20, 'id, created_at, intro_answers_json, output_version'),
      getAssessmentRunCount(),
      getCurrentAssessmentRun(profileData?.current_run_id || null),
      getDistinctSurveyCount().catch((e) => { console.warn('Assessment count failed:', e?.message || e); return null; }),
    ]);
    return { profileData, runData, runCount, surveyCount, currentRun: currentFull || null };
  }

  async function loadPageData() {
    setLoadingRuns(true);
    setErrorMsg('');

    try {
      let bundle;
      try {
        bundle = await fetchProfileBundle();
      } catch (err) {
        // Retry once on a transient auth-lock or database timeout.
        if (!isAuthLockNoise(err) && !isTransientDbError(err)) throw err;
        await new Promise((resolve) => setTimeout(resolve, 600));
        bundle = await fetchProfileBundle();
      }

      setProfile(bundle.profileData || null);
      setRuns(bundle.runData || []);
      setCurrentRun(bundle.currentRun || null);
      setTotalRuns(Number(bundle.runCount) || 0);
      // If the distinct count could not be computed, fall back to the run count rather than showing 0.
      setTotalSurveys(bundle.surveyCount == null ? (Number(bundle.runCount) || 0) : Number(bundle.surveyCount) || 0);
    } catch (err) {
      if (await handleInvalidSession(err)) return;
      if (isAuthLockNoise(err)) return; // transient — a concurrent request handled it
      setErrorMsg(
        isTransientDbError(err)
          ? 'We had trouble loading your profile just then. Please try again in a moment.'
          : friendlyError(err, 'load your profile').message
      );
      setErrorRetry(() => loadPageData);
    } finally {
      setLoadingRuns(false);
    }
  }


  async function syncStripeSubscriptionFromBackend() {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.access_token) throw new Error('You need to be logged in to refresh your subscription.');

    let payload = null;
    try {
      payload = await apiFetch('/api/account/sync-stripe-subscription', { method: 'POST', auth: 'required' });
    } catch (err) {
      if (err instanceof ApiError && err.status) {
        throw new Error(err.data?.message || err.data?.error || 'Failed to refresh subscription status.');
      }
      throw err;
    }

    if (payload?.profile) {
      setProfile(payload.profile);
      return payload.profile;
    }

    const freshProfile = await getMyProfile();
    setProfile(freshProfile || null);
    return freshProfile || null;
  }

  function setSubscriptionNoticeFromProfile(nextProfile, fallback = 'Your billing details have been updated.') {
    const nextPlanName = formatPlanName(nextProfile);
    const nextDate = formatRenewalDate(nextProfile);
    const pendingPlanName = formatPlanNameFromKey(nextProfile?.pending_plan_change);
    const pendingDate = formatPendingPlanDate(nextProfile);

    if (nextProfile?.cancel_at_period_end && nextDate) {
      setProfileNotice(`Your subscription will end on ${nextDate}. You will keep ${nextPlanName} access until then.`);
      return;
    }

    if (nextProfile?.pending_plan_change && pendingDate) {
      setProfileNotice(`Your plan will change to ${pendingPlanName} on ${pendingDate}. You will keep ${nextPlanName} access until then.`);
      return;
    }

    if (String(nextProfile?.plan || '').toLowerCase() === 'free') {
      setProfileNotice('Your subscription has ended and your account is now on the free plan.');
      return;
    }

    setProfileNotice(fallback);
  }


  // Keep the module cache in step with what's on screen, so the next visit (and
  // state after deletes/re-runs) shows the correct runs instantly.
  useEffect(() => {
    profileBundleCache = { profileData: profile, runData: runs, runCount: totalRuns, surveyCount: totalSurveys, currentRun };
  }, [profile, runs, totalRuns, totalSurveys, currentRun]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let bundle;
        try {
          bundle = await fetchProfileBundle();
        } catch (err) {
          // Retry once on an auth-lock race OR a transient network/DB blip
          // (e.g. "Failed to fetch"), exactly like loadPageData, so a momentary
          // hiccup on load doesn't dump a raw error banner on the page.
          if (!isAuthLockNoise(err) && !isTransientDbError(err)) throw err;
          await new Promise((resolve) => setTimeout(resolve, 600));
          bundle = await fetchProfileBundle();
        }

        if (!cancelled) {
          setProfile(bundle.profileData || null);
          setRuns(bundle.runData || []);
          setCurrentRun(bundle.currentRun || null);
          setTotalRuns(Number(bundle.runCount) || 0);
          setTotalSurveys(bundle.surveyCount == null ? (Number(bundle.runCount) || 0) : Number(bundle.surveyCount) || 0);
        }
      } catch (err) {
        if (!cancelled) {
          if (await handleInvalidSession(err)) return;
          if (isAuthLockNoise(err)) return; // transient — a concurrent request handled it
          setErrorMsg(
            isTransientDbError(err)
              ? 'We had trouble loading your profile just then. Please try again in a moment.'
              : friendlyError(err, 'load your profile').message
          );
          setErrorRetry(() => loadPageData);
        }
      } finally {
        if (!cancelled) setLoadingRuns(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const fullName = useMemo(() => {
    const first = profile?.first_name?.trim?.() || '';
    const last = profile?.last_name?.trim?.() || '';
    return [first, last].filter(Boolean).join(' ') || 'Not set yet';
  }, [profile]);

  const joined = useMemo(() => {
    if (!profile?.created_at) return '—';
    return compactDate(profile.created_at);
  }, [profile]);

  const initials = useMemo(() => {
    const a = (profile?.first_name || '').trim();
    const b = (profile?.last_name || '').trim();
    const two = ((a[0] || '') + (b[0] || '')).toUpperCase();
    if (two) return two;
    const e = (profile?.email || user?.email || '?').trim();
    return (e[0] || '?').toUpperCase();
  }, [profile, user?.email]);

  const planName = useMemo(() => formatPlanName(profile), [profile]);
  const reportUsage = useMemo(() => getReportUsage(profile), [profile]);
  const advisorUsage = useMemo(() => getAdvisorUsage(profile), [profile]);
  const accountEntitlementNote = useMemo(
    () => getAccountEntitlementNote(profile, reportUsage, advisorUsage),
    [profile, reportUsage, advisorUsage]
  );
  const renewalDate = useMemo(() => formatRenewalDate(profile), [profile]);
  const pendingPlanDate = useMemo(() => formatPendingPlanDate(profile), [profile]);
  const pendingPlanName = useMemo(() => formatPlanNameFromKey(profile?.pending_plan_change), [profile?.pending_plan_change]);
  const currentPlanKey = String(profile?.plan || 'free').toLowerCase();
  const isAdminProfile = Boolean(profile?.is_admin);
  const isRecurringPlan = ['explore', 'premium'].includes(currentPlanKey);
  const authProvider = String(user?.app_metadata?.provider || '').toLowerCase();
  const authIdentityProviders = Array.isArray(user?.identities)
    ? user.identities.map((identity) => String(identity?.provider || '').toLowerCase()).filter(Boolean)
    : [];
  const usesPasswordAuth = authProvider === 'email' || authIdentityProviders.includes('email');
  const usesGoogleAuth = authProvider === 'google' || authIdentityProviders.includes('google');
  const usesExternalAuth = usesGoogleAuth || (!!authProvider && authProvider !== 'email');

  useEffect(() => {
    if (!editingProfile || savingProfile) return;

    setProfileForm({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      email: profile?.email || user?.email || '',
    });
  }, [editingProfile, profile, user?.email, savingProfile]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const returnedFromBilling = params.get('billing') === 'portal_return';
    const checkoutSuccess = params.get('checkout') === 'success';
    const checkoutCancelled = params.get('checkout') === 'cancelled';
    const subscriptionUpdated = params.get('subscription') === 'updated';

    if (returnedFromBilling && !billingReturnSyncStartedRef.current) {
      billingReturnSyncStartedRef.current = true;
      setProfileNotice('Refreshing your billing status from Stripe...');

      const runSync = async () => {
        try {
          const syncedProfile = await syncStripeSubscriptionFromBackend();
          setSubscriptionNoticeFromProfile(syncedProfile, 'Your billing details have been updated.');
        } catch (err) {
          console.error(err);
          setProfileNotice('Returned from Stripe. Refresh the page in a moment if your subscription status has not updated yet.');
        }
      };

      runSync();
      window.setTimeout(runSync, 1500);
      window.setTimeout(runSync, 4000);
      window.setTimeout(() => {
        window.history.replaceState({}, '', '/profile');
      }, 4500);
      return;
    }

    if (!profile) return;

    // A scheduled downgrade or cancellation is shown on the plan card itself
    // ("Changes to ... on ..." / "Ends on ..."), so no standing banner for it.
    // Notices below only appear once, straight after an action.

    if (checkoutSuccess) {
      // Confirm the entitlement with Stripe directly rather than waiting on the
      // webhook, then open the welcome dialog for the plan or pack bought.
      if (checkoutReturnStartedRef.current) return;
      checkoutReturnStartedRef.current = true;
      const boughtPack = params.get('purchase') === 'advisor_pack';
      const showWelcome = (p) => {
        const plan = String(p?.plan || profile?.plan || 'free').toLowerCase();
        const kind = boughtPack ? 'pack' : plan === 'premium' ? 'premium' : 'explore';
        setPlanWelcome({ kind });
      };
      syncStripeSubscriptionFromBackend()
        .then(showWelcome)
        .catch(() => showWelcome(null));
      window.history.replaceState({}, '', '/profile');
      return;
    }

    if (checkoutCancelled) {
      setProfileNotice('Checkout was cancelled. No changes were made to your plan.');
      return;
    }

    if (subscriptionUpdated) {
      setProfileNotice('Your subscription has been updated.');
    }
  }, [location.search, profile, renewalDate, pendingPlanDate, pendingPlanName]);

  const reportLimitTitle = isRecurringPlan ? 'Reports this year' : 'Reports left';
  const reportLimitSubtitle = isRecurringPlan ? 'Included in your plan each year' : 'Explore career reports';
  // Shown as "remaining of total left" so the student can see what is used.
  const reportLimitValue = reportUsage?.unlimited ? '∞' : toNumber(reportUsage?.remaining);
  const reportLimitSuffix = reportUsage?.unlimited ? 'included' : `of ${toNumber(reportUsage?.total)} left`;

  const advisorLimitTitle = isRecurringPlan ? 'Advisor questions this year' : 'Advisor questions left';
  const advisorLimitSubtitle = isRecurringPlan ? 'Included in your plan each year' : 'Chat with Your Advisor';
  const advisorLimitValue = advisorUsage?.unlimited ? '∞' : toNumber(advisorUsage?.remaining);
  const advisorLimitSuffix = advisorUsage?.unlimited ? 'included' : `of ${toNumber(advisorUsage?.total)} left`;


  const profileHasChanges = useMemo(() => {
    const currentFirstName = profile?.first_name || '';
    const currentLastName = profile?.last_name || '';
    return (
      profileForm.firstName.trim() !== currentFirstName.trim() ||
      profileForm.lastName.trim() !== currentLastName.trim()
    );
  }, [profile, profileForm.firstName, profileForm.lastName]);

  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    if (params.get('deleteAccount') !== 'confirmed') return;

    setErrorMsg('');
    setDeleteAccountPassword('');
    setDeleteAccountFinalConfirm(true);
    setDeleteAccountOpen(true);
    window.history.replaceState({}, '', '/profile');
  }, [location.search]);

  const showingLatestOnly = totalRuns > runs.length;

  const openRun = (runId) => navigate(`/results/run/${runId}`);
  const handleRetake = () => {
    // First-time users have no saved runs yet, so this is not a retake.
    // Send them straight into the assessment without a confirmation popup.
    if (totalRuns === 0) {
      navigate('/start');
      return;
    }

    setRetakeConfirmOpen(true);
  };

  const closeRetakeConfirmModal = () => {
    setRetakeConfirmOpen(false);
  };

  const confirmRetakeAssessment = () => {
    setRetakeConfirmOpen(false);
    navigate('/start');
  };

  const openProfileEditor = () => {
    setProfileNotice('');
    setEditingProfile(true);
    setProfileForm({
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      email: profile?.email || user?.email || '',
    });

    if (profile?.stripe_subscription_id) {
      syncStripeSubscriptionFromBackend()
        .then((syncedProfile) => {
          if (syncedProfile?.cancel_at_period_end || syncedProfile?.pending_plan_change) {
            setSubscriptionNoticeFromProfile(syncedProfile);
          }
        })
        .catch(() => {
          // Do not block the account modal if Stripe sync is temporarily unavailable.
        });
    }
  };

  const closeProfileEditor = () => {
    if (savingProfile) return;
    setEditingProfile(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setErrorMsg('');
      setProfileNotice('');

      const updatedProfile = await updateMyProfileDetails({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profile?.email || user?.email || '',
      });

      setProfile(updatedProfile || null);
      setEditingProfile(false);
      setProfileNotice('Your account details were updated.');
    } catch (err) {
      failWith(err, 'update your account details');
    } finally {
      setSavingProfile(false);
    }
  };

  const openOutputParametersModal = (run) => {
    setEditingRun(run);
    setEditIntroResponses(buildInitialIntro(run));
  };

  const closeOutputParametersModal = () => {
    if (rerunning) return;
    setEditingRun(null);
    setEditIntroResponses(defaultIntroResponses);
  };

  const handleRerunOutput = async () => {
    if (!editingRun) return;
    try {
      setRerunning(true);
      setErrorMsg('');
      const newRun = await rerunAssessmentWithOutputParameters(editingRun, editIntroResponses);
      await loadPageData();
      setEditingRun(null);
      setEditIntroResponses(defaultIntroResponses);
      navigate(`/results/run/${newRun.id}`);
    } catch (err) {
      failWith(err, 're-run this result');
    } finally {
      setRerunning(false);
    }
  };

  // Pin a saved report as the one the profile follows (journey, favourites,
  // tiles). Newest stays the default when nothing is pinned.
  const handleSetCurrentRun = async (runId) => {
    if (!runId) return;
    try {
      setSettingCurrentId(runId);
      setErrorMsg('');
      await setCurrentRunId(runId);
      const full = await getCurrentAssessmentRun(runId);
      setCurrentRun(full || null);
      setProfile((p) => (p ? { ...p, current_run_id: runId } : p));
      setEngagedForRun(null);
      setFavForRun(null);
    } catch (err) {
      failWith(err, 'set the current report');
    } finally {
      setSettingCurrentId(null);
    }
  };

  const handleDeleteRun = async (runId) => {
    if (!runId) return;

    try {
      setDeletingRunId(runId);
      setErrorMsg('');
      await deleteAssessmentRun(runId);
      if (currentRun?.id === runId) setCurrentRun(null);
      await loadPageData();
      setDeleteConfirmRunId(null);
    } catch (err) {
      failWith(err, 'delete that saved result');
    } finally {
      setDeletingRunId(null);
    }
  };



  const [resumingPlan, setResumingPlan] = useState(false);
  const handleResumePlan = async () => {
    if (resumingPlan) return;
    setResumingPlan(true);
    try {
      const result = await setCancelAtPeriodEnd(false);
      if (result?.profile) setProfile(result.profile);
      setProfileNotice(`Your cancellation has been removed. ${formatPlanName(result?.profile || profile)} will renew as normal.`);
    } catch (err) {
      failWith(err, 'resume your plan', handleResumePlan);
    } finally {
      setResumingPlan(false);
    }
  };

  const closeCancelDowngradeModal = () => {
    if (cancellingDowngrade) return;
    setCancelDowngradeOpen(false);
  };

  const handleCancelScheduledDowngrade = async () => {
    try {
      setCancellingDowngrade(true);
      setErrorMsg('');
      setProfileNotice('');

      const result = await cancelScheduledDowngrade();
      const updatedProfile = result?.profile || null;

      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      setCancelDowngradeOpen(false);
      setProfileNotice('Your scheduled downgrade has been cancelled. Your current plan will continue.');

      window.setTimeout(async () => {
        try {
          const freshProfile = await syncStripeSubscriptionFromBackend();
          if (!freshProfile && updatedProfile) setProfile(updatedProfile);
        } catch (_) {
          try {
            const freshProfile = await getMyProfile();
            setProfile(freshProfile || updatedProfile || null);
          } catch (__) {
            // Keep the already-updated profile if refresh fails.
          }
        }
      }, 900);
    } catch (err) {
      console.error(err);
      failWith(err, 'cancel the scheduled downgrade', handleCancelScheduledDowngrade);
    } finally {
      setCancellingDowngrade(false);
    }
  };

  const openDeleteAccountModal = () => {
    setErrorMsg('');
    setDeleteAccountPassword('');
    setDeleteAccountFinalConfirm(false);
    setDeleteAccountOpen(true);
  };

  const closeDeleteAccountModal = () => {
    if (deletingAccount) return;
    setDeleteAccountOpen(false);
    setDeleteAccountPassword('');
    setDeleteAccountFinalConfirm(false);
  };

  const handleDeleteAccountGoogleReauth = async () => {
    try {
      setErrorMsg('');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/profile?deleteAccount=confirmed`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      failWith(err, 'start Google confirmation');
    }
  };

  const handleDeleteAccount = async () => {
    if (usesExternalAuth && !deleteAccountFinalConfirm) {
      await handleDeleteAccountGoogleReauth();
      return;
    }

    if (!usesExternalAuth && !deleteAccountPassword) {
      setErrorMsg('Please enter your password to confirm account deletion.');
      setErrorRetry(null);
      return;
    }

    if (!deleteAccountFinalConfirm) {
      setDeleteAccountFinalConfirm(true);
      return;
    }

    try {
      setDeletingAccount(true);
      setErrorMsg('');

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.access_token) throw new Error('You need to be logged in to delete your account.');

      try {
        await apiFetch('/api/delete-account', {
          method: 'POST',
          auth: 'required',
          body: {
            confirmation: 'DELETE',
            password: usesExternalAuth ? '' : deleteAccountPassword,
            authMode: usesExternalAuth ? 'oauth' : 'password',
          },
        });
      } catch (err) {
        if (err instanceof ApiError && err.status) {
          throw new Error(err.data?.message || err.data?.error || 'Failed to delete account.');
        }
        throw err;
      }

      try {
        await signOut();
      } catch (_) {
        await supabase.auth.signOut();
      }

      window.location.assign('/');
    } catch (err) {
      if (await handleInvalidSession(err)) return;
      failWith(err, 'delete your account');
      setDeleteAccountFinalConfirm(false);
      setDeletingAccount(false);
    }
  };

  // ---- Journey timeline (current run) ----
  // Survey/Profile are milestones from the run itself; the exploration steps only
  // complete once the user has actually interacted (liked/disliked) on that page.
  const latestRun = currentRun || runs?.[0] || null;

  // Your Advisor on this page talks about next steps, favourites, grades and applications.
  useEffect(() => {
    setAdvisorContext({ section: 'profilepage' });
    return () => setAdvisorContext(null);
  }, []);
  const latestArchetypes = latestRun?.results_json?.archetypes || null;
  // University students explore pathways then roles; school students explore
  // career worlds then pathways. The roadmap labels/gating adapt accordingly.
  const latestStatus = String(latestRun?.intro_answers_json?.status || '').toLowerCase();
  // One rule everywhere: a school report gets the school roadmap and UCAS;
  // every other report (university, graduate, other) gets the shorter roadmap.
  const isUniversity = stageForStatus(latestStatus) !== 'school';
  const journeyDone = {
    survey: Boolean(latestRun),
    profile: Boolean(latestArchetypes && Object.keys(latestArchetypes).length),
    strengths: engagedTypes.has('strength'),
    environments: engagedTypes.has('environment'),
    careerworlds: isUniversity ? engagedTypes.has('pathway') : engagedTypes.has('career_world'),
    discovermore: isUniversity ? engagedTypes.has('role') : engagedTypes.has('pathway'),
    // Explore university or training: the aim is a shortlist, so this needs at
    // least one SAVED degree, course, training pathway or apprenticeship.
    exploreuni: ['subject', 'course', 'nonuni_pathway', 'apprenticeship'].some((t) => engagedTypes.has(`liked:${t}`)),
    grades: academicHasData,
    // Nothing writes an 'advisor' reaction row; the profile's question counter is
    // the reliable signal that the student has used the advisor.
    advisor: engagedTypes.has('advisor') || Number(profile?.advisor_questions_used || 0) > 0,
    // Done once the student has logged at least one application (a UCAS
    // application counts once it has been sent).
    apply: Boolean(applicationTotal),
  };
  // Students (school) get extra steps: explore university/training, enter grades,
  // and finally apply. University leavers keep the shorter roadmap.
  // An assessment saved on this device but not yet turned into a report.
  const draft = resumableProgress(user?.id);
  const draftTotal = 100;
  const draftComplete = !!draft && draft.answered >= draftTotal;
  const draftLabel = draft
    ? (draftComplete ? 'See your results' : `Continue your assessment (${draft.answered} of ${draftTotal} answered)`)
    : 'Take your assessment';
  const continueDraft = () => navigate('/survey/questions', { state: draftComplete ? { autoFinish: true } : undefined });

  const journeySteps = [
    { key: 'survey', label: draftLabel },
    { key: 'profile', label: 'Meet your CareerDNA' },
    { key: 'strengths', label: 'Explore your strengths' },
    { key: 'environments', label: 'Explore your ideal environments' },
    { key: 'careerworlds', label: isUniversity ? 'Explore your pathways' : 'Explore your career worlds' },
    { key: 'discovermore', label: isUniversity ? 'Explore your roles' : 'Explore your pathways' },
    ...(!isUniversity ? [
      { key: 'exploreuni', label: 'Explore university or training/work' },
      { key: 'grades', label: 'Enter your grades' },
    ] : []),
    // Terminal step for everyone: completes when the first application is tracked.
    { key: 'apply', label: isUniversity ? 'Apply for graduate roles or further study' : 'Apply for university or training/work' },
  ].map((step) => ({ ...step, done: Boolean(journeyDone[step.key]) }));
  const journeyCurrentIdx = journeySteps.findIndex((s) => !s.done);
  // Overview journey summary: progress ring + the single next step.
  const journeyTotal = journeySteps.length;
  const journeyDoneCount = journeySteps.filter((s) => s.done).length;
  const journeyNextStep = journeyCurrentIdx >= 0 ? journeySteps[journeyCurrentIdx] : null;
  // Only render the overview once EVERY piece of its data is in for the CURRENT
  // run, so the stats, ring and step count never flash a wrong partial value
  // (e.g. 2/9 then 8/9, or a "—" favourites count) while loading. We require the
  // user to be resolved, the academic profile loaded, and both the engaged-types
  // and favourites effects to have finished for this exact run id.
  // First-time milestones: when a stat tile goes from 0 to 1 the first time this
  // user sees it, the tile gets a short celebration. Remembered per user in
  // localStorage so it only ever happens once per milestone.
  const [celebrate, setCelebrate] = useState({});
  const milestoneCounts = useMemo(() => ({
    assessments: Number(totalSurveys) || 0,
    reports: Number(totalRuns) || 0,
    questions: Number(profile?.advisor_questions_used || 0),
    favourites: favCount == null ? null : Number(favCount) || 0,
    applications: applicationTracked == null ? null : Number(applicationTracked) || 0,
  }), [totalSurveys, totalRuns, profile?.advisor_questions_used, favCount, applicationTracked]);

  const overviewReady = !loadingRuns
    && !!user?.id
    && academicLoaded
    && (latestRun
      ? (engagedForRun === latestRun.id && favForRun === latestRun.id)
      : (engagedForRun === 'none' && favForRun === 'none'));

  useEffect(() => {
    if (!overviewReady || !user?.id) return;
    const key = `cdna_firsts_${user.id}`;
    let seen = {};
    try { seen = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) { seen = {}; }
    const fresh = {};
    const next = { ...seen };
    Object.entries(milestoneCounts).forEach(([k, n]) => {
      if (n == null) return;
      if (n >= 1 && !seen[k]) { fresh[k] = true; next[k] = true; }
      // A user who already has counts the first time this feature runs is not
      // celebrated retrospectively for everything at once: only the first
      // visit after this feature ships records the baseline.
      if (n === 0) next[k] = false;
    });
    if (!seen.__init) {
      // Baseline visit: record current state, celebrate nothing.
      Object.keys(next).forEach((k) => { if (milestoneCounts[k] >= 1) next[k] = true; });
      next.__init = true;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch (_) { /* ignore */ }
      return;
    }
    if (Object.keys(fresh).length) {
      setCelebrate(fresh);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch (_) { /* ignore */ }
      const t = window.setTimeout(() => setCelebrate({}), 5200);
      return () => window.clearTimeout(t);
    }
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (_) { /* ignore */ }
    return undefined;
  }, [overviewReady, user?.id, milestoneCounts]);

  // Copy for the first-time celebration; plural when the first visit after
  // the milestone already shows more than one (several favourites at once).
  const milestoneCopy = (k) => {
    const n = Number(milestoneCounts[k] || 0);
    switch (k) {
      case 'assessments': return 'Well done, your first assessment is complete';
      case 'reports': return n > 1 ? 'Your reports are ready' : 'Your first report is ready';
      case 'questions': return n > 1 ? `${n} questions asked. Keep them coming` : 'First question asked. Keep them coming';
      case 'favourites': return n > 1 ? `${n} favourites saved` : 'First favourite saved';
      case 'applications': return n > 1 ? `${n} applications tracked` : 'First application tracked';
      default: return '';
    }
  };
  const statTileProps = (k) => ({
    className: celebrate[k] ? ' is-celebrating' : '',
    note: celebrate[k] ? <span className="profile-stat-celebrate" role="status">{milestoneCopy(k)}</span> : null,
  });

  // The satisfaction prompt appears once the exploration steps are done. Advisor,
  // grades and apply are optional/terminal, so they don't gate the prompt.
  const JOURNEY_OPTIONAL = new Set(['advisor', 'grades', 'apply']);
  const journeyCompleteExceptAdvisor = journeySteps
    .filter((s) => !JOURNEY_OPTIONAL.has(s.key))
    .every((s) => s.done);

  // Each roadmap step deep-links to the matching results tab. Only done + current
  // steps are clickable; upcoming (greyed) steps have nothing to open yet.
  // Each step deep-links to a top section of the results page and (for analysis
  // steps) an inner tab. "Meet your CareerDNA" opens the profile bar-chart
  // section; the exploration steps open the Career Analysis section — which, if
  // the AI report hasn't been generated yet, shows the "Run CareerDNA Analysis"
  // prompt. University students' pathways live in the 'pathways' tab, school
  // students' worlds in 'careerworlds'.
  const journeyStepTarget = {
    profile: { section: 'profile' },
    strengths: { section: 'analysis', tab: 'strengths' },
    environments: { section: 'analysis', tab: 'environments' },
    careerworlds: { section: 'analysis', tab: isUniversity ? 'pathways' : 'careerworlds' },
    discovermore: { section: 'analysis', tab: 'discovermore' },
    exploreuni: { section: 'analysis', tab: 'furtherstudy' },
    advisor: { section: 'analysis', tab: 'advisor' },
    apply: { section: 'analysis', tab: isUniversity ? 'roleexplorer' : 'furtherstudy' },
  };
  const openRunAt = (target) => {
    if (!latestRun) return;
    navigate(`/results/run/${latestRun.id}`, {
      state: { section: target?.section || 'analysis', tab: target?.tab || '' },
    });
  };

  // Central click handler for a roadmap step: survey starts the assessment, grades
  // opens the grades popup, everything else deep-links to its report tab.
  // Steps that read from the report are locked until the assessment is done.
  // Hovering shows the reason; tapping (phones have no hover) shows it briefly.
  // The hint floats at fixed viewport coordinates (same approach as the
  // report tooltips) so the sideways-scrolling rail cannot clip it.
  const [lockedHint, setLockedHint] = useState(null);
  const stepLocked = (step) => !latestRun && step.key !== 'survey' && step.key !== 'grades';
  const showLockedHint = (step, el, sticky) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    setLockedHint({ key: step.key, x: r.left + r.width / 2, y: r.top - 8, sticky: !!sticky });
  };
  const hideLockedHint = (step) => setLockedHint((h) => (h && h.key === step.key && !h.sticky ? null : h));
  useEffect(() => {
    if (!lockedHint?.sticky) return undefined;
    const t = window.setTimeout(() => setLockedHint(null), 2200);
    return () => window.clearTimeout(t);
  }, [lockedHint]);
  useEffect(() => {
    if (!lockedHint) return undefined;
    const clear = () => setLockedHint(null);
    window.addEventListener('scroll', clear, true);
    window.addEventListener('resize', clear);
    return () => { window.removeEventListener('scroll', clear, true); window.removeEventListener('resize', clear); };
  }, [lockedHint]);
  const goToStep = (step, el) => {
    if (!step) return;
    if (stepLocked(step)) { showLockedHint(step, el, true); return; }
    if (step.key === 'survey') { if (draft) continueDraft(); else navigate('/start'); return; }
    if (step.key === 'grades') { setGradesOpenSignal((n) => n + 1); return; }
    openRunAt(journeyStepTarget[step.key]);
  };

  // Deep-link a favourite to its tab in the report, and (when we know it) to the
  // exact card via focusTitle so the report opens and scrolls to that item.
  const exploreFavourite = (type, focusTitle) => {
    if (!latestRun) return;
    const map = {
      career_world: 'careerworlds',
      pathway: isUniversity ? 'pathways' : 'discovermore',
      subject: 'furtherstudy',
      course: 'furtherstudy',
      role: isUniversity ? 'roleexplorer' : 'discovermore',
      nonuni_pathway: 'nonuni',
      apprenticeship: 'nonuni',
      strength: 'strengths',
      environment: 'environments',
    };
    navigate(`/results/run/${latestRun.id}`, { state: { section: 'analysis', tab: map[type] || 'careerworlds', focusTitle: focusTitle || '' } });
  };

  // Per-step icons give the roadmap character instead of identical dots.
  const journeyIconPaths = {
    survey: (<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6V7H9z" /><path d="M8.6 13l1.9 1.9 3.6-4.2" /></>),
    profile: (<><circle cx="12" cy="8" r="3.4" /><path d="M5.8 20c0-3.5 2.8-5.4 6.2-5.4s6.2 1.9 6.2 5.4" /></>),
    strengths: (<path d="M13 3 5.5 13H10l-1 8 8.5-11H13z" />),
    environments: (<><rect x="6" y="4" width="12" height="17" rx="1.5" /><path d="M9.5 8h1M13 8h1M9.5 12h1M13 12h1M9.5 16h1M13 16h1" /></>),
    careerworlds: (<><path d="M12 3v18" /><path d="M12 5.5h6.2l2.1 2.1-2.1 2.1H12" /><path d="M12 12H5.8l-2.1 2.1 2.1 2.1H12" /></>),
    discovermore: (<><rect x="4" y="8" width="16" height="11" rx="2" /><path d="M9 8V6.5A2 2 0 0 1 11 4.5h2a2 2 0 0 1 2 2V8" /><path d="M4 13h16" /></>),
    exploreuni: (<><path d="M12 4 2.5 9 12 14l9.5-5L12 4z" /><path d="M6 11v4c0 1.2 2.7 2.5 6 2.5s6-1.3 6-2.5v-4" /></>),
    grades: (<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 9h6M9 13h6M9 17h3" /></>),
    advisor: (<path d="M12 4l1.5 4.3L18 10l-4.5 1.7L12 16l-1.5-4.3L6 10l4.5-1.7z" />),
    apply: (<><path d="M22 3 11 14" /><path d="M22 3 15 21l-4-7-7-4 18-7z" /></>),
  };
  // On phones the stepper scrolls sideways; open it centred on the current step.
  const journeyRailRef = useRef(null);
  const journeyCurrentKey = journeyNextStep ? journeyNextStep.key : '';
  // Which sides still have hidden steps; drives the edge fades and arrows.
  const [journeyRailEdges, setJourneyRailEdges] = useState({ left: false, right: false });
  const updateJourneyRailEdges = () => {
    const rail = journeyRailRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    const next = { left: rail.scrollLeft > 4, right: max - rail.scrollLeft > 4 };
    setJourneyRailEdges((prev) => (prev.left === next.left && prev.right === next.right ? prev : next));
  };
  const scrollJourneyRail = (dir) => {
    const rail = journeyRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: dir * Math.round(rail.clientWidth * 0.7), behavior: 'smooth' });
  };
  useEffect(() => {
    const rail = journeyRailRef.current;
    if (!rail) return undefined;
    // Wait a frame so the rail has its real width before we centre the current step.
    const raf = window.requestAnimationFrame(() => {
      if (rail.scrollWidth > rail.clientWidth + 4) {
        const cur = rail.querySelector('[data-current="1"]');
        if (cur) {
          const left = cur.offsetLeft - (rail.clientWidth - cur.offsetWidth) / 2;
          rail.scrollTo({ left: Math.max(0, left) });
        }
      }
      updateJourneyRailEdges();
    });
    window.addEventListener('resize', updateJourneyRailEdges);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateJourneyRailEdges);
    };
  }, [journeyCurrentKey, overviewReady, journeySteps.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const JOURNEY_SHORT = {
    survey: 'Assessment',
    profile: 'My CareerDNA',
    strengths: 'Strengths',
    environments: 'Work styles',
    careerworlds: isUniversity ? 'Pathways' : 'Career worlds',
    discovermore: isUniversity ? 'Roles' : 'Pathways',
    exploreuni: 'University or training',
    grades: 'Your grades',
    apply: 'Applications',
  };
  const renderJourneyIcon = (key) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {journeyIconPaths[key] || <circle cx="12" cy="12" r="3.5" />}
    </svg>
  );

  return (
    <div className="profile-page">
      <AccountNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {latestRun?.id && latestRun?.summary_markdown ? <AdvisorDrawer assessmentRunId={latestRun.id} stage={isUniversity ? 'university' : 'school'} /> : null}
      {planWelcome ? (
        <PlanWelcomeModal
          kind={planWelcome.kind}
          audience={isUniversity ? 'university' : 'school'}
          hasReport={Boolean(latestRun?.id)}
          onClose={() => setPlanWelcome(null)}
          onPrimary={() => {
            setPlanWelcome(null);
            if (planWelcome.kind === 'pack') { openAdvisor(); return; }
            if (latestRun?.id) navigate(`/results/run/${latestRun.id}`);
            else navigate('/start');
          }}
        />
      ) : null}

      <div className="profile-shell">
        {/* Accent hero: identity + live journey progress + continue action */}
        <header className="profile-hero">
          <div className="profile-hero-top">
            <div className="profile-hero-id">
              <div className="profile-hero-avatar" aria-hidden="true">{initials}</div>
              <div className="profile-hero-idtext">
                <h1 className="profile-hero-welcome" aria-busy={!profile && !user}>
                  {(() => {
                    // The greeting never waits for the reports to load: the
                    // name comes from the profile row or, before that arrives,
                    // from the signed-in user's own details, like the email does.
                    const meta = user?.user_metadata || {};
                    const first = profile?.first_name || meta.first_name || String(meta.full_name || meta.name || '').trim().split(/\s+/)[0] || '';
                    if (!profile && !user) return <span className="profile-skel profile-skel--title" aria-label="Loading" />;
                    return `Welcome back${first ? `, ${first}` : ''}`;
                  })()}
                </h1>
                <div className="profile-hero-meta">
                  {profile ? <PlanBadge plan={currentPlanKey} /> : null}
                  {studentStatusLine(latestRun) ? (
                    <span className="profile-hero-status">
                      {String(latestRun?.intro_answers_json?.status || '') === 'school' ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 9l10-4 10 4-10 4z" /><path d="M6 11v4c0 1.5 3 3 6 3s6-1.5 6-3v-4" /><path d="M22 9v6" /></svg>
                      )}
                      {studentStatusLine(latestRun).split(', ').map((part, i) => (
                        <React.Fragment key={part}>{i > 0 ? <i className="profile-hero-status-dot" aria-hidden="true" /> : null}{part}</React.Fragment>
                      ))}
                    </span>
                  ) : (
                    <span className="profile-hero-email">{profile?.email || user?.email || ''}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="profile-hero-actions">
              <button type="button" className="profile-hero-btn" onClick={openProfileEditor}>
                <SettingsIcon />
                Manage account
              </button>
              {isAdminProfile ? (
                <button type="button" className="profile-hero-btn profile-hero-btn--muted" onClick={() => navigate('/admin')}>
                  Admin
                </button>
              ) : null}
            </div>
          </div>

        </header>

        <InlineError message={errorMsg} onRetry={errorRetry || undefined} />
        {profileNotice ? <p className="profile-notice">{profileNotice}</p> : null}

        {!overviewReady ? (
          <section className="profile-loading" aria-busy="true" aria-label="Loading your profile">
            <span className="profile-spinner" aria-hidden="true" />
            <p className="profile-runs-loading-note">Loading your profile&hellip;</p>
          </section>
        ) : null}

        {overviewReady ? (
          <>
            {Object.keys(celebrate).length ? (
              <div className="profile-stats-celebrate" role="status">
                {Object.keys(celebrate).map((k) => milestoneCopy(k)).join('. ')}.
              </div>
            ) : null}
            <div className="profile-stats">
              <div className={`profile-stat profile-stat--journey${statTileProps('assessments').className}`}>
                {statTileProps('assessments').note}
                <span className="profile-stat-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                </span>
                <div className="profile-stat-body">
                  <span className="profile-stat-num">{totalSurveys}</span>
                  <span className="profile-stat-label">Assessments</span>
                </div>
              </div>
              <div className={`profile-stat profile-stat--runs${statTileProps('reports').className}`}>
                {statTileProps('reports').note}
                <span className="profile-stat-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4" /><path d="M12 8v4l3 2" /></svg>
                </span>
                <div className="profile-stat-body">
                  <span className="profile-stat-num">{totalRuns}</span>
                  <span className="profile-stat-label">Reports</span>
                </div>
              </div>
              <div className={`profile-stat profile-stat--advisor${statTileProps('questions').className}`}>
                {statTileProps('questions').note}
                <span className="profile-stat-ic" aria-hidden="true">
                  <BrainCircuit size={20} aria-hidden="true" focusable="false" />
                </span>
                <div className="profile-stat-body">
                  <span className="profile-stat-num">{Number(profile?.advisor_questions_used || 0)}</span>
                  <span className="profile-stat-label">Questions asked</span>
                </div>
              </div>
              <div className={`profile-stat profile-stat--fav${statTileProps('favourites').className}`}>
                {statTileProps('favourites').note}
                <span className="profile-stat-ic" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 21s-7-4.5-9.5-8.5C.5 8.5 3 5 6.5 5 8.5 5 10 6 12 8c2-2 3.5-3 5.5-3C21 5 23.5 8.5 21.5 12.5 19 16.5 12 21 12 21z" /></svg>
                </span>
                <div className="profile-stat-body">
                  <span className="profile-stat-num">{favCount == null ? '…' : favCount}</span>
                  <span className="profile-stat-label">Favourites</span>
                </div>
              </div>
              <div className={`profile-stat profile-stat--apps${statTileProps('applications').className}`}>
                {statTileProps('applications').note}
                <span className="profile-stat-ic" aria-hidden="true">
                  <Send size={19} aria-hidden="true" focusable="false" />
                </span>
                <div className="profile-stat-body">
                  <span className="profile-stat-num">{applicationTracked == null ? '…' : applicationTracked}</span>
                  <span className="profile-stat-label">Applications</span>
                </div>
              </div>
            </div>

            <section className="profile-jcard" aria-label={journeyNextStep ? `Your journey. Next step: ${journeyNextStep.label}` : 'Your journey'}>
              <div className="profile-jcard-head">
                <span className="profile-jcard-title">
                  Your journey
                  <span className="profile-jcard-pill">{journeyDoneCount} of {journeyTotal} steps done</span>
                </span>
              </div>
              <div className="profile-jcard-bar" aria-hidden="true">
                <div className="profile-jcard-bar__fill" style={{ width: `${journeyTotal ? Math.round((journeyDoneCount / journeyTotal) * 100) : 0}%` }} />
              </div>
              <button
                type="button"
                className="profile-jcard-next"
                onClick={() => (journeyNextStep ? goToStep(journeyNextStep) : setAppsOpenSignal((n) => n + 1))}
              >
                <span className="profile-jcard-next__ic" aria-hidden="true">
                  {journeyNextStep ? renderJourneyIcon(journeyNextStep.key) : renderJourneyIcon('apply')}
                </span>
                <span className="profile-jcard-next__text">
                  <span className="profile-jcard-next__label">{journeyNextStep ? 'Next step' : 'All steps done'}</span>
                  <span className="profile-jcard-next__name">{journeyNextStep ? journeyNextStep.label : 'Keep your applications up to date'}</span>
                </span>
                <svg className="profile-jcard-next__chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </button>
              <div className={`profile-jrail-wrap${journeyRailEdges.left ? ' can-left' : ''}${journeyRailEdges.right ? ' can-right' : ''}`}>
                <button type="button" className="profile-jrail-arrow profile-jrail-arrow--left" aria-label="Earlier steps" onClick={() => scrollJourneyRail(-1)}>
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button type="button" className="profile-jrail-arrow profile-jrail-arrow--right" aria-label="Later steps" onClick={() => scrollJourneyRail(1)}>
                  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              <ol className="profile-jrail" aria-label="Journey steps" ref={journeyRailRef} onScroll={updateJourneyRailEdges}>
                {journeySteps.map((step, i) => {
                  const isCurrent = journeyNextStep && journeyNextStep.key === step.key;
                  return (
                    <li key={step.key} className={`profile-jrail-step${step.done ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}${stepLocked(step) ? ' is-locked' : ''}`} data-current={isCurrent ? '1' : undefined}>
                      <button
                        type="button"
                        className="profile-jrail-btn"
                        onClick={(e) => goToStep(step, e.currentTarget)}
                        onMouseEnter={(e) => { if (stepLocked(step)) showLockedHint(step, e.currentTarget, false); }}
                        onMouseLeave={() => hideLockedHint(step)}
                        onFocus={(e) => { if (stepLocked(step)) showLockedHint(step, e.currentTarget, false); }}
                        onBlur={() => hideLockedHint(step)}
                        aria-label={`${stepLocked(step) ? 'Locked until you complete your assessment: ' : step.done ? 'Done: ' : isCurrent ? 'Next: ' : ''}${step.label}`}
                      >
                        <span className="profile-jrail-dot" aria-hidden="true">
                          {step.done
                            ? <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
                            : renderJourneyIcon(step.key)}
                        </span>
                        <span className="profile-jrail-lbl">{JOURNEY_SHORT[step.key] || step.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              </div>
              {latestRun?.id ? (
                <div className="profile-jcard-foot">
                  <button type="button" className="profile-jcard-openlink" onClick={() => openRun(latestRun.id)}>
                    Open current report
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
                  </button>
                </div>
              ) : null}
              {lockedHint ? createPortal(
                <span className="profile-jrail-hint is-floating" role="tooltip" style={{ left: lockedHint.x, top: lockedHint.y }}>
                  Complete your assessment first
                </span>,
                document.body,
              ) : null}
            </section>

          </>
        ) : null}

        {journeyCompleteExceptAdvisor && latestRun?.id && user?.id && !satDismissed && satWave != null ? (
          <SatisfactionCard
            userId={user.id}
            assessmentRunId={latestRun.id}
            asModal
            wave={satWave}
            onClose={() => { setSatDismissed(true); dismissSatisfactionPulse(user.id, latestRun.id, satWave); }}
            onSubmitted={() => setSatDismissed(true)}
          />
        ) : null}

        {/* Favourites (left) + grades (right, school only) from the latest run. */}
        {overviewReady && latestRun ? (
          <div className={`profile-favrow${latestStatus === 'school' ? ' profile-favrow--three' : ''}`}>
            <FavouritesCard runId={latestRun.id} onExplore={exploreFavourite} onOpenReport={() => openRun(latestRun.id)} initialGroups={favGroups} appliedKeys={appliedKeys} onApply={handleApplyFromFavourite} stage={applicationStage} predictedGrades={academicProfileData?.predicted_alevels || []} insightCtx={{
              archetypes: latestRun?.results_json?.archetypes || null,
              subdimensions: latestRun?.results_json?.subdimensionRows || [],
              summaryMarkdown: latestRun?.summary_markdown || '',
              likedPathways: (favGroups || []).filter((g) => g.type === 'pathway').flatMap((g) => g.items.map((it) => ({ id: it.id, title: it.title }))),
              likedWorlds: (favGroups || []).filter((g) => g.type === 'career_world').flatMap((g) => g.items.map((it) => ({ id: it.id, title: it.title }))),
            }} />
            {latestStatus === 'school' ? <AcademicProfileCard openSignal={gradesOpenSignal} initialProfile={academicProfileData} onSaved={(ap) => { setAcademicHasData(hasAcademicData(ap)); setAcademicProfileData(ap || null); }} /> : null}
            {/* Applications tracker: everything the student has applied for. */}
            <ApplicationsCard
              apps={stageApplications || []}
              onChange={(next) => setApplications((prev) => {
                // The card only sees this stage's rows; keep the other stage's rows as they are.
                const others = (prev || []).filter((a) => !forStage([a], applicationStage).length);
                return [...(next || []), ...others];
              })}
              runId={latestRun.id}
              stage={applicationStage}
              isUniversity={isUniversity}
              predictedGrades={academicProfileData?.predicted_alevels || []}
              schoolYear={latestRun?.intro_answers_json?.schoolYear || ''}
              openSignal={appsOpenSignal}
              onEnterGrades={() => setGradesOpenSignal((n) => n + 1)}
              candidates={(favGroups || []).flatMap((g) => g.items).filter((it) => (it.type === 'job' || it.type === 'course') && !appliedKeys.has(`${it.type}|${it.id}`))}
              onApplyFavourite={handleApplyFromFavourite}
            />
          </div>
        ) : null}

        {/* Recent assessments */}
        {overviewReady ? (
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <h2 className="profile-card-title">Recent reports</h2>
              <span className="profile-card-count">
                {loadingRuns
                  ? <span className="profile-skel profile-skel--pill" aria-label="Loading" />
                  : `${totalRuns} total`}
              </span>
            </div>
            {totalRuns > 0 ? (
              <button type="button" className="profile-btn-hover-primary" style={btnPrimarySm} onClick={handleRetake}>
                <PlayIcon />
                New assessment
              </button>
            ) : null}
          </div>

          {loadingRuns ? (
            <div className="profile-runs-loading" aria-label="Loading saved runs" aria-busy="true">
              <span className="profile-spinner" aria-hidden="true" />
              <p className="profile-runs-loading-note">Loading your assessments&hellip;</p>
            </div>
          ) : runs.length === 0 ? (
            <div className="profile-empty">
              {draft ? (
                <>
                  <p>
                    {draftComplete
                      ? 'You have answered all 100 questions. Your answers are saved and your results are one click away.'
                      : `You have an assessment in progress: ${draft.answered} of ${draftTotal} questions answered. Your answers are saved on this device.`}
                  </p>
                  <button type="button" className="profile-btn-hover-primary" style={btnPrimary} onClick={continueDraft}>
                    {draftComplete ? 'See my results' : 'Continue my assessment'}
                  </button>
                </>
              ) : (
                <>
                  <p>You do not have any saved CareerDNA results yet.</p>
                  <button type="button" className="profile-btn-hover-primary" style={btnPrimary} onClick={handleRetake}>
                    Start your first assessment
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="profile-runs">
              {(showAllRuns ? runs : runs.slice(0, 3)).map((run, idx) => (
                <div
                  key={run.id}
                  className={`profile-run-row${latestRun?.id === run.id ? ' is-current' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { if (e.target.closest('.profile-run-menu-wrap')) return; openRun(run.id); }}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.profile-run-menu-wrap')) { e.preventDefault(); openRun(run.id); } }}
                  aria-label={`Open report ${totalRuns - idx}`}
                >
                  <div className="profile-run-chip" aria-hidden="true">#{totalRuns - idx}</div>

                  <div className="profile-run-main">
                    <div className="profile-run-titleline">
                      <span className="profile-run-title">Report {totalRuns - idx}</span>
                      {latestRun?.id === run.id && <span className="profile-run-badge">Current</span>}
                    </div>
                    <div className="profile-run-details">
                      <span>{compactDate(run.created_at)}</span>
                      <span className="profile-run-sep">|</span>
                      <span><strong>{ageValue(run)}</strong> yrs</span>
                      <span className="profile-run-sep">|</span>
                      <span>{statusLabel(run.intro_answers_json?.status)}</span>
                      {nextStepLabel(run) !== '—' && (
                        <>
                          <span className="profile-run-sep profile-run-sep--hide-tablet">|</span>
                          <span className="profile-run-detail--hide-tablet">{nextStepLabel(run)}</span>
                        </>
                      )}
                      {subjectLabel(run) !== '—' && (
                        <>
                          <span className="profile-run-sep">|</span>
                          <span className="profile-run-subject">{subjectLabel(run)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <svg className="profile-run-chev" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>

                  <div className="profile-run-menu-wrap">
                    <button
                      type="button"
                      className="profile-run-menu-btn"
                      aria-label="More actions"
                      aria-haspopup="true"
                      aria-expanded={openRunMenuId === run.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        // The reports list is the last thing on the page, so the
                        // menu always opens upwards over the row.
                        setRunMenuUp(true);
                        setOpenRunMenuId(openRunMenuId === run.id ? null : run.id);
                      }}
                    >
                      <MoreIcon />
                    </button>
                    {openRunMenuId === run.id ? (
                      <div className={`profile-run-menu${runMenuUp ? ' profile-run-menu--up' : ''}`} role="menu" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          role="menuitem"
                          className="profile-run-menu-item"
                          onClick={() => { setOpenRunMenuId(null); openOutputParametersModal(run); }}
                        >
                          <RerunIcon />
                          Re-run with new settings
                        </button>
                        {latestRun?.id !== run.id ? (
                          <button
                            type="button"
                            role="menuitem"
                            className="profile-run-menu-item"
                            onClick={() => { setOpenRunMenuId(null); handleSetCurrentRun(run.id); }}
                            disabled={settingCurrentId === run.id}
                          >
                            <PinIcon />
                            {settingCurrentId === run.id ? 'Setting...' : 'Set as current report'}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          role="menuitem"
                          className="profile-run-menu-item profile-run-menu-item--danger"
                          onClick={() => { setOpenRunMenuId(null); setDeleteConfirmRunId(run.id); }}
                          disabled={deletingRunId === run.id}
                        >
                          <TrashIcon />
                          {deletingRunId === run.id ? 'Deleting...' : 'Delete report'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          {runs.length > 3 ? (
            <div className="profile-card-footer">
              <button type="button" className="profile-showall" onClick={() => setShowAllRuns((v) => !v)}>
                {showAllRuns ? 'Show less' : `View all ${totalRuns}`}
              </button>
            </div>
          ) : null}
        </section>
        ) : null}
      </div>


      {retakeConfirmOpen ? (
        <div className="profile-retake-confirm-overlay" onClick={closeRetakeConfirmModal}>
          <section
            className="profile-retake-confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="retakeConfirmTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="profile-retake-confirm-close"
              onClick={closeRetakeConfirmModal}
              aria-label="Close new assessment confirmation"
            >
              ×
            </button>

            <h3 id="retakeConfirmTitle">Start a new assessment?</h3>
            <p>
              You will answer the questions again. Your new answers create a brand new report, saved to your account alongside your existing ones, so none of your current reports change. This uses one assessment credit.
            </p>

            <div className="profile-retake-confirm-actions">
              <button
                type="button"
                className="profile-retake-confirm-secondary"
                onClick={closeRetakeConfirmModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-retake-confirm-primary"
                onClick={confirmRetakeAssessment}
              >
                Start new assessment
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Delete Saved Result confirmation */}
      {deleteConfirmRunId ? (
        <div
          className="profile-retake-confirm-overlay"
          onClick={() => (deletingRunId ? null : setDeleteConfirmRunId(null))}
        >
          <section
            className="profile-retake-confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteConfirmTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="profile-retake-confirm-close"
              onClick={() => setDeleteConfirmRunId(null)}
              disabled={Boolean(deletingRunId)}
              aria-label="Close delete confirmation"
            >
              ×
            </button>

            <h3 id="deleteConfirmTitle">Delete this saved result?</h3>
            <p>This cannot be undone.</p>

            <div className="profile-retake-confirm-actions">
              <button
                type="button"
                className="profile-retake-confirm-secondary"
                onClick={() => setDeleteConfirmRunId(null)}
                disabled={Boolean(deletingRunId)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="profile-retake-confirm-primary profile-retake-confirm-primary--danger"
                onClick={() => handleDeleteRun(deleteConfirmRunId)}
                disabled={deletingRunId === deleteConfirmRunId}
              >
                {deletingRunId === deleteConfirmRunId ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {/* Manage Account Modal */}
      {editingProfile ? (
        <div className="profile-modal-overlay profile-account-modal-overlay" onClick={closeProfileEditor}>
          <div className="profile-account-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-account-modal-header">
              <h2 className="profile-account-modal-title">Manage Account</h2>
              <button
                type="button"
                className="profile-account-close-btn"
                onClick={closeProfileEditor}
                aria-label="Close account details"
              >
                ×
              </button>
            </div>

            <form className="profile-account-form" onSubmit={handleSaveProfile}>
              <section className="profile-account-section">
                <h3 className="profile-account-section-title">Personal details</h3>

                <div className="profile-account-card profile-account-card--personal">
                  <div className="profile-account-name-grid">
                    <label className="profile-account-field">
                      <span>First name</span>
                      <div className="profile-account-input-wrap">
                        <AccountMiniIcon type="user" />
                        <input
                          type="text"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                        />
                      </div>
                    </label>

                    <label className="profile-account-field">
                      <span>Last name</span>
                      <div className="profile-account-input-wrap">
                        <AccountMiniIcon type="user" />
                        <input
                          type="text"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                        />
                      </div>
                    </label>
                  </div>

                  {(profile?.date_of_birth || runs?.[0]?.intro_answers_json?.dateOfBirth) ? (
                  <div className="profile-account-field profile-account-field--full">
                    <span>Date of birth</span>
                    <div
                      className="profile-account-input-wrap profile-account-input-wrap--readonly profile-account-input-wrap--locked"
                      style={{ position: 'relative', cursor: 'not-allowed' }}
                      onClick={() => setOpenLockedField((prev) => (prev === 'dob' ? '' : 'dob'))}
                      onMouseLeave={() => setOpenLockedField((prev) => (prev === 'dob' ? '' : prev))}
                    >
                      <AccountMiniIcon type="calendar" />
                      <input
                        type="text"
                        value={(() => {
                          const dob = profile?.date_of_birth || runs?.[0]?.intro_answers_json?.dateOfBirth;
                          return dob ? compactDate(dob) : '';
                        })()}
                        readOnly
                        style={{ cursor: 'not-allowed' }}
                        onFocus={(e) => e.target.blur()}
                      />
                      {openLockedField === 'dob' && (
                        <div className="profile-locked-popover" role="tooltip">
                          <button
                            type="button"
                            className="profile-locked-popover__close"
                            aria-label="Close"
                            onClick={(e) => { e.stopPropagation(); setOpenLockedField(''); }}
                          >
                            &times;
                          </button>
                          Your date of birth can't be changed here. Please contact support if you need to correct it.
                        </div>
                      )}
                    </div>
                  </div>
                  ) : null}

                  <div className="profile-account-field profile-account-field--full">
                    <span>Email address</span>
                    <div
                      className="profile-account-input-wrap profile-account-input-wrap--readonly profile-account-input-wrap--locked"
                      style={{ position: 'relative', cursor: 'not-allowed' }}
                      onClick={() => setOpenLockedField((prev) => (prev === 'email' ? '' : 'email'))}
                      onMouseLeave={() => setOpenLockedField((prev) => (prev === 'email' ? '' : prev))}
                    >
                      <AccountMiniIcon type="mail" />
                      <input
                        type="email"
                        value={profile?.email || user?.email || '—'}
                        readOnly
                        style={{ cursor: 'not-allowed' }}
                        onFocus={(e) => e.target.blur()}
                      />
                      {openLockedField === 'email' && (
                        <div className="profile-locked-popover" role="tooltip">
                          <button
                            type="button"
                            className="profile-locked-popover__close"
                            aria-label="Close"
                            onClick={(e) => { e.stopPropagation(); setOpenLockedField(''); }}
                          >
                            &times;
                          </button>
                          Your email address can't be changed here. Please contact support if you need to update it.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="profile-account-card-divider" />

                  <div className="profile-account-summary-grid">
                    <div className="profile-account-summary-item">
                      <span className="profile-account-summary-icon"><AccountMiniIcon type="calendar" /></span>
                      <div>
                        <span>Joined</span>
                        <strong>{joined}</strong>
                      </div>
                    </div>

                    <div className="profile-account-summary-item profile-account-summary-item--plan">
                      <div>
                        <span>Plan</span>
                        <strong className="profile-account-plan-line"><PlanBadge plan={currentPlanKey} /></strong>
                        {renewalDate || pendingPlanDate ? (
                          <div className="profile-account-plan-note">
                            {profile?.cancel_at_period_end && renewalDate
                              ? `Ends on ${renewalDate}`
                              : profile?.pending_plan_change && pendingPlanDate
                                ? `Changes to ${pendingPlanName} on ${pendingPlanDate}`
                                : `Renews on ${renewalDate}`}
                          </div>
                        ) : null}
                        {profile?.cancel_at_period_end ? (
                          <button
                            type="button"
                            className="profile-account-plan-link"
                            onClick={handleResumePlan}
                            disabled={resumingPlan}
                          >
                            {resumingPlan ? 'Resuming…' : 'Keep my plan'}
                          </button>
                        ) : profile?.pending_plan_change ? (
                          <button
                            type="button"
                            className="profile-account-plan-link"
                            onClick={() => setCancelDowngradeOpen(true)}
                          >
                            Cancel downgrade
                          </button>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="profile-account-upgrade-pill"
                        onClick={() => setPricingModalOpen(true)}
                      >
                        {String(profile?.plan || 'free').toLowerCase() === 'free' ? 'Upgrade' : 'Manage'}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="profile-account-section">
                <h3 className="profile-account-section-title">Your limits</h3>

                <div className="profile-account-card profile-account-limits-card">
                  <div className="profile-account-limit-row">
                    <span className="profile-account-summary-icon"><AccountMiniIcon type="file" /></span>
                    <div className="profile-account-limit-copy">
                      <strong>{reportLimitTitle}</strong>
                      <span>{reportLimitSubtitle}</span>
                    </div>
                    <div className="profile-account-limit-number">
                      {reportLimitValue}
                      <span>{reportLimitSuffix}</span>
                    </div>
                  </div>

                  <div className="profile-account-card-divider" />

                  <div className="profile-account-limit-row">
                    <span className="profile-account-summary-icon"><AccountMiniIcon type="chat" /></span>
                    <div className="profile-account-limit-copy">
                      <strong>{advisorLimitTitle}</strong>
                      <span>{advisorLimitSubtitle}</span>
                    </div>
                    <div className="profile-account-limit-number">
                      {advisorLimitValue}
                      <span>{advisorLimitSuffix}</span>
                    </div>
                  </div>
                </div>
              </section>

              {accountEntitlementNote ? (
                <div className="profile-account-access-card">
                  <span className="profile-account-access-check"><AccountMiniIcon type="check" /></span>
                  <span className="profile-account-access-copy">
                    <strong>{accountEntitlementNote}</strong>
                    <span>Extra report or advisor credits are available on this account.</span>
                  </span>
                </div>
              ) : null}

              {profileHasChanges ? (
                <div className="profile-account-save-row">
                  <button type="submit" className="profile-account-save-btn" disabled={savingProfile || !profileHasChanges}>
                    {savingProfile ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              ) : null}
            </form>

            <div className="profile-account-footer">
              <div className="profile-account-help">
                <span className="profile-account-help-icon"><AccountMiniIcon type="help" /></span>
                <p>
                  For any issues with your account, contact us at{' '}
                  <a href="mailto:support@mycareerdna.io">support@mycareerdna.io</a>
                </p>
              </div>

              <button
                type="button"
                className="profile-account-delete-btn"
                onClick={openDeleteAccountModal}
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      ) : null}


      {cancelDowngradeOpen ? (
        <div className="profile-cancel-downgrade-overlay" onClick={closeCancelDowngradeModal}>
          <section
            className="profile-cancel-downgrade-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancelDowngradeTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="profile-cancel-downgrade-close"
              onClick={closeCancelDowngradeModal}
              disabled={cancellingDowngrade}
              aria-label="Close cancel downgrade confirmation"
            >
              ×
            </button>

            <div className="profile-cancel-downgrade-icon">!</div>

            <h3 id="cancelDowngradeTitle">Cancel scheduled downgrade?</h3>
            <p>
              Your account will stay on {planName} and your scheduled change to {pendingPlanName} will be removed.
              You can downgrade again later if you change your mind.
            </p>

            <div className="profile-cancel-downgrade-actions">
              <button
                type="button"
                className="profile-cancel-downgrade-secondary"
                onClick={closeCancelDowngradeModal}
                disabled={cancellingDowngrade}
              >
                Keep downgrade
              </button>
              <button
                type="button"
                className="profile-cancel-downgrade-primary"
                onClick={handleCancelScheduledDowngrade}
                disabled={cancellingDowngrade}
              >
                {cancellingDowngrade ? 'Cancelling…' : 'Cancel downgrade'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        currentPlan={profile?.plan || 'free'}
        entitlement={{
          plan: profile?.plan || 'free',
          subscription_current_period_end: profile?.subscription_current_period_end,
          advisorPeriodEnd: profile?.advisor_period_end,
          cancelAtPeriodEnd: profile?.cancel_at_period_end,
          pendingPlanChange: profile?.pending_plan_change,
          pendingPlanChangeAt: profile?.pending_plan_change_at,
          pendingPlanPriceId: profile?.pending_plan_price_id,
        }}
        onManageSubscription={async ({ requestedPlan, action, profile: updatedProfile }) => {
          if (updatedProfile) setProfile(updatedProfile);
          setPricingModalOpen(false);

          if (requestedPlan === 'starter' && action === 'cancel') {
            const endDate = formatPendingPlanDate(updatedProfile) || formatRenewalDate(updatedProfile);
            setProfileNotice(
              endDate
                ? `Your plan has been cancelled and will not renew. You keep full access until ${endDate}, then your account returns to CareerDNA Starter.`
                : 'Your plan has been cancelled and will not renew. You keep full access until the end of your billing year.'
            );
          } else if (requestedPlan === 'premium') {
            setProfileNotice('Your subscription has been upgraded to CareerDNA Premium. Your new yearly allowances are now active.');
          } else if (requestedPlan === 'explore' && action === 'downgrade') {
            const nextDate = formatPendingPlanDate(updatedProfile);
            setProfileNotice(
              nextDate
                ? `Your plan will change to CareerDNA Explorer on ${nextDate}. You will keep CareerDNA Premium access until then.`
                : 'Your plan will change to CareerDNA Explorer at the end of your current billing year.'
            );
          } else if (requestedPlan === 'explore') {
            setProfileNotice('Your subscription has been changed to CareerDNA Explorer. Your yearly allowances are now active.');
          } else {
            setProfileNotice('Your subscription has been updated.');
          }

          window.setTimeout(async () => {
            try {
              const freshProfile = await syncStripeSubscriptionFromBackend();
              if (!freshProfile && updatedProfile) setProfile(updatedProfile);
            } catch (_) {
              try {
                const freshProfile = await getMyProfile();
                setProfile(freshProfile || updatedProfile || null);
              } catch (__) {
                // Keep the already-updated profile if the refresh fails.
              }
            }
          }, 900);
        }}
      />

      {/* Delete Account Modal */}
      {deleteAccountOpen ? (
        <div className="profile-modal-overlay" onClick={closeDeleteAccountModal}>
          <div className="profile-modal profile-modal--compact" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title profile-modal-title--danger">Delete Account</h2>
              <button type="button" style={btnModalClose} onClick={closeDeleteAccountModal}>×</button>
            </div>

            <p className="profile-modal-subtitle">
              This permanently deletes your account. It cannot be undone.
            </p>

            <ul className="profile-delete-list">
              <li>
                <span className="profile-delete-list-label">Deleted</span>
                <span>Your profile, reports, favourites, applications and advisor conversations.</span>
              </li>
              {profile?.stripe_subscription_id ? (
                <li>
                  <span className="profile-delete-list-label">Cancelled</span>
                  <span>Your subscription. Access ends now and the rest of the paid year is not refunded.</span>
                </li>
              ) : null}
              <li>
                <span className="profile-delete-list-label">Kept</span>
                <span>Your assessment answers and results, anonymised so nothing identifies you, to improve CareerDNA.</span>
              </li>
            </ul>

            {usesExternalAuth && !deleteAccountFinalConfirm ? (
              <p className="profile-modal-subtitle profile-delete-note">
                Your account is connected to Google, so you will be asked to sign in with Google to confirm.
              </p>
            ) : !usesExternalAuth ? (
              <label className="profile-form-field">
                <span>Enter your password to continue</span>
                <input
                  type="password"
                  style={inputStyle}
                  value={deleteAccountPassword}
                  onChange={(e) => {
                    setDeleteAccountPassword(e.target.value);
                    setDeleteAccountFinalConfirm(false);
                  }}
                  autoComplete="current-password"
                />
              </label>
            ) : null}

            {deleteAccountFinalConfirm ? (
              <div className="profile-delete-final-warning" role="alert">
                Last check: this deletes your account{profile?.stripe_subscription_id ? ' and cancels your subscription' : ''} permanently. Click the red button once more to confirm.
              </div>
            ) : null}

            <div className="profile-form-actions">
              <button type="button" className="profile-btn-hover-ghost" style={btnGhost} onClick={closeDeleteAccountModal}>
                Cancel
              </button>
              <button
                type="button"
                className="profile-btn-hover-danger-solid"
                style={btnDangerSolid}
                onClick={handleDeleteAccount}
                disabled={deletingAccount || (!usesExternalAuth && !deleteAccountPassword)}
              >
                {deletingAccount ? 'Deleting...' : deleteAccountFinalConfirm ? 'Yes, delete my account' : usesExternalAuth ? 'Confirm with Google' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Output Parameters Modal */}
      {editingRun ? (
        <div className="profile-modal-overlay profile-output-modal-overlay" onClick={closeOutputParametersModal}>
          <div className="profile-modal profile-output-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2 className="profile-modal-title">Change Output Parameters</h2>
              <button type="button" style={btnModalClose} onClick={closeOutputParametersModal}>×</button>
            </div>

            <IntroQuestions
              responses={editIntroResponses}
              setResponses={setEditIntroResponses}
              onNext={handleRerunOutput}
              onBack={closeOutputParametersModal}
              isLoading={rerunning}
              showBackButton
              overrideNextLabel={rerunning ? 'Processing...' : 'Re-run with new parameters'}
              embedded
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
