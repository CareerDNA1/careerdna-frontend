import React, { useEffect, useMemo, useRef, useState } from 'react';
import './PricingModal.css';
import { changeSubscriptionPlan, createBillingPortalSession, createCheckoutSession, setCancelAtPeriodEnd } from '../../utils/stripeCheckout';

const planRank = {
  free: 0,
  starter: 0,
  explore: 2,
  premium: 3,
  premium_school: 4,
  premium_university: 4,
  dev: 4,
};

// Feature lists differ between school and university students. Explorer and
// Premium are both yearly subscriptions. AI advisor questions are top-up-able
// (extra packs at £3.99). CareerDNA is an unregistered mark, hence ™ not ®.
const plans = [
  {
    title: 'CareerDNA Starter',
    subtitle: 'Basic profile',
    price: 'Free',
    variant: 'starter',
    features: {
      school: [
        'Basic CareerDNA™ profile',
        'Your seven-profile breakdown',
        'Your top traits and how strong they are',
        'A first look at the career worlds that suit you',
      ],
      university: [
        'Basic CareerDNA™ profile',
        'Your seven-profile breakdown',
        'Your top traits and how strong they are',
        'A first look at the career worlds that suit you',
      ],
    },
  },
  {
    title: 'CareerDNA Explorer',
    subtitle: 'Essentials, all year',
    price: '£29.99',
    suffix: '/ year',
    note: 'Yearly subscription, renews annually',
    variant: 'explore',
    checkoutPlan: 'explore',
    features: {
      school: [
        { type: 'lead', text: 'Your full CareerDNA™ profile' },
        { type: 'header', text: 'Your profile' },
        'Personal strengths insights',
        'Ideal work environment insights',
        'Personalised career pathway recommendations',
        'A-level & university subject recommendations',
        '1 CareerDNA report a year',
        { type: 'header', text: 'Guidance' },
        '5 CareerDNA advisor questions a year',
        'Track your development over time',
        'Every new feature we add, included',
        { type: 'note', text: 'Extra advisor question packs available' },
      ],
      university: [
        { type: 'lead', text: 'Your full CareerDNA™ profile' },
        { type: 'header', text: 'Your profile' },
        'Personal strengths insights',
        'Ideal work environment insights',
        'Personalised career pathway recommendations',
        'Personalised role recommendations',
        'Further study & postgraduate recommendations',
        '1 CareerDNA report a year',
        { type: 'header', text: 'Guidance' },
        '5 CareerDNA advisor questions a year',
        'Track your development over time',
        'Every new feature we add, included',
        { type: 'note', text: 'Extra advisor question packs available' },
      ],
    },
  },
  {
    title: 'CareerDNA Premium',
    subtitle: 'Everything, all year',
    price: '£39.99',
    suffix: '/ year',
    anchorPrice: '£59.99',
    anchorLabel: 'Launch price',
    note: 'Yearly subscription, renews annually',
    badge: 'Most popular',
    variant: 'premium',
    checkoutPlan: 'premium',
    features: {
      school: [
        { type: 'lead', text: 'Everything in Explorer, plus:' },
        '2 CareerDNA reports and 20 advisor questions a year',
        { type: 'header', text: 'Premium tools' },
        'Your chances of an offer, from your grades',
        'CareerDNA Subject & University Rankings™',
        'Entry requirements and offer rates',
        'Live courses, apprenticeships and training routes',
      ],
      university: [
        { type: 'lead', text: 'Everything in Explorer, plus:' },
        '2 CareerDNA reports and 20 advisor questions a year',
        { type: 'header', text: 'Premium tools' },
        'Live graduate jobs from LinkedIn, Indeed, Glassdoor and more',
        'Internships, graduate schemes and programmes',
        'CareerDNA Subject & University Rankings™ for further study',
        'Degree apprenticeships and other routes into work',
      ],
    },
  },
  {
    title: 'CareerDNA Enterprise',
    subtitle: 'Flexible packages for schools, universities and educational institutions',
    price: 'Custom',
    variant: 'institution',
    features: {
      school: [
        'Access for all your students',
        'Complements your careers advisers, so students arrive ready for richer sessions',
        'Institution and cohort management dashboard',
        'Cohort analytics and reporting',
        'Career Strategy development toolkit',
        'Track progress from first report to their next step',
        'Dedicated account manager and 7-days-a-week support',
        'Free pilots available',
      ],
      university: [
        'Access for all your students',
        'Complements your careers advisers, so students arrive ready for richer sessions',
        'Institution and cohort management dashboard',
        'Cohort analytics and reporting',
        'Career Strategy development toolkit',
        'Track employability from first report to employment',
        'Dedicated account manager and 7-days-a-week support',
        'Free pilots available',
      ],
    },
  },
];

