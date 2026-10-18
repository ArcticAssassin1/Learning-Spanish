# Español con Dan 🇩🇴

A personal Spanish trainer for your phone: flashcards, typed quizzes, spaced repetition,
pronunciation guides with audio, and real street Spanish (clearly labeled).
It installs on your home screen and works offline. There's no account; progress is saved on your phone.

The full plan is in [BRIEF.md](BRIEF.md).

## What's in it

**26 decks, 643 cards**, each with a pronunciation guide (*koh-rah-SOHN*), an example sentence,
a region and a register label.

- **Phase 1, foundations:** core verbs (all 100 forms), watch-out pairs (si/sí, tu/tú...),
  pronouns (verte, dámelo, conmigo), helper verb + infinitive, false friends (embarazada ≠ embarrassed),
  regular and irregular preterite, signal words, adjectives, connectors, high-frequency words.
- **Phase 2, real conversation:** everyday phrases, ser vs estar, por vs para, preterite vs imperfect,
  reflexives and "se me olvidó", subjunctive set phrases.
- **Phase 3, Caribbean & street:** romance 🔥, bachata and the dance floor, Caribbean pronunciation
  (etá, cansao, pa', amol), Dominican, Puerto Rican, Cuban and Mexican slang, texting abbreviations
  (tqm, xq, ntp), expletives 🔞.

**Five ways to study each deck:**

| Mode | What it is | Inspired by |
|---|---|---|
| ⌨️ Type it | Type the answer. Missing accents count but get flagged ("Watch the accent: **sé**"). | Your brief |
| 🃏 Flashcards | Tap to flip, then Missed / Got it / ⚡ Easy. | Anki |
| 🔘 Multiple choice | Pick from 4. Good for one-handed practice on the go. | Duolingo, Clozemaster |
| 🧩 Fill the blank | The example sentence with a word missing. Hint shows the first letter and the grammar rule. | Clozemaster |
| 🎧 Listen & type | Hear it, type what you heard. Trains your ear for fast speech. | Duolingo listening drills |

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
FAQ, Anki's docs and Duolingo's blog. All example sentences were written fresh for this app.
No song lyrics are included.

## Coming next (from the brief)

Conjugation drills · "Fix my sentence" and Quick translate (Claude API) · Quizlet export/import ·
speech input · streak reminders.
