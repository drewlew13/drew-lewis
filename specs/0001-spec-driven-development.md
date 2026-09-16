---
id: 0001
title: Spec-driven development and constitution change log
status: done
derived: 2026-09-16
implemented: 2026-09-16
---

## Problem

Work on this repository has so far been driven directly from conversation.
That was fine for the initial scaffold, where the whole change was one commit
and one reviewer. It does not hold up past that:

- The reasoning behind a decision lives in a chat transcript, which nobody
  reads later and which agents do not carry between sessions.
- There is no record of what was considered and rejected, so the same ground
  gets re-argued.
- `CONSTITUTION.md` can be edited with no trace of who changed a rule, or why.
  A governing document whose history is invisible is not much of a constraint.

## Goal

Every non-trivial change starts from a written spec that survives the
conversation that produced it, and every change to the constitution is
attributable.

Specifically:

1. A `specs/` directory holds one file per change, each carrying its
   identifier, title, status, the date it was derived, and — once it lands —
   the date it was implemented.
2. An index lists every spec and its status, and cannot silently drift from the
   files it describes.
3. A spec that reaches `done` is frozen. It records what was decided and why at
   that time, and is not rewritten to match later reality.
4. Changes to `CONSTITUTION.md` are accompanied by a change log entry naming
   who made the change, which spec drove it, what changed, and why.

## Non-goals

- **Retrofitting specs for existing work.** The scaffold, the verification
  gate, and the CI setup predate this process. They are not getting
  back-dated specs; the process starts here.
- **A spec for every change.** A typo fix, a dependency bump, or a copy tweak
  does not need one. The test is whether someone would reasonably ask "why was
  this done this way" six months from now.
- **A workflow tool.** No issue tracker integration, no status automation
  beyond validation. Markdown files in git are the whole system.

## Approach

### Spec files

`specs/NNNN-kebab-case-title.md`, numbered sequentially from `0001`. Each opens
with flat `key: value` front matter:

| Key             | Required          | Meaning                                                  |
| --------------- | ----------------- | -------------------------------------------------------- |
| `id`            | yes               | Four digits, matching the filename                       |
| `title`         | yes               | Short imperative title                                   |
| `status`        | yes               | See the lifecycle below                                  |
| `derived`       | yes               | `YYYY-MM-DD` the spec was written                        |
| `implemented`   | when `done`       | `YYYY-MM-DD` the work merged; kept if later `superseded` |
| `supersedes`    | no                | Spec ids this replaces                                   |
| `superseded-by` | when `superseded` | Spec ids that replace this                               |

The body follows `specs/TEMPLATE.md`: problem, goal, non-goals, approach,
verification, open questions.

### Lifecycle

```
draft → accepted → in-progress → done
                              ↘ withdrawn
done → superseded
```

- `draft` — being written; not agreed.
- `accepted` — agreed, not started.
- `in-progress` — being implemented on a branch.
- `done` — merged. Frozen from here.
- `superseded` — replaced by a later spec, named in `superseded-by`.
- `withdrawn` — abandoned before implementation.

### Freezing

A `done` spec may only change in two ways: its `status`, and its
`superseded-by` link. Its body is immutable. If the decision it records should
change, that is a new spec which supersedes it — which leaves both the original
reasoning and the reason it changed on the record.

### Change log

`CONSTITUTION-CHANGELOG.md` gains an entry for every change to
`CONSTITUTION.md`: the date, who decided it, the driving spec, what changed,
and why. Newest first. Entries are append-only for the same reason `done` specs
are frozen.

## Verification

Enforced by `scripts/check-specs.mjs`, wired into `npm run verify` as
`check:specs`, which fails on:

- a filename that is not `NNNN-kebab-case-title.md`
- missing or unknown front matter keys, or a malformed `key: value` line
- an `id` that disagrees with the filename, or a duplicate `id`
- a status outside the lifecycle, or a date that is not `YYYY-MM-DD`
- `done` without `implemented`; an `implemented` date on a status that does not
  describe shipped work (anything but `done` or `superseded`, since a spec can
  be implemented and replaced later); or an implementation date earlier than
  the derivation date
- `superseded` without `superseded-by`
- a supersede link pointing at a spec that does not exist, or at itself
- an empty body
- `specs/README.md` disagreeing with the files it indexes

Two further checks need a base branch to compare against, so they run in CI:

- `check-specs.mjs --frozen <base>` fails if a spec that is `done` on the base
  branch has an edited body.
- A workflow step fails a pull request that changes `CONSTITUTION.md` without
  adding a `CONSTITUTION-CHANGELOG.md` entry.

Regenerate the index with `npm run specs:index`.

## Open questions

None. Numbering is sequential and collisions are caught by the duplicate-id
check; if two branches pick the same number, the second to merge renumbers.
