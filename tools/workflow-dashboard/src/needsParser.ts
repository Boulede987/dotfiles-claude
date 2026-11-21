import type { ParseResult, Requirement } from "./model.ts";

const SECTION_TWO = /^## 2\.\s/;
const ANY_SECTION = /^## /;
const TABLE_ROW = /^\s*\|/;
// Only cells of dashes (optionally colon-aligned) make a separator row.
const SEPARATOR_ROW = /^\s*\|(\s*:?-+:?\s*\|)+\s*$/;
const UNESCAPED_PIPE = /(?<!\\)\|/;
const CELLS_PER_ROW = 3;
const HEADER_ROWS = 1;

type NumberedLine = { lineNumber: number; text: string };

export function parseNeeds(text: string): ParseResult<Requirement[]> {
  const lines = text.split(/\r?\n/).map((line, index) => ({ lineNumber: index + 1, text: line }));
  const start = lines.findIndex((line) => SECTION_TWO.test(line.text));
  if (start === -1) return { ok: false, error: 'no "## 2. Expected Outputs" section' };

  const rows = dataRows(takeUntilNextSection(lines.slice(start + 1)));
  if (rows.length === 0) return { ok: false, error: "section 2 has no requirements table" };

  const requirements: Requirement[] = [];
  for (const row of rows) {
    const requirement = toRequirement(row);
    if (!requirement.ok) return requirement;
    requirements.push(requirement.value);
  }
  return { ok: true, value: requirements };
}

function takeUntilNextSection(lines: NumberedLine[]): NumberedLine[] {
  const end = lines.findIndex((line) => ANY_SECTION.test(line.text));
  return end === -1 ? lines : lines.slice(0, end);
}

function dataRows(section: NumberedLine[]): NumberedLine[] {
  return section
    .filter((line) => TABLE_ROW.test(line.text) && !SEPARATOR_ROW.test(line.text))
    .slice(HEADER_ROWS);
}

function toRequirement(row: NumberedLine): ParseResult<Requirement> {
  const cells = splitCells(row.text);
  if (cells.length !== CELLS_PER_ROW) {
    return { ok: false, error: `line ${row.lineNumber}: expected ${CELLS_PER_ROW} cells, found ${cells.length}` };
  }
  const [requirement, indicator, status] = cells;
  return { ok: true, value: { requirement, indicator, status } };
}

function splitCells(row: string): string[] {
  const inner = row.trim().replace(/^\|/, "").replace(/(?<!\\)\|$/, "");
  return inner.split(UNESCAPED_PIPE).map((cell) => cell.trim().replaceAll("\\|", "|"));
}
