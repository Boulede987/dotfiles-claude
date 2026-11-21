/** Page stylesheet: colour tokens on :root, redefined for dark mode. */
export const STYLES = `
:root {
  --bg: #f6f6f3; --surface: #ffffff; --text: #1d1d1b; --muted: #6b6b66; --border: #e2e2dc;
  --accent: #c25e00; --awaiting: #b45309; --awaiting-bg: #fef3c7; --ok: #166534; --ok-bg: #dcfce7;
  --override: #9f1239; --override-bg: #ffe4e6; --unknown-bg: #ececea; --error: #b91c1c;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #161615; --surface: #20201e; --text: #ececea; --muted: #9a9a94; --border: #34342f;
    --accent: #f59e0b; --awaiting: #fbbf24; --awaiting-bg: #3b2a07; --ok: #86efac; --ok-bg: #12301c;
    --override: #fda4af; --override-bg: #3d1119; --unknown-bg: #2c2c29; --error: #f87171;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text);
  font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
.top { display: flex; flex-wrap: wrap; gap: 12px; align-items: baseline; padding: 16px;
  border-bottom: 1px solid var(--border); background: var(--surface); position: sticky; top: 0; z-index: 1; }
.top h1 { font-size: 18px; margin: 0; }
.project { color: var(--muted); font-family: ui-monospace, monospace; font-size: 13px; overflow-wrap: anywhere; }
.live { margin-left: auto; font-size: 13px; color: var(--muted); }
.live.on::before { content: "● "; color: var(--ok); }
.live.off::before { content: "● "; color: var(--error); }
main { max-width: 1000px; margin: 0 auto; padding: 16px; }
h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 24px 0 8px; }
h3 { font-size: 16px; margin: 0 0 6px; display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
h4 { font-size: 14px; margin: 12px 0 4px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
.tabs { display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--border); margin: 8px 0 16px; }
.tab { padding: 6px 12px; border: 1px solid transparent; border-bottom: none; border-radius: 6px 6px 0 0;
  color: var(--muted); text-decoration: none; margin-bottom: -1px; overflow-wrap: anywhere; }
.tab:hover { color: var(--text); }
.tab.active { color: var(--text); background: var(--surface); border-color: var(--border); font-weight: 500; }
.marker { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--awaiting);
  margin-left: 6px; vertical-align: middle; }
.tab-panel { display: none; }
.tab-panel.active { display: block; }
.validation-item { border-left: 4px solid var(--awaiting); }
.document { border-top: 1px solid var(--border); margin-top: 8px; }
.document summary { overflow-wrap: anywhere; }
.document img { display: block; max-width: 100%; margin: 6px 0; background: #fff;
  border: 1px solid var(--border); border-radius: 4px; }
.document-text { white-space: pre-wrap; overflow-wrap: anywhere; font: 13px/1.45 ui-monospace, monospace;
  background: var(--bg); border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; margin: 6px 0;
  max-height: 70vh; overflow-y: auto; }
.document-line { margin: 6px 0; overflow-wrap: anywhere; }
.document-path { font-family: ui-monospace, monospace; font-size: 13px; }
.reason { font-size: 12px; padding: 1px 8px; border-radius: 999px; background: var(--override-bg); color: var(--override); }
.phase { font-weight: 400; color: var(--muted); font-size: 14px; }
.badge { font-size: 12px; padding: 1px 8px; border-radius: 999px; font-weight: 500; }
.badge.status-awaiting-validation { background: var(--awaiting-bg); color: var(--awaiting); }
.badge.status-validated { background: var(--ok-bg); color: var(--ok); }
.badge.status-overridden { background: var(--override-bg); color: var(--override); }
.badge.status-unknown { background: var(--unknown-bg); color: var(--muted); }
.next { margin: 4px 0 8px; }
.gate { white-space: pre-wrap; margin: 4px 0; color: var(--text); }
.error { color: var(--error); font-family: ui-monospace, monospace; font-size: 13px; }
.muted { color: var(--muted); }
.updated { font-size: 12px; text-align: right; }
summary { cursor: pointer; color: var(--muted); margin: 6px 0; }
.timeline { list-style: none; margin: 0; padding: 0 0 0 14px; border-left: 2px solid var(--border); }
.entry { position: relative; padding: 6px 0 8px 10px; }
.entry::before { content: ""; position: absolute; left: -21px; top: 13px; width: 10px; height: 10px;
  border-radius: 50%; background: var(--border); }
.entry.status-awaiting-validation::before { background: var(--awaiting); }
.entry.status-validated::before { background: var(--ok); }
.entry.status-overridden::before { background: var(--override); }
.entry-head { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
code { font-family: ui-monospace, monospace; font-size: 12px; background: var(--unknown-bg); padding: 0 4px; border-radius: 4px; }
.documents { margin: 6px 0 0; padding-left: 18px; }
.documents li { margin: 2px 0; overflow-wrap: anywhere; }
a { color: var(--accent); }
table { border-collapse: collapse; width: 100%; font-size: 13px; display: block; overflow-x: auto; }
th, td { text-align: left; border-bottom: 1px solid var(--border); padding: 4px 8px; vertical-align: top; }
`;
