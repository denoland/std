// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "../_utils.ts";
import { fromFileUrl } from "../path.ts";
import { Buffer } from "../buffer.ts";
import { Readable as NodeReadable } from "../stream.ts";

type ReadStreamOptions = Record<string, unknown>;

export function ReadStream(
  this: { path: string } & NodeReadable,
  path: string | URL,
  opts?: ReadStreamOptions,
) {
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

  NodeReadable.call(this, {
    autoDestroy: true,
    emitClose: true,
    objectMode: false,
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

  this.path = _path;
}

Object.setPrototypeOf(ReadStream.prototype, NodeReadable.prototype);

export function createReadStream(
  path: string | URL,
  opts?: ReadStreamOptions,
): typeof ReadStream {
  // deno-lint-ignore ban-ts-comment
  // @ts-ignore
  return new ReadStream(path, opts);
}
