import { createReadStream, statSync } from "node:fs";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { extname } from "node:path";
import { renderBody, renderPage } from "./renderPage.ts";
import { CHANGED_EVENT, ROUTES } from "./routes.ts";
import { resolveExistingInside, type RefusalReason } from "./safePath.ts";
import { watchWorkflow } from "./watcher.ts";
import { readWorkflow, workflowRoot } from "./workflowReader.ts";

const HOST = "127.0.0.1";
const ALLOWED_HOST_NAMES = [HOST, "localhost"];
const MAX_PORT_ATTEMPTS = 20;
const HTML_TYPE = "text/html; charset=utf-8";
const TEXT_TYPE = "text/plain; charset=utf-8";
const CONTENT_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".md": TEXT_TYPE,
  ".txt": TEXT_TYPE,
  ".puml": TEXT_TYPE,
  ".json": TEXT_TYPE,
};
const REFUSAL_STATUS: Record<RefusalReason, number> = {
  "malformed encoding": 400,
  "outside the project": 403,
  "not a file path": 404,
  "not found": 404,
};

export type ServerOptions = { projectRoot: string; port: number };
export type RunningServer = { url: string; address: string; port: number; close: () => Promise<void> };

/** Everything a request handler needs, bundled once per server. */
type ServerContext = { projectRoot: string; port: number; eventStreams: Set<ServerResponse> };

export async function startServer(options: ServerOptions): Promise<RunningServer> {
  const context: ServerContext = { projectRoot: options.projectRoot, port: 0, eventStreams: new Set() };
  const server = createServer((request, response) => handleRequest(context, request, response));
  const bound = await listenWithFallback(server, options.port);
  context.port = bound.port;
  const unsubscribe = watchWorkflow(workflowRoot(options.projectRoot), () => broadcastChange(context));

  const close = async (): Promise<void> => {
    unsubscribe();
    for (const stream of context.eventStreams) stream.end();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
  return { url: `http://${HOST}:${bound.port}/`, address: bound.address, port: bound.port, close };
}

function broadcastChange(context: ServerContext): void {
  for (const stream of context.eventStreams) stream.write(`event: ${CHANGED_EVENT}\ndata: \n\n`);
}

function handleRequest(context: ServerContext, request: IncomingMessage, response: ServerResponse): void {
  try {
    routeRequest(context, request, response);
  } catch (error) {
    // One bad request must never stop the server: log, answer 500, keep serving.
    console.error(`workflow-dashboard: ${request.method} ${request.url} failed:`, error);
    if (!response.headersSent) sendText(response, 500, `Internal error: ${String(error)}`);
    else response.destroy();
  }
}

function routeRequest(context: ServerContext, request: IncomingMessage, response: ServerResponse): void {
  // DNS-rebinding guard: a foreign page resolving its own domain to 127.0.0.1 sends a foreign Host.
  if (!isAllowedHost(request.headers.host, context.port)) return sendText(response, 403, "Forbidden host");
  if (request.method !== "GET") return sendText(response, 405, "Method not allowed");
  const rawPath = (request.url ?? ROUTES.page).split("?")[0];

  if (rawPath === ROUTES.page) return sendHtml(response, renderPage(readWorkflow(context.projectRoot)));
  if (rawPath === ROUTES.fragment) return sendHtml(response, renderBody(readWorkflow(context.projectRoot)));
  if (rawPath === ROUTES.events) return openEventStream(context, response);
  if (rawPath.startsWith(ROUTES.files)) {
    return sendProjectFile(context.projectRoot, rawPath.slice(ROUTES.files.length), response);
  }
  sendText(response, 404, "Not found");
}

function isAllowedHost(host: string | undefined, port: number): boolean {
  return ALLOWED_HOST_NAMES.some((name) => host === `${name}:${port}`);
}

function openEventStream(context: ServerContext, response: ServerResponse): void {
  response.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-store",
    connection: "keep-alive",
  });
  response.write(": connected\n\n");
  context.eventStreams.add(response);
  response.on("close", () => context.eventStreams.delete(response));
}

function sendProjectFile(projectRoot: string, requested: string, response: ServerResponse): void {
  const resolved = resolveExistingInside(projectRoot, requested);
  if (!resolved.ok) return sendText(response, REFUSAL_STATUS[resolved.reason], `Refused: ${resolved.reason}`);
  if (!statSync(resolved.path).isFile()) return sendText(response, 404, "Not found");

  response.writeHead(200, {
    "content-type": CONTENT_TYPES[extname(resolved.path).toLowerCase()] ?? "application/octet-stream",
    "cache-control": "no-store",
    // Opened directly, an SVG/HTML file must not run scripts on the dashboard's origin.
    "content-security-policy": "sandbox",
    "x-content-type-options": "nosniff",
  });
  createReadStream(resolved.path)
    .on("error", (error) => {
      console.error(`workflow-dashboard: reading ${resolved.path} failed:`, error);
      response.destroy(error);
    })
    .pipe(response);
}

function sendHtml(response: ServerResponse, html: string): void {
  response.writeHead(200, { "content-type": HTML_TYPE, "cache-control": "no-store" });
  response.end(html);
}

function sendText(response: ServerResponse, status: number, text: string): void {
  response.writeHead(status, { "content-type": TEXT_TYPE });
  response.end(text);
}

type BoundAddress = { address: string; port: number };
type ListenResult = { ok: true; bound: BoundAddress } | { ok: false; code: string };

/** Listens on `port`, or on the next free port when it is busy. Port 0 lets the OS choose. */
async function listenWithFallback(server: Server, port: number): Promise<BoundAddress> {
  for (let attempt = 0; attempt < MAX_PORT_ATTEMPTS; attempt++) {
    const candidate = port === 0 ? 0 : port + attempt;
    const result = await tryListen(server, candidate);
    if (result.ok) return result.bound;
    if (result.code !== "EADDRINUSE") throw new Error(`Cannot listen on ${HOST}:${candidate}: ${result.code}`);
  }
  throw new Error(`No free port in ${port}-${port + MAX_PORT_ATTEMPTS - 1}`);
}

function tryListen(server: Server, port: number): Promise<ListenResult> {
  return new Promise((resolve) => {
    const onError = (error: NodeJS.ErrnoException): void => {
      server.off("listening", onListening);
      resolve({ ok: false, code: error.code ?? "unknown" });
    };
    const onListening = (): void => {
      server.off("error", onError);
      const { address, port: boundPort } = server.address() as { address: string; port: number };
      resolve({ ok: true, bound: { address, port: boundPort } });
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, HOST);
  });
}
