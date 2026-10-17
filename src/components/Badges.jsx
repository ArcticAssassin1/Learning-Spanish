import { REGION_FLAGS, REGISTER_LABELS } from '../lib/decks.js';

export default function Badges({ card }) {
  const register = REGISTER_LABELS[card.register];
  return (
    <div className="badges">
      {card.region && card.region !== 'General' && (
        <span className="badge">{REGION_FLAGS[card.region] || ''} {card.region}</span>
      )}
      {register && <span className={'badge badge-' + card.register}>{register}</span>}
      {card.person && <span className="badge badge-person">{card.person}</span>}
    </div>
  );
}
