// One definition of what a CareerDNA password must contain, shared by signup,
// password reset and the PasswordRequirements checklist.
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (value) => String(value || '').length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(String(value || '')) },
  { id: 'lowercase', label: 'One lowercase letter', test: (value) => /[a-z]/.test(String(value || '')) },
  { id: 'number', label: 'One number', test: (value) => /\d/.test(String(value || '')) },
  { id: 'symbol', label: 'One symbol, e.g. ! @ #', test: (value) => /[^A-Za-z0-9]/.test(String(value || '')) },
];

export const PASSWORD_RULES_TEXT =
  'Please make your password stronger. Use at least 8 characters, including uppercase and lowercase letters, a number and a symbol.';

export function getPasswordChecks(value) {
  return PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(value) }));
}

export function isStrongPassword(value) {
  return getPasswordChecks(value).every((rule) => rule.passed);
}
