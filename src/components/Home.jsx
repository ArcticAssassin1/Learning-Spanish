import { useStore } from '../lib/store.jsx';
import { visibleDecks, visibleCards, allVisibleCards, PHASES } from '../lib/decks.js';
import { dueCount, isLearned, streakInfo, dayKey } from '../lib/srs.js';

export default function Home({ openDeck, startReview, startMistakes }) {
  const { settings, progress, activity } = useStore();
  const decks = visibleDecks(settings);
  const all = allVisibleCards(settings);
  const due = dueCount(all, progress);
  const mistakes = all.filter((c) => progress[c.id]?.wrong > 0 && !isLearned(progress[c.id])).length;
  const today = activity[dayKey()]?.reviews || 0;
  const goal = settings.dailyGoal;
  const { streak, freezes, studiedToday } = streakInfo(activity);
  const phases = [...new Set(decks.map((d) => d.phase ?? 0))].sort();

  return (
    <div className="page">
      <header className="hero">
        <div>
          <h1>¡Hola, Dan! 👋</h1>
          <p className="muted">
            {today ? `${today} reviews today. ¡Dale!` : streak ? 'Keep your streak alive today.' : '¿Qué lo qué? Ready for a quick session?'}
          </p>
        </div>
        <div className="streak-box">
          <div className={'streak' + (studiedToday ? ' lit' : '')} title="Day streak">🔥 {streak}</div>
          {freezes > 0 && <div className="freezes" title="Streak freezes: cover a missed day automatically">🧊 ×{freezes}</div>}
        </div>
      </header>

      {goal > 0 && (
        <div className="goal">
          <div className="goal-top">
            <span>🎯 Daily goal</span>
            <span className={today >= goal ? 'goal-done' : 'muted'}>{today >= goal ? '¡Listo! ' : ''}{Math.min(today, goal)}/{goal}</span>
          </div>
          <span className="mini-bar goal-bar"><span style={{ width: `${Math.min(1, today / goal) * 100}%` }} /></span>
        </div>
      )}

      <button className="review-btn" onClick={startReview}>
        <span className="review-title">{due > 0 ? `Review ${due} due card${due === 1 ? '' : 's'}` : 'Quick mixed review'}</span>
        <span className="review-sub">{due > 0 ? 'Missed cards come back first' : 'Mix of new cards from every deck'}</span>
      </button>

      {mistakes > 0 && (
        <button className="mistakes-btn" onClick={startMistakes}>
          <span>🩹 Fix my mistakes</span>
          <span className="due-pill">{mistakes}</span>
        </button>
      )}

      {phases.map((phase) => (
        <section key={phase}>
          <h2 className="phase">{PHASES[phase] || 'More decks'}</h2>
          <ul className="deck-list">
            {decks.filter((d) => (d.phase ?? 0) === phase).map((deck) => {
              const cards = visibleCards(deck, settings);
              const learned = cards.filter((c) => isLearned(progress[c.id])).length;
              const deckDue = dueCount(cards, progress);
              return (
                <li key={deck.id}>
                  <button className="deck" onClick={() => openDeck(deck.id)}>
                    <span className="deck-emoji">{deck.emoji}</span>
                    <span className="deck-body">
                      <span className="deck-name">{deck.name}</span>
                      <span className="deck-meta">{learned}/{cards.length} learned</span>
                      <span className="mini-bar"><span style={{ width: `${(learned / cards.length) * 100}%` }} /></span>
                    </span>
                    {deckDue > 0 && <span className="due-pill">{deckDue} due</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
