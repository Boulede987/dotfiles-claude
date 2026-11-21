import { CLIENT_SCRIPT } from "./clientScript.ts";
import { CLOSED_TAB, TO_VALIDATE_TAB, escapeHtml, tabHref } from "./html.ts";
import type { Dashboard, Feature } from "./model.ts";
import { closedFeatures, documentCount, isAwaitingValidation, ongoingFeatures } from "./model.ts";
import { renderFeature } from "./renderFeature.ts";
import { renderValidationTab } from "./renderValidation.ts";
import { STYLES } from "./styles.ts";

/** One tab of the tab bar: `name` is what `#tab=<name>` selects. */
type Tab = { name: string; label: string; awaitingValidation: boolean; content: string };

/** The tab shown when `#tab=` names no existing tab, and the one active in the served HTML. */
const DEFAULT_TAB = TO_VALIDATE_TAB;

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

/** The part of the page that is swapped on every live update: tab bar and tab panels. */
export function renderBody(dashboard: Dashboard): string {
  const tabs = buildTabs(dashboard);
  return `${renderListingNotice(dashboard)}
<nav class="tabs">${tabs.map(renderTabLink).join("")}</nav>
${tabs.map(renderTabPanel).join("\n")}
<p class="muted updated">Updated ${escapeHtml(new Date().toLocaleTimeString())}</p>`;
}

function buildTabs(dashboard: Dashboard): Tab[] {
  const closed = closedFeatures(dashboard);
  return [
    {
      name: TO_VALIDATE_TAB,
      label: `To validate (${documentCount(dashboard.toValidate)})`,
      awaitingValidation: false,
      content: renderValidationTab(dashboard.toValidate),
    },
    ...ongoingFeatures(dashboard).map(featureTab),
    {
      name: CLOSED_TAB,
      label: `Closed (${closed.length})`,
      awaitingValidation: false,
      content: renderClosedTab(closed),
    },
  ];
}

function featureTab(feature: Feature): Tab {
  return {
    name: feature.slug,
    label: feature.slug,
    awaitingValidation: isAwaitingValidation(feature),
    content: renderFeature(feature),
  };
}

function activeClass(tab: Tab): string {
  return tab.name === DEFAULT_TAB ? " active" : "";
}

function renderListingNotice(dashboard: Dashboard): string {
  if (dashboard.listingError !== undefined) return `<p class="error">${escapeHtml(dashboard.listingError)}</p>`;
  if (dashboard.features.length === 0) return '<p class="muted">No feature found under .claude/workflow/.</p>';
  return "";
}

function renderTabLink(tab: Tab): string {
  const marker = tab.awaitingValidation ? '<span class="marker" title="Awaiting validation"></span>' : "";
  return `<a class="tab${activeClass(tab)}" href="${tabHref(tab.name)}" data-tab="${escapeHtml(tab.name)}">`
    + `${escapeHtml(tab.label)}${marker}</a>`;
}

function renderTabPanel(tab: Tab): string {
  return `<section class="tab-panel${activeClass(tab)}" data-tab="${escapeHtml(tab.name)}">
${tab.content}
</section>`;
}

function renderClosedTab(closed: Feature[]): string {
  if (closed.length === 0) return '<p class="muted">No closed feature.</p>';
  return closed.map(renderFeature).join("\n");
}
