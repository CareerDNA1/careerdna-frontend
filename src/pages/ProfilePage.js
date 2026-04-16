import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountNavbar from '../Components/Common/AccountNavbar';
import { useAuth } from '../context/AuthContext';
import {
  deleteAssessmentRun,
  getAssessmentRunCount,
  listAssessmentRuns,
  rerunAssessmentWithOutputParameters,
} from '../utils/assessmentRuns';
import { getMyProfile, updateMyProfileDetails } from '../utils/profile';
import IntroQuestions from '../Components/Survey/IntroQuestions';
import './ProfilePage.css';

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

function compactDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return '—';
  }
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [runs, setRuns] = useState([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editingRun, setEditingRun] = useState(null);
  const [editIntroResponses, setEditIntroResponses] = useState(defaultIntroResponses);
  const [rerunning, setRerunning] = useState(false);
  const [deletingRunId, setDeletingRunId] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', email: '' });
  const [profileNotice, setProfileNotice] = useState('');

  async function loadPageData() {
    setLoadingRuns(true);
    setErrorMsg('');

    try {
      const [profileData, runData, runCount] = await Promise.all([
        getMyProfile(),
        listAssessmentRuns(20),
        getAssessmentRunCount(),
      ]);

      setProfile(profileData || null);
      setRuns(runData || []);
      setTotalRuns(Number(runCount) || 0);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load profile.');
    } finally {
      setLoadingRuns(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [profileData, runData, runCount] = await Promise.all([
          getMyProfile(),
          listAssessmentRuns(20),
          getAssessmentRunCount(),
        ]);

        if (!cancelled) {
          setProfile(profileData || null);
          setRuns(runData || []);
          setTotalRuns(Number(runCount) || 0);
        }
      } catch (err) {
        if (!cancelled) setErrorMsg(err.message || 'Failed to load profile.');
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

  const showingLatestOnly = totalRuns > runs.length;

  const openRun = (runId) => navigate(`/results/run/${runId}`);
  const handleRetake = () => {
    const confirmed = window.confirm(
      'Are you sure you want to take the survey again? A brand new run will be saved based on your new answers and may produce different results.'
    );
    if (!confirmed) return;
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
        email: profileForm.email,
      });

      setProfile(updatedProfile || null);
      setEditingProfile(false);
      setProfileNotice('Your account details were updated. If you changed your email, Supabase may ask you to confirm the new address.');
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
    const confirmed = window.confirm('Are you sure you want to delete this saved result? This cannot be undone.');
    if (!confirmed) return;

    try {
      setDeletingRunId(runId);
      setErrorMsg('');
      await deleteAssessmentRun(runId);
      await loadPageData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete saved result.');
    } finally {
      setDeletingRunId(null);
    }
  };

  return (
    <div className="profile-page">
      <AccountNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="profile-shell">
        <section className="profile-hero-card">
          <div className="profile-hero-top">
            <div className="profile-pill">CareerDNA Account</div>

            <button type="button" className="profile-button profile-button--secondary" onClick={openProfileEditor}>
              Edit Details
            </button>
          </div>

          {errorMsg ? <p className="profile-error">{errorMsg}</p> : null}
          {profileNotice ? <p className="profile-notice">{profileNotice}</p> : null}

          <div className="profile-stats-grid">
            {[
              { label: 'Full name', value: fullName, isEmail: false },
              { label: 'Email', value: profile?.email || user?.email || '—', isEmail: true },
              { label: 'Joined', value: joined, isEmail: false },
              { label: 'Saved runs', value: String(totalRuns || 0), isEmail: false },
            ].map((item, idx) => (
              <div key={idx} className="profile-stat-card">
                <div className="profile-stat-label">{item.label}</div>
                <div
                  title={item.value}
                  className={`profile-stat-value ${item.isEmail ? 'profile-stat-value--email' : ''}`}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="profile-section-card">
          <div className="saved-results-header">
            <div className="saved-results-top">
              <div className="profile-pill">Saved Results</div>

              <button type="button" className="profile-button profile-button--secondary" onClick={handleRetake}>
                Take Survey Again
              </button>
            </div>

            <p className="saved-results-subtitle">
              Review your saved CareerDNA runs, compare how your output changes over time, and launch a fresh assessment whenever you want.
            </p>
          </div>

          {showingLatestOnly ? (
            <div className="saved-results-banner">
              You currently have <strong>{totalRuns}</strong> saved runs. This page is showing the latest <strong>{runs.length}</strong> only, so older runs are not being overwritten, just hidden from this view for now.
            </div>
          ) : null}

          {totalRuns >= 20 ? (
            <div className="saved-results-note">
              You have reached a large number of saved runs. You can delete older visible results here using the × button.
            </div>
          ) : null}

          {loadingRuns ? (
            <p>Loading saved runs...</p>
          ) : runs.length === 0 ? (
            <div className="empty-runs-card">
              <p className="empty-runs-text">You do not have any saved CareerDNA results yet.</p>
              <button type="button" className="profile-button profile-button--primary" onClick={handleRetake}>
                Start your first assessment
              </button>
            </div>
          ) : (
            <div className="saved-runs-grid">
              {runs.map((run, idx) => (
                <article key={run.id} className={`saved-run-card ${idx === 0 ? 'saved-run-card--latest' : ''}`}>
                  <div className="saved-run-main">
                    <div className="saved-run-meta-column">
                      <div className="saved-run-title-row">
                        <div className="saved-run-title">Run {totalRuns - idx}</div>
                        {idx === 0 ? <span className="saved-run-badge">Latest</span> : null}
                      </div>
                      <div className="saved-run-date">{compactDate(run.created_at)}</div>
                      <button
                        type="button"
                        className="saved-run-delete"
                        aria-label="Delete saved result"
                        title="Delete saved result"
                        onClick={() => handleDeleteRun(run.id)}
                        disabled={deletingRunId === run.id}
                      >
                        {deletingRunId === run.id ? '…' : '×'}
                      </button>
                    </div>

                    <div className="saved-run-details-grid">
                      <div>
                        <div className="saved-run-label">Age</div>
                        <div className="saved-run-value">{run.intro_answers_json?.age || '—'}</div>
                      </div>
                      <div>
                        <div className="saved-run-label">Current status</div>
                        <div className="saved-run-value">{statusLabel(run.intro_answers_json?.status)}</div>
                      </div>
                      <div>
                        <div className="saved-run-label">Next step</div>
                        <div className="saved-run-value">{nextStepLabel(run)}</div>
                      </div>
                      <div>
                        <div className="saved-run-label">Subjects of interest</div>
                        <div className="saved-run-value">{subjectLabel(run)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="saved-run-actions">
                    <button type="button" className="profile-button profile-button--primary" onClick={() => openRun(run.id)}>
                      Open Result
                    </button>
                    <button
                      type="button"
                      className="profile-button profile-button--ghost"
                      onClick={() => openOutputParametersModal(run)}
                    >
                      Change Output Parameters
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>


      {editingProfile ? (
        <div className="profile-modal-overlay" onClick={closeProfileEditor}>
          <div className="profile-modal-card profile-modal-card--compact" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div>
                <h2 className="profile-modal-title">Edit Account Details</h2>
                <p className="profile-modal-copy">
                  Update the name and email shown on your CareerDNA account.
                </p>
              </div>
              <button
                type="button"
                className="profile-button profile-button--secondary"
                onClick={closeProfileEditor}
              >
                Close
              </button>
            </div>

            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              <div className="profile-form-grid">
                <label className="profile-form-field">
                  <span>First name</span>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </label>

                <label className="profile-form-field">
                  <span>Last name</span>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </label>
              </div>

              <label className="profile-form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </label>

              <div className="profile-edit-actions">
                <button type="submit" className="profile-button profile-button--primary" disabled={savingProfile}>
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingRun ? (
        <div className="profile-modal-overlay" onClick={closeOutputParametersModal}>
          <div className="profile-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <div>
                <h2 className="profile-modal-title">Change Output Parameters</h2>
                <p className="profile-modal-copy">
                  Update the output parameters for this saved run and then create a new result using the same survey answers.
                </p>
              </div>
              <button
                type="button"
                className="profile-button profile-button--secondary"
                onClick={closeOutputParametersModal}
              >
                Close
              </button>
            </div>

            <IntroQuestions
              introResponses={editIntroResponses}
              setIntroResponses={setEditIntroResponses}
              onStartSurvey={handleRerunOutput}
              mode="edit"
              submitLabel="Create Updated Result"
            />

            {rerunning ? (
              <p className="profile-modal-status">
                Preparing your updated result. The new saved run will be created first, and then you can run the AI analysis from its result page.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
