---
name: session-handoff
description: Generates a structured end-of-session summary covering what changed, what's pending, and key decisions made. Use when the user is done working and wants to close the session cleanly, or says things like "wrap up", "let's stop here", "summarize what we did".
---

## Dynamic context
!`git log --oneline -10`
!`git diff HEAD`
!`git status`

## Instructions
Generate a session handoff document with the following sections:

### What changed
List files modified, created, or deleted this session. For code changes, one sentence on *why*, not just *what* — the diff is already visible, the reasoning isn't.

### Decisions made
List any architectural, design, or tooling decisions made this session, with the rationale. These are the things most likely to be forgotten and most costly to re-derive next session.

### State of known issues
Any bugs, blockers, or instabilities discovered this session. Note whether they were resolved or are still open.

### Next steps
Concrete, ordered — not a wishlist. The first item should be the thing to do literally at the start of the next session.

### CLAUDE.md update suggestions
If anything learned this session should be permanently added to the project's CLAUDE.md (new conventions, discovered constraints, important paths, gotchas), list them here as ready-to-paste lines. Don't add them automatically — surface them for the user to approve.

## Format
Plain markdown. No fluff, no "great session!" closer. The audience is you, tomorrow morning, cold-starting the project.