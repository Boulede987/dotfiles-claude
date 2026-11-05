# ADRs in `docs/adr/` replace `DECISIONS.md`

`mattpocock-skills:domain-modeling` already defines ADRs (`docs/adr/NNNN-slug.md`, its
`ADR-FORMAT.md`, and the bar for when one is worth writing), so `decision-log` stops
maintaining its own `DECISIONS.md` format and writes ADRs instead. It keeps the rules
`domain-modeling` lacks: moving narrative out of comments, the inline pointer, verifying
an ADR before relying on it, and migrating existing comments. `feature-workflow`'s
`STATE.md` points to ADRs.

## Considered Options

- Keep `DECISIONS.md` alongside ADRs — rejected: two places for the same kind of record.
- Delete `decision-log` — rejected: its comment-migration and verify-before-relying rules
  have no equivalent in `domain-modeling`.
