import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AccountNavbar from '../Components/Common/AccountNavbar';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import {
  deleteAssessmentRun,
  getAssessmentRunCount,
  listAssessmentRuns,
  rerunAssessmentWithOutputParameters,
} from '../utils/assessmentRuns';
import { getMyProfile, updateMyProfileDetails } from '../utils/profile';
import { buildApiCandidates } from '../utils/config';
import IntroQuestions from '../Components/Survey/IntroQuestions';
import PricingModal from '../Components/Common/PricingModal';
import SatisfactionCard from '../Components/Common/SatisfactionCard';
import { cancelScheduledDowngrade } from '../utils/stripeCheckout';
import './ProfilePage.css';
import { ageFromDOB } from '../utils/educationProgression';

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
  return {
    ...defaultIntroResponses,
    ...intro,
    schoolSubjects: Array.isArray(intro.schoolSubjects) ? intro.schoolSubjects : [],
  };
}

function statusLabel(value) {
  if (value === 'school') return 'At school';
  if (value === 'undergraduate') return 'At university';
  if (value === 'postgraduate') return 'Postgraduate student';
  if (value === 'other') return 'Other';
  return '—';
}

function nextStepLabel(run) {
  const intro = run?.intro_answers_json || {};
  const status = intro.status;

  const schoolMap = {
    gcse: 'Choose GCSEs',
    alevels: 'Choose A-Levels',
    apply_uni: 'Apply to university or college',
    apprenticeship: 'Explore apprenticeships',
    full_time_jobs: 'Explore full-time jobs',
    not_sure: 'Not sure yet',
  };

  const uniMap = {
    apply_postgrad: 'Apply for postgraduate study',
    apply_further_postgrad: 'Apply for further postgraduate study',
    explore_internships: 'Explore internships or placements',
    explore_full_time: 'Explore full-time roles',
    explore_specialisms: 'Explore other specialisms or subjects',
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
  if (plan === 'plus') return 'CareerDNA Plus';
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
  if (['plus', 'premium', 'premium_school', 'premium_university'].includes(plan)) {
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
  if (key === 'plus') return 'CareerDNA Plus';
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
  color: '#8a95a6',
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

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(() => profileBundleCache?.profileData || null);
  const [runs, setRuns] = useState(() => profileBundleCache?.runData || []);
  const [totalRuns, setTotalRuns] = useState(() => Number(profileBundleCache?.runCount) || 0);
  const [loadingRuns, setLoadingRuns] = useState(() => !profileBundleCache);
  // Which item types the user has reacted to (liked/disliked) on the latest run.
  // Drives the journey timeline: a step counts as done only once the user has
  // actually interacted with that section.
  const [engagedTypes, setEngagedTypes] = useState(() => new Set());
  const [errorMsg, setErrorMsg] = useState('');
  // Phone flag — used to shorten the run action label so the buttons fit on one
  // line beside the run number.
  const [isPhone, setIsPhone] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 600
  );

  // Load which sections the user has interacted with (liked/disliked) on their
  // latest run, so the journey timeline can mark those steps complete.
  useEffect(() => {
    const runId = runs?.[0]?.id;
    const uid = user?.id;
    if (!runId || !uid) {
      setEngagedTypes(new Set());
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('result_feedback')
          .select('item_type')
          .eq('user_id', uid)
          .eq('assessment_run_id', runId)
          .eq('feedback_scope', 'item_reaction');
        if (error) throw error;
        if (cancelled) return;
        const set = new Set(
          (Array.isArray(data) ? data : [])
            .map((r) => String(r?.item_type || '').trim().toLowerCase())
            .filter(Boolean)
        );
        setEngagedTypes(set);
      } catch (_) {
        if (!cancelled) setEngagedTypes(new Set());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runs, user?.id]);

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
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountFinalConfirm, setDeleteAccountFinalConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [cancelDowngradeOpen, setCancelDowngradeOpen] = useState(false);
  const [cancellingDowngrade, setCancellingDowngrade] = useState(false);
  const [retakeConfirmOpen, setRetakeConfirmOpen] = useState(false);

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
      (msg.includes('lock') && msg.includes('auth-token'))
    );
  }

  async function fetchProfileBundle() {
    const [profileData, runData, runCount] = await Promise.all([
      getMyProfile(),
      listAssessmentRuns(20),
      getAssessmentRunCount(),
    ]);
    return { profileData, runData, runCount };
  }

  async function loadPageData() {
    setLoadingRuns(true);
    setErrorMsg('');

    try {
      let bundle;
      try {
        bundle = await fetchProfileBundle();
      } catch (err) {
        if (!isAuthLockNoise(err)) throw err;
        await new Promise((resolve) => setTimeout(resolve, 350));
        bundle = await fetchProfileBundle();
      }

      setProfile(bundle.profileData || null);
      setRuns(bundle.runData || []);
      setTotalRuns(Number(bundle.runCount) || 0);
    } catch (err) {
      if (await handleInvalidSession(err)) return;
      if (isAuthLockNoise(err)) return; // transient — a concurrent request handled it
      setErrorMsg(err.message || 'Failed to load profile.');
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

    let response = null;
    let lastError = null;

    for (const candidate of buildApiCandidates('/api/account/sync-stripe-subscription')) {
      try {
        response = await fetch(candidate, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (response.ok || response.status !== 404) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to connect to subscription refresh service.');
    }

    let payload = null;
    try {
      payload = await response.json();
    } catch (_) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload?.message || payload?.error || 'Failed to refresh subscription status.');
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
    profileBundleCache = { profileData: profile, runData: runs, runCount: totalRuns };
  }, [profile, runs, totalRuns]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let bundle;
        try {
          bundle = await fetchProfileBundle();
        } catch (err) {
          if (!isAuthLockNoise(err)) throw err;
          await new Promise((resolve) => setTimeout(resolve, 350));
          bundle = await fetchProfileBundle();
        }

        if (!cancelled) {
          setProfile(bundle.profileData || null);
          setRuns(bundle.runData || []);
          setTotalRuns(Number(bundle.runCount) || 0);
        }
      } catch (err) {
        if (!cancelled) {
          if (await handleInvalidSession(err)) return;
          if (isAuthLockNoise(err)) return; // transient — a concurrent request handled it
          setErrorMsg(err.message || 'Failed to load profile.');
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
  const isAdminProfile =
    Boolean(profile?.is_admin) ||
    String(profile?.email || user?.email || '').toLowerCase() === 'georgealexandridis@hotmail.com';
  const isRecurringPlan = ['plus', 'premium'].includes(currentPlanKey);
  const planIconType = currentPlanKey === 'premium' ? 'crown' : currentPlanKey === 'plus' ? 'sparkles' : 'shield';
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

    if (profile?.cancel_at_period_end && renewalDate) {
      setProfileNotice(`Your subscription will end on ${renewalDate}. You will keep ${formatPlanName(profile)} access until then.`);
      return;
    }

    if (profile?.pending_plan_change && pendingPlanDate) {
      setProfileNotice(`Your plan will change to ${pendingPlanName} on ${pendingPlanDate}. You will keep ${formatPlanName(profile)} access until then.`);
      return;
    }

    if (checkoutSuccess) {
      setProfileNotice('Your payment was successful and your CareerDNA access has been updated.');
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

  const reportLimitTitle = isRecurringPlan ? 'Monthly reports' : 'Reports left';
  const reportLimitSubtitle = isRecurringPlan ? 'Included in your plan each month' : 'Explore career reports';
  const reportLimitValue = reportUsage?.unlimited
    ? '∞'
    : isRecurringPlan
      ? toNumber(profile?.report_limit)
      : toNumber(reportUsage?.remaining);
  const reportLimitSuffix = reportUsage?.unlimited
    ? 'included'
    : isRecurringPlan
      ? 'per month'
      : 'left';

  const advisorLimitTitle = isRecurringPlan ? 'Monthly AI questions' : 'AI questions left';
  const advisorLimitSubtitle = isRecurringPlan ? 'Included in your plan each month' : 'Chat with your AI advisor';
  const advisorLimitValue = advisorUsage?.unlimited
    ? '∞'
    : isRecurringPlan
      ? toNumber(profile?.advisor_questions_limit)
      : toNumber(advisorUsage?.remaining);
  const advisorLimitSuffix = advisorUsage?.unlimited
    ? 'included'
    : isRecurringPlan
      ? 'per month'
      : 'left';


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
      setErrorMsg(err.message || 'Failed to update account details.');
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
      setErrorMsg(err.message || 'Failed to re-run output.');
    } finally {
      setRerunning(false);
    }
  };

  const handleDeleteRun = async (runId) => {
    if (!runId) return;

    try {
      setDeletingRunId(runId);
      setErrorMsg('');
      await deleteAssessmentRun(runId);
      await loadPageData();
      setDeleteConfirmRunId(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete saved result.');
    } finally {
      setDeletingRunId(null);
    }
  };



  const openPlanAction = () => {
    if (profile?.pending_plan_change) {
      setCancelDowngradeOpen(true);
      return;
    }

    setPricingModalOpen(true);
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
      setErrorMsg(err?.message || 'Could not cancel the scheduled downgrade. Please try again.');
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
      setErrorMsg(err.message || 'Could not start Google confirmation. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (usesExternalAuth && !deleteAccountFinalConfirm) {
      await handleDeleteAccountGoogleReauth();
      return;
    }

    if (!usesExternalAuth && !deleteAccountPassword) {
      setErrorMsg('Please enter your password to confirm account deletion.');
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

      let response = null;
      let lastDeleteAccountError = null;

      for (const candidate of buildApiCandidates('/api/delete-account')) {
        try {
          response = await fetch(candidate, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              confirmation: 'DELETE',
              password: usesExternalAuth ? '' : deleteAccountPassword,
              authMode: usesExternalAuth ? 'oauth' : 'password',
            }),
          });

          if (response.ok || response.status !== 404) {
            break;
          }
        } catch (err) {
          lastDeleteAccountError = err;
        }
      }

      if (!response) {
        throw lastDeleteAccountError || new Error('Failed to connect to delete-account service.');
      }

      let payload = null;
      try {
        payload = await response.json();
      } catch (_) {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Failed to delete account.');
      }

      try {
        await signOut();
      } catch (_) {
        await supabase.auth.signOut();
      }

      window.location.assign('/');
    } catch (err) {
      if (await handleInvalidSession(err)) return;
      setErrorMsg(err.message || 'Failed to delete account.');
      setDeleteAccountFinalConfirm(false);
      setDeletingAccount(false);
    }
  };

  // ---- Journey timeline (latest run) ----
  // Survey/Profile are milestones from the run itself; the exploration steps only
  // complete once the user has actually interacted (liked/disliked) on that page.
  const latestRun = runs?.[0] || null;
  const latestArchetypes = latestRun?.results_json?.archetypes || null;
  // University students explore pathways then roles; school students explore
  // career worlds then pathways. The roadmap labels/gating adapt accordingly.
  const latestStatus = String(latestRun?.intro_answers_json?.status || '').toLowerCase();
  const isUniversity = ['undergrad', 'postgrad', 'ug', 'pg', 'university', 'master', 'msc', 'mba'].some((s) => latestStatus.includes(s));
  const journeyDone = {
    survey: Boolean(latestRun),
    profile: Boolean(latestArchetypes && Object.keys(latestArchetypes).length),
    strengths: engagedTypes.has('strength'),
    environments: engagedTypes.has('environment'),
    careerworlds: isUniversity ? engagedTypes.has('pathway') : engagedTypes.has('career_world'),
    discovermore: isUniversity ? engagedTypes.has('role') : engagedTypes.has('pathway'),
    advisor: engagedTypes.has('advisor'),
  };
  const journeySteps = [
    { key: 'survey', label: 'Take your survey' },
    { key: 'profile', label: 'Meet your CareerDNA' },
    { key: 'strengths', label: 'Explore your strengths' },
    { key: 'environments', label: 'Explore your ideal environments' },
    { key: 'careerworlds', label: isUniversity ? 'Explore your pathways' : 'Explore your career worlds' },
    { key: 'discovermore', label: isUniversity ? 'Explore your roles' : 'Explore your pathways' },
    { key: 'advisor', label: 'Get advice' },
  ].map((step) => ({ ...step, done: Boolean(journeyDone[step.key]) }));
  const journeyCurrentIdx = journeySteps.findIndex((s) => !s.done);
  // The satisfaction prompt appears only once the user has been through every
  // exploration step of the journey (the AI Advisor is optional, so it's not
  // required). We ask on the profile page when they return, not mid-journey.
  const journeyCompleteExceptAdvisor = journeySteps
    .filter((s) => s.key !== 'advisor')
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
    advisor: { section: 'analysis', tab: 'advisor' },
  };
  const openRunAt = (target) => {
    if (!latestRun) return;
    navigate(`/results/run/${latestRun.id}`, {
      state: { section: target?.section || 'analysis', tab: target?.tab || '' },
    });
  };

  // Per-step icons give the roadmap character instead of identical dots.
  const journeyIconPaths = {
    survey: (<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6V7H9z" /><path d="M8.6 13l1.9 1.9 3.6-4.2" /></>),
    profile: (<><circle cx="12" cy="8" r="3.4" /><path d="M5.8 20c0-3.5 2.8-5.4 6.2-5.4s6.2 1.9 6.2 5.4" /></>),
    strengths: (<path d="M13 3 5.5 13H10l-1 8 8.5-11H13z" />),
    environments: (<><rect x="6" y="4" width="12" height="17" rx="1.5" /><path d="M9.5 8h1M13 8h1M9.5 12h1M13 12h1M9.5 16h1M13 16h1" /></>),
    careerworlds: (<><path d="M12 3v18" /><path d="M12 5.5h6.2l2.1 2.1-2.1 2.1H12" /><path d="M12 12H5.8l-2.1 2.1 2.1 2.1H12" /></>),
    discovermore: (<><rect x="4" y="8" width="16" height="11" rx="2" /><path d="M9 8V6.5A2 2 0 0 1 11 4.5h2a2 2 0 0 1 2 2V8" /><path d="M4 13h16" /></>),
    advisor: (<path d="M12 4l1.5 4.3L18 10l-4.5 1.7L12 16l-1.5-4.3L6 10l4.5-1.7z" />),
  };
  const renderJourneyIcon = (key) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {journeyIconPaths[key] || <circle cx="12" cy="12" r="3.5" />}
    </svg>
  );

  return (
    <div className="profile-page">
      <AccountNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="profile-shell">
        {/* Compact Header */}
        <header className="profile-header">
          <h1 className="profile-welcome">Welcome, {profile?.first_name || 'there'}</h1>
          <button type="button" className="profile-btn-hover-primary" style={btnPrimarySm} onClick={openProfileEditor}>
            <SettingsIcon />
            Manage Account
          </button>
        </header>

        {errorMsg ? <p className="profile-error">{errorMsg}</p> : null}
        {profileNotice ? <p className="profile-notice">{profileNotice}</p> : null}

        {/* Compact Stats Bar */}
        <div className="profile-stats-bar">
          <div className="profile-stat-item">
            <span className="profile-stat-icon">&#128100;</span>
            <span className="profile-stat-text">{fullName}</span>
          </div>
          <span className="profile-stat-divider">|</span>
          <div className="profile-stat-item">
            <span className="profile-stat-icon">&#9993;</span>
            <span className="profile-stat-text profile-stat-text--muted profile-stat-text--truncate">{profile?.email || user?.email || '—'}</span>
          </div>
          <div className="profile-stat-item profile-stat-item--highlight">
            <span className="profile-stat-icon">#</span>
            <span className="profile-stat-text profile-stat-text--bold">{totalRuns} runs</span>
          </div>
        </div>

        {!loadingRuns ? (
          <section className="profile-journey" aria-label="Your CareerDNA journey">
            <div className="profile-journey-head">
              <span className="profile-journey-title">Your roadmap</span>
            </div>
            <ol className="profile-journey-track">
              {journeySteps.map((step, i) => {
                const isCurrent = i === journeyCurrentIdx;
                const state = step.done ? 'is-done' : isCurrent ? 'is-current' : 'is-todo';
                // Before any assessment exists, the survey step is the starting
                // point and links to the survey. Once a run exists, the survey
                // step is a plain milestone (re-entering the survey is complex).
                const isStart = step.key === 'survey' && !latestRun;
                const clickable = isStart || ((step.done || isCurrent) && step.key !== 'survey');
                const inner = (
                  <>
                    <span className="profile-journey-node">
                      {renderJourneyIcon(step.key)}
                    </span>
                    <span className="profile-journey-label">{step.label}</span>
                  </>
                );
                return (
                  <li key={step.key} className={`profile-journey-step ${state}${clickable ? ' is-clickable' : ''}`}>
                    {clickable ? (
                      <button
                        type="button"
                        className="profile-journey-hit"
                        onClick={() => (isStart ? navigate('/start') : openRunAt(journeyStepTarget[step.key]))}
                        aria-label={isStart ? 'Start your assessment' : `Open ${step.label}`}
                      >
                        {inner}
                      </button>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {journeyCompleteExceptAdvisor && latestRun?.id && user?.id ? (
          <SatisfactionCard userId={user.id} assessmentRunId={latestRun.id} />
        ) : null}

        {isAdminProfile ? (
          <section className="profile-admin-panel" aria-label="Admin dashboard access">
            <div>
              <span className="profile-admin-eyebrow">Admin access</span>
              <strong>Private CareerDNA control panel</strong>
              <p>Monitor users, saved reports, activity events, and model-validation data.</p>
            </div>
            <button
              type="button"
              className="profile-admin-dashboard-btn"
              onClick={() => navigate('/admin')}
            >
              Open Admin Dashboard
            </button>
          </section>
        ) : null}

        {/* Assessment History */}
        <section className="profile-card">
          <div className="profile-card-header">
            <div className="profile-card-header-left">
              <h2 className="profile-card-title">Assessment History</h2>
              <span className="profile-card-count">{Math.min(20, totalRuns)} of {totalRuns}</span>
            </div>
            {totalRuns > 0 ? (
              <button type="button" className="profile-btn-hover-accent" style={btnAccent} onClick={handleRetake}>
                <PlayIcon />
                New Assessment
              </button>
            ) : null}
          </div>

          {loadingRuns ? (
            <div className="profile-runs-skeleton" aria-label="Loading saved runs" aria-busy="true">
              <p className="profile-runs-loading-note">Loading your assessments&hellip;</p>
              <span className="profile-run-skeleton" />
              <span className="profile-run-skeleton" />
              <span className="profile-run-skeleton" />
            </div>
          ) : runs.length === 0 ? (
            <div className="profile-empty">
              <p>You do not have any saved CareerDNA results yet.</p>
              <button type="button" className="profile-btn-hover-primary" style={btnPrimary} onClick={handleRetake}>
                Start your first assessment
              </button>
            </div>
          ) : (
            <div className="profile-runs">
              {runs.map((run, idx) => (
                <div
                  key={run.id}
                  className="profile-run-row"
                >
                  {/* Run Number */}
                  <div className="profile-run-id">
                    <span className={`profile-run-number ${idx === 0 ? 'profile-run-number--latest' : ''}`}>
                      #{totalRuns - idx}
                    </span>
                    {idx === 0 && <span className="profile-run-badge">Latest</span>}
                  </div>

                  {/* Date */}
                  <div className="profile-run-date">{compactDate(run.created_at)}</div>

                  {/* Details inline */}
                  <div className="profile-run-details">
                    <span><strong>{ageValue(run)}</strong> yrs</span>
                    <span className="profile-run-sep">|</span>
                    <span>{statusLabel(run.intro_answers_json?.status)}</span>
                    <span className="profile-run-sep profile-run-sep--hide-tablet">|</span>
                    <span className="profile-run-detail--hide-tablet">{nextStepLabel(run)}</span>
                    {subjectLabel(run) !== '—' && (
                      <>
                        <span className="profile-run-sep">|</span>
                        <span className="profile-run-subject">{subjectLabel(run)}</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="profile-run-actions">
                    <button type="button" className="profile-btn-hover-primary" style={btnPrimarySm} onClick={() => openRun(run.id)}>
                      Open Result
                    </button>
                    <button type="button" className="profile-btn-hover-outline" style={btnOutlineSm} onClick={() => openOutputParametersModal(run)}>
                      Re-run
                    </button>
                    <div className="profile-run-menu-wrap">
                      <button
                        type="button"
                        className="profile-run-menu-btn"
                        aria-label="More actions"
                        aria-haspopup="true"
                        aria-expanded={openRunMenuId === run.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenRunMenuId(openRunMenuId === run.id ? null : run.id);
                        }}
                      >
                        <MoreIcon />
                      </button>
                      {openRunMenuId === run.id ? (
                        <div className="profile-run-menu" role="menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            role="menuitem"
                            className="profile-run-menu-item profile-run-menu-item--danger"
                            onClick={() => { setOpenRunMenuId(null); setDeleteConfirmRunId(run.id); }}
                            disabled={deletingRunId === run.id}
                          >
                            <TrashIcon />
                            {deletingRunId === run.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {runs.length > 0 && showingLatestOnly && (
            <div className="profile-card-footer">
              <span className="profile-card-footer-text">Showing latest {runs.length} of {totalRuns} runs</span>
            </div>
          )}
        </section>
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
              A brand new run will be saved based on your new answers and may produce different results.
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
                          return dob ? compactDate(dob) : '—';
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
                      <span className={`profile-account-summary-icon profile-account-summary-icon--${planIconType}`}><AccountMiniIcon type={planIconType} /></span>
                      <div>
                        <span>Plan</span>
                        <strong>{planName}</strong>
                        {renewalDate || pendingPlanDate ? (
                          <div className="profile-account-plan-note">
                            {profile?.cancel_at_period_end && renewalDate
                              ? `Ends on ${renewalDate}`
                              : profile?.pending_plan_change && pendingPlanDate
                                ? `Changes to ${pendingPlanName} on ${pendingPlanDate}`
                                : `Renews on ${renewalDate}`}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="profile-account-upgrade-pill"
                        onClick={openPlanAction}
                      >
                        {profile?.pending_plan_change
                          ? 'Cancel downgrade'
                          : String(profile?.plan || 'free').toLowerCase() === 'free'
                            ? 'Upgrade'
                            : 'Manage'}
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

          if (requestedPlan === 'premium') {
            setProfileNotice('Your subscription has been upgraded to CareerDNA Premium. Your new monthly limits are now active.');
          } else if (requestedPlan === 'plus' && action === 'downgrade') {
            const nextDate = formatPendingPlanDate(updatedProfile);
            setProfileNotice(
              nextDate
                ? `Your plan will change to CareerDNA Plus on ${nextDate}. You will keep CareerDNA Premium access until then.`
                : 'Your plan will change to CareerDNA Plus at the end of your current billing period.'
            );
          } else if (requestedPlan === 'plus') {
            setProfileNotice('Your subscription has been upgraded to CareerDNA Plus. Your monthly limits are now active.');
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
              This will permanently delete your account, profile details and all saved CareerDNA results.
              This action cannot be undone.
            </p>

            {usesExternalAuth && !deleteAccountFinalConfirm ? (
            <div className="profile-delete-final-warning" role="note">
              This account is connected to Google. To protect your account, confirm with Google before deleting it.
            </div>
          ) : !usesExternalAuth ? (
            <label className="profile-form-field">
              <span>Enter your password</span>
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
                Are you absolutely sure? This permanently deletes your account and all saved CareerDNA results.
                Click the red button one more time to delete your account.
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
