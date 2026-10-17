import { describe, it, expect } from 'vitest';
import { checkAnswer, alternatives } from './answer.js';

describe('alternatives', () => {
  it('expands slashes and commas in English', () => {
    expect(alternatives('he/she spoke', 'en')).toEqual(expect.arrayContaining(['he spoke', 'she spoke']));
    expect(alternatives('big, large', 'en')).toEqual(expect.arrayContaining(['big', 'large']));
    expect(alternatives("No worries / It's okay", 'en')).toEqual(expect.arrayContaining(['no worries', 'it is okay']));
  });
  it('splits Spanish only on slashes, not commas', () => {
    expect(alternatives('malo / mala', 'es')).toEqual(expect.arrayContaining(['malo', 'mala']));
    expect(alternatives('Me gustas, neta', 'es')).toEqual(['me gustas neta']);
  });
  it('drops parenthetical hints', () => {
    expect(alternatives('soy (ser)', 'es')).toEqual(['soy']);
    expect(alternatives('I love you (deep)', 'en')).toEqual(['i love you']);
  });
});

describe('checkAnswer', () => {
  it('accepts exact answers ignoring case and punctuation', () => {
    expect(checkAnswer('¿qué onda?', '¿Qué onda?', 'es').result).toBe('correct');
    expect(checkAnswer('What is up', "What's up?", 'en').result).toBe('correct');
  });
  it('accepts missing accents but flags them', () => {
    const r = checkAnswer('se', 'sé', 'es');
    expect(r.result).toBe('accent');
    expect(r.expected).toBe('sé');
    expect(checkAnswer('explicamelo', 'Explícamelo', 'es').result).toBe('accent');
    expect(checkAnswer('pequeno', 'pequeño / pequeña', 'es').result).toBe('accent');
  });
  it('accepts any meaning', () => {
    expect(checkAnswer('stuff', 'thing / stuff / situation', 'en').result).toBe('correct');
    expect(checkAnswer('she had', 'I/he/she had', 'en').result).toBe('correct');
    expect(checkAnswer('be broke', 'to be broke', 'en').result).toBe('correct');
    expect(checkAnswer('mala', 'malo / mala', 'es').result).toBe('correct');
  });
  it('treats * in censored answers as any letter', () => {
    expect(checkAnswer('shit', 'sh*t!', 'en').result).toBe('correct');
    expect(checkAnswer('fuck off', 'f*** off / go to hell', 'en').result).toBe('correct');
  });
  it('marks small typos as almost', () => {
    expect(checkAnswer('necissito', 'necesito', 'es').result).toBe('almost');
    expect(checkAnswer('por los menos', 'por lo menos', 'es').result).toBe('almost');
  });
  it('rejects wrong answers', () => {
    expect(checkAnswer('sabo', 'sé (saber)', 'es').result).toBe('wrong');
    expect(checkAnswer('', 'sé', 'es').result).toBe('wrong');
    expect(checkAnswer('conmigo', 'contigo', 'es').result).not.toBe('correct');
  });
  it('can ignore a leading subject pronoun', () => {
    expect(checkAnswer('yo soy', 'soy (ser)', 'es', [], { stripSubject: true }).result).toBe('correct');
    expect(checkAnswer('tú vas', 'vas (ir)', 'es', [], { stripSubject: true }).result).toBe('correct');
  });
  it('uses extra accepted answers', () => {
    expect(checkAnswer('klk', '¿Qué lo qué? (KLK)', 'es', ['klk']).result).toBe('correct');
  });
});
