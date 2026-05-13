# Sigildle

> Forge today's **sigil** in six tries — a daily symbol puzzle.

A tiny browser game: each day a hidden sigil (a four-symbol sequence drawn from
an alphabet of eight primitives) is generated deterministically from the date.
You guess; the slots light up Wordle-style; you share your grid. No accounts, no
server, no tracking — pure static files on GitHub Pages.

Part of [PRYSYM](https://github.com/PRYSYM). The "deterministic, shareable
symbol" idea is borrowed from
[open-identity-symbols](https://github.com/PRYSYM/open-identity-symbols) — but
Sigildle uses none of its cryptography; the symbols here are decorative.

## Play

→ https://prysym.github.io/sigildle/

Keyboard: <kbd>1</kbd>–<kbd>8</kbd> place a symbol · <kbd>←</kbd>/<kbd>→</kbd>
move the cursor · <kbd>⌫</kbd> clear · <kbd>↵</kbd> forge.

## Develop

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests (rng / match / share)
npm run build    # type-check + production build into dist/
```

Stack: vanilla TypeScript + Vite. No framework. SVG for the glyphs,
`localStorage` for streaks, a seeded PRNG (xmur3 + mulberry32) for the daily
puzzle.

```
src/
  game/      config, rng, primitives, target, match, engine
  state/     localStorage progress + stats
  ui/        view (HTML builders), share (emoji grid)
  main.ts    bootstrap + input handling
```

## Deploy

Push to `main` → the workflow in `.github/workflows/deploy.yml` builds and
publishes to GitHub Pages. In the repo settings, set **Pages → Source → GitHub
Actions**. The `base` in `vite.config.ts` (`/sigildle/`) must match the repo
name; change both if you fork under a different name.

## Roadmap

- [x] Practice mode — endless rounds, scaling size (3 → 6 symbols)
- [x] Animated tile reveal + win bounce
- [x] Share: copy emoji grid to clipboard, or one-tap post to 𝕏 / Bluesky
- [x] Zen mode — free-compose a sigil, export PNG/SVG, share via `#z=` URL hash
- [x] Sound — tiny Web Audio synth, mute toggle (persisted)
- [x] Daily solve timer (local) shown on the win card and in the share text
- [ ] Daily leaderboard / "champion of the day" (needs a small backend — see below)
- [ ] More difficulty knobs in practice (transforms, layering)
- [ ] Real OIS primitive set behind a "what is this?" link

### Leaderboard (not built)

GitHub Pages is static, so a real cross-player leaderboard needs a tiny backend
(a Cloudflare Worker + KV/D1 would do it, or Supabase). It would record
`{ day, name, tries, solveMs }` and serve a per-day JSON the site fetches. Until
then, the share text carries `#N · tries · ⏱time` so players can compare by
screenshot.

## License

MIT
