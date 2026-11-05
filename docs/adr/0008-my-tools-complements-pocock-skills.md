# `my-tools` complements Pocock's skills: no overlap

Matt Pocock's skills are used from the upstream `mattpocock-skills` plugin and never
copied into `plugins/my-tools/`. The two sets complement each other: where a `my-tools`
skill covered the same ground as one of his, the `my-tools` part was removed rather than
kept under a "his wins" rule, so no skill restates or contradicts another. `my-tools`
skills point to his for what they don't cover (e.g. `architecture` → `codebase-design`
for dependency direction and when a seam is warranted; `testing` → `tdd` for the test
loop). Pocock's `code-review` smell checklist stays as is: it runs at review time and
defers to the repo's documented standards, so it backs up `my-tools` rules instead of
contradicting them.

## Considered Options

- Keep overlapping rules with a precedence clause ("his wins") — rejected: duplicated
  rules drift, and a precedence clause still leaves the agent reading two versions.
