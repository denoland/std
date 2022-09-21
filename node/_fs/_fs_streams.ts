// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { ERR_INVALID_ARG_TYPE, ERR_OUT_OF_RANGE } from "../internal/errors.ts";
import { deprecate, kEmptyObject } from "../internal/util.mjs";
import { validateFunction, validateInteger } from "../internal/validators.mjs";
import { errorOrDestroy } from "../internal/streams/destroy.mjs";
import { open as fsOpen, type openFlags } from "./_fs_open.ts";
import { read as fsRead } from "./_fs_read.ts";
import { close as fsClose } from "./_fs_close.ts";
import { Buffer } from "../buffer.ts";
import {
  copyObject,
  getOptions,
  getValidatedFd,
  validatePath,
} from "../internal/fs/utils.mjs";
import { finished, Readable } from "../stream.ts";
import { ReadableOptions } from "../_stream.d.ts";
import { toPathIfFileURL } from "../internal/url.ts";
import { BufferEncoding } from "../_global.d.ts";
const kIoDone = Symbol("kIoDone");
const kIsPerformingIO = Symbol("kIsPerformingIO");

const kFs = Symbol("kFs");

interface FS {
  open?: typeof fsOpen;
  read: typeof fsRead;
  close?: typeof fsClose;
}

interface ReadStreamOptions {
  flags?: openFlags;
  encoding?: BufferEncoding | null;
  fd?: number | null;
  mode?: number;
  autoClose?: boolean;
  emitClose?: boolean;
  start?: number;
  end?: number;
  highWaterMark?: number;
  fs?: FS;
}

export interface ReadStream extends Readable {
  fd: number | null;
  [kFs]: FS;
  path?: string | Buffer;
  flags: openFlags;
  mode: number;
  start?: number;
  end: number;
  pos?: number;
  bytesRead: number;
  [kIsPerformingIO]: boolean;
}

