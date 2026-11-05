---
name: decision-log
description: >
  Move historical/rationale narrative out of code comments and into an ADR under
  docs/adr/, leaving only a short pointer inline. Trigger when about to write a comment
  explaining a rejected alternative, a past experiment, a measured benchmark, or "we
  tried X before Y" history — or when reviewing existing code with large narrative
  comment blocks. Also trigger before relying on a past ADR to make a new decision
  (e.g. "don't retry this, already rejected") — verify it still matches current code
  before trusting it.
---

# Decision Log — Keep History Out of the Code, in ADRs, Verifiable

## Why This Exists

Historical narrative comments ("we tried X, rejected it, here's the measured number")
are valuable — they stop future work from re-litigating settled decisions — but they are
a bad fit for inline placement: they accumulate forever at one spot, carry no visual
signal that they might be outdated, and bulk up files that should read as current logic.
Moving them to an ADR instead of deleting them keeps the value.

This skill complements `mattpocock-skills:domain-modeling`, which owns ADRs: its
`ADR-FORMAT.md` defines location (`docs/adr/`), numbering (`0001-slug.md`), the
template, and the bar for when a decision deserves an ADR. Call the Skill tool with
`domain-modeling` for that format and bar only, not its glossary work. This skill adds
what moves out of comments, the pointer, verifying before relying, and migrating
existing comments.

This does not replace the `naming-conventions` skill's comment rule (comments explain
*why*, not *what*) — a short, local WHY tied to the exact line it explains still belongs
inline. Only historical/rationale narrative moves out.

---

## 1. What Moves to an ADR, What Stays Inline

**Moves to an ADR:** anything about the past — a rejected alternative, an experiment
that didn't work, a benchmark number, why approach Y replaced approach X. This content
is narrative, not a property of the current line of code.

**Stays inline:** an immediate, local WHY tied to the exact line — an invariant, a
gotcha, a workaround for a specific bug, something that would surprise a reader of that
line right now. This content describes the current code, not its history.

**Neither:** narrative that fails `domain-modeling`'s ADR bar (hard to reverse,
surprising without context, a real trade-off). If nobody would re-propose the rejected
option, there's nothing to protect — drop the history and keep at most the inline WHY.

```python
# Bad — historical narrative bloating the code, easy to leave stale
def calculate_price(order):
    # We used to compute this with a flat percentage discount, but that broke for
    # bulk orders over 100 units where the marginal cost drops. Tried a tiered lookup
    # table first (see old_pricing.py), rejected because sales kept changing tiers
    # weekly and it required a deploy each time. Settled on this formula in Q2 after
    # measuring it against 3 months of order data (avg error 0.4% vs 6% for flat rate).
    return order.base_price * (1 - marginal_discount_curve(order.quantity))

# Good — inline keeps only a pointer; history lives in the ADR
def calculate_price(order):
    # see docs/adr/0003-marginal-discount-pricing.md
    return order.base_price * (1 - marginal_discount_curve(order.quantity))
```

When the narrative includes a rejected alternative or a measurement, keep them in the
ADR's optional **Considered Options** section — the rejected alternative is usually the
exact thing that stops someone from re-proposing it later.

---

## 2. The Pointer Comment

Leave a one-line pointer at the site the decision affects, naming the ADR file:

```python
# see docs/adr/0003-marginal-discount-pricing.md
```

The pointer's only job is discoverability; the decision itself lives in the ADR alone.

---

## 3. Verify Before Relying on a Past ADR

An ADR is a claim about the past, not a guarantee about the present. Before using one to
justify a new decision — "don't retry the tiered lookup, it was already rejected" — check
that it still matches current code if the check is cheap (the file/function it names
still exists and does what the ADR says). Verify when the claim is load-bearing for what
you're about to do, not as a blanket sweep of every ADR each session.

If an ADR no longer matches (the rejected approach was later reintroduced for a
different reason, the measured numbers were superseded), write a new ADR and mark the
old one `superseded by ADR-NNNN` in its Status — the ADRs are a history, not a single
source of current truth.

---

## 4. Migrating Existing Comments

When reviewing code with a large narrative comment block (the trigger for this skill
applying retroactively): extract the narrative into a new ADR, replace the inline
comment with a pointer, and flag the migration to the user before doing it — moving
history out of code is a content change worth a quick confirmation, even though the
code's behavior doesn't change. A project with an existing `DECISIONS.md` gets the same
treatment: one ADR per entry, then remove the file once the user confirms.
