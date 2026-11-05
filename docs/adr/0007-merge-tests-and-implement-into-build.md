# `feature-workflow` merges Tests and Implement into one Build phase

`mattpocock-skills:tdd` forbids horizontal slicing (all tests first, then all code) and
wins on overlap, so `feature-workflow`'s separate Tests and Implement phases become one
Build phase running `tdd`'s loop: seams agreed with the user, then one failing test and
the minimal code to pass it, seam by seam, until every agreed seam has a passing test.
Refactoring moves to Review, as `tdd` defines it. Phase order is now Spec → Build →
Review → Commit → Report.

## Considered Options

- Keep Tests and Implement as separate phases with exactly one seam per increment —
  rejected: it only respects `tdd` if every increment stays at a single seam, which the
  workflow can't guarantee.
