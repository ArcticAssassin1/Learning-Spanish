import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PATH, lessonsOf, lessonDone, nextLesson, lessonMode, lessonAfter, unitStats, LESSON_SIZE } from './path.js';

const dir = path.join(import.meta.dirname, '../data/decks');
const ids = new Set(fs.readdirSync(dir).flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).cards.map((c) => c.id)));

describe('path data', () => {
  it('only points at real cards and real boost decks', () => {
    for (const u of PATH) {
      for (const id of u.cards) expect(ids.has(id), id).toBe(true);
      if (u.boost) expect(fs.existsSync(path.join(dir, `${u.boost}.json`)), u.boost).toBe(true);
      expect(u.goal).toBeTruthy();
    }
  });
});

describe('path progress', () => {
  const unit = PATH[0];
  const lessons = lessonsOf(unit);
  const right = (cards) => Object.fromEntries(cards.map((id) => [id, { box: 2, right: 1, wrong: 0 }]));

  it('splits units into short lessons', () => {
    expect(lessons.every((l) => l.length <= LESSON_SIZE)).toBe(true);
    expect(lessons.flat()).toEqual(unit.cards);
  });
  it('starts at the first lesson and moves on as lessons are done', () => {
    expect(nextLesson({})).toEqual({ unit: 0, lesson: 0 });
    const p = right(lessons[0]);
    expect(lessonDone(lessons[0], p)).toBe(true);
    expect(nextLesson(p)).toEqual({ unit: 0, lesson: 1 });
    expect(unitStats(unit, p).done).toBe(1);
  });
  it('switches from recognize to produce', () => {
    expect(lessonMode(lessons[0], {}).kind).toBe('choice');
    expect(lessonMode(lessons[0], right(lessons[0]))).toMatchObject({ kind: 'quiz', direction: 'en-es' });
  });
  it('knows what comes next', () => {
    expect(lessonAfter(0, lessons.length - 1)).toEqual({ unit: 1, lesson: 0 });
    expect(lessonAfter(PATH.length - 1, lessonsOf(PATH.at(-1)).length - 1)).toBeNull();
  });
});
