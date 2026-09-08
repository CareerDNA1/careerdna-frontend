import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { buildApiCandidates } from '../utils/config';
import AccountNavbar from '../Components/Common/AccountNavbar';
import './AdminDashboard.css';

const ARCHETYPES = ['Explorer', 'Organizer', 'Visionary', 'Creator', 'Connector', 'Thinker', 'Achiever'];

const DIMENSION_GROUPS = [
  {
    name: 'Who You Are',
    subdimensions: [
      'Curiosity & Openness',
      'Reliability & Focus',
      'Emotional Stability',
      'Uncertainty Tolerance',
      'Perseverance',
      'Sociability & Extroversion',
    ],
  },
  {
    name: 'What You Love',
    subdimensions: [
      'Investigative Curiosity',
      'Creative Expression',
      'Helping Orientation',
      'Entrepreneurial Drive',
      'Hands-On Engagement',
      'Novelty & Variety Seeking',
    ],
  },
  {
    name: 'What Matters',
    subdimensions: [
      'Purpose & Impact',
      'Independence & Autonomy',
      'Stability & Predictability',
      'Recognition & Visibility',
      'Financial Ambition',
      'Belonging & Connection',
    ],
  },
  {
    name: 'How You Work Best',
    subdimensions: [
      'Pace & Intensity Preference',
      'Organisation & Systems Orientation',
      'Clarity & Structure Preference',
      'Team Collaboration',
      'Independent Working Approach',
      'Attention to Detail',
    ],
  },
];


