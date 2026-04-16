// src/Components/Survey/IntroQuestions.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Select from 'react-select';
import Button from '../Common/Button';
import './IntroQuestions.css';

const countryOptions = [
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Canada', label: 'Canada' },
  { value: 'China', label: 'China' },
  { value: 'France', label: 'France' },
  { value: 'Germany', label: 'Germany' },
  { value: 'India', label: 'India' },
  { value: 'United States', label: 'United States' },
  { value: 'Other', label: 'Other' },
];

const ageOptions = [
  { value: '13-15', label: '13–15' },
  { value: '16-18', label: '16–18' },
  { value: '19-21', label: '19–21' },
  { value: '22-24', label: '22–24' },
  { value: '25+', label: '25+' },
];

const statusOptions = [
  { value: 'school',        label: 'I’m at school' },
  { value: 'undergraduate', label: 'I’m at university' },
  { value: 'postgraduate',  label: 'I’m a postgraduate student' },
  { value: 'other',         label: 'Other' },
];

const subjectOptions = [
  { value: 'Accounting & Finance', label: 'Accounting & Finance' },
  { value: 'Architecture & Urban Planning', label: 'Architecture & Urban Planning' },
  { value: 'Art & Design', label: 'Art & Design' },
  { value: 'Biological Sciences', label: 'Biological Sciences' },
  { value: 'Business & Management', label: 'Business & Management' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Communication & Media', label: 'Communication & Media' },
  { value: 'Computer Science & IT', label: 'Computer Science & IT' },
  { value: 'Criminology', label: 'Criminology' },
  { value: 'Data Science & AI', label: 'Data Science & AI' },
  { value: 'Drama & Performing Arts', label: 'Drama & Performing Arts' },
  { value: 'Economics', label: 'Economics' },
  { value: 'Education', label: 'Education' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Environmental Science', label: 'Environmental Science' },
  { value: 'Fashion', label: 'Fashion' },
  { value: 'Film & TV', label: 'Film & TV' },
  { value: 'Geography', label: 'Geography' },
  { value: 'History', label: 'History' },
  { value: 'International Relations', label: 'International Relations' },
  { value: 'Languages & Linguistics', label: 'Languages & Linguistics' },
  { value: 'Law', label: 'Law' },
  { value: 'Marketing & Advertising', label: 'Marketing & Advertising' },
  { value: 'Mathematics & Statistics', label: 'Mathematics & Statistics' },
  { value: 'Medicine & Health Sciences', label: 'Medicine & Health Sciences' },
  { value: 'Music', label: 'Music' },
  { value: 'Nursing & Midwifery', label: 'Nursing & Midwifery' },
  { value: 'Philosophy', label: 'Philosophy' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Politics', label: 'Politics' },
  { value: 'Psychology', label: 'Psychology' },
  { value: 'Social Sciences', label: 'Social Sciences' },
  { value: 'Sociology', label: 'Sociology' },
  { value: 'Sport Science', label: 'Sport Science' },
  { value: 'Theology & Religious Studies', label: 'Theology & Religious Studies' },
  { value: 'Travel, Tourism & Hospitality', label: 'Travel, Tourism & Hospitality' },
  { value: 'Veterinary Science', label: 'Veterinary Science' },
  { value: 'Other', label: 'Other' },
];

const schoolScopeOptions = [
  { value: 'gcse',            label: 'Choose GCSEs (or equivalent)' },
  { value: 'alevels',         label: 'Choose A-Levels (or equivalent)' },
  { value: 'apply_uni',       label: 'Apply to university or college' },
  { value: 'apprenticeship',  label: 'Explore apprenticeships' },
  { value: 'full_time_jobs',  label: 'Explore full-time jobs' },
  { value: 'not_sure',        label: 'Not sure yet' },
];

const getUniOptions = (status) => {
  if (status === 'postgraduate') {
    return [
      { value: 'apply_further_postgrad', label: 'Apply for further postgraduate study' },
      { value: 'explore_internships',    label: 'Explore internships or placements' },
      { value: 'explore_full_time',      label: 'Explore full-time roles' },
      { value: 'explore_specialisms',    label: 'Explore other specialisms/subjects' },
    ];
  }
  return [
    { value: 'apply_postgrad',       label: 'Apply for postgraduate study' },
    { value: 'explore_internships',  label: 'Explore internships or placements' },
    { value: 'explore_full_time',    label: 'Explore full-time roles' },
    { value: 'explore_specialisms',  label: 'Explore other specialisms/subjects' },
  ];
};

const portalStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 60001 }),
  menu: (base) => ({ ...base, zIndex: 60001 }),
};

