import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../utils/friendlyError';
import { isStrongPassword, PASSWORD_RULES_TEXT } from '../utils/passwordRules';
import { consumePostLoginPath, readOAuthErrorFromUrl, storePostLoginPath } from '../utils/postLoginPath';
import PasswordRequirements from '../Components/Common/PasswordRequirements';
import { getMyProfile, isCompleteProfile, syncProfileFromAuthUser } from '../utils/profile';
import logo from '../Assets/images/logo-career-dna.png';
import './AuthPage.css';
import { CAREERDNA_LEGAL_VERSION, LegalModal } from './LegalPage';

const GOOGLE_AUTH_INTENT_KEY = 'cdna_google_auth_intent';

function AuthInputIcon({ type }) {
  const icons = {
    user: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 12.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z" />
        <path d="M5.8 20a6.2 6.2 0 0 1 12.4 0" />
      </svg>
    ),
    email: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.8 6.8h14.4v10.4H4.8V6.8Z" />
        <path d="m5.2 7.4 6.8 5.2 6.8-5.2" />
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6.8 10.4h10.4v8H6.8v-8Z" />
        <path d="M9 10.4V8a3 3 0 0 1 6 0v2.4" />
      </svg>
    ),
  };

  return <span className="auth-input-icon">{icons[type]}</span>;
}

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3.8 12s3-5.6 8.2-5.6S20.2 12 20.2 12s-3 5.6-8.2 5.6S3.8 12 3.8 12Z" />
      <path d="M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3.8 12s3-5.6 8.2-5.6S20.2 12 20.2 12s-3 5.6-8.2 5.6S3.8 12 3.8 12Z" />
      <path d="M12 14.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z" />
      <path d="M4.8 19.2 19.2 4.8" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.1 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2c-2.1 1.5-4.7 2.4-7.3 2.4-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.4 5.5-6.2 7.1l6.2 5.2C35 40 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

function AuthTrustStrip() {
  return (
    <div className="auth-trust-strip" aria-label="CareerDNA account benefits">
      <div className="auth-trust-item"><span className="auth-trust-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 3.6 18.2 6v5.2c0 4.1-2.5 7.5-6.2 9.1-3.7-1.6-6.2-5-6.2-9.1V6L12 3.6Z" /><path d="m9.4 12.2 1.7 1.7 3.7-4" /></svg></span><span><strong>Secure & private</strong><small>Your data is protected</small></span></div>
      <div className="auth-trust-item"><span className="auth-trust-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 12.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z" /><path d="M5.6 20a6.4 6.4 0 0 1 12.8 0" /></svg></span><span><strong>Personalised for you</strong><small>Insights that match you</small></span></div>
      <div className="auth-trust-item"><span className="auth-trust-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M13.5 5.2c2.9.2 4.9 1.4 6 3.5-1.3 3.8-3.8 6.3-7.6 7.6-2.1-1.1-3.3-3.1-3.5-6l5.1-5.1Z" /><path d="m8.4 10.3-3.1 1.2 2.1 2.1" /><path d="m13.7 15.6-1.2 3.1-2.1-2.1" /><path d="M15.2 8.8h.01" /></svg></span><span><strong>Explore your future</strong><small>Study and career pathways</small></span></div>
    </div>
  );
}

const googleButtonStyle = {
  width: '100%',
  minHeight: '44px',
  marginBottom: '14px',
  border: '1px solid #d2dff0',
  borderRadius: '12px',
  background: '#ffffff',
  color: '#1f2a37',
  fontFamily: 'var(--cdna-font-sans, inherit)',
  fontSize: '0.96rem',
  fontWeight: 600,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '11px',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
};

const inlineLegalButtonStyle = {
  border: 0,
  padding: 0,
  margin: 0,
  background: 'transparent',
  font: 'inherit',
  cursor: 'pointer',
  color: '#2563eb',
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
};

const googleCompletionCardStyle = {
  maxWidth: '720px',
  padding: '44px 52px 40px',
};

const googleAccountBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  margin: '20px auto 22px',
  padding: '14px 18px',
  maxWidth: '460px',
  borderRadius: '18px',
  background: '#f8fbff',
  border: '1px solid #dce8ff',
  color: '#1f2a37',
  textAlign: 'left',
};

const googleAccountIconStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '999px',
  background: '#ffffff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
  flex: '0 0 auto',
};

const googleLegalPanelStyle = {
  margin: '0 auto 20px',
  padding: '18px 20px',
  maxWidth: '560px',
  borderRadius: '18px',
  background: '#ffffff',
  border: '1px solid #dce8ff',
  boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
};

const googleCompletionActionsStyle = {
  width: '100%',
  maxWidth: '560px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const googleCompletionPrimaryButtonStyle = {
  width: '100%',
  maxWidth: '100%',
};

const googleCompletionBackButtonStyle = {
  border: 0,
  padding: 0,
  margin: '12px auto 0',
  background: 'transparent',
  color: '#2563eb',
  fontFamily: 'var(--cdna-font-sans, inherit)',
  fontSize: '0.95rem',
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: '3px',
  cursor: 'pointer',
};

