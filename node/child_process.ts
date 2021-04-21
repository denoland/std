// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// This module implements 'child_process' module of Node.JS API.
// ref: https://nodejs.org/api/child_process.html
import { assert } from "../_util/assert.ts";
import { EventEmitter } from "./events.ts";
import { notImplemented } from "./_utils.ts";
import { Readable, Stream, Writable } from "./stream.ts";
import { deferred } from "../async/deferred.ts";
import { readLines } from "../io/bufio.ts";

export class ChildProcess extends EventEmitter {
  /**
   * The exit code of the child process. This property will be `null` until the child process exits.
   */
  exitCode: number | null = null;

  /**
   * This property is set to `true` after `kill()` is called.
   */
  killed = false;

  /**
   * The PID of this child process.
   */
  pid!: number;

  /**
   * Command line arguments given to this child process.
   */
  spawnargs: string[];

  /**
   * The executable file name of this child process.
   */
  spawnfile: string;

  /**
   * This property represents the child process's stdin.
   */
  stdin: Writable | null = null;

  /**
   * This property represents the child process's stdout.
   */
  stdout: Readable | null = null;

  /**
   * This property represents the child process's stderr.
   */
  stderr: Readable | null = null;

  /**
   * Pipes to this child process.
   */
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
      shell = false,
    } = options || {};

    const [
      stdin = "pipe",
      stdout = "pipe",
      stderr = "pipe",
    ] = normalizeStdioOption(stdio);
    const cmd = buildCommand(
      command,
      args || [],
      shell,
    );
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
          await this._waitForChildStreamsToClose();
          this.kill();
          this.emit("close", this.exitCode, status.signal ?? null);
        });
      })();
    } catch (err) {
      this._handleError(err);
    }
  }

  /**
   * @param signal NOTE: this parameter is not yet implemented.
   */
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
      assert(this.stdin);
      this.stdin.destroy();
      promises.push(waitForStreamToClose(this.stdin));
    }
    if (this.stdout && !this.stdout.destroyed) {
      promises.push(waitForReadableToClose(this.stdout));
    }
    if (this.stderr && !this.stderr.destroyed) {
      promises.push(waitForReadableToClose(this.stderr));
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
  /**
   * Current working directory of the child process.
   */
  cwd?: string;

  /**
   * Environment variables passed to the child process.
   */
  env?: Record<string, string>;

  /**
   * This option defines child process's stdio configuration.
   * @see https://nodejs.org/api/child_process.html#child_process_options_stdio
   */
  stdio?: Array<NodeStdio | number | Stream | null | undefined> | NodeStdio;

  /**
   * NOTE: This option is not yet implemented.
   */
  detached?: boolean;

  /**
   * NOTE: This option is not yet implemented.
   */
  uid?: number;

  /**
   * NOTE: This option is not yet implemented.
   */
  gid?: number;

  /**
   * NOTE: This option is not yet implemented.
   */
  argv0?: string;

  /**
   * * If this option is `true`, run the command in the shell.
   * * If this option is a string, run the command in the specified shell.
   */
  shell?: string | boolean;

  /**
   * NOTE: This option is not yet implemented.
   */
  signal?: AbortSignal;

  /**
   * NOTE: This option is not yet implemented.
   */
  serialization?: "json" | "advanced";

  /**
   * NOTE: This option is not yet implemented.
   * 
   * @see https://github.com/rust-lang/rust/issues/29494
   * @see https://github.com/denoland/deno/issues/8852
   */
  windowsVerbatimArguments?: boolean;

  /**
   * NOTE: This option is not yet implemented.
   */
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
/**
 * Spawns a child process using `command`.
 */
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
      yield line.length === 0 ? line : line + "\n";
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
  // TODO(uki00a): This could probably be more efficient.
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

function waitForReadableToClose(readable: Readable): Promise<void> {
  readable.resume(); // Ensure bufferred data will be consumed.
  return waitForStreamToClose(readable);
}

function waitForStreamToClose(stream: Stream): Promise<void> {
  const promise = deferred<void>();
  const cleanup = () => {
    stream.removeListener("close", onClose);
    stream.removeListener("error", onError);
  };
  const onClose = () => {
    cleanup();
    promise.resolve();
  };
  const onError = (err: Error) => {
    cleanup();
    promise.reject(err);
  };
  stream.once("close", onClose);
  stream.once("error", onError);
  return promise;
}

/**
 * This function is based on https://github.com/nodejs/node/blob/fc6426ccc4b4cb73076356fb6dbf46a28953af01/lib/child_process.js#L504-L528.
 * Copyright Joyent, Inc. and other Node contributors. All rights reserved. MIT license.
 */
function buildCommand(
  file: string,
  args: string[],
  shell: string | boolean,
): string[] {
  const command = [file, ...args].join(" ");
  if (shell) {
    // Set the shell, switches, and commands.
    if (Deno.build.os === "windows") {
      // TODO(uki00a): Currently, due to escaping issues, it is difficult to reproduce the same behavior as Node.js's `child_process` module.
      // For more details, see the following issues:
      // * https://github.com/rust-lang/rust/issues/29494
      // * https://github.com/denoland/deno/issues/8852
      if (typeof shell === "string") {
        file = shell;
      } else {
        file = Deno.env.get("comspec") || "cmd.exe";
      }
      // '/d /s /c' is used only for cmd.exe.
      if (/^(?:.*\\)?cmd(?:\.exe)?$/i.test(file)) {
        args = ["/d", "/s", "/c", `"${command}"`];
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
