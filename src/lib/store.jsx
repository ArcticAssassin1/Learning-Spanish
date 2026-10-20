import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { load, save, remove } from './storage.js';
import { grade, dayKey } from './srs.js';
import { DECKS } from './decks.js';
import { sanitizeCustomDecks, addToMyCards } from './customDecks.js';

export const DEFAULT_SETTINGS = {
  showVulgar: true,
  theme: 'dark',
  direction: 'es-en',
  sessionSize: 15,
  cardMode: 'smart',
  voiceURI: '',
  autoSpeak: false,
  dailyGoal: 20,
  conjSet: 'core',
  conjTenses: ['presente', 'preterito'],
  conjSize: 15,
};

const StoreContext = createContext(null);

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** Keep only saved settings whose type matches the default, so bad stored data can't crash the app. */
export function sanitizeSettings(saved) {
  const out = { ...DEFAULT_SETTINGS };
  if (!isPlainObject(saved)) return out;
  for (const [k, def] of Object.entries(DEFAULT_SETTINGS)) {
    const v = saved[k];
    if (Array.isArray(def) ? Array.isArray(v) && v.every((x) => typeof x === 'string') : typeof v === typeof def) out[k] = v;
  }
  return out;
}

const num = (v) => typeof v === 'number' && Number.isFinite(v);

/** Keep only well-formed spaced-repetition records. */
export function sanitizeProgress(raw) {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [id, r] of Object.entries(raw)) {
    if (id.length > 200 || !isPlainObject(r)) continue;
    if (![r.box, r.right, r.wrong].every(num) || r.box < 0 || r.box > 5) continue;
    out[id] = { box: Math.round(r.box), right: Math.max(0, r.right), wrong: Math.max(0, r.wrong), last: num(r.last) ? r.last : 0, due: num(r.due) ? r.due : 0 };
  }
  return out;
}

/** Keep only "YYYY-MM-DD": { reviews, correct } entries. */
export function sanitizeActivity(raw) {
  const out = {};
  if (!isPlainObject(raw)) return out;
  for (const [day, a] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !isPlainObject(a) || !num(a.reviews)) continue;
    out[day] = { reviews: Math.max(0, a.reviews), correct: num(a.correct) ? Math.max(0, a.correct) : 0 };
  }
  return out;
}

export const BACKUP_APP = 'learning-spanish';

export function makeBackup({ settings, progress, activity, customDecks }) {
  return { app: BACKUP_APP, version: 1, exportedAt: new Date().toISOString(), settings, progress, activity, customDecks };
}

export function StoreProvider({ children }) {
  const [settings, setSettings] = useState(() => sanitizeSettings(load('settings', {})));
  const [progress, setProgress] = useState(() => sanitizeProgress(load('progress', {})));
  const [activity, setActivity] = useState(() => sanitizeActivity(load('activity', {})));
  const [customDecks, setCustomDecks] = useState(() => sanitizeCustomDecks(load('customDecks', [])));

  useEffect(() => save('settings', settings), [settings]);
  useEffect(() => save('progress', progress), [progress]);
  useEffect(() => save('activity', activity), [activity]);
  useEffect(() => save('customDecks', customDecks), [customDecks]);

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

  /** fn receives the current custom decks and returns the new list (validated before saving). */
  const updateCustomDecks = useCallback((fn) => setCustomDecks((d) => sanitizeCustomDecks(fn(d))), []);

  /** Replace everything from a backup file (already validated by the caller). */
  const restoreBackup = useCallback((data) => {
    setSettings(sanitizeSettings(data.settings));
    setProgress(sanitizeProgress(data.progress));
    setActivity(sanitizeActivity(data.activity));
    setCustomDecks(sanitizeCustomDecks(data.customDecks));
  }, []);

  const decks = useMemo(() => [...DECKS, ...customDecks], [customDecks]);

  const resetProgress = useCallback(() => {
    remove('progress');
    remove('activity');
    setProgress({});
    setActivity({});
  }, []);

  const value = useMemo(
    () => ({
      settings, updateSettings, progress, activity, recordAnswer, resetProgress,
      decks, customDecks, updateCustomDecks, restoreBackup,
    }),
    [settings, updateSettings, progress, activity, recordAnswer, resetProgress, decks, customDecks, updateCustomDecks, restoreBackup],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

/** Returns save(card) → true if the card was added to "My Cards", false if it was already there. */
export function useSaveCard() {
  const { customDecks, updateCustomDecks } = useStore();
  return (card) => {
    const { decks, added } = addToMyCards(customDecks, card);
    if (added) updateCustomDecks(() => decks);
    return added;
  };
}
