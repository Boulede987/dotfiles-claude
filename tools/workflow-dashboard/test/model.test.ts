import { test } from "node:test";
import assert from "node:assert/strict";
import { pendingValidations } from "../src/model.ts";
import type { Feature, EntryStatus, StateEntry } from "../src/model.ts";

function entry(status: EntryStatus): StateEntry {
  return {
    timestamp: "2026-11-21", increment: "Inc", phase: "Spec", status,
    pendingDocuments: [], gate: "", nextSteps: [], commits: [],
  };
}

function feature(slug: string, statusesNewestFirst: EntryStatus[]): Feature {
  return { slug, state: { ok: true, value: statusesNewestFirst.map(entry) }, needs: { kind: "absent" } };
}

test("only features whose newest entry awaits validation are pending", () => {
  // Arrange
  const features: Feature[] = [
    feature("newest-awaits", ["awaiting-validation", "validated"]),
    feature("older-awaits", ["validated", "awaiting-validation"]),
    feature("overridden-newest", ["overridden", "awaiting-validation"]),
    feature("no-entries", []),
    feature("unknown", ["unknown"]),
    { slug: "broken", state: { ok: false, error: "x" }, needs: { kind: "absent" } },
  ];

  // Act
  const pending = pendingValidations({ projectRoot: "/p", features, listingError: undefined });

  // Assert
  assert.deepEqual(pending.map((pendingFeature) => pendingFeature.slug), ["newest-awaits"]);
});
