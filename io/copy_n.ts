// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { Reader, Writer } from "./types.ts";

const DEFAULT_BUFFER_SIZE = 32 * 1024;

/**
 * Copy N size at the most. If read size is lesser than N, then returns nread
 *
 * @example Usage
 * ```ts
 * import { copyN } from "@std/io/copy-n";
 * import { assertEquals } from "@std/assert/equals";
 *
 * using source = await Deno.open("README.md");
 *
 * const res = await copyN(source, Deno.stdout, 10);
 * assertEquals(res, 10);
 * ```
 *
 * @param r Reader
 * @param dest Writer
 * @param size Read size
 * @returns Number of bytes copied
 *
 * @deprecated Pipe the readable stream through a new
 * {@linkcode https://jsr.io/@std/streams/doc/~/ByteSliceStream | ByteSliceStream}
 * instead. This will be removed in 0.225.0.
 */
export async function copyN(
  r: Reader,
  dest: Writer,
  size: number,
): Promise<number> {
  let bytesRead = 0;
  let buf = new Uint8Array(DEFAULT_BUFFER_SIZE);
  while (bytesRead < size) {
    if (size - bytesRead < DEFAULT_BUFFER_SIZE) {
      buf = new Uint8Array(size - bytesRead);
    }
    const result = await r.read(buf);
    const nread = result ?? 0;
    bytesRead += nread;
    if (nread > 0) {
      let n = 0;
      while (n < nread) {
        n += await dest.write(buf.slice(n, nread));
      }
      if (n !== nread) {
        throw new Error("Could not write");
      }
    }
    if (result === null) {
      break;
    }
  }
  return bytesRead;
}
