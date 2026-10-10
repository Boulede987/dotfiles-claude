---
name: feature-workflow
description: >
  Run or resume the spec-driven, multi-phase feature-dev workflow for one feature
  increment: Spec → Tests → Implement → Review → Commit → Report, pausing for
  explicit user validation after every phase. Maintains a persistent Expression of
  Needs and an append-only state log per feature under .claude/workflow/<slug>/ in
  the target project. Trigger via the /feature-workflow command, when the user says
  "resume/continue the feature workflow" or "next increment," or when an existing
  .claude/workflow/<slug>/STATE.md is already in play — not for one-off requests
  ("commit this," "write tests for this") with no active workflow state file.
---

# Feature Workflow — Spec-Driven, Gated, Resumable

## 1. Purpose

A multi-session, multi-phase workflow for building one feature as a series of small,
gated increments. Each increment goes through six phases, in order, with the user
validating before the workflow advances past Spec and Review in particular — this is
not a single-shot skill, it is a process with enforced state that survives across
sessions.

Phase order: **Spec → Tests → Implement → Review → Commit → Report.**

## 2. Artifact Root

All artifacts live in the **target project** — wherever this plugin is installed —
never in this plugin's own repo. Root: `.claude/workflow/<slug>/`, where `<slug>` is a
kebab-case identifier for the feature and may be nested (e.g.
`modpack/custom-ore-mod`) when one feature is scoped inside a larger one. Bootstrap
the directory and its files on first run if they don't exist.

## 3. Expression of Needs (`NEEDS.md`)

A persistent document — amended and added to in place over time, **never**
regenerated per increment. Sections:

```markdown
# <Feature Name>

## 1. What & Why
<What this project/feature is, and why it's being built.>

## 2. Expected Outputs
| Requirement | Indicator | Status |
|---|---|---|
| <the project/feature must do X> | <how it's measured> | not started / in progress / met |

## 3. Parent
<Only present when this NEEDS.md was deliberately scoped below an ancestor feature.
Names that ancestor's slug/path — does not repeat its content.>
```

**Lookup:** if the current slug has no `NEEDS.md`, walk up to the nearest ancestor
slug that has one and use that. **Creating a new one:** when starting work that feels
substantial enough to deserve its own Expression of Needs (the user's own example: a
whole modpack gets one, and a specific mod built for it might deserve its own too),
don't decide silently — ask the user. If they say yes, the new `NEEDS.md` names its
parent in section 3 rather than duplicating section 1/2 content.

**Validation gate:** `NEEDS.md` is a premise everything downstream builds on — a bad
requirement produces a correctly-built wrong thing. Any time this skill creates
`NEEDS.md` or amends it (a new row in §2, a changed requirement/indicator, a new
`NEEDS.md` for a sub-feature), present exactly what was added or changed and get the
user's explicit validation **before** drafting the Spec phase's diagrams — validating
a design against an unvalidated need is wasted work if the need turns out wrong. If
`NEEDS.md` is unchanged this increment (already validated earlier), don't re-ask.

## 4. Per-Increment Log (`STATE.md`)

Append-only, newest entry at top — same convention as the `decision-log` skill's
`DECISIONS.md`. Every phase appends exactly one entry, never edits a past one:

```markdown
## <date> <time> — <story/increment> — Phase: <phase name>

**Phase & Gate:** <what this phase required, and whether/how the gate was met>

**What changed:**
<files touched this phase, one sentence on why each>

**Decisions made:**
<see DECISIONS.md <date>, or "none" — never the rationale itself, only a pointer>

**State of known issues:**
<open or resolved>

**Next steps:**
<concrete, ordered — first item is the literal next action>

**CLAUDE.md update suggestions:** (Report phase only)
<ready-to-paste lines, or "none">
```

`CLAUDE.md update suggestions` appears only on `Report` entries — including it every
phase would be noise.

## 5. Resume Logic

On invocation, read `STATE.md`'s newest (topmost) entry to find the current
phase/increment.

- No `requested_phase` given → resume at that phase.
- `requested_phase` given and it matches the phase that comes next once the current
  one's gate is satisfied → proceed there.
- `requested_phase` given but the current phase's gate isn't satisfied yet → this is a
  skip attempt, not a legitimate resume point. Go to rule 7.

## 6. Phase Table

| Phase | Skill(s) invoked | Gate to advance | STATE.md records |
|---|---|---|---|
| **Spec** | `design-preview` (always), `algorithm-diagrams` (only if its own conditions are met), `architecture`, `type-safety` | If `NEEDS.md` was created/amended for this increment, the user validates that change **first** — the design is never drafted against an unvalidated need. Then: user explicitly validates the proposed class diagram + file list (and activity diagram, if one was drafted) | Any `NEEDS.md` addition/change; diagram path(s), file list; "awaiting validation" until confirmed |
| **Tests** | `testing` | Tests are written and **failing** (red), before any implementation code exists | Test files added, expected-failure state noted |
| **Implement** | `function-design`, `naming-conventions`, `type-safety`, `error-handling`, `decision-log`, `python-conventions` (as applicable) | The tests from the previous phase now **pass** (green) | Decisions made = pointer into the target project's `DECISIONS.md` only, never the rationale itself |
| **Review** | `per-file-review` (file-local) and `architecture` (cross-file) run first | **The user is the actual gate** — automated findings inform the review, they never substitute for it | Findings surfaced, user's resolution/acceptance of each |
| **Commit** | `git-workflow`'s existing branch/commit rules; `generate-docs` regenerates `design-preview`'s diagram(s) from the real, now-implemented code | Commit(s) made referencing the increment; diagram(s) now reflect as-built truth, overwriting the highlighted draft | Commit hash(es) and message |
| **Report** | `session-handoff`'s section format, persisted here instead of chat-only | `STATE.md` entry written; user validates before the next increment is allowed to open | Full entry including `CLAUDE.md update suggestions` |

## 7. Gate / Override Protocol

When asked to advance past a phase whose gate isn't satisfied: name the specific unmet
criterion and refuse — don't guess that it's probably fine. Advance only on an
explicit override ("skip to commit," "override, go ahead"). When an override happens,
log it as its own `STATE.md` entry (`Phase: <skipped-to phase> — OVERRIDDEN BY USER`)
so the skip is visible in the history, not silently absorbed into the normal flow.

## 8. Increment Loop

Once `Report`'s gate is met: **pause.** Do not auto-start the next increment's Spec
phase. The user decides when the next increment begins, by invoking the workflow
again.

## 9. Relationship to `decision-log`

Historical/rationale narrative discovered or written during `Implement` still goes
through the `decision-log` skill into the target project's `DECISIONS.md`. This
skill's `STATE.md` never duplicates that content — its "Decisions made" field is a
dated pointer only.

## 10. Relationship to `design-preview`, `algorithm-diagrams`, `generate-docs`

Spec phase invokes `design-preview` (always) and `algorithm-diagrams` (conditionally)
to produce diagrams for review. Commit phase invokes `generate-docs` to finalize them
against the real implementation. This skill never duplicates those skills' internal
drafting, save-location, or regeneration logic — it only sequences when each one runs.

## 11. Relationship to `session-handoff`

`session-handoff` remains the generic, chat-only, end-of-session skill for work
outside an active feature workflow. This skill's `Report` phase reuses its four
section headings verbatim (`What changed`, `Decisions made`, `State of known issues`,
`Next steps`) but persists them to `STATE.md` instead of printing them to chat and
discarding them.
