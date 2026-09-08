import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import logo from '../../Assets/images/logo-career-dna.png';
import { useAuth } from '../../context/AuthContext';
import { clearLocalUserState } from '../../utils/clearLocalUserState';
import './AccountNavbar.css';

const ChevronIcon = () => (
  <svg className="account-user-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Profile icon
const ProfileIcon = ({ className = 'account-dropdown-icon' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Sign out icon
const SignOutIcon = () => (
  <svg className="account-dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const getDisplayFirstName = (user) => {
  const metadata = user?.user_metadata || user?.user?.user_metadata || {};
  const rawName =
    metadata.first_name ||
    metadata.firstName ||
    metadata.name ||
    metadata.full_name ||
    metadata.fullName ||
    user?.name ||
    user?.full_name ||
    user?.email?.split('@')?.[0] ||
    'Profile';

  return String(rawName).trim().split(/\s+/)[0] || 'Profile';
};

export default function AccountNavbar({ menuOpen, setMenuOpen }) {
  const [atTop, setAtTop] = useState(true);
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false);
  const lastScrollY = useRef(0);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayFirstName = getDisplayFirstName(user);

  const closeAccountMenu = () => setMenuOpen(false);
  const closeAllMenus = closeAccountMenu;

  const toggleAccountMenu = () => {
    setMenuOpen((v) => !v);
  };

  const requestSignOut = () => {
    setSignOutConfirmOpen(true);
  };

  const closeSignOutConfirm = () => {
    setSignOutConfirmOpen(false);
  };

  const handleSignOut = async () => {
    try {
      setSignOutConfirmOpen(false);
      closeAllMenus();

      // Move away from the protected account page before clearing auth.
      // This prevents the protected-route guard from briefly sending the user to /login.
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, '/');
      }
      navigate('/', { replace: true });

      clearLocalUserState();
      await signOut();

      navigate('/', { replace: true });
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY ?? document.documentElement.scrollTop ?? 0;
      setAtTop(y <= 1);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onScrollClose = () => {
      if (!menuOpen) return;
      const y = window.scrollY ?? 0;
      const goingDown = y > lastScrollY.current + 8;
      if (goingDown) closeAllMenus();
      lastScrollY.current = y;
    };
    lastScrollY.current = window.scrollY ?? 0;
    window.addEventListener('scroll', onScrollClose, { passive: true });
    return () => window.removeEventListener('scroll', onScrollClose);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const accountDropdown = document.getElementById('account-nav-dropdown');
    const bar = document.querySelector('.account-navbar-wrapper');

    const handler = (e) => {
      if (accountDropdown && accountDropdown.contains(e.target)) return;
      if (bar && bar.contains(e.target)) return;
      closeAllMenus();
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  const wrapperClasses = `account-navbar-wrapper ${!menuOpen && !atTop ? 'hidden' : ''}`;
  return (
    <>
      <div className={wrapperClasses}>
        <nav className="account-navbar">
          <RouterLink to="/" className="account-logo-link" onClick={closeAllMenus}>
            <div className="account-logo">
              <img src={logo} alt="CareerDNA Logo" loading="lazy" />
              <span className="sr-only">CareerDNA</span>
            </div>
          </RouterLink>

          <div className="account-navbar-actions">
            <button
              type="button"
              className="account-user-trigger"
              onClick={toggleAccountMenu}
              aria-label={menuOpen ? 'Close account menu' : 'Open account menu'}
              aria-expanded={menuOpen}
              aria-controls="account-nav-dropdown"
            >
              <span className="account-user-avatar" aria-hidden="true">
                <ProfileIcon className="account-user-avatar-icon" />
              </span>
              <span className="account-user-name">{displayFirstName}</span>
              <ChevronIcon />
            </button>

          </div>
        </nav>
      </div>

      <div
        id="account-nav-dropdown"
        className={`account-nav-dropdown vertical ${menuOpen ? 'open' : ''}`}
        role="region"
        aria-label="Account menu"
      >
        <ul className="account-dropdown-list">
          <li>
            <RouterLink to="/profile" onClick={closeAllMenus}>
              <ProfileIcon />
              Profile
            </RouterLink>
          </li>
          <li className="account-dropdown-divider" role="separator" />
          <li>
            <button type="button" className="account-dropdown-btn signout" onClick={requestSignOut}>
              <SignOutIcon />
              Sign out
            </button>
          </li>
        </ul>
      </div>

      {signOutConfirmOpen ? (
        <div className="account-signout-confirm-overlay" onClick={closeSignOutConfirm}>
          <section
            className="account-signout-confirm-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accountSignOutTitle"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="account-signout-confirm-close"
              onClick={closeSignOutConfirm}
              aria-label="Close sign out confirmation"
            >
              ×
            </button>

            <h3 id="accountSignOutTitle">Sign out?</h3>
            <p>Are you sure you want to sign out of your CareerDNA account?</p>

            <div className="account-signout-confirm-actions">
              <button
                type="button"
                className="account-signout-confirm-secondary"
                onClick={closeSignOutConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="account-signout-confirm-primary"
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
