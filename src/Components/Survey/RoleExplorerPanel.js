import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FurtherStudyPanel.css';
import { RoleAccordionItem, showSelectionTooltip, hideSelectionTooltip, SignalBadge } from './SelectionInsightExplorer';

// Role Explorer (university flow): the individual job roles inside the career
// pathways the student liked, in the same style as Further Study. Pick a
// pathway from the pills, then open any role to read what the work involves.
export default function RoleExplorerPanel({ pathways = [], savedReactions = {}, onItemReaction }) {
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const hasSelectedRef = useRef(false);
  const [activeKey, setActiveKey] = useState('');
  // Single-open accordion: only one role card is open at a time.
  const [openRoleKey, setOpenRoleKey] = useState('');

  const withRoles = useMemo(
    () => (pathways || []).filter((p) => Array.isArray(p?.roles) && p.roles.length),
    [pathways]
  );

  useEffect(() => {
    setActiveKey((prev) => {
      const keys = withRoles.map((p) => p.id || p.title);
      return keys.includes(prev) ? prev : (keys[0] || '');
    });
  }, [withRoles]);

  // Collapse any open role when switching pathway. No auto-scroll — the
  // selection can change as data settles, which was yanking the page around.
  useEffect(() => {
    hasSelectedRef.current = true;
    setOpenRoleKey('');
  }, [activeKey]);

  // Delegated white floating tooltips (same behaviour as the other tabs).
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
    const onClick = (event) => {
      const t = getTarget(event);
      if (t instanceof HTMLElement) showSelectionTooltip(t, { pinned: true });
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

  if (!withRoles.length) {
    return (
      <section className="selection-explorer selection-explorer--empty">
        <div className="selection-explorer__intro selection-explorer__intro--empty">
          <h2>Role Explorer</h2>
          <p className="selection-explorer__empty-message">
            Like the career pathways you&rsquo;re drawn to in the Career Pathways tab, then come back here to explore the
            individual roles inside them.
          </p>
        </div>
      </section>
    );
  }

  const active = withRoles.find((p) => (p.id || p.title) === activeKey) || withRoles[0];
  const activeBand = String(active?.signalLabel || '').trim();
  const activeHeaderLabel = activeBand
    ? (/match$/i.test(activeBand) ? activeBand : `${activeBand} match`)
    : '';

  return (
    <section className="selection-explorer" ref={rootRef}>
      <div className="selection-explorer__intro selection-explorer__intro--active">
        <h2>Role Explorer</h2>
        <p className="selection-explorer__intro-text">
          The individual job roles inside the career pathways you liked. Pick a pathway to see its roles, then open any
          role to read what the work involves and how it fits you.
        </p>
      </div>

      <div className="selection-explorer__layout selection-explorer__layout--stacked">
        <div className="selection-explorer__selector-tabs" role="tablist" aria-label="Liked pathways">
          {withRoles.map((p) => {
            const key = p.id || p.title;
            const isActive = key === (active.id || active.title);
            return (
              <button
                key={key}
                type="button"
                role="tab"
                className={`selection-list-button ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveKey(key)}
              >
                <span className="selection-list-button__title">{p.title}</span>
              </button>
            );
          })}
        </div>

        <div ref={mainRef} className="selection-explorer__main selection-explorer__main--full">
          <article className="selection-detail-card">
            <div className="fs-detail-head">
              <h3 className="fs-detail-title">{active.title}</h3>
              {activeHeaderLabel ? <SignalBadge label={activeHeaderLabel} /> : null}
            </div>
            <div className="fs-detail-heading">Roles within this pathway</div>
            {Array.isArray(active.roles) && active.roles.length ? (
              <div className="pathway-role-list">
                {active.roles.map((role) => {
                  const roleKey = role.id || role.title;
                  return (
                    <RoleAccordionItem
                      key={roleKey}
                      item={role}
                      onItemReaction={onItemReaction}
                      savedReactions={savedReactions}
                      showGradJobs
                      pathwayTitle={active.title}
                      isOpen={openRoleKey === roleKey}
                      onToggle={() => setOpenRoleKey((prev) => (prev === roleKey ? '' : roleKey))}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="fs-none">No roles mapped for this pathway yet.</p>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
