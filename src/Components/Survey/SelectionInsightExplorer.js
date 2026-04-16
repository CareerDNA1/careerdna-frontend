import React, { useEffect, useMemo, useState } from 'react';
import './SelectionInsightExplorer.css';
import {
  FaBrain,
  FaBullseye,
  FaCompass,
  FaLightbulb,
  FaTasks,
  FaPalette,
  FaUsers,
  FaStar,
  FaBriefcase,
} from 'react-icons/fa';

const ARCHETYPE_ICON_MAP = {
  creator: FaPalette,
  thinker: FaBrain,
  achiever: FaBullseye,
  visionary: FaLightbulb,
  explorer: FaCompass,
  organizer: FaTasks,
  connector: FaUsers,
};

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function sortSubdimensions(list = []) {
  const tierRank = { core: 0, signature: 0, fallback: 1, secondary: 2, modifier: 3 };
  return [...list].sort((a, b) => {
    const stateRank = { full: 0, mid: 1, grey: 2 };
    const stateDiff = (stateRank[a?.state] ?? 9) - (stateRank[b?.state] ?? 9);
    if (stateDiff !== 0) return stateDiff;
    const tierDiff = (tierRank[a?.tier] ?? 9) - (tierRank[b?.tier] ?? 9);
    if (tierDiff !== 0) return tierDiff;
    const scoreDiff = Number(b?.userScore || 0) - Number(a?.userScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });
}

function sortArchetypes(list = []) {
  const stateRank = { full: 0, mid: 1, grey: 2 };
  return [...list].sort((a, b) => {
    const stateDiff = (stateRank[a?.state] ?? 9) - (stateRank[b?.state] ?? 9);
    if (stateDiff !== 0) return stateDiff;
    const scoreDiff = Number(b?.userScore || 0) - Number(a?.userScore || 0);
    if (scoreDiff !== 0) return scoreDiff;
    return String(a?.name || '').localeCompare(String(b?.name || ''));
  });
}

function getArchetypeBand(score = 0) {
  if (score >= 80) return 'Standout';
  if (score >= 66) return 'Strong';
  if (score >= 54) return 'Good';
  return 'Lower';
}

function getSubdimensionBand(score = 0) {
  if (score >= 70) return 'Standout';
  if (score >= 60) return 'Strong';
  if (score >= 50) return 'Good';
  return 'Lower';
}

function bandToVisualState(band = '') {
  if (band === 'Standout' || band === 'Strong') return 'full';
  if (band === 'Good') return 'mid';
  return 'grey';
}

function getAlignedTraitCount(values = []) {
  return values.filter((x) => getSubdimensionBand(Number(x?.userScore || 0)) !== 'Lower').length;
}

function getAlignedArchetypeCount(values = []) {
  return values.filter((x) => getArchetypeBand(Number(x?.userScore || 0)) !== 'Lower').length;
}

function buildMatchLabel(item = {}) {
  const raw = String(item?.signalLabel || '').trim();
  if (!raw) return '';
  return /match$/i.test(raw) ? raw : `${raw} match`;
}

function SignalBadge({ label, blocks = 0 }) {
  if (!label) return null;

  return (
    <div className="selection-detail-card__signal">
      <span className="selection-detail-card__signal-label">{label}</span>
      <span className="selection-detail-card__signal-bars" aria-hidden="true">
        {Array.from({ length: 4 }, (_, idx) => (
          <span
            key={idx}
            className={`selection-detail-card__signal-block ${idx < Number(blocks || 0) ? 'is-filled' : ''}`}
          />
        ))}
      </span>
    </div>
  );
}

function AlignmentMeter({ aligned = 0, total = 0, label = '', description = '' }) {
  const safeTotal = Math.max(1, Number(total) || 0);
  const safeAligned = Math.max(0, Math.min(safeTotal, Number(aligned) || 0));
  const size = 120;
  const stroke = 12;
  const normalizedRadius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const progress = safeAligned / safeTotal;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="alignment-meter" title={description}>
      <div className="alignment-meter__donut">
        <svg className="alignment-meter__svg" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            className="alignment-meter__track"
            cx={size / 2}
            cy={size / 2}
            r={normalizedRadius}
            strokeWidth={stroke}
          />
          <circle
            className="alignment-meter__progress"
            cx={size / 2}
            cy={size / 2}
            r={normalizedRadius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="alignment-meter__center">
          <span className="alignment-meter__ratio">{safeAligned} / {safeTotal}</span>
        </div>
      </div>
      <div className="alignment-meter__label">{label}</div>
      <div className="alignment-meter__meta">{safeAligned} of {safeTotal} aligned</div>
    </div>
  );
}

function SelectionChip({ label, score, icon: Icon, kind = 'archetype' }) {
  const rounded = Math.round(Number(score || 0));
  const band = kind === 'archetype' ? getArchetypeBand(rounded) : getSubdimensionBand(rounded);
  const visual = bandToVisualState(band);
  const tooltip =
    kind === 'archetype'
      ? `${label}: ${band} alignment within your profile for this item.`
      : `${label}: ${band} trait alignment within your profile for this item.`;

  return (
    <div className={`selection-chip selection-chip--${visual} selection-chip--${kind}`} title={tooltip}>
      <span className="selection-chip__icon" aria-hidden="true">
        <Icon />
      </span>
      <div className="selection-chip__body">
        <div className="selection-chip__topline">
          <span className="selection-chip__label">{label}</span>
          <span className="selection-chip__band">{band}</span>
        </div>
        <div className="selection-chip__bar" aria-hidden="true">
          <span
            className="selection-chip__fill"
            style={{ width: `${Math.max(8, Math.min(100, rounded))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function SelectionListButton({ item, active, onClick }) {
  const matchLabel = buildMatchLabel(item);
  const hasDistinctMeta = Boolean(
    item?.careerWorldTitle &&
    normalizeKey(item?.careerWorldTitle) !== normalizeKey(item?.title)
  );
  return (
    <button
      type="button"
      className={`selection-list-button ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <span className="selection-list-button__title">{item?.title}</span>
      <span className="selection-list-button__meta">{matchLabel || item?.signalLabel || ''}</span>
    </button>
  );
}

function RoleItem({ item }) {
  return (
    <div className="pathway-role-item">
      <span className="pathway-role-item__icon" aria-hidden="true">
        <FaBriefcase />
      </span>
      <div className="pathway-role-item__copy">
        <span className="pathway-role-item__title">{item?.title}</span>
        {item?.entryLevelFit ? (
          <span className="pathway-role-item__meta">{item.entryLevelFit}</span>
        ) : null}
      </div>
    </div>
  );
}

function LinkedSubjectItem({ item }) {
  return (
    <div className="linked-subject-item">
      <div className="linked-subject-item__top">
        <div>
          <div className="linked-subject-item__title">{item?.title}</div>
          <div className="linked-subject-item__meta">
            {item?.relation === 'direct' ? 'Direct route from this career world' : 'Adjacent route worth exploring'}
          </div>
        </div>
        <SignalBadge label={item?.signalLabel} blocks={item?.signalBlocks} />
      </div>
      {(item?.fullSummary || item?.summary) ? (
        <p className="linked-subject-item__summary">{item?.fullSummary || item?.summary}</p>
      ) : null}
    </div>
  );
}

function DetailPanel({ item }) {
  const archetypes = useMemo(
    () => sortArchetypes(Array.isArray(item?.archetypes) ? item.archetypes : []),
    [item]
  );
  const subdimensions = useMemo(() => sortSubdimensions(item?.subdimensions || []), [item]);
  const isPathway = Boolean(item?.isPathway || (Array.isArray(item?.roles) && item.roles.length));
  const isCareerWorld = Boolean(item?.isCareerWorld || item?.type === 'career_world');
  const linkedSubjects = Array.isArray(item?.linkedSubjects) ? item.linkedSubjects : [];

  const coreSubdimensions = subdimensions.filter((x) => ['core', 'signature', 'fallback'].includes(String(x?.tier || '').toLowerCase()));
  const secondarySubdimensions = subdimensions.filter((x) => String(x?.tier || '').toLowerCase() === 'secondary');
  const tertiarySubdimensions = subdimensions.filter((x) => !['core', 'signature', 'fallback', 'secondary'].includes(String(x?.tier || '').toLowerCase()));
  const alignedTraitCount = getAlignedTraitCount(subdimensions);
  const totalTraitCount = Number(item?.totalSubdimensionCount || subdimensions.length || 0);
  const alignedArchetypeCount = getAlignedArchetypeCount(archetypes);
  const totalArchetypeCount = archetypes.length;
  const matchLabel = buildMatchLabel(item);

  const traitGroups = [
    { title: 'Core signature traits', items: coreSubdimensions },
    { title: 'Secondary signature traits', items: secondarySubdimensions },
    { title: 'Additional supporting traits', items: tertiarySubdimensions },
  ].filter((group) => Array.isArray(group.items) && group.items.length > 0);

  return (
    <article className="selection-detail-card">
      <div className="selection-detail-card__header">
        <div className="selection-detail-card__title-block">
          <div className="selection-detail-card__eyebrow">
            {isCareerWorld ? 'Career world insight' : isPathway ? 'Career pathway insight' : item?.type === 'role' ? 'Role insight' : 'Subject insight'}
          </div>
          <h3>{item?.title || 'Selected option'}</h3>
          {hasDistinctMeta ? (
            <p className="selection-detail-card__meta">{item.careerWorldTitle}</p>
          ) : null}
        </div>
        <div className="selection-detail-card__signal-wrap">
          <SignalBadge label={matchLabel || item?.signalLabel} blocks={item?.signalBlocks} />
        </div>
      </div>

      <div className="selection-alignment">
        <AlignmentMeter
          aligned={alignedArchetypeCount}
          total={totalArchetypeCount}
          label="Archetypes aligned"
          description="How many of this item's defining archetypes are meaningfully present in your profile."
        />
        <AlignmentMeter
          aligned={alignedTraitCount}
          total={totalTraitCount}
          label="Traits aligned"
          description="How many of this item's defining traits are meaningfully present in your profile."
        />
      </div>

      {!!archetypes.length && (
        <section className="selection-section-block">
          <div className="selection-section-block__header">
            <h4>Signature archetypes</h4>
            <p>The broader style this option tends to suit.</p>
          </div>
          <div className="selection-chip-grid">
            {archetypes.map((token) => {
              const IconComponent = ARCHETYPE_ICON_MAP[normalizeKey(token?.name)] || FaStar;
              return (
                <SelectionChip
                  key={`a-${item?.id}-${token?.name}`}
                  label={token?.name}
                  score={token?.userScore}
                  icon={IconComponent}
                  kind="archetype"
                />
              );
            })}
          </div>
        </section>
      )}

      {!!subdimensions.length && (
        <section className="selection-section-block">
          <div className="selection-section-block__header">
            <h4>Signature traits</h4>
            <p>The more specific traits that help explain this fit.</p>
          </div>

          {traitGroups.map((group) => (
            <div className="trait-group" key={`${item?.id}-${group.title}`}>
              <div className="trait-group__title">{group.title}</div>
              <div className="selection-chip-grid selection-chip-grid--traits">
                {group.items.map((token) => (
                  <SelectionChip
                    key={`${group.title}-${item?.id}-${token?.name}`}
                    label={token?.name}
                    score={token?.userScore}
                    icon={FaStar}
                    kind="trait"
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {isCareerWorld && linkedSubjects.length > 0 && (
        <section className="selection-section-block">
          <div className="selection-section-block__header">
            <h4>Best undergraduate subjects linked to this world</h4>
            <p>These are the clearest degree routes connected to this career world for your profile.</p>
          </div>
          <div className="linked-subject-list">
            {linkedSubjects.map((subject) => (
              <LinkedSubjectItem key={`${item?.id}-${subject?.id || subject?.title}`} item={subject} />
            ))}
          </div>
        </section>
      )}

      {isPathway && Array.isArray(item?.roles) && item.roles.length > 0 && (
        <section className="selection-section-block">
          <div className="selection-section-block__header">
            <h4>Career roles within this pathway</h4>
            <p>These are example entry roles that sit inside this broader pathway.</p>
          </div>
          <div className="pathway-role-list">
            {item.roles.map((role) => (
              <RoleItem key={`${item?.id}-${role?.id || role?.title}`} item={role} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

export default function SelectionInsightExplorer({ insights, loading, error }) {
  const validInsights = Array.isArray(insights) ? insights : [];
  const [activeId, setActiveId] = useState(validInsights[0]?.id || validInsights[0]?.title || '');

  useEffect(() => {
    const nextDefault = validInsights[0]?.id || validInsights[0]?.title || '';
    if (!validInsights.length) {
      setActiveId('');
      return;
    }
    const stillExists = validInsights.some((candidate) => (candidate?.id || candidate?.title) === activeId);
    if (!stillExists) setActiveId(nextDefault);
  }, [validInsights, activeId]);

  if (loading) {
    return (
      <section className="selection-explorer selection-explorer--loading">
        <div className="selection-explorer__intro">
          <h2>Discover more about your selections</h2>
          <p>Loading the deeper signature fit for the options you liked...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="selection-explorer">
        <div className="selection-explorer__intro">
          <h2>Discover more about your selections</h2>
          <p className="selection-explorer__error">{error}</p>
        </div>
      </section>
    );
  }

  if (!validInsights.length) {
    return (
      <section className="selection-explorer">
        <div className="selection-explorer__intro">
          <h2>Discover more about your selections</h2>
          <p>No deeper insight is available for those selections yet.</p>
        </div>
      </section>
    );
  }

  const activeItem = validInsights.find((candidate) => (candidate?.id || candidate?.title) === activeId) || validInsights[0];
  const hasPathway = validInsights.some((candidate) => candidate?.isPathway || (Array.isArray(candidate?.roles) && candidate.roles.length));
  const hasCareerWorld = validInsights.some((candidate) => candidate?.isCareerWorld || candidate?.type === 'career_world');

  return (
    <section className="selection-explorer">
      <div className="selection-explorer__intro">
        <h2>Discover more about your selections</h2>
        <p>
          {hasCareerWorld
            ? 'This view uses the same match scale as your main results, then shows the defining archetypes and traits behind each career world and the undergraduate subjects most strongly linked to it for your profile.'
            : hasPathway
            ? 'This view uses the same match scale as your main results, then shows the defining archetypes and traits behind each pathway and the concrete roles inside it.'
            : 'This view uses the same match scale as your main results, then shows the defining archetypes and traits behind each option in more detail.'}
        </p>
      </div>

      <div className="selection-explorer__layout">
        <aside className="selection-explorer__sidebar">
          <div className="selection-explorer__selector-title">Selected options</div>
          <div className="selection-explorer__selector-subtitle">Choose one to explore in more detail.</div>
          <div className="selection-explorer__selector-column">
            {validInsights.map((candidate) => {
              const key = candidate?.id || candidate?.title;
              return (
                <SelectionListButton
                  key={key}
                  item={candidate}
                  active={key === (activeItem?.id || activeItem?.title)}
                  onClick={() => setActiveId(key)}
                />
              );
            })}
          </div>
        </aside>

        <div className="selection-explorer__main">
          <DetailPanel item={activeItem} />
        </div>
      </div>
    </section>
  );
}
