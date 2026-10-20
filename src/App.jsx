import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './lib/store.jsx';
import { visibleCards, allVisibleCards } from './lib/decks.js';
import { pickSession } from './lib/srs.js';
import Home from './components/Home.jsx';
import DeckView from './components/DeckView.jsx';
import Session, { MODES, eligibleCards } from './components/Session.jsx';
import ProgressView from './components/ProgressView.jsx';
import Settings from './components/Settings.jsx';
import Practice from './components/Practice.jsx';
import Dialogue from './components/Dialogue.jsx';
import FixSentence from './components/FixSentence.jsx';
import QuickTranslate from './components/QuickTranslate.jsx';
import ImportDeck from './components/ImportDeck.jsx';
import { drillCards } from './lib/conjugation.js';
import { PATH, lessonsOf, lessonMode, lessonAfter } from './lib/path.js';
import PathView from './components/PathView.jsx';

const TABS = [
  ['path', '🗺️', 'Learn'],
  ['home', '📚', 'Decks'],
  ['practice', '🏋️', 'Practice'],
  ['progress', '📈', 'Progress'],
  ['settings', '⚙️', 'Settings'],
];

export default function App() {
  const { settings, progress, decks } = useStore();
  // A small screen stack, synced with browser history so the phone's back button works.
  const [stack, setStack] = useState([{ name: 'path' }]);
  const screen = stack[stack.length - 1];

  useEffect(() => {
    const onPop = () => {
      setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const push = useCallback((next) => {
    window.history.pushState({}, '');
    setStack((s) => [...s, next]);
    window.scrollTo(0, 0);
  }, []);
  const back = useCallback(() => window.history.back(), []);
  const switchTab = (name) => {
    setStack([{ name }]);
    window.scrollTo(0, 0);
  };

  const buildSession = ({ cards: pool, kind, title, deckId, mode }) => {
    const size = settings.sessionSize || (deckId ? 0 : 25);
    const cards = eligibleCards(pool, kind);
    let picked = pickSession(cards, progress, { mode, size });
    if (!picked.length) picked = pickSession(cards, progress, { mode: 'smart', size });
    return { name: 'session', kind, title, deckId, mode, pool, cards: picked, key: Date.now() };
  };
  const cardsFor = (deckId) => (deckId
    ? visibleCards(decks.find((d) => d.id === deckId) || { cards: [] }, settings)
    : allVisibleCards(settings, decks));

  const startDeck = (deckId, kind) => {
    const title = `${decks.find((d) => d.id === deckId)?.name ?? 'Deck'} · ${MODES[kind].label}`;
    push(buildSession({ cards: cardsFor(deckId), kind, title, deckId, mode: settings.cardMode }));
  };
  const startReview = () => {
    push(buildSession({ cards: cardsFor(null), kind: 'quiz', title: 'Mixed review', mode: 'smart' }));
  };
  const startMistakes = () => {
    push(buildSession({ cards: cardsFor(null), kind: 'quiz', title: 'My mistakes', mode: 'weak' }));
  };
  const startConjugation = async (opts) => {
    const { default: data } = await import('./data/conjugations.json');
    const rebuild = () => {
      const cards = drillCards(data, opts);
      return { name: 'session', kind: 'quiz', title: 'Conjugation', direction: 'en-es', pool: cards, cards, rebuild, key: Date.now() };
    };
    push(rebuild());
  };
  // Learn path lessons. progressRef keeps "New round" / "Next lesson" using the latest progress.
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const cardIndex = useMemo(() => new Map(decks.flatMap((d) => d.cards.map((c) => [c.id, c]))), [decks]);
  const pathCards = (ids) => ids.map((id) => cardIndex.get(id)).filter((c) => c && (settings.showVulgar || c.register !== 'vulgar'));

  const lessonScreen = (u, l) => {
    const ids = lessonsOf(PATH[u])[l];
    const mode = lessonMode(ids, progressRef.current);
    const after = lessonAfter(u, l);
    return {
      name: 'session',
      kind: mode.kind,
      direction: mode.direction,
      title: `Unit ${u + 1} · Lesson ${l + 1} · ${mode.label}`,
      cards: pathCards(ids),
      pool: pathCards(PATH[u].cards),
      rebuild: () => lessonScreen(u, l),
      next: after ? () => lessonScreen(after.unit, after.lesson) : null,
      key: Date.now(),
    };
  };
  const startLesson = (u, l) => push(lessonScreen(u, l));
  const startUnitReview = (u) => {
    const unitReview = () => {
      const pool = pathCards(PATH[u].cards);
      const practiced = pool.filter((c) => progressRef.current[c.id]?.right > 0);
      return {
        name: 'session', kind: 'quiz', direction: 'mixed', title: `Unit ${u + 1} · Review`,
        cards: pickSession(practiced.length ? practiced : pool, progressRef.current, { mode: 'smart', size: 12 }),
        pool, rebuild: unitReview, key: Date.now(),
      };
    };
    push(unitReview());
  };
  const goNext = () => setStack((s) => [...s.slice(0, -1), screen.next()]);

  const newRound = () => {
    const next = screen.rebuild ? screen.rebuild() : buildSession({ ...screen, cards: cardsFor(screen.deckId) });
    setStack((s) => [...s.slice(0, -1), next]);
  };

  let content;
  if (screen.name === 'deck') {
    content = <DeckView deckId={screen.deckId} onBack={back} onStart={(kind) => startDeck(screen.deckId, kind)} />;
  } else if (screen.name === 'session') {
    content = (
      <Session
        key={screen.key}
        title={screen.title}
        cards={screen.cards}
        pool={screen.pool}
        kind={screen.kind}
        direction={screen.direction || settings.direction}
        onExit={back}
        onNewRound={newRound}
        onNext={screen.next ? goNext : undefined}
      />
    );
  } else if (screen.name === 'practice') {
    content = (
      <Practice
        startConjugation={startConjugation}
        openDialogue={(id) => push({ name: 'dialogue', id })}
        openFix={() => push({ name: 'fix' })}
        openTranslate={() => push({ name: 'translate' })}
      />
    );
  } else if (screen.name === 'translate') {
    content = <QuickTranslate onBack={back} openSettings={() => switchTab('settings')} />;
  } else if (screen.name === 'import') {
    content = (
      <ImportDeck
        onBack={back}
        openDeck={(deckId) => setStack((s) => [...s.slice(0, -1), { name: 'deck', deckId }])}
      />
    );
  } else if (screen.name === 'fix') {
    content = <FixSentence onBack={back} openSettings={() => switchTab('settings')} />;
  } else if (screen.name === 'dialogue') {
    content = <Dialogue id={screen.id} onBack={back} />;
  } else if (screen.name === 'progress') {
    content = <ProgressView />;
  } else if (screen.name === 'settings') {
    content = <Settings />;
  } else if (screen.name === 'path') {
    content = (
      <PathView
        startLesson={startLesson}
        startUnitReview={startUnitReview}
        openDeck={(deckId) => push({ name: 'deck', deckId })}
      />
    );
  } else {
    content = <Home openDeck={(deckId) => push({ name: 'deck', deckId })} startReview={startReview} startMistakes={startMistakes} openImport={() => push({ name: 'import' })} />;
  }

  const showTabs = screen.name !== 'session';
  const activeTab = screen.name === 'deck' || screen.name === 'import' ? 'home' : ['dialogue', 'fix', 'translate'].includes(screen.name) ? 'practice' : screen.name;

  return (
    <div className={'app' + (showTabs ? ' has-tabs' : '')}>
      <main>{content}</main>
      {showTabs && (
        <nav className="tabs">
          {TABS.map(([name, icon, label]) => (
            <button key={name} className={activeTab === name ? 'on' : ''} onClick={() => switchTab(name)}>
              <span className="tab-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
