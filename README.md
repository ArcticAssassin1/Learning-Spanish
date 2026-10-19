# Español con Dan 🇩🇴

A personal Spanish trainer for your phone: flashcards, typed quizzes, spaced repetition,
pronunciation guides with audio, and real street Spanish (clearly labeled).
It installs on your home screen and works offline. There's no account; progress is saved on your phone.

Built for one learner: an English speaker focused on Caribbean (especially Dominican) Spanish.

## What's in it

**33 decks, 992 cards**, each with a pronunciation guide (*koh-rah-SOHN*), an example sentence,
a region and a register label.

- **Phase 1, foundations:** numbers, basics (question words, tú vs usted, tener expressions, del/al,
  family), core verbs (all 100 forms), the top 100 most-used verbs, watch-out pairs (si/sí, tu/tú...),
  pronouns (verte, dámelo, conmigo), helper verb + infinitive, false friends (embarazada ≠ embarrassed),
  regular and irregular preterite, signal words, adjectives, connectors, high-frequency words.
- **Phase 2, real conversation:** everyday phrases, **My Words** (your own Word doc and Quizlet lists,
  corrected), at the restaurant, jobs & hobbies, ser vs estar, por vs para, preterite vs imperfect,
  reflexives and "se me olvidó", subjunctive set phrases.
