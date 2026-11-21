import { documentId, escapeHtml, fileUrl, tabHref } from "./html.ts";
import type { DocumentView, ShownDocument, ValidationItem } from "./model.ts";
import { renderGate, renderPhase, renderStatusBadge } from "./renderFeature.ts";

type ShowableView = Extract<DocumentView, { kind: "image" | "text" }>;

/** The "To validate" tab: per feature awaiting validation, its gate and every document in place. */
export function renderValidationTab(items: ValidationItem[]): string {
  if (items.length === 0) return '<p class="muted">Nothing awaiting validation.</p>';
  return items.map(renderValidationItem).join("\n");
}

function renderValidationItem(item: ValidationItem): string {
  const { feature, entry } = item;
  const documents = item.documents.map((document) => renderShownDocument(feature.slug, document));
  return `<article class="card validation-item">
  <h3><a href="${tabHref(feature.slug)}">${escapeHtml(feature.slug)}</a>
    ${renderPhase(entry)}
    ${renderStatusBadge(entry)}</h3>
  ${renderGate(entry)}
  ${documents.length === 0 ? '<p class="muted">No document listed.</p>' : documents.join("\n")}
</article>`;
}

function renderShownDocument(slug: string, document: ShownDocument): string {
  const { path, view } = document;
  const link = `<a href="${fileUrl(path)}" target="_blank">${escapeHtml(path)}</a>`;
  switch (view.kind) {
    case "link":
      return `<p class="document-line">${link}</p>`;
    case "unshowable": {
      // A too-large file still opens through its link; the other reasons leave nothing to open.
      const label = view.reason === "too large" ? link : `<span class="document-path">${escapeHtml(path)}</span>`;
      return `<p class="document-line">${label} <span class="reason">${escapeHtml(view.reason)}</span></p>`;
    }
    case "image":
    case "text":
      return `<details class="document" id="${documentId(slug, path)}" open>
    <summary>${link}</summary>
    ${renderView(path, view)}
  </details>`;
    default:
      throw new Error(`unexpected document view: ${JSON.stringify(view)}`);
  }
}

function renderView(path: string, view: ShowableView): string {
  if (view.kind === "image") return `<img src="${fileUrl(path)}" alt="${escapeHtml(path)}" loading="lazy">`;
  return `<pre class="document-text">${escapeHtml(view.text)}</pre>`;
}
