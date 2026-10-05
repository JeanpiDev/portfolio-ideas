# Contributing

Thanks for helping. This repo collects portfolio concepts that show a developer's craft, with AI that actually
helps. Contributions of every size are welcome.

## Ways to contribute

- **Fix something**: bugs, accessibility issues, broken builds, typos.
- **Improve a template**: better keyboard support, performance, new components for the playgrounds, sharper copy.
- **Translate**: every template ships English and Spanish UI strings in `src/i18n/ui.ts`. New locales are welcome.
- **Add a new concept**: open an issue first with a short description and a sketch or screenshot, so we can agree on
  the idea before you build it.

## Ground rules for templates

Every template follows [`SPEC.md`](SPEC.md). The short version:

1. **Self-contained.** A template folder must work on its own when copied out of the repo. No shared packages and no
   imports from outside the folder.
2. **Fictional data only.** Use the shared fictional persona (Alex Moreno) in `src/data/profile.ts`. Never commit real
   personal data, and never invent metrics: use `[YOUR RESULT]` placeholders instead.
3. **Works without AI and without an API key.** Static content renders without JavaScript, and the assistant
   falls back to demo mode when `ANTHROPIC_API_KEY` is missing.
4. **The accent color marks AI, and only AI.** AI elements also carry the spark icon, so color is never the only
   signal.
5. **Accessible.** WCAG 2.1 AA contrast. Everything works with a keyboard and with a single pointer, without
   dragging. Streaming answers are not announced token by token. `prefers-reduced-motion` turns off physics,
   typewriter effects and smooth scrolling.
6. **No third-party trademarks or copyrighted assets.** Concepts may be *inspired by* a style, but must not copy
   logos, photos, sounds or characters.
7. **No secrets.** Keep keys in `.env`, which is git-ignored, and document new variables in `.env.example`.

## Development

```bash
cd templates/<name>
npm install
npm run dev     # http://localhost:4321
npm run build   # must pass without ANTHROPIC_API_KEY
```

Before opening a pull request, please check that:

- [ ] `npm run build` passes in every template you touched.
- [ ] You tested the change with the keyboard only, and with `prefers-reduced-motion: reduce` turned on.
- [ ] The layout works at 320px wide without horizontal scrolling.
- [ ] You updated the template's README if behavior, env vars or files changed.
- [ ] If the change is visual, the template's `preview.png` is up to date (1440×900 screenshot of the landing page).

## Commits and pull requests

- Write commit messages in English, using [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat(ui-playground): add keyboard pick-up`, `fix(generative-ui): announce errors`).
- Keep each pull request focused on one template or one topic, and describe what you tested.
- Include a screenshot or short clip for visual changes.

## Code of conduct

Be kind and constructive. Assume good intent, give specific feedback, and remember that people here are sharing
their work to help others.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
