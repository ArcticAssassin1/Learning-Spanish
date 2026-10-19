import { useEffect, useRef, useState } from 'react';
import { fixSentence, MAX_INPUT } from '../lib/fixSentence.js';
import { load, save } from '../lib/storage.js';
import Speak from './Speak.jsx';

const ACCENT_KEYS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', '¿', '¡'];
const HISTORY_SIZE = 10;

export default function FixSentence({ onBack, openSettings }) {
  const apiKey = load('apiKey', '');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shown, setShown] = useState(null); // { original, result }
  const [history, setHistory] = useState(() => {
    const h = load('fixHistory', []);
    return Array.isArray(h)
      ? h.filter((e) => e && typeof e.original === 'string' && typeof e.result?.corrected === 'string' && Array.isArray(e.result.fixes))
      : [];
  });
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = async (e) => {
    e?.preventDefault();
    const original = text.trim();
    if (!original || busy) return;
    setBusy(true);
    setError('');
    abortRef.current = new AbortController();
    const { result, error: err } = await fixSentence(original, apiKey, { signal: abortRef.current.signal });
    setBusy(false);
    if (err !== undefined) {
      setError(err);
      return;
    }
    const entry = { original, result, at: Date.now() };
    setShown(entry);
    const next = [entry, ...history].slice(0, HISTORY_SIZE);
    setHistory(next);
    save('fixHistory', next);
  };

  const insert = (ch) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText((text.slice(0, start) + ch + text.slice(end)).slice(0, MAX_INPUT));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
        <h1>✍️ Fix my sentence</h1>
      </header>
      <p className="muted">Write a sentence in Spanish. Claude corrects it and explains every fix.</p>

      {!apiKey ? (
        <section className="panel">
          <p>This feature uses Claude, so it needs your own Claude API key (about a cent per sentence).</p>
          <button className="btn btn-primary btn-wide" onClick={openSettings}>Add API key in Settings</button>
        </section>
      ) : (
        <form className="answer-form" onSubmit={submit}>
          <textarea
            ref={inputRef}
            className="answer-input fix-input"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_INPUT))}
            placeholder="Ej: Ayer yo voy al gimnasio con mi amigos…"
            lang="es"
            rows={3}
            maxLength={MAX_INPUT}
            autoCapitalize="sentences"
            autoCorrect="off"
            spellCheck={false}
          />
          <div className="accent-keys">
            {ACCENT_KEYS.map((k) => (
              <button type="button" key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k)}>{k}</button>
            ))}
          </div>
          <div className="row">
            <span className="muted small fix-count">{text.length}/{MAX_INPUT}</span>
            <button type="submit" className="btn btn-primary" disabled={!text.trim() || busy}>
              {busy ? 'Checking…' : 'Fix it'}
            </button>
          </div>
          {error && <div className="fix-error" role="alert">{error}</div>}
        </form>
      )}

      {shown && <FixResult entry={shown} />}

      {history.length > 0 && (
        <>
          <h2 className="phase">Recent</h2>
          <ul className="card-list">
            {history.map((h) => (
              <li key={h.at}>
                <button className="history-item" onClick={() => { setShown(h); window.scrollTo(0, 0); }}>
                  <span className="cl-en"><s>{h.original}</s></span>
                  <span className="cl-es" lang="es">{h.result.corrected}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function FixResult({ entry }) {
  const { original, result: r } = entry;
  return (
    <section className={'feedback ' + (r.is_correct ? 'is-right' : 'is-wrong')} aria-live="polite">
      {r.is_correct ? (
        <div className="verdict">✅ ¡Perfecto! That's correct.</div>
      ) : (
        <div className="fix-line"><span aria-hidden>❌</span> <s lang="es">{original}</s></div>
      )}
      <div className="details-head">
        <div>
          <div className="details-es" lang="es">{r.is_correct ? '' : '✅ '}{r.corrected}</div>
          <div className="pron">{r.pronunciation}</div>
        </div>
        <Speak text={r.corrected} />
      </div>
      {r.translation && <div className="details-en">{r.translation}</div>}

      {r.fixes.length > 0 && (
        <table className="fix-table">
          <thead>
            <tr><th>You wrote</th><th>Correct</th><th>Why</th></tr>
          </thead>
          <tbody>
            {r.fixes.map((f, i) => (
              <tr key={i}>
                <td lang="es"><s>{f.wrong}</s></td>
                <td lang="es"><strong>{f.right}</strong></td>
                <td>{f.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {r.natural && (
        <div className="example">
          <div className="muted small">🌴 How people would say it</div>
          <div className="example-es" lang="es">{r.natural} <Speak text={r.natural} small /></div>
        </div>
      )}
      {r.tip && <div className="notes">💡 {r.tip}</div>}
    </section>
  );
}
