import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import logo from '../Assets/images/logo-career-dna.png';
import './AuthPage.css';

const PASSWORD_RECOVERY_FLAG = 'cdna_password_recovery_in_progress';

function getHashParams() {
  return new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
}

function getSearchParams() {
  return new URLSearchParams(window.location.search || '');
}

function recoveryParamsFromUrl() {
  const searchParams = getSearchParams();
  const hashParams = getHashParams();

  return {
    code: searchParams.get('code'),
    tokenHash: searchParams.get('token_hash') || hashParams.get('token_hash'),
    token: searchParams.get('token') || hashParams.get('token'),
    type: searchParams.get('type') || hashParams.get('type'),
    accessToken: hashParams.get('access_token') || searchParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token') || searchParams.get('refresh_token'),
    error: searchParams.get('error') || hashParams.get('error'),
    errorCode: searchParams.get('error_code') || hashParams.get('error_code'),
    errorDescription: searchParams.get('error_description') || hashParams.get('error_description'),
  };
}

function hasRecoveryParams() {
  const params = recoveryParamsFromUrl();
  return Boolean(
    params.code ||
    params.tokenHash ||
    params.token ||
    params.accessToken ||
    params.refreshToken ||
    params.type === 'recovery' ||
    params.error ||
    params.errorCode ||
    params.errorDescription
  );
}

function cleanRecoveryUrl() {
  window.history.replaceState({}, document.title, '/reset-password');
}

function normaliseUrlMessage(message) {
  return String(message || '')
    .replace(/\+/g, ' ')
    .replace(/%20/g, ' ')
    .trim();
}

