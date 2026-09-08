import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../Assets/images/logo-career-dna.png';
import styles from './Header.module.css';

function Header() {
  return (
    <header
      className={styles.header}
      contentEditable={false}       // 👈 prevents the caret from appearing if a parent is editable
      tabIndex={-1}                 // 👈 avoids accidental focus when navigating
    >
      <Link to="/profile" className={styles.logoLink} aria-label="Back to your profile">
        <img
          src={logo}
          alt="Career DNA logo"
          className={styles.logo}
          draggable={false}           // 👈 avoids drag highlighting or focus flash
        />
      </Link>

      <Link to="/profile" className={styles.backLink} aria-label="Back to your profile">
        <span aria-hidden="true" className={styles.backIcon}>⌂</span>
        <span>Back to profile</span>
        <span aria-hidden="true" className={styles.backArrow}>›</span>
      </Link>
    </header>
  );
}

export default Header;
