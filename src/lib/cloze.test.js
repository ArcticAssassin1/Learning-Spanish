import { describe, it, expect } from 'vitest';
import { makeCloze, markedParts, stripBrackets } from './cloze.js';

describe('makeCloze', () => {
  it('uses [brackets] when present', () => {
    expect(makeCloze({ spanish: 'Quiero ir.', example: 'Quiero [ir] a la playa.' }))
      .toEqual({ before: 'Quiero ', answer: 'ir', after: ' a la playa.' });
  });
  it('finds the card word in the example, ignoring accents and case', () => {
    expect(makeCloze({ spanish: 'soy (ser)', example: 'Soy de Tampa.' }))
      .toEqual({ before: '', answer: 'Soy', after: ' de Tampa.' });
    expect(makeCloze({ spanish: 'malo / mala', example: 'La comida está mala.' }).answer).toBe('mala');
  });
  it('matches whole words only', () => {
    expect(makeCloze({ spanish: 've (ver)', example: 'Nos vemos.' })).toBeNull();
  });
  it('returns null when the word is not in the example', () => {
    expect(makeCloze({ spanish: 'malo / mala', example: 'Fue un mal momento.' })).toBeNull();
  });
});

describe('brackets helpers', () => {
  it('strips and marks', () => {
    expect(stripBrackets('Quiero [ir] ya.')).toBe('Quiero ir ya.');
    expect(markedParts('a [b] c')).toEqual([{ text: 'a ', mark: false }, { text: 'b', mark: true }, { text: ' c', mark: false }]);
  });
});
