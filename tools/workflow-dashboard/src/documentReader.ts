import { closeSync, openSync, readSync, statSync } from "node:fs";
import { extname } from "node:path";
import type { DocumentView, ShownDocument, UnshowableReason } from "./model.ts";
import { resolveExistingPath, type RefusalReason } from "./safePath.ts";

export const MAX_TEXT_BYTES = 256 * 1024;
const IMAGE_EXTENSIONS = [".svg", ".png", ".jpg", ".jpeg", ".gif"];
const TEXT_EXTENSIONS = [".md", ".puml", ".txt", ".json"];
// A path that is not a file path at all (empty, NUL byte) names nothing that could exist.
const UNSHOWABLE_FOR_REFUSAL: Record<RefusalReason, UnshowableReason> = {
  "outside the project": "outside the project",
  "not found": "not found",
  "not a file path": "not found",
  "malformed encoding": "not found",
};
const MISSING_ERROR_CODES = ["ENOENT", "ENOTDIR"];

/**
 * Decides how a pending document is shown. `path` is project-relative, as written in
 * STATE.md. Read-only; never throws on file-system errors.
 */
export function readDocument(projectRoot: string, path: string): ShownDocument {
  return { path, view: viewOf(projectRoot, path) };
}

function viewOf(projectRoot: string, path: string): DocumentView {
  const resolved = resolveExistingPath(projectRoot, path);
  if (!resolved.ok) return unshowable(UNSHOWABLE_FOR_REFUSAL[resolved.reason]);

  const extension = extname(resolved.path).toLowerCase();
  const isText = TEXT_EXTENSIONS.includes(extension);
  const buffer = Buffer.alloc(isText ? MAX_TEXT_BYTES + 1 : 0);
  let length: number;
  try {
    if (!statSync(resolved.path).isFile()) return unshowable("not found");
    // Every type is opened, so a file the server could not serve is reported here.
    length = readUpTo(resolved.path, buffer);
  } catch (error) {
    return unshowable(isMissing(error) ? "not found" : "unreadable");
  }

  if (IMAGE_EXTENSIONS.includes(extension)) return { kind: "image" };
  if (!isText) return { kind: "link" };
  if (length > MAX_TEXT_BYTES) return unshowable("too large");
  return { kind: "text", text: buffer.toString("utf8", 0, length) };
}

/**
 * Opens the file and fills `buffer` from its start until the buffer is full or the
 * file ends; returns the byte count. Reading at most the buffer's size means a file
 * that grows after its check is never loaded whole.
 */
function readUpTo(path: string, buffer: Buffer): number {
  const descriptor = openSync(path, "r");
  try {
    let length = 0;
    let bytesRead = -1;
    while (length < buffer.length && bytesRead !== 0) {
      bytesRead = readSync(descriptor, buffer, length, buffer.length - length, null);
      length += bytesRead;
    }
    return length;
  } finally {
    closeSync(descriptor);
  }
}

function isMissing(error: unknown): boolean {
  return error instanceof Error && "code" in error && MISSING_ERROR_CODES.includes(String(error.code));
}

function unshowable(reason: UnshowableReason): DocumentView {
  return { kind: "unshowable", reason };
}
