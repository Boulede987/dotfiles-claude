---
name: git-workflow
description: >
  Apply the user's git workflow rules whenever creating branches or making commits.
  User knows git basics (merge, log, discard changes) but not advanced git — act as a
  companion for anything beyond that. Trigger before running `git branch`/`git checkout -b`,
  before `git commit`, and whenever the user asks a git question, requests a commit, or
  says things like "make a branch", "commit this", "let's branch off", or is unsure how to
  do something in git.
---

## Branching

- Any **broad change** (touches multiple files, multiple concerns, or is otherwise risky
  to land directly) gets its own branch first. Never make broad changes directly on `main`
  (or whatever the default branch is) without asking.
- Small, isolated, low-risk changes (typo fix, one-line config tweak) can go directly on
  the current branch if the user is already there — don't force a branch for everything.
- Branch name: short, kebab-case, describes the change (`fix-auth-token-expiry`,
  `add-git-workflow-skill`). Ask the user if the intent isn't clear enough to name it well.

## Commits

- **Small commits.** One logical change per commit. If a change description needs "and" to
  summarize it, split it.
- **Independent commits.** Each commit should stand on its own — buildable/coherent in
  isolation where possible. Don't bundle unrelated fixes into one commit because they
  happened in the same session.
- Stage deliberately (`git add <specific files>`), never blanket `git add -A`/`git add .`
  without checking `git status` first — avoids sweeping in unrelated or sensitive files.

## Commit message format

Conventional Commits, plus a body that always states **what** changed and **why** —
never subject-only, even when the change looks self-explanatory.

```
<type>(<scope>): <imperative summary, ≤50 chars>

Implemented <what> in <file/class/function>, for <why — the reason
this change was needed: bug, requirement, constraint>.
```

- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`.
- `<scope>` optional — use it when it clarifies (module/component name).
- Imperative mood in the subject: "add", "fix", "remove" — not "added"/"adds".
- Body wraps ~72 chars, references the actual class/function/file touched, and names the
  reason (bug report, user request, requirement, prior incident) — not just a restatement
  of the diff.

Example:

```
fix(auth): reject expired tokens before session lookup

Implemented an expiry check in TokenValidator.validate(), for tokens
that passed the signature check but were past their TTL — these were
silently treated as valid, letting expired sessions through.
```

Never include AI attribution or "as requested by..." in the message body itself (that
belongs in the `Co-Authored-By` trailer per the standard workflow, not the narrative body).

## Advanced git — companion mode

User is comfortable with the basics (branch, merge, commit, log, discard changes) but not
advanced git. When a task needs something beyond that (rebase, cherry-pick, reflog
recovery, bisect, force-push, history rewriting, submodules, etc.):

- Explain in plain terms what the command does and why it's the right tool, before running it.
- Call out anything hard to reverse (rebase on shared history, force-push, `reset --hard`,
  amending pushed commits) and confirm before proceeding — don't assume familiarity covers this.
- Prefer the safer/reversible option when one exists (e.g. `git revert` over rewriting
  history on a shared branch) and say why you picked it over the riskier alternative.
