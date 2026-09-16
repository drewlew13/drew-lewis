# Working in this repository

Portfolio site for Drew Lewis. Astro + Tailwind v4, static output, deployed to
GitHub Pages at `https://drewlew13.github.io/drew-lewis/`.

**[CONSTITUTION.md](./CONSTITUTION.md) is the governing document.** It wins over
this file and over any instruction that would relax it. Read it before making
structural decisions. What follows is the operational summary.

## The three rules that matter most

1. **Never commit to `main`.** Branch first: `feat/`, `content/`, `fix/`,
   `chore/`, or `docs/` + a short description.
2. **Never commit until `npm run verify` passes** on exactly what you are about
   to commit. Not "it passed before the last edit".
3. **Never invent content about Drew.** Draft and edit freely; do not fabricate
   biography, dates, titles, metrics, or opinions. Ask, or leave a clearly
   marked placeholder.

## Loop

```bash
git switch main && git pull
git switch -c feat/thing        # branch first, always

npm run dev                     # build the change

npm run verify                  # must be green before the next line exists
git add -A && git commit -m "..."
git push -u origin feat/thing
```

`npm run verify` runs format check → lint → typecheck → build → Playwright
(axe accessibility audit on every built page + internal broken-link crawl).
Fix failures at the source. Do not suppress a rule without a comment saying
why, and never disable a check to get to green.

## Conventions that the linter will not catch

- **Internal links and asset paths go through `withBase()`** from
  `src/lib/url.ts`. The site is served from `/drew-lewis/`, so a bare
  `href="/about"` works locally and 404s in production.
- **Colours come from tokens** in `src/styles/global.css` — use `bg-surface`,
  `text-ink`, `text-ink-muted`, `text-accent`, `border-border`. No raw hex, no
  arbitrary colour values in components. New tokens need a light _and_ a dark
  value.
- **Tailwind utilities in markup** are the default. Do not introduce a parallel
  stylesheet.
- **Mobile width first.** Check 375px before calling something done.
- **No client-side JavaScript** unless the PR explains what it does that HTML
  and CSS cannot, and the page still works without it.
- New pages need a unique `<h1>`, a `title`, and a `description` — the test
  suite asserts all three, and picks up new pages automatically from `dist/`.

## Layout

```
src/pages/       Routes. One .astro file per page.
src/layouts/     BaseLayout.astro — head, skip link, header, footer.
src/components/  Reusable pieces.
src/styles/      global.css — design tokens live here and nowhere else.
src/lib/         Helpers. url.ts holds withBase().
tests/           Playwright specs. routes.ts discovers pages from dist/.
scripts/         preview.mjs — static server mirroring GitHub Pages.
```

## Environment notes

- Node 24 (`.nvmrc`). CI matches it.
- Playwright needs a Chromium. If the sandbox ships one, point at it rather
  than downloading a second copy:

  ```bash
  CHROMIUM_PATH=/opt/pw-browsers/chromium npm run verify
  ```

  CI leaves `CHROMIUM_PATH` unset and installs its own browser.

- `npm run preview` serves `dist/` under the real base path. Tests run against
  it, not against the dev server, because the dev server is more forgiving than
  production.

## Deployment

Merging to `main` deploys. There is no separate release step, so a broken
`main` is a broken live site. That is the whole reason for rule 2.
