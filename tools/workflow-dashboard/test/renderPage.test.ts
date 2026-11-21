import { test } from "node:test";
import assert from "node:assert/strict";
import { renderBody, renderPage } from "../src/renderPage.ts";
import type { Dashboard, Feature, ShownDocument, StateEntry, ValidationItem } from "../src/model.ts";

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

const CLOSED_REPORT: StateEntry = { ...VALIDATED, phase: "Report", nextSteps: [] };

function feature(slug: string, overrides: Partial<Feature> = {}): Feature {
  return { slug, state: { ok: true, value: [VALIDATED] }, needs: { kind: "absent" }, ...overrides };
}

function awaitingFeature(slug: string): Feature {
  return feature(slug, { state: { ok: true, value: [AWAITING] } });
}

function closedFeature(slug: string): Feature {
  return feature(slug, { state: { ok: true, value: [CLOSED_REPORT] } });
}

function item(forFeature: Feature, documents: ShownDocument[]): ValidationItem {
  return { feature: forFeature, entry: AWAITING, documents };
}

function dashboardOf(features: Feature[], toValidate: ValidationItem[] = []): Dashboard {
  return { projectRoot: "/p", features, listingError: undefined, toValidate };
}

/** The HTML of one tab panel only, so assertions cannot be satisfied by another tab. */
function panel(html: string, tab: string): string {
  const start = html.indexOf(`<section class="tab-panel`);
  const marker = html.indexOf(`data-tab="${tab}"`, start);
  assert.ok(marker >= 0, `panel ${tab} not found`);
  const end = html.indexOf("</section>", marker);
  return html.slice(marker, end);
}

