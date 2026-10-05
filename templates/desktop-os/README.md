# Desktop OS — portfolio starter (Astro)

A portfolio that boots into **AlexOS**, a desktop inspired by the early-2000s desktop aesthetic:
glossy blue title bars, a green start button, a rolling green hill under a blue sky, explorer
windows and yellow balloon tips. Your sections are apps: **Projects** (an explorer window with
menu bar, toolbar, address bar, collapsible task pane, filter chips and grouped items),
**About.txt**, **Experience**, **Resume**, **Contact**, and an **Archive** bin in the bottom-right
corner for older work.

> **Alex Moreno is a fictional person.** All personal content lives in `src/data/profile.ts`.
> Replace it with your own data before you publish.

> **Not affiliated.** This template is an original homage to the early-2000s desktop look. It
> contains no logos, wallpapers, icons, sounds or names from any operating system vendor; all
> art is drawn from scratch in CSS and inline SVG. It is not affiliated with or endorsed by any
> operating-system company.

## Why it works

- **Memorable, but never in the way.** Recruiters get a playful desktop on wide screens, and
  a normal, fast, scrolling page everywhere else: phones (< 768px), no-JS visitors, search
  engines, screen-reader users who prefer it, and anyone who clicks **Classic mode**.
- **The static HTML is the real content.** Every window is a real `<section>` with a heading.
  JavaScript only upgrades it into windows.
- **AI where it helps.** A tiny helper offers one tip per window, and the Start menu search
  answers questions with citations that open the right window.

## What the AI does

Both features call the same endpoint, `POST /api/chat` (see "AI endpoint" below).

1. **Assistant.exe** — an original helper character drawn in inline SVG. When you open a
   window it shows a balloon tip about that window (`mode: 'tip'`, `context: <windowId>`).
   Tips are cached per window, can be dismissed (X, "Got it" or Esc), never block content,
   never steal focus, and can be turned off from the balloon, the taskbar tray or
   Start > All Programs. The choice is stored in `localStorage` (`buddy=off`).
2. **Start menu search** — "Ask my assistant". Answers stream into a balloon flyout next to
   the Start menu, with numbered citations (`[1] Projects · Loan simulator`). Citations and
   project cards open the related window and highlight the item. On the classic page the same
   search is an inline section.

**AI visual rule for this template:** AI = balloon-tip yellow (`--balloon: #ffffe1`, black
border) **plus** the spark icon. Nothing else uses that yellow.

### Demo mode (no API key)

Without `ANTHROPIC_API_KEY` everything still works: the endpoint streams a canned answer chosen
by simple keyword matching over `profile.ts`, including a project card and a source, and tips
come from `profile.demoTips`. The UI shows "Demo mode — add ANTHROPIC_API_KEY for live
answers". The response header `X-Assistant-Mode: demo|live` tells the client which mode is on.

## Use your own wallpaper

The default wallpaper is an original SVG landscape (`src/components/Wallpaper.astro`): a deep-blue
sky, soft cumulus clouds and one rolling green hill. It is drawn from scratch; do not replace it
with a copyrighted photo. To use your own image, drop a file **you have the rights to** at
`public/wallpaper.jpg` (picked up automatically at build time), or set
`config.wallpaper = '/my-image.webp'` in `src/config.ts`.

## Run it

```bash
npm install
npm run dev      # http://localhost:4321/en/ and /es/
npm run build    # works without an API key
npm run preview
```

Requires Node 22.12+.

## Environment variables

Copy `.env.example` to `.env`.

| Variable            | Required | Default            | What it does                                             |
| ------------------- | -------- | ------------------ | -------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | no       | —                  | Enables live answers. Without it: demo mode.             |
| `ANTHROPIC_MODEL`   | no       | `claude-haiku-4-5` | Claude model for the assistant.                          |
| `PUBLIC_SITE_URL`   | no       | `https://example.com` | Canonical / Open Graph URLs.                          |

The key is read with `astro:env/server` and never reaches the browser.

## Where to edit

