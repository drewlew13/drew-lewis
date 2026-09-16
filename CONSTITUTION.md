# Constitution

The governing rules for this repository. Everything here is binding on every
contributor, human or agent. Where a rule and a convenience conflict, the rule
wins. Where this document and any other document conflict, this document wins.

Amendments are made by pull request that changes this file, and only this file,
with the reasoning in the PR description. See [Article 9](#article-9--amendment).

---

## Article 1 — Purpose

This repository builds and publishes a portfolio website representing Drew
Lewis and his professional experience.

**The site succeeds when** a hiring manager, client, or collaborator who has
never met Drew can, in under two minutes, understand what he does, see evidence
of it, and know how to reach him.

**Therefore:**

- Clarity outranks cleverness. A visitor's comprehension is the metric, not
  technical sophistication.
- Speed outranks richness. A portfolio that loads slowly has already failed the
  two-minute test.
- Accuracy is non-negotiable. This site is a professional representation; an
  inflated claim is a liability, not a feature.

Anything that does not serve a visitor's understanding is out of scope, however
interesting it may be to build.

---

## Article 2 — The branch model

### `main` is the clean baseline

`main` is the deployed state of the site. It is always releasable.

- **Never commit directly to `main`.** Every change arrives through a pull
  request.
- `main` is protected: merges require a passing CI run.
- A push to `main` automatically deploys to GitHub Pages. There is no separate
  release step, so a broken `main` is a broken production site.

### All work happens on feature branches

Branch from the current `main`, one branch per coherent change:

```
git switch main && git pull
git switch -c <type>/<short-description>
```

Use these prefixes:

| Prefix     | For                                                    |
| ---------- | ------------------------------------------------------ |
| `feat/`    | New pages, sections, or capabilities                   |
| `content/` | Copy, projects, roles — words and facts, not structure |
| `fix/`     | Something is broken and this unbreaks it               |
| `chore/`   | Dependencies, tooling, configuration, CI               |
| `docs/`    | Repository documentation, including this file          |

Keep branches short-lived. A branch open longer than a few days is a branch
that will conflict; split the work instead.

### Merging

- Squash merge into `main`. One change, one commit, one line of history.
- Delete the branch after merge.
- Never force-push a branch someone else has reviewed or checked out.
- Never rewrite `main`'s history for any reason.

---

## Article 3 — Nothing is committed until it is verified

This is the rule that makes fast iteration safe, and it is the one most likely
to feel inconvenient. It is still the rule.

**Before every commit:**

```bash
npm run verify
```

That command is the gate. It runs, in order:

1. `check:format` — Prettier, so diffs show intent rather than whitespace
2. `lint` — ESLint, including static accessibility rules on `.astro` templates
3. `check:astro` — TypeScript and Astro diagnostics
4. `build` — the production build actually completes
5. `test` — Playwright: axe accessibility audit on every built page, plus an
   internal broken-link crawl

A commit is permitted only when `npm run verify` exits zero on the working tree
being committed. Not "it passed earlier". Not "only the CSS changed".

**Corollaries:**

- Do not commit to get a checkpoint. Use `git stash` or leave it uncommitted.
- Do not push a branch expecting CI to find the problem. CI is a backstop
  against environment drift, not a substitute for running the gate.
- If the gate is wrong — a false positive, a rule that does not apply — fix the
  gate in its own PR. Do not work around it, do not add an inline suppression
  without a comment explaining why, and never disable a check to get green.
- A failing test is never "flaky" until it has been proven flaky. Assume it
  found something real.

### What CI enforces

`.github/workflows/ci.yml` runs the same gate on every pull request. It is
required to pass before merge. It exists to catch what a local machine hides
(a missing dependency, an uncommitted file, a platform difference), not to do
the verifying for you.

---

## Article 4 — Technical invariants

These are settled. Changing any of them requires an amendment, because each one
has load-bearing consequences elsewhere.

### Stack

- **Astro** for the site. Static output only; no server runtime, because
  GitHub Pages serves files and nothing else.
- **Tailwind CSS v4** for styling, configured through `@tailwindcss/vite`.
- **TypeScript** in strict mode for anything that is not markup.
- **Node 24** (`.nvmrc`), matched by CI.

### Base path

The site is a GitHub Pages _project_ page at
`https://drewlew13.github.io/drew-lewis/`. It is served from a subpath, not the
domain root.

**Every internal link and asset reference must go through `withBase()`**
(`src/lib/url.ts`). A hard-coded `href="/about"` works in development and 404s
in production — the single most likely way to ship a broken site here. The link
crawl in the test suite runs against the real base path specifically to catch
this.

If the site ever moves to a custom domain or a user page, `site` and `base` in
`astro.config.mjs` change together, and the test suite's base URL with them.

### Styling

- **Tailwind utilities in markup** are the default. That is the point of
  Tailwind; do not fight it with parallel stylesheets.
- **Colours come from design tokens**, defined once in `src/styles/global.css`
  and consumed as `bg-surface`, `text-ink`, `text-accent`, and so on. Never
  write a raw hex value or an arbitrary colour in a component. A palette change
  must stay a one-file change.
- **Dark mode is not optional.** Tokens are defined for both schemes; any new
  token needs both values.
- **Mobile width is the default case**, not an adaptation. Most people opening
  a portfolio link are on a phone.

### JavaScript

The site ships zero client-side JavaScript by default, and that is a feature.
Any change that adds a client-side script must state in its PR description what
it does for the visitor that CSS and HTML cannot, and must leave the page
usable without it.

### Accessibility

WCAG 2.1 AA is the floor, enforced automatically by the axe suite. Automated
checks catch roughly half of real accessibility problems, so they are a floor
and not a ceiling: keyboard navigation, focus visibility, and heading order are
a human's responsibility to check.

---

## Article 5 — Content rules

The code can be rewritten. A false claim on a portfolio cannot be un-read.

- **Every factual claim must be true and defensible.** Dates, titles, scope of
  responsibility, technologies used, outcomes achieved. "Led" and "contributed
  to" are different words; use the accurate one.
- **Metrics need a real basis.** If a number cannot be substantiated, describe
  the work instead of quantifying it.
- **Nothing confidential ships.** No employer-internal detail, unreleased
  product, client name, or private metric without explicit permission from
  whoever owns it. When uncertain, leave it out — the site is not worth a
  professional problem.
- **Third-party content needs the right to use it.** Images, logos, and
  quotations included. Client logos in particular usually require permission.
- **Only Drew approves content about Drew.** An agent may draft, restructure,
  and edit for clarity, but must not invent biography, experience, opinions, or
  achievements. If a detail is unknown, ask or leave a placeholder — never fill
  the gap with something plausible.

---

## Article 6 — Secrets and privacy

- No secrets in the repository. Not in source, not in config, not in commit
  history. Everything here is public and permanent.
- No personal contact details beyond what is deliberately published. A public
  email address is a decision, not a default; a home address is never one.
- The only credentials the deployment needs are the GitHub Actions tokens the
  Pages workflow already grants itself. If a change appears to need a secret,
  that is a signal the change does not belong in a static site.

---

## Article 7 — Dependencies

Each dependency is a permanent maintenance obligation and a piece of supply
chain risk on a site that mostly needs HTML and CSS.

- Prefer the platform. Before adding a package, establish that CSS, HTML, or a
  dozen lines of local code will not do.
- New runtime dependencies are justified in the PR description.
- Dependencies are pinned exactly (no `^`, no `~`), and `package-lock.json` is
  committed. Builds must be reproducible.
- Dependabot proposes updates monthly. Updates go through the same gate as any
  other change; a green CI run is what makes an update mergeable, not its
  source.

---

## Article 8 — Roles

- **Drew** is the owner. He decides what the site says, approves content, and
  is the only one who can amend this constitution.
- **Agents and contributors** implement within these rules. They may propose
  amendments, refuse to proceed when a request conflicts with this document,
  and are expected to surface problems rather than route around them.

An agent that cannot satisfy a request within these rules says so and explains
why. It does not silently relax a rule to complete a task.

---

## Article 9 — Amendment

This document is expected to change as the site matures. It should be amended
deliberately, not eroded quietly.

1. Open a `docs/` branch changing `CONSTITUTION.md` alone.
2. State in the PR description what rule changes, and what problem changing it
   solves.
3. Merge it before opening work that depends on the new rule.

A rule that is routinely worked around is a bug in this document. Fix it here
rather than tolerating the drift.

---

## Appendix A — One-time setup

These configure GitHub itself and must be done through its web interface. Until
they are done, the rules above are conventions rather than constraints.

1. **Enable Pages.** Settings → Pages → Build and deployment → Source:
   **GitHub Actions**.
2. **Protect `main`.** Settings → Rules → Rulesets → New branch ruleset,
   targeting `main`:
   - Restrict deletions
   - Block force pushes
   - Require a pull request before merging
   - Require status checks to pass → add **Verify**
3. **Confirm the first deploy** at https://drewlew13.github.io/drew-lewis/.

## Appendix B — Command reference

| Command                | What it does                                            |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev`          | Development server with hot reload                      |
| `npm run build`        | Production build into `dist/`                           |
| `npm run preview`      | Serve `dist/` exactly as Pages will, base path included |
| `npm run verify`       | **The gate.** Everything below, in order                |
| `npm run check:format` | Prettier check                                          |
| `npm run format`       | Prettier write                                          |
| `npm run lint`         | ESLint, including template accessibility rules          |
| `npm run check:astro`  | TypeScript and Astro diagnostics                        |
| `npm test`             | Playwright: axe audit and internal link crawl           |
