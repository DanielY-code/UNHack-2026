# Edventure

**Team Threshold · UNHack**

> A student's path is never set, and it's never too late to change it.

> How might we help Grade 11 to first-year university students visualize where their courses and choices lead, so that they can kickstart their career readiness with a comparable, end-to-end view of their degree pathway?

Edventure turns career planning into a video-game skill tree. Students roll stats from their interests, courses and activities. They preview career paths before committing to a degree, compare them side by side, and complete real-world objectives to earn treasure. A companion character (an orb, slime, knight, wizard or dragon, powered by Claude) helps them explore, and can grow brand-new skill trees on request.

## Features

| Area | What it does |
|---|---|
| **Never too late** | Stages are phases (Start, Build, Deepen, Launch, Branch out), not school years, and the quiz accepts anyone from Grade 9 to "graduated or working". Steps have a suggested order rather than locks: any step can be started early ("Start it now anyway"); only mastery crossovers need their mastery first. One **Change course** button (Skill tree, World tree, Character tab) gathers every way to change direction, and **Your journey so far** logs each turn as progress. |
| **Your foundation** | Courses taken and objectives finished on earlier paths follow the student to every new tree. Related work glows and gives **Head start** badges on matching steps, with a **Count my earlier work** button to carry it over; unrelated work is greyed out but stays, in case a later choice connects it. On the World tree, this foundation is drawn as the tree's roots. Paused paths with progress stay reachable as greyed chips. Relatedness comes from skill tags read from each objective's text (`catalog.json` → `skills`, `courseSkills`, `skillIgnore`). |
| **Onboarding quiz** | New students start with a short quest-style quiz: about you, interests, courses, activities, six scenario questions, goals with a timeframe, and how sure they are of their direction. Results rank every path with reasons, add the chosen paths to the student's journey, set a major when they're sure, and plant their goals as ★ objectives in their top trees. Retake it any time from the Character tab. |
| **Path updates** | "Something changed?" lets students describe a recent event or change of heart in their own words, for example *"I failed my Computer Science course, I don't enjoy problem solving, I like constructing models."* Their companion suggests paths to try next, new trees to grow, paths to pause and a small first step. Applying it reshapes their journey: paused paths keep all progress and resume when pinned again. Without an API key, a built-in keyword reader gives a simpler version. Updates are logged on the Character tab. |
| **Character** | Interests, course grades and activities become seven stats (Logic, Tech, Science, Creativity, Charisma, Empathy, Craft). Set an intended major and up to two minors. |
| **Destinations & routes** | Students pick a destination (a career goal such as Software Developer, Registered Nurse or Policy Analyst). Each has a main route plus backups. **Hit a roadblock?** keeps the goal and offers other routes ranked by the problem (grades, admission, cost, interest), such as a college diploma that bridges to a degree. **New goal from this path** aims the current path somewhere new through one of its branches (Computer Science → Cybersecurity → Cybersecurity Analyst). **Start a new program** switches fields entirely (Agriculture → Political Science), keeping the old path as a minor or pausing it with progress saved. The World tree marks the goal at the crown or on the branch to follow. |
| **Career paths** | Nine starter trees with a match % based on your stats: Computer Science, Cybersecurity, Data Science & AI, Health Sciences, Engineering, UX & Visual Design, Law & Policy, Business, Agriculture & Food Systems. |
| **Simple view** (default) | Each path opens with a short debrief: a progress ring, the next step, the skills it builds and where it can lead. Below it, every stage is a plain list; tap a step to see what you'll learn, your task, where to start and a "Mark as done" button. A temporary **Simple / Detailed** switch lets the team compare it with the original diagram view. |
| **Start over** | A button in the top bar (and on the Character tab) wipes the profile, progress, goals, treasure and purchases after a confirmation, then reopens the starting quiz. |
| **Skill tree** (detailed) | Objectives laid out by grade stage, each with what you learn, a concrete task and free resources. Hover any node for an interactive card. Branches lead into related paths. |
| **Mastery & crossovers** | Some objectives have three mastery stages. Mastering one unlocks a crossover into a completely different field, such as Engineering → Patent law. |
| **World tree** | One path at a time, drawn as a real tree: the trunk climbs from "You" through each stage (with done counts), and branches sprout where the path can lead: built-in branches, mastery crossovers, and up to two related paths it "could branch" into. Tap a branch to follow it and see where that path goes; breadcrumbs lead back. Tap a stage to jump to its steps. |
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
  world.js              World tree: single-path trunk with branches, follow-a-branch navigation
  interactions.js       Event wiring and claiming objectives
  hovercard.js          Hover card beside skill nodes
  companions.js         Companion characters (original SVG art)
  companion-chat.js     Chat panel, AI adapter, AI-grown paths
  quiz.js               Onboarding quiz, path scoring, planting goal objectives
  update.js             "Something changed?" path updates and the offline keyword reader
  simple.js             Simple view (path debrief + step list), view switch, Start over
  destination.js        Destinations, backup routes, new goals and new programs
  foundation.js         Earlier courses and objectives: skill tags, head starts, World tree roots
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
  quiz.json             Quiz questions, goals, timeframes and direction options
  destinations.json     Career destinations, their routes and roadblock reasons
api/companion.js      Vercel serverless function: calls Claude with the secret API key
scripts/build-single.mjs   Bundles everything into one HTML file (npm run build:single)
tests/                Content, game-rule, quiz, path-update and API tests (node --test)
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

**Single-file build** (for sharing a preview as one file):
```bash
npm run build:single      # writes dist/edventure.html
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
- **Add a destination or route:** edit `data/destinations.json`. The first route must be `main`. A `path` route names a path id and optionally `via` (a branch or crossover that path really has). A `steps` route lists 3+ steps and becomes its own small path when chosen. Tag routes with `goodFor` reasons so roadblock suggestions rank well.
- **Tune what counts as related:** edit `skills` in `data/catalog.json`. Words are matched at the start of a word; end a word with `!` to match it exactly (`law!` won't match "lawn"). Skills marked `"soft": true` never create a connection on their own. Add misleading phrases to `skillIgnore`.
- **Change the quiz:** edit `data/quiz.json`. Each option can add `stats` (keys from `catalog.json`) and `paths` (path ids with an affinity weight). Goals need a `label` for the quiz and a `title`, `objective` and `learn` for the objective they create.

Run `npm test` afterwards. It catches broken prerequisites, missing branch targets, non-https links and missing tooltips.

## How the AI is kept safe

- The API key lives only on the server, in the Vercel function.
- The browser sends a small, validated request ("chat", "grow" or "reflect"). The server builds the actual prompt from `data/prompts.json`, so the endpoint can't be used as a general-purpose chatbot.
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