const IntroQuestions = ({
  introResponses,
  setIntroResponses,
  onStartSurvey,
  mode = 'start',
  submitLabel = 'Discover your Career DNA!',
}) => {
  const [isComplete, setIsComplete] = useState(false);
  const isEditMode = mode === 'edit';

  const [touched, setTouched] = useState({});
  const setFieldTouched = (name) => setTouched((t) => ({ ...t, [name]: true }));

  const errors = useMemo(() => {
    const v = introResponses || {};
    const out = {};
    if (!v.name || !v.name.trim()) out.name = 'Please enter your first name.';
    if (!v.country) out.country = 'Please select your country.';
    if (!v.age) out.age = 'Please select your age range.';
    if (!v.status) out.status = 'Please select your current status.';

    if (['school', 'undergraduate', 'postgraduate'].includes(v.status)) {
      if (!v.institution || !v.institution.trim()) {
        out.institution = v.status === 'school'
          ? 'Please enter your school.'
          : 'Please enter your college or university.';
      }
    }

    if (v.status === 'undergraduate' || v.status === 'postgraduate') {
      if (!v.uniNeed) out.uniNeed = 'Please select your next step.';
      if (!v.uniSubject) out.uniSubject = 'Please choose your subject.';
    }

    if (v.status === 'school') {
      if (!v.planUniversity) out.planUniversity = 'Please tell us if you plan to study at university.';
      if (!v.schoolScope) out.schoolScope = 'Please select your next step.';
      if (v.schoolSubjects !== undefined && !Array.isArray(v.schoolSubjects)) {
        out.schoolSubjects = 'Please choose subjects from the list (or leave it blank).';
      }
    }

    if (v.status === 'other') {
      if (!v.currentActivity || !v.currentActivity.trim()) {
        out.currentActivity = 'Please tell us what you are doing right now.';
      }
      if (!v.planUniversity) out.planUniversity = 'Please tell us if you plan to study at university.';
      if (!v.schoolScope) out.schoolScope = 'Please select your next step.';
    }

    return out;
  }, [introResponses]);

  useEffect(() => {
    setIsComplete(Object.keys(errors).length === 0);
  }, [errors]);

  const prevStatusRef = useRef(introResponses?.status);
  const SCROLL_OFFSET = 96;

  const scrollToEl = (el) => {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.pageYOffset - SCROLL_OFFSET;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const statusWrapRef = useRef(null);
  const STATUS_MENU_ESTIMATE = 300;

  const nudgeDownIfMenuCuts = (el, est = STATUS_MENU_ESTIMATE) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const overflow = rect.bottom + est - window.innerHeight;
    if (overflow > 0) window.scrollBy({ top: overflow + 12, behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    } catch {}
    if (!isEditMode) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      setTimeout(() => window.scrollTo(0, 0), 0);
    }
  }, [isEditMode]);

  useEffect(() => {
    const curr = introResponses?.status;
    if (!curr) return;
    const prev = prevStatusRef.current;
    if (prev === curr) return;
    prevStatusRef.current = curr;

    requestAnimationFrame(() => {
      const target =
        document.getElementById('institutionInput') ||
        document.getElementById('otherActivityInput') ||
        document.getElementById('statusSelect');
      scrollToEl(target);
    });
  }, [introResponses?.status]);

  useEffect(() => {
    if (introResponses?.schoolScope === 'full_time_roles') {
      setIntroResponses(prev => ({ ...prev, schoolScope: 'full_time_jobs' }));
    }
  }, [introResponses?.schoolScope, setIntroResponses]);

  useEffect(() => {
    const st = introResponses?.status;
    const need = introResponses?.uniNeed;
    if (!need) return;

    const mapCommon = {
      internships:  'explore_internships',
      full_time:    'explore_full_time',
      specialism:   'explore_specialisms',
      cv:           '',
    };

    let mapped = mapCommon[need];
    if (!mapped && need === 'apply_masters') {
      mapped = (st === 'postgraduate') ? 'apply_further_postgrad' : 'apply_postgrad';
    }
    if (mapped !== undefined && mapped !== need) {
      setIntroResponses(prev => ({ ...prev, uniNeed: mapped || undefined }));
    }
  }, [introResponses?.uniNeed, introResponses?.status, setIntroResponses]);

  const handleChange = (field, value) => {
    setIntroResponses(prev => ({ ...prev, [field]: value }));
  };

  const status = introResponses.status;
  const isSchool = status === 'school';
  const isUni = status === 'undergraduate' || status === 'postgraduate';
  const isOther = status === 'other';

  const institutionLabel =
    isSchool ? 'Which school are you at?' :
    (isUni ? 'Which college or university are you at?' : '');

  const uniOptions = isUni ? getUniOptions(status) : [];

  const hasErr = (key) => !!errors[key] && !!touched[key];
  const errMsg = (key) => hasErr(key) ? errors[key] : '';

  return (
    <div className="intro-container">
      {!isEditMode && (
        <>
          <h2>Before we begin...</h2>
          <p className="intro-text">
            We’d love to ask a few quick questions to tailor your results and help us understand what you’d like CareerDNA to help you with.
            Your answers are used only to personalise your report and to collect anonymous, aggregated stats.
          </p>
        </>
      )}

      <div className={`field ${hasErr('name') ? 'has-error' : ''}`}>
        <div className="label-row">
          <label htmlFor="firstNameInput" className="required">What’s your first name?</label>
          {!isEditMode && <span className="field-hint">We only use your first name to personalise your results!</span>}
        </div>
        <input
          id="firstNameInput"
          type="text"
          value={introResponses.name || ''}
          onChange={e => handleChange('name', e.target.value)}
          onBlur={() => setFieldTouched('name')}
          placeholder="First name"
          aria-invalid={hasErr('name') ? 'true' : 'false'}
          aria-describedby={hasErr('name') ? 'nameError' : undefined}
        />
        {hasErr('name') && <div id="nameError" className="error-text">{errMsg('name')}</div>}
      </div>

      <div className={`field ${hasErr('country') ? 'has-error' : ''}`} id="countrySelect">
        <label className="required">Which country are you currently living in?</label>
        <Select
          classNamePrefix="introSelect"
          options={countryOptions}
          value={countryOptions.find(opt => opt.value === introResponses.country) || null}
          onChange={selected => handleChange('country', selected.value)}
          onBlur={() => setFieldTouched('country')}
          placeholder="Select your country"
          aria-invalid={hasErr('country') ? 'true' : 'false'}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          styles={portalStyles}
        />
        {hasErr('country') && <div className="error-text">{errMsg('country')}</div>}
      </div>

      <div className={`field ${hasErr('age') ? 'has-error' : ''}`} id="ageSelect">
        <label className="required">How old are you?</label>
        <Select
          classNamePrefix="introSelect"
          options={ageOptions}
          value={ageOptions.find(opt => opt.value === introResponses.age) || null}
          onChange={selected => handleChange('age', selected.value)}
          onBlur={() => setFieldTouched('age')}
          placeholder="Select your age range"
          aria-invalid={hasErr('age') ? 'true' : 'false'}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          styles={portalStyles}
        />
        {hasErr('age') && <div className="error-text">{errMsg('age')}</div>}
      </div>

      <div className={`field ${hasErr('status') ? 'has-error' : ''}`} id="statusSelect">
        <label className="required" htmlFor="statusSelect">What’s your current status?</label>
        <div ref={statusWrapRef}>
          <Select
            classNamePrefix="introSelect"
            options={statusOptions}
            value={statusOptions.find(opt => opt.value === status) || null}
            onChange={selected => handleChange('status', selected.value)}
            onBlur={() => setFieldTouched('status')}
            placeholder="Select your current status"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
            menuPlacement="auto"
            onMenuOpen={() => nudgeDownIfMenuCuts(statusWrapRef.current)}
            styles={portalStyles}
            aria-invalid={hasErr('status') ? 'true' : 'false'}
          />
        </div>
        {hasErr('status') && <div className="error-text">{errMsg('status')}</div>}
      </div>

      {(isSchool || isUni) && (
        <div className={`field ${hasErr('institution') ? 'has-error' : ''}`}>
          <label htmlFor="institutionInput" className="required">{institutionLabel}</label>
          <input
            id="institutionInput"
            type="text"
            value={introResponses.institution || ''}
            onChange={e => handleChange('institution', e.target.value)}
            onBlur={() => setFieldTouched('institution')}
            placeholder={isSchool ? 'Type your school name' : 'Type your college or university name'}
            aria-invalid={hasErr('institution') ? 'true' : 'false'}
            aria-describedby={hasErr('institution') ? 'institutionError' : undefined}
          />
          {hasErr('institution') && <div id="institutionError" className="error-text">{errMsg('institution')}</div>}
        </div>
      )}

      {isOther && (
        <div className={`field ${hasErr('currentActivity') ? 'has-error' : ''}`}>
          <label htmlFor="otherActivityInput" className="required">What are you doing right now?</label>
          <input
            id="otherActivityInput"
            type="text"
            value={introResponses.currentActivity || ''}
            onChange={e => handleChange('currentActivity', e.target.value)}
            onBlur={() => setFieldTouched('currentActivity')}
            placeholder="e.g., Working, gap year, training course, not currently studying"
            aria-invalid={hasErr('currentActivity') ? 'true' : 'false'}
            aria-describedby={hasErr('currentActivity') ? 'currentActivityError' : undefined}
          />
          {hasErr('currentActivity') && <div id="currentActivityError" className="error-text">{errMsg('currentActivity')}</div>}
        </div>
      )}

      {(isSchool || isOther) && (
        <>
          <div className={`field ${hasErr('planUniversity') ? 'has-error' : ''}`}>
            <label className="required">Do you plan to go to university?</label>
            <Select
              classNamePrefix="introSelect"
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'unsure', label: 'Not sure yet' },
              ]}
              value={
                ['yes', 'no', 'unsure'].includes(introResponses.planUniversity)
                  ? {
                      value: introResponses.planUniversity,
                      label:
                        introResponses.planUniversity === 'unsure'
                          ? 'Not sure yet'
                          : introResponses.planUniversity.charAt(0).toUpperCase() +
                            introResponses.planUniversity.slice(1),
                    }
                  : null
              }
              onChange={selected => handleChange('planUniversity', selected.value)}
              onBlur={() => setFieldTouched('planUniversity')}
              placeholder="Do you plan to study at university?"
              aria-invalid={hasErr('planUniversity') ? 'true' : 'false'}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              styles={portalStyles}
            />
            {hasErr('planUniversity') && <div className="error-text">{errMsg('planUniversity')}</div>}
          </div>

          <div className={`field ${hasErr('schoolScope') ? 'has-error' : ''}`} id="schoolScopeSelect">
            <label className="required">What’s your next step right now?</label>
            <Select
              classNamePrefix="introSelect"
              options={schoolScopeOptions}
              value={schoolScopeOptions.find(opt => opt.value === introResponses.schoolScope) || null}
              onChange={selected => handleChange('schoolScope', selected.value)}
              onBlur={() => setFieldTouched('schoolScope')}
              placeholder="Select your next step"
              aria-invalid={hasErr('schoolScope') ? 'true' : 'false'}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              styles={portalStyles}
            />
            {hasErr('schoolScope') && <div className="error-text">{errMsg('schoolScope')}</div>}
          </div>

          <div className={`field ${hasErr('schoolSubjects') ? 'has-error' : ''}`} id="schoolSubjects">
            <label>Which subjects interest you most? <span style={{ fontWeight: 400, color: '#6b7280' }}>(optional)</span></label>
            <Select
              classNamePrefix="introSelect"
              isMulti
              options={subjectOptions}
              value={subjectOptions.filter(opt =>
                Array.isArray(introResponses.schoolSubjects)
                  ? introResponses.schoolSubjects.includes(opt.value)
                  : false
              )}
              onChange={selected =>
                handleChange(
                  'schoolSubjects',
                  selected && selected.length > 0 ? selected.map(s => s.value) : []
                )
              }
              placeholder="Choose your subject interests"
              closeMenuOnSelect={false}
              onBlur={() => setFieldTouched('schoolSubjects')}
              aria-invalid={hasErr('schoolSubjects') ? 'true' : 'false'}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              styles={portalStyles}
            />
            {!isEditMode && (
              <div className="subject-callout" role="status" aria-live="polite">
                Only include subjects if you already feel strongly about them. If you're open to discovering new possibilities,
                feel free to leave this blank and CareerDNA will help you explore your full potential.
              </div>
            )}
            {hasErr('schoolSubjects') && <div className="error-text">{errMsg('schoolSubjects')}</div>}
          </div>
        </>
      )}

      {isUni && (
        <>
          <div className={`field ${hasErr('uniNeed') ? 'has-error' : ''}`} id="uniScopeSelect">
            <label className="required">What’s your next step right now?</label>
            <Select
              classNamePrefix="introSelect"
              options={uniOptions}
              value={uniOptions.find(opt => opt.value === introResponses.uniNeed) || null}
              onChange={selected => handleChange('uniNeed', selected.value)}
              onBlur={() => setFieldTouched('uniNeed')}
              placeholder="Select your next step"
              aria-invalid={hasErr('uniNeed') ? 'true' : 'false'}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              styles={portalStyles}
            />
            {hasErr('uniNeed') && <div className="error-text">{errMsg('uniNeed')}</div>}
          </div>

          <div className={`field ${hasErr('uniSubject') ? 'has-error' : ''}`} id="uniSubjectSelect">
            <label className="required">What subject are you studying (or did you study)?</label>
            <Select
              classNamePrefix="introSelect"
              options={subjectOptions}
              value={subjectOptions.find(opt => opt.value === introResponses.uniSubject) || null}
              onChange={selected => handleChange('uniSubject', selected ? selected.value : '')}
              onBlur={() => setFieldTouched('uniSubject')}
              placeholder="Choose your university subject"
              isClearable
              aria-invalid={hasErr('uniSubject') ? 'true' : 'false'}
              menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              menuPosition="fixed"
              styles={portalStyles}
            />
            {hasErr('uniSubject') && <div className="error-text">{errMsg('uniSubject')}</div>}
          </div>
        </>
      )}

      <div className="intro-start-wrap">
        <Button
          type="primary"
          size="lg"
          shine
          onClick={onStartSurvey}
          disabled={!isComplete}
          aria-label={submitLabel}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};

export default IntroQuestions;
