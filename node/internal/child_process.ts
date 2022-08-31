// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// This module implements 'child_process' module of Node.JS API.
// ref: https://nodejs.org/api/child_process.html
import { assert } from "../../_util/assert.ts";
import { EventEmitter } from "../events.ts";
import { os } from "../internal_binding/constants.ts";
import { notImplemented } from "../_utils.ts";
import { Readable, Stream, Writable } from "../stream.ts";
import { deferred } from "../../async/deferred.ts";
import { isWindows } from "../../_util/os.ts";
import { nextTick } from "../_next_tick.ts";
import {
  AbortError,
  ERR_INVALID_ARG_VALUE,
  ERR_UNKNOWN_SIGNAL,
} from "./errors.ts";
import { mapValues } from "../../collections/map_values.ts";

type NodeStdio = "pipe" | "overlapped" | "ignore" | "inherit" | "ipc";
type DenoStdio = "inherit" | "piped" | "null";

export function stdioStringToArray(
  stdio: NodeStdio,
  channel: NodeStdio | number,
) {
  const options: (NodeStdio | number)[] = [];

  switch (stdio) {
    case "ignore":
    case "overlapped":
    case "pipe":
      options.push(stdio, stdio, stdio);
      break;
    case "inherit":
      options.push(stdio, stdio, stdio);
      break;
    default:
      throw new ERR_INVALID_ARG_VALUE("stdio", stdio);
  }

  if (channel) options.push(channel);

  return options;
}

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
   * The signal received by this child process.
   */
  signalCode: string | null = null;

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

  #process!: Deno.Child;
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
      signal,
    } = options || {};
    const [
      stdin = "pipe",
      stdout = "pipe",
      stderr = "pipe",
      _channel, // TODO(kt3k): handle this correctly
    ] = normalizeStdioOption(stdio);
    const [cmd, cmdArgs] = buildCommand(
      command,
      args || [],
      shell,
    );
    this.spawnfile = cmd;
    this.spawnargs = [cmd, ...cmdArgs];

    const stringEnv = mapValues(env, (value) => value.toString());

    try {
      this.#process = Deno.spawnChild(cmd, {
        args: cmdArgs,
        env: stringEnv,
        stdin: toDenoStdio(stdin as NodeStdio | number),
        stdout: toDenoStdio(stdout as NodeStdio | number),
        stderr: toDenoStdio(stderr as NodeStdio | number),
      });
      this.pid = this.#process.pid;

      if (stdin === "pipe") {
        assert(this.#process.stdin);
        this.stdin = Writable.fromWeb(this.#process.stdin);
      }

      if (stdout === "pipe") {
        assert(this.#process.stdout);
        this.stdout = Readable.fromWeb(this.#process.stdout);
      }

      if (stderr === "pipe") {
        assert(this.#process.stderr);
        this.stderr = Readable.fromWeb(this.#process.stderr);
      }

      this.stdio[0] = this.stdin;
      this.stdio[1] = this.stdout;
      this.stdio[2] = this.stderr;

      nextTick(() => {
        this.emit("spawn");
        this.#spawned.resolve();
      });

      if (signal) {
        const onAbortListener = () => {
          try {
            if (this.kill("SIGKILL")) {
              this.emit("error", new AbortError());
            }
          } catch (err) {
            this.emit("error", err);
          }
        };
        if (signal.aborted) {
          nextTick(onAbortListener);
        } else {
          signal.addEventListener("abort", onAbortListener, { once: true });
          this.addListener(
            "exit",
            () => signal.removeEventListener("abort", onAbortListener),
          );
        }
      }

      (async () => {
        const status = await this.#process.status;
        this.exitCode = status.code;
        this.#spawned.then(async () => {
          const exitCode = this.signalCode == null ? this.exitCode : null;
          const signalCode = this.signalCode == null ? null : this.signalCode;
          // The 'exit' and 'close' events must be emitted after the 'spawn' event.
          this.emit("exit", exitCode, signalCode);
          await this.#_waitForChildStreamsToClose();
          this.#closePipes();
          this.emit("close", exitCode, signalCode);
        });
      })();
    } catch (err) {
      this.#_handleError(err);
    }
  }

  /**
   * @param signal NOTE: this parameter is not yet implemented.
   */
  kill(signal?: number | string): boolean {
    if (this.killed) {
      return this.killed;
    }

    const denoSignal = signal == null ? "SIGTERM" : toDenoSignal(signal);
    this.#closePipes();
    try {
      this.#process.kill(denoSignal);
    } catch (err) {
      const alreadyClosed = err instanceof TypeError ||
        err instanceof Deno.errors.PermissionDenied;
      if (!alreadyClosed) {
        throw err;
      }
    }
    this.killed = true;
    this.signalCode = denoSignal;
    return this.killed;
  }

  ref() {
    this.#process.ref();
  }

  unref() {
    this.#process.unref();
  }

  async #_waitForChildStreamsToClose() {
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

  #_handleError(err: unknown) {
    nextTick(() => {
      this.emit("error", err); // TODO(uki00a) Convert `err` into nodejs's `SystemError` class.
    });
  }

  #closePipes() {
    if (this.stdin) {
      assert(this.stdin);
      this.stdin.destroy();
    }
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
    notImplemented(`toDenoStdio pipe=${typeof pipe} (${pipe})`);
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
      notImplemented(`toDenoStdio pipe=${typeof pipe} (${pipe})`);
  }
}

function toDenoSignal(signal: number | string): Deno.Signal {
  if (typeof signal === "number") {
    for (const name of keys(os.signals)) {
      if (os.signals[name] === signal) {
        return name as Deno.Signal;
      }
    }
    throw new ERR_UNKNOWN_SIGNAL(String(signal));
  }

  const denoSignal = signal as Deno.Signal;
  if (os.signals[denoSignal] != null) {
    return denoSignal;
  }
  throw new ERR_UNKNOWN_SIGNAL(signal);
}

function keys<T extends Record<string, unknown>>(object: T): Array<keyof T> {
  return Object.keys(object);
}

export interface ChildProcessOptions {
  /**
   * Current working directory of the child process.
   */
  cwd?: string;

  /**
   * Environment variables passed to the child process.
   */
  env?: Record<string, string | number | boolean>;

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
   * Allows aborting the child process using an AbortSignal.
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

function normalizeStdioOption(
  stdio: Array<NodeStdio | number | null | undefined | Stream> | NodeStdio = [
    "pipe",
    "pipe",
    "pipe",
  ],
) {
  if (Array.isArray(stdio)) {
    return stdio;
  } else {
    switch (stdio) {
      case "overlapped":
        if (isWindows) {
          notImplemented("normalizeStdioOption overlapped (on windows)");
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
        notImplemented(`normalizeStdioOption stdio=${typeof stdio} (${stdio})`);
    }
  }
}

function waitForReadableToClose(readable: Readable) {
  readable.resume(); // Ensure buffered data will be consumed.
  return waitForStreamToClose(readable as unknown as Stream);
}

function waitForStreamToClose(stream: Stream) {
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
): [string, string[]] {
  const command = [file, ...args].join(" ");
  if (shell) {
    // Set the shell, switches, and commands.
    if (isWindows) {
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
  return [file, args];
}
