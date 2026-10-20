// The Learn path: units of everyday phrases, split into short lessons.
// A lesson is "done" once every card in it has been answered right at least once.
// First time through = recognize (multiple choice ES → EN); after that = produce (type EN → ES).
import PATH from '../data/path.json';
import { isLearned } from './srs.js';

export const LESSON_SIZE = 6;
export { PATH };

export function lessonsOf(unit) {
  const out = [];
  for (let i = 0; i < unit.cards.length; i += LESSON_SIZE) out.push(unit.cards.slice(i, i + LESSON_SIZE));
  return out;
}

export function lessonDone(cardIds, progress) {
  return cardIds.every((id) => progress[id]?.right > 0);
}

export function unitStats(unit, progress) {
  const lessons = lessonsOf(unit);
  const done = lessons.filter((l) => lessonDone(l, progress)).length;
  const learned = unit.cards.filter((id) => isLearned(progress[id])).length;
  return { lessons: lessons.length, done, learned, total: unit.cards.length, complete: done === lessons.length };
}

/** The first lesson not done yet, in path order. null when the whole path is done. */
export function nextLesson(progress, path = PATH) {
  for (let u = 0; u < path.length; u++) {
    const lessons = lessonsOf(path[u]);
    for (let l = 0; l < lessons.length; l++) {
      if (!lessonDone(lessons[l], progress)) return { unit: u, lesson: l };
    }
  }
  return null;
}

/** How a lesson is studied: recognize first, then produce. */
export function lessonMode(cardIds, progress) {
  return lessonDone(cardIds, progress)
    ? { kind: 'quiz', direction: 'en-es', label: 'Practice' }
    : { kind: 'choice', direction: 'es-en', label: 'Learn' };
}

/** The lesson after (unit, lesson), or null at the end of the path. */
export function lessonAfter(unit, lesson, path = PATH) {
  if (lesson + 1 < lessonsOf(path[unit]).length) return { unit, lesson: lesson + 1 };
  if (unit + 1 < path.length) return { unit: unit + 1, lesson: 0 };
  return null;
}
