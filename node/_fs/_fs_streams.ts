// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "../_utils.ts";
import { fromFileUrl } from "../path.ts";
import { Buffer } from "../buffer.ts";
import { Readable as NodeReadable } from "../stream.ts";

type ReadStreamOptions = Record<string, unknown>;

class ReadStream extends NodeReadable {
  public path: string;

  constructor(path: string | URL, opts?: ReadStreamOptions) {
    path = path instanceof URL ? fromFileUrl(path) : path;
    const hasBadOptions = opts && (
      opts.fd || opts.start || opts.end || opts.fs
    );
    if (hasBadOptions) {
      notImplemented();
    }
    const file = Deno.openSync(path, { read: true });
    const buffer = new Uint8Array(16 * 1024);
    super({
      autoDestroy: true,
      emitClose: true,
      objectMode: false,
      read: async function (_size) {
        try {
          const n = await file.read(buffer);
          this.push(n ? Buffer.from(buffer.slice(0, n)) : null);
        } catch (err) {
          this.destroy(err as Error);
        }
      },
      destroy: (err, cb) => {
        try {
          file.close();
          // deno-lint-ignore no-empty
        } catch {}
        cb(err);
      },
    });
    this.path = path;
  }
}

export function createReadStream(
  path: string | URL,
  options?: ReadStreamOptions,
): ReadStream {
  return new ReadStream(path, options);
}
