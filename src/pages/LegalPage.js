import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../Assets/images/logo-career-dna.png';
import './AuthPage.css';

export const CAREERDNA_LEGAL_VERSION = '2026-10-05-v6';

// Company details shown in the Terms and Privacy Notice.
export const LEGAL_ENTITY = 'CareerDNA Ltd';
export const LEGAL_ADDRESS = '35a Priory Road, London, NW6 4NN, United Kingdom';
export const SUPPORT_EMAIL = 'hello@mycareerdna.io';
// Where the Supabase project (accounts, results, advisor history) is hosted.
export const DATA_REGION = 'the European Union (Ireland)';

export const LEGAL_COPY = {
  terms: {
    title: 'Terms of Use',
    intro:
      'These Terms of Use form a legal agreement between CareerDNA and each person who accesses or uses the CareerDNA platform. By creating an account, signing in, completing an assessment, generating a report, using AI-supported features or otherwise accessing the service, you agree to these Terms and to the Privacy Notice below.',
    sections: [
      {
        heading: '1. Definitions',
        body:
          'In these Terms, “CareerDNA”, “we”, “us” and “our” refer to the provider of the CareerDNA platform. “User”, “you” and “your” refer to any person who accesses or uses the service. “Services” means the CareerDNA website, app, assessments, scoring tools, reports, AI-supported explanations, advisor features, dashboards, content, recommendations and related functionality. “Partner” means any school, university, employer, training provider or other organisation that introduces, purchases, administers or supports access to CareerDNA.',
      },
      {
        heading: '2. Eligibility and acceptance',
        body:
          'You may use CareerDNA only if you are legally able to agree to these Terms or have appropriate permission from a parent, guardian, school or other responsible organisation. CareerDNA is for people aged 13 and over. You confirm you are 13 or over when you create an account, and give your date of birth when you start the assessment; we do not keep accounts for anyone under 13; a parent, guardian or school can contact us about access instead. CareerDNA is intended primarily for students, graduates and young people exploring education and career options. If you are under 18, you should use CareerDNA with appropriate adult, school or institutional support where required.',
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
          'CareerDNA uses assessment answers, scoring logic, user inputs, curated information and AI-supported explanations to generate personalised outputs. These outputs are intended as guidance and reflection tools only. They should not be treated as fixed labels, formal assessments, predictions of ability, employability, mental health, personality, academic success or future performance. CareerDNA results are exploratory and developmental: they reflect current self-reported patterns, preferences and interests at the time of use, and they may change as users grow, learn, gain experience and make new choices.',
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
          'Some features may require payment, a subscription, a coupon, institutional access or usage credits. Unless stated otherwise at the point of purchase or allocation, credits are personal to the account, non-transferable, have no cash value and may expire. We may change pricing, packages, limits, features and usage allowances from time to time. Refunds, renewals and cancellations are governed by the information shown at checkout, applicable consumer law and any additional offer terms. ' +
          'Purchases must be made by someone aged 18 or over. If you are under 18, a parent or guardian must complete the purchase for you and agrees to these Terms on your behalf. By completing a purchase you confirm this. ' +
          'Subscriptions are billed annually in advance and renew automatically at the end of each billing year unless cancelled. You can stop a subscription from renewing at any time from your account page; you keep access until the end of the billing year you have paid for and nothing further is charged. Advisor question packs are one-off purchases and are not refundable once the questions have been added to your account. ' +
          'Access to paid features starts as soon as your payment is confirmed. By completing checkout you ask us to start providing the service immediately and acknowledge this. Where applicable consumer law gives you a right to cancel within a period after purchase, any refund will reflect the service already provided during that period. If something has gone wrong with a purchase, contact ' + SUPPORT_EMAIL + ' and we will look into it.',
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
          'You are responsible for the information you submit, including assessment answers, introductory responses, advisor messages, feedback, preferences and support requests. By submitting content, you grant CareerDNA and its service providers a limited licence to process that content as necessary to provide, secure, maintain, improve and support the Services, generate outputs, manage accounts and comply with legal obligations.',
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
      'Last updated 5 October 2026. This notice explains, in plain language, what information CareerDNA collects about you, why, who else sees it, how long we keep it and what you can ask us to do. It is written so that students, parents, teachers and university staff can all follow it. If anything is unclear, email ' + SUPPORT_EMAIL + ' and we will explain.',
    sections: [
      {
        heading: '1. Who we are',
        body:
          'CareerDNA is run by ' + LEGAL_ENTITY + ', ' + LEGAL_ADDRESS + '. We are the data controller for the personal information processed through the platform, which means we decide how and why it is used and we are responsible for looking after it. Where a school, college or university gives you access to CareerDNA, it may also hold some responsibility for how the service is introduced to you; that organisation will tell you if so. You can contact us about anything in this notice at ' + SUPPORT_EMAIL + '.',
      },
      {
        heading: '2. What we collect',
        body:
          'Account: your name, email address and password (stored only in encrypted form). Age: at signup you confirm you are 13 or over. Your date of birth is asked once at the start of the assessment and used to show you content for your stage. Background: whether you are at school, college or university, your year, your subjects, your school or university name, your country, and whether you plan to go to university. Questionnaire: your answers to the CareerDNA questions and the scores, archetypes and recommendations calculated from them. Your choices: career worlds, pathways, degrees, apprenticeships and roles you like, dislike or save; predicted grades you enter; applications you record and any notes you add. Advisor: the questions you ask Your Advisor and the answers you receive. Payments: your plan, coupon use and payment status (your card details go to Stripe and never reach us). Support: problem reports and messages you send us. Technical: IP address, browser type, pages visited within CareerDNA, error logs and security events.',
      },
      {
        heading: '3. Why we use it',
        body:
          'To create your account and let you sign in. To check you are old enough to use CareerDNA and show options for your stage. To calculate your results and write your report. To tailor the degrees, apprenticeships, courses, live vacancies and advice we show you to your stage, subjects and grades. To remember what you have liked, saved and applied to. To run Your Advisor. To take payments and give you the plan you paid for. To answer your questions and fix problems. To keep the platform secure and prevent misuse. To understand, in aggregate, how CareerDNA is used so we can improve it. To meet legal, accounting and safeguarding duties.',
      },
      {
        heading: '4. Our legal reasons',
        body:
          'UK data protection law requires a legal reason for each use. Most of what we do is necessary to provide the service you asked for (contract). Security, product improvement, aggregated statistics and defending our legal position rely on our legitimate interests, which we balance against your interests, especially if you are under 18. Payment and accounting records are kept because the law requires it. Where we ask for your consent, for example to send you optional emails, you can withdraw it at any time. Safeguarding disclosures (section 9) are made to protect a person from harm.',
      },
      {
        heading: '5. Career profiling',
        body:
          'CareerDNA turns your answers into a profile and uses that profile to suggest career worlds, pathways, degrees and routes. This is profiling for education and career exploration only. It does not make decisions about you, and nothing in CareerDNA should be used by anyone as the sole basis for an important decision such as admission, grading, hiring or funding. You can question or disagree with any result, and the platform encourages you to.',
      },
      {
        heading: '6. Artificial intelligence',
        body:
          'Your report and Your Advisor are written with the help of OpenAI, an AI provider. We send OpenAI only what is needed: your assessment scores and recommendations, your education stage, your age band (for example 16 to 17, never your date of birth), whether you are in the UK or outside it, your subjects, your year and plans, your predicted grades if you entered them, your saved and applied items, your advisor questions and, for university students only, your university name. We do not send your name, email address, exact date of birth, school name or payment details. OpenAI processes this data to generate the response and, under our API terms, does not use it to train its models and deletes it after a short retention period for abuse monitoring. Advisor conversations are stored by CareerDNA so you can see them again.',
      },
      {
        heading: '7. Who else processes your data',
        body:
          'We use a small number of specialist companies to run CareerDNA. Each may only use your data to provide its service to us and is bound by a data processing agreement. Supabase: database and sign-in, where your account and results are stored. OpenAI: AI generation as described in section 6. Stripe: payments; Stripe handles your card and is its own controller for fraud prevention. Render: hosting for our server. Netlify: hosting for the website you see. Resend: sending transactional emails, including safeguarding alerts to our safeguarding lead. We also use public data from UCAS, the Office for Students, Discover Uni and the Institute for Apprenticeships to show rankings and courses; this does not involve your personal data.',
      },
      {
        heading: '8. Where your data is kept',
        body:
          'Your account, results and advisor history are stored in ' + DATA_REGION + '. Some providers, notably OpenAI, Stripe and parts of our hosting, process data in the United States. Where data leaves the UK we rely on the UK International Data Transfer Agreement or the UK Addendum to the EU Standard Contractual Clauses, together with each provider’s security commitments, so your data keeps the same level of protection.',
      },
      {
        heading: '9. Younger users and safeguarding',
        body:
          'CareerDNA is designed for people aged 13 and over and many of our users are 13 to 17. You confirm you are 13 or over at signup and give your date of birth at the start of the assessment; we do not knowingly keep accounts for anyone under 13, and if we learn an account belongs to a child under 13 we close it and delete the data. We collect only what the service needs, we do not show advertising, we do not sell or share data for marketing, and we do not use nudges to encourage you to give us more information. If a message to Your Advisor suggests you or someone else may be at risk of harm, the advisor responds with care and shows you where to get help. We also record the message as flagged and may alert our named safeguarding lead, and where we believe it is necessary to protect someone from serious harm we may share information with your school, a parent or guardian, or the relevant authorities. Parents and guardians of users under 16 may contact us about their child’s account; we will need to verify the relationship first.',
      },
      {
        heading: '10. Schools, colleges and universities',
        body:
          'Where you use CareerDNA through your school, college or university, that organisation can see aggregated information about how its students use the platform, such as completion rates and which career worlds are popular. It can see an individual student’s results only where the student has been told this clearly and the organisation’s agreement with us allows it. We never share advisor conversations with institutions except in the safeguarding circumstances described in section 9.',
      },
      {
        heading: '11. How long we keep it',
        body:
          'While your account is open we keep your data so your reports, favourites and history remain available to you. Advisor conversations are kept for the life of your account. Problem reports are kept for up to 2 years. Payment and invoice records are kept for 6 years as required by UK tax law. Security logs are kept for up to 12 months. If you do not sign in for 3 years we will email you and then delete your account unless you ask us not to. Anonymised statistics that cannot identify you may be kept indefinitely.',
      },
      {
        heading: '12. Deleting your account',
        body:
          'You can delete your account at any time from your Profile page. We then permanently delete your name, email address, date of birth, password, school or university name, grades, favourites, applications and notes, advisor conversations and problem reports, and we cancel any subscription without a refund for the remaining period. Your assessment scores, likes and dislikes are kept in anonymised form under a random code that cannot be linked back to you, so we can improve the model and report on usage. Payment records are kept in anonymised form for the legal retention period.',
      },
      {
        heading: '13. Cookies and local storage',
        body:
          'CareerDNA uses your browser’s local storage to keep you signed in and to remember your progress through the assessment. These are essential to the service. We do not use advertising cookies or third-party analytics trackers. Stripe sets its own cookies on its checkout page for fraud prevention, which are covered by Stripe’s privacy notice.',
      },
      {
        heading: '14. Your rights',
        body:
          'You have the right to ask for a copy of your data, to have mistakes corrected, to have your data deleted, to limit or object to how we use it, to receive your data in a portable format and to withdraw any consent you have given. You can see and change most of your data yourself on the Profile page, and you can delete your account there. For anything else, email ' + SUPPORT_EMAIL + '. We will respond within one month and may need to confirm your identity first. These rights apply at any age; if you are under 18 you can exercise them yourself.',
      },
      {
        heading: '15. Security',
        body:
          'All data travels over encrypted connections and is stored encrypted at rest. Passwords are never stored in readable form. Access to your data is restricted by account so that no other user can read it, and our own staff access is limited and logged. Payments are handled entirely by Stripe, which is certified to the PCI DSS standard. No online service can promise absolute security, so please keep your password private and sign out on shared devices. If we ever suffer a breach that is likely to put you at risk we will tell you and the Information Commissioner’s Office without undue delay.',
      },
      {
        heading: '16. Changes to this notice',
        body:
          'When we make a significant change we will update the date at the top, tell you through the platform or by email and, where the change affects how your data is used, ask you to review and accept the new notice when you next sign in. Earlier versions are available on request.',
      },
      {
        heading: '17. Questions and complaints',
        body:
          'Contact us first at ' + SUPPORT_EMAIL + ' or by post at ' + LEGAL_ENTITY + ', ' + LEGAL_ADDRESS + '; we aim to resolve concerns quickly. You also have the right to complain to the UK regulator, the Information Commissioner’s Office (ICO), at ico.org.uk or on 0303 123 1113.',
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
