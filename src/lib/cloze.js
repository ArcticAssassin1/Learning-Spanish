// Fill-in-the-blank (Clozemaster style) built from each card's example sentence.
// An example can mark the blank with [brackets]; otherwise the card's Spanish word is looked up in it.
import { stripAccents } from './answer.js';

export function stripBrackets(text = '') {
  return text.replace(/[[\]]/g, '');
}

/** Split text into [{ text, mark }] parts so bracketed words can be highlighted. */
export function markedParts(text = '') {
  return text.split(/(\[[^\]]*\])/).filter(Boolean).map((p) => (
    p.startsWith('[') ? { text: p.slice(1, -1), mark: true } : { text: p, mark: false }
  ));
}

const LETTER = 'a-zA-ZáéíóúüñÁÉÍÓÚÜÑ';

/** @returns {{ before: string, answer: string, after: string } | null} */
export function makeCloze(card) {
  const ex = card.example || '';
  const m = ex.match(/^(.*?)\[([^\]]+)\](.*)$/);
  if (m) return { before: stripBrackets(m[1]), answer: m[2], after: stripBrackets(m[3]) };

  const terms = card.spanish
    .replace(/\([^)]*\)/g, ' ')
    .split('/')
    .map((t) => t.replace(/[¿?¡!.,]/g, '').trim())
    .filter((t) => t.length > 1);
  const bare = stripAccents(ex.toLowerCase());
  for (const term of terms) {
    const needle = stripAccents(term.toLowerCase()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^${LETTER}])(${needle})(?![${LETTER}])`);
    const hit = re.exec(bare);
    if (hit) {
      const start = hit.index + hit[1].length;
      const end = start + hit[2].length;
      return { before: ex.slice(0, start), answer: ex.slice(start, end), after: ex.slice(end) };
    }
  }
  return null;
}
