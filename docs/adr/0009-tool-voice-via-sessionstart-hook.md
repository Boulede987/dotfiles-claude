# Tool voice is injected by a SessionStart hook

Claude must talk as a tool, not a teammate: no "we", no emotional or social language
(see `plugins/my-tools/hooks/tool-voice.md`). The user does not want to start thinking
of Claude as part of the team. The rule is injected into every session by a
`SessionStart` hook in the `my-tools` plugin, so it applies on every machine the plugin
syncs to and survives `/clear`, resume and compaction (the hook has no matcher).

## Considered Options

- A skill — rejected: skills load on description match, and a voice rule must be active
  on every turn, not only when something triggers it.
- A user-level `~/.claude/CLAUDE.md` — rejected: not synced by this repo.
- An output style — rejected: it has to be selected per machine, and it replaces parts
  of the default system prompt instead of adding to them.
