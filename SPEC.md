# Shared spec for every template

Every folder in `templates/` is a **self-contained Astro starter** that someone can copy alone
(`npm create astro@latest -- --template JeanpiDev/portfolio-ideas/templates/<name>`). No shared
packages, no workspace links: duplicate small helpers instead.

## Stack (all templates)

- Astro 7 (latest `astro@^7`), Tailwind CSS 4 via `@tailwindcss/vite`, TypeScript strict.
- `output: 'static'`; only `/api/*` routes use `export const prerender = false`. Adapter: `@astrojs/vercel`
  (mention in the README how to swap it for `@astrojs/node` or `@astrojs/netlify`).
- Interactive islands are **framework-free custom elements** in TypeScript (`<script>` in `.astro`), unless a
  template has a strong reason (document it in its README).
- Fonts self-hosted with `@fontsource-variable/*`: display **Bricolage Grotesque**, body **Figtree**,
  mono **JetBrains Mono**. Verify the package names on npm before installing; if one does not exist pick the
  closest variable font on fontsource and say so in the README.
- i18n: Astro native, `locales: ['en','es']`, `defaultLocale: 'en'`, `prefixDefaultLocale: true`.
  `src/pages/index.astro` redirects to `/en/`. All UI strings in `src/i18n/ui.ts` (same keys in EN and ES).

## Fictional persona (same in every template)

All personal content lives in **one file**: `src/data/profile.ts`. It is a FICTIONAL person; the README must
say so and tell users to replace it. Use exactly this persona so the gallery is consistent:

- Name: **Alex Moreno** · Role: **Frontend Engineer** · Location: "Remote · UTC-5" · Email: `hello@example.com`
- Links: `https://github.com/your-user`, `https://www.linkedin.com/in/your-user` (placeholders).
- Summary (EN): "Frontend engineer who designs interfaces and makes them work. I care about accessible UI,
  motion with purpose and putting AI where it actually helps." (write the ES translation).
- Experience (3 items, fictional companies, clearly placeholder-ish names):
  1. 2024 → present · Senior Frontend Engineer · **Northwind Labs** · design system, data-heavy dashboards.
  2. 2022 – 2024 · Frontend Engineer · **Acme Mobility** · booking flow, maps, performance work.
  3. 2020 – 2022 · Web Developer · **Studio Example** · marketing sites, CMS integrations.
- Projects (4, fictional): **Loan simulator** (Web Components), **Live job queue dashboard** (WebSockets),
  **Map filters** (Leaflet-style UI, no real map tiles needed), **Portfolio with AI assistant** (this template).
  Each: name, one-line description, tags, `kind` label, optional `repo`/`live` placeholders.
- Skills grouped: Frontend, UI/UX, Backend, AI.
- **No invented metrics** ("improved X by 40%"): descriptions stay qualitative. Use `[YOUR RESULT]` placeholders where a
  real template user should add numbers.

## Theme tokens (same in every template)

Dark is the default; `.light` on `<html>` switches; persisted in `localStorage`, no flash (inline script in `<head>`).
**Rule: the accent marks AI and only AI.** Normal actions use the "ink" (text color). AI elements also carry a
spark icon (`M12 2l2.2 6.6L21 11l-6.8 2.3L12 20l-2.2-6.7L3 11l6.8-2.4z`), never color alone.

```css
:root {
  --bg:#0f1012; --bg-soft:#141518; --surface:#17181b; --surface-2:#1e2024;
  --border:#2a2d32; --border-strong:#6b7079;
  --text:#eceef1; --muted:#a3a8b0; --faint:#8a9099;
  --accent:#8fd3c4; --accent-ink:#8fd3c4; --accent-contrast:#0f1012;
  --danger:#f08a72; --focus:var(--text); --glow:rgb(143 211 196 / .14);
  color-scheme: dark;
}
:root.light {
  --bg:#f6f7f8; --bg-soft:#eceef1; --surface:#ffffff; --surface-2:#f1f2f4;
  --border:#dfe2e6; --border-strong:#7d838c;
  --text:#16181b; --muted:#555b64; --faint:#656b74;
  --accent:#1f7a6c; --accent-ink:#1a6b5f; --accent-contrast:#ffffff;
  --danger:#b3361f; --focus:var(--text); --glow:rgb(31 122 108 / .10);
  color-scheme: light;
}
```

