import { CLIENT_SCRIPT } from "./clientScript.ts";
import type { Dashboard, Feature, NeedsResult, Requirement, StateEntry } from "./model.ts";
import { countMet, newestEntry, pendingValidations } from "./model.ts";
import { ROUTES } from "./routes.ts";
import { STYLES } from "./styles.ts";

const PREVIEWABLE_EXTENSIONS = [".svg", ".png"];

/** Full HTML document: styles, live-update script, and the body from `renderBody`. */
export function renderPage(dashboard: Dashboard): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Workflow dashboard</title>
<style>${STYLES}</style>
</head>
<body>
<header class="top">
  <h1>Workflow dashboard</h1>
  <span class="project">${escapeHtml(dashboard.projectRoot)}</span>
  <span id="live" class="live" title="Live updates">connecting…</span>
</header>
<main id="dashboard">${renderBody(dashboard)}</main>
<script>${CLIENT_SCRIPT}</script>
</body>
</html>`;
}

/** The part of the page that is swapped on every live update. */
export function renderBody(dashboard: Dashboard): string {
  return `
<section class="pending">
  <h2>Awaiting validation</h2>
  ${renderPendingPanel(pendingValidations(dashboard))}
</section>
<section class="features">
  <h2>Features</h2>
  ${renderFeatureList(dashboard)}
</section>
<p class="muted updated">Updated ${escapeHtml(new Date().toLocaleTimeString())}</p>`;
}

function renderPendingPanel(pending: Feature[]): string {
  if (pending.length === 0) return '<p class="muted">Nothing awaits validation.</p>';
  return pending.map(renderPendingCard).join("\n");
}

function renderPendingCard(feature: Feature): string {
  const newest = newestEntry(feature);
  if (newest === undefined) return "";
  return `<article class="card pending-card">
  <h3><a href="#${featureId(feature.slug)}">${escapeHtml(feature.slug)}</a>
    <span class="phase">${escapeHtml(newest.increment)} · ${escapeHtml(newest.phase)}</span></h3>
  <p class="gate">${escapeHtml(newest.gate)}</p>
  ${renderDocuments(newest.pendingDocuments, { withPreviews: true })}
</article>`;
}

function renderFeatureList(dashboard: Dashboard): string {
  if (dashboard.listingError !== undefined) return `<p class="error">${escapeHtml(dashboard.listingError)}</p>`;
  if (dashboard.features.length === 0) return '<p class="muted">No feature found under .claude/workflow/.</p>';
  return dashboard.features.map(renderFeature).join("\n");
}

function renderFeature(feature: Feature): string {
  const id = featureId(feature.slug);
  return `<article class="card feature" id="${id}">
  <h3>${escapeHtml(feature.slug)} ${renderCurrentPhase(feature)}</h3>
  ${renderStateSummary(id, feature)}
  ${renderNeeds(id, feature.needs)}
</article>`;
}

function renderCurrentPhase(feature: Feature): string {
  const newest = newestEntry(feature);
  if (newest === undefined) return "";
  return `<span class="phase">${escapeHtml(newest.increment)} · ${escapeHtml(newest.phase)}</span>
    ${renderStatusBadge(newest)}`;
}

function renderStateSummary(id: string, feature: Feature): string {
  if (!feature.state.ok) return `<p class="error">STATE.md: ${escapeHtml(feature.state.error)}</p>`;
  const entries = feature.state.value;
  if (entries.length === 0) return '<p class="muted">No entry yet.</p>';
  const nextStep = entries[0].nextSteps[0];
  return `${nextStep === undefined ? "" : `<p class="next"><strong>Next:</strong> ${escapeHtml(nextStep)}</p>`}
  <details id="${id}-timeline" open>
    <summary>Timeline (${entries.length} entries)</summary>
    ${renderTimeline(entries)}
  </details>`;
}

function renderTimeline(entries: StateEntry[]): string {
  return groupByIncrement(entries)
    .map(([increment, incrementEntries]) => `<div class="increment">
      <h4>${escapeHtml(increment)}</h4>
      <ol class="timeline">${incrementEntries.map(renderEntry).join("\n")}</ol>
    </div>`)
    .join("\n");
}

/** Groups consecutive entries of the same increment, keeping newest-first order. */
function groupByIncrement(entries: StateEntry[]): [string, StateEntry[]][] {
  const groups: [string, StateEntry[]][] = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last !== undefined && last[0] === entry.increment) last[1].push(entry);
    else groups.push([entry.increment, [entry]]);
  }
  return groups;
}

function renderEntry(entry: StateEntry): string {
  const commits = entry.commits.map((hash) => `<code>${escapeHtml(hash)}</code>`).join(" ");
  return `<li class="entry status-${entry.status}">
    <div class="entry-head">
      <strong>${escapeHtml(entry.phase)}</strong>
      ${renderStatusBadge(entry)}
      <span class="muted">${escapeHtml(entry.timestamp)}</span>
      ${commits}
    </div>
    ${entry.gate === "" ? "" : `<p class="gate">${escapeHtml(entry.gate)}</p>`}
    ${renderDocuments(entry.pendingDocuments, { withPreviews: false })}
  </li>`;
}

// `status` is a closed EntryStatus union, so it is safe as a class name.
function renderStatusBadge(entry: StateEntry): string {
  return `<span class="badge status-${entry.status}">${escapeHtml(entry.status)}</span>`;
}

function renderDocuments(paths: string[], options: { withPreviews: boolean }): string {
  if (paths.length === 0) return "";
  const items = paths.map((path) => {
    const url = escapeHtml(ROUTES.files + encodePath(path));
    const preview = options.withPreviews && isPreviewable(path)
      ? `<a href="${url}" target="_blank"><img src="${url}" alt="${escapeHtml(path)}" loading="lazy"></a>`
      : "";
    return `<li><a href="${url}" target="_blank">${escapeHtml(path)}</a>${preview}</li>`;
  });
  return `<ul class="documents">${items.join("")}</ul>`;
}

function renderNeeds(id: string, needs: NeedsResult): string {
  if (needs.kind === "absent") return "";
  if (needs.kind === "error") return `<p class="error">NEEDS.md: ${escapeHtml(needs.error)}</p>`;
  const { requirements } = needs;
  return `<details id="${id}-needs">
    <summary>Requirements (${countMet(requirements)}/${requirements.length} met)</summary>
    <table><thead><tr><th>Requirement</th><th>Indicator</th><th>Status</th></tr></thead>
    <tbody>${requirements.map(renderRequirement).join("")}</tbody></table>
  </details>`;
}

function renderRequirement(requirement: Requirement): string {
  return `<tr><td>${escapeHtml(requirement.requirement)}</td><td>${escapeHtml(requirement.indicator)}</td>
    <td>${escapeHtml(requirement.status)}</td></tr>`;
}

/** DOM id unique per slug: every character outside [a-zA-Z0-9-] becomes `_<hex code>_`. */
function featureId(slug: string): string {
  return `feature-${slug.replace(/[^a-zA-Z0-9-]/g, (char) => `_${char.charCodeAt(0).toString(16)}_`)}`;
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function isPreviewable(path: string): boolean {
  const lower = path.toLowerCase();
  return PREVIEWABLE_EXTENSIONS.some((extension) => lower.endsWith(extension));
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
