import { useCallback, useEffect, useState } from 'react';
import { useStore } from './lib/store.jsx';
import { DECKS, visibleCards, allVisibleCards } from './lib/decks.js';
import { pickSession } from './lib/srs.js';
import Home from './components/Home.jsx';
import DeckView from './components/DeckView.jsx';
import Session from './components/Session.jsx';
import ProgressView from './components/ProgressView.jsx';
import Settings from './components/Settings.jsx';

const TABS = [
  ['home', '📚', 'Decks'],
  ['progress', '📈', 'Progress'],
  ['settings', '⚙️', 'Settings'],
];

export default function App() {
  const { settings, progress } = useStore();
  // A small screen stack, synced with browser history so the phone's back button works.
  const [stack, setStack] = useState([{ name: 'home' }]);
  const screen = stack[stack.length - 1];

  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
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

  const buildSession = ({ cards, kind, title, deckId, mode }) => {
    const size = settings.sessionSize || (deckId ? 0 : 25);
    let picked = pickSession(cards, progress, { mode, size });
    if (!picked.length) picked = pickSession(cards, progress, { mode: 'smart', size });
    return { name: 'session', kind, title, deckId, mode, cards: picked, key: Date.now() };
  };
  const cardsFor = (deckId) => (deckId
    ? visibleCards(DECKS.find((d) => d.id === deckId), settings)
    : allVisibleCards(settings));

  const startDeck = (deckId, kind) => {
    const title = DECKS.find((d) => d.id === deckId).name;
    push(buildSession({ cards: cardsFor(deckId), kind, title, deckId, mode: settings.cardMode }));
  };
  const startReview = () => {
    push(buildSession({ cards: cardsFor(null), kind: 'quiz', title: 'Mixed review', mode: 'smart' }));
  };
  const newRound = () => {
    const next = buildSession({ ...screen, cards: cardsFor(screen.deckId) });
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
        kind={screen.kind}
        direction={settings.direction}
        onExit={back}
        onNewRound={newRound}
      />
    );
  } else if (screen.name === 'progress') {
    content = <ProgressView />;
  } else if (screen.name === 'settings') {
    content = <Settings />;
  } else {
    content = <Home openDeck={(deckId) => push({ name: 'deck', deckId })} startReview={startReview} />;
  }

  const showTabs = screen.name !== 'session';
  const activeTab = screen.name === 'deck' ? 'home' : screen.name;

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
