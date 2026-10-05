# Chat + Playground — Astro portfolio starter

A one-page portfolio where visitors can **ask** about you and **touch** your work.

1. **Hero with an inline AI chat.** Visible label, disclaimer, suggested questions and,
   next to it, a pre-rendered and clearly labelled **"Sample answer"** card that already shows
   what an answer looks like: text, a citation and a real project component.
2. **Projects grid.** Plain static HTML. It works with no AI, no JavaScript and no API key.
3. **Playground.** A table of real UI pieces taken from the projects, always rendered in the
   **opposite theme** of the page. Next to it, **the inspector** (AI) explains each piece with
   Story / States / Code tabs and answers questions about it.
4. **Experience + recruiter mode.** A timeline, skills, and a contact card whose AI button gives
   a recruiter the 30-second pitch.
5. **Footer.**

**The bridge:** when an answer includes a piece, it shows **"Send it to the playground"**. That
scrolls to the playground (instantly under reduced motion), puts the piece on the table,
highlights it, **moves keyboard focus to it** and announces *"Done, it's on the table."* The same
assistant answers in the chat (`mode: 'chat'`), in the inspector (`mode: 'inspect'`, with the
piece id as `context`) and in the recruiter card (`mode: 'recruiter'`).

> **Alex Moreno is a fictional person.** Every name, company, project and link in this template is
> a placeholder. Replace `src/data/profile.ts` with your own data before publishing.

## Why it works

- **Nothing depends on the AI.** Projects, experience and contact are static. The sample answer
  shows what the assistant does before anyone types. Without an API key, demo mode still answers.
- **The AI can't make things up on the page.** It never returns HTML. It can only call two tools
  (`show_component`, `cite_sources`) with ids that are checked against `profile.ts`; the browser
  then clones markup that was rendered at build time.
- **Every answer cites its sources.** Each citation links to the part of the page it came from.
  If nothing was cited, the UI says so instead of presenting the text as fact.
