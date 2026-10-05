# Generative UI portfolio (Astro starter)

A chat-first portfolio. Visitors ask a question and the answer arrives as **real
components**, not a wall of text: a project carousel, an experience timeline, a
skills-by-project matrix, a contact card. Every answer cites its sources, and the
site stays useful with no JavaScript, no API key, or when the API is down.

> **The person in this template is fictional.** "Alex Moreno", the companies
> (Northwind Labs, Acme Mobility, Studio Example) and the projects are placeholders.
> Replace `src/data/profile.ts` with your own data before publishing.

## The concept

- **Ask, and get UI back.** The landing page is the assistant. Claude decides
  *which* component answers the question best by calling a tool
  (`show_projects({ ids })`, `show_timeline()`, `show_skills({ group? })`,
  `show_contact()`). The server validates every id against `profile.ts` and
  streams a tiny event like `{"type":"component","name":"project","id":"loan-simulator"}`.
  The browser renders the component from **local data** (a `<template>` built from
  `profile.ts` at build time). The model never returns HTML.
- **Cold start without tokens.** Before anyone types, the page shows a
  pre-rendered **Sample answer** (static HTML, labelled as such) with citations and
  the project carousel. The page has value immediately, for humans and crawlers.
- **Citations you can check.** Answers carry numbered citations (`[1]`) that link
  to a **Sources** aside; each source links to the matching section of the static
  **Classic resume** (`/en/resume`).
- **Recruiter mode.** One button asks for a 30-second summary and shows the two
  most relevant projects plus the contact card.
- **Evidence over self-ratings.** There is no skill radar. The skills matrix is
  derived from project tags: a mark means "this project uses it". Skills with no
  project behind them are listed separately, honestly.

### Why it works

Recruiters skim; engineers want proof. A chat that answers with the actual
artifacts (cards, timeline, matrix) is faster to scan than prose and harder to
hallucinate, because the content of every component comes from your data file,
not from the model. The model only chooses and connects.

## What the AI does (and does not do)

| Does | Does not |
| --- | --- |
| Answers in the third person, only from `profile.ts` | Invent facts, metrics or links |
| Picks components via tool use (ids validated server-side) | Return HTML or styles |
| Cites each fact with a source id → numbered citation | Get to change its rules from the user message |
| Says "I can't find that…" when the profile doesn't cover it | Remember anything server-side |

The system prompt is built from `profile.ts`, with every block tagged by a source id
(`profile.summary`, `experience.<id>`, `projects.<id>`, `skills.<group>`, `contact`).
The model writes `[[projects.loan-simulator]]` after a sentence; the server swaps
it for `[1]` and emits a `source` event. Unknown ids are dropped.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321 → redirects to /en/
npm run build    # works with no API key
npm run preview
```

Requires Node 22.12+ (Astro 7).

### Demo mode (no API key)

Without `ANTHROPIC_API_KEY` the endpoint still works: it streams a canned but
**grounded** answer picked by keyword matching over `profile.ts` (projects,
experience, skills, contact, recruiter), with the same component and source events
as the live model. The UI shows "Demo mode — add ANTHROPIC_API_KEY for live answers".
Demo answers are assembled from your data, so they stay correct after you edit it.

## Environment variables

Copy `.env.example` to `.env`.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | no | — | Enables live answers. Server-only (`astro:env/server`, secret); never sent to the browser. |
| `ANTHROPIC_MODEL` | no | `claude-haiku-4-5` | Any current Claude model id. Haiku is fast and cheap for short, grounded answers. |
| `PUBLIC_SITE_URL` | no | `http://localhost:4321` | Used for canonical / alternate URLs. |

## Where to edit

| What | File |
| --- | --- |
| **All personal content** (name, summary, experience, projects, skills, links) | `src/data/profile.ts` |
| UI strings, EN + ES (same keys), sample answer text | `src/i18n/ui.ts` |
| **Theme** (colors, radii, motion, fonts) | `src/styles/global.css` (documented at the top) |
| Assistant rules, tools, citation parser | `src/lib/assistant.ts` |
| Demo-mode answers | `src/lib/demo.ts` |
| Chat island (streaming, typewriter, components, errors) | `src/components/Chat.astro` |
| Components | `src/components/{ProjectCarousel,Timeline,SkillsMatrix,ContactCard}.astro` |
| Endpoint | `src/pages/api/chat.ts` |