| What                                     | File                                     |
| ---------------------------------------- | ---------------------------------------- |
| Name, bio, experience, projects, skills, demo tips | `src/data/profile.ts`          |
| Every UI string (EN + ES, same keys)     | `src/i18n/ui.ts`                         |
| Colour schemes, chrome, layout, motion   | `src/styles/global.css` (documented at the top) |
| Window contents                          | `src/components/windows/*.astro`         |
| Icons (inline SVG)                       | `src/components/Icon.astro`              |
| Wallpaper                                | `src/components/Wallpaper.astro`, `src/config.ts` |
| Explorer chrome / task-pane boxes        | `src/components/ExplorerChrome.astro`, `src/components/PaneBox.astro` |
| Start menu + taskbar                     | `src/components/Taskbar.astro`           |
| Window manager                           | `src/scripts/wm.ts`                      |
| AI endpoint / system prompt / demo mode  | `src/pages/api/chat.ts`, `src/lib/assistant.ts` |
| Boot + welcome screen (optional)         | `src/components/Boot.astro` (delete the `<Boot>` line in `Home.astro` to remove it) |

Use `[YOUR RESULT]` placeholders for numbers you can actually back up. Do not invent metrics.

## Themes

Three colour schemes, chosen from **Start > Theme** (cycles) or the select on the classic page,
stored in `localStorage` (`theme`) and applied before paint (no flash):

- **Blue** (default) · **Olive Green** · **Silver**

The look does not follow `prefers-color-scheme` on purpose (it is a period design with
`color-scheme: light`). Measured contrast (WCAG relative luminance; for gradients, the band
the glyphs actually sit on):

| Element                          | Blue                              | Olive                    | Silver                 |
| -------------------------------- | --------------------------------- | ------------------------ | ---------------------- |
| Active title text                | #fff on #0053ee–#0066ff: 6.05–4.83 | #fff on #5f7a2c–#4b6a22: 4.88–6.21 | #000 on #f0f1f5–#b4b8c8: 18.6–10.6 |
| Inactive title text              | #0a1f5c on #b9cdf2–#9db9eb: 9.59–7.75 | #2f3f10 on #dfe5c8–#c8d3a0: ≥ 7.22 | #444 on #e6e8ee: 7.95 |
| Taskbar button (inactive/active) | 4.68 / 7.13                       | 4.91 / 8.98              | 13.1 / 10.6            |
| Tray clock                       | #fff on #0e74cc: 4.78             | #fff on #4b6a22: 6.21    | #000 on #dfe1e8: 16.1  |
| Start-menu name and footer       | #fff on #0e60cb–#1e70d9: 5.91–4.80 | ≥ 4.88                  | black on light grey ≥ 13 |
| Primary task-pane header         | #fff on #0054e3–#2f71cd: 6.22–4.81 | #fff on #4b6a22–#5c7a2e ≥ 4.91 | #2a3a6a on white ≥ 8.9 |

Shared: "start" label (21px bold italic, large text) #fff on #3c9a3c–#327f32 3.57–4.98 ·
task-pane links #215dc6 on #d6dff7 4.57 · Start right column #00136b on #d3e5fa 12.5 · grey
subtitles #555 on #fff 7.46 · body #000 on #ece9d8 17.2 · balloon #000 on #ffffe1 20.6 ·
selection #fff on #316ac5 5.25. Desktop icon labels are white with a dark halo over the
wallpaper and get a solid #316ac5 background when focused or selected.

Where the period look and AA disagreed, AA won: inactive title bars use dark text on a lighter
blue (the classic white-on-pale-blue fails), the inactive taskbar button blue is a touch deeper
than the classic one, and the tray's middle band is darker than the classic light cyan.

Fonts are system fonts only: `Tahoma, 'Segoe UI', Verdana, sans-serif` (nothing bundled), with
a 12px minimum text size.

## Window manager and keyboard

`<window-manager>` is a framework-free custom element (`src/scripts/wm.ts`).

- Windows are **non-modal** `role="dialog"` elements labelled by their title (`aria-labelledby`).
- Title-bar buttons are real buttons with labels ("Minimize Projects", "Maximize/Restore …",
  "Close …"): 24px white-bordered rounded squares inside 44×44px hit areas.
- Task-pane group headers are buttons with `aria-expanded`; the round double-chevron collapses
  the group. Toolbar **Folders** (`aria-pressed`) hides/shows the task pane, **Views** switches
  tiles/list. Back, Forward, Up, the menu bar and the address bar are decorative
  (`aria-hidden`, not focusable).
- Start menu: pinned items, recent projects, **All Programs** (disclosure with every window and
  the Assistant/motion toggles), right column links, Theme / Language / Classic mode, and a footer
  with **Classic mode** and **Close all windows**.
