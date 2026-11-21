import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import { readDocument } from "./documentReader.ts";
import type { Dashboard, Feature, NeedsResult, ParseResult, ValidationItem } from "./model.ts";
import { newestEntry, pendingValidations } from "./model.ts";
import { parseNeeds } from "./needsParser.ts";
import { parseState } from "./stateParser.ts";

const WORKFLOW_DIR = join(".claude", "workflow");
const STATE_FILE = "STATE.md";
const NEEDS_FILE = "NEEDS.md";

export function workflowRoot(projectRoot: string): string {
  return join(projectRoot, WORKFLOW_DIR);
}

/**
 * Reads every feature under `<projectRoot>/.claude/workflow/`, and the documents of
 * those awaiting validation. Read-only; never throws on file-system errors.
 */
export function readWorkflow(projectRoot: string): Dashboard {
  const root = workflowRoot(projectRoot);
  const slugs = findFeatureSlugs(root);
  if (!slugs.ok) return { projectRoot, features: [], listingError: slugs.error, toValidate: [] };
  const features = slugs.value.sort().map((slug) => readFeature(root, slug));
  const toValidate = readToValidate(projectRoot, pendingValidations(features));
  return { projectRoot, features, listingError: undefined, toValidate };
}

function readToValidate(projectRoot: string, pending: Feature[]): ValidationItem[] {
  // A pending feature always has a newest entry; flatMap only narrows the type.
  return pending.flatMap((feature) => {
    const entry = newestEntry(feature);
    if (entry === undefined) return [];
    const documents = entry.pendingDocuments.map((path) => readDocument(projectRoot, path));
    return [{ feature, entry, documents }];
  });
}

function findFeatureSlugs(root: string): ParseResult<string[]> {
  if (!existsSync(root)) return { ok: true, value: [] };
  let paths: string[];
  try {
    paths = readdirSync(root, { recursive: true, encoding: "utf8" });
  } catch (error) {
    return { ok: false, error: `cannot list ${WORKFLOW_DIR}: ${errorCode(error)}` };
  }
  const slugs = paths
    .filter((path) => path === STATE_FILE || path.endsWith(sep + STATE_FILE))
    .map((path) => dirname(path).split(sep).join("/"))
    .filter((slug) => slug !== ".");
  return { ok: true, value: slugs };
}

function readFeature(root: string, slug: string): Feature {
  const featureDir = join(root, ...slug.split("/"));
  return {
    slug,
    state: parseFile(join(featureDir, STATE_FILE), STATE_FILE, parseState),
    needs: readNeeds(join(featureDir, NEEDS_FILE)),
  };
}

function readNeeds(path: string): NeedsResult {
  if (!existsSync(path)) return { kind: "absent" };
  const parsed = parseFile(path, NEEDS_FILE, parseNeeds);
  return parsed.ok ? { kind: "parsed", requirements: parsed.value } : { kind: "error", error: parsed.error };
}

function parseFile<T>(path: string, name: string, parse: (text: string) => ParseResult<T>): ParseResult<T> {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    return { ok: false, error: `cannot read ${name}: ${errorCode(error)}` };
  }
  return parse(text);
}

function errorCode(error: unknown): string {
  if (error instanceof Error && "code" in error && typeof error.code === "string") return error.code;
  return String(error);
}
