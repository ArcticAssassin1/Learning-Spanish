import { describe, it, expect } from 'vitest';
import { grade, pickSession, streak, dayKey, isDue } from './srs.js';

const DAY = 86400000;

describe('grade', () => {
  it('moves up on correct and back to box 1 on a miss', () => {
    let r = grade(undefined, true, 0);
    expect(r.box).toBe(2);
    expect(r.due).toBe(DAY);
    r = grade(r, true, 0);
    expect(r.box).toBe(3);
    r = grade(r, false, 0);
    expect(r).toMatchObject({ box: 1, right: 2, wrong: 1, due: 0 });
  });
  it('caps at box 5', () => {
    let r;
    for (let i = 0; i < 10; i++) r = grade(r, true, 0);
    expect(r.box).toBe(5);
  });
});

describe('pickSession', () => {
  const cards = Array.from({ length: 30 }, (_, i) => ({ id: 'c' + i }));
  it('puts due cards in the session before new ones', () => {
    const progress = { c5: { box: 1, due: 0, wrong: 1, right: 0 }, c6: { box: 2, due: 0, wrong: 0, right: 1 } };
    const s = pickSession(cards, progress, { size: 3, now: 10 });
    expect(s.map((c) => c.id)).toEqual(expect.arrayContaining(['c5', 'c6']));
    expect(s).toHaveLength(3);
  });
  it('weak mode only returns missed cards', () => {
    const progress = { c1: { box: 1, due: 0, wrong: 2, right: 0 }, c2: { box: 4, due: 0, wrong: 1, right: 5 } };
    expect(pickSession(cards, progress, { mode: 'weak', size: 10 }).map((c) => c.id)).toEqual(['c1']);
  });
  it('size 0 means all cards', () => {
    expect(pickSession(cards, {}, { mode: 'all', size: 0 })).toHaveLength(30);
  });
  it('isDue ignores unseen cards', () => {
    expect(isDue(undefined)).toBe(false);
  });
});

describe('streak', () => {
  it('counts consecutive days, allowing today to be empty', () => {
    const now = new Date(2026, 9, 17, 12).getTime();
    const a = {};
    for (const d of [16, 15, 14]) a[dayKey(new Date(2026, 9, d, 9).getTime())] = { reviews: 3 };
    expect(streak(a, now)).toBe(3);
    a[dayKey(now)] = { reviews: 1 };
    expect(streak(a, now)).toBe(4);
    expect(streak({}, now)).toBe(0);
  });
});
