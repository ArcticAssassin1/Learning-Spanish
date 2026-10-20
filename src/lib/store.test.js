import { describe, it, expect } from 'vitest';
import { sanitizeSettings, DEFAULT_SETTINGS } from './store.jsx';

describe('sanitizeSettings', () => {
  it('keeps valid values and drops wrong types', () => {
    const s = sanitizeSettings({ showVulgar: false, sessionSize: 'lots', conjTenses: 'presente', theme: 'light', evil: 1 });
    expect(s.showVulgar).toBe(false);
    expect(s.theme).toBe('light');
    expect(s.sessionSize).toBe(DEFAULT_SETTINGS.sessionSize);
    expect(s.conjTenses).toEqual(DEFAULT_SETTINGS.conjTenses);
    expect(s).not.toHaveProperty('evil');
  });
  it('handles garbage', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings([1, 2])).toEqual(DEFAULT_SETTINGS);
  });
});

import { sanitizeProgress, sanitizeActivity } from './store.jsx';

describe('sanitizeProgress / sanitizeActivity', () => {
  it('keeps good records and drops bad ones', () => {
    const p = sanitizeProgress({
      a: { box: 2, right: 3, wrong: 1, due: 5, last: 4 },
      b: { box: 9, right: 0, wrong: 0 },
      c: 'x',
      d: { box: 1, right: '1', wrong: 0 },
    });
    expect(Object.keys(p)).toEqual(['a']);
    expect(sanitizeProgress([1])).toEqual({});
    const a = sanitizeActivity({ '2026-10-19': { reviews: 5, correct: 3 }, nope: { reviews: 1 }, '2026-10-18': { reviews: 'x' } });
    expect(a).toEqual({ '2026-10-19': { reviews: 5, correct: 3 } });
  });
});
