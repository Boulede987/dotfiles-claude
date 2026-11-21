import { realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep, win32 } from "node:path";

export type RefusalReason = "malformed encoding" | "outside the project" | "not a file path" | "not found";
export type PathResult = { ok: true; path: string } | { ok: false; reason: RefusalReason };

const WINDOWS_DRIVE_PREFIX = /^[a-zA-Z]:/;

/**
 * Resolves a URL-encoded, project-relative path to an absolute path that lies
 * strictly inside `root`, judged on the text of the path alone (no file-system access).
 */
export function resolveInside(root: string, requested: string): PathResult {
  const decoded = decode(requested);
  if (decoded === undefined) return { ok: false, reason: "malformed encoding" };
  return resolvePlainInside(root, decoded);
}

/**
 * Like `resolveInside`, then follows symlinks on both sides: an existing file whose
 * real location is outside the project's real location is refused.
 */
export function resolveExistingInside(root: string, requested: string): PathResult {
  const decoded = decode(requested);
  if (decoded === undefined) return { ok: false, reason: "malformed encoding" };
  return resolveExistingPath(root, decoded);
}

/**
 * Like `resolveExistingInside` for a plain project-relative path, as written in
 * STATE.md: the path is taken literally, never percent-decoded.
 */
export function resolveExistingPath(root: string, path: string): PathResult {
  const lexical = resolvePlainInside(root, path);
  if (!lexical.ok) return lexical;
  const realRoot = realPath(root);
  const realTarget = realPath(lexical.path);
  if (realRoot === undefined || realTarget === undefined) return { ok: false, reason: "not found" };
  return checkContainment(realRoot, realTarget);
}

function resolvePlainInside(root: string, path: string): PathResult {
  if (path.includes("\0")) return { ok: false, reason: "not a file path" };
  const normalized = path.replaceAll("\\", "/");
  if (isAbsolutePath(normalized)) return { ok: false, reason: "outside the project" };
  const absoluteRoot = resolve(root);
  return checkContainment(absoluteRoot, resolve(absoluteRoot, normalized));
}

function isAbsolutePath(path: string): boolean {
  return isAbsolute(path) || win32.isAbsolute(path) || WINDOWS_DRIVE_PREFIX.test(path);
}

function checkContainment(root: string, path: string): PathResult {
  const fromRoot = relative(root, path);
  if (fromRoot === "") return { ok: false, reason: "not a file path" };
  if (fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    return { ok: false, reason: "outside the project" };
  }
  return { ok: true, path };
}

/** Real path, or undefined when the path does not exist or cannot be resolved. */
function realPath(path: string): string | undefined {
  try {
    return realpathSync(path);
  } catch {
    return undefined;
  }
}

/** Percent-decoded text, or undefined when the encoding is malformed or decodes to a NUL byte. */
function decode(requested: string): string | undefined {
  let decoded: string;
  try {
    decoded = decodeURIComponent(requested);
  } catch {
    return undefined;
  }
  return decoded.includes("\0") ? undefined : decoded;
}
