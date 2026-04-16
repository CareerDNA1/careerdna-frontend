import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

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

export default function SignupPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg('Please enter your first name and last name.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        },
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate('/login', {
      replace: true,
      state: {
        message: 'Account created. Please check your email, confirm your account, then log in.',
      },
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '24px' }}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Create account</h1>
        <p style={{ color: '#5f6b7a' }}>Set up your CareerDNA account.</p>

        {errorMsg ? <p style={{ color: '#c0392b' }}>{errorMsg}</p> : null}

        <form onSubmit={handleSubmit}>
          <label>
            First name
            <input
              style={inputStyle}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </label>

          <label>
            Last name
            <input
              style={inputStyle}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </label>

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

          <label>
            Confirm password
            <input
              style={inputStyle}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          <button style={buttonStyle} type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '18px' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
