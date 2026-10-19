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
