import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { speak, speakSequence, listen, recognitionSupported } from '../lib/speech.js';
import { checkAnswer } from '../lib/answer.js';
import DIALOGUES from '../data/dialogues.json';
import Speak from './Speak.jsx';

const YOU = 'Dan';

export default function Dialogue({ id, onBack }) {
  const d = DIALOGUES.find((x) => x.id === id);
  const [mode, setMode] = useState('read');
  return (
    <div className="page">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
        <h1 lang="es">{d.emoji} {d.title}</h1>
      </header>
      <p className="muted">{d.setting}</p>
      <div className="segmented">
        <button className={mode === 'read' ? 'on' : ''} onClick={() => setMode('read')}>👂 Listen & read</button>
        <button className={mode === 'play' ? 'on' : ''} onClick={() => setMode('play')}>🎭 Play your part</button>
      </div>
      {mode === 'read' ? <ReadMode d={d} /> : <PlayMode key={id} d={d} />}
      {d.notes && (
        <section className="panel">
          <h3 className="panel-title">💡 Notes</h3>
          <ul className="notes-list">{d.notes.map((n) => <li key={n}>{n}</li>)}</ul>
        </section>
      )}
    </div>
  );
}

function Bubble({ line, showEn, onTap }) {
  const mine = line.who === YOU;
  return (
    <div className={'bubble-row' + (mine ? ' mine' : '')}>
      <div className="bubble" role="button" tabIndex={0} onClick={onTap} onKeyDown={(e) => e.key === 'Enter' && onTap?.()}>
        <div className="bubble-who">{line.who}</div>
        <div lang="es">{line.es} <Speak text={line.es} small /></div>
        {showEn && <div className="bubble-en">{line.en}</div>}
      </div>
    </div>
  );
}

function ReadMode({ d }) {
  const { settings } = useStore();
  const [allEn, setAllEn] = useState(false);
  const [open, setOpen] = useState({});
  const playAll = () => speakSequence(d.lines.map((l) => ({ text: l.es, alt: l.who !== YOU })), { voiceURI: settings.voiceURI });
  return (
    <>
      <div className="row">
        <button className="btn" onClick={playAll}>▶ Play all</button>
        <button className="btn btn-ghost" onClick={() => setAllEn((v) => !v)}>{allEn ? 'Hide English' : 'Show English'}</button>
      </div>
      <div className="chat">
        {d.lines.map((l, i) => (
          <Bubble key={i} line={l} showEn={allEn || open[i]} onTap={() => setOpen({ ...open, [i]: !open[i] })} />
        ))}
      </div>
      <p className="muted small">Tap a line to see the English.</p>
    </>
  );
}

function PlayMode({ d }) {
  const { settings } = useStore();
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [heard, setHeard] = useState(null);
  const [listening, setListening] = useState(false);
  const line = d.lines[i];
  const done = i >= d.lines.length;
  const yourTurn = !done && line.who === YOU;

  useEffect(() => {
    if (!done && !yourTurn) speak(line.es, { voiceURI: settings.voiceURI });
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = () => {
    setI(i + 1);
    setRevealed(false);
    setHeard(null);
  };
  const reveal = () => {
    setRevealed(true);
    speak(line.es, { voiceURI: settings.voiceURI });
  };
  const sayIt = () => {
    setListening(true);
    listen({
      onResult: (alts) => {
        const results = alts.map((a) => ({ text: a, r: checkAnswer(a, line.es, 'es').result }));
        setHeard(results.find((x) => x.r !== 'wrong') || results[0]);
        reveal();
      },
      onEnd: () => setListening(false),
    });
  };

  return (
    <>
      <div className="chat">
        {d.lines.slice(0, i).map((l, k) => <Bubble key={k} line={l} showEn={false} />)}
        {!done && !yourTurn && <Bubble line={line} showEn />}
        {yourTurn && (
          <div className="your-turn">
            <div className="muted small">Your turn. Say it in Spanish:</div>
            <div className="your-turn-en">{line.en}</div>
            {revealed && (
              <div className="your-turn-es" lang="es">{line.es} <Speak text={line.es} small /></div>
            )}
            {heard && (
              <div className={'heard ' + (heard.r === 'wrong' ? 'bad' : 'good')}>
                {heard.r === 'wrong' ? '🤔' : '✅'} I heard: “{heard.text}”
              </div>
            )}
          </div>
        )}
      </div>
      {done ? (
        <div className="panel">
          <div className="verdict">🎉 ¡Muy bien! Conversation complete.</div>
          <button className="btn btn-primary btn-wide" onClick={() => { setI(0); setRevealed(false); setHeard(null); }}>Again</button>
        </div>
      ) : yourTurn && !revealed ? (
        <div className="row">
          {recognitionSupported && (
            <button className={'btn' + (listening ? ' btn-primary' : '')} onClick={sayIt}>🎤 Say it</button>
          )}
          <button className="btn btn-primary" onClick={reveal}>Show me</button>
        </div>
      ) : (
        <button className="btn btn-primary btn-wide" onClick={next}>Next →</button>
      )}
    </>
  );
}
