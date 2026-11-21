import { test, before, after, type TestContext } from "node:test";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { chmodSync, closeSync, mkdirSync, mkdtempSync, openSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_TEXT_BYTES, readDocument } from "../src/documentReader.ts";

const IMAGE_NAMES = ["Class.SVG", "shot.png", "photo.JPG", "photo.jpeg", "anim.Gif"];
const TEXT_DOCUMENTS: [string, string][] = [
  ["NEEDS.md", "# Needs\r\n\r\n| a | b |\n"],
  ["design.PUML", "@startuml\n@enduml\n"],
  ["notes.txt", "notes\n"],
  ["data.json", '{"a": 1}\n'],
];

// Shared, read-only fixture: <base>/project with the files above, and a junction
// "escape" pointing to <base>/outside/secret.md.
let base: string;
let project: string;

before(() => {
  base = mkdtempSync(join(tmpdir(), "wd-documents-"));
  project = join(base, "project");
  const outside = join(base, "outside");
  mkdirSync(join(project, "docs"), { recursive: true });
  mkdirSync(outside);
  for (const name of IMAGE_NAMES) writeFileSync(join(project, "docs", name), "image bytes");
  for (const [name, text] of TEXT_DOCUMENTS) writeFileSync(join(project, name), text);
  writeFileSync(join(project, "archive.zip"), "zip bytes");
  writeFileSync(join(project, "at-limit.txt"), "a".repeat(MAX_TEXT_BYTES));
  writeFileSync(join(project, "over-limit.txt"), "a".repeat(MAX_TEXT_BYTES + 1));
  writeFileSync(join(outside, "secret.md"), "secret");
  symlinkSync(outside, join(project, "escape"), "junction");
});

after(() => rmSync(base, { recursive: true, force: true }));

test("every image extension is shown as an image, whatever its case", () => {
  // Arrange: images from the shared fixture
  const paths = IMAGE_NAMES.map((name) => `docs/${name}`);

  // Act
  const documents = paths.map((path) => readDocument(project, path));

  // Assert
  assert.deepEqual(documents, paths.map((path) => ({ path, view: { kind: "image" } })));
});

test("every text extension is shown with the document's exact content", () => {
  // Arrange: text documents from the shared fixture
  const names = TEXT_DOCUMENTS.map(([name]) => name);

  // Act
  const views = names.map((name) => readDocument(project, name).view);

  // Assert
  assert.deepEqual(views, TEXT_DOCUMENTS.map(([, text]) => ({ kind: "text", text })));
});

test("a document of any other type is shown as a link only", () => {
  // Arrange: archive.zip from the shared fixture

  // Act
  const result = readDocument(project, "archive.zip");

  // Assert
  assert.deepEqual(result.view, { kind: "link" });
});

test("a text document is shown whole up to 256 KB and is too large beyond", () => {
  // Arrange: at-limit.txt and over-limit.txt from the shared fixture

  // Act
  const atLimit = readDocument(project, "at-limit.txt");
  const overLimit = readDocument(project, "over-limit.txt");

  // Assert
  assert.deepEqual(atLimit.view, { kind: "text", text: "a".repeat(MAX_TEXT_BYTES) });
  assert.deepEqual(overLimit.view, { kind: "unshowable", reason: "too large" });
});

test("a missing document, a folder, or a path that names no file is not found", () => {
  // Arrange
  const paths = ["docs/missing.md", "docs", "", "a\0.md"];

  // Act
  const results = paths.map((path) => [path, readDocument(project, path).view]);

  // Assert
  assert.deepEqual(results, paths.map((path) => [path, { kind: "unshowable", reason: "not found" }]));
});

test("a document outside the project, by text, absolute path or link, is refused", () => {
  // Arrange
  const paths = ["../outside/secret.md", join(base, "outside", "secret.md"), "escape/secret.md"];

  // Act
  const results = paths.map((path) => [path, readDocument(project, path).view]);

  // Assert
  assert.deepEqual(results, paths.map((path) => [path, { kind: "unshowable", reason: "outside the project" }]));
});

test("a file that exists but cannot be read is unreadable, whatever its type", (context) => {
  // Arrange
  const names = ["locked.md", "locked.svg", "locked.zip"];
  const paths = names.map((name) => join(project, name));
  for (const path of paths) writeFileSync(path, "locked");
  try {
    for (const path of paths) denyRead(path);
    if (!paths.every(isUnreadable)) return skipUnlockable(context);

    // Act
    const results = names.map((name) => [name, readDocument(project, name).view]);

    // Assert
    assert.deepEqual(results, names.map((name) => [name, { kind: "unshowable", reason: "unreadable" }]));
  } finally {
    for (const path of paths) allowRead(path);
  }
});

/** Removes read access for the current user: an ACL deny entry on Windows, mode 000 elsewhere. */
function denyRead(path: string): void {
  if (process.platform === "win32") execFileSync("icacls", [path, "/deny", `${process.env.USERNAME}:(R)`], { stdio: "ignore" });
  else chmodSync(path, 0o000);
}

function allowRead(path: string): void {
  if (process.platform === "win32") execFileSync("icacls", [path, "/remove:d", `${process.env.USERNAME}`], { stdio: "ignore" });
  else chmodSync(path, 0o644);
}

function isUnreadable(path: string): boolean {
  try {
    closeSync(openSync(path, "r"));
    return false;
  } catch {
    return true;
  }
}

/** Running as an administrator or root can read any file, so the case cannot be set up there. */
function skipUnlockable(context: TestContext): void {
  context.skip("read access cannot be removed for this user");
}