function normaliseAudience(value = '') {
  const v = String(value || '').trim().toLowerCase();
  if (['university', 'undergrad', 'postgrad', 'ug', 'pg', 'master', 'msc', 'mba'].some((s) => v.includes(s))) {
    return 'university';
  }
  return 'school';
}

function getPlanFeatures(plan, audience) {
  const f = plan?.features;
  if (Array.isArray(f)) return f;
  if (f && typeof f === 'object') return f[audience] || f.school || [];
  return [];
}

export const PAYMENTS_TEMPORARILY_PAUSED = true;
const PAYMENT_PAUSE_MESSAGE =
  'CareerDNA is currently undergoing beta testing, so paid plans are not available to purchase yet. They will be available very soon.';

function normalisePlan(value = '') {
  const plan = String(value || '').trim().toLowerCase();
  if (!plan) return 'free';
  if (plan === 'starter') return 'free';
  return plan;
}

function getPlanDisplayName(value = '') {
  const plan = normalisePlan(value);
  if (plan === 'premium') return 'CareerDNA Premium';
  if (plan === 'explore') return 'CareerDNA Explorer';
  return 'CareerDNA Starter';
}

function formatDisplayDate(value = '') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSubscriptionPlan(plan = '') {
  return ['explore', 'premium', 'premium_school', 'premium_university', 'dev'].includes(normalisePlan(plan));
}

function getPlanButtonLabel(plan, currentPlan, pendingPlan = '', isCancellingAtPeriodEnd = false) {
  const variant = String(plan.variant || '').toLowerCase();
  const current = normalisePlan(currentPlan);
  const pending = normalisePlan(pendingPlan);
  const currentRank = planRank[current] ?? 0;

  if (isCancellingAtPeriodEnd && variant === 'starter' && currentRank > 0) return 'Scheduled';
  if (variant === pending) return 'Scheduled';
  if (variant === 'institution') return 'Contact us';

  if (variant === 'starter') {
    if (currentRank <= 0) return 'Current plan';
    return 'Downgrade';
  }

  if (variant === current) return 'Current plan';

  if (variant === 'explore') {
    if (current === 'premium') return 'Downgrade';
    return 'Subscribe';
  }

  if (variant === 'premium') {
    return current === 'explore' ? 'Upgrade' : 'Subscribe';
  }

  return 'Subscribe';
}

function getPlanStatus(plan, currentPlan, pendingPlan = '', isCancellingAtPeriodEnd = false) {
  const variant = String(plan.variant || '').toLowerCase();
  const current = normalisePlan(currentPlan);
  const pending = normalisePlan(pendingPlan);
  const currentRank = planRank[current] ?? 0;

  if (isCancellingAtPeriodEnd && variant === 'starter' && currentRank > 0) return 'scheduled';
  if (variant === pending) return 'scheduled';
  if (variant === current) return 'current';
  // Free users are on Starter: mark it current so the card highlights properly.
  if (variant === 'starter' && currentRank <= 0) return 'current';
  if (variant === 'starter' && currentRank > 0) return 'downgrade';
  if (variant === 'explore' && current === 'premium') return 'downgrade';
  if (variant === 'premium' && current === 'explore') return 'upgrade';
  if (['explore', 'premium'].includes(variant) && currentRank === 0) return 'upgrade';
  if (variant === 'institution') return 'available';
  return 'available';
}

