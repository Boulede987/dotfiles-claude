## 2026-11-05 — Increment 1: resolve overlaps — Phase: Commit

**Phase & Gate:** Commits made on branch `mattpocock-skills-integration`, one per
decision, plus this workflow state. No diagram to regenerate (waived in Spec). Gate met.

**What changed:**
- fae87a6 docs(adr): adopt Matt Pocock's skills from upstream
- 83393a9 refactor(skills): slim testing down to additions on top of tdd
- afc1d78 refactor(skills): record decisions as ADRs instead of DECISIONS.md
- 966d962 feat(skills): point architecture to codebase-design
- e545b62 feat(skills): add suggested skills section to session-handoff
- 7bf1d33 docs(adr): propose pairing per-file-review with code-review
- chore(workflow) commit adding `.claude/workflow/mattpocock-skills-integration/`

**Decisions made:** none new

**State of known issues:**
- Open: branch pushed, not merged into `main` — user to decide when.

**Next steps:**
1. Report phase.

## 2026-11-05 — Increment 1: resolve overlaps — Phase: Review (signed off)

**Phase & Gate:** User resolved every finding: fix all six, keep both unvalidated
`decision-log` additions. Fixes applied. Gate met.

**What changed:**
- `per-file-review/SKILL.md` — `testing` row matches the slimmed skill.
- `docs/adr/0005` — `status: proposed`, "will run" until increment 2 lands.
- `decision-log/SKILL.md` — `domain-modeling` pointer scoped to ADR format and bar only.
- `testing/SKILL.md` — one-line tests with no setup exempt from AAA.
- `coding/SKILL.md` — `testing` row sends bug fixes to `diagnosing-bugs`.
- `feature-workflow/SKILL.md` — line rewrapped.

**Decisions made:** none new (user kept "drop history below the ADR bar" and "migrate DECISIONS.md after confirmation")

**State of known issues:**
- Open: `architecture` may be too large, out of scope.
- Open: `/setup-matt-pocock-skills` needed before increment 2.

**Next steps:**
1. Commit phase: git-workflow rules; no diagram to regenerate (waived).

## 2026-11-05 — Increment 1: resolve overlaps — Phase: Review

**Phase & Gate:** Review run against `writing-for-agents` + cross-reference consistency
(per-file-review's code checks don't apply to markdown; user agreed). Gate NOT met —
awaiting the user's resolution of each finding.

**What changed:** none (findings only)

**Decisions made:** none

**State of known issues:** findings 1–6 surfaced to the user, unresolved.

**Next steps:**
1. User accepts/rejects each finding; apply accepted fixes.

## 2026-11-05 — Increment 1: resolve overlaps — Phase: Implement

**Phase & Gate:** Gate is "tests pass"; there are no tests (Tests phase overridden), so
the gate is met by the user-validated file list being fully implemented. All listed
files changed; no other file touched.

**What changed:**
- `plugins/my-tools/skills/testing/SKILL.md` — slimmed to Arrange-Act-Assert, failure paths, independent tests; defers the rest to `tdd`.
- `plugins/my-tools/skills/decision-log/SKILL.md` — writes ADRs via `domain-modeling`'s format instead of `DECISIONS.md`; adds the "fails the ADR bar → drop it" case and `DECISIONS.md` migration.
- `plugins/my-tools/skills/architecture/SKILL.md` — pointer to `codebase-design`, which wins on overlap.
- `plugins/my-tools/skills/session-handoff/SKILL.md` — "Suggested skills" section.
- `plugins/my-tools/skills/feature-workflow/SKILL.md`, `coding/SKILL.md`, `per-file-review/SKILL.md`, `naming-conventions/SKILL.md` — `DECISIONS.md` references repointed to ADRs; `testing` row reworded.
- `README.md` — `testing` and `decision-log` solutions updated to stay accurate.
- `docs/adr/0001`–`0006` — one ADR per decision.
- `NEEDS.md` — requirement 2 status set to met.