- **Phase 3, Caribbean & street:** romance 🔥, bachata and the dance floor, Caribbean pronunciation
  (etá, cansao, pa', amol), Dominican, Puerto Rican, Cuban and Mexican slang, texting abbreviations
  (tqm, xq, ntp), Mexican slang from a comedy talk on free time, expletives 🔞.

**Five ways to study each deck:**

| Mode | What it is | Inspired by |
|---|---|---|
| ⌨️ Type it | Type the answer. Missing accents count but get flagged ("Watch the accent: **sé**"). | Your brief |
| 🃏 Flashcards | Tap to flip, then Missed / Got it / ⚡ Easy. | Anki |
| 🔘 Multiple choice | Pick from 4. Good for one-handed practice on the go. | Duolingo, Clozemaster |
| 🧩 Fill the blank | The example sentence with a word missing. Hint shows the first letter and the grammar rule. | Clozemaster |
| 🎧 Listen & type | Hear it, type what you heard. Trains your ear for fast speech. | Duolingo listening drills |
| 🧱 Build the sentence | Tap word tiles into the right order. No typing needed. | Duolingo word bank |

On Spanish answers there's also a **🎤 button**: say the answer out loud instead of typing it.

**✍️ Fix my sentence** (Practice tab): write a sentence in Spanish and Claude sends back
❌ your version, ✅ the corrected version with pronunciation and 🔊, the English translation, a
**You wrote / Correct / Why** table, how a Caribbean speaker would casually say it, and a tip.
It knows your usual mistakes (sí/si, verte, conmigo/contigo, "quiero voy"...). Your last 10 fixes
are saved. Needs your own Claude API key (Settings → Claude API key), about a cent per sentence.

**🏋️ Practice tab:**
- **Conjugation drill**: pick verbs (your 20, top 25/50/150, irregular) and tenses (present, preterite,
  imperfect, future, conditional, perfect, subjunctive), then type the right form. Covers 150 verbs.
  Like SpanishDict / Conjuguemos.
- **Dialogues**: 8 real-life conversations (the club, a Dominican restaurant, texting, the gym, meeting
  her mom, an Uber, the colmado, running late). *Listen & read* with play-all, or *Play your part*:
  she talks, you answer, then compare (the FSI / Pimsleur method).
- **Free library**: links to free PDF courses (FSI and DLI Spanish, public domain), free open textbooks
  (Español 101/102, Semillas, ¡Conecta!, El Futuro) and free listening (Language Transfer, Dreaming
  Spanish, Caribbean Spanish 101, Tatoeba, SpanishDict, Conjuguemos).

**Also:**
- **Spaced repetition** (Leitner boxes): a missed card comes back right away, then after 1, 3, 7, then 16 days.
- **Score summary** (e.g. 13/15), a missed-cards list, and **Retake missed cards**.
- **🩹 Fix my mistakes**: one tap to drill every card you've missed, across all decks.
- **🎯 Daily goal** (10 / 20 / 30 / 50 cards) and a **🔥 streak with 🧊 streak freezes**: every 7 days
  in a row earns a freeze (max 2) that saves your streak if you miss a day. This is the Duolingo idea,
  without the guilt trip.
- **🔊 / 🐢 audio** with the phone's Spanish voice (prefers Dominican, then US, then Mexican Spanish).
- **Explicit toggle** hides 🔞 cards when you're studying in public.
- **Progress** page: learned, accuracy per deck, last 7 days, most-missed cards.
- Dark mode, big buttons, works offline, and the back button works.

## Put it on your phone

The app is hosted free on GitHub Pages. One-time setup:

1. Merge this branch into `main` on GitHub.
2. On GitHub, open the repo, then **Settings → Pages**. Under **Source**, choose **GitHub Actions**.
3. Open the **Actions** tab and wait for "Deploy to GitHub Pages" to turn green (about 1 minute).
4. On your phone, open **https://arcticassassin1.github.io/Learning-Spanish/**
5. Install it:
   - **iPhone (Safari):** tap Share → **Add to Home Screen**.
   - **Android (Chrome):** tap ⋮ → **Install app**.

From then on it opens like a normal app, works with no signal, and updates itself when new decks are pushed.

> GitHub Pages is free for public repos. For a private repo it needs a paid GitHub plan.

## Privacy & security

- No account and no server: your progress, settings and API key stay in your phone's browser storage.
- The API key is only ever sent to Anthropic (`api.anthropic.com`), when you tap **Fix it**.
  Use a separate key just for this app with a low monthly spend limit, and remove it in Settings
  if you lose your phone. Anyone who can unlock your phone and open the app could use the key.
- A Content Security Policy only lets the app run its own code and only talk to Anthropic.
- Nothing from Claude is ever run as code or HTML; it's shown as plain text.
- The deploy workflow pins every GitHub Action to an exact commit and has minimal permissions.
- The repository is public: don't commit API keys or anything private to it.

## Run it on a computer (optional)

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install      # first time only
npm run dev      # starts the app; open the link it prints
```

To try it on your phone over the same Wi-Fi, open the "Network" address that `npm run dev` prints.

Other commands: `npm test` runs the checks, and `npm run build` makes the production version in `dist/`.

## Adding new words

Each deck is one file in [`src/data/decks/`](src/data/decks). To add a deck, add a new `.json` file
there and it shows up automatically. Card format:

```json
{
  "id": "dominican-slang:jevi",
  "spanish": "Jevi",
  "english": "cool / awesome",
  "pronunciation": "HEH-bee",
  "example": "Esa fiesta estuvo jevi.",
  "example_en": "That party was awesome.",
  "region": "Dominican",
  "register": "slang",
  "notes": "From English \"heavy\"."
}
```

- `region`: General, Mexico, Dominican, Caribbean, Spain, Colombia, Puerto Rico, Cuba
- `register`: neutral, casual, slang, vulgar (🔞, hidden by the toggle), romantic (🔥)
- Separate alternative answers with ` / ` (e.g. `"malo / mala"`, `"thing / stuff"`).
  Text in `(parentheses)` is a hint and doesn't need to be typed.
- `pronunciation` can be left out and the app will generate one.
- Optional: `accept` is a list of extra accepted Spanish answers, e.g. `["klk"]`.
- Optional: wrap a word in the example in `[brackets]` to choose what Fill-the-blank hides,
  e.g. `"Quiero [ir] a la playa."`. Otherwise the app finds the card's word in the example.
- Optional: `say` is what the 🔊 button says, when the card shows a spelling the voice
  can't read (e.g. `"xq"` → `"por qué"`).

Easiest way: send Claude the word list (or a screenshot) and ask it to add a deck.

## Where the new material came from

Slang meanings, false friends, grammar rules and app ideas were cross-checked against learner
resources such as Wikipedia's list of Puerto Rican slang, SpeakingLatino, Spanishland School,
FluentU, Lingopie, StoryLearning, SpanishVIP, Lawless Spanish, StudySpanish, Babbel, Clozemaster's
FAQ, Anki's docs and Duolingo's blog. All example sentences and dialogues were written fresh for this app.
No song lyrics are included.

The conjugation drill and the Top 100 Verbs deck use **Fred Jehle's Conjugated Spanish Verb
Database** (compiled by Brian Ghidinelli, JSON version by miko3k/verbos), licensed
[CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/). Those two data files stay
under that license; see `src/data/CONJUGATIONS-LICENSE.txt`.

## Coming next (from the brief)

Quick translate (Claude API) · Quizlet export/import ·
streak reminders.
