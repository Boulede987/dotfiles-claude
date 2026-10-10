---
description: Run the spec-driven, multi-phase feature workflow (Spec → Tests → Implement → Review → Commit → Report) for one feature/increment, resuming from on-disk state.
argument-hint: <feature-slug> [phase-override]
---

Resolve which feature this workflow run targets, then hand off — all phase logic,
gating, and artifact handling belongs to the `my-tools:feature-workflow` skill, not
here.

1. Parse `$ARGUMENTS`. The first token, if present, is the feature slug (kebab-case,
   may be nested, e.g. `modpack/custom-ore-mod`). A second token, if present, is a
   requested phase/override — pass it through verbatim; do not interpret, validate,
   or reject it here.
2. If no slug was given: look for `.claude/workflow/**/STATE.md` in the current
   project.
   - Exactly one match → resume that slug.
   - More than one → ask the user which feature to resume.
   - None → ask the user to name the new feature before proceeding; a slug is
     required to know where artifacts live.
3. Invoke `my-tools:feature-workflow` with the resolved slug and the optional
   `requested_phase` token. Let that skill own resume logic, gate checks, and all
   artifact reads/writes under `.claude/workflow/<slug>/`.
