import { describe, it, expect } from 'vitest';
import { parseList, exportDeck, sanitizeCustomDecks, newDeck, addToMyCards, MY_CARDS_ID, fileName } from './customDecks.js';

describe('parseList', () => {
  it('reads Quizlet tab exports and dash lists', () => {
    const { cards, skipped } = parseList('Así (ah-SEE)\tLike this / So\nqué rico - how delicious\n\nno separator here\nvaina = thing');
    expect(cards).toEqual([
      { spanish: 'Así', english: 'Like this / So', pronunciation: 'ah-SEE' },
      { spanish: 'qué rico', english: 'how delicious', pronunciation: '' },
      { spanish: 'vaina', english: 'thing', pronunciation: '' },
    ]);
    expect(skipped).toEqual(['no separator here']);
  });
  it('keeps hyphenated words intact', () => {
    expect(parseList('pa\'lante - keep going / street-smart')).toEqual({
      cards: [{ spanish: "pa'lante", english: 'keep going / street-smart', pronunciation: '' }], skipped: [],
    });
  });
  it('keeps non-pronunciation parentheses', () => {
    expect(parseList('soy (ser) - I am').cards[0].spanish).toBe('soy (ser)');
  });
});

describe('exportDeck', () => {
  const cards = [
    { spanish: 'sé', english: 'I know', pronunciation: 'seh', example: 'No sé.', example_en: "I don't know." },
    { spanish: '=HYPERLINK("x")', english: 'evil, "quoted"\nline', pronunciation: '', example: '', example_en: '' },
  ];
  it('makes Quizlet-style lines', () => {
    expect(exportDeck(cards.slice(0, 1), 'dash')).toBe('sé - I know\n');
    expect(exportDeck(cards.slice(0, 1), 'tab')).toBe('sé\tI know\n');
  });
  it('makes safe CSV', () => {
    const csv = exportDeck(cards, 'csv');
    expect(csv.split('\r\n')[0]).toBe('"spanish","english","pronunciation","example","example_en"');
    expect(csv).toContain(`"'=HYPERLINK(""x"")","evil, ""quoted"" line"`);
  });
  it('names files safely', () => {
    expect(fileName('Mis Palabras ñ!', 'csv')).toBe('mis-palabras-n.csv');
  });
});

describe('sanitizeCustomDecks', () => {
  it('drops bad decks and cards and fills pronunciation', () => {
    const out = sanitizeCustomDecks([
      { id: 'custom-a', name: 'A', cards: [{ spanish: 'hola', english: 'hi' }, { spanish: '' }, 5, { spanish: 'x', english: 'y', register: 'evil' }] },
      { id: 'not-custom', cards: [] },
      'junk',
      { id: 'custom-a', cards: [] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].cards).toHaveLength(2);
    expect(out[0].cards[0].pronunciation).toBe('OH-lah');
    expect(out[0].cards[1].register).toBe('casual');
    expect(out[0].cards[0].id.startsWith('custom-a:')).toBe(true);
    expect(sanitizeCustomDecks({})).toEqual([]);
  });
});

describe('My Cards', () => {
  it('creates the deck and skips duplicates', () => {
    let { decks, added } = addToMyCards([], { spanish: 'Dale', english: "let's go" });
    expect(added).toBe(true);
    expect(decks[0].id).toBe(MY_CARDS_ID);
    ({ decks, added } = addToMyCards(decks, { spanish: 'dale', english: 'ok' }));
    expect(added).toBe(false);
    expect(decks[0].cards).toHaveLength(1);
  });
  it('newDeck builds a custom deck', () => {
    const d = newDeck('Quizlet', [{ spanish: 'a', english: 'b' }]);
    expect(d.id.startsWith('custom-')).toBe(true);
    expect(d.cards).toHaveLength(1);
  });
});
