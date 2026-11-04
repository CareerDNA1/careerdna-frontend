// Environment names lost their hyphens on 4 Nov 2026 (e.g. "Customer- and
// public-facing" became "Customer and public facing"). Reports saved before
// that keep the old names inside their stored analysis, so a saved report is
// shown with the current names. Ids never changed; only the display titles.
export const ENV_RENAMES = Object.freeze({
  'Structured and process-driven': 'Structured and process driven',
  'Fast-paced and high-pressure': 'Fast paced and high pressure',
  'Target-driven and competitive': 'Target driven and competitive',
  'Customer- and public-facing': 'Customer and public facing',
  'Mission-led and public-service': 'Mission led and public service',
  'Research and deep-thinking': 'Research and deep thinking',
  'Safety-critical and highly regulated': 'Safety critical and highly regulated',
  'Hands-on, workshop and site': 'Hands on, workshop and site',
  'Start-up and fast-changing': 'Startup and fast changing',
  'Change and transformation-focused': 'Change and transformation focused',
  'Independent and self-directed (incl. remote and freelance)': 'Independent and self directed (including remote and freelance)',
  'Learning and development-rich': 'Learning and development rich',
});

const cache = new WeakMap();

// Returns a copy of `meta` with any old environment title (an exact string
// value) replaced by its current name. Other text is left untouched.
export function withCurrentEnvNames(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  if (cache.has(meta)) return cache.get(meta);
  const walk = (v) => {
    if (typeof v === 'string') return Object.prototype.hasOwnProperty.call(ENV_RENAMES, v) ? ENV_RENAMES[v] : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const out = {};
      Object.keys(v).forEach((k) => { out[k] = walk(v[k]); });
      return out;
    }
    return v;
  };
  const out = walk(meta);
  cache.set(meta, out);
  return out;
}
