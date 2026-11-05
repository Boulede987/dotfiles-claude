## 2026-11-05 — Increment 2: feature-workflow uses Pocock skills — Phase: Report

**Phase & Gate:** Increment 2 complete; awaiting user validation before increment 3 opens.

**What changed:**
- `feature-workflow` now runs Spec → Build → Review → Commit → Report: `grilling` before
  NEEDS.md changes, `tdd` loop in Build (`diagnosing-bugs` for bug fixes), Review adds
  Pocock `code-review` and owns refactoring. Command, README flowchart, ADR 0005
  (accepted) and ADR 0007 updated. Requirement 3 of NEEDS.md met.

**Decisions made:** see docs/adr/0007-merge-tests-and-implement-into-build.md, docs/adr/0005-review-pairs-per-file-review-and-code-review.md

**State of known issues:**
- Open: branch `mattpocock-skills-integration` pushed, not merged; installed plugin still runs `main`'s old workflow until merge + `/plugin marketplace update`.
- Open: `/setup-matt-pocock-skills` not yet run in any project (Review falls back without it).
- Open: `architecture` may be too large — candidate for its own feature.

**Next steps:**
1. Increment 3: README Setup installs `mattpocock-skills`; README Problem/Solution entries for adopted Pocock skills; `coding` index lists them.

**CLAUDE.md update suggestions:** none

## 2026-11-05 — Increment 2: feature-workflow uses Pocock skills — Phase: Commit

**Phase & Gate:** User signed off Review. Commits made and pushed; no diagram to
regenerate (README mermaid is the diagram, committed). Gate met.

**What changed:**
- 85baf0d refactor(skills): merge feature-workflow Tests and Implement into Build
- 7955025 feat(skills): add grilling and code-review to feature-workflow

**Decisions made:** none new

**State of known issues:** none new

**Next steps:**
1. Report phase.

## 2026-11-05 — Increment 2: feature-workflow uses Pocock skills — Phase: Review

**Phase & Gate:** Self-review against `writing-for-agents` and cross-reference
consistency: no remaining Tests/Implement/"six phases" references in the skill, command
or README; one wrapped line fixed; Spec row now names `grilling`. Gate NOT met —
awaiting user sign-off.

**What changed:** `feature-workflow/SKILL.md` (rewrap, `grilling` in Spec row)

**Decisions made:** none

**State of known issues:** none new

**Next steps:**
1. User signs off; then Commit.

## 2026-11-05 — Increment 2: feature-workflow uses Pocock skills — Phase: Build — OVERRIDDEN BY USER

**Phase & Gate:** Gate (every agreed seam has a passing test) not met: markdown-only
changes, nothing to test; user agreed up front to the same override as increment 1.
Validated file list implemented.

**What changed:**
- `plugins/my-tools/skills/feature-workflow/SKILL.md` — Build phase replaces Tests + Implement (`tdd` loop, `diagnosing-bugs` for bug fixes); `grilling` before NEEDS.md validation; Review adds `code-review` with fallback; refactoring in Review.
- `plugins/my-tools/commands/feature-workflow.md` — phase list in description.
- `README.md` — new mermaid flowchart; feature-workflow Solution phase list.
- `docs/adr/0005` — status accepted.
- `docs/adr/0007-merge-tests-and-implement-into-build.md` — new.
- `NEEDS.md` — requirement 3 status set to met.

**Decisions made:** see docs/adr/0007-merge-tests-and-implement-into-build.md, docs/adr/0005-review-pairs-per-file-review-and-code-review.md

**State of known issues:** none new

**Next steps:**
1. Review phase.

## 2026-11-05 — Increment 2: feature-workflow uses Pocock skills — Phase: Spec

**Phase & Gate:** NEEDS.md unchanged (requirement 3 covers this increment) — no
re-validation. User accepted Q1–Q5: merge Tests + Implement into a Build phase running
`tdd`'s loop; `grilling` before NEEDS.md creation/amendment; `diagnosing-bugs` opens
Build for bug fixes; Review = `per-file-review` + `architecture` + Pocock `code-review`
(NEEDS.md as spec), refactoring happens in Review; README mermaid is the diagram. Gate
NOT met — awaiting validation of the drafted mermaid flowchart and file list.

**What changed:** none yet (diagram drafted in chat)

**Decisions made:** none recorded yet (ADR 0007 and ADR 0005 → accepted during Build)

**State of known issues:**
- Open: installed plugin copy comes from `main`; branch changes only apply after merge + `/plugin marketplace update`.

**Next steps:**
1. User validates the mermaid draft + file list.
2. Build phase (no tests possible for markdown — expect the same override as increment 1).

## 2026-11-05 — Increment 1: resolve overlaps — Phase: Report

**Phase & Gate:** Increment 1 complete; awaiting user validation before increment 2 opens.

**What changed:**
- `testing` slimmed to additions on top of `tdd`; `decision-log` writes ADRs;
  `architecture` points to `codebase-design`; `session-handoff` gained "Suggested skills";
  references in `feature-workflow`, `coding`, `per-file-review`, `naming-conventions`,
  README updated; ADRs 0001–0006 in `docs/adr/`. Requirement 2 of NEEDS.md met.

**Decisions made:** see docs/adr/0001-use-mattpocock-skills-from-upstream.md through docs/adr/0006-keep-session-handoff.md

**State of known issues:**
- Open: branch `mattpocock-skills-integration` pushed, not merged into `main`.
- Open: `/setup-matt-pocock-skills` needed in this repo before Pocock's `code-review` can run (increment 2).
- Open: `architecture` may be too large — candidate for its own feature.
- Open: ADR 0005 is `proposed` until increment 2 lands.

**Next steps:**
1. Increment 2 Spec: `feature-workflow` phase table — `grilling` before NEEDS.md
   validation, `tdd` seams agreed in Tests, refactoring in Review, Review runs
   `per-file-review` + Pocock `code-review` (then flip ADR 0005 to accepted).
2. Increment 3: README Setup installs `mattpocock-skills`; README entries for adopted
   Pocock skills; `coding` index lists them.

**CLAUDE.md update suggestions:**
- `Matt Pocock's skills come from the mattpocock-skills plugin; never copy them into plugins/my-tools/. Where they overlap a my-tools skill, his wins (docs/adr/0001).`
- `Decisions are ADRs in docs/adr/ (domain-modeling format); there is no DECISIONS.md.`

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
