import React, { useEffect, useState } from 'react';
import './ReportLimitModal.css';
import PricingModal, { PAYMENTS_TEMPORARILY_PAUSED } from './PricingModal';
import { fetchAdvisorPacks, createAdvisorPackCheckout, formatPackPrice } from '../../utils/stripeCheckout';

function AccessCodeIcon() {
  return (
    <span className="report-limit-modal__input-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M7.2 10.4V8a4.8 4.8 0 0 1 9.6 0v2.4" />
        <path d="M5.8 10.4h12.4v8.4H5.8v-8.4Z" />
        <path d="M12 14.1v1.8" />
      </svg>
    </span>
  );
}

export default function ReportLimitModal({
  onClose,
  onReturnToProfile,
  onApplyCoupon,
  onSeePackages,
  mode = 'starter',
  currentPlan = 'free',
  entitlement = null,
  featureLabel = '',
  audience = 'school',
}) {
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);

  const isExhausted =
    mode === 'exhausted' ||
    mode === 'reports-exhausted' ||
    mode === 'limit-reached';

  const isPremiumFeature = mode === 'premium';
  const isAdvisor = mode === 'advisor';

  const planKey = String(currentPlan || 'free').toLowerCase();
  const isPaidPlan = ['explore', 'premium', 'premium_school', 'premium_university', 'dev'].includes(planKey);
  const canUpgradeToPremium = planKey === 'explore';

  // Advisor question packs (loaded only for the advisor mode, paid plans).
  const [packs, setPacks] = useState([]);
  const [packLoading, setPackLoading] = useState('');
  const [packError, setPackError] = useState('');
  const [packConsent, setPackConsent] = useState(false);
  useEffect(() => {
    if (!isAdvisor || !isPaidPlan || PAYMENTS_TEMPORARILY_PAUSED) return undefined;
    let cancelled = false;
    fetchAdvisorPacks().then((rows) => { if (!cancelled) setPacks(rows); });
    return () => { cancelled = true; };
  }, [isAdvisor, isPaidPlan]);

  const buyPack = async (pack) => {
    setPackError('');
    setPackLoading(pack.key);
    try {
      const data = await createAdvisorPackCheckout(pack.key);
      window.location.href = data.url;
    } catch (err) {
      setPackError(err?.message || 'Could not start checkout.');
      setPackLoading('');
    }
  };

  // Headline says why the dialog appeared; the lines underneath use the same
  // wording as the pricing page. `title` is an array of [plain, accent] parts.
  const isUniversity = String(audience || '').toLowerCase() === 'university';
  const advisorLine = 'Your own Advisor: it knows your profile, grades and applications, so every answer is about you, not generic advice';
  const starterLines = isUniversity
    ? [
        'Your full profile: the strengths, work environments, career pathways and roles that fit who you are',
        'Your next steps mapped out: live graduate roles and internships matched to your profile, with your applications tracked in one place',
        advisorLine,
      ]
    : [
        'Your full profile: the strengths, work environments and career pathways that fit who you are',
        'Your next steps mapped out: the subjects, universities, apprenticeships and college routes that lead there, with rankings, entry requirements and live openings',
        advisorLine,
      ];
  const modalCopy = isAdvisor
    ? {
        title: !isPaidPlan ? ['Your Advisor comes with ', 'Explorer and Premium'] : ['You have used your advisor questions ', 'for this year'],
        subtitle: !isPaidPlan
          ? 'Choose a plan to start asking questions about your profile and results.'
          : canUpgradeToPremium
          ? (packs.length
              ? 'Add a question pack, or upgrade to Premium for 20 questions a year plus rankings and live openings.'
              : 'Upgrade to Premium for 20 questions a year plus rankings and live openings.')
          : (packs.length
              ? 'Add a question pack to keep asking.'
              : 'More questions come with your next billing year, or enter an access code if you have one.'),
        benefits: !isPaidPlan ? [
          '10 advisor questions a year with Explorer, 20 with Premium',
          'Answers based on your profile, grades, saved choices and applications',
          'Extra question packs whenever you need more',
        ] : [],
      }
    : isPremiumFeature
    ? {
        title: featureLabel ? [`${featureLabel} is part of `, 'CareerDNA Premium'] : ['This is part of ', 'CareerDNA Premium'],
        subtitle: 'Premium includes your full profile and Advisor, plus:',
        benefits: [
          'CareerDNA Subject and University Rankings',
          'Your chances of an offer, from your grades',
          'Live courses, apprenticeships, jobs and training routes',
        ],
      }
    : isExhausted
    ? {
        title: ['You have used your reports ', 'for this year'],
        subtitle: 'Choose a plan or buy another report to keep going. Plans include:',
        benefits: [
          'Up to 2 full reports a year, with re-runs when your plans change',
          'Your Advisor, trained on your profile, grades and applications',
          'University rankings, entry requirements and live job openings',
        ],
      }
    : {
        title: ['Unlock your full ', 'CareerDNA profile'],
        subtitle: 'Your free profile covers your type. A plan adds:',
        benefits: starterLines,
      };

  const [codeOpen, setCodeOpen] = useState(false);

  const submitCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      setCouponError('Please enter an access code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      await onApplyCoupon(code);
      setCouponSuccess('Access code applied. You can carry on.');
    } catch (err) {
      setCouponError(err?.message || 'That code could not be applied.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleSeePackages = () => {
    if (typeof onSeePackages === 'function') {
      onSeePackages();
      return;
    }

    setShowPricingModal(true);
  };

  return (
    <>
      <div
        className="report-limit-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reportLimitModalTitle"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section
          className="report-limit-modal"
          aria-labelledby="reportLimitModalTitle"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className="report-limit-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

          <header className="report-limit-modal__header">
            <div
              id="reportLimitModalTitle"
              className="report-limit-modal__title"
              role="heading"
              aria-level="2"
            >
              {modalCopy.title[0]}<span className="report-limit-modal__title-accent">{modalCopy.title[1]}</span>
            </div>
            <p className="report-limit-modal__subtitle">
              {modalCopy.subtitle}
            </p>
            {modalCopy.benefits && modalCopy.benefits.length ? (
              <ul className="report-limit-modal__benefits">
                {modalCopy.benefits.map((b) => (
                  <li key={b}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </header>

          <div className="report-limit-modal__body">
            {isAdvisor && isPaidPlan && packs.length ? (
              <label className="pricing-confirm-consent report-limit-modal__consent">
                <input type="checkbox" checked={packConsent} onChange={(e) => setPackConsent(e.target.checked)} disabled={Boolean(packLoading)} />
                <span>
                  I am 18 or over, or a parent or guardian is completing this purchase, and I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Use</a>. Questions are added straight away.
                </span>
              </label>
            ) : null}
            {isAdvisor && isPaidPlan && packs.length ? (
              <div className="report-limit-modal__packs">
                {packs.map((pack) => (
                  <button
                    key={pack.key}
                    type="button"
                    className="report-limit-modal__pack-btn"
                    onClick={() => buyPack(pack)}
                    disabled={Boolean(packLoading) || !packConsent}
                    title={packConsent ? undefined : 'Tick the confirmation above first'}
                  >
                    <span className="report-limit-modal__pack-qty">{pack.questions} questions</span>
                    <span className="report-limit-modal__pack-price">{packLoading === pack.key ? 'Opening checkout…' : formatPackPrice(pack)}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {packError ? (
              <p className="report-limit-modal__message report-limit-modal__message--error">{packError}</p>
            ) : null}

            <div className="report-limit-modal__actions">
              <button
                type="button"
                className="report-limit-modal__secondary-link"
                onClick={onClose}
              >
                Not now
              </button>
              {isAdvisor && isPaidPlan && !canUpgradeToPremium ? null : (
                <button
                  type="button"
                  className={`report-limit-modal__primary-btn${isAdvisor && isPaidPlan && packs.length ? ' report-limit-modal__primary-btn--secondary' : ''}`}
                  onClick={handleSeePackages}
                >
                  {isAdvisor && canUpgradeToPremium ? 'Upgrade to Premium' : 'See plans'}
                </button>
              )}
            </div>
            <div className="report-limit-modal__coupon-card">
              {!codeOpen ? (
                <p className="report-limit-modal__code-line">
                  Have an access code?{' '}
                  <button type="button" className="report-limit-modal__code-link" onClick={() => setCodeOpen(true)}>Enter it</button>
                </p>
              ) : (
                <>
                  <label className="report-limit-modal__label" htmlFor="careerDnaCouponCode">
                    Access code
                  </label>
                  <div className="report-limit-modal__coupon-row">
                    <span className="report-limit-modal__input-wrap">
                      <AccessCodeIcon />
                      <input
                        id="careerDnaCouponCode"
                        className="report-limit-modal__input"
                        value={couponCode}
                        onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                        placeholder="Enter code"
                        autoComplete="off"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') submitCoupon(); }}
                      />
                    </span>
                    <button
                      type="button"
                      className="report-limit-modal__apply-btn"
                      onClick={submitCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {couponError ? (
                    <p className="report-limit-modal__message report-limit-modal__message--error">{couponError}</p>
                  ) : null}
                  {couponSuccess ? (
                    <p className="report-limit-modal__message report-limit-modal__message--success">{couponSuccess}</p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan={currentPlan}
        entitlement={entitlement}
      />
    </>
  );
}
