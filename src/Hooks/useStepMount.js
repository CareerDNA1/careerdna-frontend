// src/Hooks/useStepMount.js
import { useEffect } from 'react';

/**
 * Professional default: no programmatic focus (no container outlines).
 * We still scroll to top to avoid starting mid-page.
 */
export default function useStepMount() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
}
