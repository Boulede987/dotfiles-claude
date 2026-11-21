import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNeeds } from "../src/needsParser.ts";

const NEEDS = `# Feature

## 1. What & Why
Some | text with pipes.

## 2. Expected Outputs

| Requirement | Indicator | Status |
|---|---|---|
| Status field | \`a \\| b\` values | in progress |
| Launch | one command | met |

## 3. Parent
| not | part | of §2 |
`;

const EXPECTED_ROWS = [
  { requirement: "Status field", indicator: "`a | b` values", status: "in progress" },
  { requirement: "Launch", indicator: "one command", status: "met" },
];

test("reads the section 2 table rows, unescaping pipes", () => {
  // Act
  const result = parseNeeds(NEEDS);

  // Assert
  assert.deepEqual(result, { ok: true, value: EXPECTED_ROWS });
});

test("CRLF line endings parse the same as LF", () => {
  // Arrange
  const crlfText = NEEDS.replaceAll("\n", "\r\n");

  // Act
  const result = parseNeeds(crlfText);

  // Assert
  assert.deepEqual(result, { ok: true, value: EXPECTED_ROWS });
});

test("missing section 2 is an error", () => {
  // Arrange
  const text = "# Feature\n\n## 1. What & Why\ntext\n";

  // Act
  const result = parseNeeds(text);

  // Assert
  assert.deepEqual(result, { ok: false, error: 'no "## 2. Expected Outputs" section' });
});

test("section 2 without a table is an error", () => {
  // Arrange
  const text = "## 2. Expected Outputs\n\nprose only\n";

  // Act
  const result = parseNeeds(text);

  // Assert
  assert.deepEqual(result, { ok: false, error: "section 2 has no requirements table" });
});

test("a header-only table is an error", () => {
  // Arrange
  const text = "## 2. Expected Outputs\n| R | I | S |\n|---|---|---|\n";

  // Act
  const result = parseNeeds(text);

  // Assert
  assert.deepEqual(result, { ok: false, error: "section 2 has no requirements table" });
});

test("row with the wrong number of cells is an error naming its line", () => {
  // Arrange
  const text = "## 2. Expected Outputs\n| R | I | S |\n|---|---|---|\n| only two | cells |\n";

  // Act
  const result = parseNeeds(text);

  // Assert
  assert.deepEqual(result, { ok: false, error: "line 4: expected 3 cells, found 2" });
});

test("a row of empty cells is validated, not mistaken for a separator", () => {
  // Arrange
  const text = "## 2. Expected Outputs\n| R | I | S |\n|---|---|---|\n|  |  |\n";

  // Act
  const result = parseNeeds(text);

  // Assert
  assert.deepEqual(result, { ok: false, error: "line 4: expected 3 cells, found 2" });
});
