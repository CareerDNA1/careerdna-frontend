// src/Hooks/useProgress.js
import { useCallback } from 'react';

const KEY = 'cdna_progress_v1';

export function readProgress() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function writeProgress(patch) {
  const cur = readProgress();
  sessionStorage.setItem(KEY, JSON.stringify({ ...cur, ...patch }));
}

export default function useProgress() {
  const read = useCallback(() => readProgress(), []);
  const write = useCallback((patch) => writeProgress(patch), []);
  const clear = useCallback(() => sessionStorage.removeItem(KEY), []);
  return { read, write, clear };
}
