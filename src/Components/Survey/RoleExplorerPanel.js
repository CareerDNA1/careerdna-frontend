import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FurtherStudyPanel.css';
import { RoleAccordionItem } from './SelectionInsightExplorer';
import PathwayPicker, { readRemembered } from './PathwayPicker';
import ResultsFilterBar, { applyResultsFilter, emptyFilter, bandRank, FavouritesEmpty } from './ResultsFilter';
import { getPathwayIcon } from '../../utils/iconMap';

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
  // Same "Only my favourites" filter as the other tabs (5 Nov 2026).
  const [roleFilter, setRoleFilter] = useState(emptyFilter());

  // Pathways with roles, sorted by match strength (Standout first) so the
  // default selection and the list order agree.
  const withRoles = useMemo(
    () => (pathways || [])
      .filter((p) => Array.isArray(p?.roles) && p.roles.length)
      .slice()
      .sort((a, b) => bandRank(b?.signalLabel) - bandRank(a?.signalLabel) || String(a?.title || '').localeCompare(String(b?.title || ''))),
    [pathways]
  );

  useEffect(() => {
    setActiveKey((prev) => {
      const keys = withRoles.map((p) => p.id || p.title);
      if (keys.includes(prev)) return prev;
      return readRemembered('roles', keys) || keys[0] || '';
    });
  }, [withRoles]);

  const pickerOptions = useMemo(() => withRoles.map((p) => ({
    value: p.id || p.title,
    label: p.title,
    band: String(p.signalLabel || '').trim(),
    count: Array.isArray(p.roles) ? p.roles.length : 0,
    countNoun: 'role',
    icon: getPathwayIcon(p.title || ''),
  })), [withRoles]);

  // Collapse any open role when switching pathway. No auto-scroll — the
  // selection can change as data settles, which was yanking the page around.
  useEffect(() => {
    hasSelectedRef.current = true;
    setOpenRoleKey('');
  }, [activeKey]);

  // No floating tooltips on this tab for now.

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

  return (
    <section className="selection-explorer" ref={rootRef}>
      <div className="selection-explorer__intro selection-explorer__intro--active">
        <h2>Role Explorer</h2>
        <p className="selection-explorer__intro-text">
          The individual job roles inside the career pathways you liked. Pick a pathway to see its roles, then open any
          role to read what the work involves and how it fits you. Only the pathways you liked appear here, so to see
          more roles, go back to Career Pathways and like a few more.
        </p>
      </div>

      <div className="selection-explorer__layout selection-explorer__layout--stacked">
        <PathwayPicker options={pickerOptions} value={active.id || active.title} onSelect={setActiveKey} storageKey="roles" ariaLabel="Choose a pathway" title="Your pathways" />

        <div ref={mainRef} className="selection-explorer__main selection-explorer__main--full">
          <article className="selection-detail-card">
            {(() => {
              const allRoles = Array.isArray(active.roles) ? active.roles : [];
              const roles = applyResultsFilter(allRoles, roleFilter, { isLiked: (r) => Boolean(r?.id) && savedReactions[r.id] === 'like' });
              const renderRoles = (list) => (
                <div className="pathway-role-list">
                  {list.map((role) => {
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
              );
              if (!allRoles.length) return <p className="fs-none">No roles mapped for this pathway yet.</p>;
              return (
                <>
                  <div className="selection-explorer__toolbar">
                    <ResultsFilterBar filter={roleFilter} onChange={setRoleFilter} groups={['favourites']} />
                  </div>
                  {roleFilter.favouritesOnly ? (
                    roles.length ? (
                      <>
                        <div className="fs-detail-heading">Your saved roles</div>
                        {renderRoles(roles)}
                      </>
                    ) : (
                      <FavouritesEmpty noun="roles" where={active.title} />
                    )
                  ) : (
                    <>
                      <div className="fs-detail-heading">Roles within this pathway</div>
                      {renderRoles(roles)}
                    </>
                  )}
                </>
              );
            })()}
          </article>
        </div>
      </div>
    </section>
  );
}
