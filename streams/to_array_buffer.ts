// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Converts a {@linkcode ReadableStream} of {@linkcode Uint8Array}s to an
 * {@linkcode ArrayBuffer}. Works the same as {@linkcode Response.arrayBuffer}.
 *
 * @example
 * ```ts
 * import { toArrayBuffer } from "https://deno.land/std@$STD_VERSION/streams/to_array_buffer.ts";
 *
 * const stream = ReadableStream.from([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4]),
 * ]);
 * await toArrayBuffer(stream); // ArrayBuffer { [Uint8Contents]: <01 02 03 04>, byteLength: 4 }
 * ```
 */
export async function toArrayBuffer(
  stream: ReadableStream<Uint8Array>,
): Promise<ArrayBuffer> {
  return await new Response(stream).arrayBuffer();
}
