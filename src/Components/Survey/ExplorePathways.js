import React, { useEffect, useMemo, useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'phosphor-react';
import { PATHWAY_DEFINITIONS } from '../../utils/selectionDefinitions';
import { fetchExplorePathways } from '../../utils/fetchExplorePathways';
import { OptionDropdown } from './SelectionInsightExplorer';
import './ExplorePathways.css';

const norm = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// Pathway title -> definition paragraph (PATHWAY_DEFINITIONS is keyed by id).
const DEF_BY_TITLE = Object.values(PATHWAY_DEFINITIONS).reduce((acc, p) => {
  if (p?.title) acc[p.title] = p.paragraph || '';
  return acc;
}, {});

function bandClass(label = '') {
  const k = norm(label);
  if (k.includes('standout')) return 'is-standout';
  if (k.includes('strong')) return 'is-strong';
  if (k.includes('good')) return 'is-good';
  return 'is-lower';
}

// Static fallback: all pathways of a world from the definitions, no match band.
function staticPathwaysForWorld(worldTitle) {
  const wt = norm(worldTitle);
  return Object.values(PATHWAY_DEFINITIONS)
    .filter((p) => norm(p?.careerWorldTitle) === wt)
    .map((p) => ({ id: p?.title, title: p?.title, definition: p?.paragraph || '', signalLabel: '' }));
}

function PathwayItem({ item, reaction, onReact }) {
  const [open, setOpen] = useState(false);
  const def = item?.definition || DEF_BY_TITLE[item?.title] || '';
  const pct = Math.round(Number(item?.signalPct || 0));
  const band = item?.signalLabel || '';

  return (
    <div className={`xp-p ${open ? 'is-open' : ''}`}>
      <button type="button" className="xp-p__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="xp-p__title">{item.title}</span>
        {band ? <span className={`xp-band ${bandClass(band)}`}>{band}{pct ? ` · ${pct}%` : ''}</span> : null}
        <span className="xp-p__chev" aria-hidden="true">{open ? '–' : '+'}</span>
      </button>
      {open ? (
        <div className="xp-p__body">
          {def ? <p className="xp-p__def">{def}</p> : null}
          <div className="xp-p__actions" aria-label="Pathway feedback">
            <button
              type="button"
              className={`cdna-item-action cdna-item-action--like ${reaction === 'like' ? 'is-active' : ''}`}
              onClick={() => onReact('like')}
              aria-pressed={reaction === 'like'}
              aria-label="Sounds interesting"
            >
              <span className="cdna-item-action-icon" aria-hidden="true"><ThumbsUp size={18} weight="duotone" /></span>
            </button>
            <button
              type="button"
              className={`cdna-item-action cdna-item-action--dislike ${reaction === 'dislike' ? 'is-active' : ''}`}
              onClick={() => onReact('dislike')}
              aria-pressed={reaction === 'dislike'}
              aria-label="Not for me"
            >
              <span className="cdna-item-action-icon" aria-hidden="true"><ThumbsDown size={18} weight="duotone" /></span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Pathways tab: pick a liked career world from the dropdown (same selector as
// Discover More), see that world's pathways ranked by match with definitions.
export default function ExplorePathways({ archetypes, subdimensions = [], worlds = [], itemReactions = {}, onItemReaction }) {
  const [scoredByWorld, setScoredByWorld] = useState(null); // null = loading, {} = no scores
  const [activeKey, setActiveKey] = useState('');

  const options = useMemo(
    () => (worlds || []).map((w) => ({ key: String(w.id || w.title), title: w.title })),
    [worlds]
  );

  useEffect(() => {
    if (!activeKey && options.length) setActiveKey(options[0].key);
  }, [options, activeKey]);

  const sig = useMemo(() => JSON.stringify({ a: archetypes || {}, s: subdimensions || [] }), [archetypes, subdimensions]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchExplorePathways({ archetypes, subdimensions });
        if (cancelled) return;
        const map = {};
        (data?.worlds || []).forEach((w) => {
          map[norm(w.title)] = (w.pathways || []).map((p) => ({
            id: p.id || p.title,
            title: p.title,
            definition: DEF_BY_TITLE[p.title] || '',
            signalLabel: p.signalLabel || '',
            signalPct: p.signalPct || 0,
          }));
        });
        setScoredByWorld(map);
      } catch (e) {
        if (!cancelled) setScoredByWorld({}); // fall back to static (no bands)
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const activeWorld = (worlds || []).find((w) => String(w.id || w.title) === activeKey) || (worlds || [])[0];

  const pathways = useMemo(() => {
    if (!activeWorld) return [];
    const scored = scoredByWorld && scoredByWorld[norm(activeWorld.title)];
    if (scored && scored.length) return scored;
    return staticPathwaysForWorld(activeWorld.title);
  }, [activeWorld, scoredByWorld]);

  const react = (p, reaction) => {
    if (typeof onItemReaction !== 'function') return;
    const remove = (itemReactions[p.id] || '') === reaction;
    onItemReaction({ itemType: 'pathway', itemId: p.id, itemTitle: p.title, reaction, remove });
  };

  if (!options.length) {
    return (
      <div className="xp-status">
        Like a career world in the Career Worlds tab to see its pathways here.
      </div>
    );
  }

  return (
    <div className="xp-root">
      <p className="xp-intro">
        Pick one of the career worlds you liked to see its pathways, ranked by how well each matches your profile.
        Open a pathway to read what it involves, and like the ones that appeal to you.
      </p>

      <OptionDropdown options={options} activeKey={activeKey} onSelect={setActiveKey} />

      {activeWorld ? (
        <div className="xp-plist">
          {pathways.map((p) => (
            <PathwayItem key={p.id} item={p} reaction={itemReactions[p.id] || ''} onReact={(r) => react(p, r)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
