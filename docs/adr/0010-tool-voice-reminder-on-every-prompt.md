# Tool voice is also reminded on every prompt

Extends [ADR 0009](0009-tool-voice-via-sessionstart-hook.md). A `UserPromptSubmit` hook
in `my-tools` injects `plugins/my-tools/hooks/tool-voice-reminder.md`, a self-sufficient
one-line version of the tool-voice rule, on every user message. The `SessionStart` hook
keeps injecting the full rule once per session.

Two gaps motivated it: a `SessionStart` hook never fires in a session that was already
running when the plugin was reloaded, and a rule injected once can fade late in a long
session.

## Considered Options

- Inject the full `tool-voice.md` on every prompt — rejected: about 250 tokens per
  message against about 60 for the one-line reminder, for the same behavior.
