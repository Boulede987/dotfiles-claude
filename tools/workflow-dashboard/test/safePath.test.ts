import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { resolveExistingInside, resolveInside } from "../src/safePath.ts";

const ROOT = resolve("/projects/demo");

test("a relative path inside the project resolves to its absolute path", () => {
  // Act
  const result = resolveInside(ROOT, "docs/diagrams/a%20b.svg");

  // Assert
  assert.deepEqual(result, { ok: true, path: join(ROOT, "docs", "diagrams", "a b.svg") });
});

test("a path that leaves and re-enters the project is allowed", () => {
  // Act
  const result = resolveInside(ROOT, "docs/../NEEDS.md");

  // Assert
  assert.deepEqual(result, { ok: true, path: join(ROOT, "NEEDS.md") });
});

test("a file whose name starts with two dots stays allowed", () => {
  // Act
  const result = resolveInside(ROOT, "..notes.md");

  // Assert
  assert.deepEqual(result, { ok: true, path: join(ROOT, "..notes.md") });
});

for (const [label, requested] of [
  ["parent traversal", "../secret.txt"],
  ["nested traversal", "docs/../../secret.txt"],
  ["encoded traversal", "%2e%2e/secret.txt"],
  ["encoded slash traversal", "..%2fsecret.txt"],
  ["backslash traversal", String.raw`..\secret.txt`],
  ["absolute posix path", "/etc/passwd"],
  ["windows drive path", "C:/Windows/win.ini"],
  ["encoded windows drive path", "C%3A%5CWindows%5Cwin.ini"],
  ["drive-relative path", "C:secret.txt"],
  ["UNC path", "//server/share/file.txt"],
  ["backslash UNC path", String.raw`\\server\share\file.txt`],
  ["sibling folder sharing the prefix", "../demo-other/file.txt"],
] as const) {
  test(`refuses ${label}`, () => {
    // Act
    const result = resolveInside(ROOT, requested);

    // Assert
    assert.deepEqual(result, { ok: false, reason: "outside the project" });
  });
}

test("refuses the project root itself", () => {
  // Act
  const result = resolveInside(ROOT, "");

  // Assert
  assert.deepEqual(result, { ok: false, reason: "not a file path" });
});

test("refuses malformed percent-encoding", () => {
  // Act
  const result = resolveInside(ROOT, "%E0%A4%A");

  // Assert
  assert.deepEqual(result, { ok: false, reason: "malformed encoding" });
});

test("refuses null bytes", () => {
  // Act
  const result = resolveInside(ROOT, "a%00.svg");

  // Assert
  assert.deepEqual(result, { ok: false, reason: "malformed encoding" });
});

test("an existing file reached through a link pointing outside the project is refused", () => {
  // Arrange: <base>/project/escape -> <base>/outside (a junction needs no admin rights on Windows)
  const base = mkdtempSync(join(tmpdir(), "wd-symlink-"));
  try {
    const project = join(base, "project");
    const outside = join(base, "outside");
    mkdirSync(project);
    mkdirSync(outside);
    writeFileSync(join(outside, "secret.txt"), "secret");
    writeFileSync(join(project, "inside.txt"), "ok");
    symlinkSync(outside, join(project, "escape"), "junction");

    // Act
    const escaped = resolveExistingInside(project, "escape/secret.txt");
    const inside = resolveExistingInside(project, "inside.txt");

    // Assert
    assert.deepEqual(escaped, { ok: false, reason: "outside the project" });
    assert.equal(inside.ok, true);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("a missing file is reported as not found", () => {
  // Arrange
  const project = mkdtempSync(join(tmpdir(), "wd-missing-"));
  try {
    // Act
    const result = resolveExistingInside(project, "missing.svg");

    // Assert
    assert.deepEqual(result, { ok: false, reason: "not found" });
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
});
