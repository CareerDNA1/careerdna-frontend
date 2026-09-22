import React, { useCallback, useEffect, useState, useRef } from 'react';
import './Navbar.css';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import logo from '../../Assets/images/logo-career-dna.png';
import { useAuth } from '../../context/AuthContext';
import { clearLocalUserState } from '../../utils/clearLocalUserState';
import PricingModal from '../Common/PricingModal';


const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="7" x2="17" y2="17" />
    <line x1="17" y1="7" x2="7" y2="17" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="nav-account-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const SignOutIcon = () => (
  <svg className="nav-account-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export default function Navbar({ menuOpen, setMenuOpen }) {
  const [atTop, setAtTop] = useState(true);
  const [isPhone, setIsPhone] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : true
  );
  const lastScrollY = useRef(0);
  const startYRef = useRef(null);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const displayFirstName = getDisplayFirstName(user);

  const [pricingOpen, setPricingOpen] = useState(false);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), [setMenuOpen]);
  const closeMenu = useCallback(() => setMenuOpen(false), [setMenuOpen]);
  const openPricing = useCallback(() => { setPricingOpen(true); closeMenu(); }, [closeMenu]);
  const noop = (e) => e.preventDefault();

  const handleSignOut = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;

    try {
      clearLocalUserState();
      await signOut();
      closeMenu();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  useEffect(() => {
    const onResize = () => setIsPhone(window.innerWidth <= 900);
    onResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

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
      if (goingDown) closeMenu();
      lastScrollY.current = y;
    };
    lastScrollY.current = window.scrollY ?? 0;
    window.addEventListener('scroll', onScrollClose, { passive: true });
    return () => window.removeEventListener('scroll', onScrollClose);
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    if (!menuOpen) return;
    const dropdown = document.getElementById('nav-dropdown');
    const bar = document.querySelector('.navbar-wrapper');
    const overlay = document.getElementById('nav-menu');

    const handler = (e) => {
      if (overlay && overlay.contains(e.target)) return;
      if (dropdown && dropdown.contains(e.target)) return;
      if (bar && bar.contains(e.target)) {
        const isHamburger = e.target.closest?.('.menu-icon');
        if (isHamburger) return;
      }
      closeMenu();
    };

    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => {
    document.body.classList.remove('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, [menuOpen, isPhone]);

  const wrapperClasses = `navbar-wrapper ${!menuOpen && !atTop ? 'hidden' : ''}`;

  const onOverlayTouchStart = (e) => {
    startYRef.current = e.touches?.[0]?.clientY ?? null;
  };

  const onOverlayTouchMove = (e) => {
    if (!menuOpen) return;
    const startY = startYRef.current;
    const currentY = e.touches?.[0]?.clientY ?? 0;
    if (startY != null && currentY - startY > 24) {
      closeMenu();
      startYRef.current = null;
    }
  };

  const userMenu = user ? (
    <>
      <li className="nav-account-block">
        <ul className="nav-account-list">
          <li>
            <RouterLink to="/profile" onClick={closeMenu} className="nav-account-link">
              <ProfileIcon />
              {displayFirstName}
            </RouterLink>
          </li>
          <li className="nav-account-divider" role="separator" />
          <li>
            <button
              type="button"
              className="nav-account-link nav-account-signout"
              onClick={handleSignOut}
            >
              <SignOutIcon />
              Sign out
            </button>
          </li>
        </ul>
      </li>
    </>
  ) : (
    <>
      <li className="nav-auth-separator" role="separator" aria-hidden="true" />
      <li className="nav-auth-item">
        <RouterLink to="/login" onClick={closeMenu} className="nav-auth-link">Log in</RouterLink>
      </li>
      <li className="nav-auth-item">
        <RouterLink to="/signup" onClick={closeMenu} className="nav-auth-link nav-auth-link--primary">Sign up</RouterLink>
      </li>
    </>
  );

  return (
    <>
      <div className={wrapperClasses}>
        <nav className="navbar">
          <div className="logo">
            <img src={logo} alt="CareerDNA Logo" loading="lazy" />
            <span className="sr-only">CareerDNA</span>
          </div>

          <ul className="nav-links desktop-only">
            <li><ScrollLink to="why" smooth duration={500}>Why It Matters</ScrollLink></li>
            <li><ScrollLink to="how" smooth duration={500}>How it Works</ScrollLink></li>
            <li><ScrollLink to="dimensions" smooth duration={500}>Your Dimensions</ScrollLink></li>
            <li><ScrollLink to="archetypes" smooth duration={500}>Career Profiles</ScrollLink></li>
            <li><ScrollLink to="science" smooth duration={500}>The Science</ScrollLink></li>
            <li><button type="button" className="nav-linklike" onClick={openPricing}>Our plans</button></li>
          </ul>

          <button
            type="button"
            className={`menu-icon ${(isPhone && menuOpen) ? 'hide-on-overlay' : ''}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-dropdown nav-menu"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </nav>
      </div>

      <div
        id="nav-dropdown"
        className={`nav-dropdown vertical desktop-only ${!isPhone && menuOpen ? 'open' : ''}`}
        role="region"
        aria-label="Expanded menu"
      >
        <ul className="dropdown-list">
          <li><ScrollLink to="why" smooth duration={500} onClick={closeMenu}>Why It Matters</ScrollLink></li>
          <li><ScrollLink to="how" smooth duration={500} onClick={closeMenu}>How it Works</ScrollLink></li>
          <li><ScrollLink to="dimensions" smooth duration={500} onClick={closeMenu}>Your Dimensions</ScrollLink></li>
          <li><ScrollLink to="archetypes" smooth duration={500} onClick={closeMenu}>Career Profiles</ScrollLink></li>
          <li><ScrollLink to="science" smooth duration={500} onClick={closeMenu}>The Science</ScrollLink></li>
          <li><RouterLink to="/team" onClick={closeMenu}>Our Team</RouterLink></li>
          <li><RouterLink to="/trust-security" onClick={closeMenu}>Trust &amp; Security</RouterLink></li>
          <li><button type="button" className="nav-linklike" onClick={openPricing}>Our plans</button></li>
          <li><ScrollLink to="start" smooth duration={500} onClick={closeMenu}>Start Your Journey</ScrollLink></li>
          {userMenu}
        </ul>
      </div>

      <div
        id="nav-menu"
        className={`nav-menu ${isPhone && menuOpen ? 'active' : ''}`}
        onClick={closeMenu}
        onTouchStart={onOverlayTouchStart}
        onTouchMove={onOverlayTouchMove}
      >
        <div className="nav-panel" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="nav-close"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <CloseIcon />
          </button>

          <ul className="nav-links">
            <li><ScrollLink to="why" smooth duration={500} onClick={closeMenu}>Why It Matters</ScrollLink></li>
            <li><ScrollLink to="how" smooth duration={500} onClick={closeMenu}>How it Works</ScrollLink></li>
            <li><ScrollLink to="dimensions" smooth duration={500} onClick={closeMenu}>Your Dimensions</ScrollLink></li>
            <li><ScrollLink to="archetypes" smooth duration={500} onClick={closeMenu}>Career Profiles</ScrollLink></li>
            <li><ScrollLink to="science" smooth duration={500} onClick={closeMenu}>The Science</ScrollLink></li>
            <li><RouterLink to="/team" onClick={closeMenu}>Our Team</RouterLink></li>
            <li><RouterLink to="/trust-security" onClick={closeMenu}>Trust &amp; Security</RouterLink></li>
            <li><button type="button" className="nav-linklike" onClick={openPricing}>Our plans</button></li>
            <li><ScrollLink to="start" smooth duration={500} onClick={closeMenu}>Start Your Journey</ScrollLink></li>
            {userMenu}
          </ul>
        </div>
      </div>

      <PricingModal
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
        currentPlan="free"
        entitlement={{ plan: 'free', status: '' }}
        onManageSubscription={() => {}}
      />
    </>
  );
}
