import { useStore } from '../lib/store.jsx';
import { streakInfo, dayKey } from '../lib/srs.js';

/** Greeting, streak and daily goal, shown at the top of the Learn and Decks tabs. */
export default function Hero() {
  const { settings, activity } = useStore();
  const today = activity[dayKey()]?.reviews || 0;
  const goal = settings.dailyGoal;
  const { streak, freezes, studiedToday } = streakInfo(activity);

  return (
    <>
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
    </>
  );
}
