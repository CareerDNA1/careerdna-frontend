import React, { useMemo } from 'react';
import './AccountDetailsModal.css';

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

const btnModalClose = {
  width: '38px',
  height: '38px',
  border: 'none',
  background: '#f3f6fb',
  color: '#6b7788',
  fontSize: '1.25rem',
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
  border: '1px solid #dfe6ef',
  borderRadius: '16px',
  padding: '12px 16px',
  fontSize: '0.95rem',
  color: '#1f2a37',
  background: '#fff',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
};

export default function AccountDetailsModal({
  profile,
  user,
  joined,
  profileForm,
  setProfileForm,
  savingProfile,
  onClose,
  onSubmit,
  onDeleteAccount,
}) {
  const email = profile?.email || user?.email || '—';

  const hasChanges = useMemo(() => {
    const currentFirst = String(profile?.first_name || '').trim();
    const currentLast = String(profile?.last_name || '').trim();
    const nextFirst = String(profileForm.firstName || '').trim();
    const nextLast = String(profileForm.lastName || '').trim();
    return currentFirst !== nextFirst || currentLast !== nextLast;
  }, [profile, profileForm.firstName, profileForm.lastName]);

  return (
    <div className="account-modal-overlay" onClick={onClose}>
      <div className="account-modal" onClick={(e) => e.stopPropagation()}>
        <div className="account-modal-header">
          <div>
            <p className="account-modal-eyebrow">Account</p>
            <h2 className="account-modal-title">Manage Account</h2>
          </div>
          <button type="button" style={btnModalClose} onClick={onClose} aria-label="Close account details">×</button>
        </div>

        <form className="account-form" onSubmit={onSubmit}>
          <div className="account-form-row">
            <label className="account-form-field">
              <span>First name</span>
              <input
                type="text"
                style={inputStyle}
                value={profileForm.firstName}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </label>
            <label className="account-form-field">
              <span>Last name</span>
              <input
                type="text"
                style={inputStyle}
                value={profileForm.lastName}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </label>
          </div>

          <div className="account-readonly-grid">
            <div className="account-readonly-block account-readonly-block--wide">
              <span>Email</span>
              <strong>{email}</strong>
            </div>
            <div className="account-readonly-block">
              <span>Joined</span>
              <strong>{joined}</strong>
            </div>
          </div>

          <p className="account-field-help">
            For any issues with your account, contact us at{' '}
            <a href="mailto:support@mycareerdna.io">support@mycareerdna.io</a>.
          </p>

          {hasChanges ? (
            <div className="account-form-actions">
              <button type="submit" className="account-btn-hover-primary" style={btnPrimary} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          ) : null}
        </form>

        <div className="account-danger-zone">
          <div>
            <h3>Account removal</h3>
            <p>Permanently delete your account and saved results.</p>
          </div>
          <button
            type="button"
            className="account-btn-hover-danger"
            style={btnDanger}
            onClick={onDeleteAccount}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  );
}
