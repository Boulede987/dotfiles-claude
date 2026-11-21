# workflow-dashboard

Read-only, live dashboard for one project's `feature-workflow` state
(`.claude/workflow/**/STATE.md` and `NEEDS.md`). It shows, per feature, the current
phase, the next step, the timeline of phase entries, and the requirements table, plus
a top panel of documents awaiting validation. Why it is standalone:
[ADR 0011](../../docs/adr/0011-workflow-dashboard-standalone-tool.md).

## Install (once per machine)

Requires Node ≥ 23.6 (runs TypeScript natively, no build, no dependencies).

```bash
cd tools/workflow-dashboard
npm link
```

## Use

```bash
workflow-dashboard              # dashboard for the current folder
workflow-dashboard ../my-game   # or for another project
workflow-dashboard --port 5000  # default 4317; the next free port is used if busy
```

The page opens in the browser and updates within about a second of any change
under `.claude/workflow/`. Stop with Ctrl+C. One process per project.

The server listens on `127.0.0.1` only and serves only files inside the project
folder. It never writes any file.

## Test

```bash
npm test
```
