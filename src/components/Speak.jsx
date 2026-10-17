import { speak, speechSupported } from '../lib/speech.js';
import { useStore } from '../lib/store.jsx';

export default function Speak({ text, small = false }) {
  const { settings } = useStore();
  if (!speechSupported) return null;
  const say = (slow) => (e) => {
    e.stopPropagation();
    speak(text, { slow, voiceURI: settings.voiceURI });
  };
  return (
    <span className={'speak' + (small ? ' speak-small' : '')}>
      <button type="button" className="icon-btn" onClick={say(false)} aria-label="Listen">🔊</button>
      <button type="button" className="icon-btn" onClick={say(true)} aria-label="Listen slowly">🐢</button>
    </span>
  );
}
