// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "../_utils.ts";
import { fileURLToPath } from "../url.ts";
import { Readable } from "../stream.ts";

const kFs = Symbol("kFs");
const kHandle = Symbol("kHandle");

function _construct(callback) {
  const stream = this;
  if (typeof stream.fd === "number") {
    callback();
    return;
  }

  if (false) {
    // TODO:
    // if (stream.open !== openWriteFs && stream.open !== openReadFs) {
    // Backwards compat for monkey patching open().
    const orgEmit = stream.emit;
    stream.emit = function (...args) {
      if (args[0] === "open") {
        this.emit = orgEmit;
        callback();
        ReflectApply(orgEmit, this, args);
      } else if (args[0] === "error") {
        this.emit = orgEmit;
        callback(args[1]);
      } else {
        ReflectApply(orgEmit, this, args);
      }
    };
    stream.open();
  } else {
    stream[kFs].open(stream.path, stream.flags, stream.mode, (er, fd) => {
      if (er) {
        callback(er);
      } else {
        stream.fd = fd;
        callback();
        stream.emit("open", stream.fd);
        stream.emit("ready");
      }
    });
  }
}

interface ReadStreamOptions {
  start: number;
  end?: number;
  fd?: number; // | FileHandle
}

class ReadStream {
  constructor(path: string | URL, options: ReadStreamOptions) {
    options = Object.assign(options, {});

    if (options.fd == null) {
      this.fd = null;
      // this[kFs] = options.fs || fs;
      console.log(path);
      this.path = fileURLToPath(path);
    } else {
      notImplemented();
    }

    this.start = options.start;
    this.end = options.end;
    this.pos = undefined;
    this.bytesRead = 0;
    this.closed = false;

    if (this.start !== undefined) {
      // validateInteger(this.start, 'start', 0);

      this.pos = this.start;
    }

    if (this.end === undefined) {
      this.end = Infinity;
    } else {
      // TODO
    }
  }
}

Object.setPrototypeOf(ReadStream.prototype, Readable.prototype);
Object.setPrototypeOf(ReadStream, Readable);

Object.defineProperty(ReadStream.prototype, "autoClose", {
  get() {
    return this._readableState.autoDestroy;
  },
  set(val) {
    this._readableState.autoDestroy = val;
  },
});

ReadStream.prototype._construct = _construct;

export function createReadStream(
  path: string | URL,
  options: ReadStreamOptions,
): ReadStream {
  return new ReadStream(path, options);
}
