---
id: 0002
title: Dependency version policy for TypeScript and Node types
status: done
derived: 2026-09-16
implemented: 2026-09-16
---

## Problem

The first Dependabot pull request (#2) grouped two dev-dependency updates and
could not be merged:

- **`typescript` 6.0.3 → 7.0.2.** TypeScript 7 is the native rewrite. Neither
  of the two tools that consume TypeScript here supports it: `@astrojs/check`
  declares `peer typescript: "^5.0.0 || ^6.0.0"` and `typescript-eslint`
  declares `>=4.8.4 <6.1.0`. Both are already at their latest published
  versions, so there is no upgrade that resolves the conflict. `npm ci` fails
  outright, which is why CI stopped at the install step.
- **`@types/node` 22.20.3 → 26.5.1.** `.nvmrc` pins Node 24 and CI installs
  from that file. Types for Node 26 describe APIs that do not exist in the
  runtime we actually run, so TypeScript would accept code that fails at
  execution. The direction matters: types behind the runtime cause a missing
  API to be flagged, which is safe; types ahead of it cause a missing API to be
  accepted, which is not.

Left alone, Dependabot re-proposes both every month, and each one has to be
re-diagnosed from scratch by whoever sees it next.

## Goal

Both dependencies sit at versions that work, the reasoning is written down
where the next person will find it, and Dependabot stops proposing the updates
that cannot be taken.

## Non-goals

- **Pinning the whole dependency tree.** Every other dependency continues to
  receive Dependabot updates, majors included. This covers two packages with
  specific, documented constraints.
- **Refusing TypeScript 7 permanently.** It is held until the toolchain
  supports it, and this spec names the condition that releases the hold.
- **Blocking minor or patch updates** to either package. Only major updates are
  ignored, so `typescript` 6.x and `@types/node` 24.x still flow normally.

## Approach

### TypeScript stays on 6.x

Held until **both** `@astrojs/check` and `typescript-eslint` declare support
for TypeScript 7 in their peer ranges. Check with:

```bash
npm view @astrojs/check peerDependencies
npm view typescript-eslint peerDependencies
```

When both allow `^7`, remove the ignore entry and take the upgrade as a normal
change. Until then the constraint is enforced by npm itself — an install with
TypeScript 7 fails, so this cannot be adopted by accident.

### `@types/node` tracks `.nvmrc`

The major version matches the Node major the project runs, currently 24. It is
bumped by hand when `.nvmrc` moves, as part of that change rather than
separately — the two are one decision.

This also corrects an existing drift: the project was running Node 24 against
`@types/node` 22, which was safe but wrong.

### Dependabot

`.github/dependabot.yml` ignores `version-update:semver-major` for both
packages, each with a comment giving the reason and pointing here. Minor and
patch updates are unaffected.

## Verification

- `npm ci` succeeding is the check that matters for the TypeScript constraint;
  it is step 4 of the CI job and fails hard on a peer conflict. The original
  failure was reproduced locally before the fix and passes after it.
- `npm run verify` passes on the corrected set — format, lint, specs,
  typecheck, build, and the Playwright suite.
- The ignore rules cannot be verified until Dependabot's next scheduled run.
  If a major update for either package appears anyway, the rule is wrong and
  needs revisiting.

## Open questions

None.
