// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import * as DenoUnstable from "../../_deno_unstable.ts";
import { Buffer } from "../buffer.ts";
import { Readable, Writable } from "../stream.ts";
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
        Deno.isatty?.(writer?.rid)
          ? Deno.consoleSize?.(writer?.rid).columns
          : undefined,
    },
    rows: {
      enumerable: true,
      configurable: true,
      get: () =>
        Deno.isatty?.(writer?.rid)
          ? Deno.consoleSize?.(writer?.rid).rows
          : undefined,
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
          ? Object.values(Deno.consoleSize?.(writer?.rid))
          : undefined,
    },
  });
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

/** https://nodejs.org/api/process.html#process_process_stdin */
export const stdin = stdio.stdin = new Readable({
  highWaterMark: 0,
  emitClose: false,
  read(size) {
    const p = Buffer.alloc(size || 16 * 1024);

    if (!Deno.stdin) {
      this.destroy(
        new Error("Deno.stdin is not available in this environment"),
      );
      return;
    }

    Deno.stdin.read(p).then((length) => {
      this.push(length === null ? null : p.slice(0, length));
    }, (error) => {
      this.destroy(error);
    });
  },
});
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
  DenoUnstable.setRaw?.(Deno.stdin?.rid, enable);
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
