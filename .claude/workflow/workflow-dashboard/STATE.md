## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Report

**Status:** validated

**Pending documents:** none

**Phase & Gate:** User validated the Report entry. CLAUDE.md suggestion applied at the
user's request (2a96901). NEEDS.md section 2 rows of this increment set to "met".
Increment 2 closed; pausing until the user starts the next increment.

**What changed:**
- `CLAUDE.md` — `tools/` rule (docs/adr/0011).
- `.claude/workflow/workflow-dashboard/NEEDS.md` — all 13 requirements "met".

**Decisions made:** none new

**State of known issues:**
- Resolved: CLAUDE.md suggestion from increment 1 not applied.
- Resolved: this increment's NEEDS.md rows read "not started".
- Open: branch `workflow-dashboard` not merged into `main`; commits not pushed.
- Open: 500 path and "no free port in 20" path untested; types not compiler-checked.

**Next steps:**
1. User merges `workflow-dashboard` into `main`.

**CLAUDE.md update suggestions:**
- none

## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Report

**Status:** awaiting-validation

**Pending documents:** .claude/workflow/workflow-dashboard/STATE.md

**Phase & Gate:** Report entry written; awaiting user validation, then the closing
commit `chore(workflow): close increment 2`. Commits are not pushed, so the closing
commit is not pushed either.

**What changed:**
- `tools/workflow-dashboard/` — tabs: "To validate" (every pending document shown in place, with reasons when it cannot be), one per ongoing feature with a marker dot, and "Closed"; `#tab=` selection kept across reload and live refresh; 94 tests.
- `docs/diagrams/workflow-dashboard.{puml,svg}` — regenerated as-built diagram.
- `.claude/workflow/workflow-dashboard/NEEDS.md` — 5 rows added or changed this increment.

**Decisions made:** none new (ADR 0011 still covers the tool)

**State of known issues:**
- Open: branch `workflow-dashboard` not merged into `main`; commits not pushed.
- Open: tab switching in the browser covered by the manual check only.
- Open: 500 path and "no free port in 20" path untested; types not compiler-checked.
- Open: the 5 NEEDS.md rows of this increment still read "not started".

