// Text-to-speech with the browser's built-in Spanish voices.
const PREFERRED = ['es-do', 'es-us', 'es-mx', 'es-419', 'es-pr', 'es-cu', 'es-co'];

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function spanishVoices() {
  if (!speechSupported) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith('es'));
}

export function onVoicesChanged(cb) {
  if (!speechSupported) return () => {};
  window.speechSynthesis.addEventListener('voiceschanged', cb);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', cb);
}

function pickVoice(voiceURI) {
  const voices = spanishVoices();
  if (voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === voiceURI);
    if (chosen) return chosen;
  }
  for (const lang of PREFERRED) {
    const v = voices.find((x) => x.lang.toLowerCase().replace('_', '-') === lang);
    if (v) return v;
  }
  return voices[0] || null;
}

export function cleanForSpeech(text) {
  return text
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s\/\s/g, ', ')
    .replace(/[—–[\]]/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speak(text, { slow = false, voiceURI = '' } = {}) {
  if (!speechSupported || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
  const voice = pickVoice(voiceURI);
  if (voice) u.voice = voice;
  u.lang = voice?.lang || 'es-US';
  u.rate = slow ? 0.6 : 0.95;
  synth.speak(u);
}
