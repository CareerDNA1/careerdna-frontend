// src/utils/fetchAiSummary.js
import { buildApiCandidates } from './config';
import { supabase } from './supabaseClient';

function normalizeStatus(raw) {
  const s = String(raw || '').trim().toLowerCase();
  if (['school', 'undergraduate', 'postgraduate'].includes(s)) return s;
  if (['gcse','a-level','alevel','sixth form','sixth-form'].includes(s)) return 'school';
  if (['undergrad','ug'].includes(s)) return 'undergraduate';
  if (['postgrad','pg','masters','master','msc','mba'].includes(s)) return 'postgraduate';
  return '';
}

// Backend expects one of: '13-15','16-18','19-21','22-24','25+'
function mapAgeToRange(age) {
  if (!age && age !== 0) return undefined;
  const s = String(age).trim();
  const valid = ['13-15','16-18','19-21','22-24','25+'];
  if (valid.includes(s)) return s;          // already a range

  const n = Number(s);
  if (!Number.isFinite(n)) return undefined;
  if (n <= 15) return '13-15';
  if (n <= 18) return '16-18';
  if (n <= 21) return '19-21';
  if (n <= 24) return '22-24';
  return '25+';
}

function coerceArray(x) {
  if (!x) return [];
  if (Array.isArray(x)) return x.filter(Boolean).map(String);
  return String(x).split(',').map(v => v.trim()).filter(Boolean);
}

/**
 * Backward-compatible API:
 *  - New: { archetypes, age, status, schoolSubjects?, uniSubject?, subdimensionScores?, subdimensions? }
 *  - Old: { archetypes, introResponses: { age, status, schoolSubjects?, uniSubject? } }
 *
 * Notes:
 *  - subdimensionScores: array of rows from the frontend scorer
 *    [{ code, name, score_pct, n_items, ...optional fields }]
 *  - subdimensions: alias; if present we prefer it (lets you pass pre-shaped data)
 */
export async function fetchAiSummary(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('fetchAiSummary: input must be an object.');
  }

  let {
    archetypes,
    age,
    status,
    schoolSubjects,
    uniSubject,
    planUniversity,
    uniNeed,
    introResponses,
    subdimensionScores,   // NEW
    subdimensions         // NEW (alias / pre-shaped)
  } = input;

  // Merge old shape if provided
  if (introResponses && typeof introResponses === 'object') {
    age = age ?? introResponses.age;
    status = status ?? introResponses.status;
    schoolSubjects = schoolSubjects ?? introResponses.schoolSubjects;
    uniSubject = uniSubject ?? introResponses.uniSubject;
    planUniversity = planUniversity ?? introResponses.planUniversity;
    uniNeed = uniNeed ?? introResponses.uniNeed;
  }

  const normStatus = normalizeStatus(status);

  // Infer status if missing (keeps you from tripping the backend in most cases)
  let finalStatus = normStatus;
  if (!finalStatus) {
    const mapped = mapAgeToRange(age);
    if (mapped && (mapped === '13-15' || mapped === '16-18')) {
      finalStatus = 'school';
    } else if (mapped) {
      finalStatus = 'undergraduate';
    }
  }

  const ageRange = mapAgeToRange(age);

  // Build subdimensions payload (sanitized).
  // Prefer `subdimensions` if caller already shaped it;
  // otherwise derive from `subdimensionScores`.
  const sanitizeRow = (r) => {
    if (!r || typeof r !== 'object') return null;
    const row = {
      code: String(r.code || r.name || '').trim() || undefined,
      name: String(r.name || r.code || '').trim() || undefined,
      score_pct: Number.isFinite(Number(r.score_pct)) ? Number(r.score_pct) : undefined,
      n_items: Number.isFinite(Number(r.n_items)) ? Number(r.n_items) : undefined,
      // If you later add dimension/archetype on the FE, they’ll pass through safely below
    };
    // Keep optional fields if present (dimension, archetype, etc.)
    if (r.dimension) row.dimension = String(r.dimension);
    if (r.archetype) row.archetype = String(r.archetype);
    return (row.code && row.name && Number.isFinite(row.score_pct)) ? row : null;
  };

  const subdimsArray = Array.isArray(subdimensions)
    ? subdimensions
    : (Array.isArray(subdimensionScores) ? subdimensionScores : []);

  const subdimsPayload = subdimsArray
    .map(sanitizeRow)
    .filter(Boolean);

  // Build payload exactly as backend expects
  const payload = {
    archetypes: archetypes || {},
    status: finalStatus || undefined,     // must be one of: 'school','undergraduate','postgraduate'
    age: ageRange || undefined,           // must be one of the 5 ranges if provided
    ...(finalStatus === 'school'
      ? { schoolSubjects: coerceArray(schoolSubjects) }
      : { uniSubject: typeof uniSubject === 'string'
          ? uniSubject.trim()
          : (Array.isArray(uniSubject) ? String(uniSubject[0] || '').trim() : '') }),
    // NEW: forward subdimension scores (empty array is fine; backend can ignore)
    subdimensions: subdimsPayload,
    // Uni-intent — lets the backend narrate the vocational ("no degree") worlds
    // for students who are unsure about / not planning university.
    ...(planUniversity ? { planUniversity: String(planUniversity) } : {}),
    ...(uniNeed ? { uniNeed: String(uniNeed) } : {}),
  };

  // Client-side guard to avoid 400s:
  if (!payload.status) {
    throw new Error('Status is required (school | undergraduate | postgraduate).');
  }
  if (payload.status !== 'school' && !payload.uniSubject) {
    throw new Error('For non-school users, a non-empty uniSubject is required.');
  }

  // Strip undefined keys
  Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (sessionError) {
    throw new Error(sessionError.message || 'Could not verify your login session.');
  }

  if (!accessToken) {
    throw new Error('Please sign in again before generating your report.');
  }

  const candidates = buildApiCandidates('/api/summary');
  let lastError = null;

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 404) {
        lastError = new Error('Request failed: 404');
        continue;
      }

      if (!res.ok) {
        let msg = `Request failed: ${res.status}`;
        try {
          const err = await res.json();
          const errorCode = err?.code || err?.error || '';

          if (res.status === 403 && errorCode === 'REPORT_LIMIT_REACHED') {
            const apiError = new Error('REPORT_LIMIT_REACHED');
            apiError.status = 403;
            apiError.code = 'REPORT_LIMIT_REACHED';
            apiError.entitlement = err?.entitlement || null;
            throw apiError;
          }

          msg = err?.summary || err?.message || err?.error || msg;
          const apiError = new Error(msg);
          apiError.status = res.status;
          apiError.code = errorCode;
          apiError.entitlement = err?.entitlement || null;
          throw apiError;
        } catch (parseError) {
          if (parseError?.status) throw parseError;
        }
        throw new Error(msg);
      }

      const data = await res.json();
      return data || { summary: '' };
    } catch (error) {
      if (error?.status && error.status !== 404) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError || new Error('Could not generate summary right now.');
}

