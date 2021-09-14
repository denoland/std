// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { notImplemented } from "./_utils.ts";
import { EventEmitter } from "./events.ts";
import { fromFileUrl } from "../path/mod.ts";
import { isWindows } from "../_util/os.ts";
import { Readable, Writable } from "./stream.ts";
import { Buffer } from "./buffer.ts";

const notImplementedEvents = [
  "beforeExit",
  "disconnect",
  "message",
  "multipleResolves",
  "rejectionHandled",
  "SIGBREAK",
  "SIGBUS",
  "SIGFPE",
  "SIGHUP",
  "SIGILL",
  "SIGINT",
  "SIGSEGV",
  "SIGTERM",
  "SIGWINCH",
  "uncaughtException",
  "uncaughtExceptionMonitor",
  "unhandledRejection",
];

/** https://nodejs.org/api/process.html#process_process_arch */
export const arch = Deno.build.arch;

// The first 2 items are placeholders.
// They will be overwritten by the below Object.defineProperty calls.
const argv = ["", "", ...Deno.args];
// Overwrites the 1st item with getter.
Object.defineProperty(argv, "0", { get: Deno.execPath });
// Overwrites the 2st item with getter.
Object.defineProperty(argv, "1", { get: () => fromFileUrl(Deno.mainModule) });

/** https://nodejs.org/api/process.html#process_process_chdir_directory */
export const chdir = Deno.chdir;

/** https://nodejs.org/api/process.html#process_process_cwd */
export const cwd = Deno.cwd;

/**
 * https://nodejs.org/api/process.html#process_process_env
 * Requires env permissions
 */
export const env: Record<string, string> = new Proxy({}, {
  get(_target, prop) {
    return Deno.env.get(String(prop));
  },
  ownKeys: () => Reflect.ownKeys(Deno.env.toObject()),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  set(_target, prop, value) {
    Deno.env.set(String(prop), String(value));
    return value;
  },
});

/** https://nodejs.org/api/process.html#process_process_exit_code */
export const exit = Deno.exit;

/** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */
export function nextTick(this: unknown, cb: () => void): void;
export function nextTick<T extends Array<unknown>>(
  this: unknown,
  cb: (...args: T) => void,
  ...args: T
): void;
export function nextTick<T extends Array<unknown>>(
  this: unknown,
  cb: (...args: T) => void,
  ...args: T
) {
  if (args) {
    queueMicrotask(() => cb.call(this, ...args));
  } else {
    queueMicrotask(cb);
  }
}

/** https://nodejs.org/api/process.html#process_process_pid */
export const pid = Deno.pid;

/** https://nodejs.org/api/process.html#process_process_platform */
export const platform = isWindows ? "win32" : Deno.build.os;

/** https://nodejs.org/api/process.html#process_process_version */
export const version = `v${Deno.version.deno}`;

/** https://nodejs.org/api/process.html#process_process_versions */
export const versions = {
  node: Deno.version.deno,
  ...Deno.version,
};

interface _Readable extends Readable {
  get isTTY(): true | undefined;
  destroySoon: Readable["destroy"];
  fd: number;
  _isStdio: undefined;
}

interface _Writable extends Writable {
  get isTTY(): true | undefined;
  get columns(): number | undefined;
  get rows(): number | undefined;
  getWindowSize(): [columns: number, rows: number] | undefined;
  destroySoon: Writable["destroy"];
  fd: number;
  _isStdio: true;
}

// https://github.com/nodejs/node/blob/00738314828074243c9a52a228ab4c68b04259ef/lib/internal/bootstrap/switches/is_main_thread.js#L41
function createWritableStdioStream(writer: typeof Deno.stdout): _Writable {
  const stream = new Writable({
    write(buf: Uint8Array, enc: string, cb) {
      writer.writeSync(buf instanceof Uint8Array ? buf : Buffer.from(buf, enc));
      cb();
    },
    destroy(err, cb) {
      cb(err);
      this._undestroy();
      if (!this._writableState.emitClose) {
        queueMicrotask(() => this.emit("close"));
      }
    },
  }) as _Writable;
  stream.fd = writer.rid;
  stream.destroySoon = stream.destroy;
  stream._isStdio = true;
  stream.once("close", () => writer.close());
  Object.defineProperties(stream, {
    columns: {
      enumerable: true,
      configurable: true,
      get: () =>
        Deno.isatty(writer.rid)
          ? Deno.consoleSize(writer.rid).columns
          : undefined,
    },
    rows: {
      enumerable: true,
      configurable: true,
      get: () =>
        Deno.isatty(writer.rid) ? Deno.consoleSize(writer.rid).rows : undefined,
    },
    isTTY: {
      enumerable: true,
      configurable: true,
      get: () => Deno.isatty(writer.rid),
    },
    getWindowSize: {
      enumerable: true,
      configurable: true,
      value: () =>
        Deno.isatty(writer.rid)
          ? Object.values(Deno.consoleSize(writer.rid))
          : undefined,
    },
  });
  return stream;
}

