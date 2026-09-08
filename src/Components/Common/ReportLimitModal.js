import React, { useState } from 'react';
import './ReportLimitModal.css';
import PricingModal from './PricingModal';

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

  const modalCopy = isExhausted
    ? {
        title: 'Continue your CareerDNA journey',
        subtitle:
          'You’ve used your available reports. Explore a plan, buy another report or enter an access code to continue your CareerDNA exploration.',
      }
    : {
        title: 'Continue your CareerDNA journey',
        subtitle:
          'Your free profile is a starting point. Unlock deeper insights, personalised recommendations and AI advisor support.',
      };

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
      setCouponSuccess('Access code applied. You can now continue your CareerDNA journey.');
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
              Continue your <span className="report-limit-modal__title-accent">CareerDNA</span> journey
            </div>
            <p className="report-limit-modal__subtitle">
              {modalCopy.subtitle}
            </p>
          </header>

          <div className="report-limit-modal__body">
            <div className="report-limit-modal__coupon-card">
              <label className="report-limit-modal__label" htmlFor="careerDnaCouponCode">
                Have an access code?
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
                  />
                </span>
                <button
                  type="button"
                  className="report-limit-modal__apply-btn"
                  onClick={submitCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? 'Checking…' : 'Apply'}
                </button>
              </div>

              {couponError ? (
                <p className="report-limit-modal__message report-limit-modal__message--error">
                  {couponError}
                </p>
              ) : null}

              {couponSuccess ? (
                <p className="report-limit-modal__message report-limit-modal__message--success">
                  {couponSuccess}
                </p>
              ) : null}
            </div>

            <div className="report-limit-modal__actions">
              <button
                type="button"
                className="report-limit-modal__primary-btn"
                onClick={handleSeePackages}
              >
                Explore plans
              </button>

              <button
                type="button"
                className="report-limit-modal__secondary-link"
                onClick={onClose}
              >
                Continue with free profile
              </button>
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
