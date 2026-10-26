// Employer and organisation names arrive from the government's Find an
// Apprenticeship service (and older saved adverts) with every word capitalised,
// which breaks acronyms: "Thales Uk Limited", "British Airways (Ba) Limited",
// "Awe Plc". This restores the usual capitals. The backend applies the same
// rule to new adverts (careerdna-backend/src/faaVacancies.js); this covers
// adverts and applications saved before that.

const ACRONYMS = new Set([
  'UK', 'GB', 'EU', 'USA', 'PLC', 'LLP', 'LLC', 'CIC', 'NHS', 'BBC', 'ITV', 'BT', 'BP', 'BA', 'BAE', 'AWE', 'GSK',
  'HSBC', 'KPMG', 'EY', 'IBM', 'HMRC', 'DWP', 'MOD', 'MOJ', 'DVLA', 'RAF', 'EDF', 'SSE', 'JLR', 'MBDA', 'AECOM',
  'WSP', 'DHL', 'UPS', 'TUI', 'JCB', 'AA', 'RAC', 'RBS', 'TSB', 'HMP', 'ONS', 'DFE', 'DFT', 'DHSC', 'HM',
  'NHSBT', 'GCHQ', 'MI5', 'MI6', 'UKHSA', 'CGI', 'SAP',
]);
const MIXED = { PWC: 'PwC', TFL: 'TfL', LTD: 'Ltd', QINETIQ: 'QinetiQ', EASYJET: 'easyJet', IPHONE: 'iPhone' };

export function tidyOrgName(name) {
  const s = String(name || '').trim();
  if (!s) return s;
  return s.replace(/[A-Za-z][A-Za-z0-9&']*/g, (word) => {
    const up = word.toUpperCase();
    if (MIXED[up]) return MIXED[up];
    if (ACRONYMS.has(up)) return up;
    return word;
  });
}