/** https://nodejs.org/api/process.html#process_process_stderr */
export const stderr = createWritableStdioStream(Deno.stderr);

/** https://nodejs.org/api/process.html#process_process_stdin */
export const stdin = new Readable({
  read(this: Readable, size: number) {
    const p = Buffer.alloc(size || 16 * 1024);
    const length = Deno.stdin.readSync(p);
    this.push(length === null ? null : p.slice(0, length));
  },
}) as _Readable;
stdin.on("close", () => Deno.stdin.close());
stdin.fd = Deno.stdin.rid;
Object.defineProperty(stdin, "isTTY", {
  enumerable: true,
  configurable: true,
  get() {
    return Deno.isatty(Deno.stdin.rid);
  },
});

/** https://nodejs.org/api/process.html#process_process_stdout */
export const stdout = createWritableStdioStream(Deno.stdout);

class Process extends EventEmitter {
  constructor() {
    super();

    //This causes the exit event to be binded to the unload event
    window.addEventListener("unload", () => {
      //TODO(Soremwar)
      //Get the exit code from the unload event
      super.emit("exit", 0);
    });
  }

  /** https://nodejs.org/api/process.html#process_process_arch */
  arch = arch;

  /**
   * https://nodejs.org/api/process.html#process_process_argv
   * Read permissions are required in order to get the executable route
   */
  argv = argv;

  /** https://nodejs.org/api/process.html#process_process_chdir_directory */
  chdir = chdir;

  /** https://nodejs.org/api/process.html#process_process_cwd */
  cwd = cwd;

  /** https://nodejs.org/api/process.html#process_process_exit_code */
  exit = exit;

  /**
   * https://nodejs.org/api/process.html#process_process_env
   * Requires env permissions
   */
  env = env;

  /** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */
  nextTick = nextTick;

  /** https://nodejs.org/api/process.html#process_process_events */
  //deno-lint-ignore ban-types
  on(event: typeof notImplementedEvents[number], listener: Function): never;
  on(event: "exit", listener: (code: number) => void): this;
  //deno-lint-ignore no-explicit-any
  on(event: string, listener: (...args: any[]) => void): this {
    if (notImplementedEvents.includes(event)) {
      notImplemented();
    }

    super.on(event, listener);

    return this;
  }

  /** https://nodejs.org/api/process.html#process_process_pid */
  pid = pid;

  /** https://nodejs.org/api/process.html#process_process_platform */
  platform = platform;

  removeAllListeners(_event: string): never {
    notImplemented();
  }

  removeListener(
    event: typeof notImplementedEvents[number],
    //deno-lint-ignore ban-types
    listener: Function,
  ): never;
  removeListener(event: "exit", listener: (code: number) => void): this;
  //deno-lint-ignore no-explicit-any
  removeListener(event: string, listener: (...args: any[]) => void): this {
    if (notImplementedEvents.includes(event)) {
      notImplemented();
    }

    super.removeListener("exit", listener);

    return this;
  }

  /**
   * Returns the current high-resolution real time in a [seconds, nanoseconds]
   * tuple.
   *
   * Note: You need to give --allow-hrtime permission to Deno to actually get
   * nanoseconds precision values. If you don't give 'hrtime' permission, the returned
   * values only have milliseconds precision.
   *
   * `time` is an optional parameter that must be the result of a previous process.hrtime() call to diff with the current time.
   *
   * These times are relative to an arbitrary time in the past, and not related to the time of day and therefore not subject to clock drift. The primary use is for measuring performance between intervals.
   * https://nodejs.org/api/process.html#process_process_hrtime_time
   */
  hrtime(time?: [number, number]): [number, number] {
    const milli = performance.now();
    const sec = Math.floor(milli / 1000);
    const nano = Math.floor(milli * 1_000_000 - sec * 1_000_000_000);
    if (!time) {
      return [sec, nano];
    }
    const [prevSec, prevNano] = time;
    return [sec - prevSec, nano - prevNano];
  }

  /** https://nodejs.org/api/process.html#process_process_stderr */
  stderr = stderr;

  /** https://nodejs.org/api/process.html#process_process_stdin */
  stdin = stdin;

  /** https://nodejs.org/api/process.html#process_process_stdout */
  stdout = stdout;

  /** https://nodejs.org/api/process.html#process_process_version */
  version = version;

  /** https://nodejs.org/api/process.html#process_process_versions */
  versions = versions;
}

/** https://nodejs.org/api/process.html#process_process */
const process = new Process();

Object.defineProperty(process, Symbol.toStringTag, {
  enumerable: false,
  writable: true,
  configurable: false,
  value: "process",
});

export const removeListener = process.removeListener;
export const removeAllListeners = process.removeAllListeners;

export default process;

//TODO(Soremwar)
//Remove on 1.0
//Kept for backwards compatibility with std
export { process };
