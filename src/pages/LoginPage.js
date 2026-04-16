import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const cardStyle = {
  maxWidth: '420px',
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

export default function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/profile';

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate, redirectTo]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '24px' }}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Log in</h1>
        <p style={{ color: '#5f6b7a' }}>Sign in to continue to CareerDNA.</p>

        {infoMsg ? <p style={{ color: '#1f7a3d' }}>{infoMsg}</p> : null}
        {errorMsg ? <p style={{ color: '#c0392b' }}>{errorMsg}</p> : null}

        <form onSubmit={handleSubmit}>
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

          <label>
            Password
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button style={buttonStyle} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>

        <p style={{ marginTop: '14px', marginBottom: 0 }}>
          <Link to="/reset-password">Forgot your password?</Link>
        </p>

        <p style={{ marginTop: '18px' }}>
          No account yet? <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
