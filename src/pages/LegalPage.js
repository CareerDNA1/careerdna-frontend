import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../Assets/images/logo-career-dna.png';
import './AuthPage.css';

export const CAREERDNA_LEGAL_VERSION = '2026-05-19-v5';

export const LEGAL_COPY = {
  terms: {
    title: 'Terms of Use',
    intro:
      'These Terms of Use form a legal agreement between CareerDNA and each person who accesses or uses the CareerDNA platform. By creating an account, signing in, completing a questionnaire, generating a report, using AI-supported features or otherwise accessing the service, you agree to these Terms and to the Privacy Notice below.',
    sections: [
      {
        heading: '1. Definitions',
        body:
          'In these Terms, “CareerDNA”, “we”, “us” and “our” refer to the provider of the CareerDNA platform. “User”, “you” and “your” refer to any person who accesses or uses the service. “Services” means the CareerDNA website, app, questionnaires, scoring tools, reports, AI-supported explanations, advisor features, dashboards, content, recommendations and related functionality. “Partner” means any school, university, employer, training provider or other organisation that introduces, purchases, administers or supports access to CareerDNA.',
      },
      {
        heading: '2. Eligibility and acceptance',
        body:
          'You may use CareerDNA only if you are legally able to agree to these Terms or have appropriate permission from a parent, guardian, school or other responsible organisation. CareerDNA is intended primarily for students, graduates and young people exploring education and career options, including users aged approximately 14 to 21. If you are under 18, you should use CareerDNA with appropriate adult, school or institutional support where required.',
      },
      {
        heading: '3. What CareerDNA provides',
        body:
          'CareerDNA is an educational career exploration and personal development platform. It helps users reflect on strengths, interests, motivations, working preferences, possible study areas, career worlds and career pathways. The Services are designed to support learning, reflection and discussion. They are not a psychological diagnosis, medical assessment, counselling service, regulated careers advice service, recruitment service, university admissions service, immigration service, financial advice service or legal advice service.',
      },
      {
        heading: '4. No guarantee of outcomes',
        body:
          'CareerDNA does not guarantee that any result, pathway, subject suggestion, career area, role, report, advisor response or recommendation will be accurate, complete, suitable for every user or lead to any particular education, employment, admissions, financial or personal outcome. You remain responsible for your own choices and should seek appropriate human advice before making important decisions.',
      },
      {
        heading: '5. Career profiling and interpretation of results',
        body:
          'CareerDNA uses questionnaire answers, scoring logic, user inputs, curated information and AI-supported explanations to generate personalised outputs. These outputs are intended as guidance and reflection tools only. They should not be treated as fixed labels, formal assessments, predictions of ability, employability, mental health, personality, academic success or future performance. CareerDNA results are exploratory and developmental: they reflect current self-reported patterns, preferences and interests at the time of use, and they may change as users grow, learn, gain experience and make new choices.',
      },
      {
        heading: '6. Ethical use and anti-labelling',
        body:
          'CareerDNA is designed to support curiosity, self-awareness, discussion and growth. Users, parents, schools, universities, employers and Partners must not use archetypes, scores, recommendations or reports to label, limit, stereotype, exclude or make assumptions about a person’s potential. Results should be used to open up possibilities, not close them down. In particular, younger users should be encouraged to treat their results as a starting point for exploration rather than a fixed identity or permanent judgement.',
      },
      {
        heading: '7. AI-supported content',
        body:
          'Some reports, explanations, summaries and advisor responses may be generated or supported by artificial intelligence. AI systems can produce content that is inaccurate, incomplete, outdated, biased, misunderstood or inappropriate for a particular context. You must not rely on AI-supported content as your only source of advice. Important decisions should be discussed with a parent, guardian, teacher, careers adviser, university adviser, employer, professional or other trusted person as appropriate.',
      },
      {
        heading: '8. Accounts and account security',
        body:
          'You must provide accurate account information, keep your login details confidential and use only your own account. You must not share your password, impersonate another person, access another user’s account or attempt to bypass authentication or security controls. If you use CareerDNA on a shared, school, university, workplace or public device, you should log out when finished.',
      },
      {
        heading: '9. Acceptable use',
        body:
          'You must not misuse CareerDNA. This includes attempting to damage, overload, disrupt, scrape, copy, reverse engineer, decompile, probe, scan or bypass the Services; uploading malware or harmful code; using bots or automated extraction tools without permission; submitting abusive, unlawful, discriminatory, harassing or misleading content; infringing intellectual property rights; or using CareerDNA in a way that could harm users, partners, systems or the reputation of the platform.',
      },
      {
        heading: '10. Suspension and termination',
        body:
          'We may suspend, restrict or terminate access to CareerDNA at any time where we reasonably believe there has been a breach of these Terms, misuse of the Services, non-payment, security risk, unlawful activity, unauthorised access, suspected fraud or behaviour that may harm CareerDNA, users, partners or service providers.',
      },
      {
        heading: '11. Plans, payments, subscriptions and credits',
        body:
          'Some features may require payment, a subscription, a coupon, institutional access or usage credits. Unless stated otherwise at the point of purchase or allocation, credits are personal to the account, non-transferable, have no cash value and may expire. We may change pricing, packages, limits, features and usage allowances from time to time. Refunds, renewals and cancellations are governed by the information shown at checkout, applicable consumer law and any additional offer terms.',
      },
      {
        heading: '12. School, university, employer or partner access',
        body:
          'CareerDNA may be provided directly to individual users or through a Partner. Where a Partner introduces, purchases or administers access, additional terms, privacy information or data processing arrangements may apply. Partners must not use CareerDNA as the sole basis for high-stakes decisions about any person, including admissions, exclusion, discipline, grading, hiring, dismissal, safeguarding, funding or access to opportunities.',
      },
      {
        heading: '13. Younger users',
        body:
          'CareerDNA is designed to be understandable and proportionate for younger users, but users under 18 should not make major education, career, wellbeing, financial or personal decisions based only on CareerDNA results. Where the platform is used in a school or similar setting, the school or Partner may provide additional guidance, supervision or consent processes.',
      },
      {
        heading: '14. Intellectual property',
        body:
          'All intellectual property rights in CareerDNA, including the name, brand, interface, design, software, code, scoring logic, archetype logic, prompts, reports, explanations, datasets, graphics, text, recommendations and platform content, belong to CareerDNA or its licensors. Users may use their own results and reports for personal education, reflection, applications, coaching and career development. Users must not copy, resell, publish, redistribute, train competing systems on, reverse engineer or commercially exploit CareerDNA materials without written permission.',
      },
      {
        heading: '15. User content and licence',
        body:
          'You are responsible for the information you submit, including questionnaire answers, introductory responses, advisor messages, feedback, preferences and support requests. By submitting content, you grant CareerDNA and its service providers a limited licence to process that content as necessary to provide, secure, maintain, improve and support the Services, generate outputs, manage accounts and comply with legal obligations.',
      },
      {
        heading: '16. Service availability and changes',
        body:
          'CareerDNA is provided on an “as is” and “as available” basis. We do not guarantee that the Services will be uninterrupted, error-free, secure or available at all times. We may update, suspend, withdraw, replace or change features, reports, wording, scoring models, AI models, datasets, pricing, limits, designs and functionality for legal, security, operational, commercial, performance or product reasons.',
      },
      {
        heading: '17. Disclaimers',
        body:
          'To the fullest extent permitted by law, CareerDNA gives no warranties that the Services, reports, recommendations, AI outputs, career information or platform content will be accurate, complete, current, suitable for a particular purpose or free from errors. Nothing in these Terms excludes rights that cannot legally be excluded, including mandatory consumer rights.',
      },
      {
        heading: '18. Limitation of liability',
        body:
          'To the fullest extent permitted by law, CareerDNA shall not be liable for indirect, consequential or special losses, loss of opportunity, loss of profit, loss of business, loss of data caused by user action, reputational loss, educational or employment outcomes, decisions made in reliance on CareerDNA outputs, or losses arising from unauthorised access where we have used reasonable safeguards. Nothing in these Terms limits liability for death or personal injury caused by negligence, fraud or any liability that cannot legally be limited.',
      },
      {
        heading: '19. Third-party services',
        body:
          'CareerDNA may rely on third-party providers for hosting, authentication, database storage, payments, analytics, security, email delivery, support tools and AI-supported generation. We are not responsible for third-party services outside our reasonable control, but we aim to use reputable providers and appropriate contractual safeguards where required.',
      },
      {
        heading: '20. Changes to these Terms',
        body:
          'We may update these Terms from time to time. Where changes are material, we may notify users through the platform, by email or by requiring renewed acceptance. Continued use of CareerDNA after updated Terms take effect means the user accepts the updated Terms.',
      },
      {
        heading: '21. Governing law and jurisdiction',
        body:
          'These Terms are governed by the laws of England and Wales. The courts of England and Wales shall have exclusive jurisdiction over disputes relating to these Terms or the Services, except where mandatory consumer protection laws give users the right to bring claims elsewhere.',
      },
      {
        heading: '22. Contact',
        body:
          'Questions about these Terms, accounts, payments, school access, partner access or use of the Services should be sent through the contact or support details provided by CareerDNA on the platform or website.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Notice',
    intro:
      'This Privacy Notice explains how CareerDNA collects, uses, stores and shares personal information. It is intended to be clear for students, young people, parents, schools, universities and individual users, while also explaining the main legal and operational basis for our data processing.',
    sections: [
      {
        heading: '1. Who is responsible for your data',
        body:
          'CareerDNA is responsible for personal information processed through the platform unless a separate school, university, employer or Partner agreement states otherwise. In some institutional settings, a Partner may also have responsibilities for how the service is introduced, administered or explained to users.',
      },
      {
        heading: '2. Information we collect',
        body:
          'We may collect account details such as name, email address, password or authentication information; age range, education stage, country, school or university context; questionnaire answers; introductory responses; calculated scores; archetype results; career worlds, pathways and subject suggestions; generated reports; advisor conversations; likes, dislikes and feedback choices; plan, coupon, payment or credit information; support messages; and technical data such as device type, browser, IP address, logs, cookies and security events.',
      },
      {
        heading: '3. How we use information',
        body:
          'We use personal information to create and manage accounts, authenticate users, provide questionnaires, calculate scores, generate reports, personalise recommendations, operate AI-supported features, save results, provide advisor functionality, administer plans or credits, process payments, provide support, maintain security, prevent misuse, fix bugs, improve reliability, understand product usage and comply with legal, regulatory, accounting or contractual obligations.',
      },
      {
        heading: '4. Career profiling',
        body:
          'CareerDNA uses questionnaire responses and related profile information to generate personalised career and education guidance. This is profiling for educational and career exploration purposes. It is not a medical, psychological, employment, admissions or legally significant automated decision-making process. Users and Partners should not treat CareerDNA outputs as the sole basis for important decisions.',
      },
      {
        heading: '5. AI processing',
        body:
          'CareerDNA may send limited user profile information, recommendations, questionnaire summaries or conversation content to trusted AI service providers to generate reports, explanations or advisor responses. We aim to limit the information shared to what is reasonably necessary for the requested feature and to use providers subject to appropriate contractual and technical safeguards.',
      },
      {
        heading: '6. Legal basis for processing',
        body:
          'Depending on the situation, we process personal information because it is necessary to provide the service requested by the user, because we have legitimate interests in operating, securing, improving and supporting the platform, because we need to comply with legal obligations, because a Partner arrangement supports the use of the platform, or because the user has given consent for a specific activity where consent is required.',
      },
      {
        heading: '7. Younger users and children’s data',
        body:
          'CareerDNA may be used by younger users, including users aged under 18. We aim to collect only proportionate information, explain the service clearly, avoid unnecessary data use and apply privacy-conscious defaults. Where the service is used through a school or Partner, that organisation may provide additional notices, consent processes or support arrangements.',
      },
      {
        heading: '8. Sharing with schools, universities or partners',
        body:
          'Where CareerDNA is provided through a Partner, that Partner may help administer access, support users or understand engagement. Any access to identifiable individual results should be explained through the relevant Partner arrangement or privacy information. Aggregated or anonymised information may be shared to understand usage, completion, engagement or programme impact, provided individuals are not reasonably identifiable.',
      },
      {
        heading: '9. Service providers and subprocessors',
        body:
          'We may use trusted providers for hosting, cloud infrastructure, database storage, authentication, email delivery, analytics, payment processing, security monitoring, customer support and AI-supported generation. These providers are permitted to process information only as needed to provide services to CareerDNA and should be subject to appropriate confidentiality, security and data protection obligations.',
      },
      {
        heading: '10. Analytics and product improvement',
        body:
          'We may use analytics to understand how users move through the platform, whether journeys are completed, where errors occur and which features need improvement. We aim to keep analytics proportionate and avoid placing sensitive raw questionnaire content into analytics tools unless there is a clear operational, safety or reliability reason and appropriate safeguards are in place.',
      },
      {
        heading: '11. Payments and transaction data',
        body:
          'Where paid features are used, payment information may be processed by payment providers. CareerDNA may receive limited payment status, subscription, invoice, coupon, plan or credit information. We do not intend to store full card details unless explicitly stated and handled through an appropriate payment provider.',
      },
      {
        heading: '12. Cookies and similar technologies',
        body:
          'CareerDNA may use cookies or similar technologies for login, security, preferences, analytics and platform performance. Where required by law, users may be given choices about non-essential cookies. Essential cookies may be required for the platform to function correctly.',
      },
      {
        heading: '13. Data retention',
        body:
          'We keep personal information for as long as reasonably necessary to provide accounts, saved results, reports, advisor history, support, payments, security records, legal records, audit trails and dispute resolution. Users may request deletion of their account or certain information, but some limited records may need to be retained for legal, accounting, security or legitimate operational reasons.',
      },
      {
        heading: '14. User rights',
        body:
          'Subject to applicable data protection law, users may have rights to access, correct, delete, restrict, object to processing of, or receive a copy of their personal information. Requests may require identity verification. Some requests may be limited where information is needed for legal, security, payment, institutional, safeguarding, audit or dispute-resolution reasons.',
      },
      {
        heading: '15. Security',
        body:
          'CareerDNA uses technical and organisational measures intended to protect personal information, including authentication, access controls, secure infrastructure and appropriate provider safeguards. No online service can guarantee absolute security. Users should keep passwords private, use secure devices and log out on shared devices.',
      },
      {
        heading: '16. International transfers',
        body:
          'Some providers may process information in countries outside the user’s country of residence. Where required, CareerDNA aims to use appropriate safeguards such as contractual protections, adequacy mechanisms or provider commitments designed to protect transferred information.',
      },
      {
        heading: '17. Data accuracy',
        body:
          'CareerDNA outputs depend on the accuracy and completeness of the information users provide. Users can improve the usefulness of their results by answering honestly and carefully. Users may request correction of account information or other personal data where appropriate.',
      },
      {
        heading: '18. Changes to this Privacy Notice',
        body:
          'We may update this Privacy Notice from time to time. Where changes are material, we may notify users through the platform, by email or by requesting renewed review or acceptance.',
      },
      {
        heading: '19. Contact and data requests',
        body:
          'Questions about privacy, data use, AI processing, school access, deletion, correction or user rights should be sent through the contact or support details provided by CareerDNA on the platform or website.',
      },
    ],
  },
};

function LegalSection({ data }) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionList}>
        {data.sections.map((section) => {
          const match = section.heading.match(/^(\d+)\.\s*(.*)$/);
          const number = match ? match[1] : null;
          const heading = match ? match[2] : section.heading;

          return (
            <article key={section.heading} style={styles.item}>
              <div style={styles.itemTitleRow}>
                {number && <span style={styles.itemNumber}>{number}</span>}
                <h3 style={styles.itemTitle}>{heading}</h3>
              </div>
              <p style={styles.itemBody}>{section.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TrustFooter() {
  return (
    <div style={styles.trustFooter}>
      <span style={styles.trustFooterIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false" style={styles.trustFooterSvg}>
          <path d="M12 3.4 18.2 6v5.2c0 4.1-2.5 7.6-6.2 9.2-3.7-1.6-6.2-5.1-6.2-9.2V6L12 3.4Z" />
          <path d="m9.5 12.2 1.7 1.7 3.7-4" />
        </svg>
      </span>
      <p style={styles.trustFooterText}>
        Your data is protected and only used to support your CareerDNA experience.
      </p>
    </div>
  );
}

function TabIcon({ type }) {
  if (type === 'privacy') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={styles.tabIconSvg}>
        <path d="M7.5 10.2V8.1a4.5 4.5 0 0 1 9 0v2.1" />
        <path d="M6.2 10.2h11.6v8.6H6.2v-8.6Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={styles.tabIconSvg}>
      <path d="M7 4.8h7.1L17 7.7v11.5H7V4.8Z" />
      <path d="M14 4.9v3h3" />
      <path d="M9.5 12h5" />
      <path d="M9.5 15h4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <span style={styles.titleIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false" style={styles.titleIconSvg}>
        <path d="M12 3.4 18.2 6v5.2c0 4.1-2.5 7.6-6.2 9.2-3.7-1.6-6.2-5.1-6.2-9.2V6L12 3.4Z" />
      </svg>
    </span>
  );
}

function LegalPanel({ initialTab = 'terms', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'terms');

  useEffect(() => {
    setActiveTab(initialTab || 'terms');
  }, [initialTab]);

  const activeCopy = LEGAL_COPY[activeTab] || LEGAL_COPY.terms;

  return (
    <section className="auth-card" style={styles.card} aria-labelledby="legal-title">
      <header style={styles.topBar}>
        <div style={styles.headingRow}>
          <ShieldIcon />
          <h1 id="legal-title" className="auth-title" style={styles.title}>Terms &amp; Privacy</h1>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" style={styles.closeButton}>×</button>
      </header>

      <div style={styles.tabsWrap}>
        <button
          type="button"
          onClick={() => setActiveTab('terms')}
          style={{ ...styles.tab, ...(activeTab === 'terms' ? styles.tabActive : {}) }}
        >
          <TabIcon type="terms" />
          Terms of Use
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          style={{ ...styles.tab, ...(activeTab === 'privacy' ? styles.tabActive : {}) }}
        >
          <TabIcon type="privacy" />
          Privacy Notice
        </button>
      </div>

      <div style={styles.content}>
        <LegalSection data={activeCopy} />
      </div>

      <footer style={styles.footer}>
        <TrustFooter />
        <button type="button" className="auth-button" onClick={onClose} style={styles.doneButton}>
          Done
        </button>
      </footer>
    </section>
  );
}

export function LegalModal({ initialTab = 'terms', onClose }) {
  if (!onClose) return null;

  return (
    <div
      style={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <LegalPanel initialTab={initialTab} onClose={onClose} />
    </div>
  );
}

export default function LegalPage() {
  const navigate = useNavigate();
  const [initialTab, setInitialTab] = useState('terms');

  useEffect(() => {
    if (window.location.hash === '#privacy') setInitialTab('privacy');
    if (window.location.hash === '#terms') setInitialTab('terms');
  }, []);

  return (
    <main className="auth-page" style={styles.page}>
      <Link to="/" className="auth-page-logo-link" aria-label="Go to CareerDNA home" style={styles.logoLink}>
        <img src={logo} alt="CareerDNA" className="auth-page-logo" />
      </Link>

      <div className="auth-page-shell" style={styles.shell}>
        <LegalPanel initialTab={initialTab} onClose={() => navigate(-1)} />
      </div>
    </main>
  );
}

function LegalDocumentPage({ type = 'terms' }) {
  const data = LEGAL_COPY[type] || LEGAL_COPY.terms;

  return (
    <main style={styles.documentPage}>
      <header style={styles.documentNav} aria-label="CareerDNA legal navigation">
        <Link to="/" style={styles.documentLogoLink} aria-label="Back to CareerDNA home">
          <img src={logo} alt="CareerDNA" style={styles.documentLogo} />
        </Link>

        <Link to="/" style={styles.documentHomeLink} aria-label="Back to CareerDNA home">
          <span aria-hidden="true">⌂</span>
          <span>Back to home</span>
          <span aria-hidden="true">›</span>
        </Link>
      </header>

      <section style={styles.documentSection} aria-labelledby={`${type}-page-title`}>
        <div style={styles.documentInner}>
          <div style={styles.documentHeading}>
            <h1 id={`${type}-page-title`} style={styles.documentTitle}>{data.title}</h1>
            <p style={styles.documentIntro}>{data.intro}</p>
            <div style={styles.documentDivider} />
          </div>

          <article style={styles.documentCard}>
            <LegalSection data={data} />
          </article>
        </div>
      </section>
    </main>
  );
}

export function TermsPage() {
  return <LegalDocumentPage type="terms" />;
}

export function PrivacyPage() {
  return <LegalDocumentPage type="privacy" />;
}

// IMAGE_STYLE_LEGAL_MODAL_2026_05_23
const styles = {
  documentPage: {
    minHeight: '100vh',
    fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#222',
    lineHeight: 1.6,
    background: 'linear-gradient(180deg, #f0f5ff 0%, #f8fafc 100%)',
  },
  documentNav: {
    minHeight: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px clamp(20px, 5vw, 40px)',
    boxSizing: 'border-box',
  },
  documentLogoLink: {
    display: 'inline-flex',
    alignItems: 'center',
    textDecoration: 'none',
  },
  documentLogo: {
    maxHeight: '80px',
    width: 'auto',
    display: 'block',
    objectFit: 'contain',
  },
  documentHomeLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#2f6fed',
    textDecoration: 'none',
    fontSize: '0.86rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    lineHeight: 1,
    padding: '10px 13px',
    borderRadius: '999px',
  },
  documentSection: {
    padding: 'clamp(22px, 4vw, 44px) 24px clamp(56px, 8vw, 88px)',
  },
  documentInner: {
    width: '100%',
    maxWidth: '980px',
    margin: '0 auto',
  },
  documentHeading: {
    maxWidth: '820px',
    margin: '0 auto 34px',
    textAlign: 'center',
  },
  documentTitle: {
    margin: '0 0 14px',
    color: '#2f6fed',
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    lineHeight: 1.12,
  },
  documentIntro: {
    maxWidth: '780px',
    margin: '0 auto',
    color: '#4b5c6b',
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.7,
  },
  documentDivider: {
    height: '1px',
    width: '100%',
    maxWidth: '600px',
    margin: '28px auto 0',
    background: 'linear-gradient(90deg, transparent 0%, #d1dbe8 50%, transparent 100%)',
  },
  documentCard: {
    padding: 'clamp(24px, 3vw, 38px)',
    borderRadius: '20px',
    background: '#ffffff',
    border: '1px solid rgba(209, 219, 232, 0.82)',
    boxShadow: '0 18px 45px rgba(23, 45, 85, 0.07)',
    boxSizing: 'border-box',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '22px',
    background: 'rgba(15, 23, 42, 0.55)',
    backdropFilter: 'blur(2px)',
  },
  page: {
    minHeight: '100vh',
    padding: '24px 16px',
    background: 'radial-gradient(circle at top, rgba(196, 205, 216, 0.72) 0%, rgba(142, 154, 169, 0.82) 46%, rgba(91, 105, 121, 0.88) 100%)',
    backdropFilter: 'blur(10px)',
  },
  logoLink: {
    display: 'none',
  },
  shell: {
    minHeight: 'calc(100vh - 44px)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 'min(92vw, 560px)',
    maxWidth: '560px',
    height: 'min(72vh, 500px)',
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
    borderRadius: '18px',
    overflow: 'hidden',
    background: '#ffffff',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)',
    border: '1px solid rgba(226, 232, 240, 0.95)',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #edf2f7',
    background: '#ffffff',
    flexShrink: 0,
  },
  headingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    minWidth: 0,
  },
  titleIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#eef4ff',
    color: '#2563eb',
    flexShrink: 0,
  },
  titleIconSvg: {
    width: '25px',
    height: '25px',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  title: {
    margin: 0,
    fontSize: '1.08rem',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    color: '#2563eb',
    fontWeight: 800,
  },
  closeButton: {
    width: '38px',
    height: '38px',
    border: 0,
    borderRadius: '999px',
    background: '#f1f5f9',
    color: '#64748b',
    fontSize: '1.5rem',
    lineHeight: 1,
    cursor: 'pointer',
    flexShrink: 0,
  },
  tabsWrap: {
    display: 'flex',
    gap: '10px',
    padding: '14px 24px 12px',
    borderBottom: '1px solid #edf2f7',
    background: '#ffffff',
    flexShrink: 0,
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    minWidth: '130px',
    border: '1px solid #d8e1ee',
    borderRadius: '999px',
    background: '#ffffff',
    color: '#334155',
    padding: '9px 16px',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: 'none',
  },
  tabActive: {
    background: '#2563eb',
    borderColor: '#2563eb',
    color: '#ffffff',
    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.18)',
  },
  tabIconSvg: {
    width: '18px',
    height: '18px',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  content: {
    padding: '18px 26px 10px',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 transparent',
    flex: 1,
    background: '#ffffff',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    padding: '14px 22px',
    borderTop: '1px solid #dfe7f1',
    background: '#ffffff',
    flexShrink: 0,
  },
  doneButton: {
    width: '104px',
    marginTop: 0,
    minHeight: '40px',
    borderRadius: '10px',
    background: '#2563eb',
    fontSize: '0.85rem',
    fontWeight: 700,
    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.18)',
  },
  section: {
    margin: 0,
  },
  sectionTitle: {
    display: 'none',
  },
  intro: {
    display: 'none',
  },
  sectionList: {
    display: 'grid',
    gap: '20px',
  },
  item: {
    padding: '0',
    border: '0',
    background: '#ffffff',
  },
  itemTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '10px',
  },
  itemNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '7px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#eaf2ff',
    color: '#1767f2',
    fontSize: '0.85rem',
    fontWeight: 800,
    lineHeight: 1,
    flexShrink: 0,
  },
  itemTitle: {
    margin: 0,
    color: '#1e3a5f',
    fontSize: '0.92rem',
    fontWeight: 800,
    lineHeight: 1.2,
  },
  itemBody: {
    margin: 0,
    color: '#475569',
    lineHeight: 1.55,
    fontSize: '0.87rem',
  },
  trustFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: 0,
    color: '#58708c',
  },
  trustFooterIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#eef4ff',
    color: '#1767f2',
    flexShrink: 0,
  },
  trustFooterSvg: {
    width: '22px',
    height: '22px',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  trustFooterText: {
    margin: 0,
    maxWidth: '280px',
    color: '#64748b',
    fontSize: '0.8rem',
    lineHeight: 1.3,
  },
};