const RESULTS_USEFULNESS_RATINGS = [
  { value: 1, label: 'Not quite' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Useful' },
  { value: 4, label: 'Very useful' },
];

const ITEM_TYPE_LABELS = {
  strength: 'Strengths',
  environment: 'Work environments',
  career_world: 'Career worlds',
  subject: 'University subjects',
  role: 'Career pathways',
};

const SUBDIMENSION_TO_DIMENSION = DIMENSION_GROUPS.reduce((acc, group) => {
  group.subdimensions.forEach((name) => {
    acc[normaliseName(name)] = group.name;
  });
  return acc;
}, {});

function normaliseName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPct(value, fallback = '—') {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return `${Math.round(n)}%`;
}

function normaliseEventName(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function safeObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n <= 1 ? n * 100 : n;
}

function getArchetypeRows(results = {}) {
  const archetypes = safeObject(results?.archetypes);
  return Object.entries(archetypes)
    .map(([name, score]) => ({ name, score: normalizeScore(score) ?? 0 }))
    .filter((row) => row.name)
    .sort((a, b) => b.score - a.score);
}

function getTopArchetype(results = {}) {
  return getArchetypeRows(results)[0]?.name || '—';
}

function getStatusFromRun(run = {}) {
  const intro = safeObject(run?.intro_answers_json);
  return intro.status || intro.userStatus || intro.educationStatus || '—';
}

function getNameFromRun(run = {}) {
  const intro = safeObject(run?.intro_answers_json);
  return intro.name || intro.firstName || intro.fullName || '—';
}

function readSubdimensionRows(results = {}) {
  const direct = Array.isArray(results?.subdimensionRows) ? results.subdimensionRows : [];
  const fallback = Array.isArray(results?.subdimensions) ? results.subdimensions : [];
  const rows = direct.length ? direct : fallback;

  return rows
    .map((row) => {
      const name = String(row?.name || row?.title || row?.label || row?.subdimension || row?.code || '').trim();
      const score = normalizeScore(row?.score_pct ?? row?.score ?? row?.percentage ?? row?.value ?? row?.adjusted);
      const dimension = row?.dimension || SUBDIMENSION_TO_DIMENSION[normaliseName(name)] || 'Other';
      if (!name || score == null) return null;
      return { name, score, dimension };
    })
    .filter(Boolean);
}

function StatCard({ label, value, note }) {
  return (
    <article className="admin-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

function ScoreBar({ value }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="admin-score-cell">
      <span>{formatPct(pct)}</span>
      <div className="admin-score-track">
        <div className="admin-score-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);
  const [dashboard, setDashboard] = useState({ users: [], events: [], runs: [], feedback: [] });
  const [menuOpen, setMenuOpen] = useState(false);

  async function loadDashboard({ silent = false } = {}) {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    setForbidden(false);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (sessionError) throw sessionError;
      if (!accessToken) {
        setForbidden(true);
        return;
      }

      const candidates = buildApiCandidates('/api/admin/dashboard');
      let lastError = null;

      for (const url of candidates) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.status === 404) {
            lastError = new Error('Admin endpoint was not found. Check that the patched backend index.js is running.');
            continue;
          }

          if (response.status === 401 || response.status === 403) {
            setForbidden(true);
            return;
          }

          const contentType = response.headers.get('content-type') || '';
          const responseText = await response.text();
          const looksLikeHtml = /^\s*</.test(responseText);

          if (looksLikeHtml || !contentType.toLowerCase().includes('application/json')) {
            lastError = new Error(
              `Admin endpoint returned HTML instead of JSON from ${url}. This usually means the frontend is hitting the React app/server instead of the backend, or the backend has not been restarted with the admin route.`
            );
            continue;
          }

          let data = null;
          try {
            data = responseText ? JSON.parse(responseText) : {};
          } catch (parseError) {
            lastError = new Error(`Admin endpoint returned invalid JSON from ${url}: ${parseError.message}`);
            continue;
          }

          if (!response.ok) {
            const message = data?.message || data?.error || `Admin dashboard failed: ${response.status}`;
            throw new Error(message);
          }

          setDashboard({
            users: Array.isArray(data?.users) ? data.users : [],
            events: Array.isArray(data?.events) ? data.events : [],
            runs: Array.isArray(data?.runs) ? data.runs : [],
            feedback: Array.isArray(data?.feedback) ? data.feedback : [],
          });
          return;
        } catch (candidateError) {
          lastError = candidateError;
        }
      }

      throw lastError || new Error('Could not load admin dashboard.');
    } catch (err) {
      setError(err?.message || 'Could not load admin dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const users = dashboard.users || [];
    const events = dashboard.events || [];
    const runs = dashboard.runs || [];
    const feedback = dashboard.feedback || [];

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const completedRuns = runs.filter((run) => safeObject(run?.results_json)?.archetypes);
    const runCount = completedRuns.length;

    const newUsers7d = users.filter((user) => {
      const t = new Date(user.created_at).getTime();
      return Number.isFinite(t) && t >= sevenDaysAgo;
    }).length;

    const reportsGenerated = runs.length;
    const advisorQuestions = users.reduce((sum, user) => sum + (Number(user.advisor_questions_used) || 0), 0);
    const paidUsers = users.filter((user) => !['free', '', null, undefined].includes(user.plan)).length;

    const eventCounts = events.reduce((acc, event) => {
      const key = event.event_type || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topEvents = Object.entries(eventCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const archetypeBuckets = Object.fromEntries(
      ARCHETYPES.map((name) => [name, { name, total: 0, count: 0, top1Count: 0, top3Count: 0 }])
    );

    completedRuns.forEach((run) => {
      const rows = getArchetypeRows(run.results_json);
      const top1 = rows[0]?.name;
      const top3 = new Set(rows.slice(0, 3).map((row) => row.name));

      rows.forEach((row) => {
        if (!archetypeBuckets[row.name]) {
          archetypeBuckets[row.name] = { name: row.name, total: 0, count: 0, top1Count: 0, top3Count: 0 };
        }
        archetypeBuckets[row.name].total += row.score;
        archetypeBuckets[row.name].count += 1;
      });

      if (top1 && archetypeBuckets[top1]) archetypeBuckets[top1].top1Count += 1;
      top3.forEach((name) => {
        if (archetypeBuckets[name]) archetypeBuckets[name].top3Count += 1;
      });
    });

    const archetypeAnalytics = Object.values(archetypeBuckets)
      .map((row) => ({
        ...row,
        averageScore: row.count ? row.total / row.count : 0,
        top1Pct: runCount ? (row.top1Count / runCount) * 100 : 0,
        top3Pct: runCount ? (row.top3Count / runCount) * 100 : 0,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    const topArchetypes = archetypeAnalytics
      .filter((row) => row.top1Count > 0)
      .sort((a, b) => b.top1Count - a.top1Count)
      .slice(0, 7);

    const subdimensionBuckets = {};

    completedRuns.forEach((run) => {
      readSubdimensionRows(run.results_json).forEach((row) => {
        const key = normaliseName(row.name);
        if (!subdimensionBuckets[key]) {
          subdimensionBuckets[key] = {
            name: row.name,
            dimension: SUBDIMENSION_TO_DIMENSION[key] || row.dimension || 'Other',
            total: 0,
            count: 0,
          };
        }
        subdimensionBuckets[key].total += row.score;
        subdimensionBuckets[key].count += 1;
      });
    });

    const subdimensionAnalytics = Object.values(subdimensionBuckets)
      .map((row) => ({
        ...row,
        averageScore: row.count ? row.total / row.count : 0,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    const topSubdimensions = subdimensionAnalytics.slice(0, 5);

    const subdimensionsByDimension = DIMENSION_GROUPS.map((group) => ({
      name: group.name,
      rows: group.subdimensions.map((name) => {
        const key = normaliseName(name);
        return subdimensionBuckets[key]
          ? { ...subdimensionBuckets[key], averageScore: subdimensionBuckets[key].total / subdimensionBuckets[key].count }
          : { name, dimension: group.name, averageScore: 0, count: 0 };
      }),
    }));


    const usersById = new Map(users.map((user) => [user.id, user]));
    const runsById = new Map(runs.map((run) => [run.id, run]));

    const overallFeedbackRows = feedback
      .filter((row) => row?.feedback_scope === 'overall_usefulness')
      .filter((row) => Number.isInteger(Number(row.rating)) && Number(row.rating) >= 1 && Number(row.rating) <= 4);

    const resultsUsefulnessTotal = overallFeedbackRows.length;
    const resultsUsefulnessAverage = resultsUsefulnessTotal
      ? overallFeedbackRows.reduce((sum, row) => sum + Number(row.rating), 0) / resultsUsefulnessTotal
      : 0;

    const resultsUsefulnessRows = RESULTS_USEFULNESS_RATINGS.map((rating) => {
      const count = overallFeedbackRows.filter((row) => Number(row.rating) === rating.value).length;
      return {
        ...rating,
        count,
        pct: resultsUsefulnessTotal ? (count / resultsUsefulnessTotal) * 100 : 0,
      };
    });

    const resultsUsefulnessComments = overallFeedbackRows
      .filter((row) => String(row?.comment || '').trim())
      .map((row) => {
        const user = usersById.get(row.user_id) || {};
        const run = runsById.get(row.assessment_run_id) || {};
        const rating = RESULTS_USEFULNESS_RATINGS.find((item) => item.value === Number(row.rating));
        return {
          id: row.id,
          comment: String(row.comment || '').trim(),
          rating: Number(row.rating),
          ratingLabel: rating?.label || '—',
          userEmail: user.email || '—',
          userName: user.full_name || getNameFromRun(run),
          createdAt: row.updated_at || row.created_at || null,
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    const itemFeedbackRows = feedback.filter((row) => row?.feedback_scope === 'item_reaction');
    const itemBuckets = {};

    itemFeedbackRows.forEach((row) => {
      const reaction = String(row?.reaction || '').trim().toLowerCase();
      if (reaction !== 'like' && reaction !== 'dislike') return;
      const itemType = String(row?.item_type || 'other').trim() || 'other';
      const itemTitle = String(row?.item_title || row?.item_id || 'Untitled item').trim();
      const key = `${itemType}::${normaliseName(itemTitle)}`;

      if (!itemBuckets[key]) {
        itemBuckets[key] = {
          key,
          itemType,
          groupLabel: ITEM_TYPE_LABELS[itemType] || normaliseEventName(itemType || 'Other'),
          itemTitle,
          likes: 0,
          dislikes: 0,
        };
      }

      if (reaction === 'like') itemBuckets[key].likes += 1;
      if (reaction === 'dislike') itemBuckets[key].dislikes += 1;
    });

    const itemFeedbackAnalytics = Object.values(itemBuckets)
      .map((row) => {
        const total = row.likes + row.dislikes;
        return {
          ...row,
          total,
          likePct: total ? (row.likes / total) * 100 : 0,
          dislikePct: total ? (row.dislikes / total) * 100 : 0,
        };
      })
      .sort((a, b) => {
        if (a.groupLabel !== b.groupLabel) return a.groupLabel.localeCompare(b.groupLabel);
        if (b.total !== a.total) return b.total - a.total;
        return a.itemTitle.localeCompare(b.itemTitle);
      });

    const itemFeedbackByGroup = Object.values(
      itemFeedbackAnalytics.reduce((acc, row) => {
        const key = row.groupLabel;
        if (!acc[key]) acc[key] = { name: key, rows: [] };
        acc[key].rows.push(row);
        return acc;
      }, {})
    );

    return {
      totalUsers: users.length,
      newUsers7d,
      reportsGenerated,
      advisorQuestions,
      paidUsers,
      topEvents,
      topArchetypes,
      archetypeAnalytics,
      subdimensionAnalytics,
      topSubdimensions,
      subdimensionsByDimension,
      modelRunCount: runCount,
      subdimensionRunCount: completedRuns.filter((run) => readSubdimensionRows(run.results_json).length).length,
      feedbackCount: feedback.length,
      resultsUsefulnessTotal,
      resultsUsefulnessAverage,
      resultsUsefulnessRows,
      resultsUsefulnessComments,
      itemFeedbackByGroup,
    };
  }, [dashboard]);

  if (forbidden) {
    return <Navigate to="/profile" replace />;
  }

  if (loading) {
    return (
      <div className="admin-page">
        <AccountNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <div className="admin-shell">
          <section className="admin-loading-card">Loading admin dashboard...</section>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AccountNavbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">Private control panel</p>
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">
              Monitor users, report generation, activity events, and early model-validation signals.
            </p>
          </div>

          <button className="admin-refresh-button" onClick={() => loadDashboard({ silent: true })} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>

      {error ? <div className="admin-error">{error}</div> : null}

      <section className="admin-stats-grid">
        <StatCard label="Total users" value={stats.totalUsers} note={`${stats.newUsers7d} new in last 7 days`} />
        <StatCard label="Reports generated" value={stats.reportsGenerated} note="Saved assessment runs" />
        <StatCard label="Advisor questions" value={stats.advisorQuestions} note="Used across all users" />
        <StatCard label="Paid / non-free users" value={stats.paidUsers} note="Based on profile plan" />
      </section>


      <section className="admin-panel admin-feedback-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Results usefulness</h2>
            <p className="admin-panel-note">Overall usefulness ratings submitted after users view their results.</p>
          </div>
          <span>{stats.resultsUsefulnessTotal} ratings</span>
        </div>

        <div className="admin-feedback-summary-grid">
          <article className="admin-feedback-score-card">
            <span>Average score</span>
            <strong>{Number(stats.resultsUsefulnessAverage || 0).toFixed(2)} / 4</strong>
          </article>

          <div className="admin-feedback-bars">
            {stats.resultsUsefulnessRows.map((row) => (
              <div className="admin-feedback-rating-row" key={row.value}>
                <div className="admin-feedback-rating-label">
                  <span>{row.label}</span>
                  <strong>{row.count} <em>({formatPct(row.pct, '0%')})</em></strong>
                </div>
                <div className="admin-bar-track admin-feedback-track">
                  <div className="admin-bar-fill" style={{ width: `${Math.max(row.count ? 8 : 0, row.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {stats.resultsUsefulnessComments.length ? (
          <details className="admin-comments-details">
            <summary>View comments ({stats.resultsUsefulnessComments.length})</summary>
            <div className="admin-comments-list">
              {stats.resultsUsefulnessComments.map((row) => (
                <article className="admin-comment-card" key={row.id || `${row.userEmail}-${row.createdAt}`}>
                  <div className="admin-comment-meta">
                    <strong>{row.ratingLabel}</strong>
                    <span>{row.userName || '—'} · {row.userEmail} · {formatDate(row.createdAt)}</span>
                  </div>
                  <p>{row.comment}</p>
                </article>
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <section className="admin-panel admin-feedback-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Item feedback</h2>
            <p className="admin-panel-note">Likes and dislikes for strengths, environments, career worlds, subjects and pathways. Items not clicked are excluded.</p>
          </div>
          <span>{stats.feedbackCount} feedback rows</span>
        </div>

        {stats.itemFeedbackByGroup.length ? (
          <div className="admin-item-feedback-grid">
            {stats.itemFeedbackByGroup.map((group) => (
              <article className="admin-item-feedback-card" key={group.name}>
                <h3>{group.name}</h3>
                <div className="admin-item-feedback-list">
                  {group.rows.slice(0, 20).map((row) => (
                    <div className="admin-item-feedback-row" key={row.key}>
                      <div className="admin-item-feedback-title">
                        <span>{row.itemTitle}</span>
                        <small>{row.total} clicked · {row.likes} like · {row.dislikes} dislike</small>
                      </div>
                      <div className="admin-feedback-splitbar" aria-label={`${row.likePct.toFixed(0)}% likes and ${row.dislikePct.toFixed(0)}% dislikes`}>
                        <span className="admin-feedback-splitbar__like" style={{ width: `${row.likePct}%` }} />
                        <span className="admin-feedback-splitbar__dislike" style={{ width: `${row.dislikePct}%` }} />
                      </div>
                      <strong>{formatPct(row.likePct, '0%')} liked</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">No item feedback has been submitted yet.</p>
        )}
      </section>

      <section className="admin-two-column">
        <article className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Event activity</h2>
            <span>{dashboard.events.length} recent events</span>
          </div>

          {stats.topEvents.length ? (
            <div className="admin-bars">
              {stats.topEvents.map((event) => {
                const max = Math.max(...stats.topEvents.map((row) => row.count), 1);
                return (
                  <div className="admin-bar-row" key={event.name}>
                    <div className="admin-bar-label">
                      <span>{normaliseEventName(event.name)}</span>
                      <strong>{event.count}</strong>
                    </div>
                    <div className="admin-bar-track">
                      <div className="admin-bar-fill" style={{ width: `${Math.max(8, (event.count / max) * 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="admin-empty">No analytics events yet. They will appear once the frontend starts sending events.</p>
          )}
        </article>

        <article className="admin-panel">
          <div className="admin-panel-heading">
            <h2>Top 1 profile mix</h2>
            <span>From saved reports</span>
          </div>

          {stats.topArchetypes.length ? (
            <div className="admin-pill-list">
              {stats.topArchetypes.map((row) => (
                <div className="admin-pill-row" key={row.name}>
                  <span>{row.name}</span>
                  <strong>{row.top1Count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="admin-empty">No archetype data found yet.</p>
          )}
        </article>
      </section>

      <section className="admin-panel admin-model-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Career profile analytics</h2>
            <p className="admin-panel-note">Average score, top 1 frequency, and top 3 frequency across completed saved reports.</p>
          </div>
          <span>{stats.modelRunCount} runs</span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-analytics-table">
            <thead>
              <tr>
                <th>Career profile</th>
                <th>Average score</th>
                <th>Top 1</th>
                <th>Top 3</th>
              </tr>
            </thead>
            <tbody>
              {stats.archetypeAnalytics.map((row) => (
                <tr key={row.name}>
                  <td><strong className="admin-primary-cell">{row.name}</strong></td>
                  <td><ScoreBar value={row.averageScore} /></td>
                  <td>{row.top1Count} <span className="admin-muted">({formatPct(row.top1Pct)})</span></td>
                  <td>{row.top3Count} <span className="admin-muted">({formatPct(row.top3Pct)})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel admin-model-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Top 5 subdimensions</h2>
            <p className="admin-panel-note">Highest average percentage scores across all saved runs with subdimension data.</p>
          </div>
          <span>{stats.subdimensionRunCount} runs</span>
        </div>

        {stats.topSubdimensions.length ? (
          <div className="admin-top-subdim-grid">
            {stats.topSubdimensions.map((row, index) => (
              <article className="admin-top-subdim-card" key={row.name}>
                <span className="admin-rank-badge">#{index + 1}</span>
                <h3>{row.name}</h3>
                <p>{row.dimension}</p>
                <strong>{formatPct(row.averageScore)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-empty">No subdimension data found yet.</p>
        )}
      </section>

      <section className="admin-panel admin-model-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Subdimensions by CareerDNA dimension</h2>
            <p className="admin-panel-note">Average percentage score for each trait, grouped under the four framework dimensions.</p>
          </div>
        </div>

        <div className="admin-dimension-grid">
          {stats.subdimensionsByDimension.map((group) => (
            <article className="admin-dimension-card" key={group.name}>
              <h3>{group.name}</h3>
              <div className="admin-subdim-list">
                {group.rows.map((row) => (
                  <div className="admin-subdim-row" key={row.name}>
                    <div className="admin-subdim-title">
                      <span>{row.name}</span>
                      <small>{row.count ? `${row.count} runs` : 'No data yet'}</small>
                    </div>
                    <ScoreBar value={row.averageScore} />
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Recent users</h2>
          <span>{dashboard.users.length} users</span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Plan</th>
                <th>Reports</th>
                <th>Advisor</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.users.slice(0, 25).map((user) => (
                <tr key={user.id}>
                  <td>{user.email || '—'}</td>
                  <td>{user.full_name || '—'}</td>
                  <td><span className="admin-plan-badge">{user.plan || 'free'}</span></td>
                  <td>{Number(user.reports_used) || 0} / {Number(user.report_limit) || 0}</td>
                  <td>{Number(user.advisor_questions_used) || 0} / {Number(user.advisor_questions_limit) || 0}</td>
                  <td>{formatDate(user.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-heading">
          <h2>Recent assessment runs</h2>
          <span>{dashboard.runs.length} latest runs</span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Top profile</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.runs.slice(0, 25).map((run) => (
                <tr key={run.id}>
                  <td>{getNameFromRun(run)}</td>
                  <td>{getStatusFromRun(run)}</td>
                  <td>{getTopArchetype(run.results_json)}</td>
                  <td>{formatDate(run.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