function _construct(this: ReadStream, callback: (err?: Error) => void) {
  const stream = this as ReadStream & { open: () => void };
  if (typeof stream.fd === "number") {
    callback();
    return;
  }

  if (stream.open !== openReadFs) {
    // Backwards compat for monkey patching open().
    const orgEmit = stream.emit;
    stream.emit = function (this: ReadStream, ...args) {
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
      stream.path as string,
      stream.flags,
      stream.mode,
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

function close(stream: ReadStream, err: Error, cb: (err?: Error) => void) {
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
  stream: ReadStream,
  options: ReadStreamOptions & ReadableOptions,
) {
  if (typeof options.fd === "number") {
    // When fd is a raw descriptor, we must keep our fingers crossed
    // that the descriptor won't get closed, or worse, replaced with
    // another one
    // https://github.com/nodejs/node/issues/35862
    stream[kFs] = options.fs || { read: fsRead, close: fsClose };
    return options.fd;
  }

  throw new ERR_INVALID_ARG_TYPE("options.fd", ["number"], options.fd);
}

export function ReadStream(
  this: ReadStream | unknown,
  path: string | Buffer | URL,
  options?: ReadStreamOptions & ReadableOptions,
): ReadStream {
  if (!(this instanceof ReadStream)) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    return new ReadStream(path, options);
  }

  const self = this as ReadStream;

  // A little bit bigger buffer and water marks by default
  options = copyObject(getOptions(options, kEmptyObject));
  if (options.highWaterMark === undefined) {
    options.highWaterMark = 64 * 1024;
  }

  if (options.autoDestroy === undefined) {
    options.autoDestroy = false;
  }

  if (options.fd == null) {
    self.fd = null;
    self[kFs] = options.fs || { open: fsOpen, read: fsRead, close: fsClose };
    validateFunction(self[kFs].open, "options.fs.open");

    // Path will be ignored when fd is specified, so it can be falsy
    self.path = (() => {
      if (path instanceof Buffer) {
        return path.toString();
      } else {
        return toPathIfFileURL(path);
      }
    })();
    self.flags = options.flags === undefined ? "r" : options.flags;
    self.mode = options.mode === undefined ? 0o666 : options.mode;

    validatePath(self.path);
  } else {
    self.fd = getValidatedFd(importFd(self, options));
  }

  options.autoDestroy = options.autoClose === undefined
    ? true
    : options.autoClose;

  validateFunction(self[kFs].read, "options.fs.read");

  if (options.autoDestroy) {
    validateFunction(self[kFs].close, "options.fs.close");
  }

  self.start = options.start;
  self.end = options.end ?? Infinity;
  self.pos = undefined;
  self.bytesRead = 0;
  self[kIsPerformingIO] = false;

  if (self.start !== undefined) {
    validateInteger(self.start, "start", 0);

    self.pos = self.start;
  }

  if (self.end !== Infinity) {
    validateInteger(self.end, "end", 0);

    if (self.start !== undefined && self.start > self.end) {
      throw new ERR_OUT_OF_RANGE(
        "start",
        `<= "end" (here: ${self.end})`,
        self.start,
      );
    }
  }

  Reflect.apply(Readable, self, [options]);

  return self;
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

const openReadFs = deprecate(
  function () {
    // Noop.
  },
  "ReadStream.prototype.open() is deprecated",
  "DEP0135",
);
ReadStream.prototype.open = openReadFs;

ReadStream.prototype._construct = _construct;

ReadStream.prototype._read = async function (this: ReadStream, n: number) {
  n = this.pos !== undefined
    ? Math.min(this.end - this.pos + 1, n)
    : Math.min(this.end - this.bytesRead + 1, n);

  if (n <= 0) {
    this.push(null);
    return;
  }

  const buf = Buffer.allocUnsafeSlow(n);

  let error: Error | null = null;
  let bytesRead: number | null = null;
  let buffer: Buffer | undefined = undefined;

  this[kIsPerformingIO] = true;

  await new Promise((resolve) => {
    this[kFs]
      .read(
        this.fd!,
        buf,
        0,
        n,
        this.pos ?? null,
        (_er, _bytesRead, _buf) => {
          error = _er;
          bytesRead = _bytesRead;
          buffer = _buf;
          return resolve(true);
        },
      );
  });

  this[kIsPerformingIO] = false;

  // Tell ._destroy() that it's safe to close the fd now.
  if (this.destroyed) {
    this.emit(kIoDone, error);
    return;
  }

  if (error) {
    errorOrDestroy(this, error);
  } else if (
    typeof bytesRead === "number" &&
    bytesRead > 0
  ) {
    if (this.pos !== undefined) {
      this.pos += bytesRead;
    }

    this.bytesRead += bytesRead;

    if (bytesRead !== buffer!.length) {
      // Slow path. Shrink to fit.
      // Copy instead of slice so that we don't retain
      // large backing buffer for small reads.
      const dst = Buffer.allocUnsafeSlow(bytesRead);
      buffer!.copy(dst, 0, 0, bytesRead);
      buffer = dst;
    }

    this.push(buffer);
  } else {
    this.push(null);
  }
};

ReadStream.prototype._destroy = function (
  this: ReadStream,
  err: Error,
  cb: (err?: Error) => void,
) {
  // Usually for async IO it is safe to close a file descriptor
  // even when there are pending operations. However, due to platform
  // differences file IO is implemented using synchronous operations
  // running in a thread pool. Therefore, file descriptors are not safe
  // to close while used in a pending read or write operation. Wait for
  // any pending IO (kIsPerformingIO) to complete (kIoDone).
  if (this[kIsPerformingIO]) {
    this.once(kIoDone, (er?: Error) => close(this, err || er, cb));
  } else {
    close(this, err, cb);
  }
};

ReadStream.prototype.close = function (
  this: ReadStream,
  cb: (err?: Error | null) => void,
) {
  if (typeof cb === "function") finished(this, cb);
  this.destroy();
};

Object.defineProperty(ReadStream.prototype, "pending", {
  get() {
    return this.fd === null;
  },
  configurable: true,
});

export function createReadStream(
  path: string | Buffer | URL,
  options?: ReadStreamOptions,
): ReadStream {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return new ReadStream(path, options);
}
