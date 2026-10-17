import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(import.meta.dirname, 'decks');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
const REGIONS = ['General', 'Mexico', 'Dominican', 'Caribbean', 'Spain', 'Colombia', 'Puerto Rico', 'Cuba'];
const REGISTERS = ['neutral', 'casual', 'slang', 'vulgar', 'romantic'];

describe('deck files', () => {
  const ids = new Set();
  for (const file of files) {
    const deck = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    it(`${file} is valid`, () => {
      expect(deck.id).toBe(file.replace('.json', ''));
      expect(deck.name).toBeTruthy();
      expect(deck.cards.length).toBeGreaterThan(0);
      for (const c of deck.cards) {
        expect(c.id.startsWith(deck.id + ':'), c.id).toBe(true);
        expect(ids.has(c.id), `duplicate ${c.id}`).toBe(false);
        ids.add(c.id);
        for (const k of ['spanish', 'english', 'pronunciation', 'example', 'example_en']) expect(c[k], `${c.id}.${k}`).toBeTruthy();
        expect(REGIONS, c.id).toContain(c.region);
        expect(REGISTERS, c.id).toContain(c.register);
      }
    });
  }
});
