import { test } from "node:test";
import assert from "node:assert/strict";
import {
  closedFeatures, documentCount, isAwaitingValidation, isClosed, ongoingFeatures, pendingValidations,
} from "../src/model.ts";
import type { Dashboard, EntryStatus, Feature, StateEntry, ValidationItem } from "../src/model.ts";

function entry(status: EntryStatus, phase = "Spec"): StateEntry {
  return {
    timestamp: "2026-11-21", increment: "Inc", phase, status,
    pendingDocuments: [], gate: "", nextSteps: [], commits: [],
  };
}

function feature(slug: string, statusesNewestFirst: EntryStatus[]): Feature {
  return { slug, state: { ok: true, value: statusesNewestFirst.map((status) => entry(status)) }, needs: { kind: "absent" } };
}

function featureWithNewest(slug: string, newest: StateEntry): Feature {
  return { slug, state: { ok: true, value: [newest, entry("validated")] }, needs: { kind: "absent" } };
}

function brokenFeature(slug: string): Feature {
  return { slug, state: { ok: false, error: "x" }, needs: { kind: "absent" } };
}

function dashboardOf(features: Feature[]): Dashboard {
  return { projectRoot: "/p", features, listingError: undefined, toValidate: [] };
}

test("only features whose newest entry awaits validation are pending", () => {
  // Arrange
  const features: Feature[] = [
    feature("newest-awaits", ["awaiting-validation", "validated"]),
    feature("older-awaits", ["validated", "awaiting-validation"]),
    feature("overridden-newest", ["overridden", "awaiting-validation"]),
    feature("no-entries", []),
    feature("unknown", ["unknown"]),
    brokenFeature("broken"),
  ];

  // Act
  const pending = pendingValidations(features);

  // Assert
  assert.deepEqual(pending.map((pendingFeature) => pendingFeature.slug), ["newest-awaits"]);
  assert.deepEqual(features.map(isAwaitingValidation), [true, false, false, false, false, false]);
});

test("a feature is closed only when its newest entry is a validated Report", () => {
  // Arrange
  const cases: [Feature, boolean][] = [
    [featureWithNewest("closed", entry("validated", "Report")), true],
    [featureWithNewest("closed-loose-case", entry("validated", " REPORT ")), true],
    [featureWithNewest("awaiting-report", entry("awaiting-validation", "Report")), false],
    [featureWithNewest("overridden-report", entry("overridden", "Report")), false],
    [featureWithNewest("validated-build", entry("validated", "Build")), false],
    [feature("no-entries", []), false],
    [brokenFeature("broken"), false],
  ];

  // Act
  const results = cases.map(([candidate]) => [candidate.slug, isClosed(candidate)]);

  // Assert
  assert.deepEqual(results, cases.map(([candidate, expected]) => [candidate.slug, expected]));
});

test("ongoing and closed features split the list, each keeping the given order", () => {
  // Arrange: deliberately not sorted, to show the split keeps input order
  const dashboard = dashboardOf([
    featureWithNewest("c-closed", entry("validated", "Report")),
    brokenFeature("d-broken"),
    featureWithNewest("a-closed", entry("validated", "Report")),
    feature("b-ongoing", ["awaiting-validation"]),
  ]);

  // Act
  const ongoing = ongoingFeatures(dashboard).map((ongoingFeature) => ongoingFeature.slug);
  const closed = closedFeatures(dashboard).map((closedFeature) => closedFeature.slug);

  // Assert
  assert.deepEqual(ongoing, ["d-broken", "b-ongoing"]);
  assert.deepEqual(closed, ["c-closed", "a-closed"]);
});

test("the document count adds up every item's documents, not the items", () => {
  // Arrange: 3 items holding 4 documents
  const alpha = feature("alpha", ["awaiting-validation"]);
  const items: ValidationItem[] = [
    { feature: alpha, entry: entry("awaiting-validation"), documents: [
      { path: "a.svg", view: { kind: "image" } },
      { path: "b.md", view: { kind: "unshowable", reason: "not found" } },
      { path: "c.md", view: { kind: "text", text: "c" } },
    ] },
    { feature: alpha, entry: entry("awaiting-validation"), documents: [] },
    { feature: alpha, entry: entry("awaiting-validation"), documents: [{ path: "d.bin", view: { kind: "link" } }] },
  ];

  // Act
  const count = documentCount(items);

  // Assert
  assert.equal(count, 4);
});
