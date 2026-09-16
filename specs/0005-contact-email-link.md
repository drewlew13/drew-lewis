---
id: 0005
title: Contact email link with a Gmail sub-address
status: done
derived: 2026-09-16
implemented: 2026-09-16
---

## Problem

The site had no direct way to reach Drew. [Spec 0003](./0003-resume-content-page.md)
deliberately published no email address and routed contact through LinkedIn,
noting in its non-goals that "if a dedicated address is created later, adding it
is a new change". This is that change; 0003 stays as it is.

A visitor who wants to make contact should not have to have a LinkedIn account
to do it.

## Goal

A **Contact Me** button in the link bank opens the visitor's mail client
addressed to a dedicated address, `drewlew1313+portfolio@gmail.com`. The
`+portfolio` sub-address lets enquiries originating from this site be filtered
in Gmail without maintaining a separate mailbox.

## Non-goals

- **Publishing the personal address** that appears on the résumé. It remains
  withheld, and the privacy guard still fails on it.
- **A contact form.** Impossible on a static site without a third party, and a
  third party here would mean handing a form provider the messages.
- **Obfuscating the address** against scrapers with JavaScript or entity
  tricks. They are defeated trivially, they break the link for some assistive
  technology, and Article 4 makes client-side JavaScript the exception. A
  dedicated, filterable address is the better answer to spam than hiding it.
- **A `?subject=` or `?body=` prefill.** The sub-address already does the
  filtering, and a query string reintroduces exactly the `+`-means-space
  ambiguity this spec avoids.

## Approach

### The `+` stays literal

The address is written `mailto:drewlew1313+portfolio@gmail.com`, **not**
`mailto:drewlew1313%2Bportfolio@gmail.com`.

Percent-encoding was considered, since `+` means a space in
`application/x-www-form-urlencoded` data and that convention leaks into some
URI handling. It was rejected on evidence. A browser hands the `href` to the
mail client **without decoding it**: an anchor whose attribute is
`mailto:…%2B…` resolves to an `href` still containing `%2B`. Decoding is then
the mail client's job. A conformant client turns it back into `+`; one that
does not sends to an address containing the literal characters `%2B`, which
bounces.

The literal `+` has no such failure mode. The form-encoding convention applies
to the **query** component — `?subject=`, `?body=` — and this URI has no query
component at all, which the schema enforces.

So the encoding buys nothing and costs a class of client bug.

### Where it lives

A third record in the link bank, ahead of LinkedIn and GitHub, since contact is
the action a visitor is most likely to want. The schema accepts either an
absolute `https` URL or a single `mailto` address, and **rejects `%` in a
mailto outright**, so the decision above cannot be quietly reversed by a later
edit.

The mail link takes an envelope icon rather than the outbound arrow, and no
`rel` attribute — `noopener` and `noreferrer` are meaningless when no document
is opened. LinkedIn's description changes from "the best way to get in touch",
which is no longer true, to "professional profile and work history".

### The privacy guard changes shape

`tests/privacy.spec.ts` previously failed on **any** `mailto:` link, which was
right when the decision was "no email at all". It now fails on any mailto whose
address is not the approved one.

This is an allow-list, and that matters: the approved address is named in the
test because it is published by design, while the withheld personal address is
still caught without this file ever naming it. Loosening the rule to "some
mailto links are fine" would have been the easy change and the wrong one.

## Verification

In `npm run verify`:

- **The allow-list, end to end.** The scan over `dist/` fails if any built file
  links to an address other than the approved one. Confirmed by adding a second
  address to the page: the run fails, naming the file but not the address,
  since CI logs are public too.
- **The allow-list, at unit level.** The approved address passes; its
  percent-encoded equivalent also passes, because it is the same address; a
  different address fails; and a near-miss without the `+portfolio`
  sub-address fails.
- **The link is well formed.** The contact href contains a literal `+`, no `%`,
  and no query string, and the address matches a plain `local@domain.tld`
  shape. The anchor on the page carries the href unchanged.
- **The anchor is correct as markup.** The mail link has no `rel`, the external
  links keep `noopener noreferrer`, and every button still has a usable
  accessible name.

The schema is the earlier line of defence: a `%` in a mailto fails the build,
not the tests.

## Open questions

None.
