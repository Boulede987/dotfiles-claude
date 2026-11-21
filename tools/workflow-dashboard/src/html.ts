import { ROUTES } from "./routes.ts";

/**
 * Tab names in `#tab=<name>`. Feature tabs use the slug; feature-workflow slugs are
 * kebab-case, so they never start with "_". A folder named like one of these would
 * share its tab name.
 */
export const TO_VALIDATE_TAB = "_to-validate";
export const CLOSED_TAB = "_closed";

const ID_SAFE_CHARACTER = /[a-zA-Z0-9-]/;
/** Joins id parts; "." never appears in an encoded part, so joined ids stay unique. */
const ID_PART_SEPARATOR = ".";

export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Percent-encodes each segment of a project-relative path, keeping its "/" separators. */
export function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** The served URL of a project-relative path, HTML-escaped for an attribute. */
export function fileUrl(path: string): string {
  return escapeHtml(ROUTES.files + encodePath(path));
}

/** The `href` selecting a tab, HTML-escaped for an attribute. */
export function tabHref(tabName: string): string {
  return escapeHtml(`#tab=${encodePath(tabName)}`);
}

/** DOM id unique per slug. */
export function featureId(slug: string): string {
  return `feature-${encodeIdPart(slug)}`;
}

/** DOM id unique per feature and document path, so a block keeps its state when the list changes. */
export function documentId(slug: string, path: string): string {
  return [featureId(slug), "doc", encodeIdPart(path)].join(ID_PART_SEPARATOR);
}

/** Every character outside [a-zA-Z0-9-] becomes `_<hex code>_`, so distinct texts give distinct parts. */
function encodeIdPart(text: string): string {
  return [...text].map(encodeIdCharacter).join("");
}

function encodeIdCharacter(character: string): string {
  if (ID_SAFE_CHARACTER.test(character)) return character;
  return `_${character.codePointAt(0)?.toString(16)}_`;
}
