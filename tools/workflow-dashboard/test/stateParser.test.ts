import { test } from "node:test";
import assert from "node:assert/strict";
import { parseState } from "../src/stateParser.ts";
import type { StateEntry } from "../src/model.ts";

const TWO_ENTRIES = `## 2026-11-21 10:30 — Increment 2: parser — Phase: Commit

**Status:** validated

**Pending documents:** none

**Phase & Gate:** Commit made (9f3e2aa). Gate met.

**What changed:**
- 426cb19 feat(parser): parse headings

**Next steps:**
1. Report phase.
2. Close increment.

## 2026-11-20 — Increment 1: spec — Phase: Spec

**Status:** awaiting-validation

**Pending documents:** docs/diagrams/a.svg, NEEDS.md

**Phase & Gate:** Gate NOT met —
awaiting validation.

**Next steps:**
- Validate diagram.
`;

const EXPECTED_TWO_ENTRIES: StateEntry[] = [
  {
    timestamp: "2026-11-21 10:30",
    increment: "Increment 2: parser",
    phase: "Commit",
    status: "validated",
    pendingDocuments: [],
    gate: "Commit made (9f3e2aa). Gate met.",
    nextSteps: ["Report phase.", "Close increment."],
    commits: ["9f3e2aa", "426cb19"],
  },
  {
    timestamp: "2026-11-20",
    increment: "Increment 1: spec",
    phase: "Spec",
    status: "awaiting-validation",
    pendingDocuments: ["docs/diagrams/a.svg", "NEEDS.md"],
    gate: "Gate NOT met —\nawaiting validation.",
    nextSteps: ["Validate diagram."],
    commits: [],
  },
];

function parseSingleEntry(text: string): StateEntry {
  const result = parseState(text);
  assert.equal(result.ok, true, result.ok ? "" : result.error);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.value.length, 1);
  return result.value[0];
}

test("parses entries newest first with all fields", () => {
  // Act
  const result = parseState(TWO_ENTRIES);

  // Assert
  assert.deepEqual(result, { ok: true, value: EXPECTED_TWO_ENTRIES });
});

test("CRLF line endings parse the same as LF", () => {
  // Arrange
  const crlfText = TWO_ENTRIES.replaceAll("\n", "\r\n");

  // Act
  const result = parseState(crlfText);

  // Assert
  assert.deepEqual(result, { ok: true, value: EXPECTED_TWO_ENTRIES });
});

test("entry without status field gets status unknown", () => {
  // Arrange
  const text = "## 2026-11-05 — Increment 5: x — Phase: Report\n\n**Phase & Gate:** awaiting user validation.\n";

  // Act
  const entry = parseSingleEntry(text);

  // Assert
  assert.equal(entry.status, "unknown");
});

test("unrecognized status value gets status unknown", () => {
  // Arrange
  const text = "## 2026-11-05 — Inc — Phase: Spec\n\n**Status:** probably fine\n";

  // Act
  const entry = parseSingleEntry(text);

  // Assert
  assert.equal(entry.status, "unknown");
});

test("override marker in heading keeps the phase name and implies overridden status", () => {
  // Arrange
  const text = "## 2026-11-05 — Inc — Phase: Commit — OVERRIDDEN BY USER\n\n**Phase & Gate:** skipped review.\n";

  // Act
  const entry = parseSingleEntry(text);

  // Assert
  assert.equal(entry.phase, "Commit");
  assert.equal(entry.status, "overridden");
});

test("commit hashes are read only from Commit-phase entries", () => {
  // Arrange
  const text = "## 2026-11-05 — Inc — Phase: Build\n\n**Phase & Gate:** starts from commit efa8d4e.\n";

  // Act
  const entry = parseSingleEntry(text);

  // Assert
  assert.deepEqual(entry.commits, []);
});

test("commit hashes are 7 to 40 hex chars containing a digit", () => {
  // Arrange
  const hash40 = "0123456789abcdef0123456789abcdef01234567";
  const text = `## 2026-11-05 — Inc — Phase: Commit

**What changed:**
- defaced facade module (letters only), abc123 (6 chars), ${hash40}0 (41 chars)
- abc1234 and ${hash40}
`;

  // Act
  const entry = parseSingleEntry(text);

  // Assert
  assert.deepEqual(entry.commits, ["abc1234", hash40]);
});

test("blank file has no entries", () => {
  // Act
  const result = parseState("  \n");

  // Assert
  assert.deepEqual(result, { ok: true, value: [] });
});

test("malformed heading is an error naming its line", () => {
  // Arrange
  const text = "## 2026-11-05 — Inc — Phase: Spec\n\n**Status:** validated\n\n## just a heading\n";

  // Act
  const result = parseState(text);

  // Assert
  assert.deepEqual(result, { ok: false, error: 'line 5: heading is not "## <date> — <increment> — Phase: <phase>"' });
});

test("text before the first heading is an error", () => {
  // Arrange
  const text = "some notes\n## 2026-11-05 — Inc — Phase: Spec\n";

  // Act
  const result = parseState(text);

  // Assert
  assert.deepEqual(result, { ok: false, error: "line 1: text before the first entry heading" });
});
