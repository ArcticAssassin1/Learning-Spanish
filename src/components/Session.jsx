import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { checkAnswer } from '../lib/answer.js';
import { shuffle } from '../lib/srs.js';
import { speak } from '../lib/speech.js';
import Badges from './Badges.jsx';
import CardDetails from './CardDetails.jsx';
import Speak from './Speak.jsx';

const ACCENT_KEYS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];

function buildQueue(cards, direction) {
  return shuffle(cards).map((card) => ({
    card,
    dir: direction === 'mixed' ? (Math.random() < 0.5 ? 'es-en' : 'en-es') : direction,
  }));
}

/**
 * A study round. kind = 'quiz' (type the answer) or 'flash' (flip cards).
 * Ends with a score summary and a "Retake missed" button.
 */
export default function Session({ title, cards, kind, direction, onExit, onNewRound }) {
  const [queue, setQueue] = useState(() => buildQueue(cards, direction));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const { recordAnswer } = useStore();

  const finish = (item, correct) => {
    recordAnswer(item.card.id, correct);
    setResults((r) => [...r, { card: item.card, correct }]);
    setIndex((i) => i + 1);
  };

  const retake = (missed) => {
    setQueue(buildQueue(missed, direction));
    setIndex(0);
    setResults([]);
  };

  const done = index >= queue.length;
  const item = queue[index];

  return (
    <div className="session">
      <header className="session-top">
        <button className="icon-btn" onClick={onExit} aria-label="Close">✕</button>
        <div className="session-title">{title}</div>
        <div className="session-count">{done ? '' : `${index + 1} / ${queue.length}`}</div>
      </header>
      <div className="bar"><div className="bar-fill" style={{ width: `${(Math.min(index, queue.length) / queue.length) * 100}%` }} /></div>

      {done ? (
        <Summary results={results} onRetake={retake} onNewRound={onNewRound} onExit={onExit} />
      ) : kind === 'quiz' ? (
        <QuizCard key={index + item.card.id} item={item} onDone={(c) => finish(item, c)} />
      ) : (
        <FlashCard key={index + item.card.id} item={item} onDone={(c) => finish(item, c)} />
      )}
    </div>
  );
}

function Prompt({ item }) {
  const { card, dir } = item;
  const spanishSide = dir === 'es-en';
  return (
    <div className="prompt">
      <Badges card={card} />
      <div className={'prompt-text' + (spanishSide ? '' : ' prompt-en')} lang={spanishSide ? 'es' : 'en'}>
        {spanishSide ? card.spanish : card.english}
      </div>
      {spanishSide && (
        <div className="prompt-pron">
          <span className="pron">{card.pronunciation}</span>
          <Speak text={card.spanish} />
        </div>
      )}
      <div className="prompt-hint">{spanishSide ? 'What does it mean in English?' : 'How do you say it in Spanish?'}</div>
    </div>
  );
}

function useAutoSpeak(card, when) {
  const { settings } = useStore();
  useEffect(() => {
    if (when && settings.autoSpeak) speak(card.spanish, { voiceURI: settings.voiceURI });
  }, [when]); // eslint-disable-line react-hooks/exhaustive-deps
}

