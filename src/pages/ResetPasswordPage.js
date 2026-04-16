import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const cardStyle = {
  maxWidth: '460px',
  margin: '60px auto',
  padding: '32px',
  borderRadius: '18px',
  background: '#fff',
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  marginTop: '8px',
  marginBottom: '16px',
  borderRadius: '10px',
  border: '1px solid #d0d7e2',
  fontSize: '16px',
  boxSizing: 'border-box',
};

const buttonStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: 'none',
  background: '#2f6fed',
  color: '#fff',
  fontSize: '16px',
  cursor: 'pointer',
};

function urlLooksLikeRecovery() {
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  return (
    search.includes('type=recovery') ||
    hash.includes('type=recovery') ||
    hash.includes('access_token=') ||
    search.includes('code=')
  );
}

export default function ResetPasswordPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryHint, setRecoveryHint] = useState(urlLooksLikeRecovery());

  useEffect(() => {
    setRecoveryHint(urlLooksLikeRecovery());
  }, []);

  const isRecoveryMode = useMemo(() => {
    return Boolean(user) || recoveryHint;
  }, [user, recoveryHint]);

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

  async function handleUpdatePassword(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Please use a password with at least 6 characters.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    try {
      await signOut();
    } catch (_) {
      // ignore sign-out errors here
    }

    navigate('/login', {
      replace: true,
      state: { message: 'Your password has been updated. Please log in with your new password.' },
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '24px' }}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>{isRecoveryMode ? 'Choose a new password' : 'Reset password'}</h1>
        <p style={{ color: '#5f6b7a' }}>
          {isRecoveryMode
            ? 'Set your new password below.'
            : 'Enter your email address and we will send you a password reset link.'}
        </p>

        {infoMsg ? <p style={{ color: '#1f7a3d' }}>{infoMsg}</p> : null}
        {errorMsg ? <p style={{ color: '#c0392b' }}>{errorMsg}</p> : null}
        {authLoading ? <p style={{ color: '#5f6b7a' }}>Checking recovery link...</p> : null}

        {!authLoading && !isRecoveryMode ? (
          <form onSubmit={handleRequestReset}>
            <label>
              Email
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <button style={buttonStyle} type="submit" disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
          </form>
        ) : null}

        {!authLoading && isRecoveryMode ? (
          <form onSubmit={handleUpdatePassword}>
            <label>
              New password
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <label>
              Confirm new password
              <input
                style={inputStyle}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            <button style={buttonStyle} type="submit" disabled={loading}>
              {loading ? 'Updating password...' : 'Save New Password'}
            </button>
          </form>
        ) : null}

        <p style={{ marginTop: '18px' }}>
          Back to <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
