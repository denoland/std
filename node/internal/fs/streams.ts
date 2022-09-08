// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { Writable } from "../../stream.ts";
import { toPathIfFileURL } from "../url.ts";
import { open, type openFlags } from "../../_fs/_fs_open.ts";
import { write } from "../../_fs/_fs_write.mjs";
import { close } from "../../_fs/_fs_close.ts";
import { Buffer } from "../../buffer.ts";
import { notImplemented } from "../../_utils.ts";
import type { WritableOptions } from "../../_stream.d.ts";

const kFs = Symbol("kFs");
const kIsPerformingIO = Symbol("kIsPerformingIO");
const kIoDone = Symbol("kIoDone");

interface WriteStreamOptions {
  flags?: openFlags;
  encoding?: string;
  fd?: number | null;
  mode?: number;
  autoClose?: boolean;
  emitClose?: boolean;
  start?: number;
  fs?: FS;
}

interface FS {
  open: typeof open;
  write: typeof write;
  close: typeof close;
}

interface WriteStream extends Writable {
  fd: number | null;
  path: string | Buffer;
  flags: openFlags;
  mode: number;
  bytesWritten: number;
  pos: number;
  [kFs]: FS;
  [kIsPerformingIO]: boolean;
}

export function WriteStream(
  this: WriteStream | unknown,
  path: string | Buffer,
  options?: WriteStreamOptions & WritableOptions,
): WriteStream {
  const hasBadOptions = options && (
    options.fd || options.start
  );
  if (hasBadOptions) {
    notImplemented(
      `fs.WriteStream.prototype.constructor with unsupported options (${
        JSON.stringify(options)
      })`,
    );
  }

  if (!(this instanceof WriteStream)) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    return new WriteStream(path, options);
  }

  Writable.call(this as WriteStream, {
    highWaterMark: options?.highWaterMark,
    decodeStrings: options?.decodeStrings,
    defaultEncoding: options?.defaultEncoding,
    objectMode: options?.objectMode,
    emitClose: options?.emitClose,
    autoDestroy: options?.autoClose ?? options?.autoDestroy,
    signal: options?.signal,
  });

  (this as WriteStream).fd = null;
  (this as WriteStream).path = toPathIfFileURL(path);
  (this as WriteStream).flags = options?.flags ?? "w";
  (this as WriteStream).mode = options?.mode ?? 0o666;
  (this as WriteStream).bytesWritten = 0;
  (this as WriteStream).pos = 0;
  (this as WriteStream)[kFs] = options?.fs ?? { open, write, close };
  (this as WriteStream)[kIsPerformingIO] = false;

  if (options?.encoding) {
    (this as WriteStream).setDefaultEncoding(options?.encoding);
  }

  return this as WriteStream;
}

Object.setPrototypeOf(WriteStream.prototype, Writable.prototype);

WriteStream.prototype._construct = function (callback: (err?: Error) => void) {
  this[kFs].open(
    this.path.toString(),
    this.flags!,
    this.mode!,
    (err: Error | null, fd: number) => {
      if (err) {
        callback(err);
        return;
      }

      this.fd = fd;
      callback();
      this.emit("open", this.fd);
      this.emit("ready");
    },
  );
};

WriteStream.prototype._write = function (
  data: Buffer,
  _encoding: string,
  cb: (err?: Error | null) => void,
) {
  this[kIsPerformingIO] = true;
  this[kFs].write(
    this.fd!,
    data,
    0,
    data.length,
    this.pos,
    (er: Error | null, bytes: number) => {
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
    },
  );

  if (this.pos !== undefined) {
    this.pos += data.length;
  }
};

WriteStream.prototype._destroy = function (
  err: Error,
  cb: (err?: Error | null) => void,
) {
  if (this[kIsPerformingIO]) {
    this.once(kIoDone, (er: Error) => closeStream(this, err || er, cb));
  } else {
    closeStream(this, err, cb);
  }
};

function closeStream(
  // deno-lint-ignore no-explicit-any
  stream: any,
  err: Error,
  cb: (err?: Error | null) => void,
) {
  if (!stream.fd) {
    cb(err);
  } else {
    stream[kFs].close(stream.fd, (er?: Error | null) => {
      cb(er || err);
    });
    stream.fd = null;
  }
}

export function createWriteStream(
  path: string | Buffer,
  options?: WriteStreamOptions,
): WriteStream {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return new WriteStream(path, options);
}
