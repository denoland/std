// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { DEFAULT_BUFFER_SIZE } from "./_constants.ts";
import type { Reader, ReaderSync } from "./types.ts";

export type { Reader, ReaderSync };

/**
 * Turns a {@linkcode Reader} into an async iterator.
 *
 * @example
 * ```ts
 * import { toReaderIterator } from "https://deno.land/std@$STD_VERSION/io/to_reader_iterator.ts";
 *
 * using file = await Deno.open("/etc/passwd");
 * for await (const chunk of toReaderIterator(file)) {
 *   console.log(chunk);
 * }
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * @example
 * ```ts
 * import { toReaderIterator } from "https://deno.land/std@$STD_VERSION/io/to_reader_iterator.ts";
 *
 * using file = await Deno.open("/etc/passwd");
 * const iter = toReaderIterator(file, {
 *   bufSize: 1024 * 1024
 * });
 * for await (const chunk of iter) {
 *   console.log(chunk);
 * }
 * ```
 */
export async function* toReaderIterator(
  reader: Reader,
  options?: {
    bufSize?: number;
  },
): AsyncIterableIterator<Uint8Array> {
  const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
  const b = new Uint8Array(bufSize);
  while (true) {
    const result = await reader.read(b);
    if (result === null) {
      break;
    }

    yield b.slice(0, result);
  }
}

/**
 * Turns a {@linkcode ReaderSync} into an iterator.
 *
 * ```ts
 * import { toReaderIteratorSync } from "https://deno.land/std@$STD_VERSION/io/to_reader_iterator.ts";
 *
 * using file = Deno.openSync("/etc/passwd");
 * for (const chunk of toReaderIteratorSync(file)) {
 *   console.log(chunk);
 * }
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * ```ts
 * import { toReaderIteratorSync } from "https://deno.land/std@$STD_VERSION/io/to_reader_iterator.ts";

 * using file = await Deno.open("/etc/passwd");
 * const iter = toReaderIteratorSync(file, {
 *   bufSize: 1024 * 1024
 * });
 * for (const chunk of iter) {
 *   console.log(chunk);
 * }
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 */
export function* toReaderIteratorSync(
  reader: ReaderSync,
  options?: {
    bufSize?: number;
  },
): IterableIterator<Uint8Array> {
  const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
  const b = new Uint8Array(bufSize);
  while (true) {
    const result = reader.readSync(b);
    if (result === null) {
      break;
    }

    yield b.slice(0, result);
  }
}
