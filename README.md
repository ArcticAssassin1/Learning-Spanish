# Español con Dan 🇩🇴

A personal Spanish trainer for your phone: flashcards, typed quizzes, spaced repetition,
pronunciation guides with audio, and real street Spanish (clearly labeled).
It installs on your home screen and works offline. There's no account; progress is saved on your phone.

The full plan is in [BRIEF.md](BRIEF.md).

## What's in it (v1)

- **13 decks, 388 cards**: core verbs (all 100 forms), regular and irregular preterite, signal words,
  adjectives, connectors, high-frequency words, everyday phrases, romance 🔥, Dominican and Mexican
  slang, expletives 🔞, and watch-out pairs (si/sí, tu/tú, conmigo/contigo...).
- Every card has a **pronunciation guide** (*koh-rah-SOHN*), an **example sentence**, a region, and a register label.
- **Flashcards**: tap to flip, choose ES→EN, EN→ES, or mixed. Always in random order.
- **Quiz**: type the answer. Missing accents still count, but you'll see
  *"Correct! Watch the accent: **sé**"*. Any of the listed meanings is accepted. Small typos
  show "Almost!", and you can tap "I was right" to override.
- **Score summary** (e.g. 13/15), a list of missed cards, and a **Retake missed cards** button.
- **Spaced repetition** (Leitner boxes): a missed card comes back right away, and known cards
  come back after 1, 3, 7, then 16 days.
- **🔊 / 🐢 audio** with the phone's Spanish voice (prefers Dominican, then US, then Mexican Spanish).
- **Explicit toggle** in Settings hides 🔞 cards when you're studying in public.
- **Progress**: cards learned, accuracy per deck, day streak, last 7 days, and your most-missed cards.
- Dark mode (light mode available), big buttons, and the phone's back button works.

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

Easiest way: send Claude the word list (or a screenshot) and ask it to add a deck.

## Coming next (from the brief)

Conjugation drills · "Fix my sentence" and Quick translate (Claude API) · auto-built Common
Mistakes deck · Quizlet export/import · speech input · daily goal reminders · more Caribbean decks.
