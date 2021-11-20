// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { Readable, Writable } from "../stream.ts";
import { Buffer } from "../buffer.ts";
import { nextTick } from "../_next_tick.ts";

interface _Readable extends Readable {
  get isTTY(): true | undefined;
  destroySoon: Readable["destroy"];
  fd: number;
  _isStdio: undefined;
  _isRawMode: boolean;
  get isRaw(): boolean;
  setRawMode(enable: boolean): this;
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
        nextTick(() => this.emit("close"));
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
stdin._isRawMode = false;
stdin.setRawMode = (enable) => {
  Deno.setRaw(Deno.stdin.rid, enable);
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

/** https://nodejs.org/api/process.html#process_process_stdout */
export const stdout = createWritableStdioStream(Deno.stdout);
