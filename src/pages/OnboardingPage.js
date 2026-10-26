import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SurveyWrapper from '../Components/Survey/SurveyWrapper';
import IntroQuestions from '../Components/Survey/IntroQuestions';
import InlineError from '../Components/Common/InlineError';
import { getAcademicStatus, saveAcademicStatus, describeStatus, schoolYearValue } from '../utils/academicStatus';
import { saveIdentityProfile } from '../utils/identityProfile';
import { ageFromDOB } from '../utils/educationProgression';
import { friendlyError } from '../utils/friendlyError';
import './OnboardingPage.css';

// First login: where you are. Shown once (until onboarding_completed_at is
// set) before anything else in the app. The same questions and rules as the
// old survey intro (age gate, date of birth lock, subject of interest
// warnings), but the answers are saved to the profile, not to a run.
//
// Existing accounts arrive with the answers prefilled from their latest
// report (sql/16 backfill), so for them this is a confirmation.

const ageBandFromDOB = (dob) => {
  const a = ageFromDOB(dob);
  if (a === null || Number.isNaN(a)) return '';
  if (a <= 15) return '13-15';
  if (a <= 18) return '16-18';
  if (a <= 21) return '19-21';
  if (a <= 24) return '22-24';
  return '25+';
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState('form'); // form | confirm
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const destination = location.state?.from?.pathname || '/profile';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await getAcademicStatus();
        if (cancelled) return;
        if (p?.onboarding_completed_at) { navigate(destination, { replace: true }); return; }
        setProfile(p);
        const prev = (p && p.academic_status) || {};
        setAnswers({
          name: prev.name || '',
          country: prev.country || p?.country || '',
          dateOfBirth: p?.date_of_birth || prev.dateOfBirth || '',
          age: ageBandFromDOB(p?.date_of_birth || prev.dateOfBirth || ''),
          status: prev.status || '',
          statusGroup: prev.statusGroup || undefined,
          institution: prev.institution || '',
          institutionId: prev.institutionId || '',
          // Year group as it is this year (chosen year plus Septembers since).
          schoolYear: schoolYearValue(prev),
          schoolYearSetYear: prev.schoolYearSetYear || undefined,
          planUniversity: prev.planUniversity || undefined,
          schoolScope: prev.schoolScope || '',
          schoolSubjects: Array.isArray(prev.schoolSubjects) ? prev.schoolSubjects : [],
          uniSubject: prev.uniSubject || '',
          courseYear: prev.courseYear || undefined,
          courseStartYear: prev.courseStartYear || p?.course_start_year || undefined,
          uniNeed: prev.uniNeed || '',
          currentActivity: prev.currentActivity || '',
        });
      } catch (e) {
        if (!cancelled) setError(friendlyError(e, 'load your account').message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [navigate, destination]);

  const summary = useMemo(() => describeStatus({ ...(profile || {}), academic_status: answers, stage: null, date_of_birth: answers.dateOfBirth || profile?.date_of_birth, institution_name: answers.institution, course_start_year: answers.courseStartYear }), [answers, profile]);

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      // Date of birth and country keep their existing lock rules.
      await saveIdentityProfile({
        dateOfBirth: answers.dateOfBirth,
        country: answers.country,
        educationLevel: answers.status === 'school' ? 'school' : (answers.status || undefined),
        courseStartYear: answers.courseStartYear,
      });
      await saveAcademicStatus(answers, { source: 'onboarding', kind: 'onboarded', markOnboarded: true });
      navigate(destination, { replace: true });
    } catch (e) {
      setError(friendlyError(e, 'save your details').message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SurveyWrapper hideBack>
        <div className="onboarding-wait" role="status" aria-live="polite">
          <span className="cdna-spinner" aria-hidden="true" />
          <span>Loading your account…</span>
        </div>
      </SurveyWrapper>
    );
  }

  const prefilled = Boolean(profile?.academic_status);

  return (
    <SurveyWrapper hideBack>
      {step === 'form' ? (
        <IntroQuestions
          introResponses={answers}
          setIntroResponses={setAnswers}
          onStartSurvey={() => setStep('confirm')}
          submitLabel="Continue"
          heading={prefilled ? 'Is this still right?' : 'Tell us about you'}
          introText={prefilled
            ? 'We have filled this in from your last report. Check it, change anything that is out of date, then continue.'
            : 'A few quick questions about you and your studies, so CareerDNA can tailor your results to you. You only need to do this once, so please check your answers carefully.'}
        />
      ) : (
        <section className="onboarding-confirm" aria-labelledby="onboardingConfirmTitle">
          <h2 id="onboardingConfirmTitle">Here is what we have</h2>
          <p className="onboarding-confirm__headline">{summary.headline || 'Your details'}</p>
          <dl className="onboarding-confirm__list">
            <div><dt>Country</dt><dd>{answers.country || '—'}</dd></div>
            <div><dt>Date of birth</dt><dd>{answers.dateOfBirth ? new Date(answers.dateOfBirth).toLocaleDateString('en-GB') : '—'}</dd></div>
            {answers.institution ? <div><dt>{answers.status === 'school' ? 'School or college' : 'University'}</dt><dd>{answers.institution}</dd></div> : null}
            {answers.uniSubject ? <div><dt>Course</dt><dd>{answers.uniSubject}</dd></div> : null}
            {Array.isArray(answers.schoolSubjects) && answers.schoolSubjects.length ? <div><dt>Subject of interest</dt><dd>{answers.schoolSubjects.join(', ')}</dd></div> : null}
          </dl>
          <p className="onboarding-confirm__note">Please check these before you confirm. Your date of birth and country are fixed; to correct either, email support@mycareerdna.io. Your status and your school or university can be updated once a school year, when you make a new report.</p>
          {error ? <InlineError message={error} onRetry={handleConfirm} /> : null}
          <div className="onboarding-confirm__actions">
            <button type="button" className="onboarding-confirm__secondary" onClick={() => setStep('form')} disabled={saving}>Change something</button>
            <button type="button" className="onboarding-confirm__primary" onClick={handleConfirm} disabled={saving}>{saving ? 'Saving…' : 'Confirm'}</button>
          </div>
        </section>
      )}
    </SurveyWrapper>
  );
}