**Next steps:**
1. User validates this entry.
2. Closing commit (STATE.md, NEEDS.md with this increment's rows set to "met", use case diagram).
3. Merge `workflow-dashboard` into `main`.

**CLAUDE.md update suggestions:**
- none new; increment 1's suggestion is not in CLAUDE.md yet: `tools/` holds standalone tools that run outside Claude Code sessions; keep them invisible to Claude (no hook, no skill naming them) (docs/adr/0011).

## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Commit

**Status:** validated

**Pending documents:** none

**Phase & Gate:** User signed off Review after the manual browser check. Commits made on
branch `workflow-dashboard`, not pushed; each one passes `npm test` on its own (checked
in a temporary worktree: 73, 80, 94 tests). Diagram regenerated with the TypeScript
generator; preview copy deleted. Gate met.

**What changed:**
- 04c5841 feat(dashboard): resolve literal STATE.md paths inside the project
- d5be524 feat(dashboard): decide how each pending document is shown
- 5abc50b feat(dashboard): show feature tabs and documents to validate
- 15eb9da docs(dashboard): regenerate class diagram for tabs and documents

**Decisions made:** none new

**State of known issues:** none new

**Next steps:**
1. Report phase.

## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Review

**Status:** awaiting-validation

**Pending documents:** none

**Phase & Gate:** User chose groups A (A.3 option a), B, C. A.3 amended NEEDS.md after one
grilling round (3 questions, all accepted; the accepted Q1 wording validates the row).
All applied; `npm test` 94/94 green on 3 consecutive runs; unreadable-file test ran red
first with a real ACL deny (not skipped); smoke run against this repo renders. Gate NOT
met — awaiting user manual browser check (tab switching, `#tab=` across reload, tab kept
on live refresh, `.md` shown as text) and Review sign-off.

**What changed:**
- `NEEDS.md` — "Unshowable documents" row gains "unreadable" (any type), link only on too-large.
- `src/documentReader.ts` — every type opened; missing vs unreadable by error code; text read bounded to 256 KB + 1 byte; `MAX_TEXT_BYTES` exported.
- `src/model.ts` — `UnshowableReason` gains "unreadable"; `isAwaitingValidation`; `pendingValidations` takes features.
- `src/workflowReader.ts` — `Dashboard` built in one step.
- `src/safePath.ts` — NUL in a plain path is "not a file path"; NUL after decoding is malformed encoding.
- `src/html.ts` — `tabHref`, `documentId` keyed on path, named id-encoding helpers, honest tab-name comment.
- `src/renderFeature.ts`, `src/renderValidation.ts`, `src/renderPage.ts` — shared `renderPhase`/`renderGate`, path-keyed document blocks, exhaustive view switch, `Tab.awaitingValidation`, `activeClass`.
- `test/*.test.ts` — group C gaps closed; listing-error test can now fail; block id stability, empty states, unreadable file.

**Decisions made:** none new

**State of known issues:**
- Open: tab switching in the browser untested by design; manual check pending.
- Open: 500 path and "no free port in 20" path untested; types not compiler-checked.

**Next steps:**
1. User runs the manual browser check and signs off Review.
2. Commit phase.

## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Review

**Status:** awaiting-validation

**Pending documents:** none

**Phase & Gate:** per-file-review (14 agents), architecture pass, code-review Standards +
Spec axes against 3b9770d with NEEDS.md as spec. Findings triaged: A behaviour fixes,
B refactors, C test gaps, D rejected (each verified false or out of scope). Spec axis:
no missing requirement. Gate NOT met — awaiting user decision on which groups to apply,
then manual browser check.

**What changed:** none yet

**Decisions made:** none yet

**State of known issues:**
- Open: document block ids are positional (collapsed state can move to another document); a vacuous render test; unreadable files reported as "not found"; text size checked before the read, not during it.

**Next steps:**
1. User picks finding groups to apply.

## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Build

**Status:** validated

**Pending documents:** none

**Phase & Gate:** Seams agreed by user (6; seam 6, tab switching in the browser, is a
manual check in Review). Seams 1–5 each have passing tests: 84 tests, `npm test` green on
3 consecutive runs. Red observed first for seams 2–5; for seam 1 the test file was
written first but first run after `documentReader.ts` existed. Smoke run against this
repo: page renders, browser script parses. Gate met.

**What changed:**
- `src/safePath.ts` — `resolveExistingPath` checks a literal STATE.md path; `resolveExistingInside` = decode + it.
- `src/documentReader.ts` — new: image / text / link / unshowable reason per pending document, 256 KB text limit.
- `src/model.ts` — `DocumentView`, `ShownDocument`, `ValidationItem`, `Dashboard.toValidate`; `isClosed`, `ongoingFeatures`, `closedFeatures`, `documentCount`.
- `src/workflowReader.ts` — fills `toValidate` for features whose newest entry awaits validation.
- `src/html.ts`, `src/renderFeature.ts`, `src/renderValidation.ts` — new: shared helpers and tab names, feature card (moved unchanged), To validate tab.
- `src/renderPage.ts` — tab bar and panels; former top panel removed. `Tab` type is `{name, label, marked, content}` (diagram said `id`, no `content`); helpers `buildTabs`, `featureTab`, `renderTabLink`, `renderTabPanel`, `renderListingNotice` replace the drafted `renderTabBar`/`renderTabLabel`.
- `src/clientScript.ts`, `src/styles.ts` — tab selection from `#tab=`, kept across live swaps; tab, marker and document styles.
- `test/{safePath,model,documentReader,workflowReader,renderPage}.test.ts` — tests per seam.
- `README.md` (tool) — describes the tabs.

**Decisions made:** none new

**State of known issues:**
- Open: tab switching, reload with `#tab=`, and tab kept on live refresh are untested by design; manual check in Review.
- Open: 500 path and "no free port in 20" path untested; types not compiler-checked.

**Next steps:**
1. Review: per-file-review, architecture, code-review against 3b9770d with NEEDS.md as spec; manual browser check.

## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Build

**Status:** awaiting-validation

**Pending documents:** none

**Phase & Gate:** Spec gate met: user validated the class diagram and file list. Build
gate NOT met — seams under test awaiting user agreement.

**What changed:** none yet

**Decisions made:** none yet

**State of known issues:** none new

**Next steps:**
1. User agrees seams under test.
2. Red/green per seam.

## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Spec

**Status:** awaiting-validation

**Pending documents:** docs/diagrams/workflow-dashboard-preview.svg

**Phase & Gate:** NEEDS.md change validated by user. Class diagram drafted as a
highlighted copy of the as-built diagram (design-preview), with file list. Gate NOT
met — awaiting user validation of the design.

**What changed:**
- `docs/diagrams/workflow-dashboard.preview.puml` / `workflow-dashboard-preview.svg` — proposed structure; new and changed elements in orange.

**Decisions made:** none yet

**State of known issues:**
- Open: 500 path and "no free port in 20" path untested; types not compiler-checked.

**Next steps:**
1. User validates the class diagram and file list.
2. Build phase: agree seams under test.

## 2026-11-21 — Increment 2: feature tabs and documents to validate — Phase: Spec

**Status:** awaiting-validation

**Pending documents:** .claude/workflow/workflow-dashboard/NEEDS.md, .claude/workflow/workflow-dashboard/workflow-dashboard-use-cases.svg

**Phase & Gate:** One grilling round (7 questions, all accepted; frontier empty).
NEEDS.md amended: 2 rows rewritten, 1 row extended, 2 rows added. Gate NOT met —
awaiting user validation of the NEEDS.md change before the class diagram is drafted.
Increment starts from commit 3b9770d on branch `workflow-dashboard`.

**What changed:**
- `NEEDS.md` — tabs per ongoing feature plus "Closed"; "To validate" tab showing documents in place; tab markers; unshowable-document reasons; selected tab kept across refresh and reload.
- `use-cases.puml` / `workflow-dashboard-use-cases.svg` — UC2, UC3, UC4, UC8 changed for this increment (highlighted).

**Decisions made:** none yet

**State of known issues:**
- Open: 500 path and "no free port in 20" path untested; types not compiler-checked.

**Next steps:**
1. User validates the NEEDS.md change.
2. Draft class diagram + file list (design-preview), get validation.

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Report

**Status:** validated

**Pending documents:** none

**Phase & Gate:** User validated the Report entry. DocGeneration gained a TypeScript
generator (b6266db), so the hand-drawn class diagram was replaced by the generated
whole-project view. NEEDS.md section 2 rows set to "met". Increment 1 closed; pausing
until the user starts the next increment.

**What changed:**
- `docs/diagrams/workflow-dashboard.{puml,svg}` — generated by `generate_class_diagramm_typescript.py` (Packages-Full `_project` view), replacing the hand-drawn version.
- `.claude/workflow/workflow-dashboard/NEEDS.md` — all 11 requirements "met".

**Decisions made:** none new

**State of known issues:**
- Resolved: no DocGeneration generator for TypeScript.
- Resolved: NEEDS.md rows read "not started".
- Open: branch `workflow-dashboard` not merged into `main`; commits not pushed.
- Open: 500 path and "no free port in 20" path untested; types not compiler-checked.

**Next steps:**
1. User merges `workflow-dashboard` into `main`, then `/plugin marketplace update`.

**CLAUDE.md update suggestions:**
- `tools/` holds standalone tools that run outside Claude Code sessions; keep them invisible to Claude (no hook, no skill naming them) (docs/adr/0011).

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Report

**Status:** awaiting-validation

**Pending documents:** .claude/workflow/workflow-dashboard/STATE.md

**Phase & Gate:** Report entry written; awaiting user validation, then the closing
commit `chore(workflow): close increment 1`. Commits are not pushed, so the closing
commit is not pushed either.

**What changed:**
- `tools/workflow-dashboard/` — standalone, read-only, per-project live dashboard of feature-workflow state (Node, TypeScript, zero dependencies, 65 tests).
- `plugins/my-tools/skills/feature-workflow/SKILL.md` — STATE.md entries carry `Status` and `Pending documents`.
- `docs/adr/0011-workflow-dashboard-standalone-tool.md`, `docs/diagrams/workflow-dashboard.{puml,svg}`, `README.md` — decision, as-built diagram, launch instructions.

**Decisions made:** see docs/adr/0011-workflow-dashboard-standalone-tool.md

**State of known issues:**
- Open: branch `workflow-dashboard` not merged into `main`; the installed plugin keeps the old SKILL.md format until merge + `/plugin marketplace update`.
- Open: 500 path and "no free port in 20" path untested; types not compiler-checked.
- Open: no DocGeneration generator for TypeScript; the as-built diagram is hand-drawn and must be updated by hand.
- Open: all NEEDS.md section 2 rows still read "not started".

**Next steps:**
1. User validates this entry.
2. Closing commit (STATE.md, NEEDS.md, use case diagram).
3. Merge `workflow-dashboard` into `main`, then `/plugin marketplace update`.

**CLAUDE.md update suggestions:**
- `tools/` holds standalone tools that run outside Claude Code sessions; keep them invisible to Claude (no hook, no skill naming them) (docs/adr/0011).

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Commit

**Status:** validated

**Pending documents:** none

**Phase & Gate:** User signed off Review after manual browser check. Commits made on
branch `workflow-dashboard`, not pushed. DocGeneration has no TypeScript generator, so
the as-built class diagram was drawn by hand at `docs/diagrams/workflow-dashboard.puml`;
the design-preview copy was deleted. Gate met.

**What changed:**
- 3d77325 feat(workflow): add Status and Pending documents to entries
- 591e0b5 feat(dashboard): read feature-workflow state from disk
- dd25f8f feat(dashboard): serve a live workflow dashboard page
- 084e562 docs(dashboard): record ADR 0011, diagram and README entry

**Decisions made:** none new

**State of known issues:** none new

**Next steps:**
1. Report phase.

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Review

**Status:** validated

**Pending documents:** none

**Phase & Gate:** User chose groups A, B, C (A.5 amended: SKILL.md does not mention any
reader of the fields at all). All applied; `npm test` 65/65 green on 3 consecutive runs;
smoke run against this repo parses every STATE.md/NEEDS.md with no error. Gate NOT met —
awaiting user manual browser check (scroll + open sections kept on live update) and
Review sign-off.

**What changed:**
- `src/server.ts` — Host-header guard (DNS rebinding), bound address exposed, files via `resolveExistingInside`, refusal reason → status map, errors logged, `ServerContext` bundle.
- `src/safePath.ts` — `resolveExistingInside` follows symlinks on both sides; `PathResult` moved here; helpers split.
- `src/watcher.ts` — class with explicit state; synchronous `watch()` throw and `error` events logged and recovered by polling.
- `src/workflowReader.ts` — listing failure becomes `Dashboard.listingError`; `workflowRoot()` exported; `NeedsResult` by `kind`.
- `src/stateParser.ts` — commit hashes only from Commit-phase entries (all fields, deduplicated); `overridden` flag dropped, heading marker feeds status; `parseHeading` extracted.
- `src/needsParser.ts` — separator row matches dash cells only; `toRequirement` extracted.
- `src/model.ts` — `ENTRY_STATUSES` single source; `newestEntry`, `countMet`; `listingError`.
- `src/routes.ts`, `src/styles.ts`, `src/clientScript.ts` — new: shared routes, CSS and browser script out of `renderPage.ts`; failed refresh marks page stale.
- `src/renderPage.ts` — injective feature ids, listing error, model helpers.
- `src/cli.ts`, `bin/workflow-dashboard.js` — `UsageError` thrown instead of `process.exit`; named port bounds; browser-open failure noted.
- `test/*.test.ts` — Arrange-Act-Assert, CRLF, hash bounds, header-only table, empty-cell rows, NEEDS read error, listing error, junction escape, drive-relative and UNC paths, Host guard, 405, folder 404, bound address, SSE without fixed sleep or shared-fixture mutation, quote escaping, pending-panel scoping, first next step only, requirements count.
- `plugins/my-tools/skills/feature-workflow/SKILL.md` — status paragraph no longer names any reader.

**Decisions made:** none new

**State of known issues:**
- Open: 500 path and "no free port in 20" path untested (no cheap trigger).
- Open: types not compiler-checked (ADR 0011).

**Next steps:**
1. User runs the manual browser check and signs off Review.
2. Commit phase.

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Review

**Status:** validated

**Pending documents:** none

**Phase & Gate:** per-file-review (16 agents), code-review Standards + Spec axes run
against efa8d4e with NEEDS.md as spec. Findings triaged: A spec/security fixes, B
refactors, C test gaps, D rejected (4, each verified false). Gate NOT met — awaiting
user decision on which groups to apply, then manual browser check.

**What changed:** none yet

**Decisions made:** none yet

**State of known issues:**
- Open: DNS rebinding (no Host check), symlink escape in /files, uncaught fs.watch throw, folder-listing error blanks page, SKILL.md names the tool (spec §1).

**Next steps:**
1. User picks finding groups to apply.

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Build

**Status:** validated

**Pending documents:** none

**Phase & Gate:** Seams agreed by user (7). Every seam has passing tests: 46 tests,
`npm test` green on 3 consecutive runs. Gate met. Smoke run against this repo: real
STATE.md files (28 and 3 entries) parse with no error.

**What changed:**
- `tools/workflow-dashboard/src/{model,stateParser,needsParser,workflowReader,safePath,renderPage,watcher,server,cli}.ts` — the tool, per the validated class diagram.
- `tools/workflow-dashboard/test/*.test.ts` — one file per seam.
- `tools/workflow-dashboard/{package.json,bin/workflow-dashboard.js,README.md}` — `npm link`-able command.
- `plugins/my-tools/skills/feature-workflow/SKILL.md` — §4 entry format gains `Status` and `Pending documents`.
- `README.md` — Workflow Dashboard entry.

**Decisions made:** see docs/adr/0011-workflow-dashboard-standalone-tool.md

**State of known issues:**
- Open: types are not compiler-checked (zero dependencies, no `tsc`).
- Open: `cli` and the browser-side live swap (scroll + open sections kept) are untested by design; manual check in Review.

**Next steps:**
1. Review: per-file-review, architecture, code-review against efa8d4e with NEEDS.md as spec; manual browser check.

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Build

**Status:** validated

**Pending documents:** none

**Phase & Gate:** Spec gate met: user validated class diagram, file list, TypeScript
(native Node type stripping), and `docs/diagrams/` as diagram location. Verified: a
`.ts` entry runs through an `npm link`ed bin on Node v25.9.0. Build gate NOT met —
seams under test awaiting user agreement.

**What changed:** none yet

**Decisions made:** none yet

**State of known issues:** none

**Next steps:**
1. User agrees seams under test.
2. Red/green per seam.

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Spec

**Status:** validated

**Pending documents:** .claude/workflow/workflow-dashboard/workflow-dashboard-classes.svg

**Phase & Gate:** NEEDS.md validated by user. Class diagram + file list drafted
(design-preview). Gate NOT met — awaiting user validation of the design.

**What changed:**
- `class-design.preview.puml` / `workflow-dashboard-classes.svg` — proposed module structure.

**Decisions made:** none yet

**State of known issues:** none

**Next steps:**
1. User validates class diagram, file list, TypeScript choice, diagram location.
2. Build phase: agree seams under test.

## 2026-11-21 — Increment 1: workflow dashboard — Phase: Spec

**Status:** validated

**Pending documents:** .claude/workflow/workflow-dashboard/NEEDS.md, .claude/workflow/workflow-dashboard/workflow-dashboard-use-cases.svg

**Phase & Gate:** NEEDS.md created after two grilling rounds (frontier empty). Gate
NOT met — awaiting user validation of NEEDS.md before the class diagram is drafted.
Increment starts from commit efa8d4e on branch `workflow-dashboard`.

**What changed:**
- `NEEDS.md` — new Expression of Needs for the dashboard.
- `use-cases.puml` / `workflow-dashboard-use-cases.svg` — use case diagram clarifying page content.

**Decisions made:** none yet (ADR to follow: standalone Node tool instead of a hook)

**State of known issues:** none

**Next steps:**
1. User validates NEEDS.md.
2. Draft class diagram + file list (design-preview), get validation.
