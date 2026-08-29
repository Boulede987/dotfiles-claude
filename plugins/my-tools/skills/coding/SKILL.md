---
name: coding
description: >
  Apply the user's coding standards when writing, reviewing, or refactoring code in any
  language. Trigger when writing new code, refactoring existing code, reviewing code for
  quality, or when the user mentions structure, naming, organization, "clean up",
  "readable", "maintainable", "too long", "hard to follow", or "code review". Also trigger
  when the user pastes code and asks for improvements, even without explicitly naming
  clean code. Examples use Python but rules apply universally — adapt naming conventions
  and idioms to the language at hand.
---

# Coding Standards — Index

This skill is a router. Coding standards live in focused skills below — invoke the
one(s) matching the task at hand instead of treating this file as the whole standard.

| Skill | Covers | Invoke when |
|---|---|---|
| `naming-conventions` | Magic numbers, abbreviations, constants vs. display strings, comments | Choosing names, extracting a literal, writing/reviewing a comment |
| `function-design` | Function size, extraction, nesting, loop exit conditions | A function is long, does multiple things, or has nested control flow |
| `architecture` | File/module boundaries, large-file smell, DRY/registry pattern, dependency inversion | Organizing files, deduplicating logic, business logic coupled to a storage format |
| `error-handling` | Explicit failure handling, no silent `None`/swallowed exceptions | Writing or reviewing try/except, deciding a failure return value |
| `testing` | TDD cycle, test structure/naming, mocking at boundaries, failure-path coverage | Writing tests, fixing a bug, reviewing test coverage |
| `python-conventions` | `__main__` guard, Windows console encoding | Writing or reviewing Python specifically |

## How to Apply This Skill

When **writing new code**: apply the relevant sub-skills from the start. Don't plan to
clean up later — clean up never comes.

When **reviewing or refactoring existing code**: identify the worst violations first
(usually: long functions, magic numbers, deep nesting, oversized files). Refactor
incrementally — a series of small safe changes beats one large risky rewrite.

When **explaining your choices**: briefly call out non-obvious decisions at the end of
your response. Focus on tradeoffs — not every rule applies in every situation, and the
user benefits from understanding *why* you made a particular call, especially when you
deviated from the default. Example: *"I extracted `validate_order` even though it's
only called once, because the validation logic was making `process_order` hard to read
at a glance."* Don't over-explain obvious choices — that creates noise.