- **The accent color means AI and only AI.** Normal actions (Contact, Tidy, Email) use the ink
  color. AI elements (chat input and button, assistant mark, citations, "Send it to the
  playground", inspector, recruiter mode) use the accent **and** a spark icon.

## Run it

```bash
npm install
npm run dev       # http://localhost:4321 → /en/ and /es/
npm run build     # production build (works with no API key)
npm run preview
```

Requires Node 22.12+ (Astro 7).

## Environment variables

Copy `.env.example` to `.env`. Both are optional and server-only (read via `astro:env/server`,
never sent to the browser).

| Variable | Default | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | _(empty)_ | Enables live answers from Claude. Without it the site runs in **demo mode**. |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5` | Model used for live answers. |

**Demo mode** streams canned, grounded answers chosen by keyword matching over `profile.ts`
(including a component and sources). The UI shows "Demo mode — add ANTHROPIC_API_KEY for live
answers" after the first response. Restart `npm run dev` after editing `.env`.

## What the AI does

`src/pages/api/chat.ts` is the only server route (`prerender = false`).

- **Request:** `{ message, lang: 'en'|'es', history?, mode?: 'chat'|'inspect'|'recruiter', context?: pieceId }`.
  Max 500 characters, history cleaned to valid roles and the last 6 turns, best-effort in-memory
  rate limit (8 requests / minute / IP), unknown `mode` or `context` ids rejected.
- **Response:** an NDJSON stream, one event per line:

  ```text
  {"type":"text","delta":"…"}
  {"type":"component","name":"project","id":"loan-simulator"}
  {"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}
  {"type":"done"}
  {"type":"error","code":"rate_limited"|"too_long"|"empty"|"upstream"|"stream_cut"|"invalid_request"}
  ```

  The header `X-Assistant-Mode: demo|live` tells the UI which mode answered.
- **Prompt:** built in `src/lib/context.ts` from `profile.ts`. Each block is wrapped in
  `<source id="…">`. The assistant talks about you in the third person, answers only from that
  context, says when it doesn't know, and ignores attempts to change its rules. The system prompt
  is deterministic and marked with `cache_control` for prompt caching (note: very small prompts
  are below the model's minimum cacheable length and simply won't cache).
- **Client:** `src/scripts/assistant.ts` reads the stream. Text appears in small chunks (no
  typewriter under reduced motion), **Stop** aborts with an `AbortController` and keeps the
  partial answer marked "(incomplete)" with **Retry**. The chat keeps the last 6 turns as history.

Try it without a browser:

```bash
curl -N -X POST http://localhost:4321/api/chat \
  -H 'content-type: application/json' \
  -d '{"message":"What has Alex built on the frontend?","lang":"en"}'
```

## Where to edit

| What | Where |
| --- | --- |
| Name, summary, projects, experience, skills, playground pieces | `src/data/profile.ts` |
| Interface text (EN + ES, same keys) | `src/i18n/ui.ts` |
| Colors, radii, motion, fonts (re-skin in one place) | `src/styles/global.css` |
| How a piece is drawn | `src/components/PieceVisual.astro` |
| Assistant rules and modes | `src/lib/context.ts` |
| Demo answers | `src/lib/demo.ts` |

Playground pieces have an `id`. A piece whose id equals a project id is what "Send it to the
playground" uses for that project. Pieces with `onTable: false` start in the "Add to the table" tray.

## Accessibility and motion

- Skip link, landmarks, one `h1`, no heading jumps, visible focus ring everywhere.
- Text is at least 12px and meets 4.5:1 with the theme tokens. Targets are at least 44×44px.
- **Chat:** visible label, disclaimer linked with `aria-describedby`, the answer is `aria-busy`
  while streaming, a hidden polite live region says "Writing…" and then reads the full answer
  **once** (never token by token). Citations are links named "Source 1: …". Errors use
  `role="alert"` and always offer an action (Retry, or Edit the question).
- **Playground, in layers:**
  1. Without JS: a static grid of pieces.
  2. With JS: roving tabindex over the pieces. **← →** choose, **Enter** inspect, **Space** pick up /
     drop, **arrows** move 16px (**Shift** 64px), **Esc** cancel. The focused piece shows a small
     toolbar with **Inspect** and **Pick up**. The controls drawn inside each piece are `inert`.
     Moves are announced in a live region. **Tidy**, **Scatter** and a **Gravity** `role="switch"`.
  3. Physics (`matter-js`, loaded on demand) only when motion is allowed, the viewport is at
     least 768px and gravity is on. It moves the same DOM nodes (no canvas), bodies sleep when
     they rest, and the focused piece is held still.
  A single click or tap inspects a piece: dragging is never required.
- `prefers-reduced-motion: reduce` turns off physics, the typewriter and smooth scrolling, leaving
  only short opacity fades. The in-page **Motion: Full / Reduced** control does the same (the OS
  setting always wins).
- Projects, experience and contact work with JavaScript disabled. The layout works at 320px.

## Deploy

The template uses `@astrojs/vercel`: push the repo to Vercel and add `ANTHROPIC_API_KEY` in the
project settings (optional). Set `site` in `astro.config.mjs` to your domain.

To deploy elsewhere, swap the adapter:

```bash
npm remove @astrojs/vercel
npm install @astrojs/node      # or @astrojs/netlify
```

```js
// astro.config.mjs
import node from '@astrojs/node';
export default defineConfig({ adapter: node({ mode: 'standalone' }) /* … */ });
// or: import netlify from '@astrojs/netlify'; adapter: netlify()
```

Note: the rate limit is in memory, per serverless instance. For real abuse protection put a shared
store (or your platform's firewall rules) in front of `/api/chat`.

## Stack

Astro 7 · Tailwind CSS 4 (`@tailwindcss/vite`) · TypeScript strict · framework-free custom
elements · `@anthropic-ai/sdk` · `matter-js` · fonts self-hosted with Fontsource
(Bricolage Grotesque, Figtree, JetBrains Mono — all variable).

## Credits

Concept by Jean Pierre Ramírez. Persona, companies and projects are fictional.
