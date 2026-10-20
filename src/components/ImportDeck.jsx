import { useMemo, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { newDeck, parseList } from '../lib/customDecks.js';

const MAX_PASTE = 100_000;

export default function ImportDeck({ onBack, openDeck }) {
  const { updateCustomDecks } = useStore();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const { cards, skipped } = useMemo(() => parseList(text), [text]);

  const create = () => {
    const deck = newDeck(name.trim() || 'Imported list', cards);
    updateCustomDecks((list) => [...list, deck]);
    openDeck(deck.id);
  };

  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
        <h1>📥 Import a list</h1>
      </header>
      <p className="muted">
        Paste a word list, one card per line: <code>spanish - english</code>. Quizlet exports
        (Tab between term and definition) work too.
      </p>

      <label className="field">
        <span className="field-label">Deck name</span>
        <input className="answer-input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="e.g. Week 5 words" />
      </label>

      <label className="field">
        <span className="field-label">Your list</span>
        <textarea
          className="answer-input fix-input import-input"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_PASTE))}
          placeholder={'hola - hello\nla vaina - the thing\nqué rico - how delicious'}
          rows={8}
          spellCheck={false}
          autoCapitalize="off"
        />
      </label>

      {text.trim() && (
        <section className="panel">
          <div className="field-label">
            {cards.length} card{cards.length === 1 ? '' : 's'} found
            {skipped.length > 0 && ` · ${skipped.length} line${skipped.length === 1 ? '' : 's'} skipped`}
          </div>
          <ul className="import-preview">
            {cards.slice(0, 5).map((c, i) => (
              <li key={i}><strong lang="es">{c.spanish}</strong> → {c.english}</li>
            ))}
            {cards.length > 5 && <li className="muted">…and {cards.length - 5} more</li>}
          </ul>
          {skipped.length > 0 && (
            <p className="muted small">
              Skipped (no separator found): {skipped.slice(0, 3).map((l) => `"${l.slice(0, 40)}"`).join(', ')}
              {skipped.length > 3 ? '…' : ''}
            </p>
          )}
        </section>
      )}

      <button className="btn btn-primary btn-wide" disabled={!cards.length} onClick={create}>
        Create deck{cards.length ? ` (${cards.length} cards)` : ''}
      </button>
    </div>
  );
}
