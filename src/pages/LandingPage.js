// pages/LandingPage.js
// Updated to compose extracted components with scroll target for "Start Your Journey"

import React, { useState } from 'react';
import '../styles/global.css';  // Import globals if needed
import Navbar from '../Components/Landing/Navbar';
import Hero from '../Components/Landing/Hero';
import WhySection from '../Components/Landing/WhySection';
import HowSection from '../Components/Landing/HowSection';
import DimensionsSection from '../Components/Landing/DimensionsSection';
import ArchetypesSection from '../Components/Landing/ArchetypesSection';
import ScienceSection from '../Components/Landing/ScienceSection';
import CtaSection from '../Components/Landing/CtaSection';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing-wrapper">
      <Navbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main className="content-wrapper">
        <Hero />
        <WhySection />
        <HowSection />
        <DimensionsSection />
        <ArchetypesSection />
        <ScienceSection />
        <CtaSection />
      </main>
    </div>
  );
}