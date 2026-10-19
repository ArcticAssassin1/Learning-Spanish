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

/** Speak several lines in a row. Lines with alt: true use a second Spanish voice when there is one. */
export function speakSequence(lines, { slow = false, voiceURI = '' } = {}) {
  if (!speechSupported) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const main = pickVoice(voiceURI);
  const other = spanishVoices().find((v) => v !== main && v.lang.slice(0, 2) === (main?.lang || 'es').slice(0, 2));
  for (const { text, alt } of lines) {
    const u = new SpeechSynthesisUtterance(cleanForSpeech(text));
    const voice = alt && other ? other : main;
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'es-US';
    u.rate = slow ? 0.6 : 0.95;
    synth.speak(u);
  }
}

// Speech recognition (speak your answer). Chrome on Android and Safari on iPhone support it.
const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const recognitionSupported = !!Recognition;

/** Listen once in Spanish. onResult gets the list of possible transcripts. Returns a stop function. */
export function listen({ onResult, onEnd, lang = 'es-US' }) {
  if (!Recognition) return () => {};
  const r = new Recognition();
  r.lang = lang;
  r.interimResults = false;
  r.maxAlternatives = 3;
  r.onresult = (e) => onResult([...e.results[0]].map((a) => a.transcript));
  r.onerror = () => onEnd?.();
  r.onend = () => onEnd?.();
  try {
    r.start();
  } catch {
    onEnd?.(); // e.g. microphone blocked or already listening
  }
  return () => r.abort();
}
