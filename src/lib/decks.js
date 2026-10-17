import { pronounce } from './pronounce.js';

// Every JSON file in src/data/decks becomes a deck. To add a deck, drop a new file in there.
const modules = import.meta.glob('../data/decks/*.json', { eager: true, import: 'default' });

export const DECKS = Object.values(modules)
  .map((deck) => ({
    ...deck,
    cards: deck.cards.map((c) => ({ ...c, deckId: deck.id, pronunciation: c.pronunciation || pronounce(c.spanish) })),
  }))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

export const PHASES = {
  1: 'Phase 1 · Lock in the foundations',
  2: 'Phase 2 · Real conversation',
  3: 'Phase 3 · Caribbean & street Spanish',
};

export function visibleCards(deck, settings) {
  return settings.showVulgar ? deck.cards : deck.cards.filter((c) => c.register !== 'vulgar');
}

export function visibleDecks(settings) {
  return DECKS.filter((d) => visibleCards(d, settings).length > 0);
}

export function allVisibleCards(settings) {
  return visibleDecks(settings).flatMap((d) => visibleCards(d, settings));
}

export const REGION_FLAGS = {
  General: '🌎', Mexico: '🇲🇽', Dominican: '🇩🇴', Caribbean: '🌴', Spain: '🇪🇸',
  Colombia: '🇨🇴', 'Puerto Rico': '🇵🇷', Cuba: '🇨🇺',
};

export const REGISTER_LABELS = {
  neutral: null,
  casual: 'casual',
  slang: 'slang',
  vulgar: 'vulgar 🔞',
  romantic: 'romantic 🔥',
};
