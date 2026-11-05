---
status: superseded by ADR-0008
---

# Use Matt Pocock's skills from upstream; his win on overlap

Matt Pocock's skills (https://github.com/mattpocock/skills) are installed as the
`mattpocock-skills` plugin and used directly from upstream: no Pocock skill file is
copied into `plugins/my-tools/`, so they stay up to date and nothing drifts. Because his
files are never edited, every integration rule lives on the `my-tools` side. Where a
`my-tools` skill and a Pocock skill cover the same ground, Pocock's wins and the
`my-tools` skill keeps only what his doesn't cover.

## Considered Options

- Vendoring (copying) his skills into this repo to modify them — rejected: copies drift
  from upstream and every update becomes a manual merge.
