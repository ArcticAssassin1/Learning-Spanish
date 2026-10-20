import { useEffect, useRef, useState } from 'react';
import { translate, MAX_INPUT } from '../lib/translate.js';
import { load, save } from '../lib/storage.js';
import { useStore, useSaveCard } from '../lib/store.jsx';
import Speak from './Speak.jsx';

const HISTORY_SIZE = 10;

function loadHistory() {
  const h = load('translateHistory', []);
  return Array.isArray(h)
    ? h.filter((e) => e && typeof e.query === 'string' && typeof e.result?.spanish === 'string' && Array.isArray(e.result.examples))
    : [];
}

export default function QuickTranslate({ onBack, openSettings }) {
  const apiKey = load('apiKey', '');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shown, setShown] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (e) => {
    e?.preventDefault();
    const query = text.trim();
    if (!query || busy) return;
    setBusy(true);
    setError('');
    abortRef.current = new AbortController();
    const { result, error: err } = await translate(query, apiKey, { signal: abortRef.current.signal });
    setBusy(false);
    if (err !== undefined) {
      setError(err);
      return;
    }
    const entry = { query, result, at: Date.now() };
    setShown(entry);
    const next = [entry, ...history.filter((h) => h.query !== query)].slice(0, HISTORY_SIZE);
    setHistory(next);
    save('translateHistory', next);
  };

  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
        <h1>🔎 Quick translate</h1>
      </header>
      <p className="muted">English or Spanish: get the translation, pronunciation, examples and the street version.</p>

      {!apiKey ? (
        <section className="panel">
          <p>This feature uses Claude, so it needs your own Claude API key (about a cent per lookup).</p>
          <button className="btn btn-primary btn-wide" onClick={openSettings}>Add API key in Settings</button>
        </section>
      ) : (
        <form className="answer-form" onSubmit={submit}>
          <div className="input-row">
            <input
              className="answer-input"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_INPUT))}
              placeholder="e.g. calm down, girl / ¿qué lo qué?"
              maxLength={MAX_INPUT}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="search"
              aria-label="Word or phrase to translate"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-wide" disabled={!text.trim() || busy}>
            {busy ? 'Looking it up…' : 'Translate'}
          </button>
          {error && <div className="fix-error" role="alert">{error}</div>}
        </form>
      )}

      {shown && <TranslateResult key={shown.at} result={shown.result} />}

      {history.length > 0 && (
        <>
          <h2 className="phase">Recent</h2>
          <ul className="card-list">
            {history.map((h) => (
              <li key={h.at}>
                <button className="history-item" onClick={() => { setShown(h); window.scrollTo(0, 0); }}>
                  <span className="cl-en">{h.query}</span>
                  <span className="cl-es" lang="es">{h.result.spanish}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function TranslateResult({ result: r }) {
  const { settings } = useStore();
  const saveCard = useSaveCard();
  const [saved, setSaved] = useState('');

  const onSave = () => {
    const added = saveCard({
      spanish: r.spanish,
      english: r.english,
      example: r.examples[0]?.es || '',
      example_en: r.examples[0]?.en || '',
      notes: r.definition,
      register: 'casual',
    });
    setSaved(added ? 'Saved to 📌 My Cards.' : 'Already in 📌 My Cards.');
  };

  const showStreet = r.street.phrase && (!r.street.vulgar || settings.showVulgar);

  return (
    <section className="panel translate" aria-live="polite">
      <div className="t-row"><span className="t-label">English</span><span>{r.english}</span></div>
      <div className="details-head">
        <div>
          <div className="details-es" lang="es">{r.spanish}</div>
          <div className="pron">{r.pronunciation}</div>
        </div>
        <Speak text={r.spanish} />
      </div>
      {r.definition && <p className="t-def">{r.definition}</p>}

      {r.examples.length > 0 && (
        <div className="t-block">
          <div className="t-label">Examples</div>
          {r.examples.map((e, i) => (
            <div className="example" key={i}>
              <div className="example-es" lang="es">{e.es} <Speak text={e.es} small /></div>
              <div className="example-en">{e.en}</div>
            </div>
          ))}
        </div>
      )}

      {r.breakdown.length > 1 && (
        <table className="fix-table">
          <thead><tr><th>Word</th><th>Say it</th><th>English</th></tr></thead>
          <tbody>
            {r.breakdown.map((b, i) => (
              <tr key={i}><td lang="es"><strong>{b.word}</strong></td><td className="pron">{b.pronunciation}</td><td>{b.english}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {r.variations.length > 0 && (
        <table className="fix-table">
          <thead><tr><th>Where</th><th>They say</th><th>Meaning</th></tr></thead>
          <tbody>
            {r.variations.map((v, i) => (
              <tr key={i}><td>{v.region}</td><td lang="es"><strong>{v.phrase}</strong></td><td>{v.english}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {showStreet && (
        <div className={'example street' + (r.street.vulgar ? ' street-vulgar' : '')}>
          <div className="t-label">{r.street.vulgar ? 'Street version 🔞' : 'Street version'}</div>
          <div className="example-es" lang="es">{r.street.phrase} <Speak text={r.street.phrase} small /></div>
          <div className="example-en">{r.street.english}</div>
        </div>
      )}
      {r.street.phrase && !showStreet && <p className="muted small">🔞 Street version hidden (Settings).</p>}

      <button className="btn btn-wide" onClick={onSave}>📌 Save as a card</button>
      {saved && <p className="small" role="status">{saved}</p>}
    </section>
  );
}