function buildConfirmationCopy({ variant, checkoutPlanKey, status, effectivePlan, hasSubscription, pendingDate }) {
  const currentName = getPlanDisplayName(effectivePlan);

  if (variant === 'starter' && hasSubscription) {
    return {
      tone: 'downgrade',
      title: 'Cancel your paid plan?',
      body:
        `Your ${currentName} subscription will not renew. ` +
        'You keep your current access until the end of your billing year and nothing more is charged.',
      bullets: [
        'At the end of your billing year, your account will return to the free CareerDNA Starter plan.',
        'You will lose access to full CareerDNA reports, AI advisor questions and any premium tools.',
        'Your account will still include your basic CareerDNA profile, and you can change your mind at any time before then.',
      ],
      confirmLabel: 'Cancel my plan',
      cancelLabel: 'Keep current plan',
    };
  }

  if (checkoutPlanKey === 'explore' && !hasSubscription) {
    return {
      tone: 'upgrade',
      title: 'Subscribe to CareerDNA Explorer?',
      body: 'You will be taken to Stripe Checkout to start CareerDNA Explorer at £29.99 a year.',
      bullets: [
        'Includes 1 full CareerDNA report a year.',
        'Includes 5 AI advisor questions a year.',
        'Renews annually. You can manage or cancel your subscription from your account at any time.',
      ],
      confirmLabel: 'Continue to Stripe',
      cancelLabel: 'Not now',
    };
  }

  if (checkoutPlanKey === 'premium' && !hasSubscription) {
    return {
      tone: 'upgrade',
      title: 'Subscribe to CareerDNA Premium?',
      body: 'You will be taken to Stripe Checkout to start CareerDNA Premium at £39.99 a year.',
      bullets: [
        'Includes 2 full CareerDNA reports a year.',
        'Includes 20 AI advisor questions a year.',
        'Includes all premium tools: rankings, your chances, live jobs and apprenticeships.',
        'Renews annually. You can manage or cancel your subscription from your account at any time.',
      ],
      confirmLabel: 'Continue to Stripe',
      cancelLabel: 'Not now',
    };
  }

  if (variant === 'premium' && effectivePlan === 'explore') {
    return {
      tone: 'upgrade',
      title: 'Upgrade to CareerDNA Premium?',
      body:
        'Your subscription will be changed from Explorer to Premium now. Stripe will apply a pro-rated charge for the rest of your current billing year.',
      bullets: [
        'Your report allowance will increase to 2 a year immediately.',
        'Your AI advisor allowance will increase to 20 questions a year immediately.',
        'All premium tools unlock straight away.',
        'The change will be made using your saved Stripe payment method.',
      ],
      confirmLabel: 'Confirm upgrade',
      cancelLabel: 'Cancel',
    };
  }

  if (variant === 'explore' && effectivePlan === 'premium') {
    return {
      tone: 'downgrade',
      title: 'Schedule downgrade to CareerDNA Explorer?',
      body:
        pendingDate
          ? `Your downgrade will take effect on ${pendingDate}. You will keep CareerDNA Premium access until then.`
          : 'Your downgrade will take effect at the end of your current billing year. You will keep CareerDNA Premium access until then.',
      bullets: [
        'You will keep your Premium allowances and tools until the change date.',
        'From your next billing year, your plan will become Explorer.',
      ],
      confirmLabel: 'Schedule downgrade',
      cancelLabel: 'Keep Premium',
    };
  }

  return {
    tone: status === 'downgrade' ? 'downgrade' : 'upgrade',
    title: 'Confirm plan change',
    body: 'Please confirm that you want to continue with this plan change.',
    bullets: [],
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  };
}

function PricingModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  entitlement = null,
  onManageSubscription,
  audience: audienceProp = '',
}) {
  // School vs university feature wording. Defaults to the student's own stage if
  // we know it, otherwise 'school'; the toggle lets anyone switch.
  const [audience, setAudience] = useState(() => normaliseAudience(audienceProp || entitlement?.status || 'school'));
  const [checkoutPlan, setCheckoutPlan] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [activePlanIndex, setActivePlanIndex] = useState(() => {
    const initialIndex = plans.findIndex((plan) => normalisePlan(plan.variant) === normalisePlan(currentPlan));
    return initialIndex >= 0 ? initialIndex : 2;
  });
  const pricingDragRef = useRef({
    startX: 0,
    startY: 0,
    dragging: false,
    moved: false,
    pointerId: null,
  });

  const effectivePlan = normalisePlan(currentPlan || entitlement?.plan || 'free');
  const isCancellingAtPeriodEnd = Boolean(entitlement?.cancelAtPeriodEnd || entitlement?.cancel_at_period_end);
  const pendingPlan = isCancellingAtPeriodEnd
    ? ''
    : normalisePlan(entitlement?.pendingPlanChange || entitlement?.pending_plan_change || '');
  const pendingDate = formatDisplayDate(
    entitlement?.pendingPlanChangeAt ||
    entitlement?.pending_plan_change_at ||
    entitlement?.subscription_current_period_end ||
    ''
  );
  const cancellationDate = formatDisplayDate(
    entitlement?.subscription_current_period_end ||
    entitlement?.advisorPeriodEnd ||
    entitlement?.advisor_period_end ||
    ''
  );
  const hasSubscription = isSubscriptionPlan(effectivePlan);

  const pendingCopy = useMemo(() => {
    if (!pendingAction) return null;
    return buildConfirmationCopy({
      ...pendingAction,
      effectivePlan,
      hasSubscription,
      pendingDate,
    });
  }, [pendingAction, effectivePlan, hasSubscription, pendingDate]);

  useEffect(() => {
    const currentIndex = plans.findIndex((plan) => normalisePlan(plan.variant) === effectivePlan);
    if (currentIndex >= 0) setActivePlanIndex(currentIndex);
  }, [effectivePlan]);

  const goToPlanIndex = (index) => {
    setActivePlanIndex(((index % plans.length) + plans.length) % plans.length);
  };

  const goToPreviousPlan = () => goToPlanIndex(activePlanIndex - 1);
  const goToNextPlan = () => goToPlanIndex(activePlanIndex + 1);

  const getCarouselPosition = (index) => {
    let diff = index - activePlanIndex;
    if (diff > plans.length / 2) diff -= plans.length;
    if (diff < -plans.length / 2) diff += plans.length;
    return Math.max(-2, Math.min(2, diff));
  };

  const handlePricingPointerDown = (event) => {
    if (!event.pointerType || event.pointerType === 'mouse') return;
    pricingDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      dragging: true,
      moved: false,
      pointerId: event.pointerId,
    };

    if (event.currentTarget?.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is optional.
      }
    }
  };

  const handlePricingPointerMove = (event) => {
    const drag = pricingDragRef.current;
    if (!drag.dragging) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.15) {
      drag.moved = true;
      if (event.cancelable) event.preventDefault();
    }
  };

  const handlePricingPointerUp = (event) => {
    const drag = pricingDragRef.current;
    if (!drag.dragging) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const isSwipe = Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.25;

    if (event.currentTarget?.releasePointerCapture && drag.pointerId != null) {
      try {
        event.currentTarget.releasePointerCapture(drag.pointerId);
      } catch {
        // Safe fallback.
      }
    }

    pricingDragRef.current = {
      startX: 0,
      startY: 0,
      dragging: false,
      moved: isSwipe,
      pointerId: null,
    };

    if (isSwipe) {
      if (dx < 0) goToNextPlan();
      else goToPreviousPlan();

      window.setTimeout(() => {
        pricingDragRef.current.moved = false;
      }, 80);
    }
  };

  const handlePricingPointerCancel = () => {
    pricingDragRef.current = {
      startX: 0,
      startY: 0,
      dragging: false,
      moved: false,
      pointerId: null,
    };
  };

  if (!isOpen) return null;

  const openBillingPortal = async (loadingKey = 'billing') => {
    try {
      setCheckoutError('');
      setCheckoutPlan(loadingKey);
      const data = await createBillingPortalSession();
      window.location.assign(data.url);
    } catch (err) {
      console.error(err);
      setCheckoutError(err?.message || 'Could not open billing management. Please try again.');
      setCheckoutPlan('');
      setPendingAction(null);
    }
  };

  const completePlanAction = async (action) => {
    const variant = action.variant;
    const checkoutPlanKey = action.checkoutPlanKey;
    const status = action.status;

    if (variant === 'starter') {
      if (hasSubscription) {
        try {
          setCheckoutError('');
          setCheckoutPlan('starter');
          const result = await setCancelAtPeriodEnd(true);
          if (typeof onManageSubscription === 'function') {
            await onManageSubscription({
              requestedPlan: 'starter',
              currentPlan: effectivePlan,
              action: 'cancel',
              profile: result?.profile,
              result,
            });
            setCheckoutPlan('');
            setPendingAction(null);
            return;
          }
          window.location.assign('/profile?subscription=updated');
        } catch (err) {
          setCheckoutError(err?.message || 'Could not cancel your plan. Please try again.');
          setCheckoutPlan('');
          setPendingAction(null);
        }
        return;
      }

      onClose();
      return;
    }

    if (hasSubscription && ['explore', 'premium'].includes(variant)) {
      if (variant === effectivePlan) return;

      try {
        setCheckoutError('');
        setCheckoutPlan(variant);
        const result = await changeSubscriptionPlan(variant);

        if (typeof onManageSubscription === 'function') {
          await onManageSubscription({
            requestedPlan: variant,
            currentPlan: effectivePlan,
            action: status,
            profile: result?.profile,
            result,
          });
          setCheckoutPlan('');
          setPendingAction(null);
          return;
        }

        window.location.assign('/profile?subscription=updated');
      } catch (err) {
        setCheckoutError(err?.message || 'Could not change your subscription. Please try again.');
        setCheckoutPlan('');
        setPendingAction(null);
      }
      return;
    }

    try {
      setCheckoutError('');
      setCheckoutPlan(checkoutPlanKey);
      const data = await createCheckoutSession(checkoutPlanKey);
      window.location.assign(data.url);
    } catch (err) {
      setCheckoutError(err?.message || 'Could not open checkout. Please try again.');
      setCheckoutPlan('');
      setPendingAction(null);
    }
  };

  const handlePlanClick = (plan) => {
    const variant = String(plan?.variant || '').toLowerCase();
    const checkoutPlanKey = String(plan?.checkoutPlan || '').toLowerCase();
    const status = getPlanStatus(plan, effectivePlan, pendingPlan, isCancellingAtPeriodEnd);

    if (status === 'current' || status === 'scheduled' || status === 'included') return;

    if (variant === 'institution') {
      window.location.href = 'mailto:support@mycareerdna.io?subject=CareerDNA%20Enterprise%20enquiry';
      return;
    }

    if (PAYMENTS_TEMPORARILY_PAUSED) {
      setCheckoutError('');
      setPendingAction(null);
      return;
    }

    const requiresConfirmation =
      variant === 'starter' ||
      checkoutPlanKey === 'explore' ||
      ['explore', 'premium'].includes(variant);

    if (requiresConfirmation) {
      setCheckoutError('');
      setPendingAction({ variant, checkoutPlanKey, status });
      return;
    }

    completePlanAction({ variant, checkoutPlanKey, status });
  };

  return (
    <div
      className="pricing-modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pendingAction) onClose();
      }}
    >
      <section
        className="pricing-modal-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="pricing-modal-close"
          onClick={onClose}
          aria-label="Close pricing plans"
        >
          ×
        </button>

        <header className="pricing-modal-header">
          <h2>{hasSubscription ? 'Manage your plan' : 'Choose your plan'}</h2>
          {hasSubscription ? (
            <p>
              {isCancellingAtPeriodEnd && cancellationDate
                ? `Your ${effectivePlan === 'premium' ? 'Premium' : 'Explorer'} plan will end on ${cancellationDate}.`
                : pendingPlan && pendingDate
                  ? `You are currently on the ${effectivePlan === 'premium' ? 'Premium' : 'Explorer'} plan. Your plan will change to ${getPlanDisplayName(pendingPlan)} on ${pendingDate}.`
                  : `You are currently on the ${effectivePlan === 'premium' ? 'Premium' : 'Explorer'} plan.`}
            </p>
          ) : null}

          <div className="pricing-audience-toggle" role="tablist" aria-label="Are you at school or university?">
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'school'}
              className={audience === 'school' ? 'is-active' : ''}
              onClick={() => setAudience('school')}
            >
              At school
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audience === 'university'}
              className={audience === 'university' ? 'is-active' : ''}
              onClick={() => setAudience('university')}
            >
              At university
            </button>
          </div>
        </header>

        {checkoutError ? (
          <p className="pricing-modal-error">{checkoutError}</p>
        ) : null}

        <div className="pricing-carousel-shell">
          <button
            type="button"
            className="pricing-carousel-arrow pricing-carousel-arrow--prev"
            onClick={goToPreviousPlan}
            aria-label="Previous plan"
          >
            ‹
          </button>

          <div
            className="pricing-plan-grid"
            onPointerDown={handlePricingPointerDown}
            onPointerMove={handlePricingPointerMove}
            onPointerUp={handlePricingPointerUp}
            onPointerCancel={handlePricingPointerCancel}
            onPointerLeave={handlePricingPointerCancel}
          >
          {plans.map((plan, index) => {
            const status = getPlanStatus(plan, effectivePlan, pendingPlan, isCancellingAtPeriodEnd);
            const isCurrent = status === 'current';
            const isScheduled = status === 'scheduled';
            const buttonLabel = getPlanButtonLabel(plan, effectivePlan, pendingPlan, isCancellingAtPeriodEnd);
            const loadingKey = String(plan.checkoutPlan || plan.variant || '').toLowerCase();
            const loading = checkoutPlan && checkoutPlan === loadingKey;
            const isPaymentActionPaused =
              PAYMENTS_TEMPORARILY_PAUSED &&
              plan.variant !== 'institution' &&
              !isCurrent &&
              !isScheduled;

            return (
              <article
                key={plan.title}
                className={`pricing-plan-card pricing-plan-card--${plan.variant} pricing-plan-card--carousel-${getCarouselPosition(index)} ${hasSubscription && plan.variant === 'explore' && !isCurrent && !isScheduled ? 'pricing-plan-card--plus-neutral' : ''} ${isCurrent ? 'pricing-plan-card--current' : ''} ${isScheduled ? 'pricing-plan-card--scheduled' : ''}`}
                data-carousel-position={getCarouselPosition(index)}
              >
                {plan.badge && !hasSubscription && !isCurrent && !isScheduled ? (
                  <div className="pricing-popular-badge">
                    {plan.badge}
                  </div>
                ) : null}

                {isCurrent ? (
                  <div className="pricing-current-badge">Current plan</div>
                ) : null}

                <div className="pricing-plan-content">
                  <h3>{plan.title}</h3>
                  <p className="pricing-plan-subtitle">{plan.subtitle}</p>

                  <div className="pricing-price-block">
                    <div className="pricing-plan-price">
                      {plan.price}
                      {plan.suffix && <span>{plan.suffix}</span>}
                    </div>
                    {plan.anchorPrice ? (
                      <div className="pricing-plan-anchor">
                        {plan.anchorLabel ? <span className="pricing-plan-anchor-label">{plan.anchorLabel}, usually </span> : null}
                        <s>{plan.anchorPrice}</s>
                      </div>
                    ) : null}

                    <p className={`pricing-plan-note ${!plan.note ? 'pricing-plan-note--empty' : ''}`}>
                      {plan.note || '\u00A0'}
                    </p>
                  </div>

                  <ul className="pricing-feature-list">
                    {getPlanFeatures(plan, audience).map((feature, fi) => {
                      const item = typeof feature === 'string' ? { text: feature } : (feature || {});
                      if (item.type === 'header') {
                        return (
                          <li key={fi} className="pricing-feature-header">
                            {item.tag ? <span className="pricing-feature-tag">{item.tag}</span> : null}
                            {item.text}
                          </li>
                        );
                      }
                      if (item.type === 'note') {
                        return <li key={fi} className="pricing-feature-note">{item.text}</li>;
                      }
                      const cls = item.type === 'lead'
                        ? 'pricing-feature pricing-feature--lead'
                        : item.type === 'premium'
                          ? 'pricing-feature pricing-feature--premium'
                          : 'pricing-feature';
                      return (
                        <li key={fi} className={cls}>
                          <span>{item.text}</span>
                          {item.type === 'premium' ? <span className="pricing-feature-tag">Premium</span> : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <button
                  type="button"
                  className={`pricing-plan-button pricing-plan-button--${plan.variant} ${isCurrent || isScheduled ? 'pricing-plan-button--current' : ''} ${isPaymentActionPaused ? 'pricing-plan-button--paused' : ''}`}
                  onClick={() => {
                    if (pricingDragRef.current.moved) return;
                    handlePlanClick(plan);
                  }}
                  disabled={Boolean(checkoutPlan) || isCurrent || isScheduled || isPaymentActionPaused}
                  title={isPaymentActionPaused ? PAYMENT_PAUSE_MESSAGE : undefined}
                >
                  {loading ? 'Opening…' : isPaymentActionPaused ? 'Coming soon' : isCurrent ? '✓ Current plan' : buttonLabel}
                </button>
              </article>
            );
          })}
          </div>

          <button
            type="button"
            className="pricing-carousel-arrow pricing-carousel-arrow--next"
            onClick={goToNextPlan}
            aria-label="Next plan"
          >
            ›
          </button>
        </div>

        <div className="pricing-carousel-dots" aria-label="Select pricing plan">
          {plans.map((plan, index) => (
            <button
              key={plan.title}
              type="button"
              className={activePlanIndex === index ? 'is-active' : ''}
              onClick={() => goToPlanIndex(index)}
              aria-label={`Show ${plan.title}`}
              aria-pressed={activePlanIndex === index}
            />
          ))}
        </div>

        {pendingAction && pendingCopy ? (
          <div
            className="pricing-confirm-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pricingConfirmTitle"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !checkoutPlan) setPendingAction(null);
            }}
          >
            <section
              className={`pricing-confirm-card pricing-confirm-card--${pendingCopy.tone}`}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="pricing-confirm-close"
                onClick={() => setPendingAction(null)}
                disabled={Boolean(checkoutPlan)}
                aria-label="Close confirmation"
              >
                ×
              </button>


              <h3 id="pricingConfirmTitle">{pendingCopy.title}</h3>
              <p>{pendingCopy.body}</p>

              {pendingCopy.bullets.length ? (
                <ul>
                  {pendingCopy.bullets.map((item, index) => (
                    <li
                      key={item}
                      className={pendingCopy.tone === 'downgrade' && index < 2 ? 'pricing-confirm-li--warning' : ''}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="pricing-confirm-actions">
                <button
                  type="button"
                  className="pricing-confirm-secondary"
                  onClick={() => setPendingAction(null)}
                  disabled={Boolean(checkoutPlan)}
                >
                  {pendingCopy.cancelLabel}
                </button>

                <button
                  type="button"
                  className={`pricing-confirm-primary pricing-confirm-primary--${pendingCopy.tone}`}
                  onClick={() => completePlanAction(pendingAction)}
                  disabled={Boolean(checkoutPlan)}
                >
                  {checkoutPlan ? 'Processing…' : pendingCopy.confirmLabel}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default PricingModal;
