
import React, { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../../Assets/images/logo-career-dna.png';
import { useAuth } from '../../context/AuthContext';
import './AccountNavbar.css';

export default function AccountNavbar({ menuOpen, setMenuOpen }) {
  const [atTop, setAtTop] = useState(true);
  const [isPhone, setIsPhone] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : true
  );
  const lastScrollY = useRef(0);
  const startYRef = useRef(null);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      closeMenu();
      navigate('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const handleRetake = () => {
    closeMenu();
    navigate('/start');
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
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const dropdown = document.getElementById('account-nav-dropdown');
    const bar = document.querySelector('.account-navbar-wrapper');
    const overlay = document.getElementById('account-nav-menu');

    const handler = (e) => {
      if (overlay && overlay.contains(e.target)) return;
      if (dropdown && dropdown.contains(e.target)) return;
      if (bar && bar.contains(e.target)) {
        const isHamburger = e.target.closest?.('.account-menu-icon');
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
  }, [menuOpen]);

  const wrapperClasses = `account-navbar-wrapper ${!menuOpen && !atTop ? 'hidden' : ''}`;

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

  const email = user?.email || '';
  const onProfilePage = location.pathname === '/profile';

  return (
    <>
      <div className={wrapperClasses}>
        <nav className="account-navbar">
          <RouterLink to={onProfilePage ? '/profile' : '/'} className="account-logo-link" onClick={closeMenu}>
            <div className="account-logo">
              <img src={logo} alt="CareerDNA Logo" loading="lazy" />
              <span className="sr-only">CareerDNA</span>
            </div>
          </RouterLink>

          <button
            type="button"
            className={`account-menu-icon ${(isPhone && menuOpen) ? 'hide-on-overlay' : ''}`}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="account-nav-dropdown account-nav-menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </nav>
      </div>

      <div
        id="account-nav-dropdown"
        className={`account-nav-dropdown vertical ${!isPhone && menuOpen ? 'open' : ''}`}
        role="region"
        aria-label="Account menu"
      >
        <ul className="account-dropdown-list">
          <li>
            <RouterLink to="/profile" onClick={closeMenu}>Profile</RouterLink>
          </li>
          <li className="account-nav-user-email">{email}</li>
          <li>
            <button type="button" className="account-dropdown-btn" onClick={handleRetake}>
              Take Survey Again
            </button>
          </li>
          <li>
            <button type="button" className="account-dropdown-btn" onClick={handleSignOut}>
              Sign out
            </button>
          </li>
        </ul>
      </div>

      <div
        id="account-nav-menu"
        className={`account-nav-menu ${isPhone && menuOpen ? 'active' : ''}`}
        onClick={closeMenu}
        onTouchStart={onOverlayTouchStart}
        onTouchMove={onOverlayTouchMove}
      >
        <div className="account-nav-panel" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="account-nav-close"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <FaTimes />
          </button>

          <ul className="account-nav-links">
            <li>
              <RouterLink to="/profile" onClick={closeMenu}>Profile</RouterLink>
            </li>
            <li className="account-nav-user-email">{email}</li>
            <li>
              <button type="button" className="account-mobile-btn" onClick={handleRetake}>
                Take Survey Again
              </button>
            </li>
            <li>
              <button type="button" className="account-mobile-btn" onClick={handleSignOut}>
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
