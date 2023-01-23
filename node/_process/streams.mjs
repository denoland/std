// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { Buffer } from "../buffer.ts";
import {
  clearLine,
  clearScreenDown,
  cursorTo,
  moveCursor,
} from "../internal/readline/callbacks.mjs";
import { Duplex, Readable, Writable } from "../stream.ts";
import { stdio } from "./stdio.mjs";

// https://github.com/nodejs/node/blob/00738314828074243c9a52a228ab4c68b04259ef/lib/internal/bootstrap/switches/is_main_thread.js#L41
function createWritableStdioStream(writer, name) {
  const stream = new Writable({
    write(buf, enc, cb) {
      if (!writer) {
        this.destroy(
          new Error(`Deno.${name} is not available in this environment`),
        );
        return;
      }
      writer.writeSync(buf instanceof Uint8Array ? buf : Buffer.from(buf, enc));
      cb();
    },
    destroy(err, cb) {
      cb(err);
      this._undestroy();
      if (!this._writableState.emitClose) {
        nextTick(() => this.emit("close"));
      }
    },
  });
  stream.fd = writer?.rid ?? -1;
  stream.destroySoon = stream.destroy;
  stream._isStdio = true;
  stream.once("close", () => writer?.close());
  Object.defineProperties(stream, {
    columns: {
      enumerable: true,
      configurable: true,
      get: () =>
        Deno.isatty?.(writer?.rid) ? Deno.consoleSize?.().columns : undefined,
    },
    rows: {
      enumerable: true,
      configurable: true,
      get: () =>
        Deno.isatty?.(writer?.rid) ? Deno.consoleSize?.().rows : undefined,
    },
    isTTY: {
      enumerable: true,
      configurable: true,
      get: () => Deno.isatty?.(writer?.rid),
    },
    getWindowSize: {
      enumerable: true,
      configurable: true,
      value: () =>
        Deno.isatty?.(writer?.rid)
          ? Object.values(Deno.consoleSize?.())
          : undefined,
    },
  });

  if (Deno.isatty?.(writer?.rid)) {
    // These belong on tty.WriteStream(), but the TTY streams currently have
    // following problems:
    // 1. Using them here introduces a circular dependency.
    // 2. Creating a net.Socket() from a fd is not currently supported.
    stream.cursorTo = function (x, y, callback) {
      return cursorTo(this, x, y, callback);
    };

    stream.moveCursor = function (dx, dy, callback) {
      return moveCursor(this, dx, dy, callback);
    };

    stream.clearLine = function (dir, callback) {
      return clearLine(this, dir, callback);
    };

    stream.clearScreenDown = function (callback) {
      return clearScreenDown(this, callback);
    };
  }

  return stream;
}

/** https://nodejs.org/api/process.html#process_process_stderr */
export const stderr = stdio.stderr = createWritableStdioStream(
  Deno.stderr,
  "stderr",
);

/** https://nodejs.org/api/process.html#process_process_stdout */
export const stdout = stdio.stdout = createWritableStdioStream(
  Deno.stdout,
  "stdout",
);

// TODO(PolarETech): This function should be replaced by
// `guessHandleType()` in "../internal_binding/util.ts".
// https://github.com/nodejs/node/blob/v18.12.1/src/node_util.cc#L257
function _guessStdinType(fd) {
  // TODO(PolarETech): Need "TCP" handling?
  // https://github.com/nodejs/node/blob/v18.12.1/lib/internal/bootstrap/switches/is_main_thread.js#L207

  if (Deno.isatty?.(fd)) return "TTY";

  // Avoid error that occurs when stdin is null on Windows.
  try {
    const fileInfo = Deno.fstatSync?.(fd);
    // From the actual behavior of Node.js,
    // when stdin is "ignore" (null), it is treated the same as "FILE".

    if (Deno.build.os !== "windows") {
      if (fileInfo.isFile) return "FILE";
      // TODO(PolarETech): Need a better way to identify `/dev/null`.
      if (fileInfo.mode === 0o20666) return "FILE"; // when stdin is "ignore" (null) on Linux/Mac
      return "PIPE";
    }

    if (fileInfo.isFile) {
      // TODO(PolarETech): Need a better way to identify a piped stdin on Windows.
      // On Windows, `Deno.fstatSync(rid).isFile` returns true even for a piped stdin.
      // Therefore, a piped stdin cannot be distinguished from a file by this property.
      // The mtime, atime, and birthtime of the file are "2339-01-01T00:00:00.000Z",
      // so this is used as a workaround.
      if (fileInfo.birthtime.valueOf() === 11644473600000) return "PIPE";
      return "FILE";
    }
  } catch (_) {
    return "FILE"; // when stdin is "ignore" (null) on Windows
  }

  return "UNKNOWN";
}

