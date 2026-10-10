---
name: generate-docs
description: >
  Generate or refresh PlantUML documentation from source code using the personal
  DocGeneration toolset, discovering what project types/languages it currently
  supports from the repo itself rather than a fixed list. Falls back to hand-drawn
  diagrams (design-preview / algorithm-diagrams) when the current project's language
  isn't covered. Trigger when the user says "generate docs", "update docs", "refresh
  documentation", "run doc gen", or similar. Also trigger when the user asks why docs
  are out of date.
---

# Generate Documentation

Pull the latest scripts, discover what the toolset currently supports, run the
matching generator — or say clearly that nothing matches and fall back to hand-drawn
diagrams.

## Step 1 — Locate the DocGeneration Repo

Check `$env:DOCGEN_REPO` (Windows) or `$DOCGEN_REPO` (Unix). If unset, default to:
- Windows: `C:\Users\<current user>\.tools\DocGeneration`
- Unix/Mac: `~/.tools/DocGeneration`

If the directory does not exist, clone it:
```
git clone https://github.com/Boulede987/DocGeneration.git <resolved_path>
```

## Step 2 — Pull Latest Scripts

```
git -C <DOCGEN_REPO> pull --quiet
```

## Step 3 — Discover What's Currently Supported

**Don't hardcode a list of supported languages/project types here** — that
knowledge belongs to the DocGeneration repo, which can grow independently of this
skill, and a fixed list in this file would silently go stale the moment the repo adds
or renames something. Instead, each run:

- Read the repo's own documentation (`README.md` or equivalent) if it has one, for
  what project types it generates for and how each generator is invoked.
- Otherwise, enumerate its generator scripts (e.g. `generate_*.py`) and check each
  one's own usage/help text or top-of-file docstring for what it expects as input and
  what markers identify a matching project.

Use whatever is currently discovered — not what was discovered last time this skill
ran, since the repo may have changed.

## Step 4 — Match the Current Project

Check the **current working directory** (the project Claude is working in) against
the markers discovered in Step 3.

- Exactly one match → run it (Step 5).
- More than one match → ask the user which documentation to generate rather than
  guessing.
- No match → go to Step 6, don't guess at a script to force.

## Step 5 — Run the Matching Script

Invoke it the way its own usage/help/docstring (discovered in Step 3) says to, passing
the project's source root. Note where it says output lands — don't assume a fixed
output path that may differ between generators or change as the repo evolves.

## Step 6 — No Match: Say So, Then Fall Back to Hand-Drawn Diagrams

If nothing in the DocGeneration repo currently covers this project's language, state
that clearly and visibly — name the language and say plainly that no generator
supports it yet, don't bury this in a routine status line. Then don't leave
documentation undone: produce it by hand instead, via the `design-preview` skill for
structure (class diagrams) and/or the `algorithm-diagrams` skill for any unusual
algorithms, exactly as those skills would run for a project with no diagram tooling
at all.

## Step 7 — Report

Tell the user:
- Which script ran (or, on no match, that none did and hand-drawn diagrams were used
  instead)
- Where output files were written
- How many classes/tables were parsed, if the script reports this
- If anything failed, show the error verbatim
