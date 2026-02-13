// Copyright 2018-2026 the Deno authors. MIT license.

const SNAPSHOT_DIR = "__snapshots__";
const SNAPSHOT_EXT = "snap";

// --- Jest-compatible state management ---

/** State for snapshot testing, following Jest's `expect.getState()`/`expect.setState()` API. */
export interface ExpectSnapshotState {
  /** The name of the currently running test. Required for snapshot testing. */
  currentTestName?: string | undefined;
  /** The file path of the currently running test. Auto-detected from stack trace if not set. */
  testPath?: string | undefined;
}

let expectState: ExpectSnapshotState = {};

/** Sets the expect state. Used by test runners to provide test context. */
export function setState(newState: Partial<ExpectSnapshotState>): void {
  expectState = { ...expectState, ...newState };
}

/** Gets the current expect state. */
export function getState(): ExpectSnapshotState {
  return { ...expectState };
}

// --- V8 structured stack trace API ---

type V8Error = typeof Error & {
  prepareStackTrace(
    error: Error,
    structuredStackTrace: CallSite[],
  ): unknown;
};

interface CallSite {
  isEval(): boolean;
  getFileName(): string | null;
}

/**
 * Gets the test file path by walking up the call stack and finding the first
 * frame that isn't part of the expect module internals.
 */
export function getTestFileFromStack(): string | null {
  const origPrepareStackTrace = (Error as V8Error).prepareStackTrace;
  try {
    const obj: { stack: string | null } = { stack: null };
    (Error as V8Error).prepareStackTrace = (
      _err: Error,
      stack: CallSite[],
    ): string | null => {
      for (const frame of stack) {
        if (frame.isEval()) continue;
        const fileName = frame.getFileName();
        if (fileName === null) continue;
        // Skip expect module internal files
        if (
          fileName.includes("/expect/_") ||
          fileName.includes("/expect/expect.ts")
        ) {
          continue;
        }
        return fileName;
      }
      return null;
    };
    Error.captureStackTrace(obj);
    return obj.stack;
  } finally {
    (Error as V8Error).prepareStackTrace = origPrepareStackTrace;
  }
}

// --- Path utilities (minimal, avoids @std/path dependency) ---

function fileUrlToPath(url: string): string {
  if (url.startsWith("file://")) {
    return decodeURIComponent(new URL(url).pathname);
  }
  return url;
}

function dirname(path: string): string {
  const i = path.lastIndexOf("/");
  if (i <= 0) return path.charAt(0) === "/" ? "/" : ".";
  return path.substring(0, i);
}

function basename(path: string): string {
  const i = path.lastIndexOf("/");
  return i === -1 ? path : path.substring(i + 1);
}

function join(...parts: string[]): string {
  return parts.join("/");
}

// --- Serialization ---

/** Serializes a value for snapshot comparison using `Deno.inspect`. */
export function serialize(actual: unknown): string {
  return Deno.inspect(actual, {
    depth: Infinity,
    sorted: true,
    trailingComma: true,
    compact: false,
    iterableLimit: Infinity,
    strAbbreviateSize: Infinity,
    breakLength: Infinity,
    escapeSequences: false,
  }).replaceAll("\r", "\\r");
}

// --- Snapshot string escaping ---

function escapeStringForJs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$/g, "\\$");
}

