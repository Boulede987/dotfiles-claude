import { test } from "node:test";
import assert from "node:assert/strict";
import { renderBody, renderPage } from "../src/renderPage.ts";
import type { Dashboard, Feature, StateEntry } from "../src/model.ts";

const AWAITING: StateEntry = {
  timestamp: "2026-11-21 10:30",
  increment: "Increment 1: spec",
  phase: "Spec",
  status: "awaiting-validation",
  pendingDocuments: ["docs/diagrams/class design.svg", "NEEDS.md"],
  gate: "Gate NOT met <script>alert(1)</script>",
  nextSteps: ["Validate the class diagram.", "Agree seams."],
  commits: [],
};

const VALIDATED: StateEntry = {
  ...AWAITING,
  status: "validated",
  pendingDocuments: [],
  gate: "Gate met.",
  nextSteps: ["Build the parser."],
};

function feature(slug: string, overrides: Partial<Feature> = {}): Feature {
  return { slug, state: { ok: true, value: [VALIDATED] }, needs: { kind: "absent" }, ...overrides };
}

function dashboardOf(...features: Feature[]): Dashboard {
  return { projectRoot: "/p", features, listingError: undefined };
}

/** The HTML of the pending panel only, so assertions cannot be satisfied by the timeline. */
function pendingSection(html: string): string {
  const start = html.indexOf('<section class="pending">');
  const end = html.indexOf("</section>", start);
  return html.slice(start, end);
}

test("text from workflow files is HTML-escaped, quotes included", () => {
  // Arrange
  const dashboard = dashboardOf(
    feature("alpha", { state: { ok: true, value: [{ ...AWAITING, pendingDocuments: [`it's "x".md`] }] } }),
  );

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes("Gate NOT met &lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert(1)"));
  assert.ok(html.includes("it&#39;s &quot;x&quot;.md"));
});

test("pending panel links each document, with an inline preview for images only", () => {
  // Arrange
  const dashboard = dashboardOf(feature("alpha", { state: { ok: true, value: [AWAITING] } }));

  // Act
  const pending = pendingSection(renderBody(dashboard));

  // Assert
  assert.ok(pending.includes('href="/files/docs/diagrams/class%20design.svg"'));
  assert.ok(pending.includes('<img src="/files/docs/diagrams/class%20design.svg"'));
  assert.ok(pending.includes('href="/files/NEEDS.md"'));
  assert.ok(!pending.includes('<img src="/files/NEEDS.md"'));
});

test("a feature whose newest entry is validated is not in the pending panel", () => {
  // Arrange
  const dashboard = dashboardOf(feature("alpha"));

  // Act
  const pending = pendingSection(renderBody(dashboard));

  // Assert
  assert.ok(pending.includes("Nothing awaits validation."));
  assert.ok(!pending.includes("alpha"));
});

test("each feature shows only its first next step", () => {
  // Arrange
  const dashboard = dashboardOf(feature("alpha", { state: { ok: true, value: [AWAITING] } }), feature("beta"));

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes("<strong>Next:</strong> Validate the class diagram."));
  assert.ok(html.includes("<strong>Next:</strong> Build the parser."));
  assert.ok(!html.includes("Agree seams."));
});

test("a feature's STATE.md parse error is shown in the page", () => {
  // Arrange
  const dashboard = dashboardOf(feature("broken", { state: { ok: false, error: "line 3: heading is not valid" } }));

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes("STATE.md: line 3: heading is not valid"));
});

test("requirements show how many rows are met, matching status case-insensitively", () => {
  // Arrange
  const requirements = [
    { requirement: "a", indicator: "i", status: "Met" },
    { requirement: "b", indicator: "i", status: " met " },
    { requirement: "c", indicator: "i", status: "not started" },
  ];
  const dashboard = dashboardOf(feature("alpha", { needs: { kind: "parsed", requirements } }));

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes("Requirements (2/3 met)"));
});

test("a NEEDS.md error is shown in the page", () => {
  // Arrange
  const dashboard = dashboardOf(feature("alpha", { needs: { kind: "error", error: "no table" } }));

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes("NEEDS.md: no table"));
});

test("a listing error replaces the feature list", () => {
  // Arrange
  const dashboard: Dashboard = { projectRoot: "/p", features: [], listingError: "cannot list .claude/workflow: EACCES" };

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes("cannot list .claude/workflow: EACCES"));
});

test("slugs that differ only in separators get distinct anchors", () => {
  // Arrange
  const dashboard = dashboardOf(feature("a/b"), feature("a-b"));

  // Act
  const html = renderBody(dashboard);

  // Assert
  const ids = [...html.matchAll(/<article class="card feature" id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
});

test("the full page escapes the project path in its header", () => {
  // Arrange
  const dashboard: Dashboard = { projectRoot: "C:/<odd>", features: [], listingError: undefined };

  // Act
  const html = renderPage(dashboard);

  // Assert
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(html.includes("C:/&lt;odd&gt;"));
});
