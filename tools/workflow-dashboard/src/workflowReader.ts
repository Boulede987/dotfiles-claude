import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import type { Dashboard, Feature, NeedsResult, ParseResult } from "./model.ts";
import { parseNeeds } from "./needsParser.ts";
import { parseState } from "./stateParser.ts";

const WORKFLOW_DIR = join(".claude", "workflow");
const STATE_FILE = "STATE.md";
const NEEDS_FILE = "NEEDS.md";

export function workflowRoot(projectRoot: string): string {
  return join(projectRoot, WORKFLOW_DIR);
}

/** Reads every feature under `<projectRoot>/.claude/workflow/`. Read-only; never throws on file-system errors. */
export function readWorkflow(projectRoot: string): Dashboard {
  const root = workflowRoot(projectRoot);
  const slugs = findFeatureSlugs(root);
  if (!slugs.ok) return { projectRoot, features: [], listingError: slugs.error };
  const features = slugs.value.sort().map((slug) => readFeature(root, slug));
  return { projectRoot, features, listingError: undefined };
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
