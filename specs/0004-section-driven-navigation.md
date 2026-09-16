---
id: 0004
title: Header navigation derived from the section list
status: done
derived: 2026-09-16
implemented: 2026-09-16
---

## Problem

The site header carried a single "Home" link, which on a one-page site points at
the page you are already on. With five sections now on the homepage, a visitor
has no way to reach one directly and must scroll to find out what is there —
which works against the two-minute test in Article 1.

The obvious fix introduces a worse problem. If the header lists sections by
hand, then adding or renaming a section means remembering to edit the header
too. That kind of rule decays: the first person to add a section in a hurry
ships a header that is quietly wrong, or a nav link pointing at an anchor that
no longer exists. Nothing would catch either.

## Goal

The header shows the name on the left and a link to every section on the right.
Adding a section, renaming one, reordering them, or removing one updates the
navigation **without anyone touching the header**, and a mismatch between the
two cannot be merged.

## Non-goals

- **A collapsible or hamburger menu.** That needs client-side JavaScript, which
  Article 4 makes the exception rather than the default. The links wrap onto a
  second line at narrow widths instead.
- **Scroll-spy highlighting** of the current section. Also JavaScript, and it
  earns little on a page this length.
- **Navigation to other pages.** There is only one page plus a 404. When
  per-entry pages arrive, this list is where they would be added.
- **Sticky positioning.** A header that follows the reader costs vertical space
  on a phone, which is the default case.

## Approach

### One source of truth

`src/data/sections.ts` holds the ordered section list — `id`, the visible
`title`, and a shorter `navLabel`, because "Projects & Other Experience" does
not fit a nav bar. Records are schema-validated at module load and checked for
duplicate ids, so a malformed entry fails the build.

Both consumers read from it:

- `BaseLayout.astro` builds the header navigation by mapping over the list.
- `index.astro` takes each section's `id` and `title` from it via a `section()`
  lookup.

The lookup is typed to the literal ids in the list, so renaming one makes every
call site a **type error** rather than a silently missing section. That is the
first line of defence and it costs nothing at runtime.

### Links carry the full path

Each nav link is `/<base>/#<id>` rather than a bare `#<id>`. On the homepage a
browser treats that as a same-document jump, with no reload. From the 404 page —
which has no sections of its own — it navigates home and then scrolls, instead
of pointing at a fragment that does not exist there. It also keeps working
unchanged once there is more than one page.

### Layout

Name on the left, links on the right, on one row from the `sm` breakpoint up.
Below that the header stacks: name, then the links wrapping across as many lines
as they need. Five short labels and no JavaScript.

## Verification

`tests/navigation.spec.ts`, in `npm run verify`:

- The nav has exactly one link per section, with the labels in page order.
- **Every nav link points at a section that exists on the page.** A link to a
  removed or renamed section fails, naming the dead fragment.
- **Every section on the page has a nav link**, and the two sequences are equal
  — same set, same order. A section added without reaching the header fails,
  with a message naming the file to edit.
- Nav links carry the full path, asserted from the 404 page, so a bare fragment
  cannot creep back in.
- The name links home and is strictly bolder than the nav links, which is the
  visual hierarchy this change asks for.

The bidirectional pair is the point. Either direction alone would let one kind
of drift through. Confirmed by adding a section to the list without rendering
it: the run fails with `nav link points at #awards, which is not on the page`.

`tests/content.spec.ts` now reads the same list rather than keeping its own
copy, so there is no second place for the section names to drift.

## Open questions

None.
