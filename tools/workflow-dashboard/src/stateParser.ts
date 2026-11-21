import { ENTRY_STATUSES, type EntryStatus, type ParseResult, type StateEntry } from "./model.ts";

const HEADING = /^## (.+?) — (.+) — Phase: (.+?)( — OVERRIDDEN BY USER)?\s*$/;
const HEADING_FORMAT = '"## <date> — <increment> — Phase: <phase>"';
const FIELD = /^\*\*([^*]+):\*\*\s?(.*)$/;
const LIST_ITEM = /^\s*(?:\d+\.|[-*])\s+(.*)$/;
// Hex runs of 7-40 chars; the digit lookahead excludes plain words like "defaced".
const COMMIT_HASH = /\b(?=[0-9a-f]*\d)[0-9a-f]{7,40}\b/g;
const COMMIT_PHASE = "Commit";

type Heading = { timestamp: string; increment: string; phase: string; overridden: boolean };
type RawEntry = { heading: Heading; bodyLines: string[] };

export function parseState(text: string): ParseResult<StateEntry[]> {
  const split = splitEntries(text.split(/\r?\n/));
  if (!split.ok) return split;
  return { ok: true, value: split.value.map(toStateEntry) };
}

function splitEntries(lines: string[]): ParseResult<RawEntry[]> {
  const entries: RawEntry[] = [];
  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    if (line.startsWith("## ")) {
      const heading = parseHeading(line, lineNumber);
      if (!heading.ok) return heading;
      entries.push({ heading: heading.value, bodyLines: [] });
    } else if (entries.length > 0) {
      entries[entries.length - 1].bodyLines.push(line);
    } else if (line.trim() !== "") {
      return { ok: false, error: `line ${lineNumber}: text before the first entry heading` };
    }
  }
  return { ok: true, value: entries };
}

function parseHeading(line: string, lineNumber: number): ParseResult<Heading> {
  const match = line.match(HEADING);
  if (!match) return { ok: false, error: `line ${lineNumber}: heading is not ${HEADING_FORMAT}` };
  const [, timestamp, increment, phase, overrideMarker] = match;
  return { ok: true, value: { timestamp, increment, phase, overridden: overrideMarker !== undefined } };
}

function toStateEntry({ heading, bodyLines }: RawEntry): StateEntry {
  const fields = collectFields(bodyLines);
  return {
    timestamp: heading.timestamp,
    increment: heading.increment,
    phase: heading.phase,
    status: toStatus(fields.get("Status"), heading.overridden),
    pendingDocuments: toPendingDocuments(fields.get("Pending documents")),
    gate: fields.get("Phase & Gate") ?? "",
    nextSteps: toListItems(fields.get("Next steps")),
    commits: heading.phase === COMMIT_PHASE ? findCommitHashes(bodyLines.join("\n")) : [],
  };
}

/** Maps each `**Label:**` to its text: the rest of its line plus following lines up to the next label. */
function collectFields(bodyLines: string[]): Map<string, string> {
  const fields = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of bodyLines) {
    const field = line.match(FIELD);
    if (field) {
      current = [field[2]];
      fields.set(field[1].trim(), current);
    } else {
      current?.push(line);
    }
  }
  return new Map([...fields].map(([label, lines]) => [label, lines.join("\n").trim()]));
}

/** An entry predating the Status field still counts as overridden when its heading says so. */
function toStatus(value: string | undefined, overriddenHeading: boolean): EntryStatus {
  const known = ENTRY_STATUSES.find((status) => status === value);
  if (known !== undefined) return known;
  return overriddenHeading ? "overridden" : "unknown";
}

function toPendingDocuments(value: string | undefined): string[] {
  if (value === undefined || value === "none") return [];
  return value.split(",").map((path) => path.trim()).filter((path) => path !== "");
}

function toListItems(value: string | undefined): string[] {
  return (value ?? "")
    .split("\n")
    .map((line) => line.match(LIST_ITEM)?.[1].trim())
    .filter((item): item is string => item !== undefined);
}

function findCommitHashes(text: string): string[] {
  return [...new Set([...text.matchAll(COMMIT_HASH)].map((match) => match[0]))];
}
