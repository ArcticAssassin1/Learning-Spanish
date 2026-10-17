// Builds an English-style pronunciation guide for Spanish text,
// e.g. "corazón" -> "koh-rah-SOHN", "Tranquila, chica" -> "trahn-KEE-lah, CHEE-kah".
// Latin American pronunciation: c/z before e/i = "s", ll/y = "y", v = "b".

const VOWEL_RE = /[aeiouáéíóúü]/;
const ACCENTED = 'áéíóú';
const BASE = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };
const FRONT = /[eiéí]/;
const SOUND = { a: 'ah', e: 'eh', i: 'ee', o: 'oh', u: 'oo' };
const GLIDE = { i: 'y', u: 'w' };
const FALLING = { ai: 'eye', ei: 'ay', oi: 'oy', au: 'ow', eu: 'ehoo', ou: 'oh' };
const CLUSTER_FIRST = new Set(['p', 'b', 'f', 'g', 'k', 't', 'd']);

function vowel(ch) {
  const base = BASE[ch] || ch;
  const accented = ACCENTED.includes(ch);
  return { type: 'V', base, accented, strong: accented || 'aeo'.includes(base) };
}

// Split a lowercase word into consonant / vowel units with their sounds.
function units(w) {
  const out = [];
  for (let i = 0; i < w.length; i++) {
    const c = w[i];
    const next = w[i + 1] || '';
    const C = (sound) => out.push({ type: 'C', sound });
    if (c === 'c' && next === 'h') { C('ch'); i++; }
    else if (c === 'l' && next === 'l') { C('y'); i++; }
    else if (c === 'r' && next === 'r') { C('rr'); i++; }
    else if (c === 'q') { C('k'); if (next === 'u') i++; }
    else if (c === 'g' && next === 'u' && FRONT.test(w[i + 2] || '')) { C('g'); i++; }
    else if (c === 'g') C(FRONT.test(next) ? 'h' : 'g');
    else if (c === 'c') C(FRONT.test(next) ? 's' : 'k');
    else if (c === 'z') C('s');
    else if (c === 'j') C('h');
    else if (c === 'h') C('');
    else if (c === 'ñ') C('ny');
    else if (c === 'v') C('b');
    else if (c === 'x') { C('k'); C('s'); }
    else if (c === 'y') {
      if (VOWEL_RE.test(next)) C('y');
      else out.push({ type: 'V', base: 'i', accented: false, strong: false });
    } else if (VOWEL_RE.test(c)) out.push(vowel(c));
    else C(c);
  }
  return out;
}

function syllabify(us) {
  // Group vowels into nuclei (diphthongs stay together, two strong vowels split).
  const nuclei = []; // { start, end, vowels }
  for (let i = 0; i < us.length; i++) {
    const u = us[i];
    if (u.type !== 'V') continue;
    const last = nuclei[nuclei.length - 1];
    const prev = us[i - 1];
    if (last && last.end === i - 1 && prev.type === 'V' && !(prev.strong && u.strong)
        && !(last.vowels.some((v) => v.strong) && u.strong) && last.vowels.length < 3) {
      last.vowels.push(u);
      last.end = i;
    } else {
      nuclei.push({ start: i, end: i, vowels: [u] });
    }
  }
  if (!nuclei.length) return null;

  const syls = nuclei.map((n) => ({ onset: [], vowels: n.vowels, coda: [] }));
  syls[0].onset = us.slice(0, nuclei[0].start);
  syls[syls.length - 1].coda = us.slice(nuclei[nuclei.length - 1].end + 1);
  for (let k = 0; k < nuclei.length - 1; k++) {
    const cs = us.slice(nuclei[k].end + 1, nuclei[k + 1].start);
    const inseparable = (a, b) => a && b && CLUSTER_FIRST.has(a.sound) && (b.sound === 'l' || b.sound === 'r');
    let split; // index in cs where the next onset starts
    if (cs.length <= 1) split = 0;
    else if (inseparable(cs[cs.length - 2], cs[cs.length - 1])) split = cs.length - 2;
    else split = cs.length - 1;
    syls[k].coda = cs.slice(0, split);
    syls[k + 1].onset = cs.slice(split);
  }
  return syls;
}

function renderNucleus(vowels, onsetText) {
  const b = vowels.map((v) => v.base);
  if (b.length === 1) return SOUND[b[0]];
  let glide = '';
  let rest = b;
  if (!vowels[0].strong && b.length > 1 && (vowels[1].strong || b.length === 2)) {
    glide = GLIDE[b[0]];
    rest = b.slice(1);
  }
  if (rest.length === 1) return glide + SOUND[rest[0]];
  const pair = rest.join('');
  if (pair === 'ai') return onsetText || glide ? glide + 'ye' : 'eye';
  return glide + (FALLING[pair] || rest.map((v) => SOUND[v]).join(''));
}

function word(w) {
  const lower = w.toLowerCase().replace(/'/g, '');
  const syls = syllabify(units(lower));
  if (!syls) return w;
  let stress = syls.findIndex((s) => s.vowels.some((v) => v.accented));
  if (stress === -1) {
    const lastChar = lower[lower.length - 1];
    stress = /[aeioun s]/.test(lastChar) && syls.length > 1 ? syls.length - 2 : syls.length - 1;
  }
  const parts = syls.map((s) => {
    const onset = s.onset.map((u) => u.sound).join('');
    const coda = s.coda.map((u) => u.sound).join('');
    return onset + renderNucleus(s.vowels, onset) + coda;
  });
  if (parts.length > 1) parts[stress] = parts[stress].toUpperCase();
  return parts.join('-');
}

export function pronounce(text) {
  return text
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[¿?¡!.…"“”]/g, ' ')
    .replace(/[a-zñáéíóúü']+/gi, (m) => word(m))
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\/\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .replace(/[\s,]+$/, '')
    .trim();
}
