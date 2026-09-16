---
id: 0006
title: About section with a headshot and the link bank
status: done
derived: 2026-09-16
implemented: 2026-09-16
---

## Problem

The Summary section is a single paragraph of résumé prose. The link bank — the
only way a visitor can act on what they have read — sits up in the hero,
detached from the person it belongs to, and there is no picture of Drew
anywhere.

That order asks a visitor to decide whether to make contact before they have
read anything, and gives them nobody to put a face to. Article 1 measures this
site by whether a stranger understands who Drew is within two minutes.

## Goal

A single **About** section carrying three things in one place: a short blurb, a
headshot, and every way to reach Drew.

- The section is renamed from Summary to **About**, id `#summary` → `#about`.
- The blurb keeps the existing text, unchanged, including the derived years
  figure.
- A **circular headshot** sits to the right of the blurb on desktop, with a
  clearly-marked placeholder until Drew supplies the real photo.
- The **link bank moves out of the hero** into this section, below both.

## Non-goals

- **Rewriting the blurb.** The existing text stays as it is. Its résumé voice
  next to a photograph is worth revisiting, but that is a content decision for
  another change.
- **More than one image.** No gallery, no lightbox, no hover states. A
  lightbox would need client-side JavaScript, which Article 4 makes the
  exception.
- **Changing the hero beyond removing the link bank.** Name, descriptor and
  location stay where they are.
- **A redirect from `#summary`.** Nothing links to it — not the nav, not any
  published page — so the id can simply change.

## Approach

### The rename is a one-line change

`src/data/sections.ts` gains `id: 'about'`, `title: 'About'`,
`navLabel: 'About'` in place of the summary record. The header navigation
follows automatically, because [spec 0004](./0004-section-driven-navigation.md)
made the section list the single source of truth.

This is the first real exercise of that mechanism, and its bidirectional test
is what proves the rename landed everywhere rather than just in the one file.

### The headshot, and the risk that comes with it

**A photograph is not just pixels.** A picture taken on a phone routinely
carries EXIF metadata, and that metadata routinely includes GPS coordinates
precise to a few metres — along with the device, and the date and time it was
taken.

Publishing a raw photo would therefore leak an exact location on a site that
deliberately says only "Austin, TX", and which withholds a street address by
rule. It would defeat [spec 0003](./0003-resume-content-page.md) completely,
silently, and in a form no reader would notice.

So:

- **Committed images must carry no EXIF at all.** Not stripped of GPS —
  stripped entirely, since orientation and timestamps are of no use here and
  the simplest rule is the one that cannot be half-applied.
- **The guard is built now, while the image is still a placeholder.** That is
  the point of doing it in this change rather than the one that adds the real
  photo: the check must already be failing-capable before a real camera file
  ever reaches the repository.
- Drew can send the photo as-is. Stripping is a build-time and review-time
  concern, not something he should have to remember.

### Image handling

- The source lives in `src/assets/`, not `public/`, so Astro's image pipeline
  processes it.
- It renders through `astro:assets` so the browser gets modern formats and an
  appropriately sized file, with **explicit width and height** so the layout
  does not shift as it loads.
- Loading is eager rather than lazy: the section sits at or near the top of the
  first screen, and lazy-loading an image there delays the largest paint
  instead of helping it.
- The placeholder is a committed raster of the same dimensions as the real
  photo will be, so the pipeline runs from day one and swapping in the real
  photograph is a **one-file change** rather than a new code path.

### Placeholder honesty

The headshot is a record — source, alt text, and an `isPlaceholder` flag — and
the flag and the alt text must agree:

- While it is a placeholder, the alt text says so.
- When the real photo lands, the flag flips and the alt becomes "Drew Lewis".

A test enforces the agreement in both directions, so a placeholder cannot
quietly ship described as a photograph of Drew, and a real photograph cannot
ship still described as a placeholder.

### Layout

Blurb left, headshot right, side by side from the `sm` breakpoint up. The link
bank spans below both. Below `sm` the section stacks in document order: blurb,
then headshot, then links.

Document order and visual order stay identical at every width. Reversing them
to float the photo above the text on mobile was considered and rejected: it
buys a little visual warmth and costs the guarantee that what a screen reader
announces matches what a sighted reader sees.

The headshot is a fixed size that does not shrink with the column, and is
rendered circular. Its source is square, so the circle is a mask rather than a
crop that could cut a face off-centre.

`sharp` becomes a direct dev dependency, pinned exactly. It is already present
as Astro's image dependency, but the EXIF test imports it directly, and Article
7 does not allow depending on something that happens to be in the tree.

## Verification

All of the following run in `npm run verify`.

### New: the EXIF guard

Every committed image under `src/assets/` and `public/` is read and asserted to
carry **no EXIF block**. The failure message names the file and the rule, never
the metadata contents, since CI logs are public.

The test also proves it can fail, in the way the other privacy guards do: a
fixture image written with EXIF attached is detected. A guard that has never
rejected anything is not known to work.

### New: the headshot renders correctly

- Exactly one image inside `#about`, with non-empty alt text.
- It carries explicit `width` and `height` attributes, so nothing shifts as it
  loads.
- Its `src` resolves under the configured base path and returns a 200 — the
  base-path failure that would show up only in production.
- The emitted file is within a size budget, so a large photo cannot quietly
  make the page slow.

### New: placeholder honesty

- If the record is marked a placeholder, the alt text says so.
- If it is not, the alt text must not contain "placeholder".

### New: the link bank moved

- The link bank is inside `#about`, below the blurb and the headshot.
- There is no link bank in the hero — asserted, so the old one cannot be left
  behind by accident.
- Every existing link-bank assertion still holds against the new location:
  one anchor per record, usable accessible names, the mail link with no `rel`
  and the external links with `noopener noreferrer`, and the contact address
  still literal.

### Already covered, and load-bearing here

- **The navigation parity test** catches the rename in both directions. A nav
  link left pointing at `#summary`, or a section renamed without the nav
  following, fails.
- **The axe audit** covers the image's alt text and the section's contrast.
- **The overflow test** covers the new two-column layout at 375px, where a
  fixed-size image beside text is exactly what pushes a page wide.
- **The privacy scan** continues to cover the built output for phone shapes,
  street addresses and unapproved email addresses.

## Resolved questions

1. **The photograph.** The placeholder ships now. Swapping in the real photo is
   a one-file replacement in `src/assets/`, plus flipping `isPlaceholder` to
   `false` and changing the alt text to "Drew Lewis" — which the schema requires
   to happen together. Send it as it comes off the camera; EXIF is handled here.
2. **The blurb's voice.** Declined for now. The text stays as it is, and
   changing it to first person is its own change if Drew wants it.

### What implementation turned up

**The GPS directory is IFD3.** `sharp`'s typed `Exif` interface exposes only
`IFD0` through `IFD3`, with no `GPS` key, so the first version of the fixture
failed to typecheck. In libvips' EXIF model IFD3 _is_ the GPS directory, which
made the type-correct fixture also the more accurate one — it writes a real GPS
block rather than an arbitrary tag.

**The rename caught a stale reference immediately.** `tests/content.spec.ts`
still asserted against `#summary` in its years-of-experience test, and the run
failed on the missing locator. That is the rename working: the id moved in one
file and everything still pointing at the old one was surfaced rather than
silently passing over an element that no longer exists.

**The guard was proved against a planted image**, not only its own fixture: an
image carrying a GPS EXIF block was written into `src/assets/`, and the run
failed with `src/assets/leaky-photo.jpg carries an EXIF block` — naming the file
and the rule, and nothing about the metadata itself.
