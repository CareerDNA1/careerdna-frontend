import { useCallback, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../utils/apiFetch';
import './OpsPanel.css';

// Operations panel for the admin dashboard: service health, recent server
// errors, Stripe webhook events, safeguarding flags and backup notes.
// Data comes from GET /api/admin/ops; a second call records a manual backup.

// Signed-in call to an admin route. apiFetch already skips base URLs that
// answer 404 or with HTML; this maps its errors to the panel's wording.
async function adminFetch(path, options = {}) {
  try {
    return await apiFetch(path, { ...options, auth: 'required' });
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.code === 'NOT_SIGNED_IN') throw new Error('Not signed in.');
      if (e.status === 404) throw new Error('Endpoint not found. Is the latest backend running?');
      if (e.status) throw new Error(e.data?.message || `Request failed (${e.status}).`);
      if (/non JSON/i.test(e.message || '')) throw new Error('The backend did not answer. Is it running?');
    }
    throw e;
  }
}

function fmt(value) {
  if (!value) return 'never';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'never';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function uptimeText(seconds) {
  const s = Number(seconds) || 0;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  if (s < 86400) return `${Math.round(s / 3600)} h`;
  return `${Math.floor(s / 86400)} d ${Math.round((s % 86400) / 3600)} h`;
}

function Light({ ok, label, detail, help }) {
  return (
    <div className={`ops-tile ${ok ? 'is-ok' : 'is-down'}`}>
      <div className="ops-tile-head">
        <span className="ops-light-dot" aria-hidden="true" />
        <span className="ops-tile-label">{label}</span>
        <span className="ops-tile-detail">{detail}</span>
      </div>
      <p className="ops-help">{help}</p>
    </div>
  );
}

function Counter({ value, label, help, tone = '' }) {
  return (
    <div className={`ops-tile ${tone}`}>
      <div className="ops-tile-head">
        <span className="ops-tile-label">{label}</span>
      </div>
      <strong className="ops-tile-number">{value ?? '–'}</strong>
      <p className="ops-help">{help}</p>
    </div>
  );
}

export default function OpsPanel() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await adminFetch('/api/admin/ops'));
    } catch (e) {
      setError(e?.message || 'Could not load operations data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const recordBackup = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const r = await adminFetch('/api/admin/ops/backup-recorded', { method: 'POST', body: {} });
      setData((d) => (d ? { ...d, backups: { ...d.backups, lastManualBackup: { value: r.lastManualBackup, updatedAt: r.lastManualBackup } } } : d));
    } catch (e) {
      setError(e?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const h = data?.health || {};
  const allOk = data && h.database?.ok && h.supabaseAuth?.ok && h.openai?.ok && h.stripe?.ok;
  const errors = data?.errors?.recent || [];
  const visibleErrors = showAllErrors ? errors : errors.slice(0, 10);

  return (
    <section className="admin-panel ops-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Operations</h2>
          <p className="admin-panel-note">
            Live checks of the services CareerDNA depends on, plus recent errors, payments and safeguarding activity.
            {data ? ` Checked ${fmt(data.checkedAt)}.` : ''}
          </p>
        </div>
        <button type="button" className="admin-refresh-button ops-refresh" onClick={load} disabled={loading}>
          {loading ? 'Checking...' : 'Run checks'}
        </button>
      </div>

      {error ? <div className="admin-error">{error}</div> : null}

      {data ? (
        <>
          <div className={`ops-status-banner ${allOk ? 'is-ok' : 'is-down'}`}>
            {allOk ? 'All services are responding.' : 'At least one service is not responding. See below.'}
          </div>

          <div className="ops-row-label">Services <span>live test run just now; the time is how long each took to answer, under a second is normal</span></div>
          <div className="ops-four">
            <Light ok={h.database?.ok} label="Database" detail={h.database?.ok ? `${h.database.ms} ms` : 'not reachable'}
              help="Where all user data lives. Red means nothing can load or save." />
            <Light ok={h.supabaseAuth?.ok} label="Sign-in" detail={h.supabaseAuth?.ok ? `${h.supabaseAuth.ms} ms` : 'not reachable'}
              help="Log in and sign up. Red means nobody can sign in." />
            <Light ok={h.openai?.ok} label="OpenAI" detail={h.openai?.ok ? `${h.openai.ms} ms` : (h.openai?.note || 'not reachable')}
              help="Reports and advisor answers. Red means new ones fail; existing reports still open." />
            <Light ok={h.stripe?.ok} label="Stripe" detail={h.stripe?.ok ? `${h.stripe.ms} ms` : (h.stripe?.note || 'not reachable')}
              help="Payments. Red means checkout fails; existing subscribers keep access." />
          </div>

          <div className="ops-row-label">Last 7 days</div>
          <div className="ops-four">
            <Counter value={data.errors?.last24h} label="Server errors, 24 h" tone={data.errors?.last24h ? 'warn' : ''} help="Requests the backend could not complete. A few a day is normal; a climbing number is a bug." />
            <Counter value={data.errors?.last7d} label="Server errors, 7 d" tone={data.errors?.last7d ? 'warn' : ''} help="Same over the week. Compare with 24 h to see whether a problem is new." />
            <Counter value={data.safeguarding?.flaggedLast7d} label="Safeguarding flags" tone={data.safeguarding?.flaggedLast7d ? 'alert' : ''} help="Advisor messages that matched the risk screen. Each needs a human to read it." />
            <Counter value={data.problemReportsLast7d} label="Problem reports" help="Sent by users from the Report a problem link, including automatic crash reports." />
          </div>

          <div className="ops-two">
            <div className="ops-card">
              <div className="ops-row-label">Server <span>the backend process on Render</span></div>
              <table className="ops-kv">
                <tbody>
                  <tr><th>Environment</th><td>{data.service?.env}</td></tr>
                  <tr><th>Running for</th><td>{uptimeText(data.service?.uptimeSeconds)}</td></tr>
                  <tr><th>Node</th><td>{data.service?.nodeVersion}</td></tr>
                  <tr><th>Build</th><td className="ops-mono">{data.service?.commit || 'local'}</td></tr>
                  <tr><th>Stripe webhook secret</th><td><span className={`ops-pill ${data.config?.stripeWebhookSecret ? 'ok' : 'alert'}`}>{data.config?.stripeWebhookSecret ? 'set' : 'missing'}</span></td></tr>
                  <tr><th>Safeguarding alerts</th><td><span className={`ops-pill ${data.config?.safeguardingAlerts ? 'ok' : 'warn'}`}>{data.config?.safeguardingAlerts ? 'on' : 'off'}</span></td></tr>
                </tbody>
              </table>
              <p className="ops-help">
                "Running for" resets on every deploy or crash; a short time you did not expect means it restarted on its own.
                {!data.config?.safeguardingAlerts ? ' Alerts turn on when SAFEGUARDING_ALERT_EMAIL and RESEND_API_KEY are set on the server.' : ''}
              </p>
            </div>

            <div className="ops-card">
              <div className="ops-row-label">Backups</div>
              <table className="ops-kv">
                <tbody>
                  <tr><th>Automatic</th><td>Supabase, daily, 7 kept</td></tr>
                  <tr><th>Point-in-time recovery</th><td><span className="ops-pill warn">off</span></td></tr>
                  <tr><th>Last manual backup</th><td>{fmt(data.backups?.lastManualBackup?.value)}</td></tr>
                </tbody>
              </table>
              <button type="button" className="ops-small-button" onClick={recordBackup} disabled={saving}>
                {saving ? 'Saving...' : 'I took a backup today'}
              </button>
              <p className="ops-help">Supabase keeps a daily copy. A manual dump is your own copy held off Supabase, in case of account problems; the runbook says how to take one.</p>
            </div>
          </div>

          <div className="ops-card ops-block">
            <div className="ops-row-label">Recent server errors <span>{errors.length ? `${errors.length} most recent` : 'none recorded'}</span></div>
            {errors.length ? (
              <>
                <p className="ops-help">One row per failed request. Route is the part of the app that failed, Code is the app's short name for the error, Message is the detail.</p>
                <div className="admin-table-wrap">
                  <table className="admin-table ops-table">
                    <thead><tr><th>When</th><th>Route</th><th>Status</th><th>Code</th><th>Message</th></tr></thead>
                    <tbody>
                      {visibleErrors.map((e) => (
                        <tr key={e.id}>
                          <td>{fmt(e.created_at)}</td>
                          <td className="ops-mono">{e.method} {e.route}</td>
                          <td>{e.status}</td>
                          <td className="ops-mono">{e.code || ''}</td>
                          <td className="ops-message">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {errors.length > 10 ? (
                    <button type="button" className="ops-link-button" onClick={() => setShowAllErrors((v) => !v)}>
                      {showAllErrors ? 'Show fewer' : `Show all ${errors.length}`}
                    </button>
                  ) : null}
                </div>
              </>
            ) : <p className="ops-help">No failed requests recorded. When one happens it appears here with the route, a short code and the detail.</p>}
          </div>

          <div className="ops-two">
            <div className="ops-card">
              <div className="ops-row-label">Stripe events <span>last 20</span></div>
              {(data.stripeEvents || []).length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table ops-table">
                    <thead><tr><th>When</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                      {data.stripeEvents.map((ev) => (
                        <tr key={ev.id}>
                          <td>{fmt(ev.created_at)}</td>
                          <td className="ops-mono">{ev.type}</td>
                          <td><span className={`ops-pill ${ev.status === 'processed' ? 'ok' : ev.status === 'failed' ? 'alert' : 'warn'}`}>{ev.status || 'processed'}</span>{ev.error ? <small className="ops-error-note">{ev.error}</small> : null}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="ops-help">No events yet.</p>}
              <p className="ops-help">Every payment, renewal or cancellation Stripe tells us about. Processed means the plan was updated; failed means it was not and needs a look.</p>
            </div>

            <div className="ops-card">
              <div className="ops-row-label">Safeguarding flags <span>last 20</span></div>
              {(data.safeguarding?.recent || []).length ? (
                <div className="ops-flag-list">
                  {data.safeguarding.recent.map((m) => (
                    <article className="ops-flag-card" key={m.id}>
                      <div className="ops-flag-meta">
                        <span className="ops-pill alert">{m.flag_reason || 'risk'}</span>
                        <span>{fmt(m.created_at)}</span>
                        <span className="ops-mono">user {String(m.user_id || '').slice(0, 8)}</span>
                      </div>
                      <p>{m.content}</p>
                    </article>
                  ))}
                </div>
              ) : <p className="ops-help">No flagged messages.</p>}
              <p className="ops-help">Advisor messages where a student may be at risk. The student was shown helplines; the named lead should read each one and record what was done.</p>
            </div>
          </div>
        </>
      ) : (!loading && !error ? <p className="admin-empty">No data.</p> : null)}
    </section>
  );
}
