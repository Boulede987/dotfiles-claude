import { escapeHtml, featureId, fileUrl } from "./html.ts";
import type { Feature, NeedsResult, Requirement, StateEntry } from "./model.ts";
import { countMet, newestEntry } from "./model.ts";

/** One feature's card: current phase, next step, timeline and requirements. */
export function renderFeature(feature: Feature): string {
  const id = featureId(feature.slug);
  return `<article class="card feature" id="${id}">
  <h3>${escapeHtml(feature.slug)} ${renderCurrentPhase(feature)}</h3>
  ${renderStateSummary(id, feature)}
  ${renderNeeds(id, feature.needs)}
</article>`;
}

// `status` is a closed EntryStatus union, so it is safe as a class name.
export function renderStatusBadge(entry: StateEntry): string {
  return `<span class="badge status-${entry.status}">${escapeHtml(entry.status)}</span>`;
}

/** "<increment> · <phase>" of an entry. */
export function renderPhase(entry: StateEntry): string {
  return `<span class="phase">${escapeHtml(entry.increment)} · ${escapeHtml(entry.phase)}</span>`;
}

/** The entry's gate text, or nothing when it has none. */
export function renderGate(entry: StateEntry): string {
  return entry.gate === "" ? "" : `<p class="gate">${escapeHtml(entry.gate)}</p>`;
}

export function renderDocumentLinks(paths: string[]): string {
  if (paths.length === 0) return "";
  const items = paths.map((path) => `<li><a href="${fileUrl(path)}" target="_blank">${escapeHtml(path)}</a></li>`);
  return `<ul class="documents">${items.join("")}</ul>`;
}

function renderCurrentPhase(feature: Feature): string {
  const newest = newestEntry(feature);
  if (newest === undefined) return "";
  return `${renderPhase(newest)}
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
    ${renderGate(entry)}
    ${renderDocumentLinks(entry.pendingDocuments)}
  </li>`;
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
