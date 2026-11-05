# Matt Pocock Skills Integration

## 1. What & Why

Matt Pocock's skills repo (https://github.com/mattpocock/skills) has ideas and skills
that fit this repo's own design (grilling, TDD, code review, domain modeling,
diagnosing bugs, handoff, and more). The goal is to use them directly — taken from
upstream, not copied and maintained by hand — alongside the `my-tools` skills,
without the two sets contradicting each other or competing for the same trigger.

Starting point (2026-11-05): the `mattpocock` marketplace is already registered and
the `mattpocock-skills` plugin is enabled on this machine, so the skills already load
in sessions. What's missing is how they fit together with `my-tools`.

## 2. Expected Outputs

| Requirement | Indicator | Status |
|---|---|---|
| Pocock's skills are available on every machine, from upstream, and stay up to date without copying files into this repo | README Setup installs `mattpocock-skills`; no Pocock skill file is vendored into `plugins/my-tools/` | met |
| Every overlap between a Pocock skill and a `my-tools` skill has a decided rule (use mine, use theirs, or combine) | One ADR in `docs/adr/` per overlapping pair (e.g. `testing`/`tdd`, `decision-log`/`domain-modeling`, `per-file-review`/`code-review`, `session-handoff`/`handoff`) | met |
| `feature-workflow` invokes the relevant Pocock skills at the right phases | Phase table in `feature-workflow/SKILL.md` names each Pocock skill used and when | met |
| The README documents which Pocock skills are used and why | README has an entry per adopted Pocock skill, using the Problem/Solution pattern | met |
| Each increment is self-contained in git: its accepted Report and its state land in its own last commit | After any Report is approved, `git status` shows no changes under `.claude/workflow/<slug>/` | met |
