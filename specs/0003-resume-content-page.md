---
id: 0003
title: Résumé content on the homepage, with a link bank
status: draft
derived: 2026-09-16
---

## Problem

The site says "This is the baseline scaffold." A visitor learns nothing about
Drew, which fails the two-minute test in Article 1 outright.

The material to fix that exists — a résumé — but it cannot be published as-is.
It carries a phone number and a personal email address on its contact line, and
states figures from employer-internal work that read differently on an indexed,
permanent web page than on a document handed to a named recipient.

## Goal

The homepage carries every section the résumé has, filled with its content, plus
a bank of link buttons. A visitor can see who Drew is, what he has built, and
how to reach him, without any withheld personal detail appearing anywhere in the
built output.

Sections, in résumé order:

1. **Identity** — name, a one-line professional descriptor, location, link bank
2. **Summary**
3. **Work Experience** — three roles
4. **Projects & Other Experience** — three entries
5. **Education**
6. **Technical Skills** — three groups

## Non-goals

- **Separate pages per role or project.** The eventual aim is expansion —
  possibly whole pages per entry — but this spec delivers one page. It shapes
  the content layer so that expansion is a small change, and does no more.
- **A résumé PDF download.** Decided against for now: the file carries the
  contact line. Revisit only with a redacted copy that Drew has reviewed.
- **Any email address.** Contact goes through LinkedIn. If a dedicated address
  is created later, adding it is a new change.
- **A contact form, analytics, or a blog.** None are needed for the two-minute
  test, and the first two are impossible on a static site without a third party.
- **Client-side JavaScript.** Article 4 sets zero-JS as the default; a list of
  links and text needs none.

## Approach

### Withheld information

These never appear in the repository or the built output:

| Withheld               | Note                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Phone number           | Never, under any option. Also never written into a test as a literal — see Verification. |
| Personal email address | No `mailto:` link, no plain-text address.                                                |
| Street address         | Not present in the source material; excluded regardless.                                 |

**Location renders as "Austin, TX"** everywhere a location appears, replacing
the city printed on the résumé — which, like the other withheld details, is not
reproduced here. This includes the per-role location line: the one on-site role
reads "Austin, TX", and the two remote roles stay "Remote".

### Softened figures

Two bullets state employer-internal scale. Both are rewritten qualitatively.

The original figures are deliberately **not reproduced here**: this repository
is public, so quoting them in the spec would publish exactly what softening them
is meant to avoid. They are the system count in the telemetry pipeline bullet
and the percentage in the log analysis tool bullet, both readable in the résumé
Drew holds. The proposed replacement text, which is what needs approval:

| Bullet                                                      | Proposed page text                                                                                                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telemetry ingestion pipeline (current role)                 | "Designed and implemented a telemetry ingestion pipeline, processing telemetry updates on a five-minute cadence across a large production install base" |
| Internal log analysis and collection tool (PowerScale role) | "Designed an internal log analysis and collection tool that measurably accelerated root cause analysis"                                                 |

Every other figure stays as written: 600+ annual new participants, 4 geographies
and 10 programs, a team of 4–8 over 3 years, 400+ students, 8–10 office hours
weekly. These describe a rotation program and a university course, not product
internals.

### Content layer

Entries live as structured, schema-validated data — one record per role,
project, education entry and link — kept separate from the markup that renders
them. Whether that is an Astro content collection with a Zod schema or typed
modules under `src/data/` is an implementation choice; the requirements are:

- Each entry is a discrete record with named fields, not prose embedded in HTML.
- The schema is validated at build time, so a malformed or incomplete entry
  fails `npm run build` rather than rendering blank.
- The page maps over the records. Adding an entry means adding a record.

This is what makes the eventual per-entry pages a small change instead of a
rewrite, and it is the only piece of forward-looking design in this spec.

### Link bank

A row of buttons in the identity section, each a plain anchor:

- **LinkedIn** — the profile on the résumé
- **GitHub** — URL required from Drew; see Open questions

Requirements:

- Every button has a discernible accessible name in text, not by icon alone.
- External links carry `rel="noopener noreferrer"`; whether they open in a new
  tab is a design choice, defaulting to same-tab, which is friendlier on mobile.
- The bank is built from the same structured data as everything else, so adding
  a link later is a one-record change.
- It wraps rather than scrolls at 375px.

### Design

Professional and polished here means typography-led and restrained, not
decorated. Concretely:

- The existing single-column `max-w-3xl` shell stays. Long-form reading at a
  comfortable measure is the right form for this content.
- Clear vertical rhythm between sections, with headings that establish
  hierarchy by size and weight rather than rules and boxes.
- Each experience entry shows role, employer and team, date range, and location,
  with the role most prominent. Dates and location are secondary, set in the
  muted token.
- Skills render as grouped tags. Groups keep the résumé's three headings.
- Section headings get stable `id` attributes so sections can be linked to
  directly, and so future pages have somewhere to point.
- Colour comes only from the tokens in `global.css`. Any new token needs a light
  **and** a dark value, per Article 4.
- Mobile is the default case, per Article 4. The design is checked at 375px
  first.

## Verification

Everything below runs in `npm run verify`, so it holds on every commit and every
pull request.

### Already covered by the gate

The axe WCAG 2.1 AA audit, the internal link crawl, the base-path guard, and the
unique-`h1`/title/description assertions all apply to the page automatically —
routes are discovered from `dist/`.

### New: a privacy guard

The most important addition, because it turns "never publish this" from a
promise into a check. It scans every built file under `dist/` and fails on:

- any string matching a telephone-number shape, by **pattern** — sequences such
  as `NNN-NNN-NNNN`, `(NNN) NNN-NNNN`, and `+1`-prefixed variants
- any `mailto:` link, since no email address is to be published

**The withheld phone number is never written into the test.** A literal would
commit to the repository exactly the value the test exists to keep out, and
`specs/` and `tests/` are as public as `src/`. Matching on shape avoids that
entirely, and catches a number that arrives by a route nobody predicted.

### New: content integrity

- Each section renders with its expected heading and a stable `id`.
- The number of experience, project and education entries on the page equals the
  number of records in the data, so an entry cannot be silently dropped.
- Every entry renders its required fields; a record missing one fails the build
  via the schema, and the test covers the rendered result.
- Every link-bank button has a non-empty accessible name and an absolute URL.

### New: layout regression

- No horizontal overflow at 375px — the document is never wider than the
  viewport. This is the failure that a multi-section page invites and that a
  desktop-only check never sees.
- Heading order descends without skipping levels.

### Manual

Screenshots at 375px and desktop width, in both colour schemes, reviewed before
the pull request is opened — the four boxes in the PR template, done rather than
asserted.

## Open questions

1. **GitHub URL.** Required for the link bank. Blocking for that button only;
   the rest of the page does not depend on it.
2. **"Self-driving full-stack software engineer"** opens the résumé summary.
   This reads as a typo for "self-driven". Article 5 permits editing for
   clarity, but this is Drew's self-description, so it is his call: correct it,
   keep it, or replace the descriptor.
3. **"4 years experience"** goes stale. It can be derived from the July 2022
   start date so it stays true, or rewritten as "since 2022". A hard-coded
   number is wrong within a year, and Article 5 makes accuracy non-negotiable.
4. **Education dates.** The résumé gives no graduation year. Include one, or
   leave education undated as it is now?

A spec cannot reach `done` with open questions. These resolve before
implementation starts.
