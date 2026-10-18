import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { checkAnswer, normalize } from '../lib/answer.js';
import { shuffle, dayKey } from '../lib/srs.js';
import { speak, listen, recognitionSupported } from '../lib/speech.js';
import { makeCloze } from '../lib/cloze.js';
import { buildSource, words as sentenceWords, tileText } from '../lib/sentence.js';
import Badges from './Badges.jsx';
import CardDetails from './CardDetails.jsx';
import Speak from './Speak.jsx';

const ACCENT_KEYS = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'];

export const MODES = {
  quiz: { icon: '⌨️', label: 'Type it' },
  flash: { icon: '🃏', label: 'Flashcards' },
  choice: { icon: '🔘', label: 'Multiple choice' },
  cloze: { icon: '🧩', label: 'Fill the blank' },
  build: { icon: '🧱', label: 'Build the sentence' },
  listen: { icon: '🎧', label: 'Listen & type' },
};

/** Cards that can be studied in a given mode. */
export function eligibleCards(cards, kind) {
  if (kind === 'cloze') return cards.filter((c) => makeCloze(c));
  if (kind === 'build') return cards.filter((c) => buildSource(c));
  return cards;
}

function buildQueue(cards, direction) {
  return shuffle(cards).map((card) => ({
    card,
    dir: direction === 'mixed' ? (Math.random() < 0.5 ? 'es-en' : 'en-es') : direction,
  }));
}

/**
 * A study round in one of the MODES. Ends with a score summary and a "Retake missed" button.
 * `pool` is the full deck, used for multiple-choice distractors.
 */
