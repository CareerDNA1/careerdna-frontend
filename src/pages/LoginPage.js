import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, isCompleteProfile, syncProfileFromAuthUser } from '../utils/profile';
import logo from '../Assets/images/logo-career-dna.png';
import './AuthPage.css';

const PASSWORD_RECOVERY_FLAG = 'cdna_password_recovery_in_progress';
const GOOGLE_AUTH_INTENT_KEY = 'cdna_google_auth_intent';

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

function AuthInputIcon({ type }) {
  const icons = {
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

const googleButtonStyle = {
  width: '100%',
  minHeight: '44px',
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


function AuthTrustStrip() {
  return (
    <div className="auth-trust-strip" aria-label="CareerDNA account benefits">
      <div className="auth-trust-item">
        <span className="auth-trust-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 3.6 18.2 6v5.2c0 4.1-2.5 7.5-6.2 9.1-3.7-1.6-6.2-5-6.2-9.1V6L12 3.6Z" />
            <path d="m9.4 12.2 1.7 1.7 3.7-4" />
          </svg>
        </span>
        <span><strong>Secure & private</strong><small>Your data is protected</small></span>
      </div>
      <div className="auth-trust-item">
        <span className="auth-trust-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M12 12.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4Z" />
            <path d="M5.6 20a6.4 6.4 0 0 1 12.8 0" />
          </svg>
        </span>
        <span><strong>Personalised for you</strong><small>Insights that match you</small></span>
      </div>
      <div className="auth-trust-item">
        <span className="auth-trust-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M13.5 5.2c2.9.2 4.9 1.4 6 3.5-1.3 3.8-3.8 6.3-7.6 7.6-2.1-1.1-3.3-3.1-3.5-6l5.1-5.1Z" />
            <path d="m8.4 10.3-3.1 1.2 2.1 2.1" />
            <path d="m13.7 15.6-1.2 3.1-2.1-2.1" />
            <path d="M15.2 8.8h.01" />
          </svg>
        </span>
        <span><strong>Explore your future</strong><small>Study and career pathways</small></span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const [clearingAuthSession, setClearingAuthSession] = useState(false);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmedEmailHandledRef = useRef(false);

  const redirectTo = location.state?.from?.pathname || '/profile';

  useEffect(() => {
    let mounted = true;

    async function clearRecoverySession() {
      setClearingAuthSession(true);
      try {
        await Promise.race([
          supabase.auth.signOut({ scope: 'local' }),
          new Promise((resolve) => window.setTimeout(resolve, 1500)),
        ]);
      } catch (_) {
        // Ignore. The aim here is only to remove a temporary recovery session if one exists.
      }

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(PASSWORD_RECOVERY_FLAG);
      }

      if (!mounted) return;
      setEmail('');
      setPassword('');
      setInfoMsg(location.state?.message || '');
      setClearingAuthSession(false);
      navigate('/login', { replace: true, state: location.state || {} });
    }

    function finishConfirmedSignupSession() {
      // Do not put the login page into a long clearing/loading state here.
      // Supabase has already confirmed the email by the time this page is opened.
      // We only clean any temporary local session in the background and show a normal login message.
      setErrorMsg('');
      setEmail('');
      setPassword('');
      setInfoMsg('Email confirmed. You can now log in.');

      try {
        supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      } catch (_) {
        // Ignore. The account is already confirmed; this is only local cleanup.
      }

      navigate('/login', {
        replace: true,
        state: { message: 'Email confirmed. You can now log in.' },
      });
    }

    const recoveryInProgress =
      typeof window !== 'undefined' && window.sessionStorage.getItem(PASSWORD_RECOVERY_FLAG) === 'true';

    if (recoveryInProgress) {
      clearRecoverySession();
      return () => {
        mounted = false;
      };
    }

    const searchParams = new URLSearchParams(location.search || '');
    const hashParams = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''));
    const confirmedEmail =
      searchParams.get('confirmed') === '1' ||
      searchParams.get('type') === 'signup' ||
      hashParams.get('type') === 'signup';

    if (confirmedEmail && !confirmedEmailHandledRef.current) {
      confirmedEmailHandledRef.current = true;
      finishConfirmedSignupSession();
      return () => {
        mounted = false;
      };
    }

    if (user && !loading && !clearingAuthSession) {
      const isGoogleUser =
        user.app_metadata?.provider === 'google' ||
        user.identities?.some((identity) => identity.provider === 'google');

      // Only auto-route OAuth sessions here. Password login is routed directly by handleSubmit.
      // This avoids email-confirmation sessions in another tab pushing the login page into a broken check.
      if (isGoogleUser) {
        async function routeGoogleUser() {
          try {
            const profile = await getMyProfile();

            if (isCompleteProfile(profile)) {
              if (typeof window !== 'undefined') window.sessionStorage.removeItem(GOOGLE_AUTH_INTENT_KEY);
              navigate('/profile', { replace: true });
              return;
            }

            if (typeof window !== 'undefined') window.sessionStorage.removeItem(GOOGLE_AUTH_INTENT_KEY);
            navigate('/signup', {
              replace: true,
              state: {
                message: profile
                  ? 'Your Google account is recognised, but your CareerDNA account still needs Terms and Privacy confirmation.'
                  : 'No CareerDNA account exists for this Google email yet. Please finish creating your account.',
                googleNeedsCompletion: true,
              },
            });
          } catch (err) {
            console.error('Google account check failed:', err);
            setErrorMsg('We could not check your Google account. Please try again.');
          }
        }

        routeGoogleUser();
      }
    }

    return () => {
      mounted = false;
    };
  }, [user, navigate, location.search, location.state]);

  async function handleGoogleLogin() {
    setErrorMsg('');
    setInfoMsg('');

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(GOOGLE_AUTH_INTENT_KEY, 'login');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setErrorMsg(error.message || 'Could not start Google login. Please try again.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get('email') || emailInputRef.current?.value || email || '').trim();
    const submittedPassword = String(formData.get('password') || passwordInputRef.current?.value || password || '');

    setEmail(submittedEmail);
    setPassword(submittedPassword);
    setErrorMsg('');

    if (!submittedEmail || !submittedPassword) {
      setInfoMsg('');
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setInfoMsg('');
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: submittedEmail,
      password: submittedPassword,
    });

    if (error) {
      setLoading(false);

      const msg = String(error.message || '').toLowerCase();

      if (msg.includes('email not confirmed')) {
        setErrorMsg('Please confirm your email before logging in. Check your inbox for the verification link.');
      } else if (msg.includes('invalid login credentials')) {
        const emailDomain = submittedEmail.split('@')[1]?.toLowerCase() || '';
        const isLikelyGoogleEmail =
          emailDomain === 'gmail.com' || emailDomain === 'googlemail.com';

        setErrorMsg(
          isLikelyGoogleEmail
            ? 'Incorrect email or password. If you signed up with Google, please use “Log in with Google”.'
            : 'Incorrect email or password.'
        );
      } else {
        setErrorMsg(error.message || 'Could not log you in. Please try again.');
      }

      return;
    }

    try {
      const syncedProfile = await syncProfileFromAuthUser(data?.user);

      if (!isCompleteProfile(syncedProfile)) {
        throw new Error('Your account profile is incomplete. Please contact support if this continues.');
      }

      setLoading(false);
      navigate(redirectTo, { replace: true });
    } catch (profileError) {
      console.error('Profile sync failed:', profileError);
      try {
        await supabase.auth.signOut();
      } catch (_) {
        // Ignore sign-out failure; the important thing is to stop the broken redirect loop.
      }
      setLoading(false);
      setErrorMsg(
        profileError?.message ||
          'Your login succeeded, but your CareerDNA profile could not be loaded. Please contact support if this continues.'
      );
    }
  }

  return (
    <main className="auth-page auth-page--split">
      <header className="auth-topbar" aria-label="Login page navigation">
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
        <section className="auth-card" aria-labelledby="login-title">
          <header className="auth-header">
            <h1 id="login-title" className="auth-title">Welcome back!</h1>
            <p className="auth-subtitle">
              Log in to view your profile
            </p>
          </header>

          {infoMsg ? <p className="auth-message success">{infoMsg}</p> : null}
          {errorMsg ? <p className="auth-message error">{errorMsg}</p> : null}
          {clearingAuthSession ? <p className="auth-message success">Preparing login...</p> : null}

          <form className="auth-form" onSubmit={handleSubmit} autoComplete="off">
            <label className="auth-label">
              Email
              <span className="auth-input-wrap">
                <AuthInputIcon type="email" />
                <input
                  ref={emailInputRef}
                  name="email"
                  className="auth-input auth-input--with-icon"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInput={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </span>
            </label>

            <label className="auth-label">
              Password
              <span className="auth-password-wrap auth-input-wrap">
                <AuthInputIcon type="lock" />
                <input
                  ref={passwordInputRef}
                  name="password"
                  className="auth-input auth-input--with-icon auth-input--password-toggle"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInput={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </span>
            </label>

            <div className="auth-actions auth-actions--forgot-only">
              <Link to="/reset-password" className="auth-inline-link">Forgot your password?</Link>
            </div>

            <button className="auth-button" type="submit" disabled={loading || clearingAuthSession}>
              {loading ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <div className="auth-divider" aria-hidden="true"><span>or</span></div>

          <button
            type="button"
            style={googleButtonStyle}
            onClick={handleGoogleLogin}
            disabled={loading || clearingAuthSession}
          >
            <GoogleIcon />
            Log in with Google
          </button>

          <div className="auth-links auth-links--plain">
            <p>No account yet? <Link to="/signup">Create one</Link></p>
          </div>
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
    </main>
  );
}
