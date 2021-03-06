// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// Some code adopted from https://github.com/nodejs/node/blob/master/lib/child_process.js.
// Copyright Joyent, Inc. and other Node contributors.

// This module implements 'child_process' module of Node.JS API.
// ref: https://nodejs.org/api/child_process.html
import { assert } from "../_util/assert.ts";
import { EventEmitter } from "./events.ts";
import { notImplemented } from "./_utils.ts";
import { Readable, Stream, Writable } from "./stream.ts";
import { deferred } from "../async/deferred.ts";
import { readLines } from "../io/bufio.ts";

export class ChildProcess extends EventEmitter {
  exitCode: number | null = null;
  killed = false;
  pid!: number;
  spawnargs: string[];
  spawnfile: string;

  stdin: Writable | null = null;
  stdout: Readable | null = null;
  stderr: Readable | null = null;
  stdio: [Writable | null, Readable | null, Readable | null] = [
    null,
    null,
    null,
  ];

  #process!: Deno.Process;
  #spawned = deferred<void>();

  constructor(
    command: string,
    args?: string[],
    options?: ChildProcessOptions,
  ) {
    super();

    const {
      env = {},
      stdio = ["pipe", "pipe", "pipe"],
      detached,
      uid,
      gid,
      argv0,
      shell = false,
      signal,
      serialization = "json",
      windowsHide,
      windowsVerbatimArguments,
    } = options || {};

    if (detached) {
      notImplemented("options.detached");
    }

    if (uid != null) {
      notImplemented("options.uid");
    }

    if (gid != null) {
      notImplemented("options.gid");
    }

    if (argv0 != null) {
      notImplemented("options.argv0");
    }

    if (signal != null) {
      notImplemented("options.signal");
    }

    if (serialization !== "json" && serialization != null) {
      notImplemented("options.serialization");
    }

    if (windowsHide) {
      notImplemented("options.windowsHide");
    }

    if (windowsVerbatimArguments) {
      notImplemented("options.windowsVerbatimArguments");
    }

    const [
      stdin = "pipe",
      stdout = "pipe",
      stderr = "pipe",
    ] = normalizeStdioOption(stdio);
    const cmd = buildCommand(command, args || [], shell);
    this.spawnfile = cmd[0];
    this.spawnargs = cmd;

    try {
      this.#process = Deno.run({
        cmd,
        env,
        stdin: toDenoStdio(stdin as NodeStdio | number),
        stdout: toDenoStdio(stdout as NodeStdio | number),
        stderr: toDenoStdio(stderr as NodeStdio | number),
      });
      this.pid = this.#process.pid;

