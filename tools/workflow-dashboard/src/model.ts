export const ENTRY_STATUSES = ["awaiting-validation", "validated", "overridden"] as const;

/** A STATE.md entry's `**Status:**` value; "unknown" when the field is missing or unrecognized. */
export type EntryStatus = (typeof ENTRY_STATUSES)[number] | "unknown";

export type StateEntry = {
  timestamp: string;
  increment: string;
  phase: string;
  status: EntryStatus;
  pendingDocuments: string[];
  gate: string;
  nextSteps: string[];
  commits: string[];
};

/** A NEEDS.md section 2 row. `status` is free text ("not started", "in progress", "met", ...). */
export type Requirement = {
  requirement: string;
  indicator: string;
  status: string;
};

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

export type NeedsResult =
  | { kind: "absent" }
  | { kind: "parsed"; requirements: Requirement[] }
  | { kind: "error"; error: string };

export type Feature = {
  slug: string;
  state: ParseResult<StateEntry[]>;
  needs: NeedsResult;
};

export type UnshowableReason = "too large" | "not found" | "unreadable" | "outside the project";

/** How a pending document can be shown in the page. */
export type DocumentView =
  | { kind: "image" }
  | { kind: "text"; text: string }
  | { kind: "link" }
  | { kind: "unshowable"; reason: UnshowableReason };

/** A pending document: its path as written in STATE.md, and how it is shown. */
export type ShownDocument = { path: string; view: DocumentView };

/** A feature awaiting validation, with its newest entry and that entry's documents read. */
export type ValidationItem = { feature: Feature; entry: StateEntry; documents: ShownDocument[] };

export type Dashboard = {
  projectRoot: string;
  features: Feature[];
  /** Set when the workflow folder itself could not be listed; `features` is then empty. */
  listingError: string | undefined;
  toValidate: ValidationItem[];
};

const MET_STATUS = "met";
const CLOSING_PHASE = "report";
const AWAITING_VALIDATION: EntryStatus = "awaiting-validation";

/** The top STATE.md entry, which supersedes all older ones; undefined when there is none. */
export function newestEntry(feature: Feature): StateEntry | undefined {
  return feature.state.ok ? feature.state.value[0] : undefined;
}

/** The newest STATE.md entry decides: older entries awaiting validation were superseded. */
export function isAwaitingValidation(feature: Feature): boolean {
  return newestEntry(feature)?.status === AWAITING_VALIDATION;
}

/** Features whose newest STATE.md entry awaits the user's validation. */
export function pendingValidations(features: Feature[]): Feature[] {
  return features.filter(isAwaitingValidation);
}

/** Closed: the newest entry is a validated Report, so the increment is done and the workflow paused. */
export function isClosed(feature: Feature): boolean {
  const newest = newestEntry(feature);
  return newest?.status === "validated" && newest.phase.trim().toLowerCase() === CLOSING_PHASE;
}

export function ongoingFeatures(dashboard: Dashboard): Feature[] {
  return dashboard.features.filter((feature) => !isClosed(feature));
}

export function closedFeatures(dashboard: Dashboard): Feature[] {
  return dashboard.features.filter(isClosed);
}

export function documentCount(items: ValidationItem[]): number {
  return items.reduce((total, item) => total + item.documents.length, 0);
}

export function countMet(requirements: Requirement[]): number {
  return requirements.filter((requirement) => requirement.status.trim().toLowerCase() === MET_STATUS).length;
}
