import React, { useEffect, useMemo, useRef, useState } from 'react';
import './PricingModal.css';
import { changeSubscriptionPlan, createBillingPortalSession, createCheckoutSession } from '../../utils/stripeCheckout';

const planRank = {
  free: 0,
  starter: 0,
  plus: 2,
  premium: 3,
  premium_school: 4,
  premium_university: 4,
  dev: 4,
};

// Feature lists differ between school and university students. The report itself
// is the "CareerDNA Original©"; the © also marks the proprietary rankings. AI
// advisor questions are top-up-able (extra packs at £3.99).
const plans = [
  {
    title: 'CareerDNA Starter',
    subtitle: 'Basic profile',
    price: 'Free',
    variant: 'starter',
    features: {
      school: [
        'Basic CareerDNA© profile',
        'See how well you know yourself',
        'See where you sit across the seven CareerDNA profiles',
        'Get to know your core traits',
      ],
      university: [
        'Basic CareerDNA© profile',
        'See how well you know yourself',
        'See where you sit across the seven CareerDNA profiles',
        'Get to know your core traits',
      ],
    },
  },
  {
    title: 'CareerDNA Explorer',
    subtitle: 'Essentials, all year',
    price: '£29.99',
    suffix: '/ year',
    note: 'Annual subscription, renews yearly',
    variant: 'single',
    checkoutPlan: 'explore',
    features: {
      school: [
        { type: 'lead', text: 'Your full CareerDNA© profile' },
        { type: 'header', text: 'Your profile' },
        'Personal strengths insights',
        'Ideal work environment insights',
        'Personalised career pathway recommendations',
        'A-level & university subject recommendations',
        '1 CareerDNA report a year',
        { type: 'header', text: 'Guidance' },
        '5 CareerDNA advisor questions',
        'Track your development over time',
        'New tools and expert advice all year',
        { type: 'note', text: 'Extra advisor question packs available' },
      ],
      university: [
        { type: 'lead', text: 'Your full CareerDNA© profile' },
        { type: 'header', text: 'Your profile' },
        'Personal strengths insights',
        'Ideal work environment insights',
        'Personalised career pathway recommendations',
        'Personalised role recommendations',
        'Further study & postgraduate recommendations',
        '1 CareerDNA report a year',
        { type: 'header', text: 'Guidance' },
        '5 CareerDNA advisor questions',
        'Track your development over time',
        'New tools and expert advice all year',
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
    note: 'Annual subscription, renews yearly',
    badge: 'Most popular',
    variant: 'premium',
    checkoutPlan: 'premium',
    features: {
      school: [
        { type: 'lead', text: 'Everything in CareerDNA Explorer, plus:' },
        '1 more CareerDNA report a year',
        '15 more CareerDNA advisor questions',
        { type: 'header', text: 'Premium tools' },
        'Live apprenticeships and other non-university routes',
        'CareerDNA Subject & University Rankings©',
        'Live university & course search',
        { type: 'note', text: 'Extra advisor question packs available' },
      ],
      university: [
        { type: 'lead', text: 'Everything in CareerDNA Explorer, plus:' },
        '1 more CareerDNA report a year',
        '15 more CareerDNA advisor questions',
        { type: 'header', text: 'Premium tools' },
        'Live graduate jobs from LinkedIn, Indeed, Glassdoor and more',
        'Live internship & graduate programme search',
        { type: 'note', text: 'Extra advisor question packs available' },
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

const PAYMENTS_TEMPORARILY_PAUSED = true;
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
  if (plan === 'plus') return 'CareerDNA Plus';
  if (plan === 'premium') return 'CareerDNA Premium';
  if (plan === 'explore') return 'CareerDNA Explore';
  return 'CareerDNA Starter';
}

function formatDisplayDate(value = '') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function isSubscriptionPlan(plan = '') {
  return ['plus', 'premium', 'premium_school', 'premium_university', 'dev'].includes(normalisePlan(plan));
}

function getPlanButtonLabel(plan, currentPlan, pendingPlan = '', isCancellingAtPeriodEnd = false) {
  const variant = String(plan.variant || '').toLowerCase();
  const current = normalisePlan(currentPlan);
  const pending = normalisePlan(pendingPlan);
  const currentRank = planRank[current] ?? 0;

  if (isCancellingAtPeriodEnd && variant === 'starter' && currentRank > 0) return 'Scheduled';
  if (variant === pending) return 'Scheduled';
  if (variant === 'institution') return 'Contact us';
  if (variant === 'single') return currentRank >= 2 ? 'Buy extra report' : 'Buy report';

  if (variant === 'starter') {
    if (currentRank <= 0) return 'Current plan';
    return 'Downgrade';
  }

  if (variant === current) return 'Current plan';

  if (variant === 'plus') {
    if (current === 'premium') return 'Downgrade';
    return 'Upgrade';
  }

  if (variant === 'premium') {
    return 'Upgrade';
  }

  return 'Upgrade';
}

function getPlanStatus(plan, currentPlan, pendingPlan = '', isCancellingAtPeriodEnd = false) {
  const variant = String(plan.variant || '').toLowerCase();
  const current = normalisePlan(currentPlan);
  const pending = normalisePlan(pendingPlan);
  const currentRank = planRank[current] ?? 0;

  if (isCancellingAtPeriodEnd && variant === 'starter' && currentRank > 0) return 'scheduled';
  if (variant === pending) return 'scheduled';
  if (variant === current) return 'current';
  if (variant === 'starter' && currentRank > 0) return 'downgrade';
  if (variant === 'plus' && current === 'premium') return 'downgrade';
  if (variant === 'premium' && current === 'plus') return 'upgrade';
  if (['plus', 'premium'].includes(variant) && currentRank === 0) return 'upgrade';
  if (variant === 'single') return 'available';
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
        `You are about to open Stripe to cancel your ${currentName} subscription. ` +
        'You will normally keep your current access until the end of your billing period, and your plan will not renew after that.',
      bullets: [
        'At the end of your billing period, your account will return to the free CareerDNA Starter plan.',
          'You will lose access to monthly full CareerDNA reports and AI advisor questions.',
          'Your account will still include a basic CareerDNA profile and self-awareness insights.',
        ],
      confirmLabel: 'Continue to Stripe',
      cancelLabel: 'Keep current plan',
    };
  }

  if (checkoutPlanKey === 'plus' && !hasSubscription) {
    return {
      tone: 'upgrade',
      title: 'Upgrade to CareerDNA Plus?',
      body: 'You will be taken to Stripe Checkout to start CareerDNA Plus at £3.99 per month.',
      bullets: [
        'Includes 1 full report per month.',
        'Includes 5 AI advisor questions per month.',
        'You can manage or cancel your subscription anytime.',
        'Exclusive access to new features and content as we launch them.',
      ],
      confirmLabel: 'Continue to Stripe',
      cancelLabel: 'Not now',
    };
  }

  if (checkoutPlanKey === 'premium' && !hasSubscription) {
    return {
      tone: 'upgrade',
      title: 'Upgrade to CareerDNA Premium?',
      body: 'You will be taken to Stripe Checkout to start CareerDNA Premium at £6.99 per month.',
      bullets: [
        'Includes 2 full reports per month.',
        'Includes 20 AI advisor questions per month.',
        'You can manage or cancel your subscription from your account.',
      ],
      confirmLabel: 'Continue to Stripe',
      cancelLabel: 'Not now',
    };
  }

  if (variant === 'premium' && effectivePlan === 'plus') {
    return {
      tone: 'upgrade',
      title: 'Upgrade to CareerDNA Premium?',
      body:
        'Your existing CareerDNA subscription will be changed from Plus to Premium now. Stripe will apply a pro-rated charge for the rest of the current billing period.',
      bullets: [
        'Your monthly report allowance will increase to 2 immediately.',
        'Your AI advisor allowance will increase to 20 questions per month immediately.',
        'The change will be made using your saved Stripe payment method.',
      ],
      confirmLabel: 'Confirm upgrade',
      cancelLabel: 'Cancel',
    };
  }

  if (variant === 'plus' && effectivePlan === 'premium') {
    return {
      tone: 'downgrade',
      title: 'Schedule downgrade to CareerDNA Plus?',
      body:
        pendingDate
          ? `Your downgrade will take effect on ${pendingDate}. You will keep CareerDNA Premium access until then.`
          : 'Your downgrade will take effect at the end of your current billing period. You will keep CareerDNA Premium access until then.',
      bullets: [
        'You will keep 2 reports per month until the change date.',
        'You will keep 20 AI advisor questions per month until the change date.',
        'From the next billing period, your plan will become Plus.',
      ],
      confirmLabel: 'Schedule downgrade',
      cancelLabel: 'Keep Premium',
    };
  }

  if (checkoutPlanKey === 'explore') {
    return {
      tone: 'upgrade',
      title: 'Buy a CareerDNA Explore report?',
      body: 'You will be taken to Stripe Checkout to buy a one-time CareerDNA report.',
      bullets: [
        'This is a one-off purchase, not a monthly subscription.',
        'Your report credit will be added after payment.',
      ],
      confirmLabel: 'Continue to Stripe',
      cancelLabel: 'Not now',
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
        await openBillingPortal('starter');
        return;
      }

      onClose();
      return;
    }

    if (hasSubscription && ['plus', 'premium'].includes(variant)) {
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
      ['plus', 'premium'].includes(variant);

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
                ? `Your ${effectivePlan === 'premium' ? 'Premium' : 'Plus'} plan will end on ${cancellationDate}.`
                : pendingPlan && pendingDate
                  ? `You are currently on the ${effectivePlan === 'premium' ? 'Premium' : 'Plus'} plan. Your plan will change to ${getPlanDisplayName(pendingPlan)} on ${pendingDate}.`
                  : `You are currently on the ${effectivePlan === 'premium' ? 'Premium' : 'Plus'} plan.`}
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
                className={`pricing-plan-card pricing-plan-card--${plan.variant} pricing-plan-card--carousel-${getCarouselPosition(index)} ${hasSubscription && plan.variant === 'plus' && !isCurrent && !isScheduled ? 'pricing-plan-card--plus-neutral' : ''} ${isCurrent ? 'pricing-plan-card--current' : ''} ${isScheduled ? 'pricing-plan-card--scheduled' : ''}`}
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
                    {plan.anchorPrice ? (
                      <div className="pricing-plan-anchor"><s>{plan.anchorPrice}</s></div>
                    ) : null}
                    <div className="pricing-plan-price">
                      {plan.price}
                      {plan.suffix && <span>{plan.suffix}</span>}
                    </div>

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
                  {loading ? 'Opening…' : isPaymentActionPaused ? 'Coming soon' : buttonLabel}
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
