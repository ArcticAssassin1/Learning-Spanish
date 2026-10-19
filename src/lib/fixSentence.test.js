import { describe, it, expect } from 'vitest';
import { parseResult, looksLikeApiKey, RESULT_SCHEMA } from './fixSentence.js';

describe('parseResult', () => {
  it('parses a correction and adds pronunciation', () => {
    const r = parseResult(JSON.stringify({
      is_correct: false,
      corrected: 'Quiero verte.',
      translation: 'I want to see you.',
      fixes: [{ wrong: 'ver tu', right: 'verte', why: 'Attach the pronoun to the verb.' }],
      natural: '',
      tip: '',
    }));
    expect(r.corrected).toBe('Quiero verte.');
    expect(r.pronunciation).toBe('KYEH-roh BEHR-teh');
    expect(r.fixes).toHaveLength(1);
  });
  it('drops junk and coerces types', () => {
    const r = parseResult(JSON.stringify({ corrected: 'Hola', fixes: [null, 5, { wrong: 1, right: 'b' }], is_correct: 'yes' }));
    expect(r.is_correct).toBe(false);
    expect(r.fixes).toEqual([{ wrong: '', right: 'b', why: '' }]);
    expect(r.translation).toBe('');
  });
  it('rejects unusable output', () => {
    expect(() => parseResult('not json')).toThrow();
    expect(() => parseResult('{"fixes": []}')).toThrow();
  });
});

describe('looksLikeApiKey', () => {
  it('accepts Anthropic keys only', () => {
    expect(looksLikeApiKey('sk-ant-api03-abcdefghijklmnopqrstuvwxyz012345')).toBe(true);
    expect(looksLikeApiKey('hello')).toBe(false);
    expect(looksLikeApiKey('sk-ant-<script>')).toBe(false);
  });
});

describe('schema', () => {
  it('is strict', () => {
    expect(RESULT_SCHEMA.additionalProperties).toBe(false);
    expect(RESULT_SCHEMA.required).toEqual(Object.keys(RESULT_SCHEMA.properties));
  });
});
