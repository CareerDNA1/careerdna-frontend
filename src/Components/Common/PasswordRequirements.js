import React from 'react';
import { getPasswordChecks } from '../../utils/passwordRules';

// Live checklist shown under a password field while the password is still
// missing one of the rules. Renders nothing before typing starts and nothing
// once every rule passes.
export default function PasswordRequirements({ password }) {
  if (!password) return null;
  const checks = getPasswordChecks(password);
  if (checks.every((rule) => rule.passed)) return null;

  return (
    <div style={styles.wrapper} aria-live="polite">
      <p style={styles.intro}>Password requirements</p>
      <div style={styles.grid}>
        {checks.map((rule) => (
          <span key={rule.id} style={{ ...styles.rule, ...(rule.passed ? styles.rulePassed : styles.rulePending) }}>
            <span style={styles.icon}>{rule.passed ? '✓' : '○'}</span>
            {rule.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { marginTop: '8px', padding: '12px 14px', borderRadius: '16px', background: '#f8fbff', border: '1px solid #dce8ff' },
  intro: { margin: '0 0 8px', fontSize: '0.78rem', fontWeight: 700, color: '#40516b' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '7px 10px' },
  rule: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', lineHeight: 1.35, transition: 'color 0.15s ease' },
  rulePending: { color: '#5e6f88' },
  rulePassed: { color: '#166534', fontWeight: 700 },
  icon: { width: '16px', display: 'inline-flex', justifyContent: 'center', fontWeight: 900 },
};