export default function Session({ title, cards, pool, kind, direction, onExit, onNewRound }) {
  const [queue, setQueue] = useState(() => buildQueue(cards, direction));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const { recordAnswer } = useStore();

  const finish = (item, correct, opts) => {
    recordAnswer(item.card.id, correct, opts);
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
  const props = item && { key: index + item.card.id, item, onDone: (c, opts) => finish(item, c, opts) };

  return (
    <div className="session">
      <header className="session-top">
        <button className="icon-btn" onClick={onExit} aria-label="Close">✕</button>
        <div className="session-title">{MODES[kind].icon} {title}</div>
        <div className="session-count">{done ? '' : `${index + 1} / ${queue.length}`}</div>
      </header>
      <div className="bar"><div className="bar-fill" style={{ width: `${(Math.min(index, queue.length) / queue.length) * 100}%` }} /></div>

      {done ? (
        <Summary results={results} onRetake={retake} onNewRound={onNewRound} onExit={onExit} />
      ) : kind === 'flash' ? (
        <FlashCard {...props} />
      ) : kind === 'choice' ? (
        <ChoiceCard {...props} pool={pool} />
      ) : kind === 'cloze' ? (
        <ClozeCard {...props} />
      ) : kind === 'build' ? (
        <BuildCard {...props} pool={pool} />
      ) : kind === 'listen' ? (
        <ListenCard {...props} />
      ) : (
        <QuizCard {...props} />
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
          <Speak text={card.say || card.spanish} />
        </div>
      )}
      <div className="prompt-hint">{spanishSide ? 'What does it mean in English?' : 'How do you say it in Spanish?'}</div>
    </div>
  );
}

function useAutoSpeak(card, when) {
  const { settings } = useStore();
  useEffect(() => {
    if (when && settings.autoSpeak) speak(card.say || card.spanish, { voiceURI: settings.voiceURI });
  }, [when]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Shared "type your answer → feedback → next" flow used by Type it, Fill the blank and Listen.
 */
function TypedAnswer({ card, prompt, answer, lang, extra = [], stripSubject = false, hint, onDone }) {
  const [input, setInput] = useState('');
  const [verdict, setVerdict] = useState(null); // { result, expected, gaveUp? }
  const [override, setOverride] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const nextRef = useRef(null);

  useAutoSpeak(card, verdict !== null);
  useEffect(() => { (verdict ? nextRef : inputRef).current?.focus(); }, [verdict]);

  const check = (e) => {
    e?.preventDefault();
    setVerdict(checkAnswer(input, answer, lang, extra, { stripSubject }));
  };

  const speakAnswer = () => {
    setListening(true);
    listen({
      onResult: (alts) => {
        const best = alts.find((a) => checkAnswer(a, answer, lang, extra, { stripSubject }).result !== 'wrong') || alts[0];
        setInput(best);
        setVerdict(checkAnswer(best, answer, lang, extra, { stripSubject }));
      },
      onEnd: () => setListening(false),
    });
  };

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
      {prompt}

      {!verdict ? (
        <form onSubmit={check} className="answer-form">
          {hint && showHint && <div className="hint">💡 {hint}</div>}
          <div className="input-row">
          <input
            ref={inputRef}
            className="answer-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'es' ? 'Escribe en español…' : 'Type the English…'}
            lang={lang}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
          />
          {lang === 'es' && recognitionSupported && (
            <button type="button" className={'mic' + (listening ? ' on' : '')} onClick={speakAnswer} aria-label="Say it">🎤</button>
          )}
          </div>
          {lang === 'es' && (
            <div className="accent-keys">
              {ACCENT_KEYS.map((k) => (
                <button type="button" key={k} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(k)}>{k}</button>
              ))}
            </div>
          )}
          <div className="row">
            {hint && !showHint ? (
              <button type="button" className="btn btn-ghost" onClick={() => setShowHint(true)}>Hint</button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => setVerdict({ result: 'wrong', expected: '', gaveUp: true })}>
                Show answer
              </button>
            )}
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

function QuizCard({ item, onDone }) {
  const { card, dir } = item;
  const lang = dir === 'es-en' ? 'en' : 'es';
  useAutoSpeak(card, dir === 'es-en');
  return (
    <TypedAnswer
      card={card}
      prompt={<Prompt item={item} />}
      answer={lang === 'en' ? card.english : card.spanish}
      lang={lang}
      extra={lang === 'es' ? card.accept : []}
      stripSubject={!!card.verb}
      onDone={onDone}
    />
  );
}

function ClozeCard({ item, onDone }) {
  const { card } = item;
  const cloze = useMemo(() => makeCloze(card), [card]);
  const words = cloze.answer.split(/\s+/);
  const hint = words.map((w) => w[0] + '·'.repeat(Math.max(0, w.length - 1))).join(' ');
  return (
    <TypedAnswer
      card={card}
      prompt={(
        <div className="prompt">
          <Badges card={card} />
          <div className="cloze" lang="es">
            {cloze.before}
            <span className="blank">{' '.repeat(Math.min(14, cloze.answer.length + 2))}</span>
            {cloze.after}
          </div>
          <div className="prompt-hint">{card.example_en}</div>
        </div>
      )}
      answer={cloze.answer}
      lang="es"
      hint={card.notes ? `${hint} · ${card.notes}` : hint}
      onDone={onDone}
    />
  );
}

function ListenCard({ item, onDone }) {
  const { card } = item;
  const { settings } = useStore();
  const text = card.say || card.spanish;
  const play = (slow) => speak(text, { slow, voiceURI: settings.voiceURI });
  useEffect(() => { play(false); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <TypedAnswer
      card={card}
      prompt={(
        <div className="prompt">
          <div className="listen-btns">
            <button type="button" className="listen-big" onClick={() => play(false)} aria-label="Play again">🔊</button>
            <button type="button" className="listen-slow" onClick={() => play(true)} aria-label="Play slowly">🐢</button>
          </div>
          <div className="prompt-hint">Type what you hear (in Spanish)</div>
        </div>
      )}
      answer={card.spanish}
      lang="es"
      extra={[...(card.accept || []), ...(card.say ? [card.say] : [])]}
      stripSubject={!!card.verb}
      hint={card.english}
      onDone={onDone}
    />
  );
}

function pickDistractors(card, pool, side) {
  const text = (c) => (side === 'en' ? c.english : c.spanish);
  const seen = new Set([normalize(text(card), side)]);
  const related = (c) => (card.verb && (c.verb === card.verb || c.person === card.person)) || c.register === card.register;
  const others = shuffle(pool.filter((c) => c.id !== card.id));
  const ordered = [...others.filter(related), ...others.filter((c) => !related(c))];
  const out = [];
  for (const c of ordered) {
    const key = normalize(text(c), side);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
    if (out.length === 3) break;
  }
  return out;
}

function ChoiceCard({ item, pool, onDone }) {
  const { card, dir } = item;
  const side = dir === 'es-en' ? 'en' : 'es';
  const options = useMemo(() => shuffle([card, ...pickDistractors(card, pool, side)]), [card, pool, side]);
  const [picked, setPicked] = useState(null);
  const nextRef = useRef(null);
  useAutoSpeak(card, dir === 'es-en' || picked !== null);
  useEffect(() => { if (picked) nextRef.current?.focus(); }, [picked]);
  const correct = picked?.id === card.id;

  return (
    <div className="card-area">
      <Prompt item={item} />
      <div className="choices">
        {options.map((o) => {
          const state = !picked ? '' : o.id === card.id ? ' is-right' : o.id === picked.id ? ' is-wrong' : ' is-dim';
          return (
            <button key={o.id} className={'choice' + state} disabled={!!picked} onClick={() => setPicked(o)} lang={side}>
              {side === 'en' ? o.english : o.spanish}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={'feedback ' + (correct ? 'is-right' : 'is-wrong')}>
          <div className="verdict">{correct ? '✅ ¡Correcto!' : '❌ Not quite.'}</div>
          <CardDetails card={card} />
          <button ref={nextRef} className="btn btn-primary btn-wide" onClick={() => onDone(correct)}>Next →</button>
        </div>
      )}
    </div>
  );
}

function BuildCard({ item, pool, onDone }) {
  const { card } = item;
  const src = useMemo(() => buildSource(card), [card]);
  const tiles = useMemo(() => {
    const own = src.words.map((w, i) => tileText(w, i));
    const lower = new Set(own.map((w) => w.toLowerCase()));
    const extras = shuffle(pool.filter((c) => c.id !== card.id).flatMap((c) => sentenceWords(c.spanish)))
      .map((w) => w.toLowerCase())
      .filter((w) => !lower.has(w) && lower.add(w))
      .slice(0, 3);
    return shuffle([...own, ...extras]).map((text, id) => ({ id, text }));
  }, [src, pool, card]);
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(null);
  const nextRef = useRef(null);
  useEffect(() => { if (checked) nextRef.current?.focus(); }, [checked]);

  const target = normalize(src.words.join(' '), 'es');
  const check = () => setChecked({ correct: normalize(placed.map((t) => t.text).join(' '), 'es') === target });
  const used = new Set(placed.map((t) => t.id));

  return (
    <div className="card-area">
      <div className="prompt">
        <Badges card={card} />
        <div className="prompt-text prompt-en">{src.en}</div>
        <div className="prompt-hint">Tap the words in order</div>
      </div>
      <div className="build-line" aria-label="Your sentence">
        {placed.map((t) => (
          <button key={t.id} className="tile" disabled={!!checked} onClick={() => setPlaced(placed.filter((p) => p.id !== t.id))}>{t.text}</button>
        ))}
      </div>
      <div className="bank">
        {tiles.map((t) => (
          <button key={t.id} className={'tile' + (used.has(t.id) ? ' used' : '')} disabled={used.has(t.id) || !!checked} onClick={() => setPlaced([...placed, t])}>
            {t.text}
          </button>
        ))}
      </div>
      {!checked ? (
        <div className="row">
          <button className="btn btn-ghost" onClick={() => setChecked({ correct: false, gaveUp: true })}>Show answer</button>
          <button className="btn btn-primary" disabled={!placed.length} onClick={check}>Check</button>
        </div>
      ) : (
        <div className={'feedback ' + (checked.correct ? 'is-right' : 'is-wrong')}>
          <div className="verdict">
            {checked.correct ? '✅ ¡Correcto!' : <>❌ It's: <strong lang="es">{src.full}</strong></>}{' '}
            <Speak text={src.full} small />
          </div>
          <CardDetails card={card} />
          <button ref={nextRef} className="btn btn-primary btn-wide" onClick={() => onDone(checked.correct)}>Next →</button>
        </div>
      )}
    </div>
  );
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
          <button className="btn btn-miss" onClick={() => onDone(false)}>✗ Missed</button>
          <button className="btn btn-got" onClick={() => onDone(true)}>✓ Got it</button>
          <button className="btn btn-easy" onClick={() => onDone(true, { easy: true })}>⚡ Easy</button>
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
  const { activity, settings } = useStore();
  const missed = useMemo(() => {
    const seen = new Set();
    return results.filter((r) => !r.correct && !seen.has(r.card.id) && seen.add(r.card.id)).map((r) => r.card);
  }, [results]);
  const score = results.filter((r) => r.correct).length;
  const pct = results.length ? Math.round((score / results.length) * 100) : 0;
  const cheer = pct === 100 ? '¡Perfecto! 🔥' : pct >= 80 ? '¡Muy bien! 💪' : pct >= 50 ? '¡Vamo\' a darle! Keep going.' : 'Tranquilo, practice makes perfect.';
  const today = activity[dayKey()]?.reviews || 0;
  const goal = settings.dailyGoal;
  const justHitGoal = goal > 0 && today >= goal && today - results.length < goal;

  return (
    <div className="summary">
      <div className="score">{score}/{results.length}</div>
      <div className="score-pct">{pct}%</div>
      <div className="cheer">{cheer}</div>
      {justHitGoal && <div className="goal-hit">🎯 Daily goal reached! {today}/{goal} today</div>}

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
                <Speak text={c.say || c.spanish} small />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
