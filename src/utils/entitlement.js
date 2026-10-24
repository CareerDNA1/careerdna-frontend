import { apiFetch } from './apiFetch';

// The one place allowances come from. The backend works out plan allowance,
// bought extras, used and remaining for reports and advisor questions
// (buildEntitlementView in careerdna-backend/index.js), and enforces the same
// numbers when a report is generated or a question is asked. Pages display
// these; they never add the columns up themselves.
//
// Returns { reports: {used, plan, extra, total, remaining, unlimited},
//           advisor: {used, plan, extra, total, remaining, unlimited},
//           plan, raw }
export async function fetchEntitlement() {
  const data = await apiFetch('/api/account/entitlement', { timeoutMs: 20000 });
  const e = data?.entitlement || {};
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const reportsUnlimited = Boolean(e.unlimited);
  const advisorUnlimited = Boolean(e.advisorUnlimited);
  return {
    plan: String(e.plan || 'free').toLowerCase(),
    reports: {
      unlimited: reportsUnlimited,
      used: num(e.reportsUsed),
      plan: num(e.reportLimit),
      extra: num(e.extraReports),
      total: num(e.reportLimit) + num(e.extraReports),
      remaining: reportsUnlimited ? null : num(e.reportsRemaining),
    },
    advisor: {
      unlimited: advisorUnlimited,
      used: num(e.advisorQuestionsUsed),
      plan: num(e.advisorQuestionsLimit),
      extra: num(e.advisorExtraQuestions),
      total: num(e.advisorQuestionsTotal),
      remaining: advisorUnlimited ? null : num(e.advisorQuestionsRemaining),
    },
    raw: e,
  };
}
