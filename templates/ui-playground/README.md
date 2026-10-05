# UI Playground — portfolio starter (Astro)

> **"Throw. Stack. Inspect."** The landing page is a table of real UI components from your
> projects. Visitors throw and stack them with physics, then drop one on the magnifier — the
> **inspector** (AI) — which explains the piece: **Story / States / Code**.

The person on this site, **Alex Moreno, is fictional**. Every personal detail lives in
`src/data/profile.ts` (and the pieces in `src/data/pieces.ts`). Replace them with your own data.

## Why it works

- **Show, don't list.** Instead of a "Skills" grid, visitors touch the actual components you
  built: a loan slider, an OTP input, a live queue card… Each one leads to the project it came from.
- **Curiosity loop.** "Pieces discovered x/N" and a tray of extra pieces invite exploration.
- **AI where it helps.** The inspector turns a component into a short case study, grounded only in
  your own data, with citations. Recruiters who prefer paper get **Resume mode** (`/en/resume/`).

## What the AI does

`POST /api/chat` (the only serverless route) streams **NDJSON**:

```
{"type":"text","delta":"…"}
{"type":"component","name":"project","id":"loan-simulator"}
{"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}
{"type":"done"}
{"type":"error","code":"rate_limited"|"too_long"|"empty"|"bad_request"|"upstream"|"stream_cut"}
```

- Request: `{ message, lang: 'en'|'es', history?, mode?: 'chat'|'inspect', context?: <pieceId> }`.
  The Story tab sends `mode: 'inspect'` and `context: <pieceId>`.
- Validation: max 500 chars, history sanitised (valid roles, `slice(-6)`), best-effort in-memory
  rate limit (8 req/min/IP), unknown `mode`/`context` rejected against a whitelist.
- **Live mode** (`ANTHROPIC_API_KEY` set): `@anthropic-ai/sdk` `messages.stream()` with a system
  prompt built from `src/data/*`, every block tagged with a source id. Claude speaks about Alex in
  the third person, answers only from that context and ignores instructions that try to change its
  rules. Cards and citations come from **tool use** (`show_component`, `cite_source`); every id is
  validated against the data files, so the model never returns HTML. The system prompt uses
  **prompt caching** (`cache_control: ephemeral`). Note: a prefix shorter than the model's minimum
  cacheable length is simply not cached — harmless.
- **Demo mode** (no key): the endpoint still streams a canned, grounded answer picked by keyword
  matching over `src/data/*` (piece stories come from `pieces.ts`), including a component and
  sources. The response header `x-assistant-mode: demo` makes the UI show
  "Demo mode — add ANTHROPIC_API_KEY for live answers". The template is fully usable without a key.

## Run it

```bash
npm install
npm run dev       # http://localhost:4321 -> /en/ and /es/
npm run build     # production build (works without an API key)
npm run preview
```

Requires Node 20+.

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `ANTHROPIC_API_KEY` | no | – | Enables live answers. Server-only (`astro:env/server`), never sent to the browser. |
| `ANTHROPIC_MODEL` | no | `claude-haiku-4-5` | Any current Claude model id. |
| `PUBLIC_SITE_URL` | no | `https://example.com` | Used for canonical URLs. |

## Where to edit

| What | File |
| --- | --- |
| Name, role, summary, experience, projects, skills, contact | `src/data/profile.ts` |
| Pieces on the table / in the tray, their stories, states and code | `src/data/pieces.ts` |
| How each piece looks in each state | `src/components/PieceWidget.astro` |
| Widget behaviour (slider, OTP, tabs…) | `src/scripts/widgets.ts` |
| All UI copy (EN + ES, same keys) | `src/i18n/ui.ts` |
| Colours, radii, motion, fonts | `src/styles/global.css` (documented at the top) |
| Physics + keyboard | `src/scripts/playground.ts` |
| Inspector + streaming client | `src/scripts/inspector.ts` |
| Assistant prompt, sources, demo answers | `src/lib/knowledge.ts` |
| API route | `src/pages/api/chat.ts` |

The "Pieces discovered x/N" total is `pieces.length` — add a piece and it updates everywhere.
Descriptions are qualitative on purpose: replace `[YOUR RESULT]` placeholders with real results
instead of inventing metrics.

**Theme rule:** `--accent` marks AI and only AI (the lens, AI answers, citations), always with the
spark icon. Normal actions use the ink colour.

## Progressive enhancement & accessibility

Three layers, each one works on its own:

1. **HTML only.** The table is a plain list of pieces in a grid. Each has an **Inspect** link to a
   static page (`/en/pieces/<id>/`) with the case study, every state and the code. Resume mode,
   experience, projects and contact need no JS.
2. **JS.** Roving tabindex across pieces (arrow keys, DOM order). **Enter** inspects, **Space**
   picks up / drops, arrows move a picked-up piece 16px (**Shift**: 64px), **Escape** cancels.
   The focused piece shows a toolbar [Inspect] [Pick up]. Announcements go to a polite live region.
   Inner controls of pieces on the table are `inert` (they are operable in the States tab).
   A single click/tap inspects — dragging is never required (WCAG 2.5.7).
3. **Physics** (`matter-js`) moves the **same DOM nodes** with CSS transforms (no canvas). It only
   runs with motion "full", viewport ≥ 768px and gravity on. Bodies sleep (the loop stops when
   everything rests) and the keyboard-focused piece becomes static. Drag to throw; drop on the lens
   to inspect.

Other details:

- The inspector is an `aside` with a real `tablist` (Story / States / Code).
- Chat input has a visible label and an `aria-describedby` disclaimer. Streaming is **not**
  announced token by token: a `sr-only` live region says "Writing…" then the full answer once;
  the message has `aria-busy` while streaming. Citations are links named "Source 1: …".
  Errors appear in `role="alert"` with an action (Retry, or back to the input).
- `prefers-reduced-motion: reduce` **or** the in-page **Motion: full / reduced** toggle: no physics,
  no progressive text reveal (the answer appears at once), no smooth scroll, only short opacity fades.
- Skip link, landmarks, one `h1`, visible focus ring, 44×44px targets, no horizontal scroll at 320px.
- Dark by default; light theme persisted in `localStorage` with no flash (inline script in `<head>`).

## Deploy

Configured for **Vercel** (`@astrojs/vercel`): pages are prerendered, only `/api/chat` is a
function. Set `ANTHROPIC_API_KEY` (optional) in the project settings.

Other hosts — swap the adapter in `astro.config.mjs`:

```bash
npm i @astrojs/node      # then: adapter: node({ mode: 'standalone' })
npm i @astrojs/netlify   # then: adapter: netlify()
```

The rate limit is in memory and per instance (best effort). Use a shared store (e.g. Redis) if you
need a strict limit.

## Stack

Astro 7 · Tailwind CSS 4 (`@tailwindcss/vite`) · TypeScript strict · framework-free islands
(plain TypeScript in `<script>` tags) · `matter-js` · `@anthropic-ai/sdk` · fonts self-hosted with
`@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/figtree` and
`@fontsource-variable/jetbrains-mono`.

## Credits

Concept by Jean Pierre Ramírez. Persona, companies and projects are fictional placeholders.
