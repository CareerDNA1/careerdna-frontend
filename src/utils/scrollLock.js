// Page scroll lock that works on touch devices.
//
// Setting overflow:hidden on <body> stops wheel scrolling on desktop but iOS
// Safari and Android Chrome ignore it for touch, so the page behind a modal
// keeps panning under the finger. The technique that works everywhere is to pin
// <body> with position:fixed at the current scroll offset while the modal is
// open, then restore the offset when it closes so the page does not jump.
//
// Reference counted, so nested dialogs (a report card opened from favourites)
// keep the page locked until the last one closes.

let depth = 0;
let savedScrollY = 0;
let savedStyles = null;

export function lockPageScroll() {
  depth += 1;
  if (depth > 1) return;
  if (typeof window === 'undefined' || !document.body) return;

  savedScrollY = window.scrollY || window.pageYOffset || 0;
  const b = document.body.style;
  savedStyles = { position: b.position, top: b.top, left: b.left, right: b.right, width: b.width, overflow: b.overflow };

  b.position = 'fixed';
  b.top = `-${savedScrollY}px`;
  b.left = '0';
  b.right = '0';
  b.width = '100%';
  b.overflow = 'hidden';
  document.documentElement.classList.add('cdna-scroll-locked');
}

export function unlockPageScroll() {
  if (depth === 0) return;
  depth -= 1;
  if (depth > 0) return;
  if (typeof window === 'undefined' || !document.body) return;

  const b = document.body.style;
  const s = savedStyles || {};
  b.position = s.position || '';
  b.top = s.top || '';
  b.left = s.left || '';
  b.right = s.right || '';
  b.width = s.width || '';
  b.overflow = s.overflow || '';
  document.documentElement.classList.remove('cdna-scroll-locked');
  savedStyles = null;
  window.scrollTo(0, savedScrollY);
}

export function isPageScrollLocked() {
  return depth > 0;
}
