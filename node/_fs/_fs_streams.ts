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

export interface ReadStream extends NodeReadable {
  path: string;
}

export function ReadStream(
  this: ReadStream | unknown,
  path: string | URL,
  options?: ReadStreamOptions & ReadableOptions,
): ReadStream {
  const hasBadOptions = options && (
    options.fd || options.start || options.end || options.fs
  );
  if (hasBadOptions) {
    notImplemented(
      `fs.ReadStream.prototype.constructor with unsupported options (${
        JSON.stringify(options)
      })`,
    );
  }

  if (!(this instanceof ReadStream)) {
    // deno-lint-ignore ban-ts-comment
    // @ts-ignore
    return new ReadStream(path, options);
  }

  const self = this as ReadStream;
  const _path = path instanceof URL ? fromFileUrl(path) : path;
  const file = Deno.openSync(_path, { read: true });
  const buffer = new Uint8Array(16 * 1024);

  NodeReadable.call(self, {
    highWaterMark: options?.highWaterMark,
    encoding: options?.encoding,
    objectMode: options?.objectMode ?? false,
    emitClose: options?.emitClose ?? true,
    autoDestroy: options?.autoClose ?? options?.autoDestroy ?? true,
    signal: options?.signal,
    async read(_size) {
      try {
        const n = await file.read(buffer);
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

  self.path = _path;

  return self;
}

Object.setPrototypeOf(ReadStream.prototype, NodeReadable.prototype);

export function createReadStream(
  path: string | URL,
  options?: ReadStreamOptions,
): ReadStream {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return new ReadStream(path, options);
}
