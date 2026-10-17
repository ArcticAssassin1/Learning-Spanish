import { describe, it, expect } from 'vitest';
import { pronounce } from './pronounce.js';

describe('pronounce', () => {
  it('matches the guide style from the brief', () => {
    expect(pronounce('¿Cómo estás?')).toBe('KOH-moh ehs-TAHS');
    expect(pronounce('corazón')).toBe('koh-rah-SOHN');
    expect(pronounce('chica')).toBe('CHEE-kah');
  });
  it('handles Spanish spelling rules', () => {
    expect(pronounce('quiero')).toBe('KYEH-roh');
    expect(pronounce('guapo')).toBe('GWAH-poh');
    expect(pronounce('año')).toBe('AH-nyoh');
    expect(pronounce('hijos')).toBe('EE-hohs');
    expect(pronounce('Explícamelo')).toBe('ehks-PLEE-kah-meh-loh');
    expect(pronounce('rulay')).toBe('roo-LYE');
  });
  it('ignores parenthetical labels and keeps separators', () => {
    expect(pronounce('soy (ser)')).toBe('soy');
    expect(pronounce('malo / mala')).toBe('MAH-loh / MAH-lah');
    expect(pronounce('Tranquila, chica')).toBe('trahn-KEE-lah, CHEE-kah');
  });
});
