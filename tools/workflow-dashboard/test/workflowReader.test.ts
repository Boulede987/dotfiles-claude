import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWorkflow } from "../src/workflowReader.ts";
import type { Dashboard, Feature } from "../src/model.ts";

const VALID_STATE = "## 2026-11-20 — Increment 1 — Phase: Spec\n\n**Status:** validated\n";
const VALID_NEEDS = "## 2. Expected Outputs\n| R | I | S |\n|---|---|---|\n| a | b | met |\n";

let projectRoot: string;

function writeFeatureFile(root: string, slug: string, name: string, content: string): void {
  const dir = join(root, ".claude", "workflow", ...slug.split("/"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), content);
}

function featureBySlug(dashboard: Dashboard, slug: string): Feature {
  const feature = dashboard.features.find((candidate) => candidate.slug === slug);
  assert.ok(feature, `feature ${slug} not found`);
  return feature;
}

function snapshotTree(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((path) => `${path}@${statSync(join(dir, path)).mtimeMs}`)
    .sort();
}

function withTempProject(prefix: string, body: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), prefix));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

before(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "wd-reader-"));
  writeFeatureFile(projectRoot, "zeta", "STATE.md", VALID_STATE);
  writeFeatureFile(projectRoot, "zeta", "NEEDS.md", VALID_NEEDS);
  writeFeatureFile(projectRoot, "modpack/custom-ore", "STATE.md", VALID_STATE);
  writeFeatureFile(projectRoot, "modpack", "STATE.md", "garbage before heading\n");
  writeFeatureFile(projectRoot, "modpack", "NEEDS.md", "no section two\n");
  writeFeatureFile(projectRoot, "notes-only", "README.md", "not a feature\n");
});

after(() => rmSync(projectRoot, { recursive: true, force: true }));

test("finds every feature with a STATE.md, nested slugs included, sorted by slug", () => {
  // Act
  const dashboard = readWorkflow(projectRoot);

  // Assert
  assert.deepEqual(dashboard.features.map((feature) => feature.slug), ["modpack", "modpack/custom-ore", "zeta"]);
  assert.equal(dashboard.listingError, undefined);
});

test("a broken feature reports its errors without affecting the others", () => {
  // Act
  const dashboard = readWorkflow(projectRoot);

  // Assert
  const modpack = featureBySlug(dashboard, "modpack");
  assert.deepEqual(modpack.state, { ok: false, error: "line 1: text before the first entry heading" });
  assert.deepEqual(modpack.needs, { kind: "error", error: 'no "## 2. Expected Outputs" section' });
  assert.equal(featureBySlug(dashboard, "modpack/custom-ore").state.ok, true);
  assert.deepEqual(featureBySlug(dashboard, "zeta").needs, {
    kind: "parsed",
    requirements: [{ requirement: "a", indicator: "b", status: "met" }],
  });
});

test("a feature without NEEDS.md reports needs as absent", () => {
  // Act
  const dashboard = readWorkflow(projectRoot);

  // Assert
  assert.deepEqual(featureBySlug(dashboard, "modpack/custom-ore").needs, { kind: "absent" });
});

test("a project without .claude/workflow has no features", () => {
  withTempProject("wd-empty-", (root) => {
    // Act
    const dashboard = readWorkflow(root);

    // Assert
    assert.deepEqual(dashboard, { projectRoot: root, features: [], listingError: undefined, toValidate: [] });
  });
});

test("reading never writes or touches any file", () => {
  // Arrange
  const beforeRead = snapshotTree(projectRoot);

  // Act
  readWorkflow(projectRoot);

  // Assert
  assert.deepEqual(snapshotTree(projectRoot), beforeRead);
});

test("an unreadable STATE.md becomes that feature's error instead of throwing", () => {
  withTempProject("wd-unreadable-state-", (root) => {
    // Arrange
    mkdirSync(join(root, ".claude", "workflow", "odd", "STATE.md"), { recursive: true });

    // Act
    const odd = featureBySlug(readWorkflow(root), "odd");

    // Assert
    assert.deepEqual(odd.state, { ok: false, error: "cannot read STATE.md: EISDIR" });
  });
});

test("an unreadable NEEDS.md becomes that feature's needs error", () => {
  withTempProject("wd-unreadable-needs-", (root) => {
    // Arrange
    writeFeatureFile(root, "odd", "STATE.md", VALID_STATE);
    mkdirSync(join(root, ".claude", "workflow", "odd", "NEEDS.md"));

    // Act
    const odd = featureBySlug(readWorkflow(root), "odd");

    // Assert
    assert.deepEqual(odd.needs, { kind: "error", error: "cannot read NEEDS.md: EISDIR" });
  });
});

test("a workflow path that cannot be listed becomes a dashboard listing error", () => {
  withTempProject("wd-unlistable-", (root) => {
    // Arrange: .claude/workflow is a file, so listing it fails
    mkdirSync(join(root, ".claude"));
    writeFileSync(join(root, ".claude", "workflow"), "not a folder");

    // Act
    const dashboard = readWorkflow(root);

    // Assert
    assert.deepEqual(dashboard.features, []);
    assert.equal(dashboard.listingError, `cannot list ${join(".claude", "workflow")}: ENOTDIR`);
  });
});

test("only features whose newest entry awaits validation are to validate, with their documents read", () => {
  withTempProject("wd-to-validate-", (root) => {
    // Arrange
    const awaiting = [
      "## 2026-11-21 — Increment 2 — Phase: Spec",
      "",
      "**Status:** awaiting-validation",
      "",
      "**Pending documents:** docs/design.md, docs/missing.svg, docs/folder.md",
      "",
      "## 2026-11-20 — Increment 1 — Phase: Report",
      "",
      "**Status:** validated",
      "",
    ].join("\n");
    const olderAwaiting = [
      "## 2026-11-21 — Increment 1 — Phase: Build",
      "",
      "**Status:** validated",
      "",
      "## 2026-11-20 — Increment 1 — Phase: Spec",
      "",
      "**Status:** awaiting-validation",
      "",
      "**Pending documents:** docs/design.md",
      "",
    ].join("\n");
    writeFeatureFile(root, "alpha", "STATE.md", awaiting);
    writeFeatureFile(root, "beta", "STATE.md", olderAwaiting);
    mkdirSync(join(root, "docs", "folder.md"), { recursive: true });
    writeFileSync(join(root, "docs", "design.md"), "# Design\n");

    // Act
    const { toValidate } = readWorkflow(root);

    // Assert
    assert.deepEqual(toValidate.map((item) => item.feature.slug), ["alpha"]);
    assert.equal(toValidate[0].entry.increment, "Increment 2");
    assert.deepEqual(toValidate[0].documents, [
      { path: "docs/design.md", view: { kind: "text", text: "# Design\n" } },
      { path: "docs/missing.svg", view: { kind: "unshowable", reason: "not found" } },
      { path: "docs/folder.md", view: { kind: "unshowable", reason: "not found" } },
    ]);
  });
});