**Decisions made:** see docs/adr/0001-use-mattpocock-skills-from-upstream.md through docs/adr/0006-keep-session-handoff.md

**State of known issues:**
- Open: `architecture` may be too large (user remark), out of scope.
- Open: Pocock's `code-review` needs `/setup-matt-pocock-skills` before increment 2 can rely on it.

**Next steps:**
1. Review phase: per-file-review + architecture pass, then user sign-off.

## 2026-11-05 — Increment 1: resolve overlaps — Phase: Tests — OVERRIDDEN BY USER

**Phase & Gate:** Gate (failing tests written) not met. User skipped it explicitly:
markdown-only skill changes, nothing to test.

**What changed:** none

**Decisions made:** none

**State of known issues:** none new

**Next steps:**
1. Implement the validated file list.

## 2026-11-05 — Increment 1: resolve overlaps — Phase: Spec (revised)

**Phase & Gate:** User answered every overlap decision. User waived the diagram for
this increment (preview .puml deleted). NEEDS.md amended (decision indicator: ADRs in
`docs/adr/` instead of `DECISIONS.md`). Gate NOT met — awaiting validation of the
NEEDS.md amendment and the revised file list.

**What changed:**
- `NEEDS.md` — requirement 2's indicator now points to ADRs in `docs/adr/`.
- `skills_integration.preview.puml` — deleted, diagram waived by the user.

**Decisions made (to be recorded as ADRs during Implement):**
- General rule: where a `my-tools` skill and a Pocock skill overlap, Pocock's wins.
- `testing` is slimmed, not deleted (revised after user review of the actual overlap):
  overlapping rules (behavior over implementation, mock at boundary, TDD loop) defer to
  `mattpocock-skills:tdd`; refactoring leaves the loop (moves to Review, per `tdd`);
  bug reproduction points to `diagnosing-bugs`. `testing` keeps only what `tdd` lacks:
  Arrange-Act-Assert, failure-path coverage, independent tests.
- `decision-log` keeps its rules but writes ADRs to `docs/adr/` instead of `DECISIONS.md`.
- `architecture` points to `codebase-design` vocabulary; no clash with `function-design`.
- Review phase will use `per-file-review` + Pocock `code-review` (increment 2).
- Keep `session-handoff`; Pocock `handoff` ignored (user-invoked only); borrow "suggested skills" section.
- Adopt `grilling`, `diagnosing-bugs`, `writing-for-agents` as-is.

**State of known issues:**
- Open: `architecture` may be too large on its own (user remark) — candidate for a later split, out of scope here.
- Resolved: Tests phase will be skipped by user decision (markdown-only changes, nothing to test) — to be logged as an override.

**Next steps:**
1. User validates NEEDS.md amendment + revised file list.
2. Log Tests phase as OVERRIDDEN BY USER, then Implement.

## 2026-11-05 — Increment 1: resolve overlaps — Phase: Spec

**Phase & Gate:** NEEDS.md created and validated by the user. Spec drafted: integration
diagram + per-overlap rules + file list. Gate NOT met — awaiting user validation of the
diagram, the overlap decisions, and the file list. Diagram not yet rendered to SVG
(running the downloaded plantuml.jar was blocked by the permission classifier).

**What changed:**
- `.claude/workflow/mattpocock-skills-integration/NEEDS.md` — Expression of Needs, validated.
- `.claude/workflow/mattpocock-skills-integration/skills_integration.preview.puml` — proposed integration diagram (draft).

**Decisions made:** none yet (pending user answers on the overlap rules)

**State of known issues:**
- Open: SVG render blocked; needs the user to allow running plantuml.jar or to render it themselves.
- Open: the Tests phase has no obvious "failing test" for markdown-only skill changes; to settle before Tests.

**Next steps:**
1. User answers the overlap decisions and validates diagram + file list.
2. Render the diagram to SVG once permitted.
3. Move to Tests phase.
