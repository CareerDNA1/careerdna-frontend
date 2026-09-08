import React from 'react';
import './AuthPage.css';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('CareerDNA app error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="auth-page">
          <div className="auth-page-shell">
            <section className="auth-card" aria-labelledby="error-boundary-title">
              <header className="auth-header">
                <h1 id="error-boundary-title" className="auth-title">Something went wrong</h1>
                <p className="auth-subtitle">
                  Please refresh the page. If this keeps happening, contact hello@mycareerdna.io.
                </p>
              </header>
              <button className="auth-button" type="button" onClick={() => window.location.reload()}>
                Refresh page
              </button>
            </section>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
