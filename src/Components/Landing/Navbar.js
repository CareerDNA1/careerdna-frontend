import React, { useEffect, useState, useRef } from 'react';
import './Navbar.css';
import { Link as ScrollLink } from 'react-scroll';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import logo from '../../Assets/images/logo-career-dna.png';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ menuOpen, setMenuOpen }) {
  const [atTop, setAtTop] = useState(true);
  const [isPhone, setIsPhone] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 900 : true
  );
  const lastScrollY = useRef(0);
  const startYRef = useRef(null);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const noop = (e) => e.preventDefault();

  const handleSignOut = async () => {
    try {
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
  }, [menuOpen]);

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
  }, [menuOpen]);

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
      <li className="nav-profile-item">
        <RouterLink to="/profile" onClick={closeMenu}>Profile</RouterLink>
        <div className="nav-user-email">{user.email}</div>
      </li>
      <li>
        <a
          href="#!"
          onClick={async (e) => {
            e.preventDefault();
            await handleSignOut();
          }}
        >
          Sign out
        </a>
      </li>
    </>
  ) : (
    <>
      <li><RouterLink to="/login" onClick={closeMenu}>Log in</RouterLink></li>
      <li><RouterLink to="/signup" onClick={closeMenu}>Sign up</RouterLink></li>
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
          </ul>

          <button
            type="button"
            className={`menu-icon ${ (isPhone && menuOpen) ? 'hide-on-overlay' : '' }`}
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-dropdown nav-menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
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
          <li><a href="#!" onClick={(e) => { noop(e); closeMenu(); }}>Who we are</a></li>
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
        <div
          className="nav-panel"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="nav-close"
            aria-label="Close menu"
            onClick={closeMenu}
          >
            <FaTimes />
          </button>

          <ul className="nav-links">
            <li><ScrollLink to="why" smooth duration={500} onClick={closeMenu}>Why It Matters</ScrollLink></li>
            <li><ScrollLink to="how" smooth duration={500} onClick={closeMenu}>How it Works</ScrollLink></li>
            <li><ScrollLink to="dimensions" smooth duration={500} onClick={closeMenu}>Your Dimensions</ScrollLink></li>
            <li><ScrollLink to="archetypes" smooth duration={500} onClick={closeMenu}>Career Profiles</ScrollLink></li>
            <li><ScrollLink to="science" smooth duration={500} onClick={closeMenu}>The Science</ScrollLink></li>
            <li><a href="#!" onClick={(e) => { noop(e); closeMenu(); }}>Who we are</a></li>
            <li><ScrollLink to="start" smooth duration={500} onClick={closeMenu}>Start Your Journey</ScrollLink></li>
            {userMenu}
          </ul>
        </div>
      </div>
    </>
  );
}
