import React, { useEffect, useRef, useState } from 'react';
import './CareerWorldsAccordion.css';
import ResultsFilterBar, { applyResultsFilter, emptyFilter } from './ResultsFilter';
import { ThumbsUp, ThumbsDown, Smiley, SmileyMeh, BookmarkSimple } from 'phosphor-react';
import { ItemPills, showSelectionTooltip, hideSelectionTooltip, getMatchTooltipBody } from './SelectionInsightExplorer';
import { getCareerWorldIcon, getPathwayIcon } from '../../utils/iconMap';

function compactKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

// Friendly header match label, matching the pill tags (Standout -> Standout match).
function headerMatchLabel(raw = '') {
  const base = String(raw || '').replace(/\s*match$/i, '').trim();
  const map = { Standout: 'Standout match', Strong: 'Strong match', Good: 'Good match', Lower: 'Lower match' };
  if (map[base]) return map[base];
  if (!raw) return '';
  return /match$/i.test(raw) ? raw : `${raw} match`;
}

// Friendly header badge (pilot): Standout -> "Standout match" (green), etc.
function matchBadge(raw = '') {
  const base = String(raw || '').replace(/\s*match$/i, '').trim();
  if (base === 'Standout') return { text: 'Standout match', tone: 'top' };
  if (base === 'Strong') return { text: 'Strong match', tone: 'strong' };
  if (base === 'Good') return { text: 'Good match', tone: 'good' };
  if (base === 'Lower') return { text: 'Lower match', tone: 'lower' };
  return { text: '', tone: 'good' };
}

function bandBlocks(band = '') {
  const k = String(band || '').toLowerCase();
  if (k.includes('standout')) return 4;
  if (k.includes('strong')) return 3;
  if (k.includes('good')) return 2;
  if (k.includes('lower')) return 1;
  return 0;
}

