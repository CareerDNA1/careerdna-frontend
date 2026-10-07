import { useEffect } from 'react';

// Keyboard accessibility for every modal in the app, in one place.
//
// Any element with role="dialog" and aria-modal="true" is treated as an open
// modal. While one is open: focus moves into it when it appears, Tab and
// Shift+Tab cycle only through its controls, and when it closes focus returns
// to the element that opened it. Mouse users notice nothing.

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',');

function isVisible(el) {
  if (!el || !(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  if (style.visibility === 'hidden' || style.display === 'none') return false;
  return el.getClientRects().length > 0;
}

function focusables(root) {
  return Array.from(root.querySelectorAll(FOCUSABLE)).filter(isVisible);
}

function openDialogs() {
  return Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).filter(isVisible);
}

export default function GlobalFocusTrap() {
  useEffect(() => {
    let current = null;        // topmost dialog element
    let opener = null;         // element focused before the dialog opened

    const sync = () => {
      const dialogs = openDialogs();
      const top = dialogs[dialogs.length - 1] || null;
      if (top === current) return;

      if (top && !current) {
        opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      }
      current = top;

      if (current) {
        if (!current.hasAttribute('tabindex')) current.setAttribute('tabindex', '-1');
        // Let the dialog paint, then move focus inside it.
        window.setTimeout(() => {
          if (!current || current.contains(document.activeElement)) return;
          const first = focusables(current).find((el) => !el.matches('[aria-label="Close"], .modal-close, [class*="close"]')) || focusables(current)[0];
          (first || current).focus({ preventScroll: true });
        }, 0);
      } else if (opener && document.contains(opener)) {
        const toRestore = opener;
        opener = null;
        window.setTimeout(() => { try { toRestore.focus({ preventScroll: true }); } catch (_) { /* ignore */ } }, 0);
      }
    };

    const onKeyDown = (e) => {
      if (e.key !== 'Tab' || !current) return;
      const items = focusables(current);
      if (!items.length) { e.preventDefault(); current.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!current.contains(active)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };

    const onFocusIn = (e) => {
      // Focus escaped the dialog (for example via mouse click outside): pull it back.
      if (current && e.target instanceof Node && !current.contains(e.target)) {
        const items = focusables(current);
        (items[0] || current).focus({ preventScroll: true });
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['role', 'aria-modal', 'style', 'class', 'hidden'] });
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, []);

  return null;
}
