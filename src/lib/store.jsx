import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { load, save, remove } from './storage.js';
import { grade, dayKey } from './srs.js';

export const DEFAULT_SETTINGS = {
  showVulgar: true,
  theme: 'dark',
  direction: 'es-en',
  sessionSize: 15,
  cardMode: 'smart',
  voiceURI: '',
  autoSpeak: false,
  dailyGoal: 20,
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('settings', {}) }));
  const [progress, setProgress] = useState(() => load('progress', {}));
  const [activity, setActivity] = useState(() => load('activity', {}));

  useEffect(() => save('settings', settings), [settings]);
  useEffect(() => save('progress', progress), [progress]);
  useEffect(() => save('activity', activity), [activity]);

  useEffect(() => {
    const root = document.documentElement;
    const dark = settings.theme === 'dark'
      || (settings.theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111318' : '#f6f4ef');
  }, [settings.theme]);

  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);

  const recordAnswer = useCallback((cardId, correct, opts) => {
    const now = Date.now();
    setProgress((p) => ({ ...p, [cardId]: grade(p[cardId], correct, now, opts) }));
    setActivity((a) => {
      const k = dayKey(now);
      const day = a[k] || { reviews: 0, correct: 0 };
      return { ...a, [k]: { reviews: day.reviews + 1, correct: day.correct + (correct ? 1 : 0) } };
    });
  }, []);

  const resetProgress = useCallback(() => {
    remove('progress');
    remove('activity');
    setProgress({});
    setActivity({});
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, progress, activity, recordAnswer, resetProgress }),
    [settings, updateSettings, progress, activity, recordAnswer, resetProgress],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}