function Chevron({ open }) {
  return (
    <svg
      className={`selection-chevron ${open ? 'is-open' : ''}`}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

const ROUTE_CHIP_COLOURS = {
  University: '#2F6FED',
  Apprenticeship: '#12A150',
  College: '#7C3AED',
  Work: '#EA7317',
};
const ROUTE_CHIP_LABELS = {
  University: 'University',
  Apprenticeship: 'Apprenticeship',
  College: 'College',
  Work: 'On the job',
};
const ROUTE_CHIP_DEFS = {
  University: 'A degree course at university, usually three or four years, where you study a subject in depth before starting work.',
  Apprenticeship: 'A paid job where you learn while you work and train towards a real qualification, earning a wage from day one.',
  College: 'A course at a college after school, such as a T Level or diploma, that builds job skills or leads on to further training.',
  Work: 'Starting straight in a job and learning as you go, through direct entry, a trainee scheme, or by setting up on your own.',
};
function RouteChips({ chips }) {
  if (!Array.isArray(chips) || !chips.length) return null;
  return (
    <span className="cw-route-chips" aria-label="Ways in">
      {chips.map((c) => (
        <span
          key={c}
          className="cw-route-chip"
          tabIndex={0}
          role="button"
          aria-label={`${ROUTE_CHIP_LABELS[c] || c}. ${ROUTE_CHIP_DEFS[c] || ''}`}
          data-selection-tooltip="true"
          data-tooltip-title={ROUTE_CHIP_LABELS[c] || c}
          data-tooltip-body={ROUTE_CHIP_DEFS[c] || ''}
        >
          <span className="cw-route-chip__dot" style={{ background: ROUTE_CHIP_COLOURS[c] || '#5F5E5A' }} aria-hidden="true" />
          {ROUTE_CHIP_LABELS[c] || c}
        </span>
      ))}
    </span>
  );
}

function WorldCard({ world, open, onToggle, reaction, onReact, iconFor = getCareerWorldIcon, pilotDefinition = false, itemType = 'career_world' }) {
  const readMoreNoun = itemType === 'pathway' ? 'pathway' : itemType === 'role' ? 'role' : 'world';
  const cardRef = useRef(null);
  const hasMounted = useRef(false);
  const [defOpen, setDefOpen] = useState(false);
  useEffect(() => {
    if (open && hasMounted.current && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [open]);
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const Icon = iconFor(compactKey(world.title));
  const band = world.signalLabel || '';
  const blocks = Number(world.signalBlocks || bandBlocks(band));
  const label = headerMatchLabel(band);
  const badge = matchBadge(band);
  // Fixed band steps: Standout full, Strong three quarters, Good half, Lower quarter.
  const fillPct = { 4: 100, 3: 75, 2: 50, 1: 25 }[blocks] || 0;
  const splitNarrative = !!world.splitNarrative;
  const longParas = String(world.longDef || '')
    .split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const shortParas = String(world.shortDef || '')
    .split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  // University pathways carry a deeper, graduate-facing definition (uniLongDef).
  // When present, the card shows the SHORT teaser inline and the longer piece
  // opens in a "Read more" pop-up, the same pattern career worlds use.
  const uniLongParas = String(world.uniLongDef || '')
    .split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const hasUniLong = itemType === 'pathway' && uniLongParas.length > 0;
  // Pilot (career worlds): open on the SHORT definition, with the long definition
  // behind a "Read more about this world" pop-up. Uni pathways: short teaser inline,
  // longer uni def in the pop-up. Otherwise: pathways show the long definition on
  // top; career worlds the short definition.
  const topSource = (pilotDefinition || hasUniLong)
    ? (world.shortDef || world.longDef)
    : (splitNarrative ? (world.longDef || world.shortDef) : world.shortDef);
  const topParas = String(topSource || '')
    .split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  // Pathway short & long definitions are complementary (short = what it is, long =
  // the work/roles/trends), so the "Read more" pop-up shows both together as one
  // complete definition. Career worlds already restate their intro in the long
  // definition, so they show the long text alone.
  const modalParas = hasUniLong
    ? [...shortParas, ...uniLongParas]
    : (itemType === 'pathway' ? [...shortParas, ...longParas] : longParas);
  const plainDef = splitNarrative || pilotDefinition;
  const narrativeParas = String(world.narrative || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

  // When splitting, the first sentence of the narrative goes with the profiles
  // accordion and the remainder goes with the traits accordion.
  let narrativeLead = '';
  let narrativeRest = '';
  if (splitNarrative) {
    const full = String(world.narrative || '').replace(/\s+/g, ' ').trim();
    // The archetype opener (one OR two sentences) never begins with "Your"; every
    // trait sentence begins "Your ...". Split at the first trait sentence, so a
    // two-sentence profile opener stays whole with the profiles.
    let cut = -1;
    if (/^Your\b/.test(full)) cut = 0;
    else {
      const mm = /[.!?]\s+(Your\b)/.exec(full);
      if (mm) cut = mm.index + mm[0].indexOf('Your');
    }
    if (cut >= 0) {
      narrativeLead = full.slice(0, cut).trim();
      narrativeRest = full.slice(cut).trim();
    } else {
      const m = full.match(/^(.*?[.!?])(?:\s+([\s\S]*))?$/);
      if (m) {
        narrativeLead = (m[1] || '').trim();
        narrativeRest = (m[2] || '').trim();
      } else {
        narrativeLead = full;
      }
    }
  }

  return (
    <div ref={cardRef} className={`cw-accordion-item ${open ? 'is-open' : ''}${pilotDefinition ? ' cw-accordion-item--pilot' : ''}`}>
      <div
        className="cw-accordion-item__head"
        onClick={(e) => {
          // Let the whole header open/close the card, but ignore clicks on the
          // real controls (toggle/chevron buttons, like/dislike) and on the
          // tooltip pills — those handle themselves.
          if (e.target.closest('button, [data-selection-tooltip]')) return;
          onToggle();
        }}
      >
        <button type="button" className="cw-accordion-item__toggle" onClick={onToggle} aria-expanded={open}>
          {Icon ? <span className="cw-accordion-item__icon" aria-hidden="true">{Icon}</span> : null}
          {pilotDefinition ? (
            <span className="cw-accordion-item__titlewrap">
              <span className="cw-accordion-item__title">{world.title}</span>
            </span>
          ) : (
            <span className="cw-accordion-item__title">{world.title}</span>
          )}
        </button>

        {pilotDefinition ? null : (
          <div className="cw-accordion-item__meta">
            {open ? (
              <div className="cw-accordion-item__reactions" aria-label="Career world feedback">
                <button
                  type="button"
                  className={`cdna-item-action cdna-item-action--like ${reaction === 'like' ? 'is-active' : ''}`}
                  onClick={() => onReact('like')}
                  aria-pressed={reaction === 'like'}
                  aria-label="Sounds interesting"
                  data-selection-tooltip="true"
                  data-tooltip-body={reaction === 'like' ? 'Added to favourites' : 'Sounds interesting'}
                >
                  <span className="cdna-item-action-icon" aria-hidden="true"><ThumbsUp size={18} weight="duotone" /></span>
                </button>
                <button
                  type="button"
                  className={`cdna-item-action cdna-item-action--dislike ${reaction === 'dislike' ? 'is-active' : ''}`}
                  onClick={() => onReact('dislike')}
                  aria-pressed={reaction === 'dislike'}
                  aria-label="Not for me"
                  data-selection-tooltip="true"
                  data-tooltip-body="Not for me"
                >
                  <span className="cdna-item-action-icon" aria-hidden="true"><ThumbsDown size={18} weight="duotone" /></span>
                </button>
              </div>
            ) : null}

            {label ? (
              <span
                className={`cdna-match-meter cdna-match-meter--${String(band).replace(/\s*match$/i, '').toLowerCase()} cw-accordion-item__band`}
                tabIndex={0}
                data-selection-tooltip="true"
                data-tooltip-title={label}
                data-tooltip-body={getMatchTooltipBody(label)}
                aria-label={`${label}: ${getMatchTooltipBody(label)}`}
              >
                <span className="cdna-match-meter__label">{label}</span>
                <span className="cdna-match-meter__track" aria-hidden="true">
                  <span className="cdna-match-meter__fill" style={{ width: `${fillPct}%` }} />
                </span>
              </span>
            ) : null}
          </div>
        )}

        {pilotDefinition ? (
          <>
            {!open && reaction === 'like' ? (
              <span className="cw-liked-mark" aria-label="Saved to favourites" title="Saved to favourites">
                <BookmarkSimple size={19} weight="fill" aria-hidden="true" />
              </span>
            ) : null}
            {badge.text ? (
              <span
                className={`cw-match-badge cw-match-badge--${badge.tone} cw-accordion-item__pilotbadge`}
                tabIndex={0}
                data-selection-tooltip="true"
                data-tooltip-title={label}
                data-tooltip-body={getMatchTooltipBody(label)}
              >
                {badge.text}
              </span>
            ) : null}
            <button
              type="button"
              className="cw-accordion-item__chev"
              onClick={onToggle}
              aria-label={open ? 'Collapse' : 'Expand'}
              aria-expanded={open}
            >
              <Chevron open={open} />
            </button>
          </>
        ) : (
          <>
            {!open && reaction === 'like' ? (
              <span className="cw-liked-mark" aria-label="Saved to favourites" title="Saved to favourites">
                <BookmarkSimple size={19} weight="fill" aria-hidden="true" />
              </span>
            ) : null}
            <button
              type="button"
              className="cw-accordion-item__chev"
              onClick={onToggle}
              aria-label={open ? 'Collapse' : 'Expand'}
              aria-expanded={open}
            >
              <Chevron open={open} />
            </button>
          </>
        )}
      </div>

      {open ? (
        <div className="cw-accordion-item__body">
          {Array.isArray(world.routeChips) && world.routeChips.length ? (
            <div className="cw-route-chips cw-route-chips--body">
              <span className="cw-route-chips__label">Ways in</span>
              <RouteChips chips={world.routeChips} />
            </div>
          ) : null}
          {topParas.map((p, i) => (
            <p className={`cw-accordion-item__short${plainDef ? ' cw-accordion-item__short--plain' : ''}`} key={`s-${world.id}-${i}`}>{p}</p>
          ))}
          {((pilotDefinition && longParas.length) || (hasUniLong && modalParas.length)) ? (
            <button type="button" className="cw-readmore" onClick={() => setDefOpen(true)}>
              Read more about this {readMoreNoun}
            </button>
          ) : null}
          {!splitNarrative && narrativeParas.map((p, i) => (
            <p className="cw-accordion-item__narrative" key={`n-${world.id}-${i}`}>{p}</p>
          ))}

          {world.insight ? (
            <ItemPills
              item={world.insight}
              narrativeLead={splitNarrative ? narrativeLead : ''}
              narrativeRest={splitNarrative ? narrativeRest : ''}
              collapsibleNarrative={pilotDefinition}
            />
          ) : null}

          {pilotDefinition ? (
            <div className="cw-react-row" aria-label="Career world feedback">
              <button
                type="button"
                className={`cw-react-btn cw-react-btn--like ${reaction === 'like' ? 'is-active' : ''}`}
                onClick={(e) => {
                  const activating = reaction !== 'like';
                  const btn = e.currentTarget;
                  onReact('like');
                  if (activating) {
                    btn.setAttribute('data-tooltip-body', 'Added to favourites');
                    window.requestAnimationFrame(() => {
                      showSelectionTooltip(btn);
                      window.setTimeout(() => { hideSelectionTooltip(); if (btn.blur) btn.blur(); }, 1200);
                    });
                  } else {
                    hideSelectionTooltip();
                  }
                }}
                aria-pressed={reaction === 'like'}
              >
                <Smiley size={18} weight="bold" aria-hidden="true" /> Like this
              </button>
              <button
                type="button"
                className={`cw-react-btn cw-react-btn--dislike ${reaction === 'dislike' ? 'is-active' : ''}`}
                onClick={() => { onReact('dislike'); hideSelectionTooltip(); }}
                aria-pressed={reaction === 'dislike'}
              >
                <SmileyMeh size={18} weight="regular" aria-hidden="true" /> Not for me
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {defOpen ? (
        <div
          className="cw-def-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${world.title} — full definition`}
          onClick={(e) => { if (e.target === e.currentTarget) setDefOpen(false); }}
        >
          <div className="cw-def-modal__box">
            <div className="cw-def-modal__head">
              {Icon ? <span className="cw-def-modal__icon" aria-hidden="true">{Icon}</span> : null}
              <span className="cw-def-modal__title">{world.title}</span>
              <button type="button" className="cw-def-modal__close" aria-label="Close" onClick={() => setDefOpen(false)}>×</button>
            </div>
            <div className="cw-def-modal__body">
              {modalParas.map((p, i) => (
                <p key={`def-${world.id}-${i}`}>{p}</p>
              ))}
            </div>
            <button type="button" className="cw-def-modal__done" onClick={() => setDefOpen(false)}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Career Worlds shown as an accordion: each world opens to reveal the
// standardized short definition, the personalised match narrative, like/dislike,
// and the signature-profile and signature-trait pills. One open at a time.
export default function CareerWorldsAccordion({
  worlds = [],
  savedReactions = {},
  onItemReaction,
  itemType = 'career_world',
  iconFor = getCareerWorldIcon,
  introText,
  filter: filterProp,
  onFilterChange,
  hideFilterBar = false,
  filterGroups = ['route', 'band', 'favourites'],
}) {
  const [openId, setOpenId] = useState('');
  // Filter can be controlled from a parent (so one bar can drive several
  // accordions) or managed internally when no filter prop is supplied.
  const [internalFilter, setInternalFilter] = useState(emptyFilter());
  const filter = filterProp !== undefined ? filterProp : internalFilter;
  const setFilter = onFilterChange || setInternalFilter;
  const rootRef = useRef(null);

  // Filter the worlds/pathways list by route chips, match band, and favourites.
  const visibleWorlds = applyResultsFilter(worlds, filter, {
    isLiked: (w) => savedReactions[w.id] === 'like',
  });

  // Start with every box collapsed (also on re-entering the tab); only keep an
  // already-open box open if it still exists after the worlds list changes.
  useEffect(() => {
    setOpenId((prev) => {
      const keys = worlds.map((w) => w.id || w.title);
      return keys.includes(prev) ? prev : '';
    });
  }, [worlds]);

  // Delegated hover/focus tooltips for the pills and match meter — same
  // mechanism the Pathway Explorer uses.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const getTarget = (event) => (
      event.target instanceof Element ? event.target.closest('[data-selection-tooltip="true"]') : null
    );
    let suppressUntil = 0;
    let autoHideTimer = null;
    const onOver = (event) => {
      if (Date.now() < suppressUntil) return;
      const t = getTarget(event);
      if (t instanceof HTMLElement) showSelectionTooltip(t);
    };
    const onOut = (event) => { const t = getTarget(event); if (t instanceof HTMLElement) hideSelectionTooltip(); };
    // On tap/click, briefly show the (freshly updated) tooltip as confirmation,
    // then auto-close it — so it never sticks open on touch.
    const onClick = (event) => {
      const t = getTarget(event);
      if (!(t instanceof HTMLElement)) return;
      suppressUntil = Date.now() + 1600;
      window.requestAnimationFrame(() => {
        showSelectionTooltip(t);
        if (autoHideTimer) clearTimeout(autoHideTimer);
        autoHideTimer = setTimeout(() => { hideSelectionTooltip(); if (typeof t.blur === 'function') t.blur(); }, 1100);
      });
    };
    root.addEventListener('pointerover', onOver);
    root.addEventListener('pointerout', onOut);
    root.addEventListener('focusin', onOver);
    root.addEventListener('focusout', onOut);
    root.addEventListener('click', onClick);
    window.addEventListener('scroll', hideSelectionTooltip, { passive: true });
    window.addEventListener('resize', hideSelectionTooltip);
    return () => {
      root.removeEventListener('pointerover', onOver);
      root.removeEventListener('pointerout', onOut);
      root.removeEventListener('focusin', onOver);
      root.removeEventListener('focusout', onOut);
      root.removeEventListener('click', onClick);
      window.removeEventListener('scroll', hideSelectionTooltip);
      window.removeEventListener('resize', hideSelectionTooltip);
      if (autoHideTimer) clearTimeout(autoHideTimer);
      hideSelectionTooltip();
    };
  }, []);

  if (!worlds.length) return null;

  const handleReact = (world, next) => {
    const id = world.id;
    if (!id || typeof onItemReaction !== 'function') return;
    const current = savedReactions[id] || '';
    const isSame = current === next;
    onItemReaction({ itemType, itemId: id, itemTitle: world.title, reaction: next, remove: isSame });
  };

  const introCopy = introText !== undefined
    ? introText
    : 'Career worlds are broad areas of work that may suit how you naturally think, learn and engage.\nOpen each one to see what it is, why it fits you, and how your traits line up. Like the ones you are drawn to, then head to Career Pathways for more info.';

  const introLines = typeof introCopy === 'string' ? introCopy.split('\n').filter((l) => l.trim()) : [];

  return (
    <section className="cw-accordion" ref={rootRef}>
      {introLines.length ? (
        <div className="cw-accordion__intro">
          {introLines.map((line, i) => (
            <p className="cw-accordion__intro-p" key={i}>{line}</p>
          ))}
        </div>
      ) : null}
      {hideFilterBar ? null : (
        <div className="cw-accordion__toolbar">
          <ResultsFilterBar filter={filter} onChange={setFilter} groups={filterGroups} />
        </div>
      )}
      {visibleWorlds.length ? visibleWorlds.map((world) => {
        const key = world.id || world.title;
        const open = key === openId;
        return (
          <WorldCard
            key={key}
            world={world}
            open={open}
            iconFor={iconFor}
            pilotDefinition={itemType === 'career_world' || itemType === 'pathway'}
            itemType={itemType}
            onToggle={() => setOpenId(open ? '' : key)}
            reaction={savedReactions[world.id] || ''}
            onReact={(next) => handleReact(world, next)}
          />
        );
      }) : (
        <p className="results-filter-empty">Nothing matches this filter. Try clearing a filter.</p>
      )}
    </section>
  );
}
