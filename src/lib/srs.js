// Leitner-box spaced repetition.
// Box 1 = just missed (due again right away) ... box 5 = well known (16 days).
// A wrong answer always sends the card back to box 1.

const DAY = 24 * 60 * 60 * 1000;
export const INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 16 };
export const LEARNED_BOX = 3;

/** easy = "I knew that instantly" (Anki's Easy button): skips a box. */
export function grade(record, correct, now = Date.now(), { easy = false } = {}) {
  const r = record || { box: 0, right: 0, wrong: 0 };
  const box = correct ? Math.min(Math.max(r.box, 1) + (easy ? 2 : 1), 5) : 1;
  return {
    box,
    right: r.right + (correct ? 1 : 0),
    wrong: r.wrong + (correct ? 0 : 1),
    last: now,
    due: now + INTERVAL_DAYS[box] * DAY,
  };
}

export function isDue(record, now = Date.now()) {
  return !!record && record.box > 0 && record.due <= now;
}

export function isLearned(record) {
  return !!record && record.box >= LEARNED_BOX;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick cards for a session.
 * mode 'smart': due cards first (weakest box first), then new cards, then the rest.
 * mode 'all': everything, random.
 * mode 'weak': cards missed at least once and not yet learned.
 * The final list is always shuffled (random order).
 */
export function pickSession(cards, progress, { mode = 'smart', size = 15, now = Date.now() } = {}) {
  let pool;
  if (mode === 'all') {
    pool = shuffle(cards);
  } else if (mode === 'weak') {
    pool = shuffle(cards.filter((c) => progress[c.id]?.wrong > 0 && !isLearned(progress[c.id])))
      .sort((a, b) => progress[a.id].box - progress[b.id].box);
  } else {
    const due = shuffle(cards.filter((c) => isDue(progress[c.id], now)))
      .sort((a, b) => progress[a.id].box - progress[b.id].box);
    const fresh = shuffle(cards.filter((c) => !progress[c.id]));
    const rest = shuffle(cards.filter((c) => progress[c.id] && !isDue(progress[c.id], now)))
      .sort((a, b) => progress[a.id].due - progress[b.id].due);
    pool = [...due, ...fresh, ...rest];
  }
  return shuffle(size > 0 ? pool.slice(0, size) : pool);
}

export function dueCount(cards, progress, now = Date.now()) {
  return cards.filter((c) => isDue(progress[c.id], now)).length;
}

/** Local date key like "2026-10-17". */
export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const MAX_FREEZES = 2;
const FREEZE_EVERY = 7;

/**
 * Streak with Duolingo-style streak freezes: every 7 days in a row earns a freeze (max 2),
 * and a freeze is used up automatically to cover a missed day.
 * Today doesn't count as missed until it's over.
 * @returns {{ streak: number, freezes: number, studiedToday: boolean }}
 */
export function streakInfo(activity, now = Date.now()) {
  const days = Object.keys(activity).filter((k) => activity[k]?.reviews > 0).sort();
  const today = dayKey(now);
  const studiedToday = !!activity[today]?.reviews;
  if (!days.length) return { streak: 0, freezes: 0, studiedToday };

  const [y, m, d] = days[0].split('-').map(Number);
  const cursor = new Date(y, m - 1, d, 12);
  let streak = 0;
  let run = 0;
  let freezes = 0;
  for (let key = dayKey(cursor); key <= today; cursor.setDate(cursor.getDate() + 1), key = dayKey(cursor)) {
    if (activity[key]?.reviews > 0) {
      streak++;
      run++;
      if (run % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1);
    } else if (key !== today) {
      run = 0;
      if (freezes > 0 && streak > 0) freezes--;
      else streak = 0;
    }
  }
  return { streak, freezes, studiedToday };
}

export function streak(activity, now = Date.now()) {
  return streakInfo(activity, now).streak;
}
