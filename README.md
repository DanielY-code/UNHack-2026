# Edventure

**Team Threshold · UNHack**

> How might we help Grade 11 to first-year university students visualize where their courses and choices lead, so that they can kickstart their career readiness with a comparable, end-to-end view of their degree pathway?

Edventure turns career planning into a video-game skill tree. Students roll stats from their interests, courses and activities. They preview career paths before committing to a degree, compare them side by side, and complete real-world objectives to earn treasure. A companion character (an orb, slime, knight, wizard or dragon, powered by Claude) helps them explore, and can grow brand-new skill trees on request.

## Features

| Area | What it does |
|---|---|
| **Character** | Interests, course grades and activities become seven stats (Logic, Tech, Science, Creativity, Charisma, Empathy, Craft). Set an intended major and up to two minors. |
| **Career paths** | Eight starter trees with a match % based on your stats: Computer Science, Cybersecurity, Data Science & AI, Health Sciences, Engineering, UX & Visual Design, Law & Policy, Business. |
| **Skill tree** | Objectives laid out by grade stage, each with what you learn, a concrete task and free resources. Hover any node for an interactive card. Branches lead into related paths. |
| **Mastery & crossovers** | Some objectives have three mastery stages. Mastering one unlocks a crossover into a completely different field, such as Engineering → Patent law. |
| **World tree** | Every path on one radial map, which re-flows automatically as new paths are added. |
| **Compare** | Two or three trees side by side: stat demands, year-by-year objectives, shared ground and connections. |
| **Switching & minors** | A "What comes with you" panel shows what carries over when changing majors. Minors get a lighter track through their tree. |
| **Your own objectives** | Students can add their own goals to any tree. |
| **Treasury** | Gems buy themes (including animated ones), companions, orb skins and titles. Gift cards are recorded as requests for an adult to approve. |
| **Guidance** | `?` tooltips explain majors, minors, electives, transfer credits, co-op and more. The Explorer's compass rotates encouraging messages. |

## Project structure

```
index.html            App shell and markup
css/styles.css        All styles, themes and animations
js/                   Plain browser scripts, loaded in order (no build step)
  content.js            Loads /data/*.json
  game.js               Saved state and game rules (unlocking, mastery, stats, rewards)
  views.js              Character, Career paths, Skill tree, Compare and Treasury screens
  world.js              World tree layout
  interactions.js       Event wiring and claiming objectives
  hovercard.js          Hover card beside skill nodes
  companions.js         Companion characters (original SVG art)
  companion-chat.js     Chat panel, AI adapter, AI-grown paths
  guidance.js           Tooltip and compass helpers, majors/minors
  tooltips.js           Tooltip bubble
  fx.js                 Animated backgrounds, flying gems, banners
  main.js               Boot sequence
data/                 Editable content, no code knowledge needed
  paths.json            Skill trees, mastery stages, crossovers
  catalog.json          Stats, interests, courses, activities, stage names
  shop.json             Treasury items and prices
  guidance.json         Tooltip text and compass messages
  prompts.json          Companion personalities and AI prompts
api/companion.js      Vercel serverless function: calls Claude with the secret API key
tests/                Content, game-rule and API tests (node --test)
```

## Run it locally

You need Node.js 20 or newer.

**Without the AI companion** (fastest):
```bash
npm run preview        # serves the site at http://localhost:3000
```
The companion explains that it isn't connected. Everything else works.

**With the AI companion:**
```bash
npm i -g vercel
cp .env.example .env.local      # then paste your Anthropic API key into it
vercel dev                      # site and /api at http://localhost:3000
```

**Tests:**
```bash
npm test
```

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import this GitHub repo. There's no framework to choose and no build command.
2. Under **Settings → Environment Variables**, add `ANTHROPIC_API_KEY`. Get a key from the [Anthropic Console](https://console.anthropic.com).
3. Deploy. Every push to `main` now redeploys automatically, and every pull request gets its own preview link.

Recommended before sharing widely:
- Set a **monthly spend limit** for your API key in the Anthropic Console.
- Set `ALLOWED_ORIGINS` to your site's URL so other sites can't call your API.

Optional variables: `ANTHROPIC_CHAT_MODEL` (default `claude-haiku-5-5`) and `ANTHROPIC_GROW_MODEL` (default `claude-sonnet-5-5`).

## Test mode

The Treasury's test tools (free gems, reset purchases) and a one-time 25,000-gem grant appear only on `localhost`, on Vercel preview deploys, or on any URL ending in `#test`. On the production site, students start with normal treasure.

## Editing content

- **Add or change a skill tree:** edit `data/paths.json`. Each node needs an `id`, a stage `t` (0 to 4), a `title`, `learn`, `objective`, a `req` list of earlier node ids, and `res` resources (https links). Add `mastery` (two extra stage objectives) and a `cross` object to make a mastery node with a crossover.
- **Change prices or add items:** edit `data/shop.json`.
- **Change companion personalities:** edit `data/prompts.json`.

Run `npm test` afterwards. It catches broken prerequisites, missing branch targets, non-https links and missing tooltips.

## How the AI is kept safe

- The API key lives only on the server, in the Vercel function.
- The browser sends a small, validated request ("chat" or "grow"). The server builds the actual prompt from `data/prompts.json`, so the endpoint can't be used as a general-purpose chatbot.
- Inputs are length-capped, conversations are trimmed, and each visitor is rate-limited (best effort per server instance).
- AI-grown trees are labelled, and students are told to check their links.

## Current limits (prototype)

- Progress is saved in the browser only (`localStorage`). Clearing the browser or switching devices starts over.
- Gift-card requests are recorded but not fulfilled.
- The rate limit is in memory, so it resets when Vercel starts a new instance.

## Roadmap

- **Stage 2 (pilot):** port to Next.js with Supabase for accounts and synced progress, a counselor/parent approval view, and privacy and consent handling for students under 18.
- **Stage 3:** build trees from open labour-market data (OaSIS skills, Job Bank outlooks, NOC codes), add York University course mappings with the Registrar's Office or OIPA, and add real reward fulfilment with a sponsor.

## License

MIT, see [LICENSE](LICENSE).
