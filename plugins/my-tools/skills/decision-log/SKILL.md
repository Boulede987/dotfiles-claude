---
name: decision-log
description: >
  Move historical/rationale narrative out of code comments and into a dated DECISIONS.md
  log, leaving only a short pointer inline. Trigger when about to write a comment
  explaining a rejected alternative, a past experiment, a measured benchmark, or "we
  tried X before Y" history — or when reviewing existing code with large narrative
  comment blocks. Also trigger before relying on a past DECISIONS.md entry to make a new
  decision (e.g. "don't retry this, already rejected") — verify the entry still matches
  current code before trusting it.
---

# Decision Log — Keep History Out of the Code, Dated and Verifiable

## Why This Exists

Historical narrative comments ("we tried X, rejected it, here's the measured number")
are valuable — they stop future work from re-litigating settled decisions — but they are
a bad fit for inline placement: they accumulate forever at one spot, carry no visual
signal that they might be outdated, and bulk up files that should read as current logic.
Moving them to a dated log instead of deleting them keeps the value; dating them signals
"this may be stale" the way an undated inline comment never does.

This does not replace the `naming-conventions` skill's comment rule (comments explain
*why*, not *what*) — a short, local WHY tied to the exact line it explains still belongs
inline. Only historical/rationale narrative moves out.

---

## 1. What Moves to the Log, What Stays Inline

**Moves to `DECISIONS.md`:** anything about the past — a rejected alternative, an
experiment that didn't work, a benchmark number, why approach Y replaced approach X.
This content is narrative, not a property of the current line of code.

**Stays inline:** an immediate, local WHY tied to the exact line — an invariant, a
gotcha, a workaround for a specific bug, something that would surprise a reader of that
line right now. This content describes the current code, not its history.

```python
# Bad — historical narrative bloating the code, no date, easy to leave stale
def calculate_price(order):
    # We used to compute this with a flat percentage discount, but that broke for
    # bulk orders over 100 units where the marginal cost drops. Tried a tiered lookup
    # table first (see old_pricing.py), rejected because sales kept changing tiers
    # weekly and it required a deploy each time. Settled on this formula in Q2 after
    # measuring it against 3 months of order data (avg error 0.4% vs 6% for flat rate).
    return order.base_price * (1 - marginal_discount_curve(order.quantity))

# Good — inline keeps only the current-code WHY; history lives in DECISIONS.md
def calculate_price(order):
    # see DECISIONS.md 2026-06-02
    return order.base_price * (1 - marginal_discount_curve(order.quantity))
```

---

## 2. `DECISIONS.md` Format

One file at the project root. Newest entries at the top. Each entry:

```markdown
## 2026-06-02 — Pricing uses a marginal-discount curve, not flat percentage or tiers

**Context:** Flat percentage discount broke for bulk orders over 100 units, where
marginal cost drops.

**Decision:** `marginal_discount_curve(quantity)` in `pricing.py`.

**Alternatives considered:**
- Tiered lookup table (`old_pricing.py`) — rejected: sales changed tiers weekly,
  required a deploy each time.

**Evidence:** Measured against 3 months of order data — avg error 0.4% vs 6% for flat
rate.
```

Keep the `**Alternatives considered**` section even when there's only one rejected
alternative — that's usually the exact thing that stops someone from re-proposing it
later.

---

## 3. The Pointer Comment

Leave a one-line pointer at the site the decision affects, dated so it's a direct anchor
into the log:

```python
# see DECISIONS.md 2026-06-02
```

Don't restate the decision inline — that recreates the duplication this skill exists to
remove. The pointer's only job is discoverability.

---

## 4. Verify Before Relying on a Past Entry

An entry in `DECISIONS.md` is a claim about the past, not a guarantee about the present.
Before using one to justify a new decision — "don't retry the tiered lookup, it was
already rejected" — check that the entry still matches current code if the check is
cheap (the file/function it names still exists and does what the entry says). This
mirrors the same judgment call as trusting any comment: verify when the claim is
load-bearing for what you're about to do, not as a blanket sweep of the whole log every
session.

If an entry no longer matches (the rejected approach was later reintroduced for a
different reason, the measured numbers were superseded), add a new dated entry noting
the change rather than editing the old one — the log is a history, not a single source
of current truth.

---

## 5. Migrating Existing Comments

When reviewing code with a large narrative comment block (the trigger for this skill
applying retroactively): extract the narrative into a new `DECISIONS.md` entry dated to
the best information available (git blame date if the original date is unknown), replace
the inline comment with a pointer, and flag the migration to the user rather than doing
it silently — moving history out of code is a content change worth a quick confirmation,
even though the code's behavior doesn't change.
