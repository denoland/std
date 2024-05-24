// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { readerFromStreamReader as _readerFromStreamReader } from "@std/io/reader-from-stream-reader";
import type { Reader } from "@std/io/types";

/**
 * Create a {@linkcode https://jsr.io/@std/io/doc/types/~/Reader | Reader} from a {@linkcode ReadableStreamDefaultReader}.
 *
 * @param streamReader A `ReadableStreamDefaultReader` to convert into a `Reader`.
 * @returns A `Reader` that reads from the `streamReader`.
 *
 * @example Copy the response body of a fetch request to `/dev/null`
 * ```ts
 * import { copy } from "@std/io/copy";
 * import { readerFromStreamReader } from "@std/streams/reader-from-stream-reader";
 *
 * const res = await fetch("https://deno.land");
 * using blackhole = await Deno.open("/dev/null", { write: true });
 *
 * const reader = readerFromStreamReader(res.body!.getReader());
 * await copy(reader, blackhole);
 * ```
 *
 * @deprecated This will be removed in 1.0.0. Import from
 * {@link https://jsr.io/@std/io | @std/io} instead.
 */
export function readerFromStreamReader(
  streamReader: ReadableStreamDefaultReader<Uint8Array>,
): Reader {
  return _readerFromStreamReader(streamReader);
}
