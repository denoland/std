// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "../_utils.ts";
import { fromFileUrl } from "../path.ts";
import { Buffer } from "../buffer.ts";
import { Readable as NodeReadable } from "../stream.ts";
import type { ReadableOptions } from "../_stream.d.ts";

interface ReadStreamOptions {
  flags?: string;
  encoding?: string | null;
  fd?: number | null;
  mode?: number;
  autoClose?: boolean;
  emitClose?: boolean;
  start?: number;
  end?: number;
  highWaterMark?: number;
  fs?: Record<string, unknown> | null;
}

interface ReadStream extends NodeReadable {
  path: string;
}

export function ReadStream(
  this: ReadStream | void,
  path: string | URL,
  opts?: ReadStreamOptions & ReadableOptions,
): ReadStream {
  const hasBadOptions = opts && (
    opts.fd || opts.start || opts.end || opts.fs
  );
  if (hasBadOptions) {
    notImplemented(
      `fs.ReadStream.prototype.constructor with unsupported options (${
        JSON.stringify(opts)
      })`,
    );
  }

  if (!(this instanceof ReadStream)) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    return new ReadStream(path, opts);
  }

  const _path = path instanceof URL ? fromFileUrl(path) : path;
  const file = Deno.openSync(_path, { read: true });
  const buffer = new Uint8Array(16 * 1024);

  NodeReadable.call(this as ReadStream, {
    highWaterMark: opts?.highWaterMark,
    encoding: opts?.encoding,
    objectMode: opts?.objectMode ?? false,
    emitClose: opts?.emitClose ?? true,
    autoDestroy: opts?.autoClose ?? opts?.autoDestroy ?? true,
    signal: opts?.signal,
    read(_size) {
      try {
        const n = file.readSync(buffer);
        this.push(n ? Buffer.from(buffer.slice(0, n)) : null);
      } catch (err) {
        this.destroy(err as Error);
      }
    },
    destroy(err, cb) {
      try {
        file.close();
        // deno-lint-ignore no-empty
      } catch {}
      cb(err);
    },
  });

  (this as ReadStream).path = _path;

  return this as ReadStream;
}

Object.setPrototypeOf(ReadStream.prototype, NodeReadable.prototype);

export function createReadStream(
  path: string | URL,
  opts?: ReadStreamOptions,
): ReadStream {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return new ReadStream(path, opts);
}
