import Speak from './Speak.jsx';

// The full "answer" view of a card: Spanish, pronunciation, English, example and notes.
export default function CardDetails({ card }) {
  return (
    <div className="details">
      <div className="details-head">
        <div>
          <div className="details-es" lang="es">{card.spanish}</div>
          <div className="pron">{card.pronunciation}</div>
        </div>
        <Speak text={card.spanish} />
      </div>
      <div className="details-en">{card.english}</div>
      {card.example && (
        <div className="example">
          <div className="example-es" lang="es">
            {card.example} <Speak text={card.example} small />
          </div>
          <div className="example-en">{card.example_en}</div>
        </div>
      )}
      {card.notes && <div className="notes">💡 {card.notes}</div>}
    </div>
  );
}