Project `tags` must use names from `skills` so the matrix can link them. Keep
descriptions qualitative and replace the `[YOUR RESULT]` placeholders with real,
verifiable outcomes (they are hidden from the model so it never repeats them).

## API contract

`POST /api/chat`

```jsonc
// request
{ "message": "What has Alex built?", "lang": "en", "history": [{ "role": "user", "content": "…" }],
  "mode": "recruiter", "context": "projects" }
```

- `message` ≤ 500 chars; `history` is sanitized (valid roles only, `slice(-6)`);
  `mode` must be `recruiter`; `context` must be a section (`projects`, `experience`,
  `skills`, `contact`) or a project id. Anything else → `400 {"type":"error","code":"invalid"}`.
- Best-effort in-memory rate limit: 8 requests / minute / IP (per serverless instance).

Response: `application/x-ndjson`, one event per line:

```text
{"type":"text","delta":"…"}
{"type":"component","name":"project","id":"loan-simulator"}   // also timeline | skills (id = group) | contact
{"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}
{"type":"done"}
{"type":"error","code":"rate_limited"|"too_long"|"empty"|"upstream"|"stream_cut"|"invalid"}
```

Consecutive `project` events are grouped into one carousel. Validation errors use
HTTP 400/429 with a single error line; an upstream failure before streaming starts
returns 503. The `X-Assistant-Mode: demo|live` header tells the UI which mode answered.

Live mode uses `@anthropic-ai/sdk` `messages.stream()` in a short manual tool loop
(max 3 rounds) and **prompt caching** on the system prompt (tools + profile
context form a stable, cached prefix; the per-request language line is outside it).
Note that very small prompts may fall under the model's minimum cacheable length,
in which case caching is simply a no-op.

## Accessibility

- Skip link, landmarks (`header`, `nav`, `main`, `aside`, `footer`), one `h1`, no
  heading jumps, visible focus (`2px solid var(--focus)`), 44×44px targets, text ≥ 12px,
  contrast ≥ 4.5:1 with the theme tokens. Works at 320px with no horizontal scroll.
- Chat: visible label, `aria-describedby` disclaimer; streaming is **not** announced
  token by token: a polite `sr-only` live region says "Writing…" then reads the full
  answer once. The streaming message has `aria-busy="true"` until it ends.
- Citations are links named "Source 1: Projects · Loan simulator".
- Errors render in `role="alert"` with an action (Retry, See projects, Open classic
  resume, Edit question).
- **Stop** aborts the request (`AbortController`); the partial answer stays, marked
  "(incomplete)", with a Retry button.
- Carousel: a `region` with an accessible name, previous/next buttons, arrow keys,
  no autoplay, no dragging needed. Without JS it is a scrollable list.
- Skills matrix: a real `<table>` with caption, column/row headers and text
  alternatives for every mark ("Used in Loan simulator" / "Not used").
- **Reduced motion:** the typewriter (chunked, 30ms steps) is disabled, smooth
  scrolling is off and only short opacity fades remain. There is no in-page motion
  toggle because this template has no heavy motion.
- **No JS:** the sample answer, sources, recruiter card link and the full classic
  resume are static HTML. Chat-only controls are hidden until the island loads.

## Theme

Dark by default; the header button toggles `.light` on `<html>` and saves it in
`localStorage` (an inline script applies it before paint). The accent color marks
AI and only AI (ask box, assistant answers, citations, sources) and always comes
with the spark icon. Fonts are self-hosted via Fontsource: Bricolage Grotesque
(display), Figtree (body), JetBrains Mono (mono), all `@fontsource-variable/*`.

## Deploy

- **Vercel** (default): `@astrojs/vercel` is configured. Import the repo, set
  `ANTHROPIC_API_KEY` (optional) in the project settings, deploy. Pages are static;
  only `/api/chat` is a serverless function.
- **Node**: `npm i @astrojs/node`, then in `astro.config.mjs` replace
  `adapter: vercel()` with `adapter: node({ mode: 'standalone' })`.
- **Netlify**: `npm i @astrojs/netlify` and use `adapter: netlify()`.

The rate limiter is in memory and per instance; for real abuse protection put a
shared store (KV/Redis) or your platform's firewall in front of `/api/chat`.

## Stack

Astro 7 (static output + one serverless route), Tailwind CSS 4 (`@tailwindcss/vite`),
TypeScript strict, framework-free custom elements for interactivity, i18n with
Astro's native routing (`/en/`, `/es/`).

## Credits

Concept by Jean Pierre Ramírez. Persona and content are fictional placeholders.
