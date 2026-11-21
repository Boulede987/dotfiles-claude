import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { startServer, type RunningServer, type ServerOptions } from "./server.ts";

const DEFAULT_PORT = 4317;
const MIN_PORT = 1;
const MAX_PORT = 65535;
const USAGE = "Usage: workflow-dashboard [project-path] [--port <number>]";

/** A command-line mistake; the entry script prints its message and exits with status 1. */
export class UsageError extends Error {}

export async function main(argv: string[]): Promise<void> {
  const options = parseOptions(argv);
  const running = await startServer(options);
  announce(options.projectRoot, running.url);
  openBrowser(running.url);
  stopOnInterrupt(running);
}

export function parseOptions(argv: string[]): ServerOptions {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { port: { type: "string" } },
    allowPositionals: true,
  });
  if (positionals.length > 1) throw new UsageError(`Expected at most one project path.\n${USAGE}`);
  return { projectRoot: toProjectRoot(positionals[0]), port: toPort(values.port) };
}

function toProjectRoot(path: string | undefined): string {
  const projectRoot = resolve(path ?? process.cwd());
  if (!existsSync(projectRoot)) throw new UsageError(`Project path not found: ${projectRoot}`);
  return projectRoot;
}

function toPort(value: string | undefined): number {
  if (value === undefined) return DEFAULT_PORT;
  const port = Number(value);
  if (!Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new UsageError(`Invalid --port: ${value}\n${USAGE}`);
  }
  return port;
}

function announce(projectRoot: string, url: string): void {
  console.log(`Workflow dashboard for ${projectRoot}`);
  console.log(`  ${url}  (Ctrl+C to stop)`);
}

function openBrowser(url: string): void {
  const [command, args] =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", url]]
    : process.platform === "darwin" ? ["open", [url]]
    : ["xdg-open", [url]];
  // Best effort: the URL is already printed, so a failed opener only gets a note.
  spawn(command, args, { detached: true, stdio: "ignore" })
    .on("error", (error) => console.error(`Could not open a browser (${error.message}); open the URL above.`))
    .unref();
}

function stopOnInterrupt(running: RunningServer): void {
  process.once("SIGINT", () => {
    running.close().finally(() => process.exit(0));
  });
}