function QuizCard({ item, onDone }) {
  const { card, dir } = item;
  const answerLang = dir === 'es-en' ? 'en' : 'es';
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState(null); // { result, expected }
  const [override, setOverride] = useState(false);
  const inputRef = useRef(null);
  const nextRef = useRef(null);

  useAutoSpeak(card, dir === 'es-en' || verdict !== null);
  useEffect(() => { (verdict ? nextRef : inputRef).current?.focus(); }, [verdict]);

  const check = (e) => {
    e?.preventDefault();
    const answer = answerLang === 'en' ? card.english : card.spanish;
    const extra = answerLang === 'es' ? card.accept || [] : [];
    setVerdict(checkAnswer(input, answer, answerLang, extra, { stripSubject: !!card.verb }));
  };

  const giveUp = () => setVerdict({ result: 'wrong', expected: '', gaveUp: true });

  const insert = (ch) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? input.length;
    const end = el?.selectionEnd ?? input.length;
    setInput(input.slice(0, start) + ch + input.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + ch.length, start + ch.length);
    });
  };

  const correct = verdict && (verdict.result === 'correct' || verdict.result === 'accent' || override);

  return (
    <div className="card-area">
      <Prompt item={item} />

      {!verdict ? (
        <form onSubmit={check} className="answer-form">
          <input
            ref={inputRef}
            className="answer-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={answerLang === 'es' ? 'Escribe en español…' : 'Type the English…'}
            lang={answerLang}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
          />
          {answerLang === 'es' && (
            <div className="accent-keys">
              {ACCENT_KEYS.map((k) => (
                <button type="button" key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k)}>{k}</button>
              ))}
            </div>
          )}
          <div className="row">
            <button type="button" className="btn btn-ghost" onClick={giveUp}>Show answer</button>
            <button type="submit" className="btn btn-primary" disabled={!input.trim()}>Check</button>
          </div>
        </form>
      ) : (
        <div className={'feedback ' + (correct ? 'is-right' : 'is-wrong')}>
          <FeedbackMessage verdict={verdict} input={input} override={override} />
          <CardDetails card={card} />
          <div className="row">
            {!correct && !verdict.gaveUp && (
              <button className="btn btn-ghost" onClick={() => setOverride(true)}>
                {verdict.result === 'almost' ? 'Count it, I knew it' : 'I was right'}
              </button>
            )}
            <button ref={nextRef} className="btn btn-primary" onClick={() => onDone(!!correct)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackMessage({ verdict, input, override }) {
  if (override) return <div className="verdict">👍 Counted as correct.</div>;
  switch (verdict.result) {
    case 'correct':
      return <div className="verdict">✅ ¡Correcto!</div>;
    case 'accent':
      return <div className="verdict">✅ Correct! Watch the accent: <strong lang="es">{verdict.expected}</strong></div>;
    case 'almost':
      return (
        <div className="verdict">
          🤏 Almost! You wrote <s>{input}</s>. Check the spelling: <strong>{verdict.expected}</strong>
        </div>
      );
    default:
      return (
        <div className="verdict">
          ❌ {verdict.gaveUp ? 'Here it is:' : <>Not quite. You wrote <s>{input}</s></>}
        </div>
      );
  }
}

function FlashCard({ item, onDone }) {
  const { card, dir } = item;
  const [flipped, setFlipped] = useState(false);
  useAutoSpeak(card, dir === 'es-en' || flipped);

  return (
    <div className="card-area">
      <div
        role="button"
        tabIndex={0}
        className={'flip' + (flipped ? ' is-flipped' : '')}
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setFlipped((f) => !f))}
        aria-label={flipped ? 'Show front' : 'Flip card'}
      >
        {flipped ? (
          <div className="flip-face flip-back" key="back"><CardDetails card={card} /></div>
        ) : (
          <div className="flip-face" key="front">
            <Prompt item={item} />
            <div className="tap-hint">Tap to flip</div>
          </div>
        )}
      </div>
      {flipped ? (
        <div className="row">
          <button className="btn btn-miss" onClick={() => onDone(false)}>✗ Missed it</button>
          <button className="btn btn-got" onClick={() => onDone(true)}>✓ Got it</button>
        </div>
      ) : (
        <div className="row">
          <button className="btn btn-primary btn-wide" onClick={() => setFlipped(true)}>Flip</button>
        </div>
      )}
    </div>
  );
}

function Summary({ results, onRetake, onNewRound, onExit }) {
  const missed = useMemo(() => {
    const seen = new Set();
    return results.filter((r) => !r.correct && !seen.has(r.card.id) && seen.add(r.card.id)).map((r) => r.card);
  }, [results]);
  const score = results.filter((r) => r.correct).length;
  const pct = results.length ? Math.round((score / results.length) * 100) : 0;
  const cheer = pct === 100 ? '¡Perfecto! 🔥' : pct >= 80 ? '¡Muy bien! 💪' : pct >= 50 ? '¡Vamo\' a darle! Keep going.' : 'Tranquilo, practice makes perfect.';

  return (
    <div className="summary">
      <div className="score">{score}/{results.length}</div>
      <div className="score-pct">{pct}%</div>
      <div className="cheer">{cheer}</div>

      <div className="summary-actions">
        {missed.length > 0 && (
          <button className="btn btn-primary btn-wide" onClick={() => onRetake(missed)}>
            🔁 Retake missed cards ({missed.length})
          </button>
        )}
        <button className="btn btn-wide" onClick={onNewRound}>New round</button>
        <button className="btn btn-ghost btn-wide" onClick={onExit}>Done</button>
      </div>

      {missed.length > 0 && (
        <div className="missed">
          <h3>Missed</h3>
          <ul className="card-list">
            {missed.map((c) => (
              <li key={c.id}>
                <div className="cl-main">
                  <span className="cl-es" lang="es">{c.spanish}</span>
                  <span className="cl-en">{c.english}</span>
                  <span className="pron">{c.pronunciation}</span>
                </div>
                <Speak text={c.spanish} small />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
