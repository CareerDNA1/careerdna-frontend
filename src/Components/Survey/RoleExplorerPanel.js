import React, { useEffect, useMemo, useRef, useState } from 'react';
import './FurtherStudyPanel.css';
import { RoleAccordionItem } from './SelectionInsightExplorer';
import PathwayPicker, { readRemembered } from './PathwayPicker';
import { bandRank } from './ResultsFilter';
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

  // Pathways with roles, sorted by match strength (Top match first) so the
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
