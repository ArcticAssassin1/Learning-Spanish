// Conjugation drills built from Fred Jehle's verb database (src/data/conjugations.json).
import { pronounce } from './pronounce.js';
import { shuffle } from './srs.js';

export const TENSES = {
  presente: 'Present',
  preterito: 'Preterite',
  imperfecto: 'Imperfect',
  futuro: 'Future',
  condicional: 'Conditional',
  perfecto: 'Perfect (he ___)',
  subjuntivo: 'Subjunctive',
};

export const CORE_VERBS = ['ser', 'estar', 'tener', 'hacer', 'ir', 'ver', 'poder', 'dar', 'saber', 'poner',
  'pedir', 'seguir', 'servir', 'elegir', 'caer', 'oír', 'venir', 'traer', 'haber', 'salir'];

export const VERB_SETS = [
  ['core', 'My 20'],
  ['top25', 'Top 25'],
  ['top50', 'Top 50'],
  ['top150', 'Top 150'],
  ['irregular', 'Irregular'],
];

const SUBJECT = ['yo', 'tú', 'él', 'nosotros', 'ellos'];

export function pickVerbs(verbs, set) {
  switch (set) {
    case 'core': return verbs.filter((v) => CORE_VERBS.includes(v.inf));
    case 'top25': return verbs.slice(0, 25);
    case 'top50': return verbs.slice(0, 50);
    case 'irregular': return verbs.filter((v) => !v.regular);
    default: return verbs;
  }
}

/** Turn verb × tense × person combos into quiz cards (English prompt → type the Spanish form). */
export function drillCards(data, { set = 'core', tenses = ['presente'], size = 15 } = {}) {
  const combos = [];
  for (const v of pickVerbs(data.verbs, set)) {
    for (const t of tenses) {
      (v.tenses[t] || []).forEach((form, i) => { if (form) combos.push({ v, t, i, form }); });
    }
  }
  return shuffle(combos).slice(0, size || combos.length).map(({ v, t, i, form }) => ({
    id: `conj:${v.inf}:${t}:${i}`,
    deckId: 'conjugation',
    spanish: form,
    english: `${v.inf} · ${TENSES[t]} · ${data.persons[i]}`,
    pronunciation: pronounce(form),
    example: `${t === 'subjuntivo' ? 'Que ' : ''}${SUBJECT[i]} [${form}].`,
    example_en: i === 0 && v.en_yo[t] ? `${t === 'subjuntivo' ? '(that) ' : ''}${v.en_yo[t]}` : `${v.inf} = ${v.en}`,
    region: 'General',
    register: 'neutral',
    verb: v.inf,
    person: data.persons[i],
    ...(v.note ? { notes: v.note } : {}),
  }));
}
