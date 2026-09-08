export function clearLocalUserState() {
  try {
    const keysToRemove = [
      'cdna_progress_v1',
      'careerDNAResults',
      'careerDNASelections',
      'careerDNAIntro',
      'careerDNAUser',
      'careerDNAReport',
      'careerDNAAnalysis',
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    Object.keys(localStorage).forEach((key) => {
      if (key.toLowerCase().includes('careerdna')) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach((key) => {
      if (key.toLowerCase().includes('careerdna') || key.toLowerCase().includes('cdna')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error('Failed to clear local user state:', err);
  }
}