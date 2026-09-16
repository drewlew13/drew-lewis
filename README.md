# drew-lewis

Personal portfolio site for Drew Lewis.

**Live:** https://drewlew13.github.io/drew-lewis/

Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com),
published to GitHub Pages on every merge to `main`.

## Quick start

```bash
nvm use          # Node 24
npm ci
npm run dev
```

## Before you commit

```bash
npm run verify
```

Format check, lint, typecheck, production build, and a Playwright suite that
runs an axe accessibility audit on every page plus an internal broken-link
crawl. It must pass before anything is committed — see
[CONSTITUTION.md](./CONSTITUTION.md), Article 3.

## How this repository works

- **[CONSTITUTION.md](./CONSTITUTION.md)** — the governing rules: branch model,
  the verification gate, technical invariants, content and privacy rules, and
  how to amend them.
- **[CLAUDE.md](./CLAUDE.md)** — the operational summary for AI agents and for
  anyone who wants the short version.

In brief: `main` is the deployed baseline and is never committed to directly,
all work happens on a feature branch, and nothing is committed until the gate
is green.

## Commands

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
