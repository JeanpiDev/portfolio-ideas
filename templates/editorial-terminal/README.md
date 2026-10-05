# Editorial Terminal — Astro portfolio starter

A bilingual (EN/ES) one-page portfolio with an **editorial layout** (big serif headlines, mono
section labels, ruled-paper background) and a **terminal-prompt motif** (`visitor@alex:~$ whoami`),
plus an **AI assistant** that answers questions about the person — grounded in the site's own
data, streamed, with cited sources.

> **The person on this site, "Alex Moreno", is fictional.** All personal content lives in
> `src/data/profile.ts`. Replace it with your own before publishing.

## Why it works

- **Reads like a résumé, feels like a tool.** Recruiters get the classic sections (Hero, About,
  Experience, Projects, Skills, Contact) in a calm editorial rhythm; developers get the terminal wink.
- **One accent, one meaning.** The vermilion accent marks **AI and only AI** (assistant buttons, the
  modal, recruiter mode, "Ask the AI about this" on project cards) and always comes with a spark icon.
  Every other action is ink. When you see the color, you know a model is involved.
- **The AI is honest.** It answers only from `profile.ts`, speaks about the person in the third
  person, cites every answer and says so when it does not know.

## Features

- Sections: Hero, About, Experience, Projects, Skills, Contact. Static, readable without JavaScript.
- AI assistant modal (`src/components/AskModal.astro`, a framework-free custom element):
  - NDJSON streaming from `/api/chat` with a typewriter reveal (instant under reduced motion).
  - Conversational memory: the client sends the last 6 entries with each request; the server
    sanitizes them. No server-side state.
  - **Recruiter mode**: one button sends a predefined pitch prompt and shows a short label.
  - Project cards rendered from tool calls (ids validated server-side), numbered source links that
    jump to the right section, Stop button, Retry on errors, focus trap, Escape to close.
  - **Demo mode**: works with no API key; the UI shows "Demo mode — add ANTHROPIC_API_KEY for live answers".
