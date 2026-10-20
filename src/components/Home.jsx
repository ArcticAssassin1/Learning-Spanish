import { useStore } from '../lib/store.jsx';
import { visibleDecks, visibleCards, allVisibleCards, PHASES } from '../lib/decks.js';
import { dueCount, isLearned } from '../lib/srs.js';
import Hero from './Hero.jsx';

export default function Home({ openDeck, startReview, startMistakes, openImport }) {
  const { settings, progress, decks: allDecks } = useStore();
  const decks = visibleDecks(settings, allDecks);
  const all = allVisibleCards(settings, allDecks);
  const due = dueCount(all, progress);
  const mistakes = all.filter((c) => progress[c.id]?.wrong > 0 && !isLearned(progress[c.id])).length;
  const phases = [...new Set(decks.map((d) => d.phase ?? 0))].sort();

  return (
    <div className="page">
      <Hero />

      <button className="review-btn" onClick={startReview}>
        <span className="review-title">{due > 0 ? `Review ${due} due card${due === 1 ? '' : 's'}` : 'Quick mixed review'}</span>
        <span className="review-sub">{due > 0 ? 'Missed cards come back first' : 'Mix of new cards from every deck'}</span>
      </button>

      {mistakes > 0 && (
        <button className="mistakes-btn" onClick={startMistakes}>
          <span>🩹 Fix my mistakes</span>
          <span className="due-pill">{mistakes}</span>
        </button>
      )}

      {phases.map((phase) => (
        <section key={phase}>
          <h2 className="phase">{PHASES[phase] || 'More decks'}</h2>
          <ul className="deck-list">
            {decks.filter((d) => (d.phase ?? 0) === phase).map((deck) => {
              const cards = visibleCards(deck, settings);
              const learned = cards.filter((c) => isLearned(progress[c.id])).length;
              const deckDue = dueCount(cards, progress);
              return (
                <li key={deck.id}>
                  <button className="deck" onClick={() => openDeck(deck.id)}>
                    <span className="deck-emoji">{deck.emoji}</span>
                    <span className="deck-body">
                      <span className="deck-name">{deck.name}</span>
                      <span className="deck-meta">{learned}/{cards.length} learned</span>
                      <span className="mini-bar"><span style={{ width: `${(learned / cards.length) * 100}%` }} /></span>
                    </span>
                    {deckDue > 0 && <span className="due-pill">{deckDue} due</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <button className="btn btn-ghost btn-wide" onClick={openImport}>📥 Import a word list (Quizlet, etc.)</button>
    </div>
  );
}
