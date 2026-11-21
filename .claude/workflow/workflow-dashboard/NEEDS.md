# Workflow Dashboard

## 1. What & Why

A standalone, read-only, per-project dashboard for the `feature-workflow` skill. It
reads `.claude/workflow/**/STATE.md` and `NEEDS.md` and shows, live, where each
feature stands, its timeline of phases, and which documents are waiting for the
user's validation.

Why: coming back to a session (new or resumed) after a break, the user has forgotten
what was in progress, and documents awaiting validation are buried in scrollback. The
dashboard must never feed anything into Claude's context: Claude only writes the
workflow files, unaware the dashboard exists. Use cases:
`workflow-dashboard-use-cases.svg` (source `use-cases.puml`), this folder.

Scope: `feature-workflow` state only; other Claude Code tasks are out of scope.

## 2. Expected Outputs

| Requirement | Indicator | Status |
|---|---|---|
| `feature-workflow` STATE.md entries carry machine-readable status | Entry format in the skill has `**Status:** awaiting-validation \| validated \| overridden` and `**Pending documents:** <comma-separated project-relative paths> \| none` | met |
| Standalone tool, no coupling to Claude Code | Lives in `tools/workflow-dashboard/`, Node with zero dependencies; no hook, no plugin entry, nothing printed into Claude's context | met |
| One-command launch per project | After one `npm link`, `workflow-dashboard [path]` (default: current folder) starts the server, prints the URL, opens the browser; default port 4317, `--port` override, next free port if busy; runs until Ctrl+C | met |
| See where each feature stands | Per feature (flat list sorted by slug path, nested slugs included): slug, current phase, and the first item of the newest entry's Next steps | met |
| Pending validations panel | Top panel lists every feature whose **newest** entry has status `awaiting-validation`, with each pending document as a link and an inline preview for `.svg`/`.png` | met |
| Feature timeline | Increment, then phase entries, newest first; each shows status, gate, override marker, commit hash(es) if any; entries without the new fields show status "unknown" (no free-text guessing) | met |
| Requirements progress | NEEDS.md section 2 table shown per feature in a collapsed section | met |
| Live refresh | Change to any file under `.claude/workflow/**` reaches the open page within ~2 s via server push; scroll position and collapsed sections are kept | met |
| Errors visible, never fatal | A malformed STATE.md/NEEDS.md shows a parse error in the page for that feature; the rest of the dashboard still renders; the server keeps running | met |
| Read-only | The tool never writes any file | met |
| Local and confined | Listens on `127.0.0.1` only; serves only files inside the project folder; any path escaping it (`..`, absolute) is refused | met |
