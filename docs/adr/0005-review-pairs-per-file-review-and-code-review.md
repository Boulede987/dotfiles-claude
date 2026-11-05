---
status: accepted
---

# Review phase pairs `per-file-review` with Pocock's `code-review`

The two complement each other: `per-file-review` checks file-local standards one file
per subagent, while `mattpocock-skills:code-review` adds a Spec axis (does the diff match
what was asked?) plus a code-smell baseline. `feature-workflow`'s Review phase runs
both, using the feature's `NEEDS.md` as the spec. Pocock's `code-review` requires a one-time
`/setup-matt-pocock-skills` in the target project.
