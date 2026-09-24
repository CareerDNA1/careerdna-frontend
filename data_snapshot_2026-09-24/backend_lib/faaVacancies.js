// CareerDNA — live apprenticeship vacancies via the DfE "Display Advert API" (v2).
//
// The API is server-side only (no CORS) and rate-limited to 150 req / 5 min, so we
// fetch on demand and cache each standard's result in memory for a few hours. The
// frontend never calls DfE directly — it hits our /api/nonuni/vacancies/:lars route.
//
// Key is read from the environment (FAA_DISPLAY_API_KEY) — never hard-coded.

const { POSTCODE_CITY } = require("./gradJobs");

const API_BASE = "https://api.apprenticeships.education.gov.uk/vacancies";
const API_KEY = process.env.FAA_DISPLAY_API_KEY || "";
const TTL_MS = Number(process.env.FAA_CACHE_TTL_MS || 6 * 60 * 60 * 1000); // 6h
const NEG_TTL_MS = 15 * 60 * 1000; // cache failures/empties briefly (15m)
const REQ_TIMEOUT_MS = 8000;

const cache = new Map(); // larsCode -> { at, data }

// Build the public "See openings" search link. The keyword is often a full
// standard name that includes an option in parentheses (e.g. "Creative industries
// production technician (creative venue technician)"). Find an Apprenticeship
// resolves that to the option-level filter, which frequently shows 0 even when the
// parent standard has live adverts. So we search on the base standard name only:
// drop any "(...)" option, a trailing "apprenticeship", and any "(L3)" level tag.
function cleanSearchKeyword(keyword) {
  return String(keyword || "")
    .replace(/\([^)]*\)/g, " ")          // remove parenthetical options / level tags
    .replace(/\bapprenticeship\b/gi, " ") // "apprenticeship" adds nothing to the search
    .replace(/\s+/g, " ")
    .trim();
}

function publicSearchUrl(keyword) {
  const q = encodeURIComponent(cleanSearchKeyword(keyword));
  return `https://www.findapprenticeship.service.gov.uk/apprenticeships?searchTerm=${q}`;
}

// Address lines that look like a street / building rather than a town.
const STREET_RE = /\b(road|rd|street|st|lane|ln|avenue|ave|close|drive|dr|way|court|ct|place|pl|square|sq|hill|park|estate|industrial|unit|floor|house|building|suite|block|business)\b/i;

// Title-case an ALL-CAPS value ("WOODWARD ROAD" -> "Woodward Road"); leave
// already-mixed-case values alone.
function titleCaseLoc(s) {
  const str = String(s || "").trim();
  const letters = str.replace(/[^A-Za-z]/g, "");
  const allCaps = letters.length > 0 && letters === letters.toUpperCase();
  if (!allCaps) return str;
  return str.toLowerCase().replace(/\b([a-z])/g, (c) => c.toUpperCase());
}

// Pick the best "town" from a DfE address. The town is inconsistent across the
// address lines, so: prefer a line that does NOT look like a street/building;
// if every line is a street, fall back to the post town for the postcode area.
function townFromAddress(addr) {
  if (!addr) return null;
  const lines = [addr.addressLine4, addr.addressLine3, addr.addressLine2, addr.addressLine1]
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  let town = lines.find((l) => !STREET_RE.test(l) && !/^\d/.test(l));
  if (!town && addr.postcode) {
    const area = String(addr.postcode).trim().toUpperCase().match(/^([A-Z]{1,2})/);
    if (area && POSTCODE_CITY[area[1]]) town = POSTCODE_CITY[area[1]];
  }
  if (!town) town = lines[0] || null;
  return town ? titleCaseLoc(town) : null;
}

function mapVacancy(v) {
  const addr = Array.isArray(v.addresses) && v.addresses[0] ? v.addresses[0] : null;
  const location = v.isNationalVacancy ? "Multiple locations" : townFromAddress(addr);
  return {
    title: v.title || null,
    employer: v.employerName || null,
    location,
    closingDate: v.closingDate || null,
    startDate: v.startDate || null,
    wage: v.wage && (v.wage.wageAdditionalInformation || v.wage.wageType) ? v.wage : null,
    level: v.apprenticeshipLevel || null,
    url: v.vacancyUrl || v.applicationUrl || null,
    reference: v.vacancyReference || null,
  };
}

// Fetch live vacancies for one standard (by LARS code). Returns
// { count, vacancies:[...], searchUrl, cached, stale, error? }.
async function getVacanciesForLars(larsCode, { keyword = "", pageSize = 100 } = {}) {
  const lars = String(larsCode || "").trim();
  if (!lars) return { count: 0, vacancies: [], searchUrl: publicSearchUrl(keyword), error: "NO_LARS" };

  const now = Date.now();
  const hit = cache.get(lars);
  if (hit && now - hit.at < (hit.data.error ? NEG_TTL_MS : TTL_MS)) {
    return { ...hit.data, cached: true };
  }

  if (!API_KEY) {
    const data = { count: null, vacancies: [], searchUrl: publicSearchUrl(keyword), error: "NO_API_KEY" };
    return data; // don't cache config errors
  }

  const url =
    `${API_BASE}/vacancy?StandardLarsCode=${encodeURIComponent(lars)}` +
    `&PageSize=${pageSize}&PageNumber=1&Sort=AgeDesc`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQ_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": API_KEY,
        "X-Version": "2",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!resp.ok) {
      const data = {
        count: null,
        vacancies: [],
        searchUrl: publicSearchUrl(keyword),
        error: `HTTP_${resp.status}`,
      };
      cache.set(lars, { at: now, data });
      return data;
    }
    const json = await resp.json();
    const vacancies = Array.isArray(json.vacancies) ? json.vacancies.map(mapVacancy) : [];
    // NOTE: json.total is the service-wide total (all standards), not the count
    // filtered to this StandardLarsCode, so it is NOT the per-standard count. The
    // filtered results come back in json.vacancies, so count those. We fetch a
    // large page (up to 100) so the count is accurate for all but the busiest
    // standards; when we hit the page cap we flag it so the UI can show "100+".
    const data = {
      count: vacancies.length,
      countCapped: vacancies.length >= pageSize,
      vacancies,
      searchUrl: publicSearchUrl(keyword),
    };
    cache.set(lars, { at: now, data });
    return data;
  } catch (err) {
    const data = {
      count: null,
      vacancies: [],
      searchUrl: publicSearchUrl(keyword),
      error: err.name === "AbortError" ? "TIMEOUT" : "FETCH_FAILED",
    };
    // serve last good data if we have any, marked stale
    if (hit && !hit.data.error) return { ...hit.data, cached: true, stale: true };
    cache.set(lars, { at: now, data });
    return data;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { getVacanciesForLars, publicSearchUrl, hasApiKey: () => !!API_KEY };