export default function ResetPasswordPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingRecoveryLink, setCheckingRecoveryLink] = useState(hasRecoveryParams());
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPayload, setRecoveryPayload] = useState(null);

  useEffect(() => {
    let mounted = true;

    function enterRecoveryMode(payload = null, message = 'Recovery link detected. Choose a new password below.') {
      if (!mounted) return;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(PASSWORD_RECOVERY_FLAG, 'true');
      }
      setRecoveryPayload(payload);
      setIsRecoveryMode(true);
      setCheckingRecoveryLink(false);
      setErrorMsg('');
      setInfoMsg(message);
    }

    async function prepareRecoveryPage() {
      const params = recoveryParamsFromUrl();

      try {
        if (params.error || params.errorCode || params.errorDescription) {
          const message = normaliseUrlMessage(params.errorDescription || params.errorCode || params.error);
          throw new Error(message || 'This password reset link is invalid or has expired. Please request a new link.');
        }

        // Preferred institutional-email-safe format:
        // /reset-password?token_hash={{ .TokenHash }}&type=recovery
        // IMPORTANT: do not call verifyOtp on page load. Some school/university email
        // security systems open links in a scanner. If we verify immediately, the scanner
        // can consume the one-time token before the real user clicks anything.
        if ((params.tokenHash || params.token) && params.type === 'recovery') {
          enterRecoveryMode({ tokenHash: params.tokenHash, token: params.token, type: 'recovery' });
          return;
        }

        // Older Supabase formats. These may still fail if an institutional scanner opens
        // the one-time link first, which is why the token_hash template above is preferred.
        if (params.code) {
          enterRecoveryMode({ code: params.code, type: 'recovery' });
          return;
        }

        if (params.accessToken && params.refreshToken) {
          enterRecoveryMode({
            accessToken: params.accessToken,
            refreshToken: params.refreshToken,
            type: 'recovery',
          });
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data?.session && (params.type === 'recovery' || hasRecoveryParams())) {
          cleanRecoveryUrl();
          enterRecoveryMode(null, 'Recovery session confirmed. Choose a new password below.');
          return;
        }

        if (mounted) setCheckingRecoveryLink(false);
      } catch (error) {
        if (!mounted) return;
        setRecoveryPayload(null);
        setIsRecoveryMode(false);
        setCheckingRecoveryLink(false);
        setInfoMsg('');
        setErrorMsg(error.message || 'This password reset link is invalid or has expired. Please request a new link.');
      }
    }

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        enterRecoveryMode(null, 'Recovery session confirmed. Choose a new password below.');
      }
    });

    if (hasRecoveryParams()) {
      prepareRecoveryPage();
    } else {
      setCheckingRecoveryLink(false);
    }

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function handleRequestReset(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setInfoMsg('If an account exists for this email, a password reset link has been sent. Please check your inbox.');
  }

  async function ensureRecoverySession() {
    if (!recoveryPayload) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data?.session) return;
      throw new Error('This password reset session is not active. Please request a new reset link.');
    }

    if (recoveryPayload.tokenHash || recoveryPayload.token) {
      const verifyPayload = recoveryPayload.tokenHash
        ? { type: 'recovery', token_hash: recoveryPayload.tokenHash }
        : { type: 'recovery', token: recoveryPayload.token };

      const { error } = await supabase.auth.verifyOtp(verifyPayload);
      if (error) throw error;
      cleanRecoveryUrl();
      setRecoveryPayload(null);
      return;
    }

    if (recoveryPayload.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(recoveryPayload.code);
      if (error) throw error;
      cleanRecoveryUrl();
      setRecoveryPayload(null);
      return;
    }

    if (recoveryPayload.accessToken && recoveryPayload.refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: recoveryPayload.accessToken,
        refresh_token: recoveryPayload.refreshToken,
      });
      if (error) throw error;
      cleanRecoveryUrl();
      setRecoveryPayload(null);
      return;
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Please use a password with at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await ensureRecoverySession();

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(PASSWORD_RECOVERY_FLAG);
      }

      try {
        await signOut();
      } catch (_) {
        // Ignore sign-out errors here. The password has already been updated.
      }

      navigate('/login', {
        replace: true,
        state: { message: 'Your password has been updated. Please log in with your new password.' },
      });
    } catch (error) {
      setErrorMsg(error.message || 'Could not update your password. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  }


  async function handleCancelRecovery(event) {
    event.preventDefault();

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(PASSWORD_RECOVERY_FLAG);
    }

    try {
      await signOut();
    } catch (_) {
      // Ignore sign-out errors. The user is simply leaving the reset flow.
    }

    navigate('/login', {
      replace: true,
      state: { message: 'Password reset cancelled. Please log in to continue.' },
    });
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

  return (
    <main className="auth-page">
      <Link to="/" className="auth-page-logo-link" aria-label="Go to CareerDNA home">
        <img src={logo} alt="CareerDNA" className="auth-page-logo" />
      </Link>

      <div className="auth-page-shell">
        <section className="auth-card" aria-labelledby="reset-title">
          <header className="auth-header">
            <h1 id="reset-title" className="auth-title">
              {isRecoveryMode ? 'Choose a new password' : 'Reset password'}
            </h1>
            <p className="auth-subtitle">
              {isRecoveryMode
                ? 'Set your new password below.'
                : 'Enter your email address and we will send you a password reset link.'}
            </p>
          </header>

          {checkingRecoveryLink ? <p className="auth-message success">Checking recovery link...</p> : null}
          {infoMsg ? <p className="auth-message success">{infoMsg}</p> : null}
          {errorMsg ? <p className="auth-message error">{errorMsg}</p> : null}

          {!checkingRecoveryLink && !isRecoveryMode ? (
            <form className="auth-form" onSubmit={handleRequestReset}>
              <label className="auth-label">
                Email
                <input
                  className="auth-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <button className="auth-button" type="submit" disabled={loading}>
                {loading ? 'Sending reset link...' : 'Send reset link'}
              </button>
            </form>
          ) : null}

          {!checkingRecoveryLink && isRecoveryMode ? (
            <form className="auth-form" onSubmit={handleUpdatePassword}>
              <label className="auth-label">
                New password
                <span className="auth-password-wrap">
                  <input
                    className="auth-input auth-input--password-toggle"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                  >
                    <EyeIcon hidden={!showPassword} />
                  </button>
                </span>
              </label>

              <label className="auth-label">
                Confirm new password
                <span className="auth-password-wrap">
                  <input
                    className="auth-input auth-input--password-toggle"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  >
                    <EyeIcon hidden={!showConfirmPassword} />
                  </button>
                </span>
              </label>

              <button className="auth-button" type="submit" disabled={loading}>
                {loading ? 'Updating password...' : 'Save new password'}
              </button>
            </form>
          ) : null}

          <div className="auth-links">
            <p>
              Back to{' '}
              {isRecoveryMode ? (
                <button type="button" className="auth-inline-button" onClick={handleCancelRecovery}>
                  Log in
                </button>
              ) : (
                <Link to="/login">Log in</Link>
              )}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