const _read = function (size) {
  const p = Buffer.alloc(size || 16 * 1024);
  Deno.stdin?.read(p).then((length) => {
    this.push(length === null ? null : p.slice(0, length));
  }, (error) => {
    this.destroy(error);
  });
};

/** https://nodejs.org/api/process.html#process_process_stdin */
// https://github.com/nodejs/node/blob/v18.12.1/lib/internal/bootstrap/switches/is_main_thread.js#L189
export const stdin = stdio.stdin = (() => {
  const fd = Deno.stdin?.rid;
  let _stdin;
  const stdinType = _guessStdinType(fd);

  switch (stdinType) {
    case "FILE": {
      // Since `fs.ReadStream` cannot be imported before process initialization,
      // use `Readable` instead.
      // https://github.com/nodejs/node/blob/v18.12.1/lib/internal/bootstrap/switches/is_main_thread.js#L200
      // https://github.com/nodejs/node/blob/v18.12.1/lib/internal/fs/streams.js#L148
      _stdin = new Readable({
        highWaterMark: 64 * 1024,
        autoDestroy: false,
        read: _read,
      });
      break;
    }
    case "TTY":
    case "PIPE":
    case "TCP": {
      // TODO(PolarETech):
      // For TTY, `new Duplex()` should be replaced `new tty.ReadStream()` if possible.
      // There are two problems that need to be resolved.
      // 1. Using them here introduces a circular dependency.
      // 2. Creating a tty.ReadStream() is not currently supported.
      // https://github.com/nodejs/node/blob/v18.12.1/lib/internal/bootstrap/switches/is_main_thread.js#L194
      // https://github.com/nodejs/node/blob/v18.12.1/lib/tty.js#L47

      // For PIPE and TCP, `new Duplex()` should be replaced `new net.Socket()` if possible.
      // There are two problems that need to be resolved.
      // 1. Using them here introduces a circular dependency.
      // 2. Creating a net.Socket() from a fd is not currently supported.
      // https://github.com/nodejs/node/blob/v18.12.1/lib/internal/bootstrap/switches/is_main_thread.js#L206
      // https://github.com/nodejs/node/blob/v18.12.1/lib/net.js#L329
      _stdin = new Duplex({
        readable: stdinType === "TTY" ? undefined : true,
        writable: stdinType === "TTY" ? undefined : false,
        readableHighWaterMark: stdinType === "TTY" ? 0 : undefined,
        allowHalfOpen: false,
        emitClose: false,
        autoDestroy: true,
        decodeStrings: false,
        read: _read,
      });

      if (stdinType !== "TTY") {
        // Make sure the stdin can't be `.end()`-ed
        _stdin._writableState.ended = true;
      }
      break;
    }
    default: {
      // Provide a dummy contentless input for e.g. non-console
      // Windows applications.
      _stdin = new Readable({ read() {} });
      _stdin.push(null);
    }
  }

  return _stdin;
})();
stdin.on("close", () => Deno.stdin?.close());
stdin.fd = Deno.stdin?.rid ?? -1;
Object.defineProperty(stdin, "isTTY", {
  enumerable: true,
  configurable: true,
  get() {
    return Deno.isatty?.(Deno.stdin.rid);
  },
});
stdin._isRawMode = false;
stdin.setRawMode = (enable) => {
  Deno.stdin?.setRaw?.(enable);
  stdin._isRawMode = enable;
  return stdin;
};
Object.defineProperty(stdin, "isRaw", {
  enumerable: true,
  configurable: true,
  get() {
    return stdin._isRawMode;
  },
});