      if (stdin === "pipe") {
        assert(this.#process.stdin);
        this.stdin = createWritableFromStdin(this.#process.stdin);
      }

      if (stdout === "pipe") {
        assert(this.#process.stdout);
        this.stdout = createReadableFromReader(this.#process.stdout);
      }

      if (stderr === "pipe") {
        assert(this.#process.stderr);
        this.stderr = createReadableFromReader(this.#process.stderr);
      }

      this.stdio[0] = this.stdin;
      this.stdio[1] = this.stdout;
      this.stdio[2] = this.stderr;

      queueMicrotask(() => {
        this.emit("spawn");
        this.#spawned.resolve();
      });

      (async () => {
        const status = await this.#process.status();
        this.exitCode = status.code;
        this.#spawned.then(async () => {
          // The 'exit' and 'close' events must be emitted after the 'spawn' event.
          this.emit("exit", this.exitCode, status.signal ?? null);
          this.kill();
          await this._waitForChildStreamsToClose();
          this.emit("close", this.exitCode, status.signal ?? null);
        });
      })();
    } catch (err) {
      this._handleError(err);
    }
  }

  kill(signal?: number): boolean {
    if (signal != null) {
      notImplemented("`ChildProcess.kill()` with the `signal` parameter");
    }

    if (this.killed) {
      return this.killed;
    }

    if (this.#process.stdin) {
      assert(this.stdin);
      ensureClosed(this.#process.stdin);
      this.stdin.destroy();
    }
    if (this.#process.stdout) {
      ensureClosed(this.#process.stdout);
    }
    if (this.#process.stderr) {
      ensureClosed(this.#process.stderr);
    }
    ensureClosed(this.#process); // TODO Use `Deno.Process.kill` instead when it becomes stable.
    this.killed = true;
    return this.killed;
  }

  ref(): void {
    notImplemented("ChildProcess.ref()");
  }

  unref(): void {
    notImplemented("ChildProcess.unref()");
  }

  private async _waitForChildStreamsToClose(): Promise<void> {
    const promises = [] as Array<Promise<void>>;
    if (this.stdin && !this.stdin.destroyed) {
      const promise = deferred<void>();
      this.stdin.once("close", () => promise.resolve());
      promises.push(promise);
    }
    if (this.stdout && !this.stdout.destroyed) {
      const promise = deferred<void>();
      this.stdout.resume();
      this.stdout.once("close", () => promise.resolve());
      promises.push(promise);
    }
    if (this.stderr && !this.stderr.destroyed) {
      const promise = deferred<void>();
      this.stderr.resume();
      this.stderr.once("close", () => promise.resolve());
      promises.push(promise);
    }
    await Promise.all(promises);
  }

  private _handleError(err: Error): void {
    queueMicrotask(() => {
      this.emit("error", err); // TODO(uki00a) Convert `err` into nodejs's `SystemError` class.
    });
  }
}

const supportedNodeStdioTypes: NodeStdio[] = ["pipe", "ignore", "inherit"];
function toDenoStdio(
  pipe: NodeStdio | number | Stream | null | undefined,
): DenoStdio {
  if (
    !supportedNodeStdioTypes.includes(pipe as NodeStdio) ||
    typeof pipe === "number" || pipe instanceof Stream
  ) {
    notImplemented();
  }
  switch (pipe) {
    case "pipe":
    case undefined:
    case null:
      return "piped";
    case "ignore":
      return "null";
    case "inherit":
      return "inherit";
    default:
      notImplemented();
  }
}

type NodeStdio = "pipe" | "overlapped" | "ignore" | "inherit";
type DenoStdio = "inherit" | "piped" | "null";

interface ChildProcessOptions {
  cwd?: string;
  env?: Record<string, string>;
  /**
   * @see https://nodejs.org/api/child_process.html#child_process_options_stdio
   */
  stdio?: Array<NodeStdio | number | Stream | null | undefined> | NodeStdio;
  detached?: boolean;
  uid?: number;
  gid?: number;
  argv0?: string;
  shell?: string | boolean;
  signal?: AbortSignal;
  serialization?: "json" | "advanced";
  windowsVerbatimArguments?: boolean;
  windowsHide?: boolean;
}

// deno-lint-ignore no-empty-interface
interface SpawnOptions extends ChildProcessOptions {}

export function spawn(command: string): ChildProcess;
export function spawn(command: string, options: SpawnOptions): ChildProcess;
export function spawn(command: string, args: string[]): ChildProcess;
export function spawn(
  command: string,
  args: string[],
  options: SpawnOptions,
): ChildProcess;
export function spawn(
  command: string,
  argsOrOptions?: string[] | SpawnOptions,
  maybeOptions?: SpawnOptions,
): ChildProcess {
  const args = Array.isArray(argsOrOptions) ? argsOrOptions : [];
  const options = !Array.isArray(argsOrOptions) && argsOrOptions != null
    ? argsOrOptions
    : maybeOptions;
  return new ChildProcess(command, args, options);
}

export default { spawn };

function ensureClosed(closer: Deno.Closer): void {
  try {
    closer.close();
  } catch (err) {
    if (isAlreadyClosed(err)) {
      return;
    }
    throw err;
  }
}

function isAlreadyClosed(err: unknown): boolean {
  return err instanceof Deno.errors.BadResource;
}

async function* readLinesSafely(
  reader: Deno.Reader,
): AsyncIterableIterator<string> {
  try {
    for await (const line of readLines(reader)) {
      yield line;
    }
  } catch (err) {
    if (isAlreadyClosed(err)) {
      return;
    }
    throw err;
  }
}

function createReadableFromReader(
  reader: Deno.Reader,
): Readable {
  return Readable.from(readLinesSafely(reader), {
    objectMode: false,
  });
}

function createWritableFromStdin(stdin: Deno.Closer & Deno.Writer): Writable {
  const encoder = new TextEncoder();
  return new Writable({
    async write(chunk, _, callback) {
      try {
        const bytes = encoder.encode(chunk);
        await stdin.write(bytes);
        callback();
      } catch (err) {
        callback(err);
      }
    },
    final(callback) {
      try {
        ensureClosed(stdin);
      } catch (err) {
        callback(err);
      }
    },
  });
}

function normalizeStdioOption(
  stdio: Array<NodeStdio | number | null | undefined | Stream> | NodeStdio = [
    "pipe",
    "pipe",
    "pipe",
  ],
) {
  if (Array.isArray(stdio)) {
    if (stdio.length > 3) {
      notImplemented();
    } else {
      return stdio;
    }
  } else {
    switch (stdio) {
      case "overlapped":
        if (Deno.build.os === "windows") {
          notImplemented();
        }
        // 'overlapped' is same as 'piped' on non Windows system.
        return ["pipe", "pipe", "pipe"];
      case "pipe":
        return ["pipe", "pipe", "pipe"];
      case "inherit":
        return ["inherit", "inherit", "inherit"];
      case "ignore":
        return ["ignore", "ignore", "ignore"];
      default:
        notImplemented();
    }
  }
}

function buildCommand(
  file: string,
  args: string[],
  shell?: string | boolean,
): string[] {
  if (shell) {
    const command = [file, ...args].join(" ");
    // Set the shell, switches, and commands.
    if (Deno.build.os === "windows") {
      if (typeof shell === "string") {
        file = shell;
      } else {
        file = Deno.env.get("comspec") || "cmd.exe";
      }
      // '/d /s /c' is used only for cmd.exe.
      if (/^(?:.*\\)?cmd(?:\.exe)?$/i.test(file)) {
        args = ["/d", "/s", "/c", `"${command}"`];
        // TODO(uki00a): Add support for `windowsVerbatimArguments`.
        // windowsVerbatimArguments = true;
      } else {
        args = ["-c", command];
      }
    } else {
      if (typeof shell === "string") {
        file = shell;
      } else {
        file = "/bin/sh";
      }
      args = ["-c", command];
    }
  }
  return [file, ...args];
}
