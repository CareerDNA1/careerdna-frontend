import React, { useEffect } from 'react';
import { describeChildren, CHILD_TYPE_LABELS } from '../../utils/favouriteCascade';
import './CascadeRemoveModal.css';

// Shown right after a student unlikes a career world or pathway that still has
// favourites saved under it. Two choices only: remove them too, or keep them.
export default function CascadeRemoveModal({ parent, items, busy = false, onRemove, onKeep }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onKeep(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onKeep]);

  const children = Array.isArray(items) ? items : [];
  if (!parent || !children.length) return null;
  const what = describeChildren(children);
  const kind = parent.type === 'career_world' ? 'career world' : parent.type === 'subject' ? 'degree' : 'pathway';

  return (
    <div className="cascade-overlay" role="dialog" aria-modal="true" aria-label="Remove saved items too?"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onKeep(); }}>
      <div className="cascade-box">
        <div className="cascade-title">Also remove what you saved under it?</div>
        <p className="cascade-text">
          You have {what} saved under the {kind} <strong>{parent.title}</strong>. Remove them from your favourites as well, or keep them?
        </p>
        <ul className="cascade-list">
          {children.slice(0, 6).map((c) => {
            const label = (CHILD_TYPE_LABELS[c.item_type] || ['item'])[0];
            const kindLabel = label.charAt(0).toUpperCase() + label.slice(1);
            return (
              <li key={c.id}>
                <span className="cascade-item-title">{c.item_title}</span>
                <span className="cascade-item-kind">{kindLabel}{c.subtitle ? `, ${c.subtitle}` : ''}</span>
              </li>
            );
          })}
          {children.length > 6 ? <li className="cascade-more">and {children.length - 6} more</li> : null}
        </ul>
        <div className="cascade-actions">
          <button type="button" className="cascade-btn cascade-btn--primary" onClick={onRemove} disabled={busy}>
            {busy ? 'Removing…' : 'Remove them too'}
          </button>
          <button type="button" className="cascade-btn" onClick={onKeep} disabled={busy}>
            Keep them
          </button>
        </div>
      </div>
    </div>
  );
}
