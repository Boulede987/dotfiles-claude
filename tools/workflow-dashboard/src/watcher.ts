import { existsSync, watch, type FSWatcher } from "node:fs";

const DEBOUNCE_MS = 200;
const MISSING_DIR_POLL_MS = 2000;

export type Unsubscribe = () => void;

/**
 * Calls `onChange` (debounced) whenever anything under `dir` changes. While `dir`
 * is missing or cannot be watched, polls until it can. Watch errors are logged to
 * the terminal running the dashboard; they never stop the process.
 */
export function watchWorkflow(dir: string, onChange: () => void): Unsubscribe {
  const workflowWatcher = new WorkflowWatcher(dir, onChange);
  workflowWatcher.start();
  return () => workflowWatcher.stop();
}

class WorkflowWatcher {
  private debounceTimer: NodeJS.Timeout | undefined;
  private pollTimer: NodeJS.Timeout | undefined;
  private watcher: FSWatcher | undefined;
  private stopped = false;
  private readonly dir: string;
  private readonly onChange: () => void;

  // Plain assignments: Node's type stripping does not support constructor parameter properties.
  constructor(dir: string, onChange: () => void) {
    this.dir = dir;
    this.onChange = onChange;
  }

  start(): void {
    if (this.stopped) return;
    if (!existsSync(this.dir)) return this.pollUntilPresent();
    try {
      this.watcher = watch(this.dir, { recursive: true }, () => this.notify());
    } catch (error) {
      return this.recoverFrom(error);
    }
    this.watcher.on("error", (error) => this.recoverFrom(error));
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.debounceTimer);
    clearInterval(this.pollTimer);
    this.watcher?.close();
  }

  private notify(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(this.onChange, DEBOUNCE_MS);
  }

  private recoverFrom(error: unknown): void {
    console.error(`workflow-dashboard: watching ${this.dir} failed (${String(error)}); polling until it is back.`);
    this.notify();
    this.pollUntilPresent();
  }

  private pollUntilPresent(): void {
    this.watcher?.close();
    this.watcher = undefined;
    clearInterval(this.pollTimer);
    this.pollTimer = setInterval(() => {
      if (!existsSync(this.dir)) return;
      clearInterval(this.pollTimer);
      this.start();
      this.notify();
    }, MISSING_DIR_POLL_MS);
  }
}