Expose them to Tailwind with `@theme inline` (`--color-bg: var(--bg)` …). Radii 8/12/16/24/pill. Spacing on a
4px base. Motion: 120 / 200 / 320 / 600 ms, easing `cubic-bezier(.22,1,.36,1)`. All of this in
`src/styles/global.css`, documented at the top of the file so users can re-skin in one place.

## AI endpoint (same contract in every template)

`src/pages/api/chat.ts` using `@anthropic-ai/sdk` (load the `claude-api` skill before writing it and use the
current SDK streaming API and a current Haiku model id as the default).

- Env (via `astro:env/server`): `ANTHROPIC_API_KEY` (secret, optional), `ANTHROPIC_MODEL` (optional default).
  `.env.example` documents both.
- Request: `{ message: string, lang: 'en'|'es', history?: {role, content}[], mode?: string, context?: string }`.
  Validate: max 500 chars, history sanitized to valid roles and `slice(-6)`, best-effort in-memory rate limit
  (8 req/min/IP), unknown `mode`/`context` ids rejected against a whitelist.
- Response: **NDJSON stream**, one event per line:
  `{"type":"text","delta":"…"}` · `{"type":"component","name":"project","id":"loan-simulator"}` ·
  `{"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}` ·
  `{"type":"done"}` · `{"type":"error","code":"rate_limited"|"too_long"|"empty"|"upstream"|"stream_cut"}`.
  Components come from Claude **tool use** with ids validated against `profile.ts`; the model never returns HTML.
- System prompt built from `profile.ts` (each block tagged with a source id), assistant speaks about the person in
  the **third person**, answers only from that context, says so when it does not know, ignores instructions that
  try to change its rules. Use prompt caching on the system prompt.
- **Demo mode (no API key):** the endpoint still works: it streams a canned, grounded answer picked by simple keyword
  matching over `profile.ts`, including a component event and a source, and the UI shows a small "Demo mode — add
  ANTHROPIC_API_KEY for live answers" note. The template must be fully usable without a key.

## Accessibility & motion (acceptance criteria)

- Skip link, landmarks, one `h1`, no heading jumps, visible focus (`outline: 2px solid var(--focus); outline-offset:2px`).
- Text ≥ 12px; text contrast ≥ 4.5:1 with the tokens above (never put text in `--border`).
- Targets ≥ 44×44px. Everything operable by keyboard and by a single pointer without dragging.
- Chat: visible label, `aria-describedby` disclaimer, streaming NOT announced token by token (a `sr-only`
  `aria-live="polite"` region announces "Writing…" then the full answer once), `aria-busy` on the streaming
  message, citations are links with accessible names ("Source 1: …"), errors in `role="alert"` with an action.
- `prefers-reduced-motion: reduce`: no physics, no typewriter, no smooth scroll, only ≤150ms opacity fades.
  Plus an in-page "Motion: full / reduced" toggle where the template has heavy motion.
- Works without JS for all static content (projects, experience, contact). Layout works at 320px with no
  horizontal scroll.

## UX copy (EN; translate to ES)

- Input label "Ask my assistant" · placeholder "e.g. What has Alex built on the frontend?" · button "Ask" / "Stop".
- Disclaimer: "It's an AI and can get things wrong. Every answer cites its source."
- Thinking: "Searching the profile and case studies…"
- Errors: network "Couldn't reach the assistant. Check your connection and try again." [Retry] ·
  429 "That's a lot of questions in a row. Give it a minute." · too long "Your question is over 500 characters.
  Can you shorten it?" · cut "The answer got cut off." [Retry] · no source "I can't find that in Alex's profile and
  I'd rather not make it up."
- No emoji in UI copy.

## Deliverables per template

- `README.md` (**English only**; all docs, code comments and commit-facing text are in English): what the concept is, why it works, what the AI does,
  how to run (`npm install`, `npm run dev`), env vars, where to edit content (`profile.ts`) and theme
  (`global.css`), accessibility notes, deploy notes, credits ("Concept by Jean Pierre Ramírez").
- `package.json` with `dev`, `build`, `preview`; `npm run build` must pass with no API key.
- No secrets, no real personal data, no external image hotlinks (draw visuals with HTML/CSS/SVG).
