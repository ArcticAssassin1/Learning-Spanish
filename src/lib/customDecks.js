// Decks the learner makes on their phone: cards saved from Quick translate / Fix my sentence,
// and word lists imported from Quizlet or anywhere else. Stored in localStorage only.
import { pronounce } from './pronounce.js';

export const MY_CARDS_ID = 'custom-my-cards';
const MAX_DECKS = 50;
const MAX_CARDS = 1000;
const MAX_FIELD = 300;
const REGISTERS = ['neutral', 'casual', 'slang', 'vulgar', 'romantic'];

const str = (v, max = MAX_FIELD) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function cleanCard(c, deckId) {
  if (!c || typeof c !== 'object') return null;
  const spanish = str(c.spanish);
  const english = str(c.english);
  if (!spanish || !english) return null;
  const id = typeof c.id === 'string' && c.id.startsWith(deckId + ':') ? c.id.slice(0, 120) : `${deckId}:${uid()}`;
  return {
    id,
    deckId,
    spanish,
    english,
    pronunciation: str(c.pronunciation) || pronounce(spanish),
    example: str(c.example),
    example_en: str(c.example_en),
    notes: str(c.notes),
    region: str(c.region, 40) || 'General',
    register: REGISTERS.includes(c.register) ? c.register : 'casual',
  };
}

/** Validate decks loaded from storage or a backup file. Bad entries are dropped, never trusted. */
export function sanitizeCustomDecks(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = new Set();
  for (const d of raw.slice(0, MAX_DECKS)) {
    if (!d || typeof d !== 'object' || typeof d.id !== 'string' || !d.id.startsWith('custom-') || seen.has(d.id)) continue;
    const id = d.id.slice(0, 80);
    seen.add(id);
    const ids = new Set();
    const cards = (Array.isArray(d.cards) ? d.cards : [])
      .slice(0, MAX_CARDS)
      .map((c) => cleanCard(c, id))
      .filter((c) => c && !ids.has(c.id) && ids.add(c.id));
    out.push({
      id,
      name: str(d.name, 60) || 'My deck',
      emoji: str(d.emoji, 8) || '📌',
      description: str(d.description),
      phase: 0,
      custom: true,
      cards,
    });
  }
  return out;
}

export function newDeck(name, cards = [], { id, emoji = '📥', description = 'Imported list.' } = {}) {
  const deckId = id || `custom-${uid()}`;
  return sanitizeCustomDecks([{ id: deckId, name, emoji, description, cards }])[0];
}

/** Add one card to "My Cards", creating the deck if needed. Skips exact duplicates. */
export function addToMyCards(decks, card) {
  let mine = decks.find((d) => d.id === MY_CARDS_ID);
  const rest = decks.filter((d) => d.id !== MY_CARDS_ID);
  if (!mine) {
    mine = newDeck('My Cards', [], { id: MY_CARDS_ID, emoji: '📌', description: 'Cards you saved from Quick translate and Fix my sentence.' });
  }
  const dupe = mine.cards.some((c) => c.spanish.toLowerCase() === str(card.spanish).toLowerCase());
  if (dupe) return { decks, added: false };
  const cleaned = cleanCard(card, MY_CARDS_ID);
  if (!cleaned) return { decks, added: false };
  return { decks: [{ ...mine, cards: [...mine.cards, cleaned] }, ...rest], added: true };
}

// ---------- Import ----------

const SEPARATORS = ['\t', ' - ', ' – ', ' — ', ' = ', ' | ', ' : '];

function splitLine(line) {
  for (const sep of SEPARATORS) {
    const i = line.indexOf(sep);
    if (i > 0) return [line.slice(0, i), line.slice(i + sep.length)];
  }
  return null;
}

/** "Así (ah-SEE)" → { spanish: "Así", pronunciation: "ah-SEE" } */
function pullPronunciation(spanish) {
  const m = spanish.match(/^(.*?)\s*\(([A-Za-z]+(?:[- ][A-Za-z]+)+)\)\s*$/);
  if (m && /[A-Z]{2}/.test(m[2])) return { spanish: m[1], pronunciation: m[2] };
  return { spanish, pronunciation: '' };
}

/**
 * Parse a pasted list: one card per line, "spanish - english", "spanish<TAB>english",
 * "spanish = english" or "spanish | english". Returns the cards and the lines it skipped.
 */
export function parseList(text) {
  const cards = [];
  const skipped = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const parts = splitLine(line);
    if (!parts || !parts[0].trim() || !parts[1].trim()) {
      skipped.push(line);
      continue;
    }
    const { spanish, pronunciation } = pullPronunciation(parts[0].trim());
    cards.push({ spanish, english: parts[1].trim(), pronunciation });
  }
  return { cards: cards.slice(0, MAX_CARDS), skipped };
}

// ---------- Export ----------

export const EXPORT_FORMATS = [
  ['dash', 'Dash ( - )'],
  ['tab', 'Tab'],
  ['csv', 'CSV'],
];

function csvCell(v) {
  let s = String(v ?? '');
  // Stop spreadsheet apps from treating a cell as a formula (CSV injection).
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

const oneLine = (s) => String(s ?? '').replace(/[\r\n\t]+/g, ' ').trim();

export function exportDeck(cards, format) {
  if (format === 'csv') {
    const rows = [['spanish', 'english', 'pronunciation', 'example', 'example_en']];
    for (const c of cards) rows.push([c.spanish, c.english, c.pronunciation, c.example, c.example_en]);
    return rows.map((r) => r.map((v) => csvCell(oneLine(v))).join(',')).join('\r\n') + '\r\n';
  }
  const sep = format === 'tab' ? '\t' : ' - ';
  return cards.map((c) => `${oneLine(c.spanish)}${sep}${oneLine(c.english)}`).join('\n') + '\n';
}

export function fileName(deckName, format) {
  const base = deckName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck';
  return `${base}.${format === 'csv' ? 'csv' : 'txt'}`;
}