function tabLabels(html: string): string[] {
  return [...html.matchAll(/<a class="tab[^"]*" href="#tab=([^"]+)"/g)].map((match) => match[1]);
}

test("tabs are To validate, then ongoing features by slug, then Closed", () => {
  // Arrange
  const dashboard = dashboardOf([feature("alpha"), closedFeature("beta"), feature("modpack/ore"), feature("zeta")]);

  // Act
  const tabs = tabLabels(renderBody(dashboard));

  // Assert
  assert.deepEqual(tabs, ["_to-validate", "alpha", "modpack/ore", "zeta", "_closed"]);
});

test("the To validate tab is the active one and its label counts the documents", () => {
  // Arrange
  const alpha = awaitingFeature("alpha");
  const dashboard = dashboardOf([alpha], [item(alpha, [
    { path: "a.svg", view: { kind: "image" } },
    { path: "b.md", view: { kind: "text", text: "b" } },
  ])]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes('<a class="tab active" href="#tab=_to-validate" data-tab="_to-validate">To validate (2)</a>'));
  assert.ok(html.includes('<section class="tab-panel active" data-tab="_to-validate">'));
});

test("only a feature awaiting validation gets a marker dot on its tab", () => {
  // Arrange
  const dashboard = dashboardOf([awaitingFeature("alpha"), feature("beta")]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  const tabOf = (slug: string) => html.match(new RegExp(`<a class="tab" href="#tab=${slug}"[^>]*>.*?</a>`))?.[0];
  const alphaTab = tabOf("alpha");
  const betaTab = tabOf("beta");
  assert.ok(alphaTab !== undefined && betaTab !== undefined, "both feature tabs are rendered");
  assert.ok(alphaTab.includes('class="marker"'));
  assert.ok(!betaTab.includes('class="marker"'));
});

test("a closed feature is shown in the Closed tab only", () => {
  // Arrange
  const dashboard = dashboardOf([feature("alpha"), closedFeature("beta")]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(panel(html, "_closed").includes('<article class="card feature" id="feature-beta">'));
  assert.ok(!panel(html, "_closed").includes('id="feature-alpha"'));
  assert.ok(!html.includes('href="#tab=beta"'));
});

test("the To validate tab shows each item's gate and each document in place, with its link", () => {
  // Arrange
  const alpha = awaitingFeature("alpha");
  const dashboard = dashboardOf([alpha], [item(alpha, [
    { path: "docs/diagrams/class design.svg", view: { kind: "image" } },
    { path: "NEEDS.md", view: { kind: "text", text: "| a <b> |\n" } },
  ])]);

  // Act
  const toValidate = panel(renderBody(dashboard), "_to-validate");

  // Assert
  assert.ok(toValidate.includes("Gate NOT met &lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(toValidate.includes('href="/files/docs/diagrams/class%20design.svg"'));
  assert.ok(toValidate.includes('<img src="/files/docs/diagrams/class%20design.svg"'));
  assert.ok(toValidate.includes('href="/files/NEEDS.md"'));
  assert.ok(toValidate.includes('<pre class="document-text">| a &lt;b&gt; |\n</pre>'));
  assert.equal(toValidate.match(/<details class="document" id="[^"]+" open>/g)?.length, 2);
});

test("a document of another type is a link only, without a block", () => {
  // Arrange
  const alpha = awaitingFeature("alpha");
  const dashboard = dashboardOf([alpha], [item(alpha, [{ path: "archive.zip", view: { kind: "link" } }])]);

  // Act
  const toValidate = panel(renderBody(dashboard), "_to-validate");

  // Assert
  assert.ok(toValidate.includes('href="/files/archive.zip"'));
  assert.ok(!toValidate.includes("<details"));
});

test("an unshowable document shows its reason, linked only when the file can be opened", () => {
  // Arrange
  const alpha = awaitingFeature("alpha");
  const dashboard = dashboardOf([alpha], [item(alpha, [
    { path: "big.md", view: { kind: "unshowable", reason: "too large" } },
    { path: "gone.md", view: { kind: "unshowable", reason: "not found" } },
    { path: "locked.md", view: { kind: "unshowable", reason: "unreadable" } },
    { path: "../secret.md", view: { kind: "unshowable", reason: "outside the project" } },
  ])]);

  // Act
  const toValidate = panel(renderBody(dashboard), "_to-validate");

  // Assert
  assert.ok(toValidate.includes("too large"));
  assert.ok(toValidate.includes("not found"));
  assert.ok(toValidate.includes("unreadable"));
  assert.ok(toValidate.includes("outside the project"));
  assert.ok(toValidate.includes('href="/files/big.md"'));
  assert.ok(!toValidate.includes('href="/files/gone.md"'));
  assert.ok(!toValidate.includes('href="/files/locked.md"'));
  assert.doesNotMatch(toValidate, /href="[^"]*secret\.md"/);
});

test("an empty To validate tab says nothing awaits validation", () => {
  // Arrange
  const dashboard = dashboardOf([feature("alpha")]);

  // Act
  const toValidate = panel(renderBody(dashboard), "_to-validate");

  // Assert
  assert.ok(toValidate.includes("Nothing awaiting validation."));
  assert.ok(hasNoDocumentBlock(toValidate));
});

test("features awaiting validation appear only inside the tabs, nothing above the tab bar", () => {
  // Arrange
  const alpha = awaitingFeature("alpha");
  const dashboard = dashboardOf([alpha], [item(alpha, [])]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  const tabBar = html.indexOf('<nav class="tabs"');
  assert.ok(tabBar >= 0, "tab bar is rendered");
  assert.ok(!html.slice(0, tabBar).includes("alpha"));
});

test("a document block's id depends on its path, not on its position in the list", () => {
  // Arrange
  const alpha = awaitingFeature("alpha");
  const needs = { path: "NEEDS.md", view: { kind: "text", text: "n" } } as const;
  const diagram = { path: "a.svg", view: { kind: "image" } } as const;
  const blockIds = (documents: ShownDocument[]) => [
    ...renderBody(dashboardOf([alpha], [item(alpha, documents)])).matchAll(/<details class="document" id="([^"]+)"/g),
  ].map((match) => match[1]);

  // Act
  const before = blockIds([needs]);
  const after = blockIds([diagram, needs]);

  // Assert
  assert.equal(before.length, 1);
  assert.equal(after.length, 2);
  assert.equal(after[1], before[0]);
  assert.notEqual(after[0], before[0]);
});

test("an empty Closed tab says there is no closed feature", () => {
  // Arrange
  const dashboard = dashboardOf([feature("alpha")]);

  // Act
  const closed = panel(renderBody(dashboard), "_closed");

  // Assert
  assert.ok(closed.includes("No closed feature."));
  assert.ok(!closed.includes("<article"));
});

test("a project without features says so and shows only the two fixed tabs", () => {
  // Arrange
  const dashboard = dashboardOf([]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes("No feature found under .claude/workflow/."));
  assert.deepEqual(tabLabels(html), ["_to-validate", "_closed"]);
});

test("text from workflow files is HTML-escaped, quotes included", () => {
  // Arrange
  const alpha = feature("alpha", { state: { ok: true, value: [{ ...AWAITING, pendingDocuments: [`it's "x".md`] }] } });
  const text = `<img src=x onerror="alert('t')">`;
  const dashboard = dashboardOf([alpha], [item(alpha, [{ path: `it's "x".md`, view: { kind: "text", text } }])]);

  // Act
  const html = renderBody(dashboard);
  const toValidate = panel(html, "_to-validate");

  // Assert
  assert.ok(!html.includes("<script>alert(1)"));
  assert.ok(!html.includes(`it's "x"`));
  assert.ok(toValidate.includes("it&#39;s &quot;x&quot;.md"));
  assert.ok(toValidate.includes("&lt;img src=x onerror=&quot;alert(&#39;t&#39;)&quot;&gt;"));
  assert.ok(!toValidate.includes("<img src=x"));
});

test("each feature tab shows only its first next step", () => {
  // Arrange
  const dashboard = dashboardOf([awaitingFeature("alpha"), feature("beta")]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(panel(html, "alpha").includes("<strong>Next:</strong> Validate the class diagram."));
  assert.ok(panel(html, "beta").includes("<strong>Next:</strong> Build the parser."));
  assert.ok(!html.includes("Agree seams."));
});

test("a feature's STATE.md parse error is shown in its tab", () => {
  // Arrange
  const dashboard = dashboardOf([feature("broken", { state: { ok: false, error: "line 3: heading is not valid" } })]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(panel(html, "broken").includes("STATE.md: line 3: heading is not valid"));
});

test("requirements show how many rows are met, matching status case-insensitively", () => {
  // Arrange
  const requirements = [
    { requirement: "a", indicator: "i", status: "Met" },
    { requirement: "b", indicator: "i", status: " met " },
    { requirement: "c", indicator: "i", status: "not started" },
  ];
  const dashboard = dashboardOf([feature("alpha", { needs: { kind: "parsed", requirements } })]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(html.includes("Requirements (2/3 met)"));
});

test("a NEEDS.md error is shown in the feature's tab", () => {
  // Arrange
  const dashboard = dashboardOf([feature("alpha", { needs: { kind: "error", error: "no table" } })]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  assert.ok(panel(html, "alpha").includes("NEEDS.md: no table"));
});

test("a listing error is shown above the tabs", () => {
  // Arrange
  const dashboard: Dashboard = {
    projectRoot: "/p", features: [], listingError: "cannot list .claude/workflow: EACCES", toValidate: [],
  };

  // Act
  const html = renderBody(dashboard);

  // Assert
  const notice = html.indexOf("cannot list .claude/workflow: EACCES");
  assert.ok(notice >= 0, "listing error is shown");
  assert.ok(notice < html.indexOf('<nav class="tabs"'));
});

test("slugs that differ only in separators get distinct anchors", () => {
  // Arrange
  const dashboard = dashboardOf([feature("a/b"), feature("a-b")]);

  // Act
  const html = renderBody(dashboard);

  // Assert
  const ids = [...html.matchAll(/<article class="card feature" id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
});

test("the full page escapes the project path in its header", () => {
  // Arrange
  const dashboard: Dashboard = { projectRoot: "C:/<odd>", features: [], listingError: undefined, toValidate: [] };

  // Act
  const html = renderPage(dashboard);

  // Assert
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(html.includes("C:/&lt;odd&gt;"));
});

function hasNoDocumentBlock(html: string): boolean {
  return !html.includes("<details");
}
