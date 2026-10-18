import { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { TENSES, VERB_SETS } from '../lib/conjugation.js';
import DIALOGUES from '../data/dialogues.json';
import LIBRARY from '../data/library.json';

const SIZES = [[10, '10'], [15, '15'], [25, '25']];

export default function Practice({ startConjugation, openDialogue }) {
  const { settings, updateSettings } = useStore();
  const [loading, setLoading] = useState(false);
  const tenses = settings.conjTenses;

  const toggleTense = (t) => {
    const next = tenses.includes(t) ? tenses.filter((x) => x !== t) : [...tenses, t];
    if (next.length) updateSettings({ conjTenses: next });
  };

  const start = async () => {
    setLoading(true);
    try {
      await startConjugation({ set: settings.conjSet, tenses, size: settings.conjSize });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="page-head"><h1>🏋️ Practice</h1></header>

      <section className="panel">
        <h2 className="panel-title">🔤 Conjugation drill</h2>
        <p className="muted small">See the verb, tense and person, type the form. Like SpanishDict and Conjuguemos drills.</p>
        <div className="field-label">Verbs</div>
        <div className="segmented wrap">
          {VERB_SETS.map(([v, t]) => (
            <button key={v} className={settings.conjSet === v ? 'on' : ''} onClick={() => updateSettings({ conjSet: v })}>{t}</button>
          ))}
        </div>
        <div className="field-label">Tenses</div>
        <div className="chips">
          {Object.entries(TENSES).map(([t, label]) => (
            <button key={t} className={'chip' + (tenses.includes(t) ? ' on' : '')} aria-pressed={tenses.includes(t)} onClick={() => toggleTense(t)}>
              {label}
            </button>
          ))}
        </div>
        <div className="field-label">How many</div>
        <div className="segmented">
          {SIZES.map(([v, t]) => (
            <button key={v} className={settings.conjSize === v ? 'on' : ''} onClick={() => updateSettings({ conjSize: v })}>{t}</button>
          ))}
        </div>
        <button className="btn btn-primary btn-wide" onClick={start} disabled={loading}>Start drill</button>
      </section>

      <h2 className="phase">💬 Dialogues</h2>
      <p className="muted small">Real-life conversations. Listen, then play your part (the FSI and Pimsleur way).</p>
      <ul className="deck-list">
        {DIALOGUES.map((d) => (
          <li key={d.id}>
            <button className="deck" onClick={() => openDialogue(d.id)}>
              <span className="deck-emoji">{d.emoji}</span>
              <span className="deck-body">
                <span className="deck-name" lang="es">{d.title}</span>
                <span className="deck-meta">{d.setting}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <h2 className="phase">📚 Free library</h2>
      <p className="muted small">{LIBRARY.note}</p>
      {LIBRARY.sections.map((s) => (
        <section key={s.title} className="panel">
          <h3 className="panel-title">{s.title}</h3>
          <ul className="links">
            {s.items.map((it) => (
              <li key={it.url}>
                <a href={it.url} target="_blank" rel="noopener noreferrer">{it.name} ↗</a>
                <span className="muted small">{it.what}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="muted small credit">
        Conjugations: Fred Jehle's Conjugated Spanish Verb Database, compiled by Brian Ghidinelli
        (JSON by miko3k/verbos), CC BY-NC-SA 3.0.
      </p>
    </div>
  );
}
