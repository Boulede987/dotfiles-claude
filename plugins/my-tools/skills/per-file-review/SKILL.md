---
name: per-file-review
description: >
  Dispatch one subagent per file to check file-local coding-standard violations, instead
  of sweeping the whole codebase in one pass. Trigger when the user asks to refactor,
  clean up, or check quality across multiple files, or explicitly asks for "per-file
  review", "one agent per file", or "check quality file by file". Not for correctness
  bugs (use the code-review skill) or cross-file architecture concerns (SOLID, DRY
  across files, dependency direction — those need whole-repo context, see below).
---

# Per-File Review — One Agent, One File

## Why This Exists

A single pass sweeping many files at once splits attention across all of them, so
file-local violations that are cheap to catch in isolation — a function that should be
extracted, a magic number, a comment naming another class's job instead of stating an
invariant — get missed. Giving each file its own subagent with the full context budget
spent on that file alone catches what a sweep misses, because the check genuinely
doesn't need any other file to run.

## What Qualifies as File-Local

Only dispatch checks that can be verified by reading the one file in front of the agent.
That's most of the `coding` skill's rule set:

| Skill | File-local? | Why |
|---|---|---|
| `function-design` | Yes | Function length, nesting, extraction — all visible in one file |
| `naming-conventions` | Yes | Magic numbers, constants, comments, primitive obsession, the invariant-not-owner rule |
| `decision-log` | Yes | Whether a comment is narrative-history that should move to `DECISIONS.md` |
| `python-conventions` | Yes | `__main__` guard, encoding — properties of the one file |
| `type-safety` | Yes | Signature typing is visible without the caller |
| `error-handling` | Yes | Swallowed exceptions, ambiguous `None` returns — visible in the function itself |
| `testing` | Mostly | A test file's own structure/naming/AAA; mocking-the-boundary needs the target module too, so pass both files together when reviewing a test |
| `architecture` | **No** | SRP/DRY/DIP/SOLID/YAGNI need to see other files (is this duplicated elsewhere? does another class already exist?) — exclude from per-file dispatch |

`architecture` (and any cross-file correctness concern) stays a separate, whole-repo
pass — either the `code-review` skill or a manual read across the affected files. Don't
ask a per-file agent to judge it; it will either miss real duplication it can't see, or
false-positive on "this looks like it could be abstracted" with no way to check if a
second case exists.

## How to Dispatch

1. **Determine the file set.** Default to files changed in the current diff
   (`git diff --name-only`, or against the merge-base for a branch). Only sweep the
   whole repo if the user explicitly asks — that's `N` agents for `N` files, so cost
   scales with scope; don't default to the expensive option.
2. **Filter.** Drop generated files, vendored/third-party code, lockfiles, and binary
   assets before dispatching — no file-local coding-standard check applies to them.
3. **Spawn one `cavecrew-reviewer` agent per remaining file, in parallel** (one message,
   multiple `Agent` tool calls — see the Agent tool's parallel-call guidance). `Agent`
   tool with `subagent_type: "cavecrew-reviewer"` is provided by the `caveman` plugin,
   not this repo — reference it by name; don't vendor or redefine it here. If that
   subagent type isn't available in the current environment, fall back to
   `subagent_type: "general-purpose"` with the same per-file prompt, noting the loss of
   the compressed one-line-per-finding output.
4. **Scope each prompt to exactly one file** and name which of the table's skills apply
   to it (e.g. a `.py` file gets `function-design`, `naming-conventions`,
   `decision-log`, `python-conventions`, `type-safety`, `error-handling`; a test file
   also gets `testing` and is told which module file it targets, read alongside it
   *only* to judge whether a mock target is a true external boundary). Tell the agent
   explicitly not to flag anything requiring another file's content beyond that.
5. **Aggregate.** Collect each agent's findings and present one combined list, file by
   file. Don't auto-apply fixes unless the user asked for that — surface findings first,
   the way `code-review` does, then apply via `cavecrew-builder` (or directly) only on
   confirmation.

## What This Replaces, What It Doesn't

This replaces a broad "refactor/clean up the codebase" sweep for the file-local rule
set. It does not replace a correctness-focused review (`code-review`), and it does not
replace a whole-repo architecture pass — run those separately, before or after, not
instead of this.
