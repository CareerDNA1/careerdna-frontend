// Highlights CareerDNA terms in Advisor replies: career worlds, pathways,
// traits and Career Profiles become bold green when written with capitals
// (case-sensitive, so "data science" in passing is left alone). One-word
// terms at the very start of a sentence are skipped, because there the
// capital letter tells us nothing ("Resilience matters because...").
import { CAREER_WORLD_DEFINITIONS, PATHWAY_DEFINITIONS } from './selectionDefinitions';
import SUBDIMENSION_DEFINITIONS from './subdimensionDefinitions';
import { ARCHETYPE_DEFINITIONS } from './archetypeDefinitions';
import { TRAIT_RENAMES } from './traitNames';

let cached = null;

function buildMatcher() {
  const terms = new Set();
  const add = (t) => {
    const s = String(t || '').trim();
    if (s.length < 4) return;
    terms.add(s);
    if (s.includes('&')) terms.add(s.replace(/\s*&\s*/g, ' and '));
  };
  Object.values(CAREER_WORLD_DEFINITIONS || {}).forEach((w) => add(w?.title));
  Object.values(PATHWAY_DEFINITIONS || {}).forEach((p) => { add(p?.title); add(p?.careerWorldTitle); });
  Object.keys(SUBDIMENSION_DEFINITIONS || {}).forEach(add);
  Object.keys(TRAIT_RENAMES || {}).forEach(add);
  Object.keys(ARCHETYPE_DEFINITIONS || {}).forEach(add);
  const list = [...terms].sort((a, b) => b.length - a.length)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!list.length) return null;
  return new RegExp(`(?<![A-Za-z0-9])(${list.join('|')})(?![A-Za-z0-9])`, 'g');
}

function getMatcher() {
  if (cached === null) cached = buildMatcher() || false;
  return cached || null;
}

const SKIP = new Set(['A', 'CODE', 'PRE', 'STRONG', 'B', 'H1', 'H2', 'H3', 'BUTTON']);

export function highlightAdvisorTerms(html) {
  const re = getMatcher();
  if (!re || typeof window === 'undefined' || !window.DOMParser || !html) return html;
  const doc = new window.DOMParser().parseFromString(`<div id="cdna-root">${html}</div>`, 'text/html');
  const root = doc.getElementById('cdna-root');
  if (!root) return html;

  // Bold text the model already wrote: colour it green when it is a term.
  root.querySelectorAll('strong, b').forEach((el) => {
    const t = (el.textContent || '').trim();
    re.lastIndex = 0;
    const m = re.exec(t);
    if (m && m[0] === t) el.classList.add('cdna-term');
  });

  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    let p = node.parentNode;
    while (p && p !== root) { if (SKIP.has(p.nodeName)) return; p = p.parentNode; }
    const text = node.nodeValue || '';
    re.lastIndex = 0;
    if (!re.test(text)) return;
    re.lastIndex = 0;
    const frag = doc.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = re.exec(text))) {
      const term = m[0];
      const before = text.slice(0, m.index);
      const sentenceStart = !/\S/.test(before) ? node.previousSibling == null : /[.!?:]\s*$/.test(before);
      if (!term.includes(' ') && sentenceStart) continue;
      frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
      const strong = doc.createElement('strong');
      strong.className = 'cdna-term';
      strong.textContent = term;
      frag.appendChild(strong);
      last = m.index + term.length;
    }
    if (last === 0) return;
    frag.appendChild(doc.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  });
  return root.innerHTML;
}

export default highlightAdvisorTerms;
