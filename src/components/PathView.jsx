import { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { PATH, lessonsOf, lessonDone, nextLesson, unitStats } from '../lib/path.js';
import Hero from './Hero.jsx';

export default function PathView({ startLesson, startUnitReview, openDeck }) {
  const { progress, decks } = useStore();
  const next = nextLesson(progress);
  const [open, setOpen] = useState(() => new Set([next ? next.unit : 0]));
  const toggle = (u) => setOpen((s) => {
    const n = new Set(s);
    if (n.has(u)) n.delete(u); else n.add(u);
    return n;
  });

  return (
    <div className="page">
      <Hero />

      {next ? (
        <button className="review-btn" onClick={() => startLesson(next.unit, next.lesson)}>
          <span className="review-title">▶ Continue: Unit {next.unit + 1} · Lesson {next.lesson + 1}</span>
          <span className="review-sub">{PATH[next.unit].emoji} {PATH[next.unit].title}</span>
        </button>
      ) : (
        <div className="panel"><strong>🎉 You finished the whole path!</strong> Keep reviewing with the Decks tab.</div>
      )}

      <p className="muted small">
        Phrases first, the way people actually talk. Each lesson starts with recognizing (pick the meaning),
        then you practice saying it yourself. Grammar boosts are optional.
      </p>

      <ol className="units">
        {PATH.map((unit, u) => {
          const st = unitStats(unit, progress);
          const isOpen = open.has(u);
          const current = next?.unit === u;
          const boost = unit.boost && decks.find((d) => d.id === unit.boost);
          return (
            <li key={unit.id} className={'unit' + (current ? ' current' : '') + (st.complete ? ' complete' : '')}>
              <button className="unit-head" onClick={() => toggle(u)} aria-expanded={isOpen}>
                <span className="unit-emoji">{st.complete ? '✅' : unit.emoji}</span>
                <span className="deck-body">
                  <span className="unit-num">Unit {u + 1}</span>
                  <span className="deck-name">{unit.title}</span>
                  <span className="mini-bar"><span style={{ width: `${(st.done / st.lessons) * 100}%` }} /></span>
                  <span className="deck-meta">{st.done}/{st.lessons} lessons · {st.learned}/{st.total} phrases learned</span>
                </span>
                <span className="chev" aria-hidden>{isOpen ? '▾' : '▸'}</span>
              </button>

              {isOpen && (
                <div className="unit-body">
                  <p className="unit-goal">🎯 You'll be able to: {unit.goal}</p>
                  <div className="lessons">
                    {lessonsOf(unit).map((cards, l) => {
                      const done = lessonDone(cards, progress);
                      const isNext = next?.unit === u && next?.lesson === l;
                      return (
                        <button
                          key={l}
                          className={'lesson' + (done ? ' done' : '') + (isNext ? ' next' : '')}
                          onClick={() => startLesson(u, l)}
                        >
                          <span className="lesson-num">{done ? '✓' : l + 1}</span>
                          <span className="lesson-label">{done ? 'Practice' : isNext ? 'Start' : 'Learn'}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="row">
                    <button className="btn btn-ghost" onClick={() => startUnitReview(u)} disabled={st.done === 0}>🔁 Review unit</button>
                    {boost && (
                      <button className="btn btn-ghost" onClick={() => openDeck(boost.id)}>⚡ {boost.name}</button>
                    )}
                  </div>
                  {boost && <p className="muted small">⚡ Optional grammar boost for this unit.</p>}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