function unescapeStringForJs(str: string): string {
  return str
    .replace(/\\\$/g, "$")
    .replace(/\\`/g, "`")
    .replace(/\\\\/g, "\\");
}

// --- Snapshot file parsing ---

function parseSnapshotFile(content: string): Map<string, string> {
  const snapshots = new Map<string, string>();
  const regex =
    /snapshot\[`((?:[^`\\]|\\.)*)`\]\s*=\s*`((?:[^`\\]|\\.)*)`\s*;/gs;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = unescapeStringForJs(match[1]!);
    let value = unescapeStringForJs(match[2]!);
    // Multi-line snapshots have leading/trailing newlines in the backticks
    if (value.startsWith("\n") && value.endsWith("\n")) {
      value = value.slice(1, -1);
    }
    snapshots.set(name, value);
  }
  return snapshots;
}

// --- Update mode detection ---

let _isUpdate: boolean | undefined;

export function getIsUpdate(): boolean {
  if (_isUpdate !== undefined) return _isUpdate;
  try {
    _isUpdate = Deno.args.some((arg) => arg === "--update" || arg === "-u");
  } catch {
    _isUpdate = false;
  }
  return _isUpdate;
}

// --- Snapshot Context (per snapshot file) ---

export class SnapshotContext {
  static contexts = new Map<string, SnapshotContext>();

  static fromTestFile(testFilePath: string): SnapshotContext {
    const filePath = fileUrlToPath(testFilePath);
    const dir = dirname(filePath);
    const base = basename(filePath);
    const snapshotPath = join(dir, SNAPSHOT_DIR, `${base}.${SNAPSHOT_EXT}`);

    let context = this.contexts.get(snapshotPath);
    if (context) return context;

    context = new SnapshotContext(snapshotPath);
    this.contexts.set(snapshotPath, context);
    return context;
  }

  #snapshotFilePath: string;
  #currentSnapshots: Map<string, string> | undefined;
  #updatedSnapshots = new Map<string, string>();
  #snapshotCounts = new Map<string, number>();
  #snapshotsUpdated: string[] = [];
  #snapshotUpdateQueue: string[] = [];
  #teardownRegistered = false;

  constructor(snapshotFilePath: string) {
    this.#snapshotFilePath = snapshotFilePath;
  }

  #readSnapshotFile(): Map<string, string> {
    if (this.#currentSnapshots) return this.#currentSnapshots;

    try {
      const content = Deno.readTextFileSync(this.#snapshotFilePath);
      this.#currentSnapshots = parseSnapshotFile(content);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        this.#currentSnapshots = new Map();
      } else {
        throw e;
      }
    }
    return this.#currentSnapshots;
  }

  /** Gets the snapshot count for a test name and increments it. */
  getCount(testName: string): number {
    let count = this.#snapshotCounts.get(testName) ?? 0;
    this.#snapshotCounts.set(testName, ++count);
    return count;
  }

  /** Gets an existing snapshot value by name. */
  getSnapshot(name: string): string | undefined {
    return this.#readSnapshotFile().get(name);
  }

  /** Checks if a snapshot exists by name. */
  hasSnapshot(name: string): boolean {
    return this.#readSnapshotFile().has(name);
  }

  /** Stores an updated snapshot value. Written to disk on teardown. */
  updateSnapshot(name: string, snapshot: string): void {
    if (!this.#snapshotsUpdated.includes(name)) {
      this.#snapshotsUpdated.push(name);
    }
    const current = this.#readSnapshotFile();
    if (!current.has(name)) {
      current.set(name, "");
    }
    this.#updatedSnapshots.set(name, snapshot);
  }

  /** Tracks the order of snapshots for writing the file. */
  pushToUpdateQueue(name: string): void {
    this.#snapshotUpdateQueue.push(name);
  }

  /** Registers a teardown listener to write snapshots when tests complete. */
  registerTeardown(): void {
    if (this.#teardownRegistered) return;
    globalThis.addEventListener("unload", this.#teardown);
    this.#teardownRegistered = true;
  }

  #teardown = () => {
    const currentSnapshots = this.#readSnapshotFile();
    const buf = ["export const snapshot = {};"];
    const removedNames = [...currentSnapshots.keys()].filter(
      (name) => !this.#snapshotUpdateQueue.includes(name),
    );

    for (const name of this.#snapshotUpdateQueue) {
      const updatedSnapshot = this.#updatedSnapshots.get(name);
      const currentSnapshot = currentSnapshots.get(name);
      let formattedSnapshot: string;
      if (typeof updatedSnapshot === "string") {
        formattedSnapshot = updatedSnapshot;
      } else if (typeof currentSnapshot === "string") {
        formattedSnapshot = currentSnapshot;
      } else {
        continue;
      }

      formattedSnapshot = escapeStringForJs(formattedSnapshot);
      formattedSnapshot = formattedSnapshot.includes("\n")
        ? `\n${formattedSnapshot}\n`
        : formattedSnapshot;
      const formattedName = escapeStringForJs(name);
      buf.push(`\nsnapshot[\`${formattedName}\`] = \`${formattedSnapshot}\`;`);
    }

    // Ensure snapshot directory exists
    const snapshotDir = dirname(this.#snapshotFilePath);
    try {
      Deno.mkdirSync(snapshotDir, { recursive: true });
    } catch {
      // directory already exists
    }

    Deno.writeTextFileSync(this.#snapshotFilePath, buf.join("\n") + "\n");

    const updated = this.#snapshotsUpdated.length;
    if (updated > 0) {
      // deno-lint-ignore no-console
      console.log(
        `%c\n > ${updated} ${
          updated === 1 ? "snapshot" : "snapshots"
        } updated.`,
        "color: green; font-weight: bold;",
      );
    }

    if (removedNames.length > 0) {
      // deno-lint-ignore no-console
      console.log(
        `%c\n > ${removedNames.length} ${
          removedNames.length === 1 ? "snapshot" : "snapshots"
        } removed.`,
        "color: red; font-weight: bold;",
      );
      for (const name of removedNames) {
        // deno-lint-ignore no-console
        console.log(`%c   \u2022 ${name}`, "color: red;");
      }
    }
  };
}