- Desktop icons, Start-menu items and citations are real links (`href="#win-…"`). A single
  click, tap or Enter opens a window (double-click works too). Without JS they scroll to the
  section.
- **Alt+Shift+Arrow keys** move the focused window by 16px. **Esc** closes it and returns focus
  to whatever opened it (icon, Start item or taskbar tab).
- Taskbar tabs restore/focus a window, or minimize it if it is already active. The quick-launch
  "Show desktop" button minimizes everything.
- Dragging the title bar uses pointer events, but **dragging is never required**.

## Classic mode

"Classic mode" is a prominent link in the Start menu footer and in the second skip link
("Switch to classic page"). It is plain `?view=classic` (remembered in `localStorage`;
`?view=desktop` switches back). Classic mode is also what no-JS visitors and viewports under
768px get: the same sections as a normal scrolling page.

## Accessibility & motion

- Two skip links, landmarks (`header`, `nav`, `main`, `footer`, taskbar region), one `h1`, no
  heading jumps, visible focus (2px outline plus a contrasting gap so it shows on any colour).
- Targets ≥ 44×44px. Works at 320px with no horizontal scroll.
- Chat: visible label, `aria-describedby` disclaimer, streaming is **not** announced token by
  token (a polite live region says "Writing…" and then reads the full answer once),
  `aria-busy` on the streaming message, citations are links named "Source 1: …", errors are
  `role="alert"` with a Retry action.
- `prefers-reduced-motion: reduce` (or the in-page **Motion: full / reduced** toggle in the
  tray, Start menu and classic header): no window open animation (close is never animated),
  no smooth scroll, no boot screen, and answers render once instead of streaming in.
- The boot/welcome screen is shown once, is `aria-hidden`, has nothing focusable, and any key,
  click or tap dismisses it immediately.

## AI endpoint

`src/pages/api/chat.ts` (the only serverless route; everything else is prerendered).

Request: `{ message, lang: 'en'|'es', history?: {role, content}[], mode?: 'chat'|'search'|'tip', context?: windowId }`

- `message` ≤ 500 chars (ignored, and may be empty, when `mode` is `tip`).
- `history` sanitized to `user`/`assistant` string turns, `slice(-6)`.
- Unknown `mode` / `context` → 400 `bad_request`.
- Best-effort in-memory rate limit: 8 requests / minute / IP (per serverless instance; it
  trusts `x-forwarded-for`, which Vercel sets).

Response: NDJSON, one event per line:

```
{"type":"text","delta":"…"}
{"type":"component","name":"project","id":"loan-simulator"}
{"type":"source","n":1,"id":"projects.loan-simulator","label":"Projects · Loan simulator"}
{"type":"done"}
{"type":"error","code":"rate_limited"|"too_long"|"empty"|"bad_request"|"upstream"|"stream_cut"}
```

Live mode uses `@anthropic-ai/sdk` `client.messages.stream()` with two client tools,
`cite_sources` and `show_project`. Their ids are validated against `profile.ts` before any
event is sent; the model never returns HTML. The system prompt is built from `profile.ts`
(each block tagged with a source id), talks about the person in the third person, answers only
from that context, and ignores attempts to change its rules. It is marked for prompt caching
(note: very short prompts fall under the model's minimum cacheable size and are simply not
cached). `stream_cut` is detected by the client when the stream ends without `done`.

## Deploy

Configured for **Vercel** (`@astrojs/vercel`): import the repo, add `ANTHROPIC_API_KEY`
(optional) and `PUBLIC_SITE_URL`, deploy.

Other hosts: swap the adapter in `astro.config.mjs`:

```bash
npx astro add node      # @astrojs/node  (then: adapter: node({ mode: 'standalone' }))
npx astro add netlify   # @astrojs/netlify
```

## Stack

Astro 7 · Tailwind CSS 4 (`@tailwindcss/vite`) · TypeScript strict · framework-free custom
elements · `@anthropic-ai/sdk`. No UI framework, no bundled fonts, no images (all art is
CSS/SVG). `xp.css` was not used; the chrome is written from scratch.

## Credits

Concept by Jean Pierre Ramírez. Persona "Alex Moreno" and all companies are fictional.
Visual style inspired by the early-2000s desktop aesthetic; all artwork (icons, wallpaper,
logo, user tile, helper character) is original inline SVG/CSS. No vendor logos, names, sounds
or wallpapers are included.
