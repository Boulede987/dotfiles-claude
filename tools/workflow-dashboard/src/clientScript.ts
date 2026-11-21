import { CHANGED_EVENT, ROUTES } from "./routes.ts";

/**
 * Browser script: on each server "changed" event, fetches the page body and swaps
 * #dashboard, keeping scroll position and which <details> are open. A failed
 * refresh marks the page stale instead of leaving it looking live.
 */
export const CLIENT_SCRIPT = `
(() => {
  const main = document.getElementById("dashboard");
  const live = document.getElementById("live");
  const setLive = (text, state) => { live.textContent = text; live.className = "live " + state; };
  const openState = () => new Map([...main.querySelectorAll("details[id]")].map((d) => [d.id, d.open]));
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
    window.scrollTo(0, scroll);
    setLive("live", "on");
  }
  const refreshOrMarkStale = () => refresh().catch((error) => {
    console.error(error);
    setLive("stale: refresh failed", "off");
  });
  const events = new EventSource(${JSON.stringify(ROUTES.events)});
  events.addEventListener(${JSON.stringify(CHANGED_EVENT)}, refreshOrMarkStale);
  events.onopen = refreshOrMarkStale;
  events.onerror = () => setLive("disconnected", "off");
})();
`;
