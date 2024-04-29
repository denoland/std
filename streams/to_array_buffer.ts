// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { concat } from "@std/bytes/concat";

/**
 * Converts a {@linkcode ReadableStream} of {@linkcode Uint8Array}s to an
 * {@linkcode ArrayBuffer}. Works the same as{@linkcode Response.arrayBuffer}.
 *
 * @example
 * ```ts
 * import { toArrayBuffer } from "@std/streams/to-array-buffer";
 *
 * const stream = ReadableStream.from([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4]),
 * ]);
 * await toArrayBuffer(stream); // ArrayBuffer { [Uint8Contents]: <01 02 03 04>, byteLength: 4 }
 * ```
 */
export async function toArrayBuffer(
  readableStream: ReadableStream<Uint8Array>,
): Promise<ArrayBuffer> {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
  }

  return concat(chunks).buffer;
}
