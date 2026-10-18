import { describe, it, expect } from 'vitest';
import data from '../data/conjugations.json';
import { drillCards, pickVerbs, CORE_VERBS } from './conjugation.js';
import { buildSource, words } from './sentence.js';

describe('conjugation data', () => {
  it('has the core verbs', () => {
    const missing = CORE_VERBS.filter((v) => !data.verbs.some((x) => x.inf === v));
    expect(missing).toEqual([]);
  });
  it('builds drill cards with the right forms', () => {
    const cards = drillCards(data, { set: 'core', tenses: ['preterito'], size: 0 });
    const tuvimos = cards.find((c) => c.id === 'conj:tener:preterito:3');
    expect(tuvimos.spanish).toBe('tuvimos');
    expect(cards.every((c) => c.spanish)).toBe(true);
    expect(pickVerbs(data.verbs, 'top25')).toHaveLength(25);
  });
  it('respects size', () => {
    expect(drillCards(data, { set: 'top50', tenses: ['presente', 'futuro'], size: 15 })).toHaveLength(15);
  });
});

describe('sentence builder', () => {
  it('splits words without punctuation', () => {
    expect(words('¿Quieres [bailar] conmigo?')).toEqual(['Quieres', 'bailar', 'conmigo']);
  });
  it('uses the card or its example', () => {
    expect(buildSource({ spanish: 'Quiero verte.', english: 'I want to see you.' })).toBeNull();
    expect(buildSource({ spanish: 'Te quiero ver.', english: 'x' }).words).toEqual(['Te', 'quiero', 'ver']);
    expect(buildSource({ spanish: 'jevi', example: 'Esa fiesta estuvo jevi.', example_en: 'y' }).en).toBe('y');
  });
});
