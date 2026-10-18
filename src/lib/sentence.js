// "Build the sentence" (Duolingo word-bank style): tap word tiles into the right order.
import { stripBrackets } from './cloze.js';

const MIN_WORDS = 3;
const MAX_WORDS = 10;

export function words(text) {
  return stripBrackets(text)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[¿?¡!.,;:"“”…—–]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** The sentence to build for a card: the card itself if it's a sentence, else its example. */
export function buildSource(card) {
  if (!card.spanish.includes('/')) {
    const w = words(card.spanish);
    if (w.length >= MIN_WORDS && w.length <= MAX_WORDS) return { words: w, en: card.english, full: card.spanish };
  }
  if (card.example) {
    const w = words(card.example);
    if (w.length >= MIN_WORDS && w.length <= MAX_WORDS) return { words: w, en: card.example_en, full: stripBrackets(card.example) };
  }
  return null;
}

/** Lowercase a sentence-initial capital so the first tile doesn't give the answer away. */
export function tileText(word, index) {
  return index === 0 ? word.charAt(0).toLowerCase() + word.slice(1) : word;
}
