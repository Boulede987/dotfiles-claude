import { TO_VALIDATE_TAB } from "./html.ts";
import { CHANGED_EVENT, ROUTES } from "./routes.ts";

/**
 * Browser script. Shows the tab named by `#tab=<name>` (the To validate tab when the
 * name is missing or unknown), so the selection survives a reload. On each server
 * "changed" event, fetches the page body and swaps #dashboard, keeping the selected
 * tab, scroll position and which <details> are open. A failed refresh marks the page
 * stale instead of leaving it looking live.
 */
export const CLIENT_SCRIPT = `
(() => {
  const DEFAULT_TAB = ${JSON.stringify(TO_VALIDATE_TAB)};
  const main = document.getElementById("dashboard");
  const live = document.getElementById("live");
  const setLive = (text, state) => { live.textContent = text; live.className = "live " + state; };
  const openState = () => new Map([...main.querySelectorAll("details[id]")].map((d) => [d.id, d.open]));
  function requestedTab() {
    const match = location.hash.match(/^#tab=(.+)$/);
    if (!match) return DEFAULT_TAB;
    try { return decodeURIComponent(match[1]); } catch { return DEFAULT_TAB; }
  }
  function showTab() {
    const panels = [...main.querySelectorAll(".tab-panel")];
    const requested = requestedTab();
    const name = panels.some((panel) => panel.dataset.tab === requested) ? requested : DEFAULT_TAB;
    for (const panel of panels) panel.classList.toggle("active", panel.dataset.tab === name);
    for (const tab of main.querySelectorAll(".tab")) tab.classList.toggle("active", tab.dataset.tab === name);
  }
  async function refresh() {
    const response = await fetch(${JSON.stringify(ROUTES.fragment)}, { cache: "no-store" });
    if (!response.ok) throw new Error("refresh failed: HTTP " + response.status);
    const html = await response.text();
    const scroll = window.scrollY;
    const opened = openState();
    main.innerHTML = html;
    for (const [id, open] of opened) {
      const details = document.getElementById(id);
      if (details) details.open = open;
    }
    showTab();
    window.scrollTo(0, scroll);
    setLive("live", "on");
  }
  const refreshOrMarkStale = () => refresh().catch((error) => {
    console.error(error);
    setLive("stale: refresh failed", "off");
  });
  window.addEventListener("hashchange", showTab);
  showTab();
  const events = new EventSource(${JSON.stringify(ROUTES.events)});
  events.addEventListener(${JSON.stringify(CHANGED_EVENT)}, refreshOrMarkStale);
  events.onopen = refreshOrMarkStale;
  events.onerror = () => setLive("disconnected", "off");
})();
`;
