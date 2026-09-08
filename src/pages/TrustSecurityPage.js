import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import './TrustSecurityPage.css';
import logo from '../Assets/images/logo-career-dna.png';
import { LegalModal } from './LegalPage';

const cards = [
  {
    icon: '🔒',
    title: 'Security & Infrastructure',
    body: 'CareerDNA uses secure cloud infrastructure and platform safeguards to help protect user information.',
    bullets: [
      'Encrypted HTTPS/TLS connections',
      'Secure cloud hosting',
      'Controlled production access',
      'Authentication managed through Supabase',
      'Google sign-in support for secure account access',
      'Daily database backups',
    ],
    closing: 'Our production database is hosted within the European Union, in Ireland.',
  },
  {
    icon: '🛡️',
    title: 'Privacy & Data Protection',
    body: (
      <>
        Users can create an account using only an email address and password. CareerDNA follows a data minimisation
        approach and does not require unnecessary personal information to access the platform. Full details are available
        in our{' '}
        <button type="button" className="trust-inline-link" data-legal-tab="privacy">
          Privacy Notice
        </button>.
      </>
    ),
    bullets: [
      'Data minimisation principles',
      'Only limited information required to create an account',
      'Clear Privacy Notice and Terms of Use',
      'User control over personal information',
    ],
  },
  {
    icon: '☁️',
    title: 'Data Storage & Hosting',
    body: 'CareerDNA uses trusted technology providers to deliver the platform securely and reliably.',
    bullets: [
      'Supabase for authentication and database services',
      'Netlify for website hosting and content delivery',
      'Render for backend application hosting',
      'Stripe for secure payment processing',
      'OpenAI for personalised report and guidance generation',
    ],
    closing: 'Production data is hosted within the European Union and supported by trusted infrastructure providers.',
  },
  {
    icon: '✨',
    title: 'AI Processing',
    body: 'CareerDNA uses carefully controlled AI-supported features to generate personalised explanations, reports and guidance through secure backend systems.',
    bullets: [
      'API credentials are not exposed to users or browsers',
      'Only relevant information is used for the requested output',
      'AI outputs are intended to support reflection and exploration',
      'CareerDNA does not treat AI output as a formal assessment or final decision',
    ],
    closing: 'AI-supported guidance is designed to inform, not replace, human judgement.',
  },
  {
    icon: '📁',
    title: 'Data Retention & User Rights',
    body: 'Users can delete their account and associated platform data directly through their profile settings. Subject to applicable law, users may also have rights over the personal information held about them.',
    bullets: [
      'Access personal information',
      'Correct inaccurate information',
      'Delete your account directly through the platform',
      'Object to certain processing',
      'Withdraw consent where applicable',
    ],
    closing: 'Some limited records may be retained where required for security, legal, financial or operational reasons.',
  },
];

export default function TrustSecurityPage() {
  const [legalModal, setLegalModal] = useState(null);

  const openLegal = (tab) => {
    setLegalModal(tab);
  };

  const handleCardClick = (event) => {
    const tab = event.target?.dataset?.legalTab;
    if (tab) openLegal(tab);
  };

  return (
    <main className="trust-page">
      <header className="trust-page-nav" aria-label="Data privacy and platform protection navigation">
        <RouterLink to="/" className="trust-page-logo-link" aria-label="Back to CareerDNA home">
          <img src={logo} alt="CareerDNA Logo" className="trust-page-logo" />
        </RouterLink>

        <RouterLink to="/" className="trust-page-home-link" aria-label="Back to CareerDNA home">
          <span aria-hidden="true" className="trust-page-home-icon">⌂</span>
          <span>Back to home</span>
          <span aria-hidden="true" className="trust-page-home-arrow">›</span>
        </RouterLink>
      </header>

      <section className="trust-section" aria-labelledby="trust-title">
        <div className="trust-section__inner">
          <div className="trust-heading">
            <h1 id="trust-title">Data, Privacy and Platform Protection</h1>
            <p>
              CareerDNA is designed with privacy, security and responsible use at its core. We use trusted cloud
              infrastructure, secure authentication, data minimisation principles and carefully selected technology
              partners to help protect user information.
            </p>
            <div className="trust-section-divider" />
          </div>

          <div className="trust-grid">
            {cards.map((card) => (
              <article className="trust-card" key={card.title} onClick={handleCardClick}>
                <div className="trust-card-top">
                  <div className="trust-card-icon" aria-hidden="true">{card.icon}</div>
                  <div className="trust-card-intro">
                    <h2>{card.title}</h2>
                    <p className="trust-card-body">{card.body}</p>
                  </div>
                </div>

                {card.bullets?.length > 0 && (
                  <>
                    <div className="trust-card-rule" />
                    <ul className="trust-list">
                      {card.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}

                {card.closing && <p className="trust-card-closing">{card.closing}</p>}
              </article>
            ))}

            <article className="trust-card trust-card--legal">
              <div className="trust-card-top">
                <div className="trust-card-icon" aria-hidden="true">✉️</div>
                <div className="trust-card-intro">
                  <h2>Legal Information & Contact</h2>

                  <p className="trust-card-body trust-legal-text">
                    Our{' '}
                    <button type="button" className="trust-inline-link" onClick={() => openLegal('terms')}>
                      Terms of Use
                    </button>{' '}
                    and{' '}
                    <button type="button" className="trust-inline-link" onClick={() => openLegal('privacy')}>
                      Privacy Notice
                    </button>{' '}
                    explain how CareerDNA should be used, how we process personal information and how users can exercise
                    their rights.
                  </p>
                </div>
              </div>

              <div className="trust-card-rule" />

              <p className="trust-card-closing trust-contact-text">
                Privacy and security enquiries:{' '}
                <a className="trust-email-link" href="mailto:support@mycareerdna.io">
                  support@mycareerdna.io
                </a>
              </p>
            </article>
          </div>
        </div>
      </section>

      <footer className="trust-footer" aria-label="CareerDNA footer">
        <div className="trust-footer-inner">
          <p className="trust-footer-tagline">
            Science-backed career discovery for students and early career explorers.
          </p>

          <nav className="trust-footer-links" aria-label="Footer links">
            <button type="button" className="trust-footer-linkbtn" onClick={() => openLegal('privacy')}>
              Privacy Policy
            </button>
            <span aria-hidden="true">·</span>
            <button type="button" className="trust-footer-linkbtn" onClick={() => openLegal('terms')}>
              Terms of Use
            </button>
            <span aria-hidden="true">·</span>
            <a href="mailto:support@mycareerdna.io">Contact</a>
          </nav>

          <p className="trust-footer-copy">
            © 2026 CareerDNA. All rights reserved.
          </p>
        </div>
      </footer>

      {legalModal && <LegalModal initialTab={legalModal} onClose={() => setLegalModal(null)} />}
    </main>
  );
}