// Age: CareerDNA is for ages 13 and over (UK GDPR). At signup the person
// confirms this with a tick; the date of birth is asked once in the
// questionnaire intro, where it is used to tailor options by stage.
export default function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [confirmedAge, setConfirmedAge] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const [checkingGoogleAccount, setCheckingGoogleAccount] = useState(false);
  const [googleCompletionMode, setGoogleCompletionMode] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState(null);

  // Google (or Supabase) can send the person back here with an error in the
  // URL. Show it in the usual error slot and tidy the address bar.
  useEffect(() => {
    const oauthError = readOAuthErrorFromUrl();
    if (oauthError) setErrorMsg(friendlyError(oauthError, 'sign you in with Google').message);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function handleExistingGoogleSession() {
      if (!user) return;

      const isGoogleUser =
        user.app_metadata?.provider === 'google' ||
        user.identities?.some((identity) => identity.provider === 'google');

      if (!isGoogleUser) {
        navigate(consumePostLoginPath('/profile'), { replace: true });
        return;
      }

      try {
        setCheckingGoogleAccount(true);
        const profile = await getMyProfile();
        if (cancelled) return;

        if (isCompleteProfile(profile)) {
          if (typeof window !== 'undefined') window.sessionStorage.removeItem(GOOGLE_AUTH_INTENT_KEY);
          navigate(consumePostLoginPath('/profile'), { replace: true });
          return;
        }

        setGoogleCompletionMode(true);
      } catch (err) {
        if (!cancelled) setErrorMsg(friendlyError(err, 'check your Google account').message);
      } finally {
        if (!cancelled) setCheckingGoogleAccount(false);
      }
    }

    handleExistingGoogleSession();
    return () => {
      cancelled = true;
    };
  }, [user, navigate]);

  async function handleGoogleSignup() {
    setErrorMsg('');

    setLoading(true);
    storePostLoginPath(location.state?.from?.pathname);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/signup`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setLoading(false);
      setErrorMsg(friendlyError(error, 'start Google sign-in').message);
    }
  }

  async function handleCompleteGoogleSignup() {
    setErrorMsg('');

    if (!confirmedAge) { setErrorMsg('Please confirm that you are 13 or over.'); return; }

    if (!acceptedLegal) {
      setErrorMsg('Please agree to the Terms of Use and confirm you have read the Privacy Notice before creating your account.');
      return;
    }

    try {
      setLoading(true);
      await syncProfileFromAuthUser(user, {
        accepted_terms: true,
        accepted_privacy: true,
        legal_version: CAREERDNA_LEGAL_VERSION,
        age_confirmed: true,
      });
      if (typeof window !== 'undefined') window.sessionStorage.removeItem(GOOGLE_AUTH_INTENT_KEY);
      navigate(consumePostLoginPath('/profile'), { replace: true });
    } catch (err) {
      setErrorMsg(friendlyError(err, 'create your CareerDNA account').message);
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Please enter your first name and last name.');
      return;
    }

    if (!confirmedAge) { setErrorMsg('Please confirm that you are 13 or over.'); return; }

    if (!acceptedLegal) {
      setErrorMsg('Please agree to the Terms of Use and confirm you have read the Privacy Notice before creating your account.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMsg(PASSWORD_RULES_TEXT);
      return;
    }

    setLoading(true);
    const acceptedAt = new Date().toISOString();

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          age_confirmed: true,
          accepted_terms: true,
          accepted_privacy: true,
          legal_version: CAREERDNA_LEGAL_VERSION,
          accepted_terms_at: acceptedAt,
          accepted_privacy_at: acceptedAt,
          legal_acceptance_source: 'signup',
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(friendlyError(error, 'create your account').message);
      return;
    }

    navigate('/login', {
      replace: true,
      state: { message: 'Account created. Please check your email, confirm your account, then log in.', signupPending: true },
    });
  }

  const cardTitle = googleCompletionMode ? 'Complete your Google signup' : 'Create your account';
  const cardSubtitle = googleCompletionMode
    ? 'Confirm the terms below to create your CareerDNA account.'
    : '';

  return (
    <main className="auth-page auth-page--split auth-page--form">
      <header className="auth-topbar" aria-label="Sign up page navigation">
        <Link to="/" className="auth-page-logo-link" aria-label="Go to CareerDNA home">
          <img src={logo} alt="CareerDNA" className="auth-page-logo" />
        </Link>

        <Link to="/" className="auth-home-link" aria-label="Back to CareerDNA home">
          <span aria-hidden="true" className="auth-home-icon">⌂</span>
          <span>Back to home</span>
          <span aria-hidden="true" className="auth-home-arrow">›</span>
        </Link>
      </header>

      <div className="auth-page-shell auth-page-shell--with-trust">
        <section className="auth-card" style={googleCompletionMode ? googleCompletionCardStyle : undefined} aria-labelledby="signup-title">
          <header className="auth-header">
            <h1 id="signup-title" className="auth-title">{cardTitle}</h1>
            {cardSubtitle ? <p className="auth-subtitle">{cardSubtitle}</p> : null}
          </header>

          {infoMsg && !googleCompletionMode ? <p className="auth-message success">{infoMsg}</p> : null}
          {checkingGoogleAccount ? <p className="auth-message success">Checking your Google account...</p> : null}
          {errorMsg ? <p className="auth-message error">{errorMsg}</p> : null}

          {googleCompletionMode ? (
            <div className="auth-form" style={{ gap: '0' }}>
              <div style={googleAccountBadgeStyle} aria-label="Verified Google account">
                <span style={googleAccountIconStyle}><GoogleIcon /></span>
                <span>
                  <strong style={{ display: 'block', fontSize: '0.92rem', color: '#123047' }}>Google account verified</strong>
                  <span style={{ display: 'block', marginTop: '2px', fontSize: '0.95rem', color: '#52657a' }}>{user?.email || 'Your Google email'}</span>
                </span>
              </div>

              <div style={googleLegalPanelStyle}>
                <label className="auth-legal-check" style={{ margin: '0 0 10px', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={confirmedAge} onChange={(e) => setConfirmedAge(e.target.checked)} />
                  <span>I confirm that I am 13 or over.</span>
                </label>
                <label className="auth-legal-check" style={{ margin: 0, alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={acceptedLegal} onChange={(e) => setAcceptedLegal(e.target.checked)} />
                  <span>
                    I agree to the{' '}
                    <button type="button" className="auth-inline-link" onClick={() => setLegalModalTab('terms')} style={inlineLegalButtonStyle}>Terms of Use</button>{' '}
                    and have read the{' '}
                    <button type="button" className="auth-inline-link" onClick={() => setLegalModalTab('privacy')} style={inlineLegalButtonStyle}>Privacy Notice</button>.
                  </span>
                </label>
              </div>

              <div style={googleCompletionActionsStyle}>
                <button className="auth-button" style={googleCompletionPrimaryButtonStyle} type="button" disabled={loading} onClick={handleCompleteGoogleSignup}>
                  {loading ? 'Creating account...' : 'Finish creating my account'}
                </button>

                <button
                  type="button"
                  style={googleCompletionBackButtonStyle}
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate('/login', { replace: true });
                  }}
                  disabled={loading}
                >
                  Back to login
                </button>
              </div>
            </div>
          ) : (
            <>
              <form className="auth-form" onSubmit={handleSubmit}>
                <div className="auth-row">
                  <label className="auth-label">First name<span className="auth-input-wrap"><input className="auth-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" required /></span></label>
                  <label className="auth-label">Last name<span className="auth-input-wrap"><input className="auth-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" required /></span></label>
                </div>

                <label className="auth-label">Email<span className="auth-input-wrap"><input className="auth-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required /></span></label>

                <div className="auth-row">
                <label className="auth-label">Password<span className="auth-password-wrap auth-input-wrap"><input className="auth-input auth-input--password-toggle" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)} autoComplete="new-password" minLength={8} required /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Hide password' : 'Show password'}><EyeIcon hidden={!showPassword} /></button></span>{(passwordFocused || password.length > 0) && <PasswordRequirements password={password} />}</label>

                <label className="auth-label">Confirm password<span className="auth-password-wrap auth-input-wrap"><input className="auth-input auth-input--password-toggle" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={8} required /><button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword((current) => !current)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}><EyeIcon hidden={!showConfirmPassword} /></button></span></label>
                </div>

                <label className="auth-legal-check">
                  <input type="checkbox" checked={confirmedAge} onChange={(e) => setConfirmedAge(e.target.checked)} />
                  <span>I confirm that I am 13 or over.</span>
                </label>
                <label className="auth-legal-check">
                  <input type="checkbox" checked={acceptedLegal} onChange={(e) => setAcceptedLegal(e.target.checked)} />
                  <span>
                    I agree to the{' '}
                    <button type="button" className="auth-inline-link" onClick={() => setLegalModalTab('terms')} style={inlineLegalButtonStyle}>Terms of Use</button>{' '}
                    and have read the{' '}
                    <button type="button" className="auth-inline-link" onClick={() => setLegalModalTab('privacy')} style={inlineLegalButtonStyle}>Privacy Notice</button>.
                  </span>
                </label>

                <button className="auth-button" type="submit" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
              </form>

              <div className="auth-divider" aria-hidden="true"><span>or</span></div>

              <button type="button" style={googleButtonStyle} onClick={handleGoogleSignup} disabled={loading}>
                <GoogleIcon />
                {loading ? 'Opening Google...' : 'Continue with Google'}
              </button>

              <div className="auth-links auth-links--plain">
                <p>Already have an account? <Link to="/login">Log in</Link></p>
              </div>
            </>
          )}
        </section>
      </div>

      <footer className="auth-footer">
        <p className="auth-legal-footer">
          <Link to="/legal#privacy">Privacy</Link>
          <span aria-hidden="true"> · </span>
          <Link to="/legal#terms">Terms</Link>
          <span aria-hidden="true"> · </span>
          <span className="auth-legal-copy">© 2026 CareerDNA</span>
        </p>
      </footer>

      {legalModalTab ? <LegalModal initialTab={legalModalTab} onClose={() => setLegalModalTab(null)} /> : null}
    </main>
  );
}
