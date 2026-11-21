import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { get, type OutgoingHttpHeaders } from "node:http";
import { createServer, type Server } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startServer, type RunningServer } from "../src/server.ts";

const CHANGE_TIMEOUT_MS = 2000;
const CONNECTED_MARKER = ": connected";

let projectRoot: string;
let running: RunningServer | undefined;

function server(): RunningServer {
  assert.ok(running, "server did not start");
  return running;
}

before(async () => {
  projectRoot = mkdtempSync(join(tmpdir(), "wd-server-"));
  const featureDir = join(projectRoot, ".claude", "workflow", "alpha");
  mkdirSync(featureDir, { recursive: true });
  writeFileSync(join(featureDir, "STATE.md"), "## 2026-11-21 — Inc — Phase: Spec\n\n**Status:** awaiting-validation\n");
  mkdirSync(join(projectRoot, "docs"));
  writeFileSync(join(projectRoot, "docs", "a.svg"), "<svg xmlns='http://www.w3.org/2000/svg'/>");
  running = await startServer({ projectRoot, port: 0 });
});

after(async () => {
  try {
    await running?.close();
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});

test("the socket is bound to 127.0.0.1 only", () => {
  // Assert
  assert.equal(server().address, "127.0.0.1");
  assert.match(server().url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
});

test("GET / serves the full page and GET /fragment the swappable body", async () => {
  // Act
  const page = await fetch(server().url);
  const fragment = await fetch(new URL("/fragment", server().url));

  // Assert
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") ?? "", /^text\/html/);
  assert.match(await page.text(), /<!doctype html>[\s\S]*alpha/);
  assert.equal(fragment.status, 200);
  assert.doesNotMatch(await fragment.text(), /<!doctype html>/);
});

test("a request with a foreign Host header is refused (DNS rebinding)", async () => {
  // Act
  const foreign = await rawGet("/", { host: `attacker.example:${server().port}` });
  const localhost = await rawGet("/", { host: `localhost:${server().port}` });

  // Assert
  assert.equal(foreign, 403);
  assert.equal(localhost, 200);
});

test("a non-GET request is refused with 405", async () => {
  // Act
  const response = await fetch(server().url, { method: "POST" });

  // Assert
  assert.equal(response.status, 405);
});

test("GET /files serves a project file with a sandboxing CSP", async () => {
  // Act
  const response = await fetch(new URL("/files/docs/a.svg", server().url));

  // Assert
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/svg+xml");
  assert.equal(response.headers.get("content-security-policy"), "sandbox");
});

test("GET /files refuses a path escaping the project with 403", async () => {
  // Act: fetch() normalizes dot segments, so send raw request paths instead
  const plain = await rawGet("/files/../secret.txt");
  const encoded = await rawGet("/files/..%2fsecret.txt");

  // Assert
  assert.equal(plain, 403);
  assert.equal(encoded, 403);
});

test("GET /files of a missing file or a folder is 404, an unknown route is 404", async () => {
  // Act
  const missing = await fetch(new URL("/files/docs/missing.svg", server().url));
  const folder = await fetch(new URL("/files/docs", server().url));
  const unknown = await fetch(new URL("/nope", server().url));

  // Assert
  assert.equal(missing.status, 404);
  assert.equal(folder.status, 404);
  assert.equal(unknown.status, 404);
});

test("a write under .claude/workflow pushes a changed event", async () => {
  // Arrange
  const controller = new AbortController();
  const response = await fetch(new URL("/events", server().url), { signal: controller.signal });
  const reader = response.body!.getReader();
  const notesPath = join(projectRoot, ".claude", "workflow", "alpha", "notes.md");
  try {
    assert.equal(await readUntil(reader, CONNECTED_MARKER, CHANGE_TIMEOUT_MS), true);

    // Act
    writeFileSync(notesPath, "touched\n");

    // Assert
    assert.equal(await readUntil(reader, "event: changed", CHANGE_TIMEOUT_MS), true);
  } finally {
    controller.abort();
    rmSync(notesPath, { force: true });
  }
});

test("a busy port falls back to the next free one", async () => {
  // Arrange
  const blocker = await listenOnFreePort();
  let fallback: RunningServer | undefined;
  try {
    const busyPort = (blocker.address() as { port: number }).port;

    // Act
    fallback = await startServer({ projectRoot, port: busyPort });

    // Assert
    assert.ok(fallback.port > busyPort);
  } finally {
    await fallback?.close();
    blocker.close();
  }
});

function rawGet(path: string, headers: OutgoingHttpHeaders = {}): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    get({ host: "127.0.0.1", port: server().port, path, headers }, (response) => {
      response.resume();
      resolve(response.statusCode);
    }).on("error", reject);
  });
}

async function readUntil(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  marker: string,
  timeoutMs: number,
): Promise<boolean> {
  const decoder = new TextDecoder();
  let text = "";
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const chunk = await Promise.race([
      reader.read(),
      new Promise<undefined>((resolve) => setTimeout(resolve, deadline - Date.now())),
    ]);
    if (chunk === undefined || chunk.done) return false;
    text += decoder.decode(chunk.value);
    if (text.includes(marker)) return true;
  }
  return false;
}

function listenOnFreePort(): Promise<Server> {
  return new Promise((resolve) => {
    const blocker = createServer();
    blocker.listen(0, "127.0.0.1", () => resolve(blocker));
  });
}
