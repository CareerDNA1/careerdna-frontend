const rawConfiguredBase =
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3001'
    : 'https://careerdna-backend.onrender.com');

export const BACKEND_URL = String(rawConfiguredBase || '').trim().replace(/\/$/, '');

export function buildApiCandidates(path = '') {
  const normalizedPath = String(path || '').startsWith('/') ? String(path) : `/${String(path || '')}`;
  const candidates = [];

  if (BACKEND_URL) {
    candidates.push(`${BACKEND_URL}${normalizedPath}`);
  }

  candidates.push(normalizedPath);

  if (typeof window !== 'undefined') {
    const currentOrigin = window.location?.origin || '';
    if (/localhost:3000$/i.test(currentOrigin)) {
      candidates.push(`http://localhost:3001${normalizedPath}`);
    }
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}
