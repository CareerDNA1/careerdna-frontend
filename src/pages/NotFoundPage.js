import { Link as RouterLink } from 'react-router-dom';
import logo from '../Assets/images/logo-career-dna.png';
import './TeamPage.css';
import './NotFoundPage.css';

// Shown for any address that does not exist. Uses the same page frame as the
// Team and Trust pages (nav, heading style, footer) so it reads as part of
// the site rather than a bare error screen.
export default function NotFoundPage() {
  return (
    <main className="team-page nf-page">
      <header className="team-page-nav" aria-label="Page navigation">
        <RouterLink to="/" className="team-page-logo-link" aria-label="Back to CareerDNA home">
          <img src={logo} alt="CareerDNA Logo" className="team-page-logo" />
        </RouterLink>

        <RouterLink to="/" className="team-page-home-link" aria-label="Back to CareerDNA home">
          <span aria-hidden="true" className="team-page-home-icon">⌂</span>
          <span>Back to home</span>
          <span aria-hidden="true" className="team-page-home-arrow">›</span>
        </RouterLink>
      </header>

      <section className="team-section nf-section" aria-labelledby="nf-title">
        <div className="team-section__inner">
          <div className="team-heading">
            <p className="nf-code">404</p>
            <h1 id="nf-title">Page not found</h1>
            <p>
              The page you are looking for does not exist or has been moved.
              Check the address, or use one of the links below.
            </p>
            <div className="nf-actions">
              <RouterLink to="/" className="nf-btn nf-btn--primary">Go to homepage</RouterLink>
              <RouterLink to="/profile" className="nf-btn nf-btn--ghost">Go to my profile</RouterLink>
            </div>
            <div className="team-section-divider" />
          </div>
        </div>
      </section>

      <footer className="team-footer" aria-label="CareerDNA footer">
        <div className="team-footer-inner">
          <p className="team-footer-tagline">
            Science-backed career discovery for students and early career explorers.
          </p>

          <nav className="team-footer-links" aria-label="Footer links">
            <a href="/legal#privacy">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a href="/legal#terms">Terms of Use</a>
            <span aria-hidden="true">·</span>
            <a href="/trust-security#accessibility">Accessibility</a>
            <span aria-hidden="true">·</span>
            <a href="mailto:hello@mycareerdna.io">Contact</a>
            <span aria-hidden="true">·</span>
            <a href="#report-problem">Report a problem</a>
          </nav>

          <p className="team-footer-copy">
            © 2026 CareerDNA. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
