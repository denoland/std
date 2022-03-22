// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.

import { Writable } from "../../stream.ts";
import { toPathIfFileURL } from "../url.ts";
import { open, type openFlags } from "../../_fs/_fs_open.ts";
import { write } from "../../_fs/_fs_write.mjs";
import { close } from "../../_fs/_fs_close.ts";
import { Buffer } from "../../buffer.ts";

const kFs = Symbol("kFs");
const kIsPerformingIO = Symbol("kIsPerformingIO");
const kIoDone = Symbol("kIoDone");

interface WriteStreamOptions {
  flags?: openFlags;
  mode?: number;
  fs?: FS;
  encoding?: string;
  highWaterMark?: number;
}

interface FS {
  open: typeof open;
  write: typeof write;
  close: typeof close;
}

export class WriteStreamClass extends Writable {
  fd: number | null = null;
  path: string | Buffer;
  flags?: openFlags;
  mode?: number;
  bytesWritten = 0;
  pos = 0;
  [kFs] = { open, write };
  [kIsPerformingIO] = false;
  constructor(path: string | Buffer, opts: WriteStreamOptions = {}) {
    super(opts);
    this.path = toPathIfFileURL(path);
    this.flags = opts.flags || "w";
    this.mode = opts.mode || 0o666;
    this[kFs] = opts.fs ?? { open, write, close };

    if (opts.encoding) {
      this.setDefaultEncoding(opts.encoding);
    }
  }

  override _construct(callback: (err?: Error) => void) {
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
  }

  override _write(
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
  }

  override _destroy(err: Error, cb: (err?: Error | null) => void) {
    if (this[kIsPerformingIO]) {
      this.once(kIoDone, (er) => closeStream(this, err || er, cb));
    } else {
      closeStream(this, err, cb);
    }
  }
}

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

export function WriteStream(
  path: string | Buffer,
  opts: WriteStreamOptions,
): WriteStreamClass {
  return new WriteStreamClass(path, opts);
}

WriteStream.prototype = WriteStreamClass.prototype;

export function createWriteStream(
  path: string | Buffer,
  opts: WriteStreamOptions,
): WriteStreamClass {
  return new WriteStreamClass(path, opts);
}
