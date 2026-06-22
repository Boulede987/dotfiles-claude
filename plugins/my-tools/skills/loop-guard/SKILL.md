---
name: loop-guard
description: >
  Always-active behavior. Monitor for retry loops within a session and warn the user
  before wasting more turns. Auto-triggers silently every response — no user invocation
  needed. Fires a visible warning when loop conditions are detected.
---

# Loop Guard

Silently track solution attempts each session. Warn the user when loop conditions appear.

## Trigger Conditions (any one is enough)

- Same core approach or hypothesis tried 2+ times with no meaningful change
- Same error or failure mode appears again after a "fix" attempt
- About to try a minor variation of a failed path (different flag, different param, same logic)
- Stuck rephrasing the same command hoping for different output

## Warning Format

When a trigger condition fires, output this block **before** the next attempt:

```
⚠️ Loop risk detected.
Approach "[brief label]" tried [N] times — same failure pattern.
Options:
  1. Start a fresh session (clean context, no anchoring)
  2. I pivot to a completely different approach — state which one explicitly
Which do you prefer?
```

Do not attempt anything further until the user responds.

## What NOT to flag

- Two attempts that genuinely differ in approach (different algorithm, different tool, different API)
- Retrying after the user explicitly provided new information
- Normal multi-step progress where each step builds on a working previous one

## Tracking (in-session only)

Maintain a mental tally of: what was tried, what failed, why. Do not persist across sessions — this is pure in-context awareness.
