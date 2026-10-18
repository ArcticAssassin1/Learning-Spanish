import Speak from './Speak.jsx';
import { markedParts, stripBrackets } from '../lib/cloze.js';

// The full "answer" view of a card: Spanish, pronunciation, English, example and notes.
export default function CardDetails({ card }) {
  return (
    <div className="details">
      <div className="details-head">
        <div>
          <div className="details-es" lang="es">{card.spanish}</div>
          <div className="pron">{card.pronunciation}</div>
        </div>
        <Speak text={card.say || card.spanish} />
      </div>
      <div className="details-en">{card.english}</div>
      {card.example && (
        <div className="example">
          <div className="example-es" lang="es">
            {markedParts(card.example).map((p, i) => (p.mark ? <mark key={i}>{p.text}</mark> : p.text))}{' '}
            <Speak text={stripBrackets(card.example)} small />
          </div>
          <div className="example-en">{card.example_en}</div>
        </div>
      )}
      {card.notes && <div className="notes">💡 {card.notes}</div>}
    </div>
  );
}
