import { useStore } from '../lib/store.jsx';
import { visibleDecks, visibleCards, allVisibleCards } from '../lib/decks.js';
import { isLearned, streak, dayKey, dueCount } from '../lib/srs.js';
import Speak from './Speak.jsx';

function lastDays(n) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.unshift({ key: dayKey(d), label: d.toLocaleDateString(undefined, { weekday: 'narrow' }) });
    d.setDate(d.getDate() - 1);
  }
  return out;
}

export default function ProgressView() {
  const { settings, progress, activity, decks } = useStore();
  const all = allVisibleCards(settings, decks);
  const learned = all.filter((c) => isLearned(progress[c.id])).length;
  const records = all.map((c) => progress[c.id]).filter(Boolean);
  const right = records.reduce((n, r) => n + r.right, 0);
  const total = records.reduce((n, r) => n + r.right + r.wrong, 0);
  const week = lastDays(7).map((d) => ({ ...d, reviews: activity[d.key]?.reviews || 0 }));
  const maxWeek = Math.max(1, ...week.map((d) => d.reviews));
  const trouble = all
    .filter((c) => progress[c.id]?.wrong > 0)
    .sort((a, b) => progress[b.id].wrong - progress[a.id].wrong || progress[a.id].box - progress[b.id].box)
    .slice(0, 10);

  return (
    <div className="page">
      <header className="page-head"><h1>📈 Progress</h1></header>

      <div className="stats">
        <div><strong>{learned}</strong><span>of {all.length} learned</span></div>
        <div><strong>{total ? Math.round((right / total) * 100) + '%' : '–'}</strong><span>accuracy</span></div>
        <div><strong>🔥 {streak(activity)}</strong><span>day streak</span></div>
        <div><strong>{dueCount(all, progress)}</strong><span>due now</span></div>
      </div>

      <h2 className="phase">Last 7 days</h2>
      <div className="week">
        {week.map((d) => (
          <div key={d.key} className="week-day">
            <div className="week-bar"><span style={{ height: `${(d.reviews / maxWeek) * 100}%` }} /></div>
            <div className="week-num">{d.reviews || ''}</div>
            <div className="week-label">{d.label}</div>
          </div>
        ))}
      </div>

      <h2 className="phase">By deck</h2>
      <ul className="deck-stats">
        {visibleDecks(settings, decks).map((deck) => {
          const cards = visibleCards(deck, settings);
          const recs = cards.map((c) => progress[c.id]).filter(Boolean);
          const r = recs.reduce((n, x) => n + x.right, 0);
          const t = recs.reduce((n, x) => n + x.right + x.wrong, 0);
          const l = cards.filter((c) => isLearned(progress[c.id])).length;
          return (
            <li key={deck.id}>
              <div className="ds-top">
                <span>{deck.emoji} {deck.name}</span>
                <span className="muted">{t ? Math.round((r / t) * 100) + '%' : '–'}</span>
              </div>
              <span className="mini-bar"><span style={{ width: `${(l / cards.length) * 100}%` }} /></span>
              <div className="muted small">{l}/{cards.length} learned · {recs.length} seen</div>
            </li>
          );
        })}
      </ul>

      {trouble.length > 0 && (
        <>
          <h2 className="phase">Most missed</h2>
          <ul className="card-list">
            {trouble.map((c) => (
              <li key={c.id}>
                <div className="cl-main">
                  <span className="cl-es" lang="es">{c.spanish}</span>
                  <span className="cl-en">{c.english}</span>
                </div>
                <div className="cl-side">
                  <span className="miss-count">✗ {progress[c.id].wrong}</span>
                  <Speak text={c.say || c.spanish} small />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
