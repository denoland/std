// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { ERR_INVALID_ARG_TYPE } from "../errors.ts";
import { deprecate, kEmptyObject } from "../util.mjs";
import { validateFunction, validateInteger } from "../validators.mjs";
import { open as fsOpen, type openFlags } from "../../_fs/_fs_open.ts";
// @deno-types="../../_fs/_fs_write.d.ts""
import { write as fsWrite } from "../../_fs/_fs_write.mjs";
// @deno-types="../../_fs/_fs_writev.d.ts""
import { writev as fsWritev } from "../../_fs/_fs_writev.mjs";
import { close as fsClose } from "../../_fs/_fs_close.ts";
import { Buffer } from "../../buffer.ts";
import {
  copyObject,
  getOptions,
  getValidatedFd,
  validatePath,
} from "./utils.mjs";
import { Writable } from "../../stream.ts";
import { WritableOptions } from "../../_stream.d.ts";
import { toPathIfFileURL } from "../url.ts";
import { BufferEncoding } from "../../_global.d.ts";
import { nextTick } from "../../_next_tick.ts";
const kIoDone = Symbol("kIoDone");
const kIsPerformingIO = Symbol("kIsPerformingIO");

const kFs = Symbol("kFs");

interface FS {
  open?: typeof fsOpen;
  write?: typeof fsWrite;
  writev?: typeof fsWritev;
  close?: typeof fsClose;
}
interface WriteStreamOptions {
  flags?: openFlags;
  encoding?: BufferEncoding;
  fd?: number;
  mode?: number;
  autoClose?: boolean;
  emitClose?: boolean;
  start?: number;
  fs?: FS | null;
}

export interface WriteStream extends Writable {
  fd: number | null;
  [kFs]: FS;
  path?: string | Buffer;
  flags?: openFlags;
  mode?: number;
  start?: number;
  pos?: number;
  bytesWritten: number;
  [kIsPerformingIO]: boolean;
  autoClose: boolean;
}

function _construct(this: WriteStream, callback: (err?: Error | null) => void) {
  const stream = this as WriteStream & { open: () => void };
  if (typeof stream.fd === "number") {
    callback();
    return;
  }

  if (stream.open !== openWriteFs) {
    // Backwards compat for monkey patching open().
    const orgEmit = stream.emit;
    stream.emit = function (this: WriteStream, ...args) {
      if (args[0] === "open") {
        this.emit = orgEmit;
        callback();
        Reflect.apply(orgEmit, this, args);
      } else if (args[0] === "error") {
        this.emit = orgEmit;
        callback(args[1]);
      } else {
        Reflect.apply(orgEmit, this, args);
      }
    } as typeof orgEmit;
    stream.open();
  } else {
    stream[kFs].open!(
      stream.path!.toString(),
      stream.flags!,
      stream.mode!,
      (er, fd) => {
        if (er) {
          callback(er);
        } else {
          stream.fd = fd;
          callback();
          stream.emit("open", stream.fd);
          stream.emit("ready");
        }
      },
    );
  }
}

function close(
  stream: WriteStream,
  err: Error | null,
  cb: (err?: Error | null) => void,
) {
  if (!stream.fd) {
    cb(err);
  } else {
    stream[kFs].close!(stream.fd, (er) => {
      cb(er || err);
    });
    stream.fd = null;
  }
}

function importFd(
  stream: WriteStream,
  options: WriteStreamOptions & WritableOptions,
) {
  if (typeof options.fd === "number") {
    // When fd is a raw descriptor, we must keep our fingers crossed
    // that the descriptor won't get closed, or worse, replaced with
    // another one
    // https://github.com/nodejs/node/issues/35862
    stream[kFs] = options.fs ||
      { write: fsWrite, writev: fsWritev, close: fsClose };
    return options.fd;
  }

  throw new ERR_INVALID_ARG_TYPE("options.fd", ["number"], options.fd);
}

