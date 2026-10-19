// Answer checking for quiz mode.
// - Accent / ñ mistakes still count as correct, but get flagged.
// - Any slash/comma-separated meaning is accepted.
// - Small typos are "almost" (the learner can override).

const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is',
  "we're": 'we are', "they're": 'they are', "that's": 'that is', "what's": 'what is',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'cannot',
  "isn't": 'is not', "let's": 'let us', "i'll": 'i will', "you'll": 'you will', "won't": 'will not',
  "i've": 'i have', "you've": 'you have', "we've": 'we have', "they've": 'they have',
};

export function stripAccents(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

function removeParens(s) {
  return s.replace(/\([^)]*\)/g, ' ');
}

/** Lowercase, drop punctuation and filler words; keeps accents. */
export function normalize(s, lang) {
  let t = removeParens(s.toLowerCase())
    .replace(/[’‘`]/g, "'")
    .replace(/[¿?¡!.,;:"“”…]/g, ' ')
    .replace(/-/g, ' ');
  if (lang === 'en') {
    t = t.replace(/[a-z']+/g, (w) => CONTRACTIONS[w] || w).replace(/'/g, '');
    t = t.replace(/\s+/g, ' ').trim().replace(/^(to|a|an|the) /, '');
  } else {
    t = t.replace(/'/g, '');
  }
  return t.replace(/\s+/g, ' ').trim();
}

/** "he/she spoke" -> ["he spoke", "she spoke"] */
function expandSlashes(s) {
  let results = [''];
  for (const tok of s.split(' ')) {
    const options = tok.includes('/') ? tok.split('/').filter(Boolean) : [tok];
    results = results.flatMap((r) => options.map((o) => (r ? r + ' ' + o : o)));
  }
  return results;
}

/** All accepted answers for a card side. */
export function alternatives(text, lang, extra = []) {
  const base = removeParens(text);
  let pieces;
  if (lang === 'es') {
    pieces = base.split('/');
  } else {
    pieces = base.split(/\s\/\s|[,;]/).flatMap((p) => expandSlashes(p.trim()));
  }
  let all = [text, ...pieces, ...extra]
    .map((p) => normalize(p, lang))
    .filter(Boolean);
  if (lang === 'es') {
    // "el maestro" also accepts "maestro"
    all = all.flatMap((a) => [a, a.replace(/^(el|la|los|las|un|una) (?=\S)/, '')]);
  }
  return [...new Set(all)];
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

function matches(user, alt) {
  if (!alt.includes('*')) return user === alt;
  const re = new RegExp('^' + alt.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '(?:[a-z]|\\*)') + '$');
  return re.test(user);
}

function typoAllowance(len) {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  if (len <= 15) return 2;
  return Math.floor(len / 8);
}

/**
 * @returns {{ result: 'correct'|'accent'|'almost'|'wrong', expected: string }}
 * expected = the accepted answer closest to what was typed (with correct accents).
 */
export function checkAnswer(input, answerText, lang, extra = [], { stripSubject = false } = {}) {
  let user = normalize(input, lang);
  if (stripSubject && lang === 'es') {
    user = user.replace(/^(yo|tu|tú|el|él|ella|usted|nosotros|nosotras|ellos|ellas|ustedes) (?=\S)/, '');
  }
  const alts = alternatives(answerText, lang, extra);
  if (!user) return { result: 'wrong', expected: alts[0] || answerText };

  const exact = alts.find((a) => matches(user, a));
  if (exact) return { result: 'correct', expected: exact };

  const userBare = stripAccents(user);
  const accentMatch = alts.find((a) => matches(userBare, stripAccents(a)));
  if (accentMatch) return { result: 'accent', expected: accentMatch };

  let best = null;
  let bestDist = Infinity;
  for (const a of alts) {
    const d = levenshtein(userBare, stripAccents(a));
    if (d < bestDist) { bestDist = d; best = a; }
  }
  if (best && bestDist <= typoAllowance(best.length)) return { result: 'almost', expected: best };
  return { result: 'wrong', expected: alts[1] || alts[0] || answerText };
}