- Project carousel (manual: buttons, dots, arrow keys, swipe; no autoplay).
- Drawn HTML/CSS project previews until you add screenshots.
- Mobile floating dock, dark/light theme toggle (no flash), EN/ES i18n.
- Contact form via [Web3Forms](https://web3forms.com) with mailto fallback.
- Sitemap, dynamic `robots.txt`, Open Graph/Twitter meta, Vercel Web Analytics.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321 → /en/ and /es/
npm run build    # works without any env var
npm run preview
```

Astro 7 runs `astro dev` as a background daemon. If it says "Dev server already running", run
`npx astro dev stop` first.

## Environment variables

Copy `.env.example` to `.env`. Everything is optional.

| Variable | Where | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | server secret | Live answers from Claude. Empty = demo mode. |
| `ANTHROPIC_MODEL` | server | Model id. Default `claude-haiku-4-5`. |
| `PUBLIC_SITE_URL` | public | Your domain: sitemap, canonical/OG URLs, robots.txt. |
| `PUBLIC_WEB3FORMS_KEY` | public | Enables the contact form. Empty = mailto link only. |

The API key is read with `astro:env/server` and never reaches the browser.

## Where to edit

| What | File |
| --- | --- |
| All personal content (name, bio, experience, projects, skills, links, FAQ for the AI) | `src/data/profile.ts` |
| UI strings (EN + ES, same keys; `{name}` = first name) | `src/i18n/ui.ts` |
| Theme: colors, fonts, radii, motion | `src/styles/global.css` (documented at the top) |
| Site URL, Web3Forms key, social list | `src/config.ts` |
| Icons | `src/components/Icon.astro` (add to the `icons` map) |
| Tech logos on badges | `src/lib/techIcons.ts` (name → simple-icons slug) |
| Assistant prompt, modes | `src/lib/assistant.ts` |
| Demo answers | `src/lib/demo.ts` |
| Favicon / OG image | `public/favicon.svg`, `public/og.svg` |

**Project screenshots.** Put images in `src/assets/projects/` and list their file names in the
project's `images` field in `profile.ts`. They are rendered with `<Image>` from `astro:assets`
(webp, responsive sizes, lazy) and replace the drawn preview. Several images = carousel slides.

**OG image.** `public/og.png` is rendered from `public/og.svg`. After editing the SVG:
`rsvg-convert -w 1200 -h 630 public/og.svg -o public/og.png` (or export it from any design tool).

## The AI endpoint

`POST /api/chat` (`src/pages/api/chat.ts`, the only serverless route).

- Request: `{ message, lang: 'en'|'es', history?: {role, content}[], mode?: 'chat'|'recruiter', context?: projectId }`.
  Max 500 characters, history sanitized and cut to the last 6 entries, unknown `mode`/`context`
  rejected, best-effort in-memory rate limit (8 requests/min/IP).
- Response: NDJSON, one event per line:
  `{"type":"text","delta":"…"}` · `{"type":"component","name":"project","id":"loan-simulator"}` ·
  `{"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}` ·
  `{"type":"done"}` · `{"type":"error","code":"rate_limited"|"too_long"|"empty"|"upstream"|"stream_cut"|"invalid_request"}`.
  Header `X-Assistant-Mode: demo|live`.
- Live mode uses `@anthropic-ai/sdk` `messages.stream()` with two tools (`show_project`,
  `cite_sources`); ids are validated against `profile.ts`, so the model never sends HTML. The
  system prompt (both languages, every block tagged with a source id) carries `cache_control`.
  Note that very short prompts fall under the model's minimum cacheable length and simply are not cached.
- Demo mode picks a canned, grounded answer by keyword matching over `profile.ts` and streams it
  with the same events (text, a project card, sources).

## Theme

Identity: **midnight ink + paper + vermilion**. Dark is the default; `.light` on `<html>` switches,
persisted in `localStorage` and applied before first paint.

| Token | Dark | Light |
| --- | --- | --- |
| `--bg` | `#0b0e14` | `#f5f3ee` |
| `--bg-soft` | `#0f131b` | `#ece9e1` |
| `--surface` | `#121722` | `#fbfaf7` |
| `--surface-2` | `#181e2b` | `#efece5` |
| `--border` (hairlines only, never text) | `#232a38` | `#dcd8ce` |
| `--border-strong` (control borders) | `#6b7487` | `#7b8089` |
| `--text` | `#e8ebf2` | `#141821` |
| `--muted` | `#a1a9b8` | `#535b69` |
| `--faint` | `#8c95a5` | `#616875` |
| `--accent` (AI only) | `#ff8a5c` | `#b4441a` |
| `--accent-ink` (accent as small text) | `#ff8a5c` | `#9c3913` |
| `--accent-contrast` (text on accent fill) | `#0b0e14` | `#ffffff` |
| `--danger` | `#ff7b8a` | `#b3261e` |
| `--focus` | `var(--text)` | `var(--text)` |

Measured contrast (WCAG 2.x), worst case across `bg`, `bg-soft`, `surface`, `surface-2`:

| Pair | Dark | Light |
| --- | --- | --- |
| text | 13.97 – 16.19 | 14.64 – 17.02 |
| muted | 7.05 – 8.17 | 5.64 – 6.56 |
| faint | 5.52 – 6.40 | 4.62 – 5.37 |
| accent-ink | 7.18 – 8.32 (6.40 on the 12% accent tint) | 5.75 – 6.69 (5.62 on the tint) |
| danger | 6.71 – 7.77 | 5.39 – 6.26 |
| border-strong (non-text, ≥ 3:1) | 3.55 – 4.11 | 3.27 – 3.80 |
| accent-contrast on accent | 8.32 | 5.55 |

The light `--accent` itself (`#b4441a`) is 4.47:1 on the accent tint, so small accent text always
uses `--accent-ink`.

Fonts (self-hosted, `@fontsource-variable/*`): **Newsreader** (display serif), **Schibsted Grotesk**
(body), **Geist Mono** (prompt, labels, chat). The gallery SPEC suggests Bricolage Grotesque /
Figtree / JetBrains Mono; this template deliberately uses its own editorial identity.

## Accessibility

- Skip link, landmarks, one `h1` per page, no heading jumps, visible focus
  (`outline: 2px solid var(--focus)`), targets ≥ 44×44 px, works at 320 px without horizontal scroll.
- Content is visible without JavaScript: the `.reveal` entrance only hides content when the `js`
  class is set on `<html>` by the inline head script. Assistant buttons are hidden without JS.
- `prefers-reduced-motion: reduce`: no smooth scroll (CSS and the JS eased scroll are both gated),
  no transforms, no typewriter, no blinking cursor, only ≤150 ms opacity fades. No autoplay anywhere.
- Chat: visible input label, disclaimer linked with `aria-describedby`, streaming is not announced
  token by token (an `aria-live="polite"` region says "Writing…" and then the full answer once),
  `aria-busy` on the streaming message, citations are links named "Source 1: …", errors use
  `role="alert"` with a Retry action, no emoji in UI copy.

## Deploy

Built for **Vercel** (`@astrojs/vercel`): import the repo, set the env vars, done. To deploy elsewhere,
swap the adapter in `astro.config.mjs`:

```bash
npx astro add node      # or: npx astro add netlify
```

then replace `adapter: vercel()` with `node({ mode: 'standalone' })` or `netlify()`, and remove
`@vercel/analytics` from `src/layouts/Base.astro` if you do not use Vercel Analytics.

## Credits

Concept and original design by Jean Pierre Ramírez. Persona and content are fictional.
