# Keep `session-handoff`; Pocock's `handoff` is left unused

Two handoff skills would repeat each other. `session-handoff` stays because
`feature-workflow`'s Report phase reuses its section format. Pocock's `handoff` can't be
uninstalled on its own (the plugin installs all its skills together), but it only runs
when typed as `/handoff`, so it never competes for a trigger. `session-handoff` borrowed
its "suggested skills" section.
