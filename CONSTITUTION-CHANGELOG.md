# Constitution change log

Every change to [CONSTITUTION.md](./CONSTITUTION.md) gets an entry here: who
decided it, which spec drove it, what changed, and why.

Newest first. Entries are append-only — correcting the record means adding to
it, not rewriting it. See CONSTITUTION.md, Article 9.

---

## 2026-09-16 — Specs and this change log

**Who:** Drew Lewis
**Spec:** [0001 — Spec-driven development and constitution change log](./specs/0001-spec-driven-development.md)

**What changed:** Article 9 was rewritten from "Amendment" to "How change
happens". It now covers the `specs/` directory, the spec lifecycle and its
statuses, the rule that a `done` spec is frozen, this change log, and the
amendment procedure that was already there. Article 2 gained a pointer to it.

**Why:** Decisions were living in conversation transcripts, which nobody reads
later and which agent sessions do not carry between them. There was no record
of what had been considered and rejected, so the same ground got re-argued, and
the constitution itself could be edited with no trace of who changed a rule or
why. A governing document with an invisible history is not much of a
constraint.

---

## 2026-09-16 — Record the .github.io hosting choice as a decision

**Who:** Drew Lewis
**Spec:** None — predates spec 0001.

**What changed:** Article 4's "Base path" section became "Hosting and base
path". It states that a custom domain was considered and declined for now,
gives the revisit trigger, and records the measured migration cost. It also
drops a stale claim that the test suite's base URL had to be changed alongside
the config.

**Why:** The subpath was described as a fact of the setup, which left it
reading as an unexamined default rather than a choice. Recording the option's
cost means it does not have to be re-derived later.

---

## 2026-09-16 — Initial constitution

**Who:** Drew Lewis
**Spec:** None — predates spec 0001.

**What changed:** Created `CONSTITUTION.md` with Articles 1 through 9: purpose
and success criteria, the branch model, the verify-before-commit gate,
technical invariants, content accuracy and privacy rules, secrets, dependency
policy, roles, and amendment.

**Why:** To fix the rules for building the site before content work began, so
iteration could be fast without being risky.
