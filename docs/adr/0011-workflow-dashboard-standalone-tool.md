# Workflow dashboard is a standalone tool, not a hook

`tools/workflow-dashboard/` is a read-only Node server the user starts per project. It
watches `.claude/workflow/**` and serves a live page showing each feature's timeline
and the documents awaiting validation. It has no hook and no plugin entry, and nothing
it does reaches Claude's context: Claude only writes `STATE.md` / `NEEDS.md` in the
format `feature-workflow` §4 defines, including the machine-read `Status` and
`Pending documents` fields.

The dashboard serves the user, who returns to a session (new or resumed) having
forgotten what was in progress. Output injected into Claude's context is noise to
Claude and is not shown to the user anyway.

It is written in TypeScript run natively by Node (type stripping, Node ≥ 23.6) with
zero dependencies: no build step, no `node_modules`. Types are not checked by a
compiler in this setup; they document the shapes.

## Considered Options

- `SessionStart` hook printing the current phase — rejected: its output goes into
  Claude's context, not to the user, and it covers only session start.
- `PostToolUse` hook regenerating a static HTML file with meta refresh — rejected:
  couples the tool to Claude Code sessions, and meta refresh loses scroll position.
- Python generator — rejected once the tool became a long-running server: Node ships
  an HTTP server, recursive `fs.watch` and Server-Sent Events support built in.
