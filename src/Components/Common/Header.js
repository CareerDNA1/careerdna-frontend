import React from 'react';
import logo from '../../Assets/images/logo-career-dna.png';
import styles from './Header.module.css';

function Header() {
  return (
    <header
      className={styles.header}
      contentEditable={false}       // 👈 prevents the caret from appearing if a parent is editable
      tabIndex={-1}                 // 👈 avoids accidental focus when navigating
    >
      <img
        src={logo}
        alt="Career DNA logo"
        className={styles.logo}
        draggable={false}           // 👈 avoids drag highlighting or focus flash
      />
    </header>
  );
}

export default Header;