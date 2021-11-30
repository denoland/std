// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import {
  stderr as _stderr,
  stdout as _stdout,
} from "../internal/streams/readable.js";
import { Buffer } from "../buffer.ts";
import { Readable, Writable } from "../stream.ts";

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

/** https://nodejs.org/api/process.html#process_process_stderr */
export const stderr = _stderr as unknown as _Writable;

/** https://nodejs.org/api/process.html#process_process_stdin */
export const stdin = new Readable({
  highWaterMark: 0,
  emitClose: false,
  read(this: Readable, size: number) {
    const p = Buffer.alloc(size || 16 * 1024);
    Deno.stdin.read(p).then((length) => {
      this.push(length === null ? null : p.slice(0, length));
    }, (error) => {
      this.destroy(error);
    });
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
export const stdout = _stdout as unknown as _Writable;