export function WriteStream(
  this: WriteStream | unknown,
  path: string | Buffer | URL,
  options?: BufferEncoding | (WriteStreamOptions & WritableOptions),
): WriteStream {
  if (!(this instanceof WriteStream)) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    return new WriteStream(path, options);
  }

  const self = this as WriteStream;

  options = copyObject(getOptions(options, kEmptyObject));

  // Only buffers are supported.
  options.decodeStrings = true;

  if (options.fd == null) {
    self.fd = null;
    self[kFs] = options.fs ||
      { open: fsOpen, write: fsWrite, writev: fsWritev, close: fsClose };
    validateFunction(self[kFs].open, "options.fs.open");

    // Path will be ignored when fd is specified, so it can be falsy
    self.path = toPathIfFileURL(path);
    self.flags = options.flags === undefined ? "w" : options.flags;
    self.mode = options.mode === undefined ? 0o666 : options.mode;

    validatePath(self.path);
  } else {
    self.fd = getValidatedFd(importFd(self, options));
  }

  options.autoDestroy = options.autoClose === undefined
    ? true
    : options.autoClose;

  if (!self[kFs].write && !self[kFs].writev) {
    throw new ERR_INVALID_ARG_TYPE(
      "options.fs.write",
      "function",
      self[kFs].write,
    );
  }

  if (self[kFs].write) {
    validateFunction(self[kFs].write, "options.fs.write");
  }

  if (self[kFs].writev) {
    validateFunction(self[kFs].writev, "options.fs.writev");
  }

  if (options.autoDestroy) {
    validateFunction(self[kFs].close, "options.fs.close");
  }

  // It's enough to override either, in which case only one will be used.
  if (!self[kFs].write) {
    // TODO(PolarETech): Reduce @ts-ignore as much as possible.
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    self._write = null;
  }
  if (!self[kFs].writev) {
    // TODO(PolarETech): Reduce @ts-ignore as much as possible.
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    self._writev = null;
  }

  self.start = options.start;
  self.pos = undefined;
  self.bytesWritten = 0;
  self[kIsPerformingIO] = false;

  if (self.start !== undefined) {
    validateInteger(self.start, "start", 0);

    self.pos = self.start;
  }

  Reflect.apply(Writable, this, [options]);

  if (options.encoding) {
    self.setDefaultEncoding(options.encoding);
  }

  return self;
}

Object.setPrototypeOf(WriteStream.prototype, Writable.prototype);
Object.setPrototypeOf(WriteStream, Writable);

Object.defineProperty(WriteStream.prototype, "autoClose", {
  get() {
    return this._writableState.autoDestroy;
  },
  set(val) {
    this._writableState.autoDestroy = val;
  },
});

const openWriteFs = deprecate(
  function () {
    // Noop.
  },
  "WriteStream.prototype.open() is deprecated",
  "DEP0135",
);
WriteStream.prototype.open = openWriteFs;

WriteStream.prototype._construct = _construct;

WriteStream.prototype._write = function (
  this: WriteStream,
  data: Buffer,
  _encoding: BufferEncoding,
  cb: (err?: Error | null) => void,
) {
  this[kIsPerformingIO] = true;
  this[kFs].write!(this.fd!, data, 0, data.length, this.pos, (er, bytes) => {
    this[kIsPerformingIO] = false;
    if (this.destroyed) {
      // Tell ._destroy() that it's safe to close the fd now.
      cb(er);
      return this.emit(kIoDone, er);
    }

    if (er) {
      return cb(er);
    }

    this.bytesWritten += bytes;
    cb();
  });

  if (this.pos !== undefined) {
    this.pos += data.length;
  }
};

WriteStream.prototype._writev = function (
  this: WriteStream,
  data: Array<{
    chunk: Buffer;
    encoding: BufferEncoding;
  }>,
  cb: (err?: Error | null) => void,
) {
  const len = data.length;
  const chunks = new Array(len);
  let size = 0;

  for (let i = 0; i < len; i++) {
    const chunk = data[i].chunk;

    chunks[i] = chunk;
    size += chunk.length;
  }

  this[kIsPerformingIO] = true;
  this[kFs].writev!(this.fd!, chunks, this.pos ?? null, (er, bytes) => {
    this[kIsPerformingIO] = false;
    if (this.destroyed) {
      // Tell ._destroy() that it's safe to close the fd now.
      cb(er);
      return this.emit(kIoDone, er);
    }

    if (er) {
      return cb(er);
    }

    this.bytesWritten += bytes;
    cb();
  });

  if (this.pos !== undefined) {
    this.pos += size;
  }
};

WriteStream.prototype._destroy = function (
  this: WriteStream,
  err: Error | null,
  cb: (err?: Error | null) => void,
) {
  // Usually for async IO it is safe to close a file descriptor
  // even when there are pending operations. However, due to platform
  // differences file IO is implemented using synchronous operations
  // running in a thread pool. Therefore, file descriptors are not safe
  // to close while used in a pending read or write operation. Wait for
  // any pending IO (kIsPerformingIO) to complete (kIoDone).
  if (this[kIsPerformingIO]) {
    this.once(kIoDone, (er) => close(this, err || er, cb));
  } else {
    close(this, err, cb);
  }
};

WriteStream.prototype.close = function (
  this: WriteStream,
  cb: (err?: Error | null) => void,
) {
  if (cb) {
    if (this.closed) {
      nextTick(cb);
      return;
    }
    this.on("close", cb);
  }

  // If we are not autoClosing, we should call
  // destroy on 'finish'.
  if (!this.autoClose) {
    this.on("finish", this.destroy);
  }

  // We use end() instead of destroy() because of
  // https://github.com/nodejs/node/issues/2006
  this.end();
};

// There is no shutdown() for files.
WriteStream.prototype.destroySoon = WriteStream.prototype.end;

Object.defineProperty(WriteStream.prototype, "pending", {
  get() {
    return this.fd === null;
  },
  configurable: true,
});

export function createWriteStream(
  path: string | Buffer | URL,
  options?: BufferEncoding | WriteStreamOptions,
): WriteStream {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return new WriteStream(path, options);
}
