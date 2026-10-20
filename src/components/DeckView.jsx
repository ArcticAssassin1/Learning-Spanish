import { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { visibleCards } from '../lib/decks.js';
import { EXPORT_FORMATS, exportDeck, fileName } from '../lib/customDecks.js';
import { dueCount, isLearned } from '../lib/srs.js';
import Speak from './Speak.jsx';
import Badges from './Badges.jsx';
import { MODES, eligibleCards } from './Session.jsx';
import { speechSupported } from '../lib/speech.js';

function Segmented({ value, options, onChange, label }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button key={v} role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export const DIRECTIONS = [['es-en', 'ES → EN'], ['en-es', 'EN → ES'], ['mixed', 'Mixed']];
export const CARD_MODES = [['smart', 'Smart'], ['all', 'All'], ['weak', 'Missed']];
export const SIZES = [[10, '10'], [15, '15'], [25, '25'], [0, 'All']];

export default function DeckView({ deckId, onBack, onStart }) {
  const { settings, updateSettings, progress, decks, updateCustomDecks } = useStore();
  const [browsing, setBrowsing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const deck = decks.find((d) => d.id === deckId);
  if (!deck) {
    return (
      <div className="page">
        <header className="page-head">
          <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
          <h1>Deck not found</h1>
        </header>
      </div>
    );
  }
  const deleteDeck = () => {
    if (!window.confirm(`Delete "${deck.name}" and its ${deck.cards.length} cards? This can't be undone.`)) return;
    updateCustomDecks((list) => list.filter((d) => d.id !== deck.id));
    onBack();
  };
  const deleteCard = (card) => {
    if (!window.confirm(`Delete "${card.spanish}"?`)) return;
    updateCustomDecks((list) => list.map((d) => (d.id === deck.id ? { ...d, cards: d.cards.filter((c) => c.id !== card.id) } : d)));
  };
  const cards = visibleCards(deck, settings);
  const hidden = deck.cards.length - cards.length;
  const learned = cards.filter((c) => isLearned(progress[c.id])).length;
  const seen = cards.map((c) => progress[c.id]).filter(Boolean);
  const right = seen.reduce((n, r) => n + r.right, 0);
  const total = seen.reduce((n, r) => n + r.right + r.wrong, 0);
  const weak = cards.filter((c) => progress[c.id]?.wrong > 0 && !isLearned(progress[c.id])).length;

  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
        <h1>{deck.emoji} {deck.name}</h1>
      </header>
      <p className="muted">{deck.description}</p>
      {deck.credit && <p className="muted small credit">{deck.credit}</p>}
      {hidden > 0 && <p className="muted small">🔞 {hidden} explicit card{hidden === 1 ? '' : 's'} hidden (Settings).</p>}

      <div className="stats">
        <div><strong>{cards.length}</strong><span>cards</span></div>
        <div><strong>{learned}</strong><span>learned</span></div>
        <div><strong>{total ? Math.round((right / total) * 100) + '%' : '–'}</strong><span>accuracy</span></div>
        <div><strong>{dueCount(cards, progress)}</strong><span>due</span></div>
      </div>

      <div className="options">
        <Segmented label="Direction" value={settings.direction} options={DIRECTIONS} onChange={(direction) => updateSettings({ direction })} />
        <Segmented label="Cards" value={settings.cardMode} options={CARD_MODES} onChange={(cardMode) => updateSettings({ cardMode })} />
        <Segmented label="How many" value={settings.sessionSize} options={SIZES} onChange={(sessionSize) => updateSettings({ sessionSize })} />
        {settings.cardMode === 'weak' && weak === 0 && <p className="muted small">No missed cards in this deck yet. Smart mode will be used.</p>}
      </div>

      <div className="modes">
        {Object.entries(MODES).map(([kind, { icon, label }]) => {
          if (kind === 'listen' && !speechSupported) return null;
          const n = eligibleCards(cards, kind).length;
          return (
            <button key={kind} className={'mode' + (kind === 'quiz' ? ' mode-main' : '')} disabled={!n} onClick={() => onStart(kind)}>
              <span className="mode-icon">{icon}</span>
              <span>{label}</span>
              {kind === 'cloze' && n < cards.length && <span className="mode-sub">{n} cards</span>}
            </button>
          );
        })}
      </div>
      <p className="muted small mode-help">
        Direction applies to Type it, Flashcards and Multiple choice. Build the sentence starts from English;
        Fill the blank and Listen are all Spanish.
      </p>

      <div className="row">
        <button className="btn btn-ghost" onClick={() => setBrowsing((b) => !b)}>
          {browsing ? 'Hide cards' : `Browse ${cards.length} cards`}
        </button>
        <button className="btn btn-ghost" onClick={() => setExporting((x) => !x)}>⬇️ Export</button>
      </div>
      {exporting && <ExportPanel deck={deck} cards={cards} />}
      {deck.custom && (
        <button className="btn btn-danger" onClick={deleteDeck}>🗑 Delete this deck</button>
      )}
      {browsing && (
        <ul className="card-list">
          {cards.map((c) => (
            <li key={c.id}>
              <div className="cl-main">
                <span className="cl-es" lang="es">{c.spanish}</span>
                <span className="cl-en">{c.english}</span>
                <span className="pron">{c.pronunciation}</span>
                <Badges card={c} />
              </div>
              <div className="cl-side">
                <Speak text={c.say || c.spanish} small />
                <BoxDots box={progress[c.id]?.box || 0} />
                {deck.custom && (
                  <button className="icon-btn small-icon" onClick={() => deleteCard(c)} aria-label={`Delete ${c.spanish}`}>🗑</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ExportPanel({ deck, cards }) {
  const [format, setFormat] = useState('dash');
  const [msg, setMsg] = useState('');
  const text = exportDeck(cards, format);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setMsg('Copied! Paste it into Quizlet → Create → Import.');
    } catch {
      setMsg("Couldn't copy. Use Download instead.");
    }
  };
  const download = () => {
    const blob = new Blob([format === 'csv' ? '\ufeff' + text : text], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName(deck.name, format);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg('Downloaded.');
  };

  return (
    <section className="panel">
      <div className="field-label">Export {cards.length} cards</div>
      <div className="segmented">
        {EXPORT_FORMATS.map(([v, t]) => (
          <button key={v} className={format === v ? 'on' : ''} onClick={() => { setFormat(v); setMsg(''); }}>{t}</button>
        ))}
      </div>
      <p className="muted small">
        {format === 'csv'
          ? 'CSV opens in Excel, Google Sheets and Anki.'
          : `Quizlet import: choose "${format === 'tab' ? 'Tab' : 'Custom: " - "'}" between term and definition, and "New line" between cards.`}
      </p>
      <pre className="export-preview">{text.split(/\r?\n/).slice(0, 4).join('\n')}{cards.length > 4 ? '\n…' : ''}</pre>
      <div className="row">
        <button className="btn" onClick={copy}>📋 Copy</button>
        <button className="btn btn-primary" onClick={download}>⬇️ Download</button>
      </div>
      {msg && <p className="small" role="status">{msg}</p>}
    </section>
  );
}

function BoxDots({ box }) {
  return (
    <span className="dots" title={box ? `Level ${box} of 5` : 'New'}>
      {[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= box ? 'dot on' : 'dot'} />)}
    </span>
  );
}
