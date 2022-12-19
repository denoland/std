// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { assert } from "../_util/asserts.ts";

const DEFAULT_BUFFER_SIZE = 32 * 1024;

/**
 * Copy N size at the most. If read size is lesser than N, then returns nread
 * @param r Reader
 * @param dest Writer
 * @param size Read size
 */
export async function copyN(
  r: Deno.Reader,
  dest: Deno.Writer,
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
      assert(n === nread, "could not write");
    }
    if (result === null) {
      break;
    }
  }
  return bytesRead;
}
