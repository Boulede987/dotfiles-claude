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

export type Dashboard = {
  projectRoot: string;
  features: Feature[];
  /** Set when the workflow folder itself could not be listed; `features` is then empty. */
  listingError: string | undefined;
};

const MET_STATUS = "met";

/** The top STATE.md entry, which supersedes all older ones; undefined when there is none. */
export function newestEntry(feature: Feature): StateEntry | undefined {
  return feature.state.ok ? feature.state.value[0] : undefined;
}

/** Features whose newest STATE.md entry awaits the user's validation. */
export function pendingValidations(dashboard: Dashboard): Feature[] {
  return dashboard.features.filter((feature) => newestEntry(feature)?.status === "awaiting-validation");
}

export function countMet(requirements: Requirement[]): number {
  return requirements.filter((requirement) => requirement.status.trim().toLowerCase() === MET_STATUS).length;
}
