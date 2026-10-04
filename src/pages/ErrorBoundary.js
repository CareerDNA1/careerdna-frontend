import React from 'react';
import ReportProblemModal from '../Components/Common/ReportProblemModal';
import { reportProblem } from '../utils/reportProblem';
import './AuthPage.css';

// Last line of defence: if a page crashes, show a calm card, log the crash to
// the team automatically (page, error, stack, browser) and let the student add
// what they were doing through the normal Report a problem popup. No email
// addresses: reports land in the admin panel like every other report.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, reportOpen: false, logged: false, detail: '' };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('CareerDNA app error:', error, info);
    const detail = [
      `[Automatic crash report]`,
      `Page: ${typeof window !== 'undefined' ? window.location.href : ''}`,
      `Error: ${error?.message || String(error)}`,
      `Where: ${String(info?.componentStack || '').trim().split('\n').slice(0, 6).join(' > ').replace(/\s+/g, ' ')}`,
      `Stack: ${String(error?.stack || '').split('\n').slice(0, 4).join(' | ')}`,
      `Browser: ${typeof navigator !== 'undefined' ? navigator.userAgent : ''}`,
      `Screen: ${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : ''}`,
    ].join('\n');
    this.setState({ detail });
    reportProblem({ message: detail.slice(0, 1900) })
      .then(() => this.setState({ logged: true }))
      .catch(() => { /* the card still offers a manual report */ });
  }

  render() {
    if (this.state.hasError) {
      const { reportOpen, logged, detail } = this.state;
      return (
        <main className="auth-page">
          <div className="auth-page-shell">
            <section className="auth-card" aria-labelledby="error-boundary-title">
              <header className="auth-header">
                <h1 id="error-boundary-title" className="auth-title">Something went wrong</h1>
                <p className="auth-subtitle">
                  {logged
                    ? 'This page hit an error and we have logged it automatically. Refreshing usually fixes it. If you can spare a moment, tell us what you were doing so we can fix it faster.'
                    : 'This page hit an error. Refreshing usually fixes it. If you can spare a moment, tell us what you were doing so we can fix it.'}
                </p>
              </header>
              <button className="auth-button" type="button" onClick={() => window.location.reload()}>
                Refresh page
              </button>
              <button
                className="auth-button auth-button--ghost"
                type="button"
                style={{ marginTop: 10, background: 'transparent', color: '#2f6fed', border: '1px solid #d6e3ff' }}
                onClick={() => this.setState({ reportOpen: true })}
              >
                Tell us what happened
              </button>
            </section>
          </div>
          {reportOpen ? (
            <ReportProblemModal
              onClose={() => this.setState({ reportOpen: false })}
              prefix={`[Crash follow-up]\n${detail.split('\n').slice(1, 3).join('\n')}\n\nWhat I was doing: `}
            />
          ) : null}
        </main>
      );
    }

    return this.props.children;
  }
}
